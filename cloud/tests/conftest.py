"""Shared pytest fixtures for FieldScan Cloud test suite."""

from __future__ import annotations

import hashlib
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
import pytest

from fieldscan_cloud.config import ApiConfig, WorkerConfig
from fieldscan_cloud.db import apply_migrations, connect_sqlite, ensure_default_tenant_and_credential
from fieldscan_cloud.publication.signing import public_key_raw_b64


@pytest.fixture()
def env_paths(tmp_path: Path) -> dict[str, Path]:
    data_dir = tmp_path / "var_fieldscan"
    for sub in ("objects", "staging", "reports"):
        (data_dir / sub).mkdir(parents=True, exist_ok=True)
    db_path = data_dir / "catalog.sqlite3"
    apply_migrations(db_path, journal_mode="DELETE")

    # Generate ephemeral Ed25519 signing key for tests
    pk = Ed25519PrivateKey.generate()
    pem_bytes = pk.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    key_path = tmp_path / "signer-ed25519.pem"
    key_path.write_bytes(pem_bytes)
    pub_b64 = public_key_raw_b64(pk.public_key())

    # Locate real gltf_validator if installed on host/VM; otherwise create a tiny stub validator for Mac unit runs
    system_validator = Path("/opt/fieldscan/bin/gltf_validator")
    if system_validator.is_file():
        validator_path = system_validator
    else:
        validator_path = tmp_path / "mock_gltf_validator.py"
        validator_path.write_text(
            "#!/usr/bin/env python3\n"
            "import json, sys\n"
            "print(json.dumps({'issues': {'numErrors': 0, 'numWarnings': 0, 'messages': []}}))\n",
            encoding="utf-8",
        )
        validator_path.chmod(0o755)

    return {
        "data_dir": data_dir,
        "db_path": db_path,
        "key_path": key_path,
        "validator_path": validator_path,
        "pub_b64_file": tmp_path / "pub.b64",
        "pub_b64": pub_b64,  # type: ignore[dict-item]
    }


@pytest.fixture()
def api_token() -> str:
    return "test_fieldscan_high_entropy_token_0123456789abcdef0123456789abcdef"


@pytest.fixture()
def api_config(env_paths: dict[str, Path], api_token: str) -> ApiConfig:
    digest = hashlib.sha256(api_token.encode("utf-8")).hexdigest()
    conn = connect_sqlite(env_paths["db_path"], expected_journal_mode="DELETE")
    try:
        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot", token_sha256=digest)
    finally:
        conn.close()
    return ApiConfig(
        env="test",
        channel="pilot",
        db_path=env_paths["db_path"],
        data_dir=env_paths["data_dir"],
        sqlite_journal_mode="DELETE",
        log_level="INFO",
        default_tenant_id="pilot",
        api_token_sha256=digest,
        max_body_bytes=16384,
        max_active_jobs_per_tenant=5,
        enable_range_requests=True,
    )


@pytest.fixture()
def worker_config(env_paths: dict[str, Path]) -> WorkerConfig:
    return WorkerConfig(
        env="test",
        channel="pilot",
        db_path=env_paths["db_path"],
        data_dir=env_paths["data_dir"],
        sqlite_journal_mode="DELETE",
        log_level="INFO",
        default_tenant_id="pilot",
        signing_key_id="pilot-1",
        issuer="fieldscan-pilot",
        signer_key_path=env_paths["key_path"],
        gltf_validator_path=env_paths["validator_path"],
        context_enabled=False,
        context_search_url="https://api.context.dev/v1/web/search",
        context_api_key=None,
        context_max_results=10,
        max_job_attempts=3,
        job_lease_sec=60,
        poll_interval_sec=0.1,
    )
