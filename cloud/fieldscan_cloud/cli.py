"""Operator CLI for FieldScan Cloud: migrate, seed-fixture, verify-release, reconcile, restore, withdraw."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile

from fieldscan_cloud.config import load_worker_config
from fieldscan_cloud.db import (
    apply_migrations,
    connect_sqlite,
    ensure_default_tenant_and_credential,
    ensure_seed_sources,
    get_current_publication,
    verify_schema,
)
from fieldscan_cloud.publication.publisher import (
    restore_previous_publication,
    withdraw_procedures_publication,
)
from fieldscan_cloud.publication.signing import load_private_key, verify_signed_envelope
from fieldscan_cloud.publication.storage import find_orphan_objects, resolve_object_path
from fieldscan_cloud.sources.registry import SEED_TZONE_THT02_SOURCES
from fieldscan_cloud.worker import FIXTURES_DIR, _build_fixture_artifacts


def _cmd_migrate(args: argparse.Namespace) -> int:
    db_path = Path(args.db)
    version = apply_migrations(db_path, journal_mode=args.journal_mode)
    print(json.dumps({"status": "ok", "db": str(db_path), "schema_version": version, "journal_mode": args.journal_mode}))
    return 0


def _cmd_seed_fixture(args: argparse.Namespace) -> int:
    cfg = load_worker_config()
    conn = connect_sqlite(cfg.db_path, expected_journal_mode=cfg.sqlite_journal_mode)
    try:
        verify_schema(conn, expected_journal_mode=cfg.sqlite_journal_mode)
        ensure_default_tenant_and_credential(conn, tenant_id=cfg.default_tenant_id, channel=cfg.channel)
        ensure_seed_sources(conn, SEED_TZONE_THT02_SOURCES)

        names = ["tht02_v1_1", "tht02_partial"] if args.fixture == "all" else [args.fixture]
        results = []
        for name in names:
            fdir = FIXTURES_DIR / name
            if not fdir.is_dir():
                raise SystemExit(f"Fixture not found: {fdir}")
            stage = Path(tempfile.mkdtemp(prefix=f"seed_{name}_", dir=str(cfg.data_dir / "staging")))
            try:
                pub, payload = _build_fixture_artifacts(
                    conn,
                    config=cfg,
                    fixture_dir=fdir,
                    staging_dir=stage,
                    tenant_id=cfg.default_tenant_id,
                    actor="cli",
                    run_ocr=not args.no_ocr,
                )
                results.append(
                    {
                        "fixture": name,
                        "publication_id": pub.publication_id,
                        "publication_seq": pub.publication_seq,
                        "availability": pub.availability,
                        "reused_existing": pub.reused_existing,
                        "manifest_sha256": pub.manifest_sha256,
                        "identity": payload["identity"],
                        "capabilities": payload["capabilities"],
                        "reason_codes": pub.reason_codes,
                    }
                )
            finally:
                shutil.rmtree(stage, ignore_errors=True)
        print(json.dumps({"status": "ok", "seeded": results}, indent=2))
        return 0
    finally:
        conn.close()


def _cmd_verify_release(args: argparse.Namespace) -> int:
    db_path = Path(args.db)
    data_dir = Path(args.data_dir)
    conn = connect_sqlite(db_path, expected_journal_mode=args.journal_mode)
    try:
        schema_ver, mode = verify_schema(conn, expected_journal_mode=args.journal_mode)
        pub = get_current_publication(
            conn,
            tenant_id=args.tenant_id,
            channel=args.channel,
            product_id=args.product_id,
            variant_id=args.variant_id,
        )
        if pub is None:
            raise SystemExit("No current publication found for specified product/variant")

        payload = verify_signed_envelope(
            bytes(pub["envelope_bytes"]),
            public_key_b64=args.public_key_b64,
            expected_key_id=args.key_id,
        )
        # Verify every artifact blob on disk matches declared SHA-256 and byte_count
        checked = 0
        for art in payload["artifacts"]:
            row = conn.execute(
                "SELECT storage_relpath, byte_count FROM objects WHERE sha256 = ?;",
                (art["sha256"],),
            ).fetchone()
            if row is None:
                raise SystemExit(f"Missing object row for {art['sha256']}")
            path = resolve_object_path(data_dir, str(row["storage_relpath"]))
            raw = path.read_bytes()
            if hashlib.sha256(raw).hexdigest() != art["sha256"] or len(raw) != art["byte_count"]:
                raise SystemExit(f"Hash/size verification failed for artifact {art['path']}")
            checked += 1

        print(
            json.dumps(
                {
                    "status": "ok",
                    "schema_version": schema_ver,
                    "journal_mode": mode,
                    "product_id": payload["product_id"],
                    "variant_id": payload["variant_id"],
                    "publication_seq": payload["publication_seq"],
                    "capabilities": payload["capabilities"],
                    "verified_artifacts": checked,
                },
                indent=2,
            )
        )
        return 0
    finally:
        conn.close()


def _cmd_reconcile_orphans(args: argparse.Namespace) -> int:
    db_path = Path(args.db)
    data_dir = Path(args.data_dir)
    conn = connect_sqlite(db_path, expected_journal_mode=args.journal_mode)
    try:
        report = find_orphan_objects(conn, data_dir=data_dir)
        print(json.dumps(report, indent=2))
        return 0
    finally:
        conn.close()


def _cmd_restore(args: argparse.Namespace) -> int:
    cfg = load_worker_config()
    conn = connect_sqlite(cfg.db_path, expected_journal_mode=cfg.sqlite_journal_mode)
    try:
        pk = load_private_key(cfg.signer_key_path)
        res = restore_previous_publication(
            conn,
            tenant_id=cfg.default_tenant_id,
            issuer=cfg.issuer,
            channel=cfg.channel,
            product_id=args.product_id,
            variant_id=args.variant_id,
            target_seq=args.target_seq,
            private_key=pk,
            key_id=cfg.signing_key_id,
            reason=args.reason,
        )
        print(
            json.dumps(
                {
                    "status": "ok",
                    "publication_id": res.publication_id,
                    "publication_seq": res.publication_seq,
                    "restored_from_seq": args.target_seq,
                },
                indent=2,
            )
        )
        return 0
    finally:
        conn.close()


def _cmd_withdraw(args: argparse.Namespace) -> int:
    cfg = load_worker_config()
    conn = connect_sqlite(cfg.db_path, expected_journal_mode=cfg.sqlite_journal_mode)
    try:
        pk = load_private_key(cfg.signer_key_path)
        res = withdraw_procedures_publication(
            conn,
            tenant_id=cfg.default_tenant_id,
            issuer=cfg.issuer,
            channel=cfg.channel,
            product_id=args.product_id,
            variant_id=args.variant_id,
            withdrawn_procedures=args.procedure,
            reason_code=args.reason_code,
            private_key=pk,
            key_id=cfg.signing_key_id,
        )
        print(
            json.dumps(
                {
                    "status": "ok",
                    "publication_id": res.publication_id,
                    "publication_seq": res.publication_seq,
                    "reason_codes": res.reason_codes,
                },
                indent=2,
            )
        )
        return 0
    finally:
        conn.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="fieldscan_cloud.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    p_mig = sub.add_parser("migrate", help="Create/migrate SQLite catalog database")
    p_mig.add_argument("--db", required=True, help="Path to catalog.sqlite3")
    p_mig.add_argument("--journal-mode", default="DELETE", help="SQLite journal mode (default DELETE)")
    p_mig.set_defaults(func=_cmd_migrate)

    p_seed = sub.add_parser("seed-fixture", help="Build, validate, sign, and publish reference fixture(s)")
    p_seed.add_argument("--fixture", default="tht02_v1_1", choices=["tht02_v1_1", "tht02_partial", "all"])
    p_seed.add_argument("--no-ocr", action="store_true", help="Skip Tesseract OCR pass")
    p_seed.set_defaults(func=_cmd_seed_fixture)

    p_ver = sub.add_parser("verify-release", help="Verify signed manifest and all artifact SHA-256 blobs on disk")
    p_ver.add_argument("--db", required=True)
    p_ver.add_argument("--data-dir", required=True)
    p_ver.add_argument("--journal-mode", default="DELETE")
    p_ver.add_argument("--tenant-id", default="pilot")
    p_ver.add_argument("--channel", default="pilot")
    p_ver.add_argument("--product-id", default="tzone_tht02")
    p_ver.add_argument("--variant-id", default="v1_1_rs485")
    p_ver.add_argument("--public-key-b64", required=True)
    p_ver.add_argument("--key-id", default="pilot-1")
    p_ver.set_defaults(func=_cmd_verify_release)

    p_rec = sub.add_parser("reconcile-orphans", help="Report unreferenced or missing objects")
    p_rec.add_argument("--db", required=True)
    p_rec.add_argument("--data-dir", required=True)
    p_rec.add_argument("--journal-mode", default="DELETE")
    p_rec.set_defaults(func=_cmd_reconcile_orphans)

    p_res = sub.add_parser("restore-publication", help="Restore a previous publication under a higher seq")
    p_res.add_argument("--product-id", required=True)
    p_res.add_argument("--variant-id", required=True)
    p_res.add_argument("--target-seq", required=True, type=int)
    p_res.add_argument("--reason", default="operator_restore")
    p_res.set_defaults(func=_cmd_restore)

    p_wd = sub.add_parser("withdraw-procedure", help="Sign a withdrawal disabling procedures")
    p_wd.add_argument("--product-id", required=True)
    p_wd.add_argument("--variant-id", required=True)
    p_wd.add_argument("--procedure", action="append", required=True)
    p_wd.add_argument("--reason-code", default="PROCEDURE_WITHDRAWN")
    p_wd.set_defaults(func=_cmd_withdraw)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
