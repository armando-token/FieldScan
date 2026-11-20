"""PDF rasterization (150 DPI PNGs), on-demand Tesseract OCR, citation indexing, budget guard & diffing (Stage 1)."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import subprocess
from typing import Any

from PIL import Image

MAX_PDF_PAGES = 240
MIN_EMBEDDED_CHARS_PER_PAGE = 40
RASTER_DPI = 150
MAX_PAGE_IMAGE_WIDTH_PX = 1200
MAX_PACKAGE_ARTIFACTS = 256
MAX_SINGLE_ARTIFACT_BYTES = 50 * 1024 * 1024
MAX_PACKAGE_TOTAL_BYTES = 120 * 1024 * 1024
CONSOLIDATE_MARKDOWN_PAGE_THRESHOLD = 100


class DocumentProcessingError(RuntimeError):
    """Raised when a PDF is invalid, exceeds safety bounds, or cannot be inspected."""


@dataclass(frozen=True)
class ExtractedPage:
    page: int
    extraction_method: str  # "embedded_text" | "ocr" | "empty"
    text: str
    markdown: str
    citation_id: str
    uncertain_cells: list[str]
    image_relpath: str | None = None
    image_local_path: Path | None = None
    image_width: int = 0
    image_height: int = 0
    image_sha256: str | None = None


@dataclass(frozen=True)
class DocumentBuildOutput:
    document_id: str
    revision_label: str
    pdf_sha256: str
    page_count: int
    pages: list[ExtractedPage]
    index_dict: dict[str, Any]
    consolidated_markdown: str


def _run_tool(argv: list[str], *, timeout: int = 30) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            argv,
            shell=False,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        tool_name = argv[0] if argv else "<unknown>"
        return subprocess.CompletedProcess(
            args=argv,
            returncode=127,
            stdout="",
            stderr=f"Tool not found: {tool_name} ({exc})",
        )


def inspect_pdf_pages(pdf_path: Path) -> tuple[int, dict[str, str]]:
    """Validate PDF magic bytes and read metadata/page count using Poppler pdfinfo."""
    if not pdf_path.is_file():
        raise DocumentProcessingError(f"PDF file not found: {pdf_path}")
    header = pdf_path.read_bytes()[:8]
    if not header.startswith(b"%PDF-"):
        raise DocumentProcessingError("SOURCE_NOT_VALID_PDF: missing %PDF- header")

    proc = _run_tool(["pdfinfo", str(pdf_path)], timeout=20)
    if proc.returncode != 0:
        raise DocumentProcessingError(f"pdfinfo failed (rc={proc.returncode}): {proc.stderr.strip()}")

    meta: dict[str, str] = {}
    for line in proc.stdout.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()

    try:
        page_count = int(meta.get("Pages", "0"))
    except ValueError as exc:
        raise DocumentProcessingError("Could not parse PDF page count") from exc

    if page_count <= 0 or page_count > MAX_PDF_PAGES:
        raise DocumentProcessingError(f"PDF page count out of bounds: {page_count}")
    return page_count, meta


def _extract_embedded_text(pdf_path: Path, page: int, work_dir: Path) -> str:
    txt_out = work_dir / f"page_{page:03d}.txt"
    proc = _run_tool(
        ["pdftotext", "-f", str(page), "-l", str(page), "-layout", str(pdf_path), str(txt_out)],
        timeout=20,
    )
    if proc.returncode != 0 or not txt_out.is_file():
        return ""
    return txt_out.read_text(encoding="utf-8", errors="replace").strip()


def _optimize_page_png(raw_png_path: Path, *, max_width: int = MAX_PAGE_IMAGE_WIDTH_PX) -> tuple[int, int, str]:
    """Clamp overly wide rasterized PNGs to <= max_width px and optimize PNG compression in place."""
    with Image.open(raw_png_path) as img:
        rgb = img.convert("RGB")
        w, h = rgb.size
        if w > max_width:
            new_h = max(1, int(round(h * (max_width / float(w)))))
            rgb = rgb.resize((max_width, new_h), Image.Resampling.LANCZOS)
            w, h = rgb.size
        buf = BytesIO()
        rgb.save(buf, format="PNG", optimize=True, compress_level=6)
        optimized_bytes = buf.getvalue()
    raw_png_path.write_bytes(optimized_bytes)
    return w, h, hashlib.sha256(optimized_bytes).hexdigest()


def _rasterize_page_to_png(
    pdf_path: Path,
    page: int,
    work_dir: Path,
    *,
    dpi: int = RASTER_DPI,
) -> tuple[Path | None, int, int, str | None]:
    """Rasterize a single PDF page to an optimized PNG via Poppler pdftoppm."""
    img_prefix = work_dir / f"page_{page:03d}"
    ppm_proc = _run_tool(
        [
            "pdftoppm",
            "-f",
            str(page),
            "-l",
            str(page),
            "-r",
            str(dpi),
            "-png",
            "-singlefile",
            str(pdf_path),
            str(img_prefix),
        ],
        timeout=30,
    )
    img_path = work_dir / f"page_{page:03d}.png"
    if ppm_proc.returncode != 0 or not img_path.is_file():
        return None, 0, 0, None
    try:
        w, h, sha = _optimize_page_png(img_path)
        return img_path, w, h, sha
    except Exception:
        raw = img_path.read_bytes()
        return img_path, 0, 0, hashlib.sha256(raw).hexdigest()


def _run_tesseract_on_png(img_path: Path, page: int, work_dir: Path, *, lang: str = "eng") -> str:
    ocr_base = work_dir / f"page_{page:03d}_ocr"
    tess_proc = _run_tool(
        ["tesseract", str(img_path), str(ocr_base), "-l", lang],
        timeout=45,
    )
    ocr_txt = work_dir / f"page_{page:03d}_ocr.txt"
    if tess_proc.returncode != 0 or not ocr_txt.is_file():
        return ""
    return ocr_txt.read_text(encoding="utf-8", errors="replace").strip()


def _detect_uncertain_cells(text: str) -> list[str]:
    """Flag visibly corrupted/garbled OCR table fragments instead of fabricating zeros (CL-DOC-01)."""
    flags: list[str] = []
    if re.search(r"\?\?+|\[illegible\]|\uFFFD", text, re.IGNORECASE):
        flags.append("UNREADABLE_TOKEN_DETECTED")
    return flags


def process_pdf_document(
    pdf_path: Path,
    *,
    work_dir: Path,
    document_id: str,
    revision_label: str,
    title: str,
    run_ocr: bool = True,
    render_page_images: bool = True,
    raster_dpi: int = RASTER_DPI,
    ocr_lang: str = "eng",
    max_ocr_pages: int = 20,
) -> DocumentBuildOutput:
    """
    Rasterize PDF pages to 150 DPI PNGs, extract embedded text / on-demand OCR (reusing PNGs),
    build safe Markdown pages, and emit docs/index.json with explicit `image_path` per page.
    """
    work_dir.mkdir(parents=True, exist_ok=True)
    page_count, meta = inspect_pdf_pages(pdf_path)
    pdf_sha256 = hashlib.sha256(pdf_path.read_bytes()).hexdigest()

    pages: list[ExtractedPage] = []
    ocr_used = 0
    consolidate_md = page_count > CONSOLIDATE_MARKDOWN_PAGE_THRESHOLD

    for page_num in range(1, page_count + 1):
        embedded = _extract_embedded_text(pdf_path, page_num, work_dir)
        method = "embedded_text"
        text = embedded

        img_path: Path | None = None
        img_w = 0
        img_h = 0
        img_sha: str | None = None
        if render_page_images or (run_ocr and len(re.sub(r"\s+", "", embedded)) < MIN_EMBEDDED_CHARS_PER_PAGE):
            img_path, img_w, img_h, img_sha = _rasterize_page_to_png(
                pdf_path, page_num, work_dir, dpi=raster_dpi
            )

        if len(re.sub(r"\s+", "", embedded)) < MIN_EMBEDDED_CHARS_PER_PAGE:
            if run_ocr and ocr_used < max_ocr_pages and img_path is not None:
                ocr_text = _run_tesseract_on_png(img_path, page_num, work_dir, lang=ocr_lang)
                ocr_used += 1
                if ocr_text:
                    method = "ocr"
                    text = ocr_text
                elif not embedded:
                    method = "empty"
            elif not embedded:
                method = "empty"

        uncertain = _detect_uncertain_cells(text)
        citation_id = f"{document_id}:p{page_num}:section1"
        safe_body = text.replace("\x00", "").strip()
        img_relpath = f"docs/{document_id}/pages/page_{page_num:03d}.png" if (render_page_images and img_path is not None) else None

        markdown = (
            f"# {title} — Page {page_num}\n\n"
            f"- Document ID: `{document_id}`\n"
            f"- Revision: `{revision_label}`\n"
            f"- Physical Page: `{page_num}`\n"
            f"- Extraction Method: `{method}`\n"
            f"- Citation ID: `{citation_id}`\n\n"
            f"---\n\n"
            f"{safe_body or '_No extractable text on this page._'}\n"
        )
        pages.append(
            ExtractedPage(
                page=page_num,
                extraction_method=method,
                text=safe_body,
                markdown=markdown,
                citation_id=citation_id,
                uncertain_cells=uncertain,
                image_relpath=img_relpath,
                image_local_path=img_path if render_page_images else None,
                image_width=img_w,
                image_height=img_h,
                image_sha256=img_sha,
            )
        )

    consolidated_md = "\n\n".join(p.markdown for p in pages)
    pages_index: list[dict[str, Any]] = []
    for p in pages:
        entry: dict[str, Any] = {
            "page": p.page,
            "citation_id": p.citation_id,
            "extraction_method": p.extraction_method,
            "markdown_path": (
                f"docs/{document_id}/manual.md"
                if consolidate_md
                else f"docs/{document_id}/pages/page_{p.page:03d}.md"
            ),
            "text_sha256": hashlib.sha256(p.text.encode("utf-8")).hexdigest(),
            "uncertain_cells": p.uncertain_cells,
            "excerpt": p.text[:240],
        }
        if p.image_relpath is not None:
            entry["image_path"] = p.image_relpath
            if p.image_width > 0 and p.image_height > 0:
                entry["image_width"] = p.image_width
                entry["image_height"] = p.image_height
        pages_index.append(entry)

    index_dict: dict[str, Any] = {
        "schema_version": 1,
        "document_id": document_id,
        "title": title,
        "revision_label": revision_label,
        "pdf_sha256": pdf_sha256,
        "page_count": page_count,
        "pdf_metadata": {k: meta[k] for k in ("Title", "Creator", "Producer") if k in meta},
        "pages": pages_index,
    }

    return DocumentBuildOutput(
        document_id=document_id,
        revision_label=revision_label,
        pdf_sha256=pdf_sha256,
        page_count=page_count,
        pages=pages,
        index_dict=index_dict,
        consolidated_markdown=consolidated_md,
    )


def enforce_artifact_budget(
    doc_artifacts: list[dict[str, Any]],
    *,
    consolidated_markdown_artifact: dict[str, Any] | None = None,
    reserved_non_doc_slots: int = 6,
    max_total_artifacts: int = MAX_PACKAGE_ARTIFACTS,
    max_total_bytes: int = MAX_PACKAGE_TOTAL_BYTES,
) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Guarantee package stays within client Contract v2.1.0 limits (<= 256 artifacts, <= 120 MB).
    Priority order: manual_pdf, document_index, manual_page_image, manual_markdown.
    When over budget (e.g. >100-page manuals), consolidates per-page markdown first, then trims excess pages.
    """
    allowed_doc_slots = max(2, max_total_artifacts - reserved_non_doc_slots)
    notes: list[str] = []

    essential = [a for a in doc_artifacts if a["role"] in {"manual_pdf", "document_index"}]
    page_images = [a for a in doc_artifacts if a["role"] == "manual_page_image"]
    page_markdowns = [a for a in doc_artifacts if a["role"] == "manual_markdown"]
    others = [
        a
        for a in doc_artifacts
        if a["role"] not in {"manual_pdf", "document_index", "manual_page_image", "manual_markdown"}
    ]

    candidate = essential + others + page_images + page_markdowns
    if len(candidate) > allowed_doc_slots or len(page_images) > CONSOLIDATE_MARKDOWN_PAGE_THRESHOLD:
        if consolidated_markdown_artifact is not None and len(page_markdowns) > 1:
            page_markdowns = [consolidated_markdown_artifact]
            notes.append("MARKDOWN_CONSOLIDATED_FOR_ARTIFACT_BUDGET")
        candidate = essential + others + page_images + page_markdowns

    if len(candidate) > allowed_doc_slots:
        fixed = essential + others + page_markdowns
        remaining_for_images = max(0, allowed_doc_slots - len(fixed))
        if len(page_images) > remaining_for_images:
            page_images = page_images[:remaining_for_images]
            notes.append("PAGE_IMAGES_CAPPED_FOR_ARTIFACT_BUDGET")
        candidate = essential + others + page_images + page_markdowns

    # Enforce byte budget (<= 120 MB total) while preserving essential artifacts
    kept: list[dict[str, Any]] = []
    running_bytes = 0
    for art in candidate:
        sz = int(art.get("byte_count", 0))
        if sz > MAX_SINGLE_ARTIFACT_BYTES:
            notes.append(f"ARTIFACT_EXCEEDED_SINGLE_LIMIT:{art['role']}")
            continue
        if running_bytes + sz > max_total_bytes and art["role"] not in {"manual_pdf", "document_index"}:
            notes.append("PACKAGE_BYTE_BUDGET_TRIMMED")
            continue
        kept.append(art)
        running_bytes += sz

    return kept, sorted(set(notes))


def validate_page_references(page_refs: list[int], page_count: int) -> list[str]:
    """Return error codes if any page reference is outside 1..page_count (CL-DOC-02)."""
    errors: list[str] = []
    for p in page_refs:
        if p < 1 or p > page_count:
            errors.append(f"PAGE_OUT_OF_RANGE:{p}/{page_count}")
    return errors


_PHYSICAL_KEYWORDS = re.compile(
    r"\b(dimension|mm|diameter|length|enclosure|housing|mounting|bracket|dip\s*switch|terminal)\b",
    re.IGNORECASE,
)
_PROCEDURE_KEYWORDS = re.compile(
    r"\b(modbus|register|0x000[0-9a-f]|baud|voltage|wiring|rs-?485|crc-?16)\b",
    re.IGNORECASE,
)


def classify_document_change(
    old_index: dict[str, Any] | None,
    new_index: dict[str, Any],
    *,
    old_texts: dict[int, str] | None = None,
    new_texts: dict[int, str] | None = None,
) -> str:
    """
    Classify semantic impact between two document revisions (§9.1 step 7, CL-DOC-03).
    Returns: 'initial' | 'editorial_only' | 'procedure_change' | 'physical_change'.
    """
    if old_index is None:
        return "initial"
    if old_index.get("pdf_sha256") == new_index.get("pdf_sha256"):
        return "editorial_only"

    if old_texts is not None and new_texts is not None:
        all_pages = sorted(set(old_texts.keys()) | set(new_texts.keys()))
        changed_lines: list[str] = []
        for p in all_pages:
            o = old_texts.get(p, "")
            n = new_texts.get(p, "")
            if o != n:
                o_lines = set(o.splitlines())
                n_lines = set(n.splitlines())
                changed_lines.extend(o_lines ^ n_lines)
        diff_blob = "\n".join(changed_lines)
        if _PHYSICAL_KEYWORDS.search(diff_blob):
            return "physical_change"
        if _PROCEDURE_KEYWORDS.search(diff_blob):
            return "procedure_change"
        return "editorial_only"

    if old_index.get("page_count") != new_index.get("page_count"):
        return "procedure_change"
    return "editorial_only"
