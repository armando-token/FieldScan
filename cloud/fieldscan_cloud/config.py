"""Strict configuration loading and startup validation (Megaplan §5.3)."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
import re

_HEX64_RE = re.compile(r"^[0-9a-f]{64}$")
_VALID_JOURNAL_MODES = {"DELETE", "WAL", "TRUNCATE", "PERSIST"}
_VALID_ENVS = {"pilot", "staging", "production", "test", "dev"}
_PLACEHOLDER_PREFIX = "REEMPLAZAR_"


class ConfigError(ValueError):
    """Raised when required configuration is missing, unsafe, or placeholder."""


def _require_non_placeholder(name: str, value: str | None) -> str:
    if value is None or not value.strip():
        raise ConfigError(f"Missing required environment variable: {name}")
    cleaned = value.strip()
    if cleaned.upper().startswith(_PLACEHOLDER_PREFIX) or _PLACEHOLDER_PREFIX in cleaned.upper():
        raise ConfigError(f"Environment variable {name} still contains a placeholder value")
    return cleaned


def _validate_path_under_dir(path: Path, parent: Path, label: str) -> None:
    resolved_path = path.resolve()
    resolved_parent = parent.resolve()
    try:
        resolved_path.relative_to(resolved_parent)
    except ValueError as exc:
        raise ConfigError(
            f"{label} ({resolved_path}) must reside inside FS_DATA_DIR ({resolved_parent})"
        ) from exc


def _parse_bool(raw: str | None, default: bool) -> bool:
    if raw is None or not raw.strip():
        return default
    lowered = raw.strip().lower()
    if lowered in {"1", "true", "yes", "on"}:
        return True
    if lowered in {"0", "false", "no", "off"}:
        return False
    raise ConfigError(f"Invalid boolean value: {raw!r}")


def _parse_int(name: str, raw: str | None, default: int, *, min_value: int = 1) -> int:
    if raw is None or not raw.strip():
        return default
    try:
        val = int(raw.strip())
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer") from exc
    if val < min_value:
        raise ConfigError(f"{name} must be >= {min_value}")
    return val


@dataclass(frozen=True)
class BaseConfig:
    env: str
    channel: str
    db_path: Path
    data_dir: Path
    sqlite_journal_mode: str
    log_level: str
    default_tenant_id: str


@dataclass(frozen=True)
class ApiConfig(BaseConfig):
    api_token_sha256: str
    max_body_bytes: int
    max_active_jobs_per_tenant: int
    enable_range_requests: bool
    allow_device_auto_enroll: bool = False
    max_enrolled_devices: int = 50
    signing_key_id: str = "pilot-1"


@dataclass(frozen=True)
class WorkerConfig(BaseConfig):
    signing_key_id: str
    issuer: str
    signer_key_path: Path
    gltf_validator_path: Path
    context_enabled: bool
    context_search_url: str
    context_api_key: str | None
    context_max_results: int
    max_job_attempts: int
    job_lease_sec: int
    poll_interval_sec: float


def _load_base(environ: dict[str, str]) -> BaseConfig:
    env = _require_non_placeholder("FS_ENV", environ.get("FS_ENV", "pilot")).lower()
    if env not in _VALID_ENVS:
        raise ConfigError(f"Unsupported FS_ENV={env!r}")

    channel = _require_non_placeholder("FS_CHANNEL", environ.get("FS_CHANNEL", "pilot"))
    data_dir = Path(_require_non_placeholder("FS_DATA_DIR", environ.get("FS_DATA_DIR", "/var/lib/fieldscan")))
    db_path = Path(
        _require_non_placeholder(
            "FS_DB_PATH",
            environ.get("FS_DB_PATH", str(data_dir / "catalog.sqlite3")),
        )
    )
    _validate_path_under_dir(db_path, data_dir, "FS_DB_PATH")

    journal_mode = _require_non_placeholder(
        "FS_SQLITE_JOURNAL_MODE",
        environ.get("FS_SQLITE_JOURNAL_MODE", "DELETE"),
    ).upper()
    if journal_mode not in _VALID_JOURNAL_MODES:
        raise ConfigError(f"Unsupported FS_SQLITE_JOURNAL_MODE={journal_mode!r}")

    log_level = environ.get("FS_LOG_LEVEL", "INFO").strip().upper() or "INFO"
    default_tenant_id = environ.get("FS_TENANT_ID", "pilot").strip() or "pilot"

    return BaseConfig(
        env=env,
        channel=channel,
        db_path=db_path,
        data_dir=data_dir,
        sqlite_journal_mode=journal_mode,
        log_level=log_level,
        default_tenant_id=default_tenant_id,
    )


def load_api_config(environ: dict[str, str] | None = None) -> ApiConfig:
    env_map = dict(os.environ if environ is None else environ)
    base = _load_base(env_map)

    token_sha = _require_non_placeholder("FS_API_TOKEN_SHA256", env_map.get("FS_API_TOKEN_SHA256")).lower()
    if not _HEX64_RE.match(token_sha):
        raise ConfigError("FS_API_TOKEN_SHA256 must be a 64-character lowercase hex SHA-256 digest")

    return ApiConfig(
        env=base.env,
        channel=base.channel,
        db_path=base.db_path,
        data_dir=base.data_dir,
        sqlite_journal_mode=base.sqlite_journal_mode,
        log_level=base.log_level,
        default_tenant_id=base.default_tenant_id,
        api_token_sha256=token_sha,
        max_body_bytes=_parse_int("FS_MAX_BODY_BYTES", env_map.get("FS_MAX_BODY_BYTES"), 16384, min_value=512),
        max_active_jobs_per_tenant=_parse_int(
            "FS_MAX_ACTIVE_JOBS", env_map.get("FS_MAX_ACTIVE_JOBS"), 8, min_value=1
        ),
        enable_range_requests=_parse_bool(env_map.get("FS_ENABLE_RANGE_REQUESTS"), True),
        allow_device_auto_enroll=_parse_bool(env_map.get("FS_ALLOW_DEVICE_AUTO_ENROLL"), False),
        max_enrolled_devices=_parse_int(
            "FS_MAX_ENROLLED_DEVICES", env_map.get("FS_MAX_ENROLLED_DEVICES"), 50, min_value=1
        ),
        signing_key_id=env_map.get("FS_SIGNING_KEY_ID", "pilot-1").strip() or "pilot-1",
    )


def resolve_signer_key_path(environ: dict[str, str]) -> Path:
    """Resolve Ed25519 private key from systemd CREDENTIALS_DIRECTORY or explicit FS_SIGNER_KEY_PATH."""
    cred_dir = environ.get("CREDENTIALS_DIRECTORY", "").strip()
    if cred_dir:
        candidate = Path(cred_dir) / "signer.pem"
        if candidate.is_file():
            return candidate
        raise ConfigError(f"CREDENTIALS_DIRECTORY set ({cred_dir}) but signer.pem not found")

    explicit = environ.get("FS_SIGNER_KEY_PATH", "").strip()
    if explicit:
        candidate = Path(explicit)
        if not candidate.is_file():
            raise ConfigError(f"FS_SIGNER_KEY_PATH does not exist: {candidate}")
        return candidate

    raise ConfigError("Signing key not provided via CREDENTIALS_DIRECTORY/signer.pem or FS_SIGNER_KEY_PATH")


def load_worker_config(environ: dict[str, str] | None = None) -> WorkerConfig:
    env_map = dict(os.environ if environ is None else environ)
    base = _load_base(env_map)

    signing_key_id = _require_non_placeholder("FS_SIGNING_KEY_ID", env_map.get("FS_SIGNING_KEY_ID", "pilot-1"))
    issuer = _require_non_placeholder("FS_ISSUER", env_map.get("FS_ISSUER", "fieldscan-pilot"))
    signer_key_path = resolve_signer_key_path(env_map)

    gltf_validator_path = Path(
        _require_non_placeholder(
            "FS_GLTF_VALIDATOR",
            env_map.get("FS_GLTF_VALIDATOR", "/opt/fieldscan/bin/gltf_validator"),
        )
    )
    if not gltf_validator_path.is_file():
        raise ConfigError(f"FS_GLTF_VALIDATOR binary not found: {gltf_validator_path}")

    context_enabled = _parse_bool(env_map.get("FS_CONTEXT_ENABLED"), True)
    context_search_url = env_map.get("FS_CONTEXT_SEARCH_URL", "https://api.context.dev/v1/web/search").strip()
    if not context_search_url.startswith("https://"):
        raise ConfigError("FS_CONTEXT_SEARCH_URL must use https://")

    raw_ctx_key = env_map.get("CONTEXT_DEV_API_KEY", "").strip()
    if context_enabled:
        context_api_key: str | None = _require_non_placeholder("CONTEXT_DEV_API_KEY", raw_ctx_key)
    else:
        if raw_ctx_key and _PLACEHOLDER_PREFIX in raw_ctx_key.upper():
            raise ConfigError("CONTEXT_DEV_API_KEY must not contain placeholder text even when disabled")
        context_api_key = raw_ctx_key or None

    return WorkerConfig(
        env=base.env,
        channel=base.channel,
        db_path=base.db_path,
        data_dir=base.data_dir,
        sqlite_journal_mode=base.sqlite_journal_mode,
        log_level=base.log_level,
        default_tenant_id=base.default_tenant_id,
        signing_key_id=signing_key_id,
        issuer=issuer,
        signer_key_path=signer_key_path,
        gltf_validator_path=gltf_validator_path,
        context_enabled=context_enabled,
        context_search_url=context_search_url,
        context_api_key=context_api_key,
        context_max_results=_parse_int("FS_CONTEXT_MAX_RESULTS", env_map.get("FS_CONTEXT_MAX_RESULTS"), 10, min_value=1),
        max_job_attempts=_parse_int("FS_MAX_JOB_ATTEMPTS", env_map.get("FS_MAX_JOB_ATTEMPTS"), 3, min_value=1),
        job_lease_sec=_parse_int("FS_JOB_LEASE_SEC", env_map.get("FS_JOB_LEASE_SEC"), 180, min_value=10),
        poll_interval_sec=float(env_map.get("FS_WORKER_POLL_SEC", "0.5")),
    )
