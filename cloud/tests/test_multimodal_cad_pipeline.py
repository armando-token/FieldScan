"""Offline end-to-end tests for the generic 5-stage multimodal CAD/PBR pipeline (Stages 1-5)."""

from __future__ import annotations

import base64
from dataclasses import replace
from io import BytesIO
import json
from pathlib import Path

import httpx
import numpy as np
from PIL import Image, ImageDraw
import pytest

from fieldscan_cloud.db import (
    claim_next_job,
    connect_sqlite,
    enqueue_or_get_active_job,
    ensure_default_tenant_and_credential,
    get_current_publication,
)
from fieldscan_cloud.documents.pipeline import (
    MAX_PACKAGE_ARTIFACTS,
    enforce_artifact_budget,
    process_pdf_document,
)
from fieldscan_cloud.sources.context_client import ContextSearchClient
from fieldscan_cloud.sources.image_harvester import harvest_reference_photos
from fieldscan_cloud.twin.generator import build_twin_from_recipe
from fieldscan_cloud.twin.synthesizer import VlmClient, synthesize_cad_recipe, validate_recipe_schema
from fieldscan_cloud.twin.validator import (
    parse_glb_json_chunk,
    render_twin_preview_views,
    validate_twin_bundle,
)
from fieldscan_cloud.worker import FIXTURES_DIR, _build_fixture_artifacts, process_single_job


def _make_textured_png_bytes(width: int, height: int, *, seed: int = 1, flat: bool = False) -> bytes:
    """Create a synthetic in-memory PNG with real visual variance (or flat solid color if flat=True)."""
    if flat:
        img = Image.new("RGB", (width, height), (210, 210, 210))
    else:
        rng = np.random.default_rng(seed)
        arr = rng.integers(30, 225, size=(height, width, 3), dtype=np.uint8)
        img = Image.fromarray(arr, mode="RGB")
        draw = ImageDraw.Draw(img)
        draw.rectangle([width // 6, height // 6, width * 5 // 6, height * 5 // 6], fill=(50, 90, 140), outline=(230, 230, 230), width=4)
        draw.ellipse([width // 3, height // 3, width * 2 // 3, height * 2 // 3], fill=(210, 160, 40))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _generic_all_primitives_recipe(
    *,
    product_id: str = "acme_flowmeter_x9",
    variant_id: str = "v2_485",
    document_id: str = "src_acme_x9",
) -> dict:
    """Generic non-THT02 CAD v2 recipe exercising every single universal primitive + PBR + embedded texture."""
    return {
        "schema_version": 2,
        "recipe_schema_version": 2,
        "product_id": product_id,
        "variant_id": variant_id,
        "recipe_version": "2.0.0",
        "scale_to_meters": 0.001,
        "control_measurements_m": {
            "total_length_z": 0.100,
            "bracket_width_x": 0.050,
            "tolerance_m": 0.003,
        },
        "parts": [
            {
                "part_id": "probe.cage",
                "node_id": "VentilatedCage",
                "aliases": ["cage", "vent"],
                "kind": "slotted_cylinder",
                "outer_diameter_mm": 20.0,
                "inner_diameter_mm": 16.0,
                "z_start_mm": 0.0,
                "z_end_mm": 25.0,
                "slot_count": 8,
                "slot_rows": 2,
                "core_diameter_mm": 12.0,
                "material": {
                    "name": "stainless_cage",
                    "baseColorFactor": [0.78, 0.81, 0.85, 1.0],
                    "metallicFactor": 0.88,
                    "roughnessFactor": 0.25,
                },
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
            },
            {
                "part_id": "body.shell",
                "node_id": "MainBody",
                "aliases": ["body", "enclosure"],
                "kind": "composite_part",
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
                "children": [
                    {
                        "kind": "lathe_profile",
                        "segments": 40,
                        "points_mm": [
                            [9.5, 25.0],
                            [10.0, 26.0],
                            [10.0, 70.0],
                            [9.5, 71.0],
                        ],
                        "material": {
                            "name": "body_aluminum",
                            "baseColorFactor": [0.75, 0.78, 0.82, 1.0],
                            "metallicFactor": 0.80,
                            "roughnessFactor": 0.32,
                        },
                    },
                    {
                        "kind": "lathe_profile",
                        "segments": 40,
                        "cap_ends": False,
                        "points_mm": [[10.1, 35.0], [10.1, 55.0]],
                        "material": {"name": "body_label", "metallicFactor": 0.1, "roughnessFactor": 0.45},
                        "procedural_label": {
                            "title": "ACME X9 FLOW",
                            "subtitle": "24VDC / RS-485",
                            "mapping": "cylindrical",
                        },
                    },
                ],
            },
            {
                "part_id": "mount.plate",
                "node_id": "MountingPlate",
                "aliases": ["flange", "plate"],
                "kind": "extruded_polygon",
                "z_start_mm": 45.0,
                "z_end_mm": 51.0,
                "outer_mm": [[-25.0, -12.0], [25.0, -12.0], [25.0, 12.0], [-25.0, 12.0]],
                "circular_holes_mm": [
                    {"x": -18.0, "y": 0.0, "diameter_mm": 5.0},
                    {"x": 18.0, "y": 0.0, "diameter_mm": 5.0},
                ],
                "material": {
                    "name": "plate_steel",
                    "baseColorFactor": [0.60, 0.64, 0.70, 1.0],
                    "metallicFactor": 0.75,
                    "roughnessFactor": 0.38,
                },
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
            },
            {
                "part_id": "pcb.array",
                "node_id": "SwitchArray",
                "aliases": ["switches", "pcb"],
                "kind": "composite_part",
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
                "children": [
                    {
                        "kind": "rounded_box",
                        "size_mm": [10.0, 4.0, 16.0],
                        "center_mm": [0.0, 0.0, 48.0],
                        "bevel_mm": 0.4,
                        "material": {
                            "name": "pcb_green",
                            "baseColorFactor": [0.10, 0.42, 0.22, 1.0],
                            "metallicFactor": 0.05,
                            "roughnessFactor": 0.48,
                        },
                    },
                    {
                        "kind": "pattern",
                        "mode": "linear",
                        "count": 4,
                        "centered": True,
                        "step_mm": [0.0, 0.0, 2.5],
                        "item": {
                            "kind": "rounded_box",
                            "size_mm": [2.0, 1.4, 1.2],
                            "center_mm": [0.0, 2.5, 48.0],
                            "bevel_mm": 0.15,
                            "material": {
                                "name": "actuator_white",
                                "baseColorFactor": [0.95, 0.95, 0.95, 1.0],
                                "metallicFactor": 0.0,
                                "roughnessFactor": 0.40,
                            },
                        },
                    },
                    {
                        "kind": "pattern",
                        "mode": "radial",
                        "count": 4,
                        "radius_mm": 6.5,
                        "axis": "z",
                        "item": {
                            "kind": "cylinder",
                            "diameter_mm": 1.6,
                            "z_start_mm": 69.0,
                            "z_end_mm": 72.0,
                            "material": {
                                "name": "boss_pin",
                                "baseColorFactor": [0.85, 0.72, 0.25, 1.0],
                                "metallicFactor": 0.90,
                                "roughnessFactor": 0.24,
                            },
                        },
                    },
                ],
            },
            {
                "part_id": "gland.tail",
                "node_id": "CableGland",
                "aliases": ["gland", "cable"],
                "kind": "composite_part",
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
                "children": [
                    {
                        "kind": "hex_prism",
                        "across_flats_mm": 16.0,
                        "z_start_mm": 71.0,
                        "z_end_mm": 80.0,
                        "chamfer_mm": 0.8,
                        "material": {
                            "name": "hex_nut",
                            "baseColorFactor": [0.48, 0.52, 0.58, 1.0],
                            "metallicFactor": 0.85,
                            "roughnessFactor": 0.30,
                        },
                    },
                    {
                        "kind": "tube_path",
                        "diameter_mm": 3.0,
                        "sections": 16,
                        "points_mm": [[0.0, 0.0, 80.0], [1.5, 0.5, 90.0], [3.0, 1.0, 100.0]],
                        "material": {
                            "name": "jacket_cable",
                            "baseColorFactor": [0.15, 0.16, 0.18, 1.0],
                            "metallicFactor": 0.0,
                            "roughnessFactor": 0.78,
                        },
                    },
                ],
            },
        ],
        "views": [
            {
                "view_id": "default_overview",
                "label": "Overview",
                "camera_offset_m": [0.16, 0.08, 0.05],
                "target_m": [0.0, 0.0, 0.05],
                "exploded_offsets_m": {},
            },
            {
                "view_id": "open_internal",
                "label": "Exploded Internal",
                "camera_offset_m": [0.12, 0.06, 0.05],
                "target_m": [0.0, 0.0, 0.05],
                "exploded_offsets_m": {"MainBody": [0.0, 0.03, 0.0]},
            },
        ],
        "actions": [
            {
                "kind": "focus_part",
                "part_id": "pcb.array",
                "view_id": "open_internal",
                "citation_id": f"{document_id}:p1:section1",
                "page": 1,
            }
        ],
    }


def test_stage1_pdf_rasterization_and_256_artifact_budget(worker_config, tmp_path: Path):
    """Stage 1: Every PDF page renders to a crisp PNG with image_path in docs/index.json and stays <= 256 artifacts."""
    pdf_path = FIXTURES_DIR / "tht02_v1_1" / "THT02_Users_Manual_v1.1.pdf"
    doc_out = process_pdf_document(
        pdf_path,
        work_dir=tmp_path / "raster_work",
        document_id="tht02_raster_test",
        revision_label="V1.1",
        title="Raster Test",
        run_ocr=False,
        render_page_images=True,
    )
    assert doc_out.page_count == 9
    for idx_entry, page in zip(doc_out.index_dict["pages"], doc_out.pages):
        expected_rel = f"docs/tht02_raster_test/pages/page_{page.page:03d}.png"
        assert page.image_relpath == expected_rel
        assert idx_entry["image_path"] == expected_rel
        assert page.image_local_path is not None and page.image_local_path.is_file()
        assert 400 <= page.image_width <= 1200
        assert page.image_height >= 400

    # Verify full fixture publication includes all 9 manual_page_image artifacts
    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot")
        stage = tmp_path / "pub_stage"
        stage.mkdir()
        pub, _ = _build_fixture_artifacts(
            conn,
            config=worker_config,
            fixture_dir=FIXTURES_DIR / "tht02_v1_1",
            staging_dir=stage,
            tenant_id="pilot",
            run_ocr=False,
        )
        cur = get_current_publication(
            conn,
            tenant_id="pilot",
            channel="pilot",
            product_id="tzone_tht02",
            variant_id="v1_1_rs485",
        )
        assert cur is not None
        env = json.loads(bytes(cur["envelope_bytes"]).decode("utf-8"))
        manifest = json.loads(base64.b64decode(env["payload_b64"]).decode("utf-8"))
        page_imgs = [a for a in manifest["artifacts"] if a["role"] == "manual_page_image"]
        assert len(page_imgs) == 9
        assert len(manifest["artifacts"]) <= MAX_PACKAGE_ARTIFACTS
        assert pub.capabilities.interactive_twin is True
    finally:
        conn.close()

    # Budget guard on synthetic 130-page manual: consolidates markdown & stays <= 256 total artifacts
    huge_docs = [
        {"role": "manual_pdf", "path": "docs/big/manual.pdf", "sha256": "a" * 64, "byte_count": 2_000_000},
        {"role": "document_index", "path": "docs/index.json", "sha256": "b" * 64, "byte_count": 32_000},
    ]
    for p in range(1, 131):
        huge_docs.append({"role": "manual_page_image", "path": f"docs/big/pages/page_{p:03d}.png", "sha256": f"{p:064x}", "byte_count": 150_000})
        huge_docs.append({"role": "manual_markdown", "path": f"docs/big/pages/page_{p:03d}.md", "sha256": f"{p + 500:064x}", "byte_count": 2_000})
    cons_md = {"role": "manual_markdown", "path": "docs/big/manual.md", "sha256": "c" * 64, "byte_count": 180_000}

    kept, notes = enforce_artifact_budget(huge_docs, consolidated_markdown_artifact=cons_md, reserved_non_doc_slots=6)
    assert len(kept) + 6 <= MAX_PACKAGE_ARTIFACTS
    assert "MARKDOWN_CONSOLIDATED_FOR_ARTIFACT_BUDGET" in notes
    assert len([a for a in kept if a["role"] == "manual_page_image"]) == 130
    assert [a["path"] for a in kept if a["role"] == "manual_markdown"] == ["docs/big/manual.md"]


def test_stage2_image_harvester_filters_contamination_and_low_res(tmp_path: Path):
    """Stage 2: Accepts confirmed multi-angle >=300px photos; rejects wrong model, small icons, flat images, SSRF."""
    good_png_1 = _make_textured_png_bytes(640, 480, seed=11)
    good_png_2 = _make_textured_png_bytes(512, 512, seed=22)
    tiny_icon = _make_textured_png_bytes(120, 120, seed=33)
    flat_img = _make_textured_png_bytes(500, 500, flat=True)
    banner_img = _make_textured_png_bytes(1200, 200, seed=44)

    def _ctx_handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "request_id": "req_photo_01",
                "results": [
                    {
                        "url": "https://distributor.example.com/acme-fmx90-rs485",
                        "title": "Acme FM-X90 RS-485 Industrial Flow Sensor",
                        "description": "Official Acme FM-X90 RS-485 stainless housing product photos",
                        "markdown": (
                            "![front](https://cdn.example.com/acme-x9-front.png)\n"
                            "![side](https://cdn.example.com/acme-x9-side.png)\n"
                            "![logo](https://cdn.example.com/brand-logo.png)\n"
                            "![tiny](https://cdn.example.com/acme-x9-thumb.png)\n"
                            "![flat](https://cdn.example.com/acme-x9-blank.png)\n"
                            "![banner](https://cdn.example.com/acme-x9-wide.png)"
                        ),
                    },
                    {
                        "url": "https://other.example.com/wrong-model",
                        "title": "Acme Z999 Unrelated Pressure Gauge",
                        "description": "Different model should be rejected",
                        "markdown": "![wrong](https://cdn.example.com/wrong-model.png)",
                    },
                    {
                        "url": "https://bad.example.com/acme-fmx90-contradict",
                        "title": "Acme FM-X90 4-20mA Only Variant",
                        "description": "4-20mA only model, not RS485",
                        "markdown": "![badvar](https://cdn.example.com/badvar.png)",
                    },
                ],
            },
        )

    def _dl_handler(req: httpx.Request) -> httpx.Response:
        u = str(req.url)
        if u.endswith("acme-x9-front.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=good_png_1)
        if u.endswith("acme-x9-side.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=good_png_2)
        if u.endswith("acme-x9-thumb.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=tiny_icon)
        if u.endswith("acme-x9-blank.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=flat_img)
        if u.endswith("acme-x9-wide.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=banner_img)
        return httpx.Response(404)

    ctx_client = ContextSearchClient(
        search_url="https://api.context.dev/v1/web/search",
        api_key="test_key",
        transport=httpx.MockTransport(_ctx_handler),
    )
    ref_dir = tmp_path / "staging_refs"
    res = harvest_reference_photos(
        context_client=ctx_client,
        manufacturer="Acme",
        model="FM-X90",
        variant="RS485",
        staging_ref_dir=ref_dir,
        download_transport=httpx.MockTransport(_dl_handler),
        check_dns=False,
    )
    assert len(res.images) == 2
    assert all(im.local_path.parent == ref_dir and im.local_path.is_file() for im in res.images)
    rejected_reasons = {r["reason"] for r in res.audit_rejected}
    assert "MODEL_NOT_CONFIRMED_ON_PAGE" in rejected_reasons
    assert any(r.startswith("VARIANT_CONTRADICTION") for r in rejected_reasons)
    assert any(r.startswith("IMAGE_TOO_SMALL") for r in rejected_reasons)
    assert "LOW_VISUAL_VARIANCE" in rejected_reasons


def test_stage4_all_8_primitives_pbr_embedded_texture_and_v1_compat(worker_config, tmp_path: Path):
    """Stage 4: All 8 CAD v2 primitives + PBRMaterial + embedded Pillow PNG + v1 compat pass Khronos with 0 errors."""
    recipe_v2 = _generic_all_primitives_recipe()
    ok, errs = validate_recipe_schema(recipe_v2, document_page_count=4)
    assert ok is True, errs

    glb_v2 = tmp_path / "generic_v2.glb"
    built = build_twin_from_recipe(recipe_v2, out_glb_path=glb_v2)
    report = validate_twin_bundle(
        glb_path=built.glb_path,
        parts_json=built.parts_json,
        actions_json=built.actions_json,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=4,
        control_measurements_m=recipe_v2["control_measurements_m"],
        bounds_m=built.bounds_m,
    )
    assert report.valid is True, f"Errors: {report.semantic_errors} | Khronos: {report.khronos_report}"
    assert report.khronos_errors == 0
    assert report.pbr_material_count >= 6
    assert report.embedded_image_count == 1

    gltf_json = parse_glb_json_chunk(glb_v2)
    assert not gltf_json.get("extensionsRequired")
    assert all("uri" not in img for img in gltf_json.get("images", []))
    assert all("uri" not in buf for buf in gltf_json.get("buffers", []))
    node_map = {n["name"]: n for n in gltf_json["nodes"] if "name" in n}
    assert "MainBody" in node_map and len(node_map["MainBody"].get("children", [])) >= 2
    assert "SwitchArray" in node_map and len(node_map["SwitchArray"].get("children", [])) >= 5
    assert "CableGland" in node_map and len(node_map["CableGland"].get("children", [])) >= 2

    # Upgraded reference fixture tht02_v1_1 v2 must also pass Khronos with 0 errors & exact dimensions
    ref_recipe = json.loads((FIXTURES_DIR / "tht02_v1_1" / "recipe.json").read_text(encoding="utf-8"))
    ref_glb = tmp_path / "tht02_v2.glb"
    ref_built = build_twin_from_recipe(ref_recipe, out_glb_path=ref_glb)
    ref_report = validate_twin_bundle(
        glb_path=ref_built.glb_path,
        parts_json=ref_built.parts_json,
        actions_json=ref_built.actions_json,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=9,
        control_measurements_m=ref_recipe["control_measurements_m"],
        bounds_m=ref_built.bounds_m,
    )
    assert ref_report.valid is True, f"THT02 v2 errors: {ref_report.semantic_errors} | {ref_report.khronos_report}"
    assert ref_report.pbr_material_count >= 10
    assert ref_report.embedded_image_count >= 1

    # Stage 5 headless CPU 3-view renderer generates 3 valid PNG previews without OpenGL/GPU
    previews = render_twin_preview_views(
        glb_path=ref_built.glb_path,
        parts_json=ref_built.parts_json,
        out_dir=tmp_path / "previews",
    )
    assert len(previews) == 3
    for p in previews:
        assert p.is_file()
        with Image.open(p) as im:
            assert im.size == (640, 480)
            assert float(np.std(np.asarray(im, dtype=np.float32))) > 5.0

    # Legacy v1 backward compatibility (cylinder + box + color_rgba)
    v1_recipe = {
        "schema_version": 1,
        "product_id": "legacy_sensor",
        "variant_id": "v1",
        "scale_to_meters": 0.001,
        "parts": [
            {
                "part_id": "body",
                "node_id": "LegacyBody",
                "kind": "cylinder",
                "z_start_mm": 0.0,
                "z_end_mm": 50.0,
                "diameter_mm": 20.0,
                "color_rgba": [180, 190, 200, 255],
                "citation_id": "doc:p1:section1",
                "page": 1,
            },
            {
                "part_id": "box",
                "node_id": "LegacyBox",
                "kind": "box",
                "size_mm": [12.0, 12.0, 10.0],
                "center_mm": [0.0, 0.0, 55.0],
                "color_rgba": [190, 50, 50, 255],
                "citation_id": "doc:p1:section1",
                "page": 1,
            },
        ],
        "views": [],
        "actions": [],
    }
    v1_built = build_twin_from_recipe(v1_recipe, out_glb_path=tmp_path / "legacy_v1.glb")
    v1_rep = validate_twin_bundle(
        glb_path=v1_built.glb_path,
        parts_json=v1_built.parts_json,
        actions_json=v1_built.actions_json,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=1,
    )
    assert v1_rep.valid is True


def test_stage3_vlm_providers_openai_gemini_anthropic(tmp_path: Path):
    """Stage 3: VlmClient supports OpenAI-compatible, Gemini, and Anthropic JSON responses."""
    sample_img = tmp_path / "page1.png"
    sample_img.write_bytes(_make_textured_png_bytes(320, 320, seed=7))

    oa = VlmClient(
        provider="openai_compatible",
        api_url="https://vlm.example.com/v1/chat/completions",
        model="gpt-4o",
        api_key="k",
        transport=httpx.MockTransport(
            lambda req: httpx.Response(200, json={"choices": [{"message": {"content": '{"ok": true, "via": "openai"}'}}]})
        ),
    )
    assert oa.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {"ok": True, "via": "openai"}

    gm = VlmClient(
        provider="gemini",
        api_url="https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        model="gemini-2.5-pro",
        api_key="k",
        transport=httpx.MockTransport(
            lambda req: httpx.Response(
                200,
                json={"candidates": [{"content": {"parts": [{"text": '```json\n{"ok": true, "via": "gemini"}\n```'}]}}]},
            )
        ),
    )
    assert gm.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {"ok": True, "via": "gemini"}

    an = VlmClient(
        provider="anthropic",
        api_url="https://api.anthropic.com/v1/messages",
        model="claude-3-7-sonnet",
        api_key="k",
        transport=httpx.MockTransport(
            lambda req: httpx.Response(200, json={"content": [{"type": "text", "text": '{"ok": true, "via": "anthropic"}'}]})
        ),
    )
    assert an.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {"ok": True, "via": "anthropic"}

    # Amazon Bedrock Mantle: base URL auto-completion, response_format fallback, and max_completion_tokens fallback
    mantle_calls: list[dict] = []

    def _mantle_handler(req: httpx.Request) -> httpx.Response:
        assert str(req.url) == "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions"
        assert req.headers.get("authorization") == "Bearer bedrock-mantle-key"
        body = json.loads(req.content.decode("utf-8"))
        mantle_calls.append(body)
        if "response_format" in body:
            return httpx.Response(400, text="Unsupported parameter: response_format is not supported for this model")
        if "max_tokens" in body:
            return httpx.Response(400, text="Use max_completion_tokens instead of max_tokens")
        return httpx.Response(
            200,
            json={
                "model": "anthropic.claude-sonnet-5",
                "choices": [{"message": {"content": '```json\n{"ok": true, "via": "bedrock_mantle"}\n```'}}],
                "usage": {"prompt_tokens": 110, "completion_tokens": 25, "total_tokens": 135},
            },
        )

    bm = VlmClient(
        provider="bedrock_mantle",
        api_url="https://bedrock-mantle.us-east-1.api.aws/v1",
        model="mistral.mistral-large-3-675b-instruct",
        api_key="bedrock-mantle-key",
        transport=httpx.MockTransport(_mantle_handler),
    )
    assert bm.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {
        "ok": True,
        "via": "bedrock_mantle",
    }
    assert len(mantle_calls) == 3
    assert "response_format" not in mantle_calls[-1]
    assert "max_completion_tokens" in mantle_calls[-1] and "max_tokens" not in mantle_calls[-1]

    # Bedrock Mantle with `anthropic.*` auto-routes to `/anthropic/v1/messages` with Bearer auth
    def _mantle_anth_handler(req: httpx.Request) -> httpx.Response:
        assert str(req.url) == "https://bedrock-mantle.us-east-1.api.aws/anthropic/v1/messages"
        assert req.headers.get("authorization") == "Bearer bedrock-mantle-key"
        assert req.headers.get("anthropic-version") == "2023-06-01"
        return httpx.Response(200, json={"content": [{"type": "text", "text": '{"ok": true, "via": "mantle_anthropic"}'}]})

    bm_anth = VlmClient(
        provider="bedrock_mantle",
        api_url="https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions",
        model="anthropic.claude-sonnet-5",
        api_key="bedrock-mantle-key",
        transport=httpx.MockTransport(_mantle_anth_handler),
    )
    assert bm_anth.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {
        "ok": True,
        "via": "mantle_anthropic",
    }

    # Amazon Bedrock native Converse REST API: modelId percent-encoding (`:` -> `%3A`), PNG image block, usage mapping
    def _bedrock_converse_handler(req: httpx.Request) -> httpx.Response:
        assert str(req.url) == "https://bedrock-runtime.us-west-2.amazonaws.com/model/us.amazon.nova-pro-v1%3A0/converse"
        assert req.headers.get("authorization") == "Bearer bedrock-api-key"
        body = json.loads(req.content.decode("utf-8"))
        assert body["system"] == [{"text": "s"}]
        user_blocks = body["messages"][-1]["content"]
        assert user_blocks[0]["image"]["format"] == "png"
        assert len(user_blocks[0]["image"]["source"]["bytes"]) > 20
        return httpx.Response(
            200,
            json={
                "output": {"message": {"role": "assistant", "content": [{"text": '{"ok": true, "via": "bedrock_converse"}'}]}},
                "usage": {"inputTokens": 90, "outputTokens": 18, "totalTokens": 108},
            },
        )

    bc = VlmClient(
        provider="bedrock",
        api_url="https://bedrock-runtime.us-west-2.amazonaws.com/model/{model}/converse",
        model="us.amazon.nova-pro-v1:0",
        api_key="bedrock-api-key",
        transport=httpx.MockTransport(_bedrock_converse_handler),
    )
    assert bc.generate_json(system_prompt="s", user_prompt="u", image_paths=[sample_img]) == {
        "ok": True,
        "via": "bedrock_converse",
    }
    chat_res = bc.generate_chat(
        system_prompt="s",
        user_prompt="Inspect sensor",
        history=[{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}],
        image_paths=[sample_img],
        max_tokens=200,
    )
    assert chat_res["provider"] == "bedrock"
    assert chat_res["usage"] == {"prompt_tokens": 90, "completion_tokens": 18, "total_tokens": 108}


def test_stages_1_to_5_end_to_end_retry_degradation_and_privacy_isolation(worker_config, tmp_path: Path):
    """
    Full offline end-to-end worker test for a discovered OEM sensor (Stages 1->2->3->4->5):
    - Case A: Attempt 1 visual review fails -> 1 retry with feedback -> Attempt 2 passes -> ready with PBR GLB + PNGs.
    - Case B: Both visual review attempts fail -> honest degradation to partial docs_only (PNGs still published).
    - Strict Privacy Check: 0 harvested photo SHA-256s ever enter CAS `objects` or manifest, and `staging/` is wiped.
    """
    # Use real THT02 PDF bytes under a different OEM model query (`TZ THT-02` vs discovered `THT02` alias)
    # Using manufacturer=TZONE, model="THT-02-GEN" won't match fixture, while PDF text contains "THT-02" if we query "THT-02" with a new variant!
    # Wait: `_find_matching_fixtures` checks variant_id/variant_code; passing variant="V9-AUTO" won't match fixtures
    # while `document_confirms_model` checks `model="TZ THT-02"` inside the real OEM PDF!
    pdf_bytes = (FIXTURES_DIR / "tht02_v1_1" / "THT02_Users_Manual_v1.1.pdf").read_bytes()
    ref_photo_bytes = _make_textured_png_bytes(600, 450, seed=99)
    import hashlib
    ref_photo_sha = hashlib.sha256(ref_photo_bytes).hexdigest()

    def _ctx_handler(req: httpx.Request) -> httpx.Response:
        body = json.loads(req.content.decode("utf-8"))
        q = body.get("query", "").lower()
        if "product photo" in q:
            return httpx.Response(
                200,
                json={
                    "request_id": "req_img_e2e",
                    "results": [
                        {
                            "url": "https://www.tzonedigital.com/en/product/tht02-v9",
                            "title": "TZONE TZ THT-02 V9-AUTO Product Photos",
                            "description": "TZONE TZ THT-02 RS485 industrial sensor stainless housing",
                            "markdown": "![angle1](https://cdn.tzonedigital.com/tht02-angle1.png)",
                        }
                    ],
                },
            )
        return httpx.Response(
            200,
            json={
                "request_id": "req_pdf_e2e",
                "results": [
                    {
                        "url": "https://www.tzonedigital.com/manuals/THT02_V9_Manual.pdf",
                        "title": "TZONE TZ THT-02 User Manual",
                        "description": "Official TZONE TZ THT-02 PDF manual",
                    }
                ],
            },
        )

    def _dl_handler(req: httpx.Request) -> httpx.Response:
        if str(req.url).endswith(".pdf"):
            return httpx.Response(200, headers={"content-type": "application/pdf"}, content=pdf_bytes)
        if str(req.url).endswith("tht02-angle1.png"):
            return httpx.Response(200, headers={"content-type": "image/png"}, content=ref_photo_bytes)
        return httpx.Response(404)

    ctx_client = ContextSearchClient(
        search_url="https://api.context.dev/v1/web/search",
        api_key="test_ctx",
        transport=httpx.MockTransport(_ctx_handler),
    )
    dl_transport = httpx.MockTransport(_dl_handler)

    cfg = replace(
        worker_config,
        image_harvest_enabled=True,
        vlm_enabled=True,
        vlm_api_key="test_vlm",
        vlm_visual_review=True,
        vlm_min_visual_score=0.70,
    )

    conn = connect_sqlite(cfg.db_path, expected_journal_mode="DELETE")
    try:
        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot")

        # Case A: VLM visual review fails attempt 1, passes attempt 2 after feedback retry
        call_counter = {"synth": 0, "review": 0}

        def _vlm_retry_pass_handler(req: httpx.Request) -> httpx.Response:
            payload = json.loads(req.content.decode("utf-8"))
            sys_msg = payload["messages"][0]["content"]
            user_text = payload["messages"][1]["content"][0]["text"]
            if "visual QA inspector" in sys_msg:
                call_counter["review"] += 1
                if call_counter["review"] == 1:
                    resp_obj = {"passed": False, "score": 0.42, "issues": ["Flange too thin"], "feedback": "Thicken mounting plate"}
                else:
                    resp_obj = {"passed": True, "score": 0.91, "issues": [], "feedback": "Accurate silhouette and PBR"}
            else:
                call_counter["synth"] += 1
                if call_counter["synth"] == 2:
                    assert "Thicken mounting plate" in user_text
                # Extract document_id from user_text so citation_ids match discovered source_id
                import re
                m = re.search(r"Document ID:\s*'([^']+)'", user_text)
                doc_id = m.group(1) if m else "src_doc"
                resp_obj = _generic_all_primitives_recipe(
                    product_id="tzone_tztht02",
                    variant_id="v9auto",
                    document_id=doc_id,
                )
            return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(resp_obj)}}]})

        vlm_pass = VlmClient(
            provider="openai_compatible",
            api_url="https://vlm.example.com/v1/chat/completions",
            model="gpt-4o",
            api_key="test_vlm",
            transport=httpx.MockTransport(_vlm_retry_pass_handler),
        )

        j1, _ = enqueue_or_get_active_job(
            conn,
            tenant_id="pilot",
            channel="pilot",
            request_payload={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": "V9-AUTO", "hardware_revision": None},
        )
        claimed1 = claim_next_job(conn, lease_sec=120, max_attempts=3)
        process_single_job(
            conn,
            config=cfg,
            job_row=claimed1,
            context_client=ctx_client,
            vlm_client=vlm_pass,
            download_transport=dl_transport,
            check_dns=False,
        )
        done1 = conn.execute("SELECT * FROM jobs WHERE id = ?;", (j1["id"],)).fetchone()
        assert done1["state"] == "completed"
        res1 = json.loads(done1["result_json"])
        assert res1["availability"] == "ready"
        assert res1["capabilities"]["interactive_twin"] == "available"
        assert call_counter["synth"] == 2 and call_counter["review"] == 2

        # Privacy invariant: external harvested photo SHA-256 NEVER enters CAS objects or signed manifest!
        assert conn.execute("SELECT 1 FROM objects WHERE sha256 = ?;", (ref_photo_sha,)).fetchone() is None
        ev_row = conn.execute(
            "SELECT detail_json FROM source_events WHERE job_id = ? AND event_type = 'reference_photos_harvested';",
            (j1["id"],),
        ).fetchone()
        assert ev_row is not None
        ev_detail = json.loads(ev_row["detail_json"])
        assert ev_detail["accepted_count"] == 1
        assert ev_detail["ephemeral_only"] is True
        assert ev_detail["accepted"][0]["sha256"] == ref_photo_sha
        # Staging directory for job 1 must be completely deleted
        assert not (cfg.data_dir / "staging" / j1["id"]).exists()

        # Case B: Both visual review attempts fail -> honest degradation to partial (docs_only with PNG pages)
        def _vlm_always_fail_review_handler(req: httpx.Request) -> httpx.Response:
            payload = json.loads(req.content.decode("utf-8"))
            sys_msg = payload["messages"][0]["content"]
            user_text = payload["messages"][1]["content"][0]["text"]
            if "visual QA inspector" in sys_msg:
                resp_obj = {"passed": False, "score": 0.30, "issues": ["Silhouette mismatch"], "feedback": "Retry"}
            else:
                import re
                m = re.search(r"Document ID:\s*'([^']+)'", user_text)
                doc_id = m.group(1) if m else "src_doc"
                resp_obj = _generic_all_primitives_recipe(
                    product_id="tzone_tztht02",
                    variant_id="v10fail",
                    document_id=doc_id,
                )
            return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(resp_obj)}}]})

        vlm_fail = VlmClient(
            provider="openai_compatible",
            api_url="https://vlm.example.com/v1/chat/completions",
            model="gpt-4o",
            api_key="test_vlm",
            transport=httpx.MockTransport(_vlm_always_fail_review_handler),
        )
        j2, _ = enqueue_or_get_active_job(
            conn,
            tenant_id="pilot",
            channel="pilot",
            request_payload={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": "V10-FAIL", "hardware_revision": None},
        )
        claimed2 = claim_next_job(conn, lease_sec=120, max_attempts=3)
        process_single_job(
            conn,
            config=cfg,
            job_row=claimed2,
            context_client=ctx_client,
            vlm_client=vlm_fail,
            download_transport=dl_transport,
            check_dns=False,
        )
        done2 = conn.execute("SELECT * FROM jobs WHERE id = ?;", (j2["id"],)).fetchone()
        res2 = json.loads(done2["result_json"])
        assert res2["availability"] == "partial"
        assert res2["capabilities"]["documentation"] == "available"
        assert res2["capabilities"]["interactive_twin"] == "unavailable"
        assert "TWIN_VISUAL_REVIEW_FAILED" in res2["reason_codes"]
        assert "INTERNAL_GEOMETRY_UNCONFIRMED" in res2["reason_codes"]
        assert not (cfg.data_dir / "staging" / j2["id"]).exists()
    finally:
        conn.close()
