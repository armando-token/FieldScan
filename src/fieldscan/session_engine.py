"""Authoritative Session, Evidence, Provenance, Voice Intent & PDF/JSON Dossier Engine.

Implements Sections 5, 6, 8, 9, 10, and 11 of the FieldScan specification:
- SQLite WAL transactional session & append-only ordered event store (`seq` monotonic per session).
- Process-boot & monotonic-clock sample freshness (`max_sample_age_s = 3.0s`), marking samples from
  prior process runs or dropped connections strictly as `historical` (`DAT-03`, `DAT-07`).
- Zero-false-claims provenance enforcement (`DAT-01..05`): never claims PLC/SCADA visibility,
  calibration, or unconfirmed physical changes (`confirmed_changes` requires explicit technician action).
- Deterministic 6-step procedure state machine (`identify -> as_found -> inspect -> verify_modbus -> review/close`)
  with `expected_seq` validation (`INVALID_TRANSITION`) and `idempotency_key` replay/conflict handling (`DAT-08`, `FLU-01..06`).
- Camera quality, camera-epoch ROI reset, 5-frame stability auto-capture window, and stream-freeze guard (`VIS-01..07`).
- Bilingual EN/ES typed voice intent parser, audio state machine, TTS echo guard, unit-clarification check,
  3s transition alert debouncer, and deterministic LLM grounding filter (`VOZ-01..10`, `IA-01..06`).
- Atomic temp-write + verification + SHA-256 multi-page PDF + JSON + ZIP dossier exporter (`EXP-01..07`).
"""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import threading
import time
from typing import Any
import unicodedata
import uuid
import zipfile

import cv2
import numpy as np
import pymupdf

from fieldscan.catalog_store import CatalogDomainError, FieldScanPackageStore
from fieldscan.profiles_and_manual import (
    PROJECT_ROOT,
    resolve_device_profile,
    sha256_file,
    verify_and_resolve_citations,
)

CONTRACT_VERSION = "2.1.0"
PROCESS_BOOT_ID = uuid.uuid4().hex[:12]

VALID_AUDIO_STATES = ("idle", "listening", "processing", "speaking", "paused", "unavailable")
TYPED_VOICE_INTENTS = (
    "read_current",
    "show_manual",
    "highlight_component",
    "repeat_step",
    "start_readonly_check",
    "request_capture",
    "record_observation",
    "request_confirmation",
    "switch_language",
)

FORBIDDEN_OVERCLAIM_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bscada\s+(?:online|verified|showed|confirmed)\b", re.IGNORECASE),
    re.compile(r"\bplc\s+(?:verified|confirmed|observed|showed)\b", re.IGNORECASE),
    re.compile(r"\bcalibrated\s+values?\b", re.IGNORECASE),
    re.compile(r"\bfield\s+repair\s+successfully\s+verified\b", re.IGNORECASE),
)

VALID_REGISTER_HEX = {f"0x{i:04x}" for i in range(8)} | {f"{i:04x}h" for i in range(8)}


class SessionDomainError(Exception):
    """Structured domain error mapped cleanly to HTTP 4xx/5xx responses."""

    def __init__(self, code: str, message: str, status_code: int = 400, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "error_code": self.code,
            "message": self.message,
            "details": self.details,
        }


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def normalize_ascii_lower(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    return re.sub(r"\s+", " ", stripped).strip()


def mask_serial_for_public(serial_or_tag: str | None) -> str | None:
    if not serial_or_tag:
        return None
    s = str(serial_or_tag).strip()
    if len(s) <= 4:
        return "****"
    return "*" * (len(s) - 4) + s[-4:]


def evaluate_frame_quality_metrics(jpeg_bytes: bytes) -> dict[str, Any]:
    """Compute focus sharpness, exposure quality, and SHA-256 digest on raw JPEG camera bytes."""
    if not jpeg_bytes:
        return {
            "valid_jpeg": False,
            "frame_sha256": "",
            "width": 0,
            "height": 0,
            "sharpness_laplacian": 0.0,
            "mean_luma": 0.0,
            "overexposed_ratio": 1.0,
            "exposure_ok": False,
            "focus_ok": False,
        }
    digest = hashlib.sha256(jpeg_bytes).hexdigest()
    arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None or bgr.size == 0:
        return {
            "valid_jpeg": False,
            "frame_sha256": digest,
            "width": 0,
            "height": 0,
            "sharpness_laplacian": 0.0,
            "mean_luma": 0.0,
            "overexposed_ratio": 1.0,
            "exposure_ok": False,
            "focus_ok": False,
        }
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    mean_luma = float(gray.mean())
    overexp = float((gray >= 248).mean())
    underexp = float((gray <= 8).mean())
    exposure_ok = (22.0 <= mean_luma <= 238.0) and (overexp < 0.42) and (underexp < 0.65)
    focus_ok = sharpness >= 28.0
    return {
        "valid_jpeg": True,
        "frame_sha256": digest,
        "width": int(w),
        "height": int(h),
        "sharpness_laplacian": round(sharpness, 2),
        "mean_luma": round(mean_luma, 2),
        "overexposed_ratio": round(overexp, 4),
        "exposure_ok": bool(exposure_ok),
        "focus_ok": bool(focus_ok),
    }


def classify_bilingual_voice_intent(
    raw_utterance: str,
    *,
    current_language: str = "en",
) -> dict[str, Any]:
    """Parse English or Spanish technician speech into a typed intent (`VOZ-01..10`) without side-effects."""
    norm = normalize_ascii_lower(raw_utterance)
    tokens = re.findall(r"[a-z0-9.\-]+", norm)

    detected_lang = current_language
    # Accent-normalized Spanish cue stems (kept strictly ASCII-clean)
    es_stems = (
        "que ",
        "cual es",
        "debo",
        "revisar",
        "muestrame",
        "mostrar",
        "resalt",
        "donde ",
        "conector",
        "sonda",
        "brida",
        "soporte",
        "respondiendo",
        "esta ",
        "estado actual",
        "humed",
        "lectura",
        "iniciar ",
        "probar ",
        "pagina",
        "repetir",
        "repite",
        "captura",
        "tomar foto",
        "observacion",
        "idioma",
        "ingles",
        "cambiar ",
        "saltar ",
    )
    en_stems = (
        "what ",
        "show ",
        "open ",
        "go to ",
        "highlight ",
        "where is",
        "is the",
        "read ",
        "start ",
        "page ",
        "repeat",
        "please ",
        "take photo",
        "i changed",
        "capture",
        "switch to",
    )
    if any(st in f"{norm} " for st in es_stems):
        detected_lang = "es"
    elif any(st in f"{norm} " for st in en_stems):
        detected_lang = "en"

    # 1. Language switch (`VOZ-10`)
    if re.search(r"\b(switch to spanish|cambiar a espan\w*|hablar en espan\w*|modo espan\w*)\b", norm):
        return {"intent": "switch_language", "target_language": "es", "detected_language": detected_lang, "ambiguous": False}
    if re.search(r"\b(switch to english|cambiar a ingles|hablar en ingles|english mode)\b", norm):
        return {"intent": "switch_language", "target_language": "en", "detected_language": detected_lang, "ambiguous": False}

    # 2. Voice attempt to bypass confirmation or alter another unit (`VOZ-07`)
    if re.search(r"\b(skip confirm\w*|force write|override confirm\w*|saltar confirm\w*|otro equipo|other unit|other sensor)\b", norm):
        return {
            "intent": "request_confirmation",
            "detected_language": detected_lang,
            "bypass_blocked": True,
            "requires_separate_confirmation": True,
            "ambiguous": False,
        }

    # 3. Check ambiguous numeric utterance lacking explicit unit (`VOZ-06`)
    num_match = re.findall(r"(?<![a-z0-9])[+-]?\d+(?:\.\d+)?(?![a-z0-9])", norm)
    has_explicit_context = bool(
        re.search(
            r"\b(page|pagina|step|paso|slave|esclav\w*|unit|address|direccion|pin|celsius|degc|fahrenheit|rh|percent|por ciento|baud)\b",
            norm,
        )
        or "%" in raw_utterance
        or "°" in raw_utterance
    )
    if num_match and not has_explicit_context:
        return {
            "intent": None,
            "detected_language": detected_lang,
            "ambiguous": True,
            "clarification_reason": "AMBIGUOUS_NUMERIC_WITHOUT_UNIT",
            "numbers_heard": num_match,
        }

    # 4. Manual page lookup (`VOZ-02`: e.g. "page 5", "pagina 5", "what should I check / que debo revisar")
    page_m = re.search(r"\b(?:page|pagina)\s*(\d{1,2})\b", norm)
    if page_m:
        return {
            "intent": "show_manual",
            "page": int(page_m.group(1)),
            "detected_language": detected_lang,
            "ambiguous": False,
        }

    # 5. Component 3D highlight (`VOZ-02`: "show me the connector", "muestrame el conector", "dip", "strainer")
    comp_map = (
        ("waterproof_gland_leads", r"\b(connector|conector|wiring|cable\w*|lead\w*|gland|prensaestop\w*|terminal)\b"),
        ("upper_barrel_dip", r"\b(dip|switch\w*|pin\w*|pcb|tarjeta|rocker\w*)\b"),
        ("strainer_head", r"\b(strainer|probe|sonda|filtro|sht30|sht3x|tip|punta)\b"),
        ("mounting_flange", r"\b(flange|brida|bracket|mount\w*|soporte)\b"),
        ("upper_seal_ring", r"\b(o-ring|oring|seal|sello|empaque)\b"),
        ("lower_barrel_rs485", r"\b(barrel|transceiver|rs485|rs-485)\b"),
    )
    if re.search(r"\b(show|muestr\w*|highlight|resalt\w*|enfoc\w*|where is|donde esta|que debo revisar|what should i check)\b", norm):
        for comp_id, pat in comp_map:
            if re.search(pat, norm):
                return {
                    "intent": "highlight_component",
                    "component_3d_id": comp_id,
                    "detected_language": detected_lang,
                    "ambiguous": False,
                }
        if re.search(r"\b(que debo revisar|what should i check|what next|que sigue)\b", norm):
            return {
                "intent": "repeat_step",
                "detected_language": detected_lang,
                "ambiguous": False,
            }

    # 6. Current sensor reading / responsiveness (`VOZ-01`: "is the sensor responding", "el sensor esta respondiendo", "read temperature")
    if re.search(
        r"\b(respond\w*|read\w*|lectura|valor\w*|temperatur\w*|humid\w*|humed\w*|current status|estado actual)\b",
        norm,
    ):
        if re.search(r"\b(start|iniciar|nuevo|new|poll|probar)\b", norm):
            return {"intent": "start_readonly_check", "detected_language": detected_lang, "ambiguous": False}
        return {"intent": "read_current", "detected_language": detected_lang, "ambiguous": False}

    # 7. Repeat step
    if re.search(r"\b(repeat|repite|repetir|again|otra vez)\b", norm):
        return {"intent": "repeat_step", "detected_language": detected_lang, "ambiguous": False}

    # 8. Photo capture
    if re.search(r"\b(capture|captur\w*|take photo|take a photo|tomar foto|guardar foto|snapshot)\b", norm):
        return {"intent": "request_capture", "detected_language": detected_lang, "ambiguous": False}

    # 9. Confirm physical change (always routed to two-step `request_confirmation`, never direct mutation!)
    if re.search(r"\b(confirm\w*|changed|adjusted|reemplac\w*|ajust\w*|modif\w*)\b", norm):
        return {
            "intent": "request_confirmation",
            "detected_language": detected_lang,
            "requires_separate_confirmation": True,
            "ambiguous": False,
        }

    # 10. Record observation
    if re.search(r"\b(note|observ\w*|record|registrar|anotar)\b", norm) and len(tokens) >= 3:
        return {
            "intent": "record_observation",
            "note_text": raw_utterance.strip(),
            "detected_language": detected_lang,
            "ambiguous": False,
        }

    return {
        "intent": None,
        "detected_language": detected_lang,
        "ambiguous": True,
        "clarification_reason": "UNRECOGNIZED_OR_CONVERSATIONAL",
    }


def apply_deterministic_grounding_filter(
    candidate_text: str,
    *,
    profile: dict[str, Any],
    verified_telemetry: dict[str, Any] | None = None,
    project_root: Path = PROJECT_ROOT,
    max_page_count: int | None = None,
) -> dict[str, Any]:
    """Reject or sanitize hallucinated manual pages, fake registers, or SCADA/calibration overclaims (`IA-04`)."""
    raw = (candidate_text or "").strip()
    reasons: list[str] = []
    sanitized = raw

    # 1. Check forbidden overclaims (`SCADA ONLINE`, `PLC verified`, `calibrated values`, etc.)
    for pat in FORBIDDEN_OVERCLAIM_PATTERNS:
        if pat.search(sanitized):
            reasons.append(f"overclaim_blocked:{pat.pattern}")
            sanitized = pat.sub("bench sensor communication observed", sanitized)

    # 2. Check cited page numbers against verified manual (`VIS-10`, `IA-04`, `M4-DOC-01`)
    mentioned_pages = [int(m) for m in re.findall(r"\bpage\s+(\d{1,3})\b", sanitized, flags=re.IGNORECASE)]
    if mentioned_pages:
        if max_page_count is not None and max_page_count >= 1:
            missing_p = [p for p in mentioned_pages if p < 1 or p > max_page_count]
            if missing_p:
                reasons.append(f"invalid_page_citation:{missing_p}")
        else:
            cit_check = verify_and_resolve_citations(profile, mentioned_pages, project_root=project_root)
            if not cit_check["verified"]:
                reasons.append(f"invalid_page_citation:{cit_check['missing_pages']}")

    # 3. Check register hex addresses (`0x0000..0x0007` only for TZ THT-02)
    if profile.get("profile_id") == "tzone_tht02":
        for reg_m in re.findall(r"\b0x[0-9a-fA-F]{4}\b", sanitized):
            low = reg_m.lower()
            if low not in VALID_REGISTER_HEX and low not in {"0x7fff", "0xa001", "0xffff", "0x2580", "0x12c0", "0x4b00", "0x0600", "0x000a", "0x000b"}:
                reasons.append(f"unverified_register:{reg_m}")

    if reasons:
        mb = verified_telemetry or {}
        if mb.get("online") and mb.get("fresh", True):
            fallback_truth = (
                f"[Needs review — grounded to verified bench data] "
                f"Sensor responded on {mb.get('protocol', 'Modbus')}: "
                f"Temperature={mb.get('temp_c')} degC ({mb.get('temp_quality', 'valid')}), "
                f"Humidity={mb.get('humidity_rh')} %RH ({mb.get('humidity_quality', 'valid')}). "
                f"Consult verified Manual {profile.get('visible_manual_revision') or 'local'} pages only."
            )
        else:
            fallback_truth = (
                "[Needs review — grounded to verified profile] "
                "Model output referenced unverified claims, pages, or registers and was replaced by "
                f"deterministic profile data for {profile.get('model', 'active sensor')}."
            )
        return {
            "text": fallback_truth,
            "grounding_corrected": True,
            "reasons": reasons,
            "original_rejected_text": raw,
        }

    return {
        "text": sanitized,
        "grounding_corrected": False,
        "reasons": [],
        "original_rejected_text": None,
    }


class FieldScanSessionEngine:
    """Transactional SQLite-backed session, evidence, voice, and export authority."""

    def __init__(
        self,
        db_path: Path | None = None,
        exports_dir: Path | None = None,
        project_root: Path = PROJECT_ROOT,
        *,
        catalog_store: FieldScanPackageStore | None = None,
        clock_utc_fn: Any = utc_now_iso,
        monotonic_fn: Any = time.monotonic,
        min_free_disk_bytes: int = 2 * 1024 * 1024,
    ) -> None:
        self.project_root = Path(project_root)
        self.exports_dir = Path(exports_dir or (self.project_root / "exports"))
        self.evidence_dir = self.exports_dir / "session_evidence"
        self.db_path = Path(db_path or (self.project_root / "data" / "fieldscan_sessions.sqlite3"))
        self.catalog_store = catalog_store or FieldScanPackageStore(
            catalog_root=self.db_path.parent / "FieldScanCatalog",
            bundle_root=self.project_root,
        )

        self.exports_dir.mkdir(parents=True, exist_ok=True)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self._clock_utc = clock_utc_fn
        self._monotonic = monotonic_fn
        self.min_free_disk_bytes = int(min_free_disk_bytes)
        self._lock = threading.RLock()

        # In-process monotonic sample tracker (`session_id -> latest live sample metadata`)
        self._live_sample_tracker: dict[str, dict[str, Any]] = {}
        self._active_session_id: str | None = None
        self._connection_generation: int = 1

        # Camera stability & freeze state
        self._camera_epoch: int = 1
        self._active_camera_source: str = "none"
        self._recent_frame_digests: deque[str] = deque(maxlen=6)
        self._stability_window: deque[dict[str, Any]] = deque(maxlen=8)
        self._auto_captured_keys: set[tuple[str, str, int, str]] = set()

        # Audio / TTS Echo / Alert debounce state (`Fase 5.1`)
        self.audio_state: str = "idle"
        self.preferred_language: str = "en"
        self._last_tts_text: str = ""
        self._last_tts_ended_mono: float = -999.0
        self._seen_utterance_ids: deque[str] = deque(maxlen=64)
        self._alert_last_fired_mono: dict[str, float] = {}
        self._link_transition_times: deque[float] = deque(maxlen=12)

        self._cleanup_orphan_temp_files()
        self._init_sqlite_schema()

    def _connect_db(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=5.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _cleanup_orphan_temp_files(self) -> int:
        """Remove incomplete `.tmp` files left behind by an interrupted write (`EXP-03`)."""
        removed = 0
        for folder in (self.exports_dir, self.evidence_dir):
            if not folder.is_dir():
                continue
            for tmp_file in folder.glob("*.tmp"):
                try:
                    tmp_file.unlink()
                    removed += 1
                except OSError:
                    pass
        return removed

    def _init_sqlite_schema(self) -> None:
        with self._lock, self._connect_db() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    created_at_utc TEXT NOT NULL,
                    updated_at_utc TEXT NOT NULL,
                    boot_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    step_id TEXT NOT NULL,
                    seq INTEGER NOT NULL,
                    profile_id TEXT NOT NULL,
                    profile_revision TEXT NOT NULL,
                    profile_sha256 TEXT NOT NULL,
                    manual_sha256 TEXT,
                    identity_pending INTEGER NOT NULL DEFAULT 0,
                    asset_tag TEXT,
                    serial_number TEXT,
                    asset_confirmed INTEGER NOT NULL DEFAULT 0,
                    transport_mode TEXT NOT NULL,
                    simulation INTEGER NOT NULL DEFAULT 0,
                    build_id TEXT NOT NULL,
                    language TEXT NOT NULL DEFAULT 'en',
                    state_json TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS session_events (
                    session_id TEXT NOT NULL,
                    seq INTEGER NOT NULL,
                    event_id TEXT NOT NULL UNIQUE,
                    kind TEXT NOT NULL,
                    step_id TEXT NOT NULL,
                    occurred_at_utc TEXT NOT NULL,
                    monotonic_s REAL NOT NULL,
                    boot_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    simulation INTEGER NOT NULL DEFAULT 0,
                    payload_json TEXT NOT NULL,
                    PRIMARY KEY (session_id, seq),
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );

                CREATE TABLE IF NOT EXISTS idempotency_keys (
                    scope_key TEXT PRIMARY KEY,
                    payload_sha256 TEXT NOT NULL,
                    created_at_utc TEXT NOT NULL,
                    response_json TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS session_exports (
                    export_id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    session_seq INTEGER NOT NULL,
                    export_profile TEXT NOT NULL,
                    created_at_utc TEXT NOT NULL,
                    supersedes_export_id TEXT,
                    manifest_json TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );
                """
            )

    def _check_idempotency(
        self,
        conn: sqlite3.Connection,
        scope_prefix: str,
        idem_key: str | None,
        canonical_payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        if not idem_key:
            return None
        scope_key = f"{scope_prefix}:{idem_key}"
        payload_hash = hashlib.sha256(
            json.dumps(canonical_payload, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()
        row = conn.execute(
            "SELECT payload_sha256, response_json FROM idempotency_keys WHERE scope_key = ?",
            (scope_key,),
        ).fetchone()
        if row is None:
            return None
        if row["payload_sha256"] != payload_hash:
            raise SessionDomainError(
                "IDEMPOTENCY_CONFLICT",
                f"Idempotency key '{idem_key}' was already used with a different request payload.",
                status_code=409,
            )
        cached = json.loads(row["response_json"])
        cached["idempotent_replay"] = True
        return cached

    def _store_idempotency(
        self,
        conn: sqlite3.Connection,
        scope_prefix: str,
        idem_key: str | None,
        canonical_payload: dict[str, Any],
        response_obj: dict[str, Any],
    ) -> None:
        if not idem_key:
            return
        scope_key = f"{scope_prefix}:{idem_key}"
        payload_hash = hashlib.sha256(
            json.dumps(canonical_payload, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()
        conn.execute(
            """
            INSERT OR REPLACE INTO idempotency_keys (scope_key, payload_sha256, created_at_utc, response_json)
            VALUES (?, ?, ?, ?)
            """,
            (scope_key, payload_hash, self._clock_utc(), json.dumps(response_obj, default=str)),
        )

    def _ensure_disk_space(self) -> None:
        usage = shutil.disk_usage(self.exports_dir)
        if usage.free < self.min_free_disk_bytes:
            raise SessionDomainError(
                "DISK_FULL",
                f"Insufficient local storage ({usage.free} bytes free; minimum {self.min_free_disk_bytes} required). "
                "Existing session evidence is preserved; free disk space before exporting.",
                status_code=507,
                details={"free_bytes": usage.free, "required_bytes": self.min_free_disk_bytes},
            )

    def resolve_authorized_export_path(self, raw_filename: str) -> Path | None:
        """Canonical allowlist check ensuring shared/exported filenames resolve strictly inside `exports_dir` (`EXP-05`)."""
        clean = (raw_filename or "").strip()
        if not clean or ".." in clean or "/" in clean or "\\" in clean:
            return None
        exports_canon = self.exports_dir.resolve()
        candidate = (exports_canon / clean).resolve()
        if candidate.parent != exports_canon or not candidate.is_file():
            return None
        return candidate

    def create_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Open a new deterministic inspection session, freezing profile & manual hashes (`Section 5.1`, `5.2`)."""
        idem_key = str(payload.get("idempotency_key") or "").strip() or None
        profile_query = str(payload.get("profile_id") or payload.get("model") or "tzone_tht02").strip()
        transport_mode = str(payload.get("transport_mode") or "auto").strip().lower()
        asset_tag = str(payload.get("asset_tag") or "").strip() or None
        serial_number = str(payload.get("serial_number") or "").strip() or None
        language = str(payload.get("language") or self.preferred_language or "en").strip().lower()
        if language not in ("en", "es"):
            language = "en"
        build_id = str(payload.get("build_id") or "fieldscan-2.0.0-b200")
        is_sim = transport_mode.startswith("sim") or bool(payload.get("simulation", False))
        req_ctx = payload.get("catalog_context") if isinstance(payload.get("catalog_context"), dict) else None
        req_manifest_sha = str((req_ctx or {}).get("manifest_sha256") or payload.get("manifest_sha256") or "").strip()
        req_origin = str((req_ctx or {}).get("content_origin") or "").strip()

        canonical_req: dict[str, Any] = {
            "profile_query": profile_query,
            "transport_mode": transport_mode,
            "asset_tag": asset_tag,
            "serial_number": serial_number,
            "simulation": is_sim,
            "language": language,
        }
        if req_manifest_sha:
            canonical_req["manifest_sha256"] = req_manifest_sha

        is_catalog_requested = (req_origin == "catalog") or (
            bool(req_manifest_sha) and req_manifest_sha != "bundle" and not req_manifest_sha.startswith("bundle-")
        )
        installed_catalog_pkg: dict[str, Any] | None = None
        if is_catalog_requested:
            try:
                installed_catalog_pkg = self.catalog_store.get_installed_package(req_manifest_sha)
            except CatalogDomainError as exc:
                raise SessionDomainError(
                    "PACKAGE_NOT_INSTALLED",
                    f"Catalog package '{req_manifest_sha}' is not installed locally and cannot be pinned to a session.",
                    status_code=404,
                ) from exc

        with self._lock, self._connect_db() as conn:
            replay = self._check_idempotency(conn, "create_session", idem_key, canonical_req)
            if replay is not None:
                return replay

            # Pause any prior open active session when starting a new one (`DAT-06`)
            if self._active_session_id:
                conn.execute(
                    "UPDATE sessions SET status = 'paused', updated_at_utc = ? WHERE session_id = ? AND status = 'open'",
                    (self._clock_utc(), self._active_session_id),
                )
            self._connection_generation += 1

            prof = resolve_device_profile(profile_query, profiles_dir=self.project_root / "knowledge" / "profiles")
            now_utc = self._clock_utc()
            now_mono = float(self._monotonic())
            session_id = f"ses-{uuid.uuid4().hex[:12]}"
            initial_step = str(prof.get("procedure", {}).get("initial_step", "identify"))
            refs = dict(prof.get("references") or {})
            max_manual_pages = 9

            if installed_catalog_pkg is not None:
                m_obj = installed_catalog_pkg["manifest"]
                c_prod = installed_catalog_pkg["product_id"]
                c_var = installed_catalog_pkg["variant_id"]
                c_pub_seq = int(installed_catalog_pkg["publication_seq"])
                homologated = bool(m_obj.get("bench_modbus_homologated", False))
                local_prof_id = str(m_obj.get("bench_profile_id") or "tzone_tht02") if homologated else None
                title = str(m_obj.get("title") or f"{c_prod} ({c_var})")

                if local_prof_id:
                    prof = resolve_device_profile(local_prof_id, profiles_dir=self.project_root / "knowledge" / "profiles")
                    prof["identity_pending"] = False
                    prof["auto_decode_allowed"] = True
                else:
                    default_tht = resolve_device_profile("tzone_tht02", profiles_dir=self.project_root / "knowledge" / "profiles")
                    prof = {
                        "profile_id": f"{c_prod}_{c_var}",
                        "sensor_id": str(m_obj.get("sensor_id") or c_prod.upper()),
                        "model": str(m_obj.get("model") or title),
                        "tested_profile_revision": f"pub-seq-{c_pub_seq}",
                        "validation_status": "supported_bench_readonly" if homologated else "catalog_reference_only",
                        "identity_pending": False,
                        "auto_decode_allowed": homologated,
                        "bench_modbus_homologated": homologated,
                        "_profile_sha256": req_manifest_sha,
                        "procedure": default_tht.get("procedure", {"initial_step": "identify", "steps": []}),
                        "references": {},
                    }
                prof["tested_profile_revision"] = f"pub-seq-{c_pub_seq}"
                prof["_profile_sha256"] = req_manifest_sha
                pdf_art = next((a for a in installed_catalog_pkg["artifacts"] if a["role"] == "manual_pdf"), None)
                refs = dict(prof.get("references") or {})
                if pdf_art:
                    refs["manual_sha256"] = pdf_art["sha256"]

                catalog_ctx = {
                    "product_id": c_prod,
                    "variant_id": c_var,
                    "title": title,
                    "publication_seq": c_pub_seq,
                    "manifest_sha256": req_manifest_sha,
                    "local_profile_id": local_prof_id,
                    "content_origin": "catalog",
                    "bench_modbus_homologated": homologated,
                    "capabilities": installed_catalog_pkg["capabilities"],
                }
                try:
                    desc = self.catalog_store.build_scene_and_manual_descriptor(catalog_ctx)
                    max_manual_pages = max(1, max((int(d.get("page_count") or 1) for d in desc.get("documents", [])), default=9))
                except Exception:
                    max_manual_pages = 9
            elif prof.get("profile_id") == "tzone_tht02":
                catalog_ctx = self.catalog_store.build_bundle_default_context()
            else:
                id_pend = bool(prof.get("identity_pending"))
                catalog_ctx = {
                    "product_id": str(prof.get("profile_id") or "unknown"),
                    "variant_id": "pending_identity" if id_pend else "bundled_default",
                    "title": str(prof.get("model") or prof.get("profile_id") or "Unknown"),
                    "publication_seq": 0,
                    "manifest_sha256": str(prof.get("_profile_sha256") or ""),
                    "local_profile_id": None if id_pend else str(prof.get("profile_id")),
                    "content_origin": "bundle",
                    "bench_modbus_homologated": not id_pend,
                    "capabilities": {"documentation": False, "interactive_twin": False, "procedures": True},
                }

            state_doc: dict[str, Any] = {
                "as_found": None,
                "as_left": None,
                "observations": [],
                "confirmed_changes": [],
                "evidence_files": [],
                "pending_confirmation_token": None,
                "last_valid_sample": None,
                "close_summary": None,
                "partial_close": False,
                "missing_evidence": [],
                "connection_generation": self._connection_generation,
                "profile_snapshot": prof,
                "catalog_context": catalog_ctx,
                "max_manual_page_count": max_manual_pages,
            }

            conn.execute(
                """
                INSERT INTO sessions (
                    session_id, created_at_utc, updated_at_utc, boot_id, status, step_id, seq,
                    profile_id, profile_revision, profile_sha256, manual_sha256, identity_pending,
                    asset_tag, serial_number, asset_confirmed, transport_mode, simulation,
                    build_id, language, state_json
                ) VALUES (?, ?, ?, ?, 'open', ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    now_utc,
                    now_utc,
                    PROCESS_BOOT_ID,
                    initial_step,
                    prof["profile_id"],
                    str(prof.get("tested_profile_revision", "draft")),
                    str(prof.get("_profile_sha256", "")),
                    refs.get("manual_sha256"),
                    1 if prof.get("identity_pending") else 0,
                    asset_tag,
                    serial_number,
                    1 if (asset_tag or serial_number) and not prof.get("identity_pending") else 0,
                    transport_mode,
                    1 if is_sim else 0,
                    build_id,
                    language,
                    json.dumps(state_doc),
                ),
            )

            ev_id = f"evt-{uuid.uuid4().hex[:12]}"
            ev_payload = {
                "profile_id": prof["profile_id"],
                "model": prof.get("model"),
                "identity_pending": bool(prof.get("identity_pending")),
                "transport_mode": transport_mode,
                "simulation": is_sim,
                "asset_tag": asset_tag,
            }
            conn.execute(
                """
                INSERT INTO session_events (
                    session_id, seq, event_id, kind, step_id, occurred_at_utc,
                    monotonic_s, boot_id, source, actor, simulation, payload_json
                ) VALUES (?, 1, ?, 'session.opened', ?, ?, ?, ?, ?, 'operator', ?, ?)
                """,
                (
                    session_id,
                    ev_id,
                    initial_step,
                    now_utc,
                    now_mono,
                    PROCESS_BOOT_ID,
                    "simulation" if is_sim else "bench_session",
                    1 if is_sim else 0,
                    json.dumps(ev_payload),
                ),
            )

            self._active_session_id = session_id
            self.preferred_language = language
            snap = self._load_session_snapshot_unlocked(conn, session_id)
            self._store_idempotency(conn, "create_session", idem_key, canonical_req, snap)
            return snap

    def get_active_or_create_default_session(self, simulation: bool = False) -> dict[str, Any]:
        with self._lock:
            if self._active_session_id:
                try:
                    return self.get_session(self._active_session_id)
                except SessionDomainError:
                    self._active_session_id = None
            return self.create_session(
                {
                    "profile_id": "tzone_tht02",
                    "transport_mode": "sim_online" if simulation else "auto",
                    "simulation": simulation,
                }
            )

    def get_session(self, session_id: str) -> dict[str, Any]:
        with self._lock, self._connect_db() as conn:
            return self._load_session_snapshot_unlocked(conn, session_id)

    def list_sessions(self, limit: int = 20) -> list[dict[str, Any]]:
        with self._lock, self._connect_db() as conn:
            rows = conn.execute(
                "SELECT session_id FROM sessions ORDER BY updated_at_utc DESC LIMIT ?",
                (max(1, int(limit)),),
            ).fetchall()
            return [self._load_session_snapshot_unlocked(conn, r["session_id"]) for r in rows]

    def invalidate_live_connection(self, reason: str = "transport_or_asset_changed") -> None:
        """Invalidate freshness of any live sample immediately on link loss, mode change, or asset switch (`DAT-03`, `DAT-06`)."""
        with self._lock:
            self._connection_generation += 1
            now_m = float(self._monotonic())
            self._link_transition_times.append(now_m)
            for tracker in self._live_sample_tracker.values():
                tracker["invalidated"] = True
                tracker["invalidation_reason"] = reason

    def record_modbus_observation(
        self,
        session_id: str,
        modbus_tel: dict[str, Any],
        *,
        actor: str = "transport",
    ) -> dict[str, Any]:
        """Record a physical or simulated Modbus sample into the session with strict provenance & freshness (`Section 5.1`)."""
        with self._lock, self._connect_db() as conn:
            row = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
            if row is None:
                raise SessionDomainError("SESSION_NOT_FOUND", f"Unknown session '{session_id}'", status_code=404)

            state_doc = json.loads(row["state_json"])
            prof = state_doc.get("profile_snapshot") or {}

            # Reject response arriving from an outdated connection generation (`DAT-06`)
            resp_gen = modbus_tel.get("connection_generation")
            if resp_gen is not None and int(resp_gen) != int(state_doc.get("connection_generation", self._connection_generation)):
                raise SessionDomainError(
                    "STALE_CONNECTION_GENERATION",
                    "Discarded response from superseded sensor/transport connection.",
                    status_code=409,
                )

            # Inhibit foreign scaling on unverified profiles (`FLU-04`, `BUS-11`)
            if prof.get("identity_pending") or not prof.get("auto_decode_allowed", True):
                raise SessionDomainError(
                    "PROFILE_MISMATCH",
                    f"Automatic register scaling is inhibited for unverified profile '{row['profile_id']}'.",
                    status_code=409,
                )

            now_utc = self._clock_utc()
            now_mono = float(self._monotonic())
            raw_source = str(modbus_tel.get("source") or "unknown")
            is_sim = raw_source.startswith("simulator") or bool(modbus_tel.get("simulation")) or bool(row["simulation"])
            online = bool(modbus_tel.get("online"))
            protocol = str(modbus_tel.get("protocol") or ("simulation" if is_sim else "modbus_rtu_serial"))

            temp_c = modbus_tel.get("temp_c")
            hum_rh = modbus_tel.get("humidity_rh")
            temp_q = str(
                modbus_tel.get("temp_quality")
                or ("invalid_sentinel_7fff" if modbus_tel.get("raw_temp_hex") == "0x7FFF" else ("valid" if temp_c is not None else "unavailable"))
            )
            hum_q = str(
                modbus_tel.get("humidity_quality")
                or ("invalid_sentinel_7fff" if modbus_tel.get("raw_humidity_hex") == "0x7FFF" else ("valid" if hum_rh is not None else "unavailable"))
            )
            if temp_q != "valid":
                temp_c = None
            if hum_q != "valid":
                hum_rh = None

            measurements = [
                {
                    "quantity": "temperature",
                    "value": temp_c,
                    "unit": "Cel",
                    "quality": temp_q,
                    "raw_hex": modbus_tel.get("raw_temp_hex"),
                },
                {
                    "quantity": "relative_humidity",
                    "value": hum_rh,
                    "unit": "%RH",
                    "quality": hum_q,
                    "raw_hex": modbus_tel.get("raw_humidity_hex"),
                },
            ]

            next_seq = int(row["seq"]) + 1
            ev_id = f"evt-{uuid.uuid4().hex[:12]}"
            scope = "simulation" if is_sim else "sensor_communication"

            if online:
                visible_result = (
                    "Simulation Mode"
                    if is_sim
                    else ("Channel Measurement Fault" if (temp_q != "valid" or hum_q != "valid") else "Sensor Responded")
                )
            else:
                visible_result = "Read Timeout / No Response"

            ev_payload = {
                "schema_version": 1,
                "session_id": session_id,
                "event_id": ev_id,
                "seq": next_seq,
                "kind": "sensor.sample" if online else "sensor.timeout",
                "step_id": row["step_id"],
                "occurred_at_utc": now_utc,
                "capture_at_utc": now_utc,
                "source": "simulation" if is_sim else raw_source,
                "actor": actor,
                "device": {
                    "profile_id": row["profile_id"],
                    "profile_revision": row["profile_revision"],
                    "unit_id": int(modbus_tel.get("slave_id") or 1),
                },
                "transport": {
                    "status": "response_received" if online else str(modbus_tel.get("error_code") or "READ_TIMEOUT"),
                    "protocol": protocol,
                    "transaction_id": modbus_tel.get("transaction_id"),
                    "crc_checked_by_client": bool(modbus_tel.get("crc_valid")) if protocol != "modbus_tcp_mbap" else False,
                    "mbap_valid": modbus_tel.get("mbap_valid"),
                    "tx_hex": modbus_tel.get("last_tx_hex") or modbus_tel.get("tx_hex") or "",
                    "rx_hex": modbus_tel.get("last_rx_hex") or modbus_tel.get("rx_hex") or "",
                },
                "measurements": measurements,
                "visible_result": visible_result,
                "scope": scope,
                "plc_verified": False,
                "scada_verified": False,
                "calibrated_against_reference": False,
                "simulation": is_sim,
            }

            if online:
                state_doc["last_valid_sample"] = {
                    "event_id": ev_id,
                    "seq": next_seq,
                    "captured_at_utc": now_utc,
                    "boot_id": PROCESS_BOOT_ID,
                    "measurements": measurements,
                    "unit_id": int(modbus_tel.get("slave_id") or 1),
                    "protocol": protocol,
                    "source": ev_payload["source"],
                    "visible_result": visible_result,
                    "scope": scope,
                    "simulation": is_sim,
                }
                self._live_sample_tracker[session_id] = {
                    "captured_mono": now_mono,
                    "boot_id": PROCESS_BOOT_ID,
                    "connection_gen": self._connection_generation,
                    "invalidated": False,
                    "invalidation_reason": None,
                    "max_age_s": float(prof.get("transport", {}).get("max_sample_age_s", 3.0)),
                }
                if row["step_id"] == "as_found" and state_doc.get("as_found") is None:
                    state_doc["as_found"] = {
                        "recorded_at_utc": now_utc,
                        "communication": "responded",
                        "sample": state_doc["last_valid_sample"],
                    }
            else:
                if session_id in self._live_sample_tracker:
                    self._live_sample_tracker[session_id]["invalidated"] = True
                    self._live_sample_tracker[session_id]["invalidation_reason"] = str(
                        modbus_tel.get("error_code") or "READ_TIMEOUT"
                    )
                if row["step_id"] == "as_found" and state_doc.get("as_found") is None:
                    state_doc["as_found"] = {
                        "recorded_at_utc": now_utc,
                        "communication": "no_response",
                        "error_code": str(modbus_tel.get("error_code") or "READ_TIMEOUT"),
                    }

            new_sim_flag = 1 if (bool(row["simulation"]) or is_sim) else 0
            conn.execute(
                """
                INSERT INTO session_events (
                    session_id, seq, event_id, kind, step_id, occurred_at_utc,
                    monotonic_s, boot_id, source, actor, simulation, payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    next_seq,
                    ev_id,
                    ev_payload["kind"],
                    row["step_id"],
                    now_utc,
                    now_mono,
                    PROCESS_BOOT_ID,
                    ev_payload["source"],
                    actor,
                    1 if is_sim else 0,
                    json.dumps(ev_payload),
                ),
            )
            conn.execute(
                "UPDATE sessions SET seq = ?, simulation = ?, updated_at_utc = ?, state_json = ? WHERE session_id = ?",
                (next_seq, new_sim_flag, now_utc, json.dumps(state_doc), session_id),
            )
            return self._load_session_snapshot_unlocked(conn, session_id)

    def evaluate_sample_freshness(self, session_snap: dict[str, Any]) -> dict[str, Any]:
        """Compute authoritative `fresh` vs `historical` status for a session's last sample (`DAT-03`, `DAT-07`)."""
        state_doc = session_snap.get("state") or {}
        last_sample = state_doc.get("last_valid_sample")
        if not last_sample:
            return {
                "has_sample": False,
                "fresh": False,
                "sample_state": "none",
                "age_s": None,
                "reason": "NO_SAMPLE_RECORDED",
                "sample": None,
            }

        sid = session_snap["session_id"]
        tracker = self._live_sample_tracker.get(sid)
        if tracker is None or tracker.get("boot_id") != PROCESS_BOOT_ID or last_sample.get("boot_id") != PROCESS_BOOT_ID:
            return {
                "has_sample": True,
                "fresh": False,
                "sample_state": "historical",
                "age_s": None,
                "reason": "PRIOR_PROCESS_RUN",
                "sample": last_sample,
            }

        now_mono = float(self._monotonic())
        age_s = max(0.0, round(now_mono - float(tracker["captured_mono"]), 3))
        max_age = float(tracker.get("max_age_s", 3.0))

        # Detect wall-clock manipulation without rewriting original `captured_at_utc` (`DAT-07`)
        clock_discrepancy = False
        try:
            cap_dt = datetime.fromisoformat(str(last_sample["captured_at_utc"]).replace("Z", "+00:00"))
            now_dt = datetime.fromisoformat(self._clock_utc().replace("Z", "+00:00"))
            wall_delta = (now_dt - cap_dt).total_seconds()
            if abs(wall_delta - age_s) > 15.0:
                clock_discrepancy = True
        except Exception:
            pass

        if tracker.get("invalidated"):
            return {
                "has_sample": True,
                "fresh": False,
                "sample_state": "historical",
                "age_s": age_s,
                "reason": str(tracker.get("invalidation_reason") or "LINK_LOST"),
                "clock_discrepancy_detected": clock_discrepancy,
                "sample": last_sample,
            }

        if age_s > max_age:
            return {
                "has_sample": True,
                "fresh": False,
                "sample_state": "historical",
                "age_s": age_s,
                "reason": "STALE_SAMPLE",
                "clock_discrepancy_detected": clock_discrepancy,
                "sample": last_sample,
            }

        return {
            "has_sample": True,
            "fresh": True,
            "sample_state": "fresh",
            "age_s": age_s,
            "reason": None,
            "clock_discrepancy_detected": clock_discrepancy,
            "sample": last_sample,
        }

    def notify_camera_source_changed(self, new_source: str) -> dict[str, Any]:
        """Increment `camera_epoch`, reset stability window, and invalidate prior ROI (`VIS-04`)."""
        with self._lock:
            clean = (new_source or "unknown").strip()
            if clean != self._active_camera_source:
                self._camera_epoch += 1
                self._active_camera_source = clean
                self._stability_window.clear()
                self._recent_frame_digests.clear()
            return {
                "camera_epoch": self._camera_epoch,
                "camera_source": self._active_camera_source,
                "roi_invalidated": True,
            }

    def ingest_camera_frame_for_session(
        self,
        session_id: str,
        raw_jpeg: bytes,
        *,
        annotated_jpeg: bytes | None = None,
        vision_tel: dict[str, Any] | None = None,
        camera_source: str = "usb",
        manual_trigger: bool = False,
    ) -> dict[str, Any]:
        """Evaluate frame quality, stream freeze, occlusion, and 5-frame auto-capture window (`VIS-01..07`)."""
        with self._lock, self._connect_db() as conn:
            row = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
            if row is None:
                raise SessionDomainError("SESSION_NOT_FOUND", f"Unknown session '{session_id}'", status_code=404)

            if camera_source != self._active_camera_source:
                self.notify_camera_source_changed(camera_source)

            vtel = vision_tel or {}
            q = evaluate_frame_quality_metrics(raw_jpeg)
            if not q["valid_jpeg"]:
                return {"captured": False, "reason": "INVALID_JPEG", "quality": q}

            # Stream freeze / replay guard (`VIS-06`)
            digest = q["frame_sha256"]
            repeat_count = sum(1 for d in self._recent_frame_digests if d == digest)
            self._recent_frame_digests.append(digest)
            stream_frozen = (repeat_count >= 2) and not manual_trigger
            if stream_frozen:
                self._stability_window.clear()
                return {
                    "captured": False,
                    "stream_frozen": True,
                    "reason": "STREAM_FROZEN_DUPLICATE_DIGEST",
                    "camera_epoch": self._camera_epoch,
                    "quality": q,
                }

            src_low = camera_source.lower()
            is_sim_source = src_low.startswith("sim") or "simulator" in src_low
            is_upload_source = "upload" in src_low or "custom" in src_low
            is_physical_camera = not is_sim_source and not is_upload_source

            occluded = bool(
                vtel.get("hand_detected")
                or vtel.get("tool_detected")
                or vtel.get("white_sticker_occluded")
                or q["overexposed_ratio"] > 0.35
            )
            sensor_detected = bool(vtel.get("detected", True))
            roi_zone = str(vtel.get("anomaly_zone") or "full_sensor")
            now_mono = float(self._monotonic())

            if not manual_trigger:
                if not is_physical_camera:
                    return {
                        "captured": False,
                        "reason": "NON_PHYSICAL_SOURCE_AUTO_CAPTURE_BLOCKED",
                        "evidence_origin": "simulation" if is_sim_source else "uploaded_file",
                        "quality": q,
                    }
                if occluded or not q["focus_ok"] or not q["exposure_ok"] or not sensor_detected:
                    self._stability_window.clear()
                    return {
                        "captured": False,
                        "reason": "FRAME_REJECTED_OCCLUDED_OR_BLURRY",
                        "occluded": occluded,
                        "focus_ok": q["focus_ok"],
                        "exposure_ok": q["exposure_ok"],
                        "quality": q,
                    }

                step_id = str(row["step_id"])
                dedup_key = (session_id, step_id, self._camera_epoch, roi_zone)
                if dedup_key in self._auto_captured_keys:
                    return {
                        "captured": False,
                        "reason": "ALREADY_CAPTURED_FOR_STEP_CONTEXT",
                        "quality": q,
                    }

                self._stability_window.append({"mono": now_mono, "digest": digest})
                # Keep frames within last 1.5s window (`VIS-01`, `VIS-03`)
                while self._stability_window and (now_mono - self._stability_window[0]["mono"]) > 1.5:
                    self._stability_window.popleft()

                if len(self._stability_window) < 5:
                    return {
                        "captured": False,
                        "reason": "AWAITING_STABILITY_WINDOW",
                        "usable_frames_in_window": len(self._stability_window),
                        "required_frames": 5,
                        "quality": q,
                    }
                self._auto_captured_keys.add(dedup_key)
                capture_trigger = "auto_physical_window"
                evidence_origin = "live_physical_camera"
            else:
                capture_trigger = "manual_operator"
                if is_sim_source:
                    evidence_origin = "simulation"
                elif is_upload_source:
                    evidence_origin = "uploaded_file"
                else:
                    evidence_origin = "manual_physical_camera"

            # Atomic temp-write -> validate -> rename (`Fase 6.1.2`, `EXP-03`)
            self._ensure_disk_space()
            now_utc = self._clock_utc()
            photo_id = f"pho-{uuid.uuid4().hex[:10]}"
            orig_name = f"{session_id}_{photo_id}_original.jpg"
            orig_tmp = self.evidence_dir / f"{orig_name}.tmp"
            orig_final = self.evidence_dir / orig_name

            orig_tmp.write_bytes(raw_jpeg)
            verify_q = evaluate_frame_quality_metrics(orig_tmp.read_bytes())
            if not verify_q["valid_jpeg"] or verify_q["frame_sha256"] != digest:
                orig_tmp.unlink(missing_ok=True)
                raise SessionDomainError("CORRUPT_PHOTO_WRITE", "Temporary photo verification failed", status_code=500)
            os.replace(orig_tmp, orig_final)

            deriv_name: str | None = None
            deriv_sha: str | None = None
            if annotated_jpeg:
                d_name = f"{session_id}_{photo_id}_annotated.jpg"
                d_tmp = self.evidence_dir / f"{d_name}.tmp"
                d_final = self.evidence_dir / d_name
                d_tmp.write_bytes(annotated_jpeg)
                deriv_sha = sha256_file(d_tmp)
                os.replace(d_tmp, d_final)
                deriv_name = d_name

            state_doc = json.loads(row["state_json"])
            ev_record = {
                "photo_id": photo_id,
                "step_id": row["step_id"],
                "captured_at_utc": now_utc,
                "camera_source": camera_source,
                "camera_epoch": self._camera_epoch,
                "capture_trigger": capture_trigger,
                "evidence_origin": evidence_origin,
                "roi_zone": roi_zone,
                "original_filename": orig_name,
                "original_sha256": digest,
                "annotated_filename": deriv_name,
                "annotated_sha256": deriv_sha,
                "width": q["width"],
                "height": q["height"],
                "sharpness_laplacian": q["sharpness_laplacian"],
                "simulation": is_sim_source,
            }
            state_doc["evidence_files"].append(ev_record)

            next_seq = int(row["seq"]) + 1
            ev_id = f"evt-{uuid.uuid4().hex[:12]}"
            conn.execute(
                """
                INSERT INTO session_events (
                    session_id, seq, event_id, kind, step_id, occurred_at_utc,
                    monotonic_s, boot_id, source, actor, simulation, payload_json
                ) VALUES (?, ?, ?, 'evidence.photo', ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    next_seq,
                    ev_id,
                    row["step_id"],
                    now_utc,
                    now_mono,
                    PROCESS_BOOT_ID,
                    evidence_origin,
                    "vision_auto" if not manual_trigger else "operator",
                    1 if is_sim_source else 0,
                    json.dumps(ev_record),
                ),
            )
            conn.execute(
                "UPDATE sessions SET seq = ?, updated_at_utc = ?, state_json = ? WHERE session_id = ?",
                (next_seq, now_utc, json.dumps(state_doc), session_id),
            )
            return {
                "captured": True,
                "photo": ev_record,
                "seq": next_seq,
                "stream_frozen": False,
                "quality": q,
            }

    def register_tts_playback(self, spoken_text: str, duration_estimate_s: float = 0.0) -> None:
        """Mark audio machine as speaking and record lexical fingerprint for echo rejection (`VOZ-04`)."""
        with self._lock:
            self._last_tts_text = normalize_ascii_lower(spoken_text)
            self._last_tts_ended_mono = float(self._monotonic()) + max(0.0, float(duration_estimate_s))
            if duration_estimate_s > 0:
                self.audio_state = "speaking"

    def set_audio_state(self, new_state: str) -> str:
        with self._lock:
            if new_state not in VALID_AUDIO_STATES:
                raise ValueError(f"Invalid audio state '{new_state}'")
            if self.audio_state == "speaking" and new_state != "speaking":
                self._last_tts_ended_mono = float(self._monotonic())
            self.audio_state = new_state
            return self.audio_state

    def is_tts_echo_or_duplicate(self, utterance_text: str, utterance_id: str | None = None) -> tuple[bool, str | None]:
        """Reject self-TTS acoustic echo or duplicate utterance IDs (`VOZ-04`, `VOZ-08`)."""
        with self._lock:
            if utterance_id:
                if utterance_id in self._seen_utterance_ids:
                    return True, "DUPLICATE_UTTERANCE_ID"
                self._seen_utterance_ids.append(utterance_id)

            now_m = float(self._monotonic())
            if self.audio_state == "speaking" or (now_m - self._last_tts_ended_mono) < 0.65:
                # Check if spoken while TTS active or within 650ms acoustic tail
                norm_u = normalize_ascii_lower(utterance_text)
                if not norm_u:
                    return True, "EMPTY_DURING_TTS"
                if self._last_tts_text:
                    u_toks = set(re.findall(r"[a-z0-9]+", norm_u))
                    t_toks = set(re.findall(r"[a-z0-9]+", self._last_tts_text))
                    if u_toks and len(u_toks & t_toks) / len(u_toks) >= 0.55:
                        return True, "TTS_ACOUSTIC_ECHO_REJECTED"
                if self.audio_state == "speaking":
                    return True, "MIC_GATED_WHILE_SPEAKING"

            # Even outside active window, reject verbatim playback of last TTS string
            norm_u = normalize_ascii_lower(utterance_text)
            if self._last_tts_text and len(norm_u) >= 14 and norm_u in self._last_tts_text:
                return True, "TTS_VERBATIM_ECHO_REJECTED"

            return False, None

    def should_emit_transition_alert(self, transition_kind: str, cooldown_s: float = 3.0) -> dict[str, Any]:
        """Enforce 3.0s silence window for repeated alerts and collapse flapping into `intermittent` (`VOZ-09`)."""
        with self._lock:
            now_m = float(self._monotonic())
            while self._link_transition_times and (now_m - self._link_transition_times[0]) > 10.0:
                self._link_transition_times.popleft()
            intermittent = len(self._link_transition_times) >= 3
            key = "intermittent_link" if intermittent else transition_kind
            last_t = self._alert_last_fired_mono.get(key, -999.0)
            if (now_m - last_t) < cooldown_s:
                return {"emit": False, "suppressed_reason": "COOLDOWN_3S", "intermittent": intermittent}
            self._alert_last_fired_mono[key] = now_m
            return {"emit": True, "suppressed_reason": None, "intermittent": intermittent}

    def apply_action(self, session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Apply a typed HMI or voice action deterministically (`POST /api/sessions/{id}/actions`)."""
        idem_key = str(payload.get("idempotency_key") or "").strip() or None
        action = str(payload.get("action") or payload.get("intent") or "").strip()
        actor = str(payload.get("actor") or "operator").strip()
        expected_seq = payload.get("expected_seq")
        expected_step = payload.get("expected_step")

        canonical_req = {k: v for k, v in payload.items() if k != "idempotency_key"}

        with self._lock, self._connect_db() as conn:
            replay = self._check_idempotency(conn, f"action:{session_id}", idem_key, canonical_req)
            if replay is not None:
                return replay

            row = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
            if row is None:
                raise SessionDomainError("SESSION_NOT_FOUND", f"Unknown session '{session_id}'", status_code=404)

            if row["status"] == "closed" and action != "amend_closed_session":
                raise SessionDomainError(
                    "INVALID_TRANSITION",
                    f"Session '{session_id}' is already closed; open a new session or submit an amendment.",
                    status_code=409,
                )

            if expected_seq is not None and int(expected_seq) != int(row["seq"]):
                raise SessionDomainError(
                    "INVALID_TRANSITION",
                    f"Stale sequence: expected seq={expected_seq}, session is at seq={row['seq']}.",
                    status_code=409,
                )

            if expected_step is not None and str(expected_step) != str(row["step_id"]):
                raise SessionDomainError(
                    "INVALID_TRANSITION",
                    f"Action targeted step '{expected_step}', while session is at step '{row['step_id']}'.",
                    status_code=409,
                )

            state_doc = json.loads(row["state_json"])
            prof = state_doc.get("profile_snapshot") or {}
            steps_by_id = {s["step_id"]: s for s in prof.get("procedure", {}).get("steps", [])}
            cur_step = str(row["step_id"])
            new_step = cur_step
            new_status = str(row["status"])
            asset_confirmed = int(row["asset_confirmed"])
            asset_tag = row["asset_tag"]
            serial_number = row["serial_number"]
            language = str(row["language"])
            now_utc = self._clock_utc()
            now_mono = float(self._monotonic())

            response_note: dict[str, Any] = {"action_applied": action}

            if action == "voice_utterance":
                utterance = str(payload.get("utterance") or payload.get("text") or "").strip()
                utt_id = str(payload.get("utterance_id") or "").strip() or None
                is_echo, echo_reason = self.is_tts_echo_or_duplicate(utterance, utt_id)
                if is_echo:
                    res = {
                        "ignored": True,
                        "reason": echo_reason,
                        "session": self._load_session_snapshot_unlocked(conn, session_id),
                    }
                    self._store_idempotency(conn, f"action:{session_id}", idem_key, canonical_req, res)
                    return res

                parsed_intent = classify_bilingual_voice_intent(utterance, current_language=language)
                if parsed_intent.get("ambiguous"):
                    res = {
                        "ignored": False,
                        "clarification_required": True,
                        "clarification_reason": parsed_intent.get("clarification_reason"),
                        "parsed_intent": parsed_intent,
                        "session": self._load_session_snapshot_unlocked(conn, session_id),
                    }
                    self._store_idempotency(conn, f"action:{session_id}", idem_key, canonical_req, res)
                    return res

                action = str(parsed_intent["intent"])
                actor = "voice_operator"
                payload = {**payload, **parsed_intent}
                response_note["parsed_intent"] = parsed_intent

            if action == "switch_language":
                target_lang = str(payload.get("target_language") or payload.get("language") or "en").lower()
                if target_lang not in ("en", "es"):
                    raise SessionDomainError("UNSUPPORTED_LANGUAGE", f"Unsupported language '{target_lang}'", status_code=400)
                language = target_lang
                self.preferred_language = target_lang
                response_note["language"] = language

            elif action == "confirm_identity":
                asset_tag = str(payload.get("asset_tag") or asset_tag or "").strip() or None
                serial_number = str(payload.get("serial_number") or serial_number or "").strip() or None
                if not prof.get("identity_pending"):
                    asset_confirmed = 1
                if cur_step == "identify" and "as_found" in steps_by_id.get(cur_step, {}).get("allowed_transitions", []):
                    new_step = "as_found"

            elif action == "record_as_found":
                comm_state = str(payload.get("communication") or "pending").strip()
                obs_text = str(payload.get("observation") or "").strip()
                state_doc["as_found"] = {
                    "recorded_at_utc": now_utc,
                    "communication": comm_state,
                    "observation": obs_text,
                    "photo_absence_reason": payload.get("photo_absence_reason"),
                }
                if cur_step == "as_found":
                    new_step = "inspect"

            elif action in ("highlight_component", "inspect_component"):
                comp_id = str(payload.get("component_3d_id") or steps_by_id.get(cur_step, {}).get("component_3d_id") or "")
                valid_zones = {
                    "strainer_head",
                    "upper_seal_ring",
                    "upper_barrel_dip",
                    "mounting_flange",
                    "lower_barrel_rs485",
                    "waterproof_gland_leads",
                }
                if prof.get("identity_pending") or comp_id not in valid_zones:
                    comp_id = ""
                step_cites = (prof.get("references", {}).get("step_citations", {}).get(cur_step) or [])
                req_pages = [int(c["page"]) for c in step_cites] or ([5] if comp_id == "upper_barrel_dip" else [1])
                cit_res = verify_and_resolve_citations(prof, req_pages, project_root=self.project_root)
                response_note["component_3d_id"] = comp_id or None
                response_note["citations_verification"] = cit_res

            elif action == "show_manual":
                page_num = int(payload.get("page") or 1)
                cat_ctx = state_doc.get("catalog_context") or {}
                if cat_ctx.get("content_origin") == "catalog" and cat_ctx.get("manifest_sha256"):
                    max_p = int(state_doc.get("max_manual_page_count") or 9)
                    m_sha = str(cat_ctx["manifest_sha256"])
                    if page_num < 1 or page_num > max_p:
                        cit_res = {
                            "verified": False,
                            "error_code": "PAGE_OUT_OF_RANGE",
                            "instruction_blocked": True,
                            "citations": [],
                            "missing_pages": [page_num],
                        }
                    else:
                        try:
                            _ = self.catalog_store.get_installed_package(m_sha)
                            cit_res = {
                                "verified": True,
                                "instruction_blocked": False,
                                "citations": [{"page": page_num, "manifest_sha256": m_sha}],
                                "missing_pages": [],
                            }
                        except CatalogDomainError:
                            cit_res = {
                                "verified": False,
                                "error_code": "HISTORICAL_SOURCE_UNAVAILABLE",
                                "instruction_blocked": True,
                                "citations": [],
                                "missing_pages": [page_num],
                            }
                else:
                    cit_res = verify_and_resolve_citations(prof, [page_num], project_root=self.project_root)
                response_note["citations_verification"] = cit_res

            elif action == "execute_procedure_step":
                inst_id = str(payload.get("instruction_id") or "").strip()
                if not inst_id:
                    raise SessionDomainError("MISSING_INSTRUCTION_ID", "execute_procedure_step requires instruction_id.", status_code=400)
                cat_ctx = state_doc.get("catalog_context") or {}
                c_prod = str(cat_ctx.get("product_id") or row["profile_id"] or "tzone_tht02")
                c_var = str(cat_ctx.get("variant_id") or "bundled_v1_1")
                revocations = self.catalog_store.get_revoked_instructions(c_prod, c_var)
                rev_hit = next((r for r in revocations if str(r.get("instruction_id")) == inst_id), None)
                if rev_hit is not None:
                    raise SessionDomainError(
                        "INSTRUCTION_REVOKED",
                        f"Instruction '{inst_id}' is revoked ({rev_hit.get('reason', 'safety/technical revocation')}) and cannot be executed.",
                        status_code=409,
                        details={"instruction_id": inst_id, "revocation": rev_hit},
                    )
                response_note["executed_instruction_id"] = inst_id

            elif action == "read_current":
                snap_tmp = self._load_session_snapshot_unlocked(conn, session_id)
                response_note["freshness"] = self.evaluate_sample_freshness(snap_tmp)

            elif action == "repeat_step":
                step_meta = steps_by_id.get(cur_step, {})
                response_note["step_info"] = step_meta

            elif action in ("start_readonly_check", "request_capture"):
                response_note["ready_for_execution"] = True

            elif action == "record_observation":
                note_txt = str(payload.get("note_text") or payload.get("observation") or "").strip()
                if note_txt:
                    state_doc["observations"].append(
                        {"recorded_at_utc": now_utc, "step_id": cur_step, "actor": actor, "text": note_txt}
                    )

            elif action == "request_confirmation":
                token = f"cfm-{uuid.uuid4().hex[:8]}"
                state_doc["pending_confirmation_token"] = {
                    "token": token,
                    "created_at_utc": now_utc,
                    "step_id": cur_step,
                    "proposed_change": str(payload.get("proposed_change") or payload.get("utterance") or ""),
                }
                response_note["confirmation_required"] = True
                response_note["confirmation_token"] = token

            elif action == "confirm_physical_change":
                # Voice actors CANNOT directly commit a physical change without a confirmation token (`VOZ-07`, `Fase 1.5`)
                provided_tok = payload.get("confirmation_token")
                pending = state_doc.get("pending_confirmation_token")
                if actor == "voice_operator" and (not pending or provided_tok != pending.get("token")):
                    raise SessionDomainError(
                        "CONFIRMATION_REQUIRED",
                        "Spoken physical change requires separate explicit operator confirmation.",
                        status_code=409,
                    )
                if not payload.get("confirmed", True):
                    raise SessionDomainError("CONFIRMATION_DECLINED", "Technician did not confirm change.", status_code=400)

                change_desc = str(payload.get("action_taken") or payload.get("description") or "").strip()
                observed = str(payload.get("observed") or "").strip()
                if not change_desc:
                    raise SessionDomainError(
                        "MISSING_CHANGE_DESCRIPTION",
                        "Physical change confirmation requires `action_taken` description.",
                        status_code=400,
                    )
                # If technician modified hardware before recording `as_found`, mark `as_found` pending (`Fase 3.2.2`)
                if state_doc.get("as_found") is None:
                    state_doc["as_found"] = {
                        "recorded_at_utc": now_utc,
                        "communication": "pending_not_captured_before_change",
                        "pending": True,
                    }
                    state_doc["partial_close"] = True

                change_entry = {
                    "change_id": f"chg-{uuid.uuid4().hex[:8]}",
                    "confirmed_at_utc": now_utc,
                    "step_id": cur_step,
                    "confirmed_by": str(payload.get("technician_id") or "bench_technician"),
                    "observed": observed,
                    "action_taken": change_desc,
                }
                state_doc["confirmed_changes"].append(change_entry)
                state_doc["pending_confirmation_token"] = None
                response_note["confirmed_change"] = change_entry

            elif action == "advance_step":
                target_step = str(payload.get("target_step") or "").strip()
                allowed = steps_by_id.get(cur_step, {}).get("allowed_transitions", [])
                if target_step not in allowed:
                    raise SessionDomainError(
                        "INVALID_TRANSITION",
                        f"Cannot transition from '{cur_step}' to '{target_step}'; allowed: {allowed}.",
                        status_code=409,
                    )
                new_step = target_step

            elif action == "close_session":
                snap_now = self._load_session_snapshot_unlocked(conn, session_id)
                fresh_info = self.evaluate_sample_freshness(snap_now)
                missing_ev: list[str] = []
                if row["identity_pending"] or not asset_confirmed:
                    missing_ev.append("verified_asset_identity")
                if state_doc.get("as_found") is None or (state_doc.get("as_found") or {}).get("pending"):
                    missing_ev.append("initial_as_found_state")
                if not state_doc.get("evidence_files"):
                    missing_ev.append("inspection_photo_evidence")
                if not fresh_info["fresh"] and not bool(row["simulation"]):
                    missing_ev.append("fresh_physical_modbus_sample")
                # If a physical change was confirmed, final verification sample must be newer than the change (`FLU-02`)
                if state_doc.get("confirmed_changes"):
                    last_chg_ts = state_doc["confirmed_changes"][-1]["confirmed_at_utc"]
                    last_smp_ts = (state_doc.get("last_valid_sample") or {}).get("captured_at_utc") or ""
                    if not last_smp_ts or last_smp_ts < last_chg_ts:
                        missing_ev.append("post_change_modbus_verification")

                is_partial = len(missing_ev) > 0 or bool(payload.get("force_partial", False))
                state_doc["partial_close"] = is_partial
                state_doc["missing_evidence"] = missing_ev
                state_doc["as_left"] = {
                    "recorded_at_utc": now_utc,
                    "sample_freshness": fresh_info,
                    "confirmed_changes_count": len(state_doc["confirmed_changes"]),
                    "summary": str(
                        payload.get("summary")
                        or (
                            "Simulation walkthrough completed (synthetic data only)."
                            if bool(row["simulation"])
                            else (
                                f"Partial maintenance record closed; pending: {', '.join(missing_ev)}."
                                if is_partial
                                else "Bench inspection completed: sensor responded on Modbus within verified scope."
                            )
                        )
                    ),
                }
                new_step = "close"
                new_status = "closed"

            elif action == "amend_closed_session":
                amendment_note = str(payload.get("amendment_note") or "").strip()
                if not amendment_note:
                    raise SessionDomainError("MISSING_AMENDMENT_NOTE", "Amendment requires `amendment_note`.", status_code=400)
                amendments = state_doc.setdefault("amendments", [])
                amendments.append(
                    {
                        "amended_at_utc": now_utc,
                        "actor": actor,
                        "note": amendment_note,
                        "previous_seq": int(row["seq"]),
                    }
                )
            else:
                raise SessionDomainError("UNKNOWN_ACTION", f"Unsupported session action '{action}'", status_code=400)

            next_seq = int(row["seq"]) + 1
            ev_id = f"evt-{uuid.uuid4().hex[:12]}"
            conn.execute(
                """
                INSERT INTO session_events (
                    session_id, seq, event_id, kind, step_id, occurred_at_utc,
                    monotonic_s, boot_id, source, actor, simulation, payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    next_seq,
                    ev_id,
                    f"action.{action}",
                    new_step,
                    now_utc,
                    now_mono,
                    PROCESS_BOOT_ID,
                    "simulation" if bool(row["simulation"]) else "session_engine",
                    actor,
                    int(row["simulation"]),
                    json.dumps(response_note, default=str),
                ),
            )
            conn.execute(
                """
                UPDATE sessions
                SET seq = ?, step_id = ?, status = ?, asset_tag = ?, serial_number = ?,
                    asset_confirmed = ?, language = ?, updated_at_utc = ?, state_json = ?
                WHERE session_id = ?
                """,
                (
                    next_seq,
                    new_step,
                    new_status,
                    asset_tag,
                    serial_number,
                    asset_confirmed,
                    language,
                    now_utc,
                    json.dumps(state_doc),
                    session_id,
                ),
            )

            updated_snap = self._load_session_snapshot_unlocked(conn, session_id)
            out = {
                "ok": True,
                "event_id": ev_id,
                "seq": next_seq,
                **response_note,
                "session": updated_snap,
            }
            self._store_idempotency(conn, f"action:{session_id}", idem_key, canonical_req, out)
            return out

    def export_session_dossier(self, session_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        """Generate consistent atomic PDF + JSON + ZIP maintenance dossier (`EXP-01..07`)."""
        body = payload or {}
        idem_key = str(body.get("idempotency_key") or "").strip() or None
        audience = str(body.get("audience") or "private_bench").strip().lower()
        supersedes_id = str(body.get("supersedes_export_id") or "").strip() or None

        with self._lock, self._connect_db() as conn:
            snap = self._load_session_snapshot_unlocked(conn, session_id)
            session_seq = int(snap["seq"])
            canonical_req = {
                "session_id": session_id,
                "session_seq": session_seq,
                "audience": audience,
                "supersedes_export_id": supersedes_id,
            }

            replay = self._check_idempotency(conn, f"export:{session_id}", idem_key, canonical_req)
            if replay is not None:
                return replay

            # Automatic idempotency on identical `(session_id, session_seq, audience)` (`EXP-07`)
            existing_row = conn.execute(
                """
                SELECT manifest_json FROM session_exports
                WHERE session_id = ? AND session_seq = ? AND export_profile LIKE ?
                ORDER BY created_at_utc DESC LIMIT 1
                """,
                (session_id, session_seq, f"%:{audience}"),
            ).fetchone()
            if existing_row is not None and not supersedes_id:
                existing_manifest = json.loads(existing_row["manifest_json"])
                if Path(existing_manifest["pdf_path"]).is_file() and Path(existing_manifest["json_path"]).is_file():
                    existing_manifest["idempotent_replay"] = True
                    return existing_manifest

            self._ensure_disk_space()
            freshness = self.evaluate_sample_freshness(snap)
            is_sim = bool(snap["simulation"])
            export_kind = "simulated_demo" if is_sim else "intervention"
            prefix = "SIMULATION_" if is_sim else ""
            export_id = f"exp-{session_id}-r{session_seq}-{audience[:4]}"
            stem = f"{prefix}fieldscan_{session_id}_seq{session_seq}_{audience}"

            serial_out = (
                mask_serial_for_public(snap.get("serial_number"))
                if audience == "public_demo"
                else snap.get("serial_number")
            )
            now_utc = self._clock_utc()

            state_doc = snap["state"]
            confirmed_changes = list(state_doc.get("confirmed_changes") or [])
            evidence_files = list(state_doc.get("evidence_files") or [])
            missing_ev = list(state_doc.get("missing_evidence") or [])
            if not is_sim and not freshness["fresh"] and "fresh_physical_modbus_sample" not in missing_ev:
                # If session wasn't closed yet, compute live completeness accurately (`DAT-03`, `DAT-04`)
                if not state_doc.get("as_left"):
                    missing_ev.append("fresh_physical_modbus_sample")
            is_partial = bool(state_doc.get("partial_close")) or len(missing_ev) > 0

            dossier_record: dict[str, Any] = {
                "schema_version": 1,
                "contract_version": CONTRACT_VERSION,
                "export_id": export_id,
                "supersedes_export_id": supersedes_id,
                "generated_at_utc": now_utc,
                "export_profile": export_kind,
                "audience": audience,
                "simulation": is_sim,
                "simulation_banner": "SIMULATION MODE — SYNTHETIC DATA ONLY (DOES NOT VERIFY HARDWARE)" if is_sim else None,
                "partial_report": is_partial,
                "pending_evidence": missing_ev,
                "session_id": session_id,
                "session_seq": session_seq,
                "session_status": snap["status"],
                "step_id": snap["step_id"],
                "build_id": snap["build_id"],
                "device": {
                    "profile_id": snap["profile_id"],
                    "profile_revision": snap["profile_revision"],
                    "profile_sha256": snap["profile_sha256"],
                    "manual_sha256": snap["manual_sha256"],
                    "identity_pending": snap["identity_pending"],
                    "asset_tag": snap["asset_tag"],
                    "serial_number": serial_out,
                    "asset_confirmed": snap["asset_confirmed"],
                },
                "catalog_context": snap["catalog_context"],
                "historical_source_status": snap["historical_source_status"],
                "revoked_instructions": snap["revoked_instructions"],
                "evidence_states_legend": {
                    "documented": "Verified product manual or cryptographically signed catalog package",
                    "simulated": "Visual 3D twin or DIP simulation only (zero Modbus/hardware mutation)",
                    "observed": "Operator or physical camera observation recorded in session",
                    "measured": "Verified read-only Modbus response from physical sensor",
                },
                "scope_limitations": {
                    "verified_scope": "simulation" if is_sim else ("partial_observation" if is_partial else "sensor_communication"),
                    "plc_verified": False,
                    "scada_verified": False,
                    "calibrated_against_reference": False,
                },
                "as_found": state_doc.get("as_found"),
                "as_left": state_doc.get("as_left"),
                "latest_sample_evaluation": freshness,
                "confirmed_changes": confirmed_changes,
                "observations": state_doc.get("observations") or [],
                "evidence_catalog": evidence_files,
                "events": snap["events"],
            }

            json_path = self.exports_dir / f"{stem}.json"
            pdf_path = self.exports_dir / f"{stem}.pdf"
            zip_path = self.exports_dir / f"{stem}.zip"

            json_tmp = self.exports_dir / f"{stem}.json.tmp"
            pdf_tmp = self.exports_dir / f"{stem}.pdf.tmp"
            zip_tmp = self.exports_dir / f"{stem}.zip.tmp"

            # 1. Write & verify JSON snapshot atomically
            json_bytes = (json.dumps(dossier_record, indent=2, default=str) + "\n").encode("utf-8")
            json_tmp.write_bytes(json_bytes)
            _ = json.loads(json_tmp.read_text(encoding="utf-8"))
            json_sha = sha256_file(json_tmp)

            # 2. Render & verify multi-page PDF from the exact same `dossier_record` (`EXP-01`, `Fase 6.1.4`)
            pdf_bytes = self._render_dossier_pdf_bytes(dossier_record)
            pdf_tmp.write_bytes(pdf_bytes)
            with pymupdf.open(stream=pdf_tmp.read_bytes(), filetype="pdf") as check_doc:
                if len(check_doc) < 1:
                    raise SessionDomainError("PDF_GENERATION_FAILED", "Generated PDF had zero pages", status_code=500)
            pdf_sha = sha256_file(pdf_tmp)

            os.replace(json_tmp, json_path)
            os.replace(pdf_tmp, pdf_path)

            # 3. Build atomic ZIP archive containing JSON, PDF, and verified session photos
            catalog_files = [
                {"filename": json_path.name, "sha256": json_sha, "size_bytes": json_path.stat().st_size},
                {"filename": pdf_path.name, "sha256": pdf_sha, "size_bytes": pdf_path.stat().st_size},
            ]
            with zipfile.ZipFile(zip_tmp, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=1) as zf:
                zf.write(json_path, arcname=json_path.name)
                zf.write(pdf_path, arcname=pdf_path.name)
                for ev_photo in evidence_files:
                    orig_f = self.evidence_dir / str(ev_photo.get("original_filename") or "")
                    if orig_f.is_file() and sha256_file(orig_f) == ev_photo.get("original_sha256"):
                        zf.write(orig_f, arcname=f"evidence/{orig_f.name}")
                        catalog_files.append(
                            {
                                "filename": f"evidence/{orig_f.name}",
                                "sha256": ev_photo["original_sha256"],
                                "size_bytes": orig_f.stat().st_size,
                            }
                        )
            os.replace(zip_tmp, zip_path)
            zip_sha = sha256_file(zip_path)

            manifest = {
                "ok": True,
                "export_id": export_id,
                "supersedes_export_id": supersedes_id,
                "session_id": session_id,
                "session_seq": session_seq,
                "export_profile": export_kind,
                "audience": audience,
                "simulation": is_sim,
                "partial_report": is_partial,
                "pending_evidence": missing_ev,
                "confirmed_changes_count": len(confirmed_changes),
                "json_path": str(json_path.resolve()),
                "pdf_path": str(pdf_path.resolve()),
                "zip_path": str(zip_path.resolve()),
                "json_url": f"/exports/{json_path.name}",
                "pdf_url": f"/exports/{pdf_path.name}",
                "zip_url": f"/exports/{zip_path.name}",
                "json_sha256": json_sha,
                "pdf_sha256": pdf_sha,
                "zip_sha256": zip_sha,
                "files": catalog_files,
            }

            conn.execute(
                """
                INSERT OR REPLACE INTO session_exports (
                    export_id, session_id, session_seq, export_profile,
                    created_at_utc, supersedes_export_id, manifest_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    export_id,
                    session_id,
                    session_seq,
                    f"{export_kind}:{audience}",
                    now_utc,
                    supersedes_id,
                    json.dumps(manifest),
                ),
            )
            self._store_idempotency(conn, f"export:{session_id}", idem_key, canonical_req, manifest)
            return manifest

    def _render_dossier_pdf_bytes(self, record: dict[str, Any]) -> bytes:
        """Render a clean, readable maintenance dossier PDF directly from `record` via PyMuPDF."""
        doc = pymupdf.open()
        page = doc.new_page(width=595, height=842)  # A4 portrait

        is_sim = bool(record["simulation"])
        is_partial = bool(record["partial_report"])
        header_color = (0.55, 0.12, 0.12) if is_sim else ((0.55, 0.38, 0.05) if is_partial else (0.06, 0.24, 0.38))
        page.draw_rect(pymupdf.Rect(0, 0, 595, 70), color=header_color, fill=header_color)

        title = (
            "FIELDSCAN MAINTENANCE DOSSIER [SIMULATION MODE]"
            if is_sim
            else ("FIELDSCAN MAINTENANCE DOSSIER [PARTIAL REPORT]" if is_partial else "FIELDSCAN BENCH MAINTENANCE DOSSIER")
        )
        page.insert_text((28, 32), title, fontsize=14, color=(1, 1, 1))
        page.insert_text(
            (28, 52),
            f"Export ID: {record['export_id']}  |  Session: {record['session_id']} (seq {record['session_seq']})  |  UTC: {record['generated_at_utc']}",
            fontsize=8.5,
            color=(0.9, 0.95, 1.0),
        )

        lines: list[str] = []
        if is_sim:
            lines.append("NOTICE: GENERATED IN EXPLICIT SIMULATION MODE. SYNTHETIC DATA DOES NOT VERIFY PHYSICAL HARDWARE.")
            lines.append("")
        if is_partial:
            lines.append(f"PARTIAL REPORT STATUS: Pending evidence -> {', '.join(record['pending_evidence']) or 'incomplete step'}")
            lines.append("")

        dev = record["device"]
        cat_ctx = record.get("catalog_context") or {}
        hist_st = record.get("historical_source_status") or {}
        lines.extend(
            [
                "1. ASSET & PROFILE IDENTITY",
                f"   Profile ID & Revision : {dev['profile_id']} ({dev['profile_revision']})",
                f"   Content Origin        : {cat_ctx.get('content_origin', 'bundle')} | {cat_ctx.get('product_id', '')}/{cat_ctx.get('variant_id', '')} (seq {cat_ctx.get('publication_seq', 1)})",
                f"   Manifest / Profile SHA: {(cat_ctx.get('manifest_sha256') or dev['profile_sha256'] or '')[:24]}...",
                f"   Manual SHA-256        : {(dev['manual_sha256'] or 'N/A')[:24]}",
                f"   Source Availability   : {hist_st.get('state', 'available')} ({hist_st.get('message') or 'verified'})",
                f"   Asset Tag / Serial    : {dev['asset_tag'] or 'Unassigned'} / {dev['serial_number'] or 'Not recorded'}",
                f"   Identity Confirmed    : {dev['asset_confirmed']} (Identity Pending = {dev['identity_pending']})",
                "",
                "2. VERIFIED SCOPE & PROVENANCE BOUNDARIES",
                f"   Verified Scope        : {record['scope_limitations']['verified_scope']}",
                "   PLC / SCADA Verified  : False (Bench reader cannot accredit PLC or SCADA display)",
                "   Reference Calibration : Not Performed (Calibration & Verified Adjustment = Planned)",
                "",
                "3. INITIAL (AS-FOUND) & LATEST OBSERVATION",
                f"   As-Found Record       : {json.dumps(record['as_found'], default=str)}",
            ]
        )

        fresh = record["latest_sample_evaluation"]
        smp = fresh.get("sample")
        if smp:
            lines.append(
                f"   Latest Sample State   : {fresh['sample_state'].upper()} (fresh={fresh['fresh']}, reason={fresh.get('reason')})"
            )
            lines.append(f"   Captured UTC & Source : {smp.get('captured_at_utc')} via {smp.get('source')} ({smp.get('protocol')})")
            for m in smp.get("measurements", []):
                lines.append(
                    f"   Channel {m['quantity']:<18}: value={m['value']} {m['unit']} | quality={m['quality']} | raw={m.get('raw_hex')}"
                )
        else:
            lines.append("   Latest Sample State   : NONE (No valid Modbus response recorded in session)")

        lines.append("")
        lines.append(f"4. CONFIRMED PHYSICAL CHANGES ({len(record['confirmed_changes'])})")
        if not record["confirmed_changes"]:
            lines.append("   None — Zero physical modifications performed during this session.")
        else:
            for idx, chg in enumerate(record["confirmed_changes"], start=1):
                lines.append(
                    f"   {idx}. [{chg['confirmed_at_utc']}] by {chg['confirmed_by']}: {chg['action_taken']} (Observed: {chg['observed']})"
                )

        lines.append("")
        lines.append(f"5. PHOTOGRAPHIC EVIDENCE CATALOG ({len(record['evidence_catalog'])})")
        if not record["evidence_catalog"]:
            lines.append("   None recorded.")
        else:
            for idx, ph in enumerate(record["evidence_catalog"], start=1):
                lines.append(
                    f"   {idx}. {ph['original_filename']} | origin={ph['evidence_origin']} | trigger={ph['capture_trigger']} | sha256={ph['original_sha256'][:16]}..."
                )

        lines.append("")
        lines.append("6. AS-LEFT SUMMARY & CLOSURE")
        lines.append(f"   {json.dumps(record.get('as_left') or {'status': 'open_snapshot'}, default=str)}")
        if record.get("supersedes_export_id"):
            lines.append(f"   Supersedes Export     : {record['supersedes_export_id']}")

        obs_list = record.get("observations") or []
        lines.append("")
        lines.append(f"7. TECHNICIAN OBSERVATIONS ({len(obs_list)})")
        if not obs_list:
            lines.append("   None recorded.")
        else:
            for idx, ob in enumerate(obs_list, start=1):
                lines.append(
                    f"   {idx}. [{ob.get('recorded_at_utc', '')}] ({ob.get('step_id', '')}) {ob.get('actor', '')}: {ob.get('text', '')}"
                )

        ev_list = record.get("events") or []
        lines.append("")
        lines.append(f"8. ORDERED SESSION EVENT TIMELINE ({len(ev_list)})")
        for ev in ev_list:
            lines.append(
                f"   seq={ev.get('seq')} | {ev.get('occurred_at_utc')} | {ev.get('kind')} | step={ev.get('step_id')} | actor={ev.get('actor')} | src={ev.get('source')}"
            )

        import textwrap

        y = 94.0
        for line in lines:
            if y > 795.0:
                page = doc.new_page(width=595, height=842)
                y = 42.0
            # Wrap long lines cleanly on word boundaries at 92 chars (`EXP-02`)
            chunks = textwrap.wrap(line, width=92, subsequent_indent="     ", break_long_words=True) if line.strip() else [""]
            for ch in chunks:
                if y > 795.0:
                    page = doc.new_page(width=595, height=842)
                    y = 42.0
                is_heading = bool(re.match(r"^[1-8]\.\s+[A-Z]", ch))
                page.insert_text(
                    (28, y),
                    ch,
                    fontsize=9.5 if is_heading else 8.5,
                    color=(0.08, 0.16, 0.28) if is_heading else (0.15, 0.18, 0.22),
                )
                y += 13.5

        out_buf = io.BytesIO()
        doc.save(out_buf)
        doc.close()
        return out_buf.getvalue()

    def _load_session_snapshot_unlocked(self, conn: sqlite3.Connection, session_id: str) -> dict[str, Any]:
        row = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
        if row is None:
            raise SessionDomainError("SESSION_NOT_FOUND", f"Unknown session '{session_id}'", status_code=404)

        ev_rows = conn.execute(
            "SELECT * FROM session_events WHERE session_id = ? ORDER BY seq ASC",
            (session_id,),
        ).fetchall()
        events: list[dict[str, Any]] = []
        for er in ev_rows:
            ev_data = json.loads(er["payload_json"])
            is_historical_boot = er["boot_id"] != PROCESS_BOOT_ID
            events.append(
                {
                    "seq": int(er["seq"]),
                    "event_id": er["event_id"],
                    "kind": er["kind"],
                    "step_id": er["step_id"],
                    "occurred_at_utc": er["occurred_at_utc"],
                    "source": er["source"],
                    "actor": er["actor"],
                    "simulation": bool(er["simulation"]),
                    "historical_from_prior_boot": is_historical_boot,
                    "payload": ev_data,
                }
            )

        state_doc = json.loads(row["state_json"])
        cat_ctx = state_doc.get("catalog_context") or {
            "product_id": row["profile_id"],
            "variant_id": "bundled_v1_1" if row["profile_id"] == "tzone_tht02" else "default",
            "publication_seq": 1 if row["profile_id"] == "tzone_tht02" else 0,
            "manifest_sha256": row["profile_sha256"],
            "local_profile_id": None if bool(row["identity_pending"]) else row["profile_id"],
            "content_origin": "bundle",
            "bench_modbus_homologated": not bool(row["identity_pending"]),
        }
        c_origin = str(cat_ctx.get("content_origin") or "bundle")
        c_prod = str(cat_ctx.get("product_id") or row["profile_id"])
        c_var = str(cat_ctx.get("variant_id") or "bundled_v1_1")
        if c_origin == "catalog" and cat_ctx.get("manifest_sha256"):
            try:
                _ = self.catalog_store.get_installed_package(str(cat_ctx["manifest_sha256"]))
                hist_status = {"available": True, "state": "available", "message": None}
            except CatalogDomainError:
                hist_status = {
                    "available": False,
                    "state": "historical_source_unavailable",
                    "message": "Historical source unavailable",
                }
        else:
            hist_status = {"available": True, "state": "bundled", "message": None}

        revocations = self.catalog_store.get_revoked_instructions(c_prod, c_var)
        rev_banner = (
            f"Safety/technical notice: {len(revocations)} instruction(s) in {c_prod}/{c_var} have been revoked by a newer catalog publication."
            if revocations
            else None
        )

        snap = {
            "contract_version": CONTRACT_VERSION,
            "session_id": row["session_id"],
            "created_at_utc": row["created_at_utc"],
            "updated_at_utc": row["updated_at_utc"],
            "status": row["status"],
            "step_id": row["step_id"],
            "seq": int(row["seq"]),
            "profile_id": row["profile_id"],
            "profile_revision": row["profile_revision"],
            "profile_sha256": row["profile_sha256"],
            "manual_sha256": row["manual_sha256"],
            "identity_pending": bool(row["identity_pending"]),
            "asset_tag": row["asset_tag"],
            "serial_number": row["serial_number"],
            "asset_confirmed": bool(row["asset_confirmed"]),
            "transport_mode": row["transport_mode"],
            "simulation": bool(row["simulation"]),
            "build_id": row["build_id"],
            "language": row["language"],
            "catalog_context": cat_ctx,
            "historical_source_status": hist_status,
            "revoked_instructions": revocations,
            "has_revoked_instructions": len(revocations) > 0,
            "revocation_banner": rev_banner,
            "state": state_doc,
            "events": events,
        }
        snap["freshness"] = self.evaluate_sample_freshness(snap)
        return snap
