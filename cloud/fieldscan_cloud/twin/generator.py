"""Generic parametric CAD v2 + glTF 2.0 PBR CPU twin generator (Stage 4).

ZERO HARDCODING PER SENSOR:
- Supports legacy v1 primitives (`cylinder`, `box`) and all 8 universal CAD v2 primitives:
  1. `lathe_profile`
  2. `extruded_polygon`
  3. `slotted_cylinder`
  4. `hex_prism`
  5. `rounded_box`
  6. `tube_path`
  7. `pattern` (linear / radial arrays)
  8. `composite_part` (multi-material hierarchical parent glTF node)
- Applies real glTF 2.0 `PBRMaterial` metallic/roughness materials, optional embedded Pillow
  procedural textures (0 external URIs, 0 extensionsRequired), and pure-NumPy crease-angle normals
  (no SciPy dependency).
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient as orient_polygon
import trimesh

DEFAULT_CREASE_ANGLE_DEG = 35.0
MAX_PATTERN_COUNT = 256


@dataclass(frozen=True)
class TwinBuildArtifacts:
    glb_path: Path
    parts_json: dict[str, Any]
    actions_json: dict[str, Any]
    triangle_count: int
    node_count: int
    bounds_m: list[list[float]]
    material_count: int = 0
    has_pbr_materials: bool = True


def _rgba_to_float4(raw: Any, default: tuple[float, float, float, float] = (0.72, 0.76, 0.80, 1.0)) -> list[float]:
    if not isinstance(raw, (list, tuple)) or len(raw) < 3:
        return list(default)
    vals = [float(v) for v in raw[:4]]
    if len(vals) == 3:
        vals.append(255.0 if max(vals) > 1.0 else 1.0)
    if max(vals) > 1.0:
        vals = [max(0.0, min(1.0, v / 255.0)) for v in vals]
    else:
        vals = [max(0.0, min(1.0, v)) for v in vals]
    return vals


def _rgba_to_u8_tuple(raw: Any, default: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    f = _rgba_to_float4(raw, default=(default[0] / 255.0, default[1] / 255.0, default[2] / 255.0, default[3] / 255.0))
    return (
        int(round(f[0] * 255)),
        int(round(f[1] * 255)),
        int(round(f[2] * 255)),
        int(round(f[3] * 255)),
    )


def _rotation_matrix_xyz(rx_deg: float, ry_deg: float, rz_deg: float) -> np.ndarray:
    rx, ry, rz = math.radians(rx_deg), math.radians(ry_deg), math.radians(rz_deg)
    cx, sx = math.cos(rx), math.sin(rx)
    cy, sy = math.cos(ry), math.sin(ry)
    cz, sz = math.cos(rz), math.sin(rz)
    mx = np.array([[1, 0, 0, 0], [0, cx, -sx, 0], [0, sx, cx, 0], [0, 0, 0, 1]], dtype=np.float64)
    my = np.array([[cy, 0, sy, 0], [0, 1, 0, 0], [-sy, 0, cy, 0], [0, 0, 0, 1]], dtype=np.float64)
    mz = np.array([[cz, -sz, 0, 0], [sz, cz, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], dtype=np.float64)
    return mz @ my @ mx


def _axis_align_matrix(axis: str) -> np.ndarray:
    ax = (axis or "z").strip().lower()
    if ax == "y":
        return _rotation_matrix_xyz(-90.0, 0.0, 0.0)
    if ax == "x":
        return _rotation_matrix_xyz(0.0, 90.0, 0.0)
    return np.eye(4, dtype=np.float64)


def _apply_optional_transform(mesh: trimesh.Trimesh, spec: dict[str, Any], scale: float) -> None:
    rot = spec.get("rotation_deg")
    if isinstance(rot, (list, tuple)) and len(rot) == 3:
        mesh.apply_transform(_rotation_matrix_xyz(float(rot[0]), float(rot[1]), float(rot[2])))
    elif isinstance(rot, (int, float)) and float(rot) != 0.0:
        mesh.apply_transform(_rotation_matrix_xyz(0.0, 0.0, float(rot)))

    offset = spec.get("offset_mm") or spec.get("translate_mm")
    if isinstance(offset, (list, tuple)) and len(offset) == 3:
        mesh.apply_translation([float(offset[0]) * scale, float(offset[1]) * scale, float(offset[2]) * scale])


def _clean_degenerate_triangles(vertices: np.ndarray, faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Remove zero-area or degenerate triangles before normal computation so glTF normals are always unit length."""
    if len(faces) == 0:
        return vertices, faces
    v0 = vertices[faces[:, 0]]
    v1 = vertices[faces[:, 1]]
    v2 = vertices[faces[:, 2]]
    cross = np.cross(v1 - v0, v2 - v0)
    area2 = np.linalg.norm(cross, axis=1)
    keep = area2 > 1e-12
    if not np.all(keep):
        faces = faces[keep]
    return vertices, faces


def apply_crease_normals(
    mesh: trimesh.Trimesh,
    *,
    crease_angle_deg: float = DEFAULT_CREASE_ANGLE_DEG,
    uv: np.ndarray | None = None,
) -> tuple[trimesh.Trimesh, np.ndarray | None]:
    """
    Pure-NumPy crease-angle vertex normal splitter (no SciPy dependency).
    Smooth-shades curved patches whose dihedral angle <= crease_angle_deg while keeping mechanical edges crisp.
    """
    verts = np.asarray(mesh.vertices, dtype=np.float64)
    faces = np.asarray(mesh.faces, dtype=np.int64)
    verts, faces = _clean_degenerate_triangles(verts, faces)
    if len(faces) == 0:
        return trimesh.Trimesh(vertices=verts, faces=faces, process=False), uv

    v0 = verts[faces[:, 0]]
    v1 = verts[faces[:, 1]]
    v2 = verts[faces[:, 2]]
    cross = np.cross(v1 - v0, v2 - v0)
    lengths = np.linalg.norm(cross, axis=1)
    safe_lengths = np.where(lengths > 1e-12, lengths, 1.0)
    face_normals = cross / safe_lengths[:, None]
    face_weights = 0.5 * lengths

    cos_thresh = math.cos(math.radians(max(0.0, min(179.9, float(crease_angle_deg)))))

    # Build adjacency from original vertex index -> incident face indices
    n_verts = len(verts)
    vert_to_faces: list[list[int]] = [[] for _ in range(n_verts)]
    for fi in range(len(faces)):
        a, b, c = int(faces[fi, 0]), int(faces[fi, 1]), int(faces[fi, 2])
        vert_to_faces[a].append(fi)
        vert_to_faces[b].append(fi)
        vert_to_faces[c].append(fi)

    new_verts: list[np.ndarray] = []
    new_normals: list[np.ndarray] = []
    new_uvs: list[np.ndarray] = []
    new_faces = np.empty_like(faces)
    dedup: dict[tuple[Any, ...], int] = {}

    has_uv = uv is not None and len(uv) == n_verts

    for fi in range(len(faces)):
        fn = face_normals[fi]
        for corner in range(3):
            vi = int(faces[fi, corner])
            inc = vert_to_faces[vi]
            if len(inc) == 1:
                n_vec = fn
            else:
                inc_normals = face_normals[inc]
                dots = inc_normals @ fn
                mask = dots >= (cos_thresh - 1e-6)
                if np.any(mask):
                    w = face_weights[np.asarray(inc, dtype=np.int64)][mask]
                    accum = (inc_normals[mask] * w[:, None]).sum(axis=0)
                    norm_len = float(np.linalg.norm(accum))
                    n_vec = (accum / norm_len) if norm_len > 1e-12 else fn
                else:
                    n_vec = fn

            # Normalize strictly to unit length for Khronos gltf_validator conformity
            n_len = float(np.linalg.norm(n_vec))
            n_unit = (n_vec / n_len) if n_len > 1e-12 else np.array([0.0, 0.0, 1.0], dtype=np.float64)

            if has_uv and uv is not None:
                uv_pt = uv[vi]
                key = (
                    vi,
                    int(round(n_unit[0] * 1000.0)),
                    int(round(n_unit[1] * 1000.0)),
                    int(round(n_unit[2] * 1000.0)),
                    int(round(float(uv_pt[0]) * 10000.0)),
                    int(round(float(uv_pt[1]) * 10000.0)),
                )
            else:
                key = (
                    vi,
                    int(round(n_unit[0] * 1000.0)),
                    int(round(n_unit[1] * 1000.0)),
                    int(round(n_unit[2] * 1000.0)),
                )

            existing = dedup.get(key)
            if existing is None:
                existing = len(new_verts)
                dedup[key] = existing
                new_verts.append(verts[vi])
                new_normals.append(n_unit)
                if has_uv and uv is not None:
                    new_uvs.append(uv[vi])
            new_faces[fi, corner] = existing

    out_verts = np.asarray(new_verts, dtype=np.float64)
    out_normals = np.asarray(new_normals, dtype=np.float64)
    # Re-normalize once more in float32 precision for glTF float32 accessor exactness
    n32 = out_normals.astype(np.float32)
    n32_len = np.linalg.norm(n32, axis=1, keepdims=True)
    n32 = np.where(n32_len > 1e-7, n32 / np.where(n32_len > 1e-7, n32_len, 1.0), np.array([0.0, 0.0, 1.0], dtype=np.float32))

    out_mesh = trimesh.Trimesh(
        vertices=out_verts,
        faces=new_faces,
        vertex_normals=n32.astype(np.float64),
        process=False,
    )
    out_uv = np.asarray(new_uvs, dtype=np.float64) if has_uv else None
    return out_mesh, out_uv


def _render_procedural_label_texture(label_spec: dict[str, Any]) -> Image.Image:
    """Render a self-contained procedural specification/label PNG image in memory via Pillow."""
    width = int(label_spec.get("width_px", 512))
    height = int(label_spec.get("height_px", 256))
    width = max(128, min(1024, width))
    height = max(64, min(512, height))

    bg = _rgba_to_u8_tuple(label_spec.get("bg_rgba"), (224, 230, 236, 255))
    fg = _rgba_to_u8_tuple(label_spec.get("fg_rgba"), (24, 32, 42, 255))
    accent = _rgba_to_u8_tuple(label_spec.get("accent_rgba"), (26, 114, 198, 255))

    img = Image.new("RGBA", (width, height), bg)
    draw = ImageDraw.Draw(img)

    # Subtle industrial machined hairline bands & border
    band_h = max(10, height // 10)
    draw.rectangle([0, 0, width - 1, band_h], fill=accent)
    draw.rectangle([0, height - band_h, width - 1, height - 1], fill=accent)
    draw.rectangle([8, band_h + 6, width - 9, height - band_h - 7], outline=fg, width=2)

    title = str(label_spec.get("title", "INDUSTRIAL DEVICE")).strip()[:40]
    subtitle = str(label_spec.get("subtitle", "")).strip()[:52]
    detail = str(label_spec.get("detail", "")).strip()[:60]

    def _load_font(px: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
        try:
            return ImageFont.load_default(size=px)
        except TypeError:
            return ImageFont.load_default()

    font_title = _load_font(max(18, height // 7))
    font_sub = _load_font(max(13, height // 11))
    font_detail = _load_font(max(11, height // 14))

    draw.text((24, band_h + 22), title, fill=fg, font=font_title)
    if subtitle:
        draw.text((24, band_h + 22 + max(28, height // 5)), subtitle, fill=fg, font=font_sub)
    if detail:
        draw.text((24, band_h + 22 + max(58, int(height * 0.42))), detail, fill=fg, font=font_detail)

    return img.convert("RGB")


def _compute_uvs(vertices: np.ndarray, *, mapping: str = "cylindrical") -> np.ndarray:
    """Compute clean [0, 1] UV coordinates for procedural embedded textures."""
    if len(vertices) == 0:
        return np.zeros((0, 2), dtype=np.float64)
    if mapping == "planar":
        min_xy = vertices[:, :2].min(axis=0)
        span_xy = np.maximum(vertices[:, :2].max(axis=0) - min_xy, 1e-6)
        u = (vertices[:, 0] - min_xy[0]) / span_xy[0]
        v = (vertices[:, 1] - min_xy[1]) / span_xy[1]
        return np.column_stack([np.clip(u, 0.0, 1.0), np.clip(v, 0.0, 1.0)])

    # Cylindrical wrap around Z axis
    cx = float(vertices[:, 0].mean())
    cy = float(vertices[:, 1].mean())
    angles = np.arctan2(vertices[:, 1] - cy, vertices[:, 0] - cx)
    u = (angles + math.pi) / (2.0 * math.pi)
    z_min = float(vertices[:, 2].min())
    z_span = max(float(vertices[:, 2].max()) - z_min, 1e-6)
    v = (vertices[:, 2] - z_min) / z_span
    return np.column_stack([np.clip(u, 0.0, 1.0), np.clip(v, 0.0, 1.0)])


def _build_pbr_visual(
    mesh: trimesh.Trimesh,
    spec: dict[str, Any],
    *,
    default_name: str,
    crease_angle_deg: float = DEFAULT_CREASE_ANGLE_DEG,
) -> trimesh.Trimesh:
    """Apply pure-NumPy crease normals and a glTF 2.0 PBRMaterial (with optional embedded Pillow texture)."""
    mat_spec = spec.get("material") if isinstance(spec.get("material"), dict) else {}
    label_spec = spec.get("procedural_label") if isinstance(spec.get("procedural_label"), dict) else None

    if "baseColorFactor" in mat_spec:
        base_rgba = _rgba_to_float4(mat_spec["baseColorFactor"])
    elif "color_rgba" in mat_spec:
        base_rgba = _rgba_to_float4(mat_spec["color_rgba"])
    elif "color_rgba" in spec:
        base_rgba = _rgba_to_float4(spec["color_rgba"])
    else:
        base_rgba = [0.74, 0.78, 0.82, 1.0]

    metallic = float(mat_spec.get("metallicFactor", 0.25))
    roughness = float(mat_spec.get("roughnessFactor", 0.45))
    metallic = max(0.0, min(1.0, metallic))
    roughness = max(0.04, min(1.0, roughness))
    double_sided = bool(mat_spec.get("doubleSided", False))
    mat_name = str(mat_spec.get("name", default_name))

    emissive = mat_spec.get("emissiveFactor")
    emissive_f3: list[float] | None = None
    if isinstance(emissive, (list, tuple)) and len(emissive) == 3:
        emissive_f3 = [max(0.0, min(1.0, float(v))) for v in emissive]

    raw_uv: np.ndarray | None = None
    texture_img: Image.Image | None = None
    if label_spec is not None:
        texture_img = _render_procedural_label_texture(label_spec)
        mapping = str(label_spec.get("mapping", "cylindrical"))
        raw_uv = _compute_uvs(np.asarray(mesh.vertices, dtype=np.float64), mapping=mapping)

    crease = float(spec.get("crease_angle_deg", crease_angle_deg))
    shaded_mesh, final_uv = apply_crease_normals(mesh, crease_angle_deg=crease, uv=raw_uv)

    pbr_kwargs: dict[str, Any] = {
        "name": mat_name,
        "baseColorFactor": [1.0, 1.0, 1.0, 1.0] if texture_img is not None else base_rgba,
        "metallicFactor": metallic,
        "roughnessFactor": roughness,
        "doubleSided": double_sided,
    }
    if texture_img is not None:
        pbr_kwargs["baseColorTexture"] = texture_img
    if emissive_f3 is not None:
        pbr_kwargs["emissiveFactor"] = emissive_f3

    pbr_mat = trimesh.visual.material.PBRMaterial(**pbr_kwargs)
    if final_uv is not None:
        shaded_mesh.visual = trimesh.visual.TextureVisuals(uv=final_uv, material=pbr_mat)
    else:
        shaded_mesh.visual = trimesh.visual.TextureVisuals(material=pbr_mat)
    return shaded_mesh


# ---------------------------------------------------------------------------
# Universal Parametric CAD Primitives (Zero Sensor Hardcoding)
# ---------------------------------------------------------------------------


def _build_lathe_profile_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    """Revolve a 2D [radius_mm, z_mm] polyline around an axis with exact outward normals."""
    raw_pts = [(max(0.0, float(p[0])) * scale, float(p[1]) * scale) for p in spec["points_mm"]]
    if len(raw_pts) < 2:
        raise ValueError("lathe_profile requires at least 2 points_mm")

    # Normalize ascending Z direction so T_theta x T_profile always points outward
    if raw_pts[-1][1] < raw_pts[0][1]:
        raw_pts = list(reversed(raw_pts))

    cap_ends = bool(spec.get("cap_ends", True))
    pts = list(raw_pts)
    if cap_ends:
        if pts[0][0] > 1e-6:
            pts.insert(0, (0.0, pts[0][1]))
        if pts[-1][0] > 1e-6:
            pts.append((0.0, pts[-1][1]))

    # Remove consecutive duplicate (r, z) points
    dedup_pts: list[tuple[float, float]] = [pts[0]]
    for pt in pts[1:]:
        if abs(pt[0] - dedup_pts[-1][0]) > 1e-8 or abs(pt[1] - dedup_pts[-1][1]) > 1e-8:
            dedup_pts.append(pt)
    pts = dedup_pts

    segments = max(12, min(96, int(spec.get("segments", 48))))
    angles = np.linspace(0.0, 2.0 * math.pi, segments, endpoint=False)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)

    vertices: list[list[float]] = []
    ring_indices: list[list[int] | int] = []  # int for r==0 pole, list[int] for ring

    for r, z in pts:
        if r <= 1e-7:
            pole_idx = len(vertices)
            vertices.append([0.0, 0.0, z])
            ring_indices.append(pole_idx)
        else:
            start = len(vertices)
            for k in range(segments):
                vertices.append([r * float(cos_a[k]), r * float(sin_a[k]), z])
            ring_indices.append(list(range(start, start + segments)))

    faces: list[list[int]] = []
    for i in range(len(pts) - 1):
        r0 = ring_indices[i]
        r1 = ring_indices[i + 1]
        if isinstance(r0, int) and isinstance(r1, int):
            continue
        if isinstance(r0, int) and isinstance(r1, list):
            for k in range(segments):
                kn = (k + 1) % segments
                faces.append([r0, r1[kn], r1[k]])
        elif isinstance(r0, list) and isinstance(r1, int):
            for k in range(segments):
                kn = (k + 1) % segments
                faces.append([r0[k], r0[kn], r1])
        elif isinstance(r0, list) and isinstance(r1, list):
            for k in range(segments):
                kn = (k + 1) % segments
                a, b, c, d = r0[k], r0[kn], r1[kn], r1[k]
                faces.append([a, b, c])
                faces.append([a, c, d])

    mesh = trimesh.Trimesh(
        vertices=np.asarray(vertices, dtype=np.float64),
        faces=np.asarray(faces, dtype=np.int64),
        process=False,
    )
    ax = str(spec.get("axis", "z"))
    if ax.lower() != "z":
        mesh.apply_transform(_axis_align_matrix(ax))
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _build_extruded_polygon_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    """Extrude a 2D polygon with optional circular/polygonal holes (mounting ears, brackets, plates)."""
    outer = [(float(p[0]) * scale, float(p[1]) * scale) for p in spec["outer_mm"]]
    holes_spec = spec.get("holes_mm") or []
    holes = [[(float(p[0]) * scale, float(p[1]) * scale) for p in ring] for ring in holes_spec]

    # Also support declarative circular holes: `circular_holes_mm: [{x, y, diameter_mm, segments}]`
    for ch in spec.get("circular_holes_mm") or []:
        cx = float(ch["x"]) * scale
        cy = float(ch["y"]) * scale
        rad = float(ch["diameter_mm"]) * 0.5 * scale
        segs = max(12, min(48, int(ch.get("segments", 24))))
        ang = np.linspace(0.0, 2.0 * math.pi, segs, endpoint=False)
        holes.append([(cx + rad * float(math.cos(a)), cy + rad * float(math.sin(a))) for a in ang])

    poly = Polygon(outer, holes if holes else None)
    if not poly.is_valid:
        poly = poly.buffer(0)
    if poly.is_empty:
        raise ValueError("extruded_polygon produced an empty polygon")
    if poly.geom_type == "MultiPolygon":
        poly = max(poly.geoms, key=lambda g: g.area)
    poly = orient_polygon(poly, sign=1.0)

    z0 = float(spec["z_start_mm"]) * scale
    z1 = float(spec["z_end_mm"]) * scale
    if z1 < z0:
        z0, z1 = z1, z0
    height = max(1e-5, z1 - z0)

    mesh = trimesh.creation.extrude_polygon(poly, height=height, engine="earcut")
    mesh.apply_translation([0.0, 0.0, z0])
    ax = str(spec.get("axis", "z"))
    if ax.lower() != "z":
        mesh.apply_transform(_axis_align_matrix(ax))
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _build_hollow_ring_mesh(
    *,
    outer_r: float,
    inner_r: float,
    z0: float,
    z1: float,
    segments: int,
) -> trimesh.Trimesh:
    """Build a watertight hollow cylindrical ring (annulus extruded along Z)."""
    ang = np.linspace(0.0, 2.0 * math.pi, segments, endpoint=False)
    outer = [(outer_r * float(math.cos(a)), outer_r * float(math.sin(a))) for a in ang]
    inner = [(inner_r * float(math.cos(a)), inner_r * float(math.sin(a))) for a in ang]
    poly = orient_polygon(Polygon(outer, [inner]), sign=1.0)
    mesh = trimesh.creation.extrude_polygon(poly, height=max(1e-5, z1 - z0), engine="earcut")
    mesh.apply_translation([0.0, 0.0, z0])
    return mesh


def _build_arc_strut_mesh(
    *,
    outer_r: float,
    inner_r: float,
    theta0: float,
    theta1: float,
    z0: float,
    z1: float,
    arc_steps: int = 5,
) -> trimesh.Trimesh:
    """Build a single curved solid bridge strut spanning [theta0, theta1] between inner_r and outer_r."""
    thetas = np.linspace(theta0, theta1, max(2, arc_steps))
    outer_pts = [(outer_r * float(math.cos(t)), outer_r * float(math.sin(t))) for t in thetas]
    inner_pts = [(inner_r * float(math.cos(t)), inner_r * float(math.sin(t))) for t in reversed(thetas)]
    poly = orient_polygon(Polygon(outer_pts + inner_pts), sign=1.0)
    mesh = trimesh.creation.extrude_polygon(poly, height=max(1e-5, z1 - z0), engine="earcut")
    mesh.apply_translation([0.0, 0.0, z0])
    return mesh


def _build_slotted_cylinder_meshes(spec: dict[str, Any], scale: float) -> list[tuple[trimesh.Trimesh, dict[str, Any]]]:
    """
    Build a true 3D hollow slotted cage/housing (real through-slots + separating rings + vertical struts)
    plus an optional recessed inner core with its own PBR material.
    """
    outer_r = float(spec["outer_diameter_mm"]) * 0.5 * scale
    inner_diam = float(spec.get("inner_diameter_mm", float(spec["outer_diameter_mm"]) * 0.78))
    inner_r = max(1e-4, min(outer_r * 0.94, inner_diam * 0.5 * scale))
    z0 = float(spec["z_start_mm"]) * scale
    z1 = float(spec["z_end_mm"]) * scale
    if z1 < z0:
        z0, z1 = z1, z0
    total_h = max(1e-4, z1 - z0)

    slot_count = max(3, min(32, int(spec.get("slot_count", 8))))
    slot_rows = max(1, min(12, int(spec.get("slot_rows", 3))))
    slot_ratio = max(0.2, min(0.8, float(spec.get("slot_ratio", 0.54))))
    end_band = min(total_h * 0.22, float(spec.get("end_band_mm", 2.4)) * scale)
    ring_thick = min(total_h * 0.14, float(spec.get("ring_thickness_mm", 1.5)) * scale)
    segments = max(24, min(72, int(spec.get("segments", 48))))

    cage_parts: list[trimesh.Trimesh] = []
    # Bottom and top structural end collars
    cage_parts.append(_build_hollow_ring_mesh(outer_r=outer_r, inner_r=inner_r, z0=z0, z1=z0 + end_band, segments=segments))
    cage_parts.append(_build_hollow_ring_mesh(outer_r=outer_r, inner_r=inner_r, z0=z1 - end_band, z1=z1, segments=segments))

    usable_h = max(1e-4, total_h - 2.0 * end_band)
    sep_total = ring_thick * max(0, slot_rows - 1)
    if sep_total >= usable_h * 0.65:
        ring_thick = (usable_h * 0.35) / max(1, slot_rows - 1)
        sep_total = ring_thick * max(0, slot_rows - 1)
    row_h = (usable_h - sep_total) / float(slot_rows)

    sector_rad = (2.0 * math.pi) / float(slot_count)
    strut_rad = sector_rad * (1.0 - slot_ratio)

    cursor_z = z0 + end_band
    for r_idx in range(slot_rows):
        row_top = cursor_z + row_h
        angle_offset = (0.5 * sector_rad) if (bool(spec.get("stagger_rows", False)) and r_idx % 2 == 1) else 0.0
        for s_idx in range(slot_count):
            t0 = angle_offset + s_idx * sector_rad
            t1 = t0 + strut_rad
            cage_parts.append(
                _build_arc_strut_mesh(
                    outer_r=outer_r,
                    inner_r=inner_r,
                    theta0=t0,
                    theta1=t1,
                    z0=cursor_z,
                    z1=row_top,
                    arc_steps=4,
                )
            )
        cursor_z = row_top
        if r_idx < slot_rows - 1:
            cage_parts.append(
                _build_hollow_ring_mesh(
                    outer_r=outer_r,
                    inner_r=inner_r,
                    z0=cursor_z,
                    z1=cursor_z + ring_thick,
                    segments=segments,
                )
            )
            cursor_z += ring_thick

    cage_mesh = trimesh.util.concatenate(cage_parts)
    ax = str(spec.get("axis", "z"))
    if ax.lower() != "z":
        cage_mesh.apply_transform(_axis_align_matrix(ax))
    _apply_optional_transform(cage_mesh, spec, scale)

    out: list[tuple[trimesh.Trimesh, dict[str, Any]]] = [(cage_mesh, spec)]

    # Optional recessed internal core (e.g. sintered element, mesh sleeve, or sensor cartridge)
    core_diam = spec.get("core_diameter_mm")
    if core_diam is not None and float(core_diam) > 0:
        core_r = min(inner_r * 0.94, float(core_diam) * 0.5 * scale)
        inset = float(spec.get("core_inset_mm", 1.2)) * scale
        cz0 = z0 + min(inset, total_h * 0.2)
        cz1 = z1 - min(inset, total_h * 0.2)
        if cz1 > cz0 + 1e-5:
            core_mesh = trimesh.creation.cylinder(radius=core_r, height=(cz1 - cz0), sections=32)
            core_mesh.apply_translation([0.0, 0.0, 0.5 * (cz0 + cz1)])
            if ax.lower() != "z":
                core_mesh.apply_transform(_axis_align_matrix(ax))
            _apply_optional_transform(core_mesh, spec, scale)
            core_mat = spec.get("core_material") or {
                "name": "sintered_core",
                "baseColorFactor": [0.34, 0.37, 0.41, 1.0],
                "metallicFactor": 0.45,
                "roughnessFactor": 0.78,
            }
            out.append((core_mesh, {"material": core_mat, "crease_angle_deg": 40.0}))

    return out


def _build_hex_prism_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    """Build a precision N-sided (default 6) hex nut/prism with optional top and bottom machined chamfers."""
    sides = max(3, min(16, int(spec.get("sides", 6))))
    if "across_flats_mm" in spec:
        af = float(spec["across_flats_mm"]) * scale
        radius = (af * 0.5) / math.cos(math.pi / sides)
    else:
        radius = float(spec["diameter_mm"]) * 0.5 * scale

    z0 = float(spec["z_start_mm"]) * scale
    z1 = float(spec["z_end_mm"]) * scale
    if z1 < z0:
        z0, z1 = z1, z0
    height = max(1e-5, z1 - z0)
    chamfer = max(0.0, float(spec.get("chamfer_mm", 0.0)) * scale)
    chamfer = min(chamfer, height * 0.35, radius * 0.25)

    cx = float(spec.get("center_xy_mm", [0.0, 0.0])[0]) * scale
    cy = float(spec.get("center_xy_mm", [0.0, 0.0])[1]) * scale

    if chamfer > 1e-6:
        # 4-ring beveled prism: bottom cap -> lower full -> upper full -> top cap
        r_chamf = max(1e-5, radius - chamfer * 0.85)
        rings_spec = [(r_chamf, z0), (radius, z0 + chamfer), (radius, z1 - chamfer), (r_chamf, z1)]
        ang = np.linspace(0.0, 2.0 * math.pi, sides, endpoint=False)
        verts: list[list[float]] = [[cx, cy, z0]]  # bottom center idx 0
        ring_starts: list[int] = []
        for rad, zv in rings_spec:
            ring_starts.append(len(verts))
            for a in ang:
                verts.append([cx + rad * float(math.cos(a)), cy + rad * float(math.sin(a)), zv])
        top_center = len(verts)
        verts.append([cx, cy, z1])

        faces: list[list[int]] = []
        # Bottom cap (outward -Z)
        r0 = ring_starts[0]
        for k in range(sides):
            kn = (k + 1) % sides
            faces.append([0, r0 + kn, r0 + k])
        # Side quads between consecutive rings
        for ri in range(len(ring_starts) - 1):
            ra, rb = ring_starts[ri], ring_starts[ri + 1]
            for k in range(sides):
                kn = (k + 1) % sides
                faces.append([ra + k, ra + kn, rb + kn])
                faces.append([ra + k, rb + kn, rb + k])
        # Top cap (outward +Z)
        rl = ring_starts[-1]
        for k in range(sides):
            kn = (k + 1) % sides
            faces.append([rl + k, rl + kn, top_center])

        mesh = trimesh.Trimesh(
            vertices=np.asarray(verts, dtype=np.float64),
            faces=np.asarray(faces, dtype=np.int64),
            process=False,
        )
    else:
        ang = np.linspace(0.0, 2.0 * math.pi, sides, endpoint=False)
        outer = [(cx + radius * float(math.cos(a)), cy + radius * float(math.sin(a))) for a in ang]
        poly = orient_polygon(Polygon(outer), sign=1.0)
        mesh = trimesh.creation.extrude_polygon(poly, height=height, engine="earcut")
        mesh.apply_translation([0.0, 0.0, z0])

    ax = str(spec.get("axis", "z"))
    if ax.lower() != "z":
        mesh.apply_transform(_axis_align_matrix(ax))
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _rounded_rect_points(sx: float, sy: float, radius: float, corner_steps: int = 4) -> list[tuple[float, float]]:
    hx, hy = sx * 0.5, sy * 0.5
    r = max(0.0, min(radius, hx * 0.48, hy * 0.48))
    if r <= 1e-7:
        return [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]
    corners = [
        (hx - r, -hy + r, -0.5 * math.pi, 0.0),
        (hx - r, hy - r, 0.0, 0.5 * math.pi),
        (-hx + r, hy - r, 0.5 * math.pi, math.pi),
        (-hx + r, -hy + r, math.pi, 1.5 * math.pi),
    ]
    pts: list[tuple[float, float]] = []
    for cx, cy, a0, a1 in corners:
        for a in np.linspace(a0, a1, corner_steps):
            pts.append((cx + r * float(math.cos(a)), cy + r * float(math.sin(a))))
    return pts


def _build_rounded_box_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    """Build a chamfered/rounded industrial rectangular housing or block."""
    sx, sy, sz = [max(1e-5, float(v) * scale) for v in spec["size_mm"]]
    cx, cy, cz = [float(v) * scale for v in spec.get("center_mm", [0.0, 0.0, 0.0])]
    bevel = max(0.0, float(spec.get("bevel_mm", 0.0)) * scale)

    if bevel <= 1e-7:
        mesh = trimesh.creation.box(extents=[sx, sy, sz])
        mesh.apply_translation([cx, cy, cz])
        _apply_optional_transform(mesh, spec, scale)
        return mesh

    r_xy = min(bevel, sx * 0.4, sy * 0.4)
    z_bevel = min(bevel * 0.55, sz * 0.25, r_xy * 0.85)
    outer_pts = _rounded_rect_points(sx, sy, r_xy, corner_steps=4)

    if z_bevel > 1e-6 and sx > 2.4 * z_bevel and sy > 2.4 * z_bevel:
        inner_pts = _rounded_rect_points(sx - 2.0 * z_bevel, sy - 2.0 * z_bevel, max(0.0, r_xy - z_bevel), corner_steps=4)
        if len(inner_pts) == len(outer_pts):
            n = len(outer_pts)
            hz = sz * 0.5
            z_levels = [-hz, -hz + z_bevel, hz - z_bevel, hz]
            rings = [inner_pts, outer_pts, outer_pts, inner_pts]
            verts: list[list[float]] = [[0.0, 0.0, -hz]]
            r_starts: list[int] = []
            for pts_r, zv in zip(rings, z_levels):
                r_starts.append(len(verts))
                for px, py in pts_r:
                    verts.append([px, py, zv])
            top_c = len(verts)
            verts.append([0.0, 0.0, hz])

            faces: list[list[int]] = []
            r0 = r_starts[0]
            for k in range(n):
                kn = (k + 1) % n
                faces.append([0, r0 + kn, r0 + k])
            for ri in range(len(r_starts) - 1):
                ra, rb = r_starts[ri], r_starts[ri + 1]
                for k in range(n):
                    kn = (k + 1) % n
                    faces.append([ra + k, ra + kn, rb + kn])
                    faces.append([ra + k, rb + kn, rb + k])
            rl = r_starts[-1]
            for k in range(n):
                kn = (k + 1) % n
                faces.append([rl + k, rl + kn, top_c])

            mesh = trimesh.Trimesh(
                vertices=np.asarray(verts, dtype=np.float64),
                faces=np.asarray(faces, dtype=np.int64),
                process=False,
            )
            mesh.apply_translation([cx, cy, cz])
            _apply_optional_transform(mesh, spec, scale)
            return mesh

    poly = orient_polygon(Polygon(outer_pts), sign=1.0)
    mesh = trimesh.creation.extrude_polygon(poly, height=sz, engine="earcut")
    mesh.apply_translation([cx, cy, cz - sz * 0.5])
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _chaikin_smooth_polyline(points: np.ndarray, iterations: int = 2) -> np.ndarray:
    """Smooth interior polyline bends while pinning start and end points exactly."""
    pts = points.copy()
    for _ in range(iterations):
        if len(pts) < 3:
            break
        out = [pts[0]]
        for i in range(len(pts) - 1):
            p0, p1 = pts[i], pts[i + 1]
            if i == 0:
                out.append(0.25 * p0 + 0.75 * p1)
            elif i == len(pts) - 2:
                out.append(0.75 * p0 + 0.25 * p1)
            else:
                out.append(0.75 * p0 + 0.25 * p1)
                out.append(0.25 * p0 + 0.75 * p1)
        out.append(pts[-1])
        pts = np.asarray(out, dtype=np.float64)
    return pts


def _build_tube_path_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    """Sweep a circular cross-section along an arbitrary 3D path using Bishop parallel transport."""
    raw = np.asarray([[float(c) * scale for c in pt] for pt in spec["points_mm"]], dtype=np.float64)
    if len(raw) < 2:
        raise ValueError("tube_path requires at least 2 points_mm")

    # Deduplicate consecutive identical points
    clean = [raw[0]]
    for pt in raw[1:]:
        if float(np.linalg.norm(pt - clean[-1])) > 1e-7:
            clean.append(pt)
    pts = np.asarray(clean, dtype=np.float64)
    if len(pts) < 2:
        raise ValueError("tube_path has degenerate zero-length path")

    if bool(spec.get("smooth_corners", True)) and len(pts) >= 3:
        pts = _chaikin_smooth_polyline(pts, iterations=int(spec.get("smooth_iterations", 2)))

    radius = max(1e-5, float(spec["diameter_mm"]) * 0.5 * scale)
    sections = max(8, min(32, int(spec.get("sections", 16))))
    cap_ends = bool(spec.get("cap_ends", True))

    # Compute unit tangents at every point
    n_pts = len(pts)
    tangents = np.zeros_like(pts)
    for i in range(n_pts):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == n_pts - 1:
            t = pts[-1] - pts[-2]
        else:
            t = pts[i + 1] - pts[i - 1]
        tl = float(np.linalg.norm(t))
        tangents[i] = (t / tl) if tl > 1e-12 else np.array([0.0, 0.0, 1.0], dtype=np.float64)

    # Initial orthonormal frame (T0, N0, B0)
    t0 = tangents[0]
    ref = np.array([1.0, 0.0, 0.0], dtype=np.float64) if abs(t0[0]) < 0.85 else np.array([0.0, 1.0, 0.0], dtype=np.float64)
    n_vec = np.cross(t0, ref)
    n_vec /= float(np.linalg.norm(n_vec))
    b_vec = np.cross(t0, n_vec)

    angles = np.linspace(0.0, 2.0 * math.pi, sections, endpoint=False)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)

    vertices: list[np.ndarray] = []
    ring_starts: list[int] = []

    for i in range(n_pts):
        if i > 0:
            prev_t = tangents[i - 1]
            cur_t = tangents[i]
            rot_axis = np.cross(prev_t, cur_t)
            axis_len = float(np.linalg.norm(rot_axis))
            if axis_len > 1e-9:
                axis_u = rot_axis / axis_len
                angle = math.acos(max(-1.0, min(1.0, float(np.dot(prev_t, cur_t)))))
                # Rodrigues rotation of n_vec around axis_u by angle
                ca, sa = math.cos(angle), math.sin(angle)
                n_vec = n_vec * ca + np.cross(axis_u, n_vec) * sa + axis_u * float(np.dot(axis_u, n_vec)) * (1.0 - ca)
            # Re-orthogonalize against cur_t
            n_vec = n_vec - cur_t * float(np.dot(n_vec, cur_t))
            nl = float(np.linalg.norm(n_vec))
            if nl > 1e-9:
                n_vec /= nl
            b_vec = np.cross(cur_t, n_vec)

        ring_starts.append(len(vertices))
        center = pts[i]
        for k in range(sections):
            offset = radius * (cos_a[k] * n_vec + sin_a[k] * b_vec)
            vertices.append(center + offset)

    faces: list[list[int]] = []
    for i in range(n_pts - 1):
        ra, rb = ring_starts[i], ring_starts[i + 1]
        for k in range(sections):
            kn = (k + 1) % sections
            # Outward winding: (ra+k, ra+kn, rb+kn) => dTheta x T points radially outward
            faces.append([ra + k, ra + kn, rb + kn])
            faces.append([ra + k, rb + kn, rb + k])

    if cap_ends:
        start_c = len(vertices)
        vertices.append(pts[0])
        r0 = ring_starts[0]
        for k in range(sections):
            kn = (k + 1) % sections
            faces.append([start_c, r0 + kn, r0 + k])

        end_c = len(vertices)
        vertices.append(pts[-1])
        rl = ring_starts[-1]
        for k in range(sections):
            kn = (k + 1) % sections
            faces.append([end_c, rl + k, rl + kn])

    mesh = trimesh.Trimesh(
        vertices=np.asarray(vertices, dtype=np.float64),
        faces=np.asarray(faces, dtype=np.int64),
        process=False,
    )
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _build_legacy_cylinder_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    z0 = float(spec["z_start_mm"]) * scale
    z1 = float(spec["z_end_mm"]) * scale
    height = max(1e-5, abs(z1 - z0))
    radius = (float(spec["diameter_mm"]) * 0.5) * scale
    sections = max(16, min(64, int(spec.get("segments", 36))))
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    mesh.apply_translation([0.0, 0.0, 0.5 * (z0 + z1)])
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _build_legacy_box_mesh(spec: dict[str, Any], scale: float) -> trimesh.Trimesh:
    sx, sy, sz = [max(1e-5, float(v) * scale) for v in spec["size_mm"]]
    cx, cy, cz = [float(v) * scale for v in spec.get("center_mm", [0.0, 0.0, 0.0])]
    mesh = trimesh.creation.box(extents=[sx, sy, sz])
    mesh.apply_translation([cx, cy, cz])
    _apply_optional_transform(mesh, spec, scale)
    return mesh


def _build_shaded_primitives(
    spec: dict[str, Any],
    scale: float,
    *,
    name_prefix: str,
    depth: int = 0,
) -> list[trimesh.Trimesh]:
    """Recursively expand any primitive (including `pattern` and `composite_part`) into PBR-shaded meshes."""
    if depth > 6:
        raise ValueError("Geometry nesting depth exceeded limit (6)")

    kind = str(spec["kind"]).strip()

    if kind == "composite_part":
        results: list[trimesh.Trimesh] = []
        for idx, child in enumerate(spec.get("children", [])):
            # Inherit parent material as fallback if child does not declare its own
            merged = dict(child)
            if "material" not in merged and "color_rgba" not in merged and "material" in spec:
                merged["material"] = spec["material"]
            results.extend(_build_shaded_primitives(merged, scale, name_prefix=f"{name_prefix}_c{idx}", depth=depth + 1))
        return results

    if kind == "pattern":
        count = max(1, min(MAX_PATTERN_COUNT, int(spec["count"])))
        mode = str(spec.get("mode", "linear")).strip().lower()
        item_spec = dict(spec["item"])
        if "material" not in item_spec and "color_rgba" not in item_spec and "material" in spec:
            item_spec["material"] = spec["material"]
        base_meshes = _build_shaded_primitives(item_spec, scale, name_prefix=f"{name_prefix}_pat", depth=depth + 1)

        out: list[trimesh.Trimesh] = []
        if mode == "linear":
            raw_step = spec.get("step_mm", [0.0, 0.0, 1.0])
            if isinstance(raw_step, (int, float)):
                p_axis = str(spec.get("axis", "z")).strip().lower()
                s_val = float(raw_step) * scale
                step = [s_val, 0.0, 0.0] if p_axis == "x" else ([0.0, s_val, 0.0] if p_axis == "y" else [0.0, 0.0, s_val])
            else:
                step = [float(v) * scale for v in raw_step]
                while len(step) < 3:
                    step.append(0.0)
            raw_start = spec.get("start_offset_mm", [0.0, 0.0, 0.0])
            if isinstance(raw_start, (int, float)):
                start_off = [0.0, 0.0, float(raw_start) * scale]
            else:
                start_off = [float(v) * scale for v in raw_start]
                while len(start_off) < 3:
                    start_off.append(0.0)
            centered = bool(spec.get("centered", False))
            center_shift = [-0.5 * (count - 1) * step[i] for i in range(3)] if centered else [0.0, 0.0, 0.0]
            for i in range(count):
                dx = start_off[0] + center_shift[0] + i * step[0]
                dy = start_off[1] + center_shift[1] + i * step[1]
                dz = start_off[2] + center_shift[2] + i * step[2]
                for bm in base_meshes:
                    inst = bm.copy()
                    inst.apply_translation([dx, dy, dz])
                    out.append(inst)
        elif mode == "radial":
            rad = float(spec.get("radius_mm", 0.0)) * scale
            start_deg = float(spec.get("start_angle_deg", 0.0))
            arc_deg = float(spec.get("arc_deg", 360.0))
            rotate_items = bool(spec.get("rotate_items", True))
            axis = str(spec.get("axis", "z")).strip().lower()
            denom = float(count) if abs(arc_deg - 360.0) < 1e-3 else float(max(1, count - 1))
            for i in range(count):
                ang_deg = start_deg + (arc_deg * i) / denom
                ang_rad = math.radians(ang_deg)
                for bm in base_meshes:
                    inst = bm.copy()
                    if rotate_items:
                        if axis == "z":
                            inst.apply_transform(_rotation_matrix_xyz(0.0, 0.0, ang_deg))
                        elif axis == "y":
                            inst.apply_transform(_rotation_matrix_xyz(0.0, ang_deg, 0.0))
                        else:
                            inst.apply_transform(_rotation_matrix_xyz(ang_deg, 0.0, 0.0))
                    if rad > 0.0:
                        if axis == "z":
                            inst.apply_translation([rad * math.cos(ang_rad), rad * math.sin(ang_rad), 0.0])
                        elif axis == "y":
                            inst.apply_translation([rad * math.cos(ang_rad), 0.0, rad * math.sin(ang_rad)])
                        else:
                            inst.apply_translation([0.0, rad * math.cos(ang_rad), rad * math.sin(ang_rad)])
                    out.append(inst)
        else:
            raise ValueError(f"Unsupported pattern mode: {mode!r}")

        # Apply optional outer offset/rotation to the entire pattern group
        for inst in out:
            _apply_optional_transform(inst, spec, scale)
        return out

    if kind == "slotted_cylinder":
        raw_pairs = _build_slotted_cylinder_meshes(spec, scale)
        return [
            _build_pbr_visual(raw_m, mat_cfg, default_name=f"{name_prefix}_slot_{idx}")
            for idx, (raw_m, mat_cfg) in enumerate(raw_pairs)
        ]

    if kind == "lathe_profile":
        raw_mesh = _build_lathe_profile_mesh(spec, scale)
    elif kind == "extruded_polygon":
        raw_mesh = _build_extruded_polygon_mesh(spec, scale)
    elif kind == "hex_prism":
        raw_mesh = _build_hex_prism_mesh(spec, scale)
    elif kind == "rounded_box":
        raw_mesh = _build_rounded_box_mesh(spec, scale)
    elif kind == "tube_path":
        raw_mesh = _build_tube_path_mesh(spec, scale)
    elif kind == "cylinder":
        raw_mesh = _build_legacy_cylinder_mesh(spec, scale)
    elif kind == "box":
        raw_mesh = _build_legacy_box_mesh(spec, scale)
    else:
        raise ValueError(f"Unsupported recipe geometry kind: {kind!r}")

    return [_build_pbr_visual(raw_mesh, spec, default_name=name_prefix)]


def build_twin_scene(recipe: dict[str, Any]) -> tuple[trimesh.Scene, list[dict[str, Any]], int, int]:
    """Build an in-memory `trimesh.Scene` with hierarchical named glTF nodes and PBR materials."""
    scale = float(recipe.get("scale_to_meters", 0.001))
    scene = trimesh.Scene()
    total_triangles = 0
    material_names: set[str] = set()
    parts_entries: list[dict[str, Any]] = []

    for part in recipe["parts"]:
        node_id = str(part["node_id"])
        meshes = _build_shaded_primitives(part, scale, name_prefix=node_id)
        if not meshes:
            raise ValueError(f"Part {node_id} produced zero geometry meshes")

        if len(meshes) == 1:
            m = meshes[0]
            scene.add_geometry(m, node_name=node_id, geom_name=f"geom_{node_id}")
            total_triangles += int(len(m.faces))
            if hasattr(m.visual, "material") and getattr(m.visual.material, "name", None):
                material_names.add(str(m.visual.material.name))
        else:
            # Create one parent group node named `node_id` so Three.js transforms/highlights all children together,
            # while every child sub-mesh has a strictly unique node_name (iPad Swift duplicate-node check).
            scene.graph.update(
                frame_from=scene.graph.base_frame,
                frame_to=node_id,
                matrix=np.eye(4, dtype=np.float64),
            )
            for sub_idx, m in enumerate(meshes):
                sub_node = f"{node_id}__sub_{sub_idx}"
                sub_geom = f"geom_{node_id}__sub_{sub_idx}"
                scene.add_geometry(m, node_name=sub_node, geom_name=sub_geom, parent_node_name=node_id)
                total_triangles += int(len(m.faces))
                if hasattr(m.visual, "material") and getattr(m.visual.material, "name", None):
                    material_names.add(str(m.visual.material.name))

        parts_entries.append(
            {
                "part_id": str(part["part_id"]),
                "node_id": node_id,
                "legacy_zone_id": part.get("legacy_zone_id"),
                "aliases": list(part.get("aliases", [])),
                "citation_id": str(part["citation_id"]),
                "page": int(part["page"]),
            }
        )

    return scene, parts_entries, total_triangles, len(material_names)


def build_twin_from_recipe(recipe: dict[str, Any], *, out_glb_path: Path) -> TwinBuildArtifacts:
    """
    Build a deterministic, self-contained glTF 2.0 PBR binary (.glb) in meters with explicit named
    nodes matching the versioned v1 or v2 recipe (zero external URIs, zero extensionsRequired).
    """
    scene, parts_entries, total_triangles, material_count = build_twin_scene(recipe)

    def _postprocess_gltf_tree(tree: dict[str, Any]) -> None:
        tree.setdefault("asset", {})["generator"] = "FieldScan Cloud Parametric CAD PBR Exporter 2.0.0"
        # Strip optional extension arrays if empty to guarantee clean Contract v2.1.0 conformity
        if "extensionsRequired" in tree and not tree["extensionsRequired"]:
            del tree["extensionsRequired"]
        if "extensionsUsed" in tree and not tree["extensionsUsed"]:
            del tree["extensionsUsed"]
        # Guarantee strictly unique non-empty node names across all nodes
        seen_names: set[str] = set()
        for idx, node in enumerate(tree.get("nodes", [])):
            nm = node.get("name")
            if isinstance(nm, str) and nm:
                if nm in seen_names:
                    node["name"] = f"{nm}__dup_{idx}"
                seen_names.add(node["name"])

    out_glb_path.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = scene.export(file_type="glb", tree_postprocessor=_postprocess_gltf_tree)
    out_glb_path.write_bytes(glb_bytes)

    bounds = scene.bounds.tolist()
    parts_json = {
        "schema_version": 1,
        "product_id": recipe["product_id"],
        "variant_id": recipe["variant_id"],
        "recipe_version": recipe.get("recipe_version", "2.0.0"),
        "unit": "m",
        "parts": parts_entries,
        "views": list(recipe.get("views", [])),
    }
    actions_json = {
        "schema_version": 1,
        "product_id": recipe["product_id"],
        "variant_id": recipe["variant_id"],
        "actions": list(recipe.get("actions", [])),
    }

    return TwinBuildArtifacts(
        glb_path=out_glb_path,
        parts_json=parts_json,
        actions_json=actions_json,
        triangle_count=total_triangles,
        node_count=len(parts_entries),
        bounds_m=bounds,
        material_count=material_count,
        has_pbr_materials=True,
    )


def import_step_file_optional(step_path: Path, *, out_glb_path: Path, linear_deflection: float = 0.2) -> Path:
    """
    Optional E3 STEP importer using CadQuery when the optional `step` extra is installed (§10.3 step 5).
    """
    try:
        import cadquery as cq  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "CadQuery optional extra is not installed; install with `uv sync --extra step` for STEP import"
        ) from exc

    shape = cq.importers.importStep(str(step_path))
    verts, tris = shape.val().tessellate(linear_deflection)
    raw_mesh = trimesh.Trimesh(
        vertices=np.array([[v.x, v.y, v.z] for v in verts], dtype=np.float64) * 0.001,
        faces=np.array(tris, dtype=np.int64),
        process=False,
    )
    mesh = _build_pbr_visual(
        raw_mesh,
        {
            "material": {
                "name": "step_cad_default",
                "baseColorFactor": [0.76, 0.79, 0.82, 1.0],
                "metallicFactor": 0.65,
                "roughnessFactor": 0.35,
            }
        },
        default_name="ImportedSTEPBody",
    )
    scene = trimesh.Scene()
    scene.add_geometry(mesh, node_name="ImportedSTEPBody", geom_name="geom_ImportedSTEPBody")
    out_glb_path.parent.mkdir(parents=True, exist_ok=True)
    out_glb_path.write_bytes(scene.export(file_type="glb"))
    return out_glb_path
