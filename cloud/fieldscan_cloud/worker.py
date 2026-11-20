"""Single-concurrency FieldScan Cloud worker implementing the generic 5-stage multimodal CAD/PBR pipeline."""

from __future__ import annotations

import copy
import json
import logging
from pathlib import Path
import shutil
import signal
import sqlite3
import time
from typing import Any

import httpx

from fieldscan_cloud.config import WorkerConfig, load_worker_config
from fieldscan_cloud.db import (
    claim_next_job,
    complete_job,
    connect_sqlite,
    ensure_default_tenant_and_credential,
    ensure_seed_sources,
    get_current_publication,
    immediate_tx,
    now_ts,
    record_source_event,
    renew_job_lease,
    requeue_or_fail_job,
    upsert_product_and_variant,
    verify_schema,
)
from fieldscan_cloud.documents.pipeline import (
    CONSOLIDATE_MARKDOWN_PAGE_THRESHOLD,
    DocumentBuildOutput,
    classify_document_change,
    enforce_artifact_budget,
    process_pdf_document,
    validate_page_references,
)
from fieldscan_cloud.models import ManifestCapabilities, ManifestSource, normalize_token
from fieldscan_cloud.publication.publisher import (
    ArtifactInput,
    PublicationConflictError,
    PublicationResult,
    publish_variant_atomically,
)
from fieldscan_cloud.publication.signing import load_private_key
from fieldscan_cloud.publication.storage import find_orphan_objects, store_bytes_atomically, store_file_atomically
from fieldscan_cloud.sources.context_client import (
    ContextSearchClient,
    ContextSearchError,
    build_technical_query,
)
from fieldscan_cloud.sources.downloader import SourceDownloadError, download_allowlisted_source
from fieldscan_cloud.sources.image_harvester import HarvestedImage, harvest_reference_photos
from fieldscan_cloud.sources.registry import (
    ALLOWED_OEM_DOMAINS,
    SEED_TZONE_THT02_SOURCES,
    classify_search_candidate,
    document_confirms_model,
    filter_artifacts_by_permission,
    get_allowed_oem_domains,
)
from fieldscan_cloud.twin.generator import build_twin_from_recipe
from fieldscan_cloud.twin.synthesizer import VlmClient, select_key_datasheet_pages, synthesize_cad_recipe
from fieldscan_cloud.twin.validator import (
    render_twin_preview_views,
    run_vlm_visual_review,
    validate_twin_bundle,
)

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
logger = logging.getLogger("fieldscan_cloud.worker")


def _store_document_artifacts_with_budget(
    conn: sqlite3.Connection,
    *,
    config: WorkerConfig,
    doc_out: DocumentBuildOutput,
    pdf_path: Path,
    source_id: str,
    permission_policy: str,
    reserved_non_doc_slots: int = 6,
) -> tuple[list[ArtifactInput], list[str], str]:
    """
    Stage 1 CAS storage & budget guard:
    - Stores `manual_pdf`, all rasterized 150 DPI PNGs (`role = "manual_page_image"`),
      per-page or consolidated `manual_markdown`, and `document_index` (`docs/index.json`).
    - Guarantees package stays <= 256 artifacts and <= 120 MB total (Contract v2.1.0).
    Returns `(artifact_inputs, permission_reason_codes, stored_pdf_sha256)`.
    """
    stored_pdf = store_file_atomically(
        conn,
        data_dir=config.data_dir,
        source_path=pdf_path,
        media_type="application/pdf",
    )

    raw_artifact_dicts: list[dict[str, Any]] = [
        {
            "role": "manual_pdf",
            "path": f"docs/{source_id}/manual.pdf",
            "sha256": stored_pdf.sha256,
            "byte_count": stored_pdf.byte_count,
            "document_id": source_id,
        }
    ]

    # Store rasterized PNG page images in CAS (`role = "manual_page_image"`)
    for page in doc_out.pages:
        if page.image_relpath and page.image_local_path is not None and page.image_local_path.is_file():
            img_obj = store_file_atomically(
                conn,
                data_dir=config.data_dir,
                source_path=page.image_local_path,
                media_type="image/png",
            )
            raw_artifact_dicts.append(
                {
                    "role": "manual_page_image",
                    "path": page.image_relpath,
                    "sha256": img_obj.sha256,
                    "byte_count": img_obj.byte_count,
                    "document_id": source_id,
                }
            )

    consolidate_md = doc_out.page_count > CONSOLIDATE_MARKDOWN_PAGE_THRESHOLD
    consolidated_md_art: dict[str, Any] | None = None
    if consolidate_md:
        cons_obj = store_bytes_atomically(
            conn,
            data_dir=config.data_dir,
            content=doc_out.consolidated_markdown.encode("utf-8"),
            media_type="text/markdown; charset=utf-8",
        )
        consolidated_md_art = {
            "role": "manual_markdown",
            "path": f"docs/{source_id}/manual.md",
            "sha256": cons_obj.sha256,
            "byte_count": cons_obj.byte_count,
            "document_id": source_id,
        }
        raw_artifact_dicts.append(consolidated_md_art)
    else:
        for page in doc_out.pages:
            md_obj = store_bytes_atomically(
                conn,
                data_dir=config.data_dir,
                content=page.markdown.encode("utf-8"),
                media_type="text/markdown; charset=utf-8",
            )
            raw_artifact_dicts.append(
                {
                    "role": "manual_markdown",
                    "path": f"docs/{source_id}/pages/page_{page.page:03d}.md",
                    "sha256": md_obj.sha256,
                    "byte_count": md_obj.byte_count,
                    "document_id": source_id,
                }
            )
        # Prepare lazy consolidated markdown artifact only if budget consolidation triggers
        if len(raw_artifact_dicts) + 1 > (256 - reserved_non_doc_slots):
            cons_obj = store_bytes_atomically(
                conn,
                data_dir=config.data_dir,
                content=doc_out.consolidated_markdown.encode("utf-8"),
                media_type="text/markdown; charset=utf-8",
            )
            consolidated_md_art = {
                "role": "manual_markdown",
                "path": f"docs/{source_id}/manual.md",
                "sha256": cons_obj.sha256,
                "byte_count": cons_obj.byte_count,
                "document_id": source_id,
            }

    # Placeholder index entry during budget calculation; final index.json reflects exact kept paths
    provisional_index = copy.deepcopy(doc_out.index_dict)
    raw_artifact_dicts.append(
        {
            "role": "document_index",
            "path": "docs/index.json",
            "sha256": "0" * 64,
            "byte_count": 4096,
            "document_id": source_id,
        }
    )

    budgeted_dicts, budget_notes = enforce_artifact_budget(
        raw_artifact_dicts,
        consolidated_markdown_artifact=consolidated_md_art,
        reserved_non_doc_slots=reserved_non_doc_slots,
    )
    kept_paths = {a["path"] for a in budgeted_dicts}
    md_was_consolidated = "MARKDOWN_CONSOLIDATED_FOR_ARTIFACT_BUDGET" in budget_notes or consolidate_md

    # Synchronize docs/index.json references strictly with artifacts actually kept in manifest
    for p_entry in provisional_index.get("pages", []):
        if md_was_consolidated:
            p_entry["markdown_path"] = f"docs/{source_id}/manual.md"
        if "image_path" in p_entry and p_entry["image_path"] not in kept_paths:
            del p_entry["image_path"]
            p_entry.pop("image_width", None)
            p_entry.pop("image_height", None)

    filtered_doc_dicts, perm_reasons = filter_artifacts_by_permission(
        budgeted_dicts,
        permission_policy=permission_policy,
    )
    filtered_paths = {a["path"] for a in filtered_doc_dicts}
    for p_entry in provisional_index.get("pages", []):
        if "image_path" in p_entry and p_entry["image_path"] not in filtered_paths:
            del p_entry["image_path"]
            p_entry.pop("image_width", None)
            p_entry.pop("image_height", None)

    idx_bytes = json.dumps(provisional_index, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8")
    idx_obj = store_bytes_atomically(
        conn,
        data_dir=config.data_dir,
        content=idx_bytes,
        media_type="application/json",
    )
    for art in filtered_doc_dicts:
        if art["role"] == "document_index":
            art["sha256"] = idx_obj.sha256
            art["byte_count"] = idx_obj.byte_count

    artifacts = [
        ArtifactInput(
            role=a["role"],
            path=a["path"],
            sha256=a["sha256"],
            byte_count=a["byte_count"],
            document_id=a.get("document_id"),
        )
        for a in filtered_doc_dicts
    ]
    return artifacts, perm_reasons, stored_pdf.sha256


def _run_generic_twin_pipeline(
    conn: sqlite3.Connection,
    *,
    config: WorkerConfig,
    doc_out: DocumentBuildOutput,
    staging_dir: Path,
    product_id: str,
    variant_id: str,
    manufacturer: str,
    model: str,
    variant: str | None,
    permission_policy: str,
    source_id: str,
    job_id: str | None = None,
    actor: str = "worker",
    existing_recipe: dict[str, Any] | None = None,
    context_client: ContextSearchClient | None = None,
    vlm_client: VlmClient | None = None,
    reuse_glb_artifact: ArtifactInput | None = None,
    allow_harvest: bool = True,
    allow_vlm: bool = True,
    download_transport: httpx.BaseTransport | None = None,
    check_dns: bool = True,
) -> tuple[list[ArtifactInput], bool, bool, list[str]]:
    """
    Generic Stages 2 -> 3 -> 4 -> 5 Digital Twin pipeline (ZERO hardcoding per sensor):
    - Stage 2: Optional ephemeral multi-angle photo harvest into `staging_dir/ref_images/` (NEVER into CAS/manifest/GLB).
    - Stage 3: Multimodal CAD v2 recipe synthesis (or verified recipe fallback / honest degradation).
    - Stage 4: Parametric CAD v2 + glTF 2.0 PBR `.glb` construction.
    - Stage 5: Khronos `gltf_validator` + semantic checks + optional headless CPU 3-view VLM visual review (up to 1 retry).
    Returns `(twin_artifacts, cap_interactive_twin, cap_procedures, extra_reason_codes)`.
    """
    active_vlm = vlm_client if allow_vlm else None
    if allow_vlm and active_vlm is None and config.vlm_enabled and config.vlm_api_key:
        active_vlm = VlmClient(
            provider=config.vlm_provider,
            api_url=config.vlm_api_url,
            model=config.vlm_model,
            api_key=config.vlm_api_key,
        )

    # Stage 2: Ephemeral multi-angle photo harvest (only when VLM synthesis/review or open discovery needs visual refs)
    harvested_images: list[HarvestedImage] = []
    if (
        allow_harvest
        and config.image_harvest_enabled
        and context_client is not None
        and (active_vlm is not None or existing_recipe is None)
    ):
        ref_dir = staging_dir / "ref_images"
        ds_pngs = [p.image_local_path for p in doc_out.pages if p.image_local_path is not None and p.image_local_path.is_file()]
        h_res = harvest_reference_photos(
            context_client=context_client,
            manufacturer=manufacturer,
            model=model,
            variant=variant,
            staging_ref_dir=ref_dir,
            datasheet_png_paths=ds_pngs,
            download_transport=download_transport,
            check_dns=check_dns,
        )
        harvested_images = h_res.images
        record_source_event(
            conn,
            source_id=source_id,
            job_id=job_id,
            actor=actor,
            event_type="reference_photos_harvested",
            detail={
                "vendor_request_id": h_res.vendor_request_id,
                "accepted_count": len(h_res.audit_accepted),
                "rejected_count": len(h_res.audit_rejected),
                "accepted": h_res.audit_accepted,
                "ephemeral_only": True,
            },
        )

    reason_codes: list[str] = []
    twin_stage = staging_dir / "twin"
    twin_stage.mkdir(parents=True, exist_ok=True)
    review_feedback: str | None = None
    max_attempts = 2 if active_vlm is not None else 1
    key_ds_pngs = [p for _, p in select_key_datasheet_pages(doc_out, max_pages=3)]

    for attempt in range(1, max_attempts + 1):
        synth = synthesize_cad_recipe(
            doc_out=doc_out,
            manufacturer=manufacturer,
            model=model,
            variant=variant,
            product_id=product_id,
            variant_id=variant_id,
            harvested_images=harvested_images,
            existing_recipe=existing_recipe,
            vlm_client=active_vlm,
            review_feedback=review_feedback,
        )
        if synth.recipe is None:
            reason_codes.extend(synth.reason_codes)
            if "INTERNAL_GEOMETRY_UNCONFIRMED" not in reason_codes:
                reason_codes.append("INTERNAL_GEOMETRY_UNCONFIRMED")
            return [], False, False, sorted(set(reason_codes))

        recipe = synth.recipe
        glb_path = twin_stage / f"{product_id}_{variant_id}_a{attempt}.glb"
        try:
            twin_build = build_twin_from_recipe(recipe, out_glb_path=glb_path)
        except Exception as exc:
            logger.warning("Twin CAD build failed on attempt %s for %s/%s: %s", attempt, product_id, variant_id, exc)
            if active_vlm is not None and attempt < max_attempts:
                review_feedback = f"CAD builder raised {type(exc).__name__}: {exc}. Fix geometry parameters."
                continue
            reason_codes.extend(["TWIN_CAD_BUILD_FAILED", "INTERNAL_GEOMETRY_UNCONFIRMED"])
            return [], False, False, sorted(set(reason_codes))

        report_path = config.data_dir / "reports" / f"gltf_{product_id}_{variant_id}_{now_ts()}_a{attempt}.json"
        val_report = validate_twin_bundle(
            glb_path=twin_build.glb_path,
            parts_json=twin_build.parts_json,
            actions_json=twin_build.actions_json,
            validator_bin=config.gltf_validator_path,
            document_page_count=doc_out.page_count,
            control_measurements_m=recipe.get("control_measurements_m"),
            bounds_m=twin_build.bounds_m,
            report_out_path=report_path,
        )
        page_refs = [int(a["page"]) for a in recipe.get("actions", []) if "page" in a]
        page_errors = validate_page_references(page_refs, doc_out.page_count)

        if not val_report.valid or page_errors:
            if active_vlm is not None and attempt < max_attempts:
                errs = list(val_report.semantic_errors) + list(page_errors)
                review_feedback = "Validation failed: " + "; ".join(errs[:6])
                continue
            reason_codes.extend(val_report.reason_codes)
            if page_errors:
                reason_codes.append("PROCEDURE_REFERENCE_MISSING")
            if "INTERNAL_GEOMETRY_UNCONFIRMED" not in reason_codes:
                reason_codes.append("INTERNAL_GEOMETRY_UNCONFIRMED")
            return [], False, False, sorted(set(reason_codes))

        # Stage 5: Optional VLM Visual Auto-Review on 3 headless CPU views (iso, side, exploded)
        if active_vlm is not None and config.vlm_visual_review:
            preview_dir = twin_stage / f"preview_a{attempt}"
            preview_paths = render_twin_preview_views(
                glb_path=twin_build.glb_path,
                parts_json=twin_build.parts_json,
                out_dir=preview_dir,
            )
            vis = run_vlm_visual_review(
                vlm_client=active_vlm,
                preview_paths=preview_paths,
                datasheet_png_paths=key_ds_pngs,
                harvested_images=harvested_images,
                manufacturer=manufacturer,
                model=model,
                variant=variant,
                min_score=config.vlm_min_visual_score,
            )
            record_source_event(
                conn,
                source_id=source_id,
                job_id=job_id,
                actor=actor,
                event_type="twin_visual_review",
                detail={
                    "attempt": attempt,
                    "passed": vis.passed,
                    "score": vis.score,
                    "issues": vis.issues,
                    "synthesis_origin": synth.origin,
                },
            )
            if not vis.passed:
                if attempt < max_attempts:
                    review_feedback = vis.feedback or "; ".join(vis.issues) or "Improve proportion and material fidelity."
                    continue
                reason_codes.extend(["TWIN_VISUAL_REVIEW_FAILED", "INTERNAL_GEOMETRY_UNCONFIRMED"])
                return [], False, False, sorted(set(reason_codes))

        # Validated! Store twin_glb, twin_parts, twin_actions in CAS
        if reuse_glb_artifact is not None:
            glb_art = reuse_glb_artifact
        else:
            glb_obj = store_file_atomically(
                conn,
                data_dir=config.data_dir,
                source_path=twin_build.glb_path,
                media_type="model/gltf-binary",
            )
            glb_art = ArtifactInput(
                role="twin_glb",
                path=f"twin/{product_id}_{variant_id}.glb",
                sha256=glb_obj.sha256,
                byte_count=glb_obj.byte_count,
            )

        parts_obj = store_bytes_atomically(
            conn,
            data_dir=config.data_dir,
            content=json.dumps(twin_build.parts_json, sort_keys=True, indent=2).encode("utf-8"),
            media_type="application/json",
        )
        actions_obj = store_bytes_atomically(
            conn,
            data_dir=config.data_dir,
            content=json.dumps(twin_build.actions_json, sort_keys=True, indent=2).encode("utf-8"),
            media_type="application/json",
        )
        twin_arts = [
            glb_art,
            ArtifactInput(
                role="twin_parts",
                path="twin/twin.parts.json",
                sha256=parts_obj.sha256,
                byte_count=parts_obj.byte_count,
            ),
            ArtifactInput(
                role="twin_actions",
                path="twin/twin.actions.json",
                sha256=actions_obj.sha256,
                byte_count=actions_obj.byte_count,
            ),
        ]
        return twin_arts, True, (permission_policy == "redistributable"), sorted(set(reason_codes))

    return [], False, False, sorted(set(reason_codes + ["INTERNAL_GEOMETRY_UNCONFIRMED"]))


def _build_fixture_artifacts(
    conn: sqlite3.Connection,
    *,
    config: WorkerConfig,
    fixture_dir: Path,
    staging_dir: Path,
    tenant_id: str,
    job_id: str | None = None,
    lease_token: str | None = None,
    actor: str = "worker",
    run_ocr: bool = True,
    max_ocr_pages: int = 20,
    reuse_glb_artifact: ArtifactInput | None = None,
    context_client: ContextSearchClient | None = None,
    vlm_client: VlmClient | None = None,
) -> tuple[PublicationResult, dict[str, Any]]:
    """Build rasterized PNG manual pages + parametric PBR GLB twin from a fixture directory, validate, sign, and publish."""
    meta = json.loads((fixture_dir / "source_metadata.json").read_text(encoding="utf-8"))
    pdf_path = (fixture_dir / meta["pdf_filename"]).resolve()
    recipe_path = fixture_dir / "recipe.json"
    has_recipe = bool(meta.get("has_twin_recipe", recipe_path.is_file())) and recipe_path.is_file()

    product_id = str(meta["product_id"])
    variant_id = str(meta["variant_id"])
    source_id = str(meta["source_id"])
    revision_label = str(meta["revision_label"])
    permission_policy = str(meta.get("permission_policy", "redistributable"))

    def _set_phase(phase_name: str) -> None:
        if job_id and lease_token:
            renew_job_lease(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                lease_sec=config.job_lease_sec,
                phase=phase_name,
            )

    _set_phase("searching_oem_docs")
    upsert_product_and_variant(
        conn,
        product_id=product_id,
        manufacturer=str(meta["manufacturer"]),
        model=str(meta["model"]),
        display_name=str(meta["display_name"]),
        variant_id=variant_id,
        variant_code=str(meta["variant_code"]),
        hardware_revision=meta.get("hardware_revision"),
        variant_display_name=str(meta["display_name"]),
        discriminant_hint=str(meta.get("discriminant_hint", "")),
        aliases=list(meta.get("aliases", [])),
    )

    # Stage 1: Document rasterization (150 DPI PNGs) + text extraction + on-demand Tesseract OCR
    _set_phase("extracting_manual_pdf")
    doc_stage = staging_dir / "docs"
    doc_out = process_pdf_document(
        pdf_path,
        work_dir=doc_stage,
        document_id=source_id,
        revision_label=revision_label,
        title=str(meta["display_name"]),
        run_ocr=run_ocr,
        render_page_images=True,
        max_ocr_pages=max_ocr_pages,
    )

    # Compare against latest prior source_revision for semantic diffing (CL-SRC-03 & CL-DOC-03)
    prev_rev = conn.execute(
        """
        SELECT content_sha256, evidence_json
        FROM source_revisions
        WHERE source_id = ?
        ORDER BY fetched_at DESC, rowid DESC
        LIMIT 1;
        """,
        (source_id,),
    ).fetchone()

    doc_artifacts, perm_reasons, pdf_sha256 = _store_document_artifacts_with_budget(
        conn,
        config=config,
        doc_out=doc_out,
        pdf_path=pdf_path,
        source_id=source_id,
        permission_policy=permission_policy,
    )

    new_texts = {p.page: p.text for p in doc_out.pages}
    semantic_class = "initial"
    if prev_rev is not None and str(prev_rev["content_sha256"]) != pdf_sha256:
        prev_ev = json.loads(prev_rev["evidence_json"] or "{}")
        old_texts_raw = prev_ev.get("page_texts")
        old_texts = {int(k): str(v) for k, v in old_texts_raw.items()} if isinstance(old_texts_raw, dict) else None
        old_idx = {"pdf_sha256": str(prev_rev["content_sha256"]), "page_count": int(prev_ev.get("page_count", 0))}
        semantic_class = classify_document_change(
            old_idx,
            doc_out.index_dict,
            old_texts=old_texts,
            new_texts=new_texts,
        )

    # Record source and source_revision atomically in SQLite
    ts = now_ts()
    evidence_payload = {
        "page_count": doc_out.page_count,
        "page_texts": {str(k): v[:4000] for k, v in new_texts.items()},
    }
    with immediate_tx(conn):
        conn.execute(
            """
            INSERT INTO sources (
              id, product_id, variant_id, origin_kind, canonical_url, final_url,
              allowed_domain, source_class, permission_policy, decision_evidence,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              final_url = excluded.final_url,
              permission_policy = excluded.permission_policy,
              decision_evidence = excluded.decision_evidence,
              updated_at = excluded.updated_at;
            """,
            (
                source_id,
                product_id,
                variant_id,
                str(meta["origin_kind"]),
                str(meta["canonical_url"]),
                str(meta["final_url"]),
                str(meta["allowed_domain"]),
                str(meta["source_class"]),
                permission_policy,
                str(meta["decision_evidence"]),
                ts,
                ts,
            ),
        )
        conn.execute(
            """
            INSERT OR IGNORE INTO source_revisions (
              id, source_id, revision_label, content_sha256, fetched_at, semantic_class, evidence_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """,
            (
                f"srev_{source_id}_{pdf_sha256[:12]}",
                source_id,
                revision_label,
                pdf_sha256,
                ts,
                semantic_class,
                json.dumps(evidence_payload, sort_keys=True),
            ),
        )

    if prev_rev is not None and str(prev_rev["content_sha256"]) != pdf_sha256:
        record_source_event(
            conn,
            source_id=source_id,
            job_id=job_id,
            actor=actor,
            event_type="source_revision_compared",
            detail={
                "old_sha256": str(prev_rev["content_sha256"]),
                "new_sha256": pdf_sha256,
                "semantic_class": semantic_class,
            },
        )
        # Automatically reuse compatible GLB when change is editorial_only (CL-DOC-03)
        if reuse_glb_artifact is None and semantic_class == "editorial_only":
            cur_pub = get_current_publication(
                conn,
                tenant_id=tenant_id,
                channel=config.channel,
                product_id=product_id,
                variant_id=variant_id,
            )
            if cur_pub is not None:
                prev_glb = conn.execute(
                    """
                    SELECT role, package_path, object_sha256, byte_count
                    FROM publication_objects
                    WHERE publication_id = ? AND role = 'twin_glb'
                    LIMIT 1;
                    """,
                    (cur_pub["id"],),
                ).fetchone()
                if prev_glb is not None:
                    reuse_glb_artifact = ArtifactInput(
                        role="twin_glb",
                        path=str(prev_glb["package_path"]),
                        sha256=str(prev_glb["object_sha256"]),
                        byte_count=int(prev_glb["byte_count"]),
                    )

    artifacts: list[ArtifactInput] = list(doc_artifacts)
    reason_codes: list[str] = list(meta.get("reason_codes", [])) + perm_reasons
    cap_documentation = len(artifacts) > 0
    cap_interactive_twin = False
    cap_procedures = False

    # Stages 2-5: Generic Twin Pipeline (verified declarative recipes compile deterministically to avoid regressions)
    if has_recipe:
        _set_phase("building_3d_twin")
        existing_recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
        twin_arts, cap_interactive_twin, cap_procedures, twin_reasons = _run_generic_twin_pipeline(
            conn,
            config=config,
            doc_out=doc_out,
            staging_dir=staging_dir,
            product_id=product_id,
            variant_id=variant_id,
            manufacturer=str(meta["manufacturer"]),
            model=str(meta["model"]),
            variant=str(meta.get("variant_code", "")),
            permission_policy=permission_policy,
            source_id=source_id,
            job_id=job_id,
            actor=actor,
            existing_recipe=existing_recipe,
            context_client=context_client,
            vlm_client=None,
            reuse_glb_artifact=reuse_glb_artifact,
            allow_harvest=False,
            allow_vlm=False,
        )
        artifacts.extend(twin_arts)
        reason_codes.extend(twin_reasons)
    else:
        if "INTERNAL_GEOMETRY_UNCONFIRMED" not in reason_codes:
            reason_codes.append("INTERNAL_GEOMETRY_UNCONFIRMED")

    _set_phase("signing_package")
    private_key = load_private_key(config.signer_key_path)
    pub_result = publish_variant_atomically(
        conn,
        tenant_id=tenant_id,
        issuer=config.issuer,
        channel=config.channel,
        product_id=product_id,
        variant_id=variant_id,
        sources=[
            ManifestSource(
                source_id=source_id,
                origin=str(meta["origin_kind"]),
                revision_label=revision_label,
            )
        ],
        artifacts=artifacts,
        capabilities=ManifestCapabilities(
            documentation=cap_documentation,
            interactive_twin=cap_interactive_twin,
            procedures=cap_procedures,
        ),
        reason_codes=reason_codes,
        private_key=private_key,
        key_id=config.signing_key_id,
        job_id=job_id,
        lease_token=lease_token,
        actor=actor,
    )

    result_payload = {
        "availability": pub_result.availability,
        "identity": {
            "product_id": product_id,
            "variant_id": variant_id,
            "resolution": "exact",
        },
        "capabilities": {
            "documentation": "available" if pub_result.capabilities.documentation else "unavailable",
            "interactive_twin": "available" if pub_result.capabilities.interactive_twin else "unavailable",
            "procedures": "available" if pub_result.capabilities.procedures else "unavailable",
        },
        "reason_codes": pub_result.reason_codes,
        "candidates": [],
        "publication_seq": pub_result.publication_seq,
        "manifest_url": f"/v1/catalog/products/{product_id}/variants/{variant_id}/manifest",
    }
    return pub_result, result_payload


def _find_matching_fixtures(
    manufacturer: str,
    model: str,
    variant: str | None,
    hardware_revision: str | None,
) -> list[tuple[Path, dict[str, Any]]]:
    mfr_norm = normalize_token(manufacturer)
    model_norm = normalize_token(model)
    var_norm = normalize_token(variant)
    rev_norm = normalize_token(hardware_revision)

    matches: list[tuple[Path, dict[str, Any]]] = []
    if not FIXTURES_DIR.is_dir():
        return matches

    for meta_file in sorted(FIXTURES_DIR.glob("*/source_metadata.json")):
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        m_ok = normalize_token(meta.get("manufacturer")) == mfr_norm
        aliases_norm = {normalize_token(a) for a in meta.get("aliases", [])}
        mod_ok = (
            normalize_token(meta.get("model")) == model_norm
            or model_norm in aliases_norm
            or normalize_token(f"{manufacturer} {model}") in aliases_norm
        )
        if not (m_ok and mod_ok):
            continue
        if var_norm and var_norm not in {
            normalize_token(meta.get("variant_id")),
            normalize_token(meta.get("variant_code")),
        }:
            continue
        if rev_norm and normalize_token(meta.get("hardware_revision")) != rev_norm:
            continue
        matches.append((meta_file.parent, meta))
    return matches


def process_single_job(
    conn: sqlite3.Connection,
    *,
    config: WorkerConfig,
    job_row: sqlite3.Row,
    context_client: ContextSearchClient | None = None,
    vlm_client: VlmClient | None = None,
    download_transport: httpx.BaseTransport | None = None,
    check_dns: bool = True,
) -> None:
    """Execute one claimed job with lease renewal, generic 5-stage pipeline, and guaranteed staging cleanup."""
    job_id = str(job_row["id"])
    lease_token = str(job_row["lease_token"])
    tenant_id = str(job_row["tenant_id"])
    attempts = int(job_row["attempts"])
    req = json.loads(job_row["request_json"])
    manufacturer = str(req["manufacturer"])
    model = str(req["model"])
    variant = req.get("variant")
    hardware_revision = req.get("hardware_revision")

    staging_dir = config.data_dir / "staging" / job_id / f"attempt_{attempts}"
    staging_dir.mkdir(parents=True, exist_ok=True)

    try:
        renew_job_lease(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            lease_sec=config.job_lease_sec,
            phase="matching_catalog",
        )

        # Check fixtures first for deterministic E1/E2 support
        fixture_matches = _find_matching_fixtures(manufacturer, model, variant, hardware_revision)
        if len(fixture_matches) > 1 and bool(req.get("force_refresh", False)) and not variant and not hardware_revision:
            full_fixtures = [fm for fm in fixture_matches if fm[1].get("has_twin_recipe", True) is not False]
            if len(full_fixtures) == 1:
                fixture_matches = full_fixtures
        if len(fixture_matches) > 1:
            candidates = [
                {
                    "product_id": str(meta["product_id"]),
                    "variant_id": str(meta["variant_id"]),
                    "variant_code": str(meta["variant_code"]),
                    "hardware_revision": meta.get("hardware_revision"),
                    "display_name": str(meta["display_name"]),
                    "discriminant_hint": str(meta.get("discriminant_hint", "")),
                }
                for _, meta in fixture_matches
            ]
            complete_job(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                phase="needs_identification",
                result_payload={
                    "availability": "needs_identification",
                    "identity": {
                        "product_id": str(fixture_matches[0][1]["product_id"]),
                        "variant_id": None,
                        "resolution": "ambiguous",
                    },
                    "capabilities": {
                        "documentation": "unavailable",
                        "interactive_twin": "unavailable",
                        "procedures": "unavailable",
                    },
                    "reason_codes": ["DOCUMENT_VARIANT_AMBIGUOUS"],
                    "candidates": candidates,
                    "publication_seq": None,
                },
            )
            return

        if len(fixture_matches) == 1:
            fixture_dir, _meta = fixture_matches[0]
            _pub, result_payload = _build_fixture_artifacts(
                conn,
                config=config,
                fixture_dir=fixture_dir,
                staging_dir=staging_dir,
                tenant_id=tenant_id,
                job_id=job_id,
                lease_token=lease_token,
                actor="worker",
                run_ocr=True,
                context_client=context_client,
                vlm_client=vlm_client,
            )
            complete_job(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                phase="published",
                result_payload=result_payload,
            )
            return

        # Unknown model/variant -> Generic Context.dev OEM Discovery + 5-Stage Pipeline
        renew_job_lease(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            lease_sec=config.job_lease_sec,
            phase="searching_oem_docs",
        )
        client = context_client
        if client is None and config.context_enabled and config.context_api_key:
            client = ContextSearchClient(
                search_url=config.context_search_url,
                api_key=config.context_api_key,
                max_results=config.context_max_results,
            )

        if client is None:
            record_source_event(
                conn,
                job_id=job_id,
                event_type="context_search_skipped",
                detail={"reason": "CONTEXT_SEARCH_UNCONFIGURED", "manufacturer": manufacturer, "model": model},
            )
            complete_job(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                phase="needs_identification",
                result_payload={
                    "availability": "needs_identification",
                    "identity": {"product_id": None, "variant_id": None, "resolution": "unresolved"},
                    "capabilities": {
                        "documentation": "unavailable",
                        "interactive_twin": "unavailable",
                        "procedures": "unavailable",
                    },
                    "reason_codes": ["CONTEXT_SEARCH_UNCONFIGURED"],
                    "candidates": [],
                    "publication_seq": None,
                },
            )
            return

        mfr_norm = normalize_token(manufacturer)
        query = build_technical_query(manufacturer, model, variant)
        include_domains = sorted(get_allowed_oem_domains(mfr_norm)) or None
        search_res = client.search(query=query, include_domains=include_domains)
        merged_candidates = list(search_res.candidates)
        vendor_request_ids = [search_res.vendor_request_id] if search_res.vendor_request_id else []

        # Budget of max 2 searches/job (§8.2 step 2): if domain-scoped search yielded no direct PDF, run 1 broader search
        if include_domains and not any(c.url.lower().endswith(".pdf") for c in merged_candidates):
            broad_res = client.search(query=query, include_domains=None)
            if broad_res.vendor_request_id:
                vendor_request_ids.append(broad_res.vendor_request_id)
            seen_urls = {c.url for c in merged_candidates}
            for cand_item in broad_res.candidates:
                if cand_item.url not in seen_urls:
                    merged_candidates.append(cand_item)
                    seen_urls.add(cand_item.url)

        classified = [classify_search_candidate(c, manufacturer_norm=mfr_norm) for c in merged_candidates]
        classified.sort(key=lambda c: c.score, reverse=True)
        oem_hits = [c for c in classified if c.origin_kind == "oem_official"]

        record_source_event(
            conn,
            job_id=job_id,
            event_type="context_search_completed",
            detail={
                "query": search_res.query,
                "vendor_request_id": vendor_request_ids[0] if vendor_request_ids else None,
                "vendor_request_ids": vendor_request_ids,
                "result_count": len(classified),
                "oem_candidate_urls": [c.url for c in oem_hits[:10]],
                "urls": [c.url for c in classified[:10]],
            },
        )

        # Register detected OEM reference pages as candidate sources without inferring applicability (CL-SRC-01)
        if oem_hits:
            ts_cand = now_ts()
            with immediate_tx(conn):
                for oc in oem_hits[:5]:
                    cand_src_id = f"cand_{mfr_norm}_{normalize_token(oc.url)[-16:]}"
                    conn.execute(
                        """
                        INSERT INTO sources (
                          id, product_id, variant_id, origin_kind, canonical_url, final_url,
                          allowed_domain, source_class, permission_policy, decision_evidence,
                          created_at, updated_at
                        ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(canonical_url, source_class) DO UPDATE SET
                          updated_at = excluded.updated_at;
                        """,
                        (
                            cand_src_id,
                            oc.origin_kind,
                            oc.url,
                            oc.url,
                            oc.domain,
                            oc.source_class,
                            oc.permission_policy,
                            f"Detected via Context.dev search ({search_res.query}); applicability unverified.",
                            ts_cand,
                            ts_cand,
                        ),
                    )

        # Attempt defensive download & model applicability verification on up to 3 allowlisted OEM PDFs (§8.2-§8.3)
        allowed_domains = get_allowed_oem_domains(mfr_norm)
        verified_doc: tuple[Any, Any, Path, DocumentBuildOutput] | None = None
        download_errors: list[str] = []
        checked_pdfs = 0
        for cand in classified:
            if not cand.allowed_for_download:
                continue
            if checked_pdfs >= 3:
                break
            checked_pdfs += 1
            try:
                dl = download_allowlisted_source(
                    cand.url,
                    allowed_domains=allowed_domains,
                    expected_kind="pdf",
                    transport=download_transport,
                    check_dns=check_dns,
                )
            except SourceDownloadError as err:
                download_errors.append(err.code)
                record_source_event(
                    conn,
                    job_id=job_id,
                    event_type="oem_download_rejected",
                    detail={"url": cand.url, "error_code": err.code},
                )
                continue

            renew_job_lease(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                lease_sec=config.job_lease_sec,
                phase="extracting_manual_pdf",
            )
            cand_stage = staging_dir / f"cand_{checked_pdfs}"
            cand_stage.mkdir(parents=True, exist_ok=True)
            pdf_stage_file = cand_stage / "downloaded.pdf"
            pdf_stage_file.write_bytes(dl.content)
            temp_doc_id = f"src_{mfr_norm}_{normalize_token(model)}_{dl.sha256[:10]}"
            try:
                cand_doc_out = process_pdf_document(
                    pdf_stage_file,
                    work_dir=cand_stage / "docs",
                    document_id=temp_doc_id,
                    revision_label="discovered",
                    title=cand.title or f"{manufacturer} {model}",
                    run_ocr=True,
                    render_page_images=True,
                    max_ocr_pages=6,
                )
            except Exception as doc_exc:
                download_errors.append("SOURCE_PDF_UNPARSEABLE")
                record_source_event(
                    conn,
                    job_id=job_id,
                    event_type="oem_pdf_parse_failed",
                    detail={"url": cand.url, "error": type(doc_exc).__name__},
                )
                continue

            combined_text = "\n".join(p.text for p in cand_doc_out.pages)
            if not document_confirms_model(combined_text, manufacturer=manufacturer, model=model):
                download_errors.append("OEM_CANDIDATE_MODEL_UNCONFIRMED")
                record_source_event(
                    conn,
                    job_id=job_id,
                    event_type="oem_pdf_model_mismatch",
                    detail={"url": cand.url, "sha256": dl.sha256, "requested_model": model},
                )
                continue

            verified_doc = (cand, dl, pdf_stage_file, cand_doc_out)
            break

        if verified_doc is None:
            reasons = list(download_errors)
            if oem_hits:
                reasons.append("OEM_REFERENCE_CANDIDATES_DETECTED")
            if not reasons:
                reasons.append("NO_ALLOWLISTED_OEM_SOURCE_FOUND")
            complete_job(
                conn,
                job_id=job_id,
                lease_token=lease_token,
                phase="needs_identification",
                result_payload={
                    "availability": "needs_identification",
                    "identity": {"product_id": None, "variant_id": None, "resolution": "unresolved"},
                    "capabilities": {
                        "documentation": "unavailable",
                        "interactive_twin": "unavailable",
                        "procedures": "unavailable",
                    },
                    "reason_codes": sorted(set(reasons)),
                    "candidates": [],
                    "publication_seq": None,
                },
            )
            return

        # Verified OEM PDF matching requested model -> Generic Stages 1-5 publication!
        renew_job_lease(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            lease_sec=config.job_lease_sec,
            phase="extracting_manual_pdf",
        )
        cand, _dl, pdf_stage_file, doc_out = verified_doc
        product_id = f"{mfr_norm}_{normalize_token(model)}"
        variant_id = normalize_token(variant) or normalize_token(hardware_revision) or "oem_discovered"
        source_id = doc_out.document_id

        upsert_product_and_variant(
            conn,
            product_id=product_id,
            manufacturer=manufacturer,
            model=model,
            display_name=f"{manufacturer} {model}",
            variant_id=variant_id,
            variant_code=variant or "OEM",
            hardware_revision=hardware_revision,
            variant_display_name=f"{manufacturer} {model} ({variant or 'OEM'})",
            discriminant_hint=f"Discovered from {cand.domain}",
            aliases=[f"{manufacturer} {model}", model],
            bench_support_status="candidate",
        )

        # Stage 1 CAS storage with 256-artifact / 120 MB budget enforcement
        doc_artifacts, perm_reasons, pdf_sha = _store_document_artifacts_with_budget(
            conn,
            config=config,
            doc_out=doc_out,
            pdf_path=pdf_stage_file,
            source_id=source_id,
            permission_policy=cand.permission_policy,
        )

        # Persist verified discovered OEM source & revision before recording downstream audit events
        ts_disc = now_ts()
        existing_src = conn.execute(
            "SELECT id FROM sources WHERE canonical_url = ? AND source_class = ?;",
            (cand.url, cand.source_class),
        ).fetchone()
        db_source_id = str(existing_src["id"]) if existing_src is not None else source_id
        with immediate_tx(conn):
            conn.execute(
                """
                INSERT INTO sources (
                  id, product_id, variant_id, origin_kind, canonical_url, final_url,
                  allowed_domain, source_class, permission_policy, decision_evidence,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  product_id = excluded.product_id,
                  variant_id = excluded.variant_id,
                  final_url = excluded.final_url,
                  decision_evidence = excluded.decision_evidence,
                  updated_at = excluded.updated_at;
                """,
                (
                    db_source_id,
                    product_id,
                    variant_id,
                    cand.origin_kind,
                    cand.url,
                    _dl.final_url,
                    cand.domain,
                    cand.source_class,
                    cand.permission_policy,
                    f"Verified OEM PDF for {manufacturer} {model} via Context.dev.",
                    ts_disc,
                    ts_disc,
                ),
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO source_revisions (
                  id, source_id, revision_label, content_sha256, fetched_at, semantic_class, evidence_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    f"srev_{db_source_id}_{pdf_sha[:12]}",
                    db_source_id,
                    "discovered",
                    pdf_sha,
                    ts_disc,
                    "initial",
                    json.dumps({"page_count": doc_out.page_count}, sort_keys=True),
                ),
            )

        # Stages 2-5: Multi-angle ephemeral photo harvest + VLM CAD v2 synthesis + PBR GLB + Validation & Review
        renew_job_lease(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            lease_sec=config.job_lease_sec,
            phase="building_3d_twin",
        )
        twin_arts, cap_interactive_twin, cap_procedures, twin_reasons = _run_generic_twin_pipeline(
            conn,
            config=config,
            doc_out=doc_out,
            staging_dir=staging_dir,
            product_id=product_id,
            variant_id=variant_id,
            manufacturer=manufacturer,
            model=model,
            variant=variant,
            permission_policy=cand.permission_policy,
            source_id=db_source_id,
            job_id=job_id,
            actor="worker",
            existing_recipe=None,
            context_client=client,
            vlm_client=vlm_client,
            allow_harvest=True,
            download_transport=download_transport,
            check_dns=check_dns,
        )

        renew_job_lease(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            lease_sec=config.job_lease_sec,
            phase="signing_package",
        )
        art_inputs = list(doc_artifacts) + list(twin_arts)
        all_reasons = sorted(set(perm_reasons + twin_reasons))
        private_key = load_private_key(config.signer_key_path)
        pub_res = publish_variant_atomically(
            conn,
            tenant_id=tenant_id,
            issuer=config.issuer,
            channel=config.channel,
            product_id=product_id,
            variant_id=variant_id,
            sources=[ManifestSource(source_id=source_id, origin=cand.origin_kind, revision_label="discovered")],
            artifacts=art_inputs,
            capabilities=ManifestCapabilities(
                documentation=len(doc_artifacts) > 0,
                interactive_twin=cap_interactive_twin,
                procedures=cap_procedures,
            ),
            reason_codes=all_reasons,
            private_key=private_key,
            key_id=config.signing_key_id,
            job_id=job_id,
            lease_token=lease_token,
            actor="worker",
        )
        complete_job(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            phase="published",
            result_payload={
                "availability": pub_res.availability,
                "identity": {"product_id": product_id, "variant_id": variant_id, "resolution": "exact"},
                "capabilities": {
                    "documentation": "available" if pub_res.capabilities.documentation else "unavailable",
                    "interactive_twin": "available" if pub_res.capabilities.interactive_twin else "unavailable",
                    "procedures": "available" if pub_res.capabilities.procedures else "unavailable",
                },
                "reason_codes": pub_res.reason_codes,
                "candidates": [],
                "publication_seq": pub_res.publication_seq,
                "manifest_url": f"/v1/catalog/products/{product_id}/variants/{variant_id}/manifest",
            },
        )

    except ContextSearchError as exc:
        logger.warning("Job %s Context search error: %s (%s)", job_id, exc.code, exc)
        requeue_or_fail_job(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            attempts=attempts,
            max_attempts=config.max_job_attempts,
            error_code=exc.code,
            error_message=str(exc),
            transient=exc.transient,
        )
    except PublicationConflictError as exc:
        logger.warning("Job %s publication conflict: %s", job_id, exc)
        requeue_or_fail_job(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            attempts=attempts,
            max_attempts=config.max_job_attempts,
            error_code="PUBLICATION_CONFLICT",
            error_message=str(exc),
            transient=True,
        )
    except Exception as exc:
        logger.exception("Job %s failed unexpectedly", job_id)
        requeue_or_fail_job(
            conn,
            job_id=job_id,
            lease_token=lease_token,
            attempts=attempts,
            max_attempts=config.max_job_attempts,
            error_code="WORKER_UNEXPECTED_ERROR",
            error_message=type(exc).__name__,
            transient=False,
        )
    finally:
        # Unconditionally delete ephemeral staging directory (including ref_images/) upon job termination
        shutil.rmtree(staging_dir, ignore_errors=True)
        try:
            if staging_dir.parent.is_dir() and not any(staging_dir.parent.iterdir()):
                staging_dir.parent.rmdir()
        except OSError:
            pass


def run_worker_loop(config: WorkerConfig) -> None:
    logging.basicConfig(
        level=getattr(logging, config.log_level, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    stop_requested = False

    def _handle_signal(signum: int, _frame: Any) -> None:
        nonlocal stop_requested
        logger.info("Received signal %s; finishing current job cleanly before exit", signum)
        stop_requested = True

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    conn = connect_sqlite(config.db_path, expected_journal_mode=config.sqlite_journal_mode)
    try:
        schema_ver, mode = verify_schema(conn, expected_journal_mode=config.sqlite_journal_mode)
        ensure_default_tenant_and_credential(
            conn, tenant_id=config.default_tenant_id, channel=config.channel
        )
        ensure_seed_sources(conn, SEED_TZONE_THT02_SOURCES)
        # Validate signing key at startup
        load_private_key(config.signer_key_path)
        orphans = find_orphan_objects(conn, data_dir=config.data_dir)
        logger.info(
            "Worker started env=%s channel=%s schema=%s journal=%s context_enabled=%s vlm_enabled=%s orphans=%s",
            config.env,
            config.channel,
            schema_ver,
            mode,
            config.context_enabled,
            config.vlm_enabled,
            {k: len(v) for k, v in orphans.items()},
        )

        while not stop_requested:
            job = claim_next_job(
                conn,
                lease_sec=config.job_lease_sec,
                max_attempts=config.max_job_attempts,
            )
            if job is None:
                time.sleep(config.poll_interval_sec)
                continue
            logger.info("Claimed job_id=%s attempt=%s", job["id"], job["attempts"])
            process_single_job(conn, config=config, job_row=job)
    finally:
        conn.close()
        logger.info("Worker stopped cleanly")


def main() -> None:
    config = load_worker_config()
    run_worker_loop(config)


if __name__ == "__main__":
    main()
