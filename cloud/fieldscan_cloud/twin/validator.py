"""Khronos glTF 2.0 Validator wrapper, FieldScan semantic checks, CPU 3-view renderer & VLM visual review (Stage 5)."""

from __future__ import annotations

from dataclasses import dataclass, field
import json
import math
from pathlib import Path
import struct
import subprocess
from typing import Any

import numpy as np
from PIL import Image, ImageDraw
import trimesh

from fieldscan_cloud.sources.image_harvester import HarvestedImage
from fieldscan_cloud.twin.synthesizer import VlmClient, VlmSynthesisError

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
    material_count: int = 0
    pbr_material_count: int = 0
    embedded_image_count: int = 0


@dataclass(frozen=True)
class VisualReviewResult:
    passed: bool
    score: float
    feedback: str
    issues: list[str] = field(default_factory=list)
    preview_paths: list[Path] = field(default_factory=list)


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
    Validate glTF 2.0 PBR conformity + FieldScan semantic guarantees (CL-CAD-01, CL-CAD-02, CL-DOC-02, Contract v2.1.0).
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

    # Enforce unique non-empty GLB node names (parity with iPad Swift inspectGLBBinary)
    node_names: list[str] = []
    seen_glb_nodes: set[str] = set()
    for n in gltf_json.get("nodes", []):
        nm = str(n.get("name", "")).strip()
        if not nm:
            continue
        if nm in seen_glb_nodes:
            semantic_errors.append(f"Duplicate GLB node name: {nm}")
            reason_codes.append("TWIN_NODE_DUPLICATE")
        else:
            seen_glb_nodes.add(nm)
            node_names.append(nm)

    materials = gltf_json.get("materials", [])
    pbr_count = sum(1 for m in materials if isinstance(m, dict) and isinstance(m.get("pbrMetallicRoughness"), dict))
    embedded_images = sum(1 for im in gltf_json.get("images", []) if isinstance(im, dict) and "bufferView" in im)

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

        if nid not in seen_glb_nodes:
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
        span_y = float(max_xyz[1]) - float(min_xyz[1])
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
        if "size_y" in control_measurements_m:
            expected_y = float(control_measurements_m["size_y"])
            if abs(span_y - expected_y) > tol:
                semantic_errors.append(
                    f"Y height mismatch: actual={span_y:.4f}m expected={expected_y:.4f}m +/-{tol:.4f}m"
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
        material_count=len(materials),
        pbr_material_count=pbr_count,
        embedded_image_count=embedded_images,
    )


# ---------------------------------------------------------------------------
# Pure-NumPy + Pillow Headless CPU Offscreen 3-View Renderer (Zero OpenGL/GPU)
# ---------------------------------------------------------------------------


def _extract_mesh_base_color_and_pbr(mesh: trimesh.Trimesh) -> tuple[np.ndarray, float, float]:
    """Read (rgb_float3, metallic, roughness) from a Trimesh visual for CPU software shading."""
    rgb = np.array([0.74, 0.78, 0.82], dtype=np.float64)
    metallic = 0.25
    roughness = 0.45

    vis = getattr(mesh, "visual", None)
    mat = getattr(vis, "material", None) if vis is not None else None
    if mat is not None:
        bcf = getattr(mat, "baseColorFactor", None)
        if bcf is not None and len(bcf) >= 3:
            vals = np.asarray(bcf[:3], dtype=np.float64)
            rgb = vals / 255.0 if float(vals.max()) > 1.0 else vals
        bct = getattr(mat, "baseColorTexture", None)
        if isinstance(bct, Image.Image):
            arr = np.asarray(bct.convert("RGB").resize((16, 16)), dtype=np.float64) / 255.0
            rgb = arr.mean(axis=(0, 1))
        m_val = getattr(mat, "metallicFactor", None)
        if m_val is not None:
            metallic = float(m_val)
        r_val = getattr(mat, "roughnessFactor", None)
        if r_val is not None:
            roughness = float(r_val)
    elif vis is not None and getattr(vis, "vertex_colors", None) is not None and len(vis.vertex_colors) > 0:
        vc = np.asarray(vis.vertex_colors[0][:3], dtype=np.float64)
        rgb = vc / 255.0 if float(vc.max()) > 1.0 else vc

    return np.clip(rgb, 0.0, 1.0), max(0.0, min(1.0, metallic)), max(0.05, min(1.0, roughness))


def _collect_world_triangles(
    scene: trimesh.Scene,
    *,
    exploded_offsets_m: dict[str, list[float]] | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Extract all world-space triangles from a `trimesh.Scene`, applying optional exploded node offsets.
    Returns (tri_verts[N,3,3], face_normals[N,3], tri_rgb[N,3], tri_metallic_roughness[N,2]).
    """
    offsets = exploded_offsets_m or {}
    all_tris: list[np.ndarray] = []
    all_norms: list[np.ndarray] = []
    all_rgb: list[np.ndarray] = []
    all_mr: list[np.ndarray] = []

    for node_name in scene.graph.nodes_geometry:
        transform, geom_name = scene.graph[node_name]
        geom = scene.geometry.get(geom_name)
        if not isinstance(geom, trimesh.Trimesh) or len(geom.faces) == 0:
            continue

        # Check both exact node_name and composite parent prefix (e.g. "WaterproofGland__sub_0" -> "WaterproofGland")
        shift = offsets.get(node_name)
        if shift is None and "__sub_" in node_name:
            shift = offsets.get(node_name.split("__sub_", 1)[0])

        mat = np.array(transform, dtype=np.float64)
        if shift is not None and len(shift) == 3:
            t_shift = np.eye(4, dtype=np.float64)
            t_shift[:3, 3] = [float(shift[0]), float(shift[1]), float(shift[2])]
            mat = t_shift @ mat

        v_local = np.asarray(geom.vertices, dtype=np.float64)
        v_h = np.hstack([v_local, np.ones((len(v_local), 1), dtype=np.float64)])
        v_world = (v_h @ mat.T)[:, :3]
        faces = np.asarray(geom.faces, dtype=np.int64)
        tris = v_world[faces]  # (F, 3, 3)

        e1 = tris[:, 1] - tris[:, 0]
        e2 = tris[:, 2] - tris[:, 0]
        cross = np.cross(e1, e2)
        lens = np.linalg.norm(cross, axis=1)
        valid = lens > 1e-12
        if not np.any(valid):
            continue
        tris = tris[valid]
        fn = cross[valid] / lens[valid][:, None]

        rgb, metallic, roughness = _extract_mesh_base_color_and_pbr(geom)
        count = len(tris)
        all_tris.append(tris)
        all_norms.append(fn)
        all_rgb.append(np.tile(rgb, (count, 1)))
        all_mr.append(np.tile(np.array([metallic, roughness], dtype=np.float64), (count, 1)))

    if not all_tris:
        return (
            np.zeros((0, 3, 3), dtype=np.float64),
            np.zeros((0, 3), dtype=np.float64),
            np.zeros((0, 3), dtype=np.float64),
            np.zeros((0, 2), dtype=np.float64),
        )
    return (
        np.vstack(all_tris),
        np.vstack(all_norms),
        np.vstack(all_rgb),
        np.vstack(all_mr),
    )


def _render_single_view(
    *,
    tris: np.ndarray,
    normals: np.ndarray,
    colors: np.ndarray,
    mr: np.ndarray,
    camera_dir: np.ndarray,
    up_hint: np.ndarray,
    label: str,
    width: int = 640,
    height: int = 480,
) -> Image.Image:
    """Software-rasterize 3D triangles using painter's depth sort and 3-point PBR-inspired lighting."""
    img = Image.new("RGB", (width, height), (18, 24, 33))
    draw = ImageDraw.Draw(img)

    if len(tris) == 0:
        draw.text((16, 16), f"{label} (empty scene)", fill=(220, 230, 240))
        return img

    pts_flat = tris.reshape(-1, 3)
    bmin = pts_flat.min(axis=0)
    bmax = pts_flat.max(axis=0)
    center = 0.5 * (bmin + bmax)
    radius = max(1e-4, 0.5 * float(np.linalg.norm(bmax - bmin)))

    cam_dir = camera_dir / max(1e-9, float(np.linalg.norm(camera_dir)))
    eye = center + cam_dir * (radius * 2.85)
    forward = (center - eye)
    forward /= float(np.linalg.norm(forward))
    right = np.cross(forward, up_hint)
    if float(np.linalg.norm(right)) < 1e-6:
        right = np.cross(forward, np.array([1.0, 0.0, 0.0], dtype=np.float64))
    right /= float(np.linalg.norm(right))
    up = np.cross(right, forward)

    # Transform vertices into camera coordinates (x=right, y=up, z=depth forward)
    rel = tris - eye[None, None, :]
    cx = rel @ right
    cy = rel @ up
    cz = rel @ forward

    # Perspective projection with safe FOV ~40 deg
    fov_scale = (0.44 * min(width, height)) / math.tan(math.radians(20.0))
    safe_cz = np.maximum(cz, 1e-4)
    sx = (width * 0.5) + (cx / safe_cz) * fov_scale
    sy = (height * 0.5) - (cy / safe_cz) * fov_scale

    # Key, fill, and rim directional lights in world space
    key_light = (right * 0.55 + up * 0.70 - forward * 0.45)
    key_light /= float(np.linalg.norm(key_light))
    fill_light = (-right * 0.70 + up * 0.25 - forward * 0.65)
    fill_light /= float(np.linalg.norm(fill_light))
    view_dir = -forward  # points from surface toward camera

    # Compute shading per triangle
    ndotl_key = np.maximum(0.0, normals @ key_light)
    ndotl_fill = np.maximum(0.0, normals @ fill_light)
    half_vec = key_light + view_dir
    half_vec /= max(1e-9, float(np.linalg.norm(half_vec)))
    ndoth = np.maximum(0.0, normals @ half_vec)

    metallic = mr[:, 0]
    roughness = mr[:, 1]
    shininess = np.clip(4.0 + (1.0 - roughness) * 60.0, 4.0, 64.0)
    spec = (ndoth ** shininess) * (0.20 + 0.55 * metallic) * (1.0 - 0.6 * roughness)

    diffuse_intensity = 0.22 + 0.66 * ndotl_key + 0.24 * ndotl_fill
    shaded = colors * diffuse_intensity[:, None] + spec[:, None] * (0.35 + 0.65 * colors * metallic[:, None])
    shaded_u8 = np.clip(shaded * 255.0, 0, 255).astype(np.uint8)

    # Back-to-front painter's sort by average triangle depth; cull strict back-faces
    depths = cz.mean(axis=1)
    facing = (normals @ view_dir) > -0.12
    indices = np.where(facing)[0]
    if len(indices) == 0:
        indices = np.arange(len(tris))
    order = indices[np.argsort(-depths[indices])]

    for fi in order:
        p0 = (float(sx[fi, 0]), float(sy[fi, 0]))
        p1 = (float(sx[fi, 1]), float(sy[fi, 1]))
        p2 = (float(sx[fi, 2]), float(sy[fi, 2]))
        c = (int(shaded_u8[fi, 0]), int(shaded_u8[fi, 1]), int(shaded_u8[fi, 2]))
        draw.polygon([p0, p1, p2], fill=c)

    # HUD stamp with view label & physical dimensions in millimeters
    spans_mm = (bmax - bmin) * 1000.0
    hud = f"{label}  |  X:{spans_mm[0]:.1f}mm  Y:{spans_mm[1]:.1f}mm  Z:{spans_mm[2]:.1f}mm"
    draw.rectangle([0, 0, width, 26], fill=(10, 14, 20))
    draw.text((12, 6), hud, fill=(215, 228, 240))
    return img


def render_twin_preview_views(
    *,
    glb_path: Path,
    parts_json: dict[str, Any],
    out_dir: Path,
    width: int = 640,
    height: int = 480,
) -> list[Path]:
    """
    Render 3 deterministic headless CPU PNG views (isometric, side profile, exploded) from a `.glb`.
    Zero OpenGL/GPU requirement — safe on minimal headless Linux servers.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    loaded = trimesh.load(str(glb_path), force="scene")
    scene = loaded if isinstance(loaded, trimesh.Scene) else trimesh.Scene(loaded)

    tris, norms, colors, mr = _collect_world_triangles(scene)

    # Find first exploded view definition in parts_json, or synthesize an automatic separation
    exploded_offsets: dict[str, list[float]] = {}
    for v in parts_json.get("views", []):
        eo = v.get("exploded_offsets_m")
        if isinstance(eo, dict) and eo:
            exploded_offsets = {str(k): [float(x) for x in val] for k, val in eo.items() if len(val) == 3}
            break
    if not exploded_offsets:
        # Generic fallback explosion: fan parts slightly along +Y so internal assemblies become inspectable
        part_nodes = [str(p["node_id"]) for p in parts_json.get("parts", []) if p.get("node_id")]
        for idx, nid in enumerate(part_nodes):
            if idx % 2 == 1:
                exploded_offsets[nid] = [0.0, 0.018 * ((idx + 1) // 2), 0.0]

    e_tris, e_norms, e_colors, e_mr = _collect_world_triangles(scene, exploded_offsets_m=exploded_offsets)

    specs = [
        ("view_iso.png", "ISOMETRIC 3/4 VIEW", tris, norms, colors, mr, np.array([1.15, 0.72, 0.85]), np.array([0.0, 1.0, 0.0])),
        ("view_side.png", "SIDE PROFILE VIEW", tris, norms, colors, mr, np.array([0.0, 1.0, 0.05]), np.array([0.0, 0.0, 1.0])),
        ("view_exploded.png", "EXPLODED INTERNAL VIEW", e_tris, e_norms, e_colors, e_mr, np.array([1.20, 0.68, 0.72]), np.array([0.0, 1.0, 0.0])),
    ]

    rendered_paths: list[Path] = []
    for filename, label, t_arr, n_arr, c_arr, mr_arr, cam_dir, up_v in specs:
        im = _render_single_view(
            tris=t_arr,
            normals=n_arr,
            colors=c_arr,
            mr=mr_arr,
            camera_dir=cam_dir,
            up_hint=up_v,
            label=label,
            width=width,
            height=height,
        )
        out_path = out_dir / filename
        im.save(out_path, format="PNG", optimize=True)
        rendered_paths.append(out_path)

    return rendered_paths


def run_vlm_visual_review(
    *,
    vlm_client: VlmClient,
    preview_paths: list[Path],
    datasheet_png_paths: list[Path],
    harvested_images: list[HarvestedImage] | None,
    manufacturer: str,
    model: str,
    variant: str | None,
    min_score: float = 0.70,
) -> VisualReviewResult:
    """
    Optional multimodal QA gate comparing 3 rendered twin PNG views against datasheet PNGs & reference photos.
    Returns structured pass/fail + score + actionable feedback for 1 refinement retry.
    """
    system_prompt = (
        "You are a mechanical CAD visual QA inspector. Compare the 3 rendered preview views of a generated "
        "3D digital twin (isometric, side profile, exploded) against the attached OEM datasheet page(s) and "
        "ephemeral product reference photo(s).\n"
        "Grade fidelity on a 0.0 to 1.0 scale checking: (1) overall aspect ratio & proportions, "
        "(2) key external features (housing shape, flange/mounting holes, ventilation slots, cable gland/connectors), "
        "(3) material/color contrast, and (4) absence of detached/floating/corrupt geometry.\n"
        "Respond ONLY with JSON: "
        '{"passed": true|false, "score": 0.0..1.0, "issues": ["..."], "feedback": "concise CAD fix instructions"}'
    )
    user_prompt = (
        f"Inspect the 3D digital twin for {manufacturer} {model} (variant={variant or 'standard'}).\n"
        f"First {len(preview_paths)} images are rendered 3D twin previews; remaining images are OEM datasheet PNGs "
        f"and multi-angle reference photos. Minimum passing score is {min_score:.2f}."
    )
    images = list(preview_paths) + list(datasheet_png_paths[:2]) + [h.local_path for h in (harvested_images or [])[:3]]
    try:
        resp = vlm_client.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_paths=images,
            max_tokens=1024,
        )
    except VlmSynthesisError as exc:
        return VisualReviewResult(
            passed=False,
            score=0.0,
            feedback=f"Visual review failed: {exc}",
            issues=[exc.code],
            preview_paths=list(preview_paths),
        )

    try:
        score = float(resp.get("score", 0.0))
    except (TypeError, ValueError):
        score = 0.0
    score = max(0.0, min(1.0, score))
    raw_passed = bool(resp.get("passed", score >= min_score))
    passed = raw_passed and (score >= min_score)
    issues = [str(x) for x in resp.get("issues", []) if x]
    feedback = str(resp.get("feedback", "")).strip()
    return VisualReviewResult(
        passed=passed,
        score=score,
        feedback=feedback,
        issues=issues,
        preview_paths=list(preview_paths),
    )
