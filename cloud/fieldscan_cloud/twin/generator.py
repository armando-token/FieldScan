"""Deterministic CPU GLB generator and semantic metadata builder (Megaplan §10)."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

import numpy as np
import trimesh


@dataclass(frozen=True)
class TwinBuildArtifacts:
    glb_path: Path
    parts_json: dict[str, Any]
    actions_json: dict[str, Any]
    triangle_count: int
    node_count: int
    bounds_m: list[list[float]]


def _build_part_mesh(part: dict[str, Any], scale: float) -> trimesh.Trimesh:
    kind = part["kind"]
    if kind == "cylinder":
        z0 = float(part["z_start_mm"]) * scale
        z1 = float(part["z_end_mm"]) * scale
        height = max(1e-5, z1 - z0)
        radius = (float(part["diameter_mm"]) * 0.5) * scale
        mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=24)
        mesh.apply_translation([0.0, 0.0, 0.5 * (z0 + z1)])
    elif kind == "box":
        sx, sy, sz = [float(v) * scale for v in part["size_mm"]]
        cx, cy, cz = [float(v) * scale for v in part["center_mm"]]
        mesh = trimesh.creation.box(extents=[sx, sy, sz])
        mesh.apply_translation([cx, cy, cz])
    else:
        raise ValueError(f"Unsupported recipe geometry kind: {kind!r}")

    rgba = part.get("color_rgba", [180, 190, 200, 255])
    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        vertex_colors=np.tile(np.array(rgba, dtype=np.uint8), (len(mesh.vertices), 1)),
    )
    return mesh


def build_twin_from_recipe(recipe: dict[str, Any], *, out_glb_path: Path) -> TwinBuildArtifacts:
    """
    Build a deterministic, self-contained glTF 2.0 binary (.glb) in meters with explicit named nodes
    matching the versioned recipe (§10.2 & §10.3).
    """
    scale = float(recipe.get("scale_to_meters", 0.001))
    scene = trimesh.Scene()
    total_triangles = 0

    parts_entries: list[dict[str, Any]] = []
    for part in recipe["parts"]:
        mesh = _build_part_mesh(part, scale)
        node_id = str(part["node_id"])
        geom_name = f"geom_{node_id}"
        scene.add_geometry(mesh, node_name=node_id, geom_name=geom_name)
        total_triangles += int(len(mesh.faces))
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

    def _postprocess_gltf_tree(tree: dict[str, Any]) -> None:
        # Guarantee stable asset generator stamp and clean named nodes without external URIs
        tree.setdefault("asset", {})["generator"] = "FieldScan Cloud CPU Twin Exporter 0.1.0"

    out_glb_path.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = scene.export(file_type="glb", tree_postprocessor=_postprocess_gltf_tree)
    out_glb_path.write_bytes(glb_bytes)

    bounds = scene.bounds.tolist()
    parts_json = {
        "schema_version": 1,
        "product_id": recipe["product_id"],
        "variant_id": recipe["variant_id"],
        "recipe_version": recipe.get("recipe_version", "1.0.0"),
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
    mesh = trimesh.Trimesh(
        vertices=np.array([[v.x, v.y, v.z] for v in verts], dtype=np.float64) * 0.001,
        faces=np.array(tris, dtype=np.int64),
    )
    scene = trimesh.Scene()
    scene.add_geometry(mesh, node_name="ImportedSTEPBody", geom_name="geom_ImportedSTEPBody")
    out_glb_path.parent.mkdir(parents=True, exist_ok=True)
    out_glb_path.write_bytes(scene.export(file_type="glb"))
    return out_glb_path
