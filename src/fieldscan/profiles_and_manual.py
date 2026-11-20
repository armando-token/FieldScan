"""Device Profile Registry, Verified Manual Citation Resolver & Resource Manifest Checker.

Implements Phase 3.1, Phase 4.7 (`VIS-10`), and Phase 6.2 (`OFF-08`) of the FieldScan specification:
- Loads versioned device profiles (`tzone_tht02`, `tzone_tht03r`) and handles unknown models safely
  (`unknown_pending_identity`, inhibiting automatic register scaling or foreign steps, `FLU-04`).
- Validates `THT02_Users_Manual_v1.1.pdf` SHA-256 and page existence (`1..9`) before serving any
  manual citation (`VIS-10`), blocking dependent instructions when a page or hash is unavailable.
- Verifies local offline `resource_manifest.json` integrity across static HMI, assets, and profiles.
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import re
from typing import Any
import unicodedata

PROJECT_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
PROFILES_DIR = KNOWLEDGE_DIR / "profiles"
MANUAL_INDEX_PATH = KNOWLEDGE_DIR / "manual_index.json"
MANIFEST_PATH = KNOWLEDGE_DIR / "resource_manifest.json"


def _normalize_token(raw: str) -> str:
    decomposed = unicodedata.normalize("NFKD", raw or "")
    ascii_only = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    return re.sub(r"[^a-z0-9]+", "", ascii_only)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_all_profiles(profiles_dir: Path = PROFILES_DIR) -> dict[str, dict[str, Any]]:
    profiles: dict[str, dict[str, Any]] = {}
    if not profiles_dir.is_dir():
        return profiles
    for fpath in sorted(profiles_dir.glob("*.json")):
        try:
            data = json.loads(fpath.read_text(encoding="utf-8"))
            pid = str(data.get("profile_id") or fpath.stem)
            data["_profile_sha256"] = sha256_file(fpath)
            data["_profile_path"] = str(fpath.relative_to(PROJECT_ROOT).as_posix()) if fpath.is_relative_to(PROJECT_ROOT) else str(fpath)
            profiles[pid] = data
        except Exception:
            continue
    return profiles


def resolve_device_profile(
    profile_or_model_query: str | None,
    *,
    profiles_dir: Path = PROFILES_DIR,
) -> dict[str, Any]:
    """Resolve a requested profile ID or model query into a validated profile or `unknown_pending_identity`."""
    profiles = load_all_profiles(profiles_dir)
    if not profile_or_model_query or not str(profile_or_model_query).strip():
        tht02 = copy.deepcopy(profiles.get("tzone_tht02", {}))
        tht02["identity_pending"] = False
        tht02["auto_decode_allowed"] = True
        return tht02

    raw = str(profile_or_model_query).strip()
    norm = _normalize_token(raw)

    # 1. Exact profile_id or sensor_id match
    for pid, prof in profiles.items():
        if norm in {_normalize_token(pid), _normalize_token(str(prof.get("sensor_id", "")))}:
            out = copy.deepcopy(prof)
            is_supported = out.get("validation_status") == "supported_bench_readonly"
            out["identity_pending"] = not is_supported
            out["auto_decode_allowed"] = is_supported
            return out

    # 2. Explicit alias check across registered profiles (check THT03R before generic substrings)
    for pid in ("tzone_tht03r", "tzone_tht02"):
        prof = profiles.get(pid)
        if not prof:
            continue
        aliases = [str(prof.get("model", "")), *(str(a) for a in prof.get("aliases", []))]
        for alias in aliases:
            na = _normalize_token(alias)
            if na and (norm == na or na in norm):
                out = copy.deepcopy(prof)
                is_supported = out.get("validation_status") == "supported_bench_readonly"
                out["identity_pending"] = not is_supported
                out["auto_decode_allowed"] = is_supported
                return out

    # 3. Unknown model (`FLU-04`): preserve manual observation & photo capability without foreign scaling
    raw_bytes = raw.encode("utf-8")
    return {
        "schema_version": 1,
        "profile_id": "unknown_pending_identity",
        "sensor_id": f"UNKNOWN:{raw[:32]}",
        "manufacturer": "Unverified Manufacturer",
        "model": raw[:64],
        "aliases": [],
        "compatible_revisions": [],
        "visible_manual_revision": None,
        "tested_profile_revision": "identity-pending",
        "validation_status": "identity_pending",
        "identity_pending": True,
        "auto_decode_allowed": False,
        "_profile_sha256": hashlib.sha256(raw_bytes).hexdigest(),
        "references": {
            "manual_document": None,
            "manual_version": None,
            "manual_sha256": None,
            "manual_page_count": 0,
            "step_citations": {},
        },
        "transport": {
            "supported_protocols": [],
            "pilot_readonly": True,
            "allowed_function_codes_pilot": [],
            "max_sample_age_s": 3.0,
        },
        "channels": [],
        "procedure": {
            "initial_step": "identify",
            "steps": [
                {
                    "step_id": "identify",
                    "title_en": "1. Pending Asset Identity (Manual Observation Only)",
                    "component_3d_id": None,
                    "preferred_roi": "full_sensor",
                    "accepts_auto_photo": False,
                    "required_for_full_close": ["verified_device_profile"],
                    "allowed_transitions": ["as_found", "close"],
                },
                {
                    "step_id": "as_found",
                    "title_en": "2. Record Manual Observation & Nameplate Photo",
                    "component_3d_id": None,
                    "preferred_roi": "full_sensor",
                    "accepts_auto_photo": False,
                    "required_for_full_close": ["verified_device_profile"],
                    "allowed_transitions": ["close"],
                },
                {
                    "step_id": "close",
                    "title_en": "3. Partial Report (Identity Pending)",
                    "component_3d_id": None,
                    "preferred_roi": "full_sensor",
                    "accepts_auto_photo": False,
                    "required_for_full_close": [],
                    "allowed_transitions": ["close"],
                },
            ],
        },
    }


def load_manual_index(index_path: Path = MANUAL_INDEX_PATH) -> dict[str, Any]:
    if not index_path.is_file():
        return {"page_count": 0, "pages": [], "pdf_sha256": None}
    return json.loads(index_path.read_text(encoding="utf-8"))


def verify_and_resolve_citations(
    profile: dict[str, Any],
    requested_pages: list[int],
    *,
    project_root: Path = PROJECT_ROOT,
    manual_index_path: Path = MANUAL_INDEX_PATH,
) -> dict[str, Any]:
    """Resolve manual citations strictly against verified local PDF hash and existing page assets (`VIS-10`)."""
    refs = profile.get("references") or {}
    expected_sha = refs.get("manual_sha256")
    manual_rel = str(refs.get("manual_document") or "").lstrip("/")

    if not manual_rel or not expected_sha:
        return {
            "verified": False,
            "error_code": "MANUAL_UNAVAILABLE",
            "reason": f"Profile '{profile.get('profile_id')}' has no verified local manual bundle.",
            "instruction_blocked": bool(requested_pages),
            "citations": [],
            "missing_pages": list(requested_pages),
        }

    pdf_path = project_root / manual_rel
    if not pdf_path.is_file():
        return {
            "verified": False,
            "error_code": "MANUAL_MISSING",
            "reason": f"Manual file '{manual_rel}' is missing on disk.",
            "instruction_blocked": True,
            "citations": [],
            "missing_pages": list(requested_pages),
        }

    actual_sha = sha256_file(pdf_path)
    if actual_sha != expected_sha:
        return {
            "verified": False,
            "error_code": "MANUAL_HASH_MISMATCH",
            "reason": (
                f"Manual SHA-256 mismatch for '{manual_rel}': "
                f"expected {expected_sha[:12]}..., observed {actual_sha[:12]}..."
            ),
            "instruction_blocked": True,
            "citations": [],
            "missing_pages": list(requested_pages),
        }

    idx = load_manual_index(manual_index_path)
    pages_by_num = {int(p["page"]): p for p in idx.get("pages", []) if "page" in p}

    resolved_citations: list[dict[str, Any]] = []
    missing_pages: list[int] = []

    for pnum in requested_pages:
        p_entry = pages_by_num.get(int(pnum))
        if p_entry is None:
            missing_pages.append(int(pnum))
            continue
        img_rel = str(p_entry.get("image_url") or "").lstrip("/")
        img_path = project_root / img_rel if img_rel else None
        if img_path is None or not img_path.is_file():
            missing_pages.append(int(pnum))
            continue
        sections = p_entry.get("sections") or []
        sec0 = sections[0] if sections else {}
        resolved_citations.append(
            {
                "page": int(pnum),
                "label": f"Page {pnum} · {p_entry.get('title', 'Manual V1.1')}",
                "section_id": sec0.get("section_id"),
                "heading": sec0.get("heading"),
                "verified_excerpt": sec0.get("verified_excerpt"),
                "image_url": p_entry.get("image_url"),
                "manual_revision": refs.get("manual_version", "V1.1"),
                "manual_sha256": actual_sha,
            }
        )

    return {
        "verified": len(missing_pages) == 0,
        "error_code": "MANUAL_PAGE_MISSING" if missing_pages else None,
        "reason": f"Requested manual page(s) {missing_pages} not present in {manual_rel}." if missing_pages else None,
        "instruction_blocked": len(missing_pages) > 0,
        "manual_sha256": actual_sha,
        "citations": resolved_citations,
        "missing_pages": missing_pages,
    }


def verify_resource_manifest(
    project_root: Path = PROJECT_ROOT,
    manifest_path: Path = MANIFEST_PATH,
) -> dict[str, Any]:
    """Verify SHA-256 hashes of local offline assets against `knowledge/resource_manifest.json` (`OFF-08`)."""
    if not manifest_path.is_file():
        return {
            "verified": False,
            "error_code": "MANIFEST_MISSING",
            "mismatches": ["knowledge/resource_manifest.json missing"],
            "tree_sha256": None,
        }
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    mismatches: list[str] = []
    files_map = manifest.get("files") or {}
    for rel, meta in files_map.items():
        fpath = project_root / rel
        if not fpath.is_file():
            mismatches.append(f"missing:{rel}")
            continue
        if sha256_file(fpath) != meta.get("sha256"):
            mismatches.append(f"hash_mismatch:{rel}")

    return {
        "verified": len(mismatches) == 0,
        "error_code": "MANIFEST_MISMATCH" if mismatches else None,
        "tree_sha256": manifest.get("tree_sha256"),
        "checked_files": len(files_map),
        "mismatches": mismatches,
    }
