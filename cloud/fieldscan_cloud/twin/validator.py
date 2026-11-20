"""Khronos glTF 2.0 Validator wrapper and FieldScan semantic twin checks (Megaplan §10.3)."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import struct
import subprocess
from typing import Any

MAX_GLB_BYTES_BUDGET = 20 * 1024 * 1024  # 20 MiB E1 baseline budget (§10.2)


@dataclass(frozen=True)
class TwinValidationReport:
    valid: bool
    khronos_exit_code: int
    khronos_errors: int
    khronos_warnings: int
    khronos_report: dict[str, Any]
    semantic_errors: list[str]
    reason_codes: list[str]
    glb_byte_count: int
    node_names: list[str]


def parse_glb_json_chunk(glb_path: Path) -> dict[str, Any]:
    """Read the JSON chunk (chunk 0) directly from a GLB 2.0 binary container."""
    raw = glb_path.read_bytes()
    if len(raw) < 20:
        raise ValueError("GLB file too small")
    magic, version, total_len = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"Not a valid glTF 2.0 GLB container (magic={magic!r}, version={version})")
    if total_len != len(raw):
        raise ValueError(f"GLB header length {total_len} != actual file size {len(raw)}")
    chunk_len, chunk_type = struct.unpack_from("<I4s", raw, 12)
    if chunk_type != b"JSON":
        raise ValueError("First GLB chunk is not JSON")
    json_bytes = raw[20 : 20 + chunk_len]
    return json.loads(json_bytes.decode("utf-8"))


def run_khronos_validator(
    glb_path: Path,
    *,
    validator_bin: Path,
    report_out_path: Path | None = None,
) -> tuple[int, dict[str, Any]]:
    """Run Khronos gltf_validator -o and capture exit code and JSON report separately (§10.3)."""
    proc = subprocess.run(
        [str(validator_bin), "-o", str(glb_path)],
        shell=False,
        check=False,
        capture_output=True,
        text=True,
        timeout=60,
    )
    try:
        report = json.loads(proc.stdout)
    except Exception:
        report = {
            "issues": {"numErrors": 1, "numWarnings": 0, "messages": []},
            "raw_stdout": proc.stdout[:1000],
            "raw_stderr": proc.stderr[:1000],
        }
    if report_out_path is not None:
        report_out_path.parent.mkdir(parents=True, exist_ok=True)
        report_out_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    return proc.returncode, report


def validate_twin_bundle(
    *,
    glb_path: Path,
    parts_json: dict[str, Any],
    actions_json: dict[str, Any],
    validator_bin: Path,
    document_page_count: int | None = None,
    control_measurements_m: dict[str, float] | None = None,
    bounds_m: list[list[float]] | None = None,
    report_out_path: Path | None = None,
) -> TwinValidationReport:
    """
    Validate glTF conformity + FieldScan semantic guarantees (CL-CAD-01, CL-CAD-02, CL-DOC-02).
    """
    semantic_errors: list[str] = []
    reason_codes: list[str] = []

    glb_size = glb_path.stat().st_size
    if glb_size > MAX_GLB_BYTES_BUDGET:
        semantic_errors.append(f"GLB exceeds E1 size budget ({glb_size} > {MAX_GLB_BYTES_BUDGET})")
        reason_codes.append("GLB_SIZE_BUDGET_EXCEEDED")

    khronos_rc, khronos_report = run_khronos_validator(
        glb_path,
        validator_bin=validator_bin,
        report_out_path=report_out_path,
    )
    issues = khronos_report.get("issues", {})
    num_errors = int(issues.get("numErrors", 0))
    num_warnings = int(issues.get("numWarnings", 0))
    if khronos_rc != 0 or num_errors > 0:
        semantic_errors.append(f"Khronos glTF validator reported {num_errors} errors (rc={khronos_rc})")
        reason_codes.append("GLB_VALIDATION_FAILED")

    gltf_json = parse_glb_json_chunk(glb_path)

    # Check self-contained: no external buffer/image URIs, no non-bundled extensionsRequired
    for buf in gltf_json.get("buffers", []):
        if "uri" in buf:
            semantic_errors.append(f"External buffer URI forbidden in GLB: {buf['uri']}")
            reason_codes.append("GLB_EXTERNAL_URI_FORBIDDEN")
    for img in gltf_json.get("images", []):
        if "uri" in img:
            semantic_errors.append(f"External image URI forbidden in GLB: {img['uri']}")
            reason_codes.append("GLB_EXTERNAL_URI_FORBIDDEN")
    if gltf_json.get("extensionsRequired"):
        semantic_errors.append(f"Unbundled extensionsRequired: {gltf_json['extensionsRequired']}")
        reason_codes.append("GLB_UNSUPPORTED_EXTENSION")

    node_names = [str(n.get("name", "")) for n in gltf_json.get("nodes", []) if n.get("name")]
    node_name_set = set(node_names)

    # Validate parts: unique part_ids, existing nodes, valid pages
    seen_part_ids: set[str] = set()
    for part in parts_json.get("parts", []):
        pid = str(part.get("part_id", ""))
        nid = str(part.get("node_id", ""))
        if not pid:
            semantic_errors.append("Part missing part_id")
            reason_codes.append("TWIN_PART_INVALID")
        elif pid in seen_part_ids:
            semantic_errors.append(f"Duplicate part_id: {pid}")
            reason_codes.append("TWIN_PART_DUPLICATE")
        else:
            seen_part_ids.add(pid)

        if nid not in node_name_set:
            semantic_errors.append(f"Part {pid} references missing GLB node: {nid}")
            reason_codes.append("TWIN_NODE_MISSING")

        page = part.get("page")
        if document_page_count is not None and page is not None:
            if int(page) < 1 or int(page) > document_page_count:
                semantic_errors.append(f"Part {pid} references page {page} outside 1..{document_page_count}")
                reason_codes.append("PROCEDURE_REFERENCE_MISSING")

    # Validate views & actions
    view_ids = {str(v.get("view_id", "")) for v in parts_json.get("views", []) if v.get("view_id")}
    for action in actions_json.get("actions", []):
        pid = str(action.get("part_id", ""))
        vid = str(action.get("view_id", ""))
        if pid not in seen_part_ids:
            semantic_errors.append(f"Action references unknown part_id: {pid}")
            reason_codes.append("TWIN_ACTION_PART_MISSING")
        if vid and view_ids and vid not in view_ids:
            semantic_errors.append(f"Action references unknown view_id: {vid}")
            reason_codes.append("TWIN_ACTION_VIEW_MISSING")
        page = action.get("page")
        if document_page_count is not None and page is not None:
            if int(page) < 1 or int(page) > document_page_count:
                semantic_errors.append(f"Action references page {page} outside 1..{document_page_count}")
                reason_codes.append("PROCEDURE_REFERENCE_MISSING")

    # Control bounding box measurement check in meters (§10.2)
    if control_measurements_m and bounds_m:
        min_xyz, max_xyz = bounds_m
        span_x = float(max_xyz[0]) - float(min_xyz[0])
        span_z = float(max_xyz[2]) - float(min_xyz[2])
        tol = float(control_measurements_m.get("tolerance_m", 0.003))
        if "total_length_z" in control_measurements_m:
            expected_z = float(control_measurements_m["total_length_z"])
            if abs(span_z - expected_z) > tol:
                semantic_errors.append(
                    f"Z length mismatch: actual={span_z:.4f}m expected={expected_z:.4f}m +/-{tol:.4f}m"
                )
                reason_codes.append("TWIN_DIMENSION_OUT_OF_TOLERANCE")
        if "bracket_width_x" in control_measurements_m:
            expected_x = float(control_measurements_m["bracket_width_x"])
            if abs(span_x - expected_x) > tol:
                semantic_errors.append(
                    f"X width mismatch: actual={span_x:.4f}m expected={expected_x:.4f}m +/-{tol:.4f}m"
                )
                reason_codes.append("TWIN_DIMENSION_OUT_OF_TOLERANCE")

    is_valid = (khronos_rc == 0 and num_errors == 0 and len(semantic_errors) == 0)
    return TwinValidationReport(
        valid=is_valid,
        khronos_exit_code=khronos_rc,
        khronos_errors=num_errors,
        khronos_warnings=num_warnings,
        khronos_report=khronos_report,
        semantic_errors=semantic_errors,
        reason_codes=sorted(set(reason_codes)),
        glb_byte_count=glb_size,
        node_names=node_names,
    )
