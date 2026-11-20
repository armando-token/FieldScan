#!/usr/bin/env python3
"""Deterministic Builder for FieldScan Cloud Reference Signed Packages & API Mock Fixtures.

Generates under `knowledge/fixtures/cloud_catalog_v1/`:
1. `reference_full_m12_seq10.zip` — Full Ed25519-signed (`key_id = "demo-1"`) package with 12-page PDF,
   4-page bulletin PDF, `twin.glb`, `twin.parts.json`, `twin.actions.json`, and `procedures.json`.
2. `reference_partial_no3d_seq10.zip` — Partial Ed25519-signed package (`interactive_twin = false`).
3. `api_mock_vectors_v1.json` — Cloud API mock responses for cache hit, HTTP 202 job, complete result,
   partial result, ambiguous variant identity, HTTP 429 rate-limit, and HTTP 503 temporary failure.
"""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import tempfile
import zipfile

PROJECT_ROOT = Path(__file__).resolve().parents[1]
import sys

if str(PROJECT_ROOT / "src") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "src"))

from fieldscan.catalog_store import (
    DEMO_FIXTURE_PUBLIC_KEY_B64,
    DEMO_FIXTURE_PUBLIC_KEY_HEX,
    write_reference_signed_package_fixture,
)


def _write_deterministic_zip(src_dir: Path, out_zip: Path) -> None:
    out_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_zip, "w") as zf:
        for fpath in sorted(src_dir.rglob("*")):
            if not fpath.is_file():
                continue
            rel = fpath.relative_to(src_dir).as_posix()
            info = zipfile.ZipInfo(filename=rel, date_time=(2026, 11, 19, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            zf.writestr(info, fpath.read_bytes())


def main() -> int:
    out_dir = PROJECT_ROOT / "knowledge" / "fixtures" / "cloud_catalog_v1"
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)

        full_dir = tmp_root / "full_m12"
        full_meta = write_reference_signed_package_fixture(
            full_dir,
            variant_id="m12_4pin_rev2",
            publication_seq=10,
            include_twin=True,
            include_procedures=True,
            connector_type="m12_4pin",
        )
        full_zip = out_dir / "reference_full_m12_seq10.zip"
        _write_deterministic_zip(full_dir, full_zip)

        partial_dir = tmp_root / "partial_no3d"
        partial_meta = write_reference_signed_package_fixture(
            partial_dir,
            variant_id="wall_lcd_partial",
            publication_seq=10,
            include_twin=False,
            include_procedures=True,
            connector_type="screw_terminal_4p",
        )
        partial_zip = out_dir / "reference_partial_no3d_seq10.zip"
        _write_deterministic_zip(partial_dir, partial_zip)

    api_vectors = {
        "schema_version": 1,
        "contract_version": "2.1.0",
        "signing_key_info": {
            "key_id": "demo-1",
            "issuer": "fieldscan-demo",
            "algorithm": "Ed25519",
            "public_key_hex": DEMO_FIXTURE_PUBLIC_KEY_HEX,
            "public_key_b64": DEMO_FIXTURE_PUBLIC_KEY_B64,
            "scope": "labeled_test_fixture_only",
        },
        "reference_packages": {
            "full_m12_seq10": {
                "archive": "reference_full_m12_seq10.zip",
                "manifest_sha256": full_meta["manifest_sha256"],
                "product_id": "tzone_tht02",
                "variant_id": "m12_4pin_rev2",
                "publication_seq": 10,
            },
            "partial_no3d_seq10": {
                "archive": "reference_partial_no3d_seq10.zip",
                "manifest_sha256": partial_meta["manifest_sha256"],
                "product_id": "tzone_tht02",
                "variant_id": "wall_lcd_partial",
                "publication_seq": 10,
            },
        },
        "api_scenarios": {
            "cache_hit_200": {
                "http_status": 200,
                "body": {
                    "job_state": "ready",
                    "availability": "complete",
                    "product_id": "tzone_tht02",
                    "variant_id": "m12_4pin_rev2",
                    "title": "TZ THT-02 (m12_4pin_rev2)",
                    "publication_seq": 10,
                    "manifest_sha256": full_meta["manifest_sha256"],
                },
            },
            "job_queued_202": {
                "http_status": 202,
                "body": {
                    "job_id": "job-tht02-m12-001",
                    "job_state": "queued",
                    "availability": "pending",
                    "poll_after_s": 2,
                },
            },
            "job_ready_complete": {
                "http_status": 200,
                "body": {
                    "job_id": "job-tht02-m12-001",
                    "job_state": "ready",
                    "availability": "complete",
                    "product_id": "tzone_tht02",
                    "variant_id": "m12_4pin_rev2",
                    "publication_seq": 10,
                    "manifest_sha256": full_meta["manifest_sha256"],
                    "capabilities": {"documentation": True, "interactive_twin": True, "procedures": True},
                },
            },
            "job_ready_partial": {
                "http_status": 200,
                "body": {
                    "job_id": "job-tht02-wall-002",
                    "job_state": "ready",
                    "availability": "partial",
                    "product_id": "tzone_tht02",
                    "variant_id": "wall_lcd_partial",
                    "publication_seq": 10,
                    "manifest_sha256": partial_meta["manifest_sha256"],
                    "capabilities": {"documentation": True, "interactive_twin": False, "procedures": True},
                    "reason_codes": ["INTERNAL_GEOMETRY_UNCONFIRMED"],
                },
            },
            "ambiguous_identity": {
                "http_status": 200,
                "body": {
                    "job_state": "ready",
                    "availability": "ambiguous",
                    "discriminant_field": "connector_type",
                    "discriminant_prompt": "Confirm physical rear connector before selecting package.",
                    "candidates": [
                        {
                            "product_id": "tzone_tht02",
                            "variant_id": "m12_4pin_rev2",
                            "title": "TZ THT-02 M12 4-Pin Variant",
                            "discriminant_hint": "Rear M12 A-coded 4-pin plug",
                        },
                        {
                            "product_id": "tzone_tht02",
                            "variant_id": "pigtail_1m_rev2",
                            "title": "TZ THT-02 1m Shielded Pigtail Variant",
                            "discriminant_hint": "Integrated 1m 4-wire cable gland",
                        },
                    ],
                },
            },
            "rate_limited_429": {
                "http_status": 429,
                "headers": {"Retry-After": "7"},
                "body": {"error_code": "HTTP_RATE_LIMITED", "message": "Too many catalog synthesis requests"},
            },
            "temporary_failure_503": {
                "http_status": 503,
                "body": {"error_code": "HTTP_SERVER_ERROR", "message": "Upstream synthesis worker unavailable"},
            },
        },
    }
    (out_dir / "api_mock_vectors_v1.json").write_text(json.dumps(api_vectors, indent=2) + "\n", encoding="utf-8")
    print(f"[fixtures] Wrote {full_zip.name} (sha256={full_meta['manifest_sha256'][:12]}...)")
    print(f"[fixtures] Wrote {partial_zip.name} (sha256={partial_meta['manifest_sha256'][:12]}...)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
