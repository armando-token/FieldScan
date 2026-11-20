"""Document processing and CPU GLB digital twin tests (CL-DOC-01..03, CL-CAD-01..04)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import shutil

import pytest

from fieldscan_cloud.documents.pipeline import (
    classify_document_change,
    validate_page_references,
)
from fieldscan_cloud.twin.generator import build_twin_from_recipe
from fieldscan_cloud.twin.validator import validate_twin_bundle
from fieldscan_cloud.worker import FIXTURES_DIR


def test_twin_glb_valid_and_missing_node_rejected(worker_config, tmp_path: Path):
    recipe = json.loads((FIXTURES_DIR / "tht02_v1_1" / "recipe.json").read_text(encoding="utf-8"))
    glb_path = tmp_path / "tht02.glb"
    built = build_twin_from_recipe(recipe, out_glb_path=glb_path)

    # CL-CAD-01: Valid GLB, meters dimensions, traceable part/node IDs
    report = validate_twin_bundle(
        glb_path=built.glb_path,
        parts_json=built.parts_json,
        actions_json=built.actions_json,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=9,
        control_measurements_m=recipe["control_measurements_m"],
        bounds_m=built.bounds_m,
    )
    assert report.valid is True, f"Expected valid twin, errors={report.semantic_errors}"
    assert "DIPBank" in report.node_names

    # CL-CAD-02: Removing a node referenced by a part/action fails semantic validation
    broken_parts = copy.deepcopy(built.parts_json)
    broken_parts["parts"][0]["node_id"] = "NonExistentNode"
    bad_report = validate_twin_bundle(
        glb_path=built.glb_path,
        parts_json=broken_parts,
        actions_json=built.actions_json,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=9,
    )
    assert bad_report.valid is False
    assert "TWIN_NODE_MISSING" in bad_report.reason_codes

    # CL-DOC-02: Action referencing out-of-range page rejected
    bad_actions = copy.deepcopy(built.actions_json)
    bad_actions["actions"][0]["page"] = 99
    bad_page_report = validate_twin_bundle(
        glb_path=built.glb_path,
        parts_json=built.parts_json,
        actions_json=bad_actions,
        validator_bin=worker_config.gltf_validator_path,
        document_page_count=9,
    )
    assert bad_page_report.valid is False
    assert "PROCEDURE_REFERENCE_MISSING" in bad_page_report.reason_codes
    assert validate_page_references([1, 5, 12], 9) == ["PAGE_OUT_OF_RANGE:12/9"]


def test_semantic_diff_editorial_vs_physical():
    idx_old = {"pdf_sha256": "a" * 64, "page_count": 9}
    idx_new = {"pdf_sha256": "b" * 64, "page_count": 9}

    # CL-DOC-03: Editorial-only wording fix keeps GLB reusable
    cls_edit = classify_document_change(
        idx_old,
        idx_new,
        old_texts={1: "Mach 18th, 2021"},
        new_texts={1: "March 18th, 2021"},
    )
    assert cls_edit == "editorial_only"

    # Electrical/Modbus change -> procedure_change
    cls_proc = classify_document_change(
        idx_old,
        idx_new,
        old_texts={6: "Register 0x0005 baud 9600"},
        new_texts={6: "Register 0x0005 baud 19200"},
    )
    assert cls_proc == "procedure_change"

    # CL-CAD-04: Dimension change -> physical_change
    cls_phys = classify_document_change(
        idx_old,
        idx_new,
        old_texts={9: "Total length 140 mm, diameter 16 mm"},
        new_texts={9: "Total length 165 mm, diameter 18 mm"},
    )
    assert cls_phys == "physical_change"


def test_end_to_end_editorial_pdf_update_reuses_glb(worker_config, tmp_path: Path):
    """CL-SRC-03 + CL-DOC-03: Editorial PDF revision creates new source_revision and reuses twin_glb SHA-256."""
    from fieldscan_cloud.db import connect_sqlite, ensure_default_tenant_and_credential
    from fieldscan_cloud.worker import _build_fixture_artifacts

    fdir = tmp_path / "fixture_copy"
    shutil.copytree(FIXTURES_DIR / "tht02_v1_1", fdir)

    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot")
        s1 = tmp_path / "stage1"
        s1.mkdir()
        pub1, _ = _build_fixture_artifacts(
            conn, config=worker_config, fixture_dir=fdir, staging_dir=s1, tenant_id="pilot", run_ocr=False
        )
        assert pub1.publication_seq == 1
        glb1 = conn.execute(
            "SELECT object_sha256 FROM publication_objects WHERE publication_id = ? AND role = 'twin_glb';",
            (pub1.publication_id,),
        ).fetchone()["object_sha256"]

        # Append a harmless PDF comment (changes PDF SHA-256 without changing physical/procedural text)
        pdf_file = fdir / "THT02_Users_Manual_v1.1.pdf"
        pdf_file.write_bytes(pdf_file.read_bytes() + b"\n% editorial comment update\n")

        s2 = tmp_path / "stage2"
        s2.mkdir()
        pub2, _ = _build_fixture_artifacts(
            conn, config=worker_config, fixture_dir=fdir, staging_dir=s2, tenant_id="pilot", run_ocr=False
        )
        assert pub2.publication_seq == 2
        glb2 = conn.execute(
            "SELECT object_sha256 FROM publication_objects WHERE publication_id = ? AND role = 'twin_glb';",
            (pub2.publication_id,),
        ).fetchone()["object_sha256"]
        assert glb1 == glb2

        revs = conn.execute(
            "SELECT semantic_class FROM source_revisions WHERE source_id = 'tht02_manual_v1_1' ORDER BY rowid ASC;"
        ).fetchall()
        assert [r["semantic_class"] for r in revs] == ["initial", "editorial_only"]
    finally:
        conn.close()

