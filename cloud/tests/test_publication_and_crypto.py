"""Publication integrity, Ed25519 verification, idempotency, restore, and withdrawal (CL-PUB-01..05)."""

from __future__ import annotations

import base64
import json

import pytest

from fieldscan_cloud.db import connect_sqlite, get_current_publication, upsert_product_and_variant
from fieldscan_cloud.models import ManifestCapabilities, ManifestSource
from fieldscan_cloud.publication.publisher import (
    ArtifactInput,
    publish_variant_atomically,
    restore_previous_publication,
    withdraw_procedures_publication,
)
from fieldscan_cloud.publication.signing import (
    ManifestVerificationError,
    load_private_key,
    verify_signed_envelope,
)
from fieldscan_cloud.publication.storage import find_orphan_objects, store_bytes_atomically


def test_publication_crypto_idempotency_restore_and_withdraw(worker_config, env_paths):
    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        from fieldscan_cloud.db import ensure_default_tenant_and_credential

        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot")
        upsert_product_and_variant(
            conn,
            product_id="tzone_tht02",
            manufacturer="TZONE",
            model="TZ THT-02",
            display_name="TZ THT-02",
            variant_id="demo_variant",
            variant_code="DEMO",
            hardware_revision="V1.1",
            variant_display_name="Demo",
            discriminant_hint="Demo",
        )

        pk = load_private_key(worker_config.signer_key_path)
        obj1 = store_bytes_atomically(
            conn, data_dir=worker_config.data_dir, content=b"%PDF-1.4\ndemo-v1\n", media_type="application/pdf"
        )
        art1 = [ArtifactInput(role="manual_pdf", path="docs/manual.pdf", sha256=obj1.sha256, byte_count=obj1.byte_count)]
        src1 = [ManifestSource(source_id="src1", origin="test_fixture", revision_label="rev-1")]
        caps_ready = ManifestCapabilities(documentation=True, interactive_twin=True, procedures=True)

        # Initial publish -> seq 1
        p1 = publish_variant_atomically(
            conn,
            tenant_id="pilot",
            issuer="fieldscan-pilot",
            channel="pilot",
            product_id="tzone_tht02",
            variant_id="demo_variant",
            sources=src1,
            artifacts=art1,
            capabilities=caps_ready,
            reason_codes=[],
            private_key=pk,
            key_id="pilot-1",
        )
        assert p1.publication_seq == 1
        assert p1.reused_existing is False

        # CL-PUB-03: Identical inputs do NOT increment publication_seq
        p1_dup = publish_variant_atomically(
            conn,
            tenant_id="pilot",
            issuer="fieldscan-pilot",
            channel="pilot",
            product_id="tzone_tht02",
            variant_id="demo_variant",
            sources=src1,
            artifacts=art1,
            capabilities=caps_ready,
            reason_codes=[],
            private_key=pk,
            key_id="pilot-1",
        )
        assert p1_dup.reused_existing is True
        assert p1_dup.publication_seq == 1

        # CL-PUB-01: Tampering payload or signature fails verification
        pub_row = get_current_publication(
            conn, tenant_id="pilot", channel="pilot", product_id="tzone_tht02", variant_id="demo_variant"
        )
        env = json.loads(bytes(pub_row["envelope_bytes"]).decode("utf-8"))
        # Tamper payload byte
        raw_payload = bytearray(base64.b64decode(env["payload_b64"]))
        raw_payload[0] ^= 0x01
        tampered_payload_env = json.dumps({**env, "payload_b64": base64.b64encode(bytes(raw_payload)).decode()}).encode()
        with pytest.raises(ManifestVerificationError):
            verify_signed_envelope(tampered_payload_env, public_key_b64=str(env_paths["pub_b64"]), expected_key_id="pilot-1")

        # Tamper signature byte
        raw_sig = bytearray(base64.b64decode(env["signature_b64"]))
        raw_sig[0] ^= 0xFF
        tampered_sig_env = json.dumps({**env, "signature_b64": base64.b64encode(bytes(raw_sig)).decode()}).encode()
        with pytest.raises(ManifestVerificationError):
            verify_signed_envelope(tampered_sig_env, public_key_b64=str(env_paths["pub_b64"]), expected_key_id="pilot-1")

        # CL-PUB-02: Orphan object written before failed/aborted publish leaves seq=1 intact & reportable
        orphan = store_bytes_atomically(
            conn, data_dir=worker_config.data_dir, content=b"unreferenced-bytes", media_type="application/octet-stream"
        )
        report = find_orphan_objects(conn, data_dir=worker_config.data_dir)
        assert orphan.sha256 in report["unreferenced_db_objects"]
        assert get_current_publication(
            conn, tenant_id="pilot", channel="pilot", product_id="tzone_tht02", variant_id="demo_variant"
        )["publication_seq"] == 1

        # CL-PUB-05: Withdraw procedure emits seq=2 with procedures=False & signed withdrawn_procedures
        p2 = withdraw_procedures_publication(
            conn,
            tenant_id="pilot",
            issuer="fieldscan-pilot",
            channel="pilot",
            product_id="tzone_tht02",
            variant_id="demo_variant",
            withdrawn_procedures=["dip_switch_reconfig"],
            reason_code="PROCEDURE_WITHDRAWN",
            private_key=pk,
            key_id="pilot-1",
        )
        assert p2.publication_seq == 2
        assert p2.capabilities.procedures is False
        pub2 = get_current_publication(
            conn, tenant_id="pilot", channel="pilot", product_id="tzone_tht02", variant_id="demo_variant"
        )
        payload2 = verify_signed_envelope(
            bytes(pub2["envelope_bytes"]), public_key_b64=str(env_paths["pub_b64"]), expected_key_id="pilot-1"
        )
        assert "dip_switch_reconfig" in payload2["withdrawn_procedures"]

        # CL-PUB-04: Restore seq=1 emits seq=3 with restored_from_seq=1
        p3 = restore_previous_publication(
            conn,
            tenant_id="pilot",
            issuer="fieldscan-pilot",
            channel="pilot",
            product_id="tzone_tht02",
            variant_id="demo_variant",
            target_seq=1,
            private_key=pk,
            key_id="pilot-1",
        )
        assert p3.publication_seq == 3
        assert p3.capabilities.procedures is True
        pub3 = get_current_publication(
            conn, tenant_id="pilot", channel="pilot", product_id="tzone_tht02", variant_id="demo_variant"
        )
        payload3 = verify_signed_envelope(
            bytes(pub3["envelope_bytes"]), public_key_b64=str(env_paths["pub_b64"]), expected_key_id="pilot-1"
        )
        assert payload3["restored_from_seq"] == 1
    finally:
        conn.close()
