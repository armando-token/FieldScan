"""Planned Extension: Calibration & Verified Adjustment (`CAL-00` through `CAL-09`).

Implements Section 12 of the FieldScan specification:
- In P0 event builds, the extension is explicitly surfaced as `Calibration & Verified Adjustment · Planned`
  (`CAL-00`), keeping TZONE devices strictly read-only (`writes_enabled = False`).
- Provides deterministic validation and read-only comparison logic for future bench/lab
  verification (`CAL-01..09`), including reference standard expiry checks, stability/time-skew
  gating, TZONE read-only delta calculation, documented multi-vendor offset conventions
  (NOVUS RHT Climate additive offset, Vaisala HMP multi-point sequence), and uncertain-link
  reconciliation locks—without ever emitting Modbus write frames in pilot mode.
"""

from __future__ import annotations

from datetime import datetime, timezone
import math
from typing import Any

EVENT_COPY_EN = (
    "FieldScan already guides inspection and reads our TZONE sensors over Modbus. "
    "Calibration and Verified Adjustment is a planned extension. It will compare a device "
    "against a reference and, on documented compatible models, apply and verify an adjustment."
)


def get_planned_calibration_card() -> dict[str, Any]:
    """Return the `CAL-00` informational payload for the HMI and `/api/capabilities`."""
    return {
        "feature_id": "calibration_and_verified_adjustment",
        "badge": "Calibration & Verified Adjustment · Planned",
        "status": "planned",
        "pilot_writes_enabled": False,
        "tzone_offset_write_supported": False,
        "event_summary_en": EVENT_COPY_EN,
        "tzone_scope_reason": (
            "Published TZONE TZ THT-02 / THT-03R manuals document communication baud rate (0x0005) "
            "as the only writable parameter and expose no temperature or relative humidity offset registers. "
            "FieldScan keeps TZONE sensors strictly read-only."
        ),
        "roadmap_stages": [
            {
                "stage": "C0",
                "title": "Planned Extension Informational Card (Active in P0)",
                "status": "active_informational",
                "detail": "Displays scope boundary between live read-only bench diagnostics and planned metrology workflow.",
            },
            {
                "stage": "C1",
                "title": "Read-Only Reference Standard Comparison",
                "status": "planned",
                "detail": "Logs reference instrument ID, certificate expiry, uncertainty, stability window, and read-only error delta.",
            },
            {
                "stage": "C2",
                "title": "Verified Single-Model Bench Adjustment (Candidate: NOVUS RHT Climate RS-485)",
                "status": "planned",
                "detail": "Requires verified register map, human confirmation of single bounded offset write, readback, and post-adjustment as_left check.",
            },
            {
                "stage": "C3",
                "title": "Multi-Vendor Profile Adapter (Candidate: Vaisala HMP Series)",
                "status": "planned",
                "detail": "Reuses session contract with model-specific two-point/command adapter on dedicated calibration bench.",
            },
            {
                "stage": "C4",
                "title": "Laboratory Calibration Procedure Integration",
                "status": "planned",
                "detail": "Exports traceable comparison records governed by approved laboratory metrology procedures.",
            },
        ],
    }


SUPPORTED_COMPATIBLE_ADJUSTMENT_PROFILES: dict[str, dict[str, Any]] = {
    "tzone_tht02": {
        "supports_adjustment": False,
        "unit_map": {"temperature": "Cel", "relative_humidity": "%RH"},
        "tolerance": {"temperature": 0.3, "relative_humidity": 2.0},
    },
    "novus_rht_climate_lab": {
        "supports_adjustment": True,
        "adjustment_convention": "additive_user_offset",
        "offset_bounds": {"temperature": (-5.0, 5.0), "relative_humidity": (-10.0, 10.0)},
        "scale_lsb": 0.1,
        "unit_map": {"temperature": "Cel", "relative_humidity": "%RH"},
        "tolerance": {"temperature": 0.3, "relative_humidity": 1.8},
        "persists_across_reboot": True,
    },
    "vaisala_hmp110_lab": {
        "supports_adjustment": True,
        "adjustment_convention": "two_point_reference_sequence",
        "offset_bounds": {"temperature": (-3.0, 3.0), "relative_humidity": (-8.0, 8.0)},
        "scale_lsb": 0.01,
        "unit_map": {"temperature": "Cel", "relative_humidity": "%RH"},
        "tolerance": {"temperature": 0.2, "relative_humidity": 1.5},
        "persists_across_reboot": True,
    },
}


def evaluate_calibration_comparison_contract(payload: dict[str, Any]) -> dict[str, Any]:
    """Deterministic metrology & safety gate covering `CAL-01`..`CAL-09` (read-only / lab fixture contract).

    Never emits hardware writes; returns structured proposals, blocks, and reconciliation requirements.
    """
    profile_id = str(payload.get("profile_id") or "tzone_tht02").strip()
    prof = SUPPORTED_COMPATIBLE_ADJUSTMENT_PROFILES.get(profile_id)
    if prof is None:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "UNSUPPORTED_PROFILE",
            "missing_or_invalid_fields": ["profile_id"],
            "message": f"Profile '{profile_id}' has no validated metrology definition.",
        }

    quantity = str(payload.get("quantity") or "temperature").strip()
    expected_unit = prof["unit_map"].get(quantity)
    ref = payload.get("reference") or {}
    uut = payload.get("uut") or {}

    # 1. Validate reference standard metadata, certificate expiry, and unit compatibility (`CAL-01`, `CAL-09`)
    missing: list[str] = []
    for req_key in ("instrument_id", "certificate_id", "valid_until_utc", "uncertainty", "unit", "samples"):
        if ref.get(req_key) in (None, "", []):
            missing.append(f"reference.{req_key}")
    for req_key in ("unit", "samples"):
        if uut.get(req_key) in (None, "", []):
            missing.append(f"uut.{req_key}")

    if payload.get("voice_ambiguous") or ref.get("unit_confirmed") is False:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "CLARIFICATION_REQUIRED",
            "missing_or_invalid_fields": ["reference.unit_confirmation"],
            "message": "Spoken or ambiguous reference value lacks confirmed unit; clarify value and unit before comparison.",
        }

    if missing:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "INCOMPLETE_REFERENCE_RECORD",
            "missing_or_invalid_fields": missing,
            "message": f"Reference record incomplete: missing {', '.join(missing)}.",
        }

    if ref.get("unit") != expected_unit or uut.get("unit") != expected_unit:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "INCOMPATIBLE_UNIT",
            "missing_or_invalid_fields": ["unit"],
            "message": f"Unit mismatch: expected '{expected_unit}', got ref='{ref.get('unit')}', uut='{uut.get('unit')}'.",
        }

    now_str = str(payload.get("evaluated_at_utc") or "2026-11-19T00:00:00Z")
    now_dt = datetime.fromisoformat(now_str.replace("Z", "+00:00")).astimezone(timezone.utc)
    exp_dt = datetime.fromisoformat(str(ref["valid_until_utc"]).replace("Z", "+00:00")).astimezone(timezone.utc)
    if exp_dt < now_dt:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "REFERENCE_EXPIRED",
            "missing_or_invalid_fields": ["reference.valid_until_utc"],
            "message": f"Reference certificate '{ref['certificate_id']}' expired at {ref['valid_until_utc']}.",
        }

    # 2. Check uncertain link lock (`CAL-06`)
    if payload.get("prior_write_link_dropped") and not payload.get("reconciled_parameter_readback"):
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "UNCERTAIN_RESULT_RECONCILIATION_REQUIRED",
            "reconciliation_required": True,
            "retry_blocked": True,
            "message": "Link dropped after parameter transmission: result is uncertain. Read back stored parameter before any retry.",
        }

    # 3. Check stability window & timestamp skew (`CAL-02`)
    ref_samples = [float(s["value"]) for s in ref["samples"]]
    uut_samples = [float(s["value"]) for s in uut["samples"]]
    ref_times = [float(s.get("ts_s", idx)) for idx, s in enumerate(ref["samples"])]
    uut_times = [float(s.get("ts_s", idx)) for idx, s in enumerate(uut["samples"])]

    max_skew_s = float(payload.get("max_allowed_skew_s", 5.0))
    max_spread = float(payload.get("max_stability_spread", 0.25 if quantity == "temperature" else 1.0))

    observed_skew_s = abs((sum(ref_times) / len(ref_times)) - (sum(uut_times) / len(uut_times)))
    ref_spread = max(ref_samples) - min(ref_samples)
    uut_spread = max(uut_samples) - min(uut_samples)

    if observed_skew_s > max_skew_s or ref_spread > max_spread or uut_spread > max_spread:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "INDETERMINATE_UNSTABLE_OR_SKEWED",
            "observed_skew_s": round(observed_skew_s, 3),
            "ref_spread": round(ref_spread, 4),
            "uut_spread": round(uut_spread, 4),
            "message": "Environment not yet at equilibrium or sample timestamps exceed allowed skew; comparison indeterminate.",
        }

    ref_mean = round(sum(ref_samples) / len(ref_samples), 3)
    uut_mean = round(sum(uut_samples) / len(uut_samples), 3)
    error_uut_minus_ref = round(uut_mean - ref_mean, 3)
    correction_needed = round(ref_mean - uut_mean, 3)
    tol = float(prof["tolerance"][quantity])
    within_tol = abs(error_uut_minus_ref) <= tol

    # 4. Multi-point check (`CAL-08`)
    secondary_point = payload.get("second_point")
    if isinstance(secondary_point, dict):
        p2_ref = float(secondary_point["ref_value"])
        p2_uut = float(secondary_point["uut_value"])
        p2_err = round(p2_uut - p2_ref, 3)
        non_linearity = round(abs(p2_err - error_uut_minus_ref), 3)
        p2_residual_after_single_offset = round(p2_err + correction_needed, 3)
        if abs(p2_residual_after_single_offset) > tol or non_linearity > tol:
            return {
                "extension_status": "planned",
                "proposal_allowed": False,
                "writes_emitted": 0,
                "status_code": "NONLINEAR_OR_RESIDUAL_OUT_OF_CRITERIA",
                "claimed_calibrated": False,
                "point_1_error": error_uut_minus_ref,
                "point_2_error": p2_err,
                "residual_at_point_2": p2_residual_after_single_offset,
                "message": "Two-point verification shows slope/non-linear deviation exceeding single-offset criteria; review required.",
            }

    # 5. Read-only TZONE comparison (`CAL-03`)
    if not prof["supports_adjustment"]:
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "READONLY_COMPARISON_COMPLETE",
            "scope": "single_point_readonly_comparison",
            "claimed_calibrated": False,
            "evaluated_at_utc": now_str,
            "quantity": quantity,
            "unit": expected_unit,
            "reference_mean": ref_mean,
            "uut_as_found_mean": uut_mean,
            "error_uut_minus_ref": error_uut_minus_ref,
            "within_profile_tolerance": within_tol,
            "method": "simultaneous_bench_comparison_readonly",
            "message": "Read-only comparison recorded for TZONE sensor; device exposes no offset adjustment register.",
        }

    # 6. Compatible lab profile conceptual/bench proposal (`CAL-04`, `CAL-05`, `CAL-07`, `CAL-09`)
    prior_offset = float(payload.get("prior_device_offset", 0.0))
    lo_bound, hi_bound = prof["offset_bounds"][quantity]
    new_total_offset = round(prior_offset + correction_needed, 3)
    if not (lo_bound <= new_total_offset <= hi_bound) or math.isnan(new_total_offset):
        return {
            "extension_status": "planned",
            "proposal_allowed": False,
            "writes_emitted": 0,
            "status_code": "OFFSET_OUT_OF_PROFILE_BOUNDS",
            "proposed_offset": new_total_offset,
            "allowed_bounds": [lo_bound, hi_bound],
            "message": f"Proposed offset {new_total_offset} {expected_unit} exceeds profile bounds [{lo_bound}, {hi_bound}].",
        }

    lsb = float(prof["scale_lsb"])
    raw_register_int = int(round(new_total_offset / lsb))

    result: dict[str, Any] = {
        "extension_status": "planned",
        "proposal_allowed": True,
        "writes_emitted": 0,
        "requires_human_confirmation": True,
        "claimed_calibrated": False,
        "status_code": "LAB_ADJUSTMENT_PROPOSAL_READY",
        "profile_id": profile_id,
        "convention": prof["adjustment_convention"],
        "quantity": quantity,
        "unit": expected_unit,
        "as_found_uut_mean": uut_mean,
        "reference_mean": ref_mean,
        "as_found_error": error_uut_minus_ref,
        "prior_device_offset": prior_offset,
        "proposed_device_offset": new_total_offset,
        "proposed_register_raw_int": raw_register_int,
    }

    # Optional post-adjustment & reboot verification stage (`CAL-05`, `CAL-07`)
    if payload.get("human_confirmed") and payload.get("as_left_uut_mean") is not None:
        as_left = float(payload["as_left_uut_mean"])
        persisted_offset = payload.get("readback_offset_after_reboot", payload.get("readback_offset"))
        residual_error = round(as_left - ref_mean, 3)
        persistence_ok = persisted_offset is not None and abs(float(persisted_offset) - new_total_offset) <= (lsb + 1e-6)
        result.update(
            {
                "status_code": "VERIFIED_ADJUSTMENT_PASS"
                if (abs(residual_error) <= tol and persistence_ok)
                else "POST_ADJUSTMENT_REVIEW_REQUIRED",
                "human_confirmed": True,
                "as_found_preserved": uut_mean,
                "readback_offset": persisted_offset,
                "persistence_verified": persistence_ok,
                "as_left_uut_mean": as_left,
                "residual_error": residual_error,
                "within_tolerance_as_left": abs(residual_error) <= tol,
            }
        )

    return result
