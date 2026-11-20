"""PDF extraction, on-demand Tesseract OCR, citation indexing, and semantic diffing (Megaplan §9)."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import subprocess
from typing import Any

MAX_PDF_PAGES = 200
MIN_EMBEDDED_CHARS_PER_PAGE = 40
OCR_DPI = 150  # 150 DPI fast view/OCR baseline; 250 DPI used for dense/low-text retry


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


@dataclass(frozen=True)
class DocumentBuildOutput:
    document_id: str
    revision_label: str
    pdf_sha256: str
    page_count: int
    pages: list[ExtractedPage]
    index_dict: dict[str, Any]


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


def _extract_ocr_text(pdf_path: Path, page: int, work_dir: Path, *, lang: str = "eng") -> str:
    img_prefix = work_dir / f"page_{page:03d}"
    ppm_proc = _run_tool(
        [
            "pdftoppm",
            "-f",
            str(page),
            "-l",
            str(page),
            "-r",
            str(OCR_DPI),
            "-png",
            "-singlefile",
            str(pdf_path),
            str(img_prefix),
        ],
        timeout=30,
    )
    img_path = work_dir / f"page_{page:03d}.png"
    if ppm_proc.returncode != 0 or not img_path.is_file():
        return ""

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
    ocr_lang: str = "eng",
    max_ocr_pages: int = 20,
) -> DocumentBuildOutput:
    """Extract per-page text/OCR, build safe Markdown pages, and construct docs/index.json."""
    work_dir.mkdir(parents=True, exist_ok=True)
    page_count, meta = inspect_pdf_pages(pdf_path)
    pdf_sha256 = hashlib.sha256(pdf_path.read_bytes()).hexdigest()

    pages: list[ExtractedPage] = []
    ocr_used = 0
    for page_num in range(1, page_count + 1):
        embedded = _extract_embedded_text(pdf_path, page_num, work_dir)
        method = "embedded_text"
        text = embedded

        if len(re.sub(r"\s+", "", embedded)) < MIN_EMBEDDED_CHARS_PER_PAGE:
            if run_ocr and ocr_used < max_ocr_pages:
                ocr_text = _extract_ocr_text(pdf_path, page_num, work_dir, lang=ocr_lang)
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
            )
        )

    index_dict: dict[str, Any] = {
        "schema_version": 1,
        "document_id": document_id,
        "title": title,
        "revision_label": revision_label,
        "pdf_sha256": pdf_sha256,
        "page_count": page_count,
        "pdf_metadata": {k: meta[k] for k in ("Title", "Creator", "Producer") if k in meta},
        "pages": [
            {
                "page": p.page,
                "citation_id": p.citation_id,
                "extraction_method": p.extraction_method,
                "markdown_path": f"docs/{document_id}/pages/page_{p.page:03d}.md",
                "text_sha256": hashlib.sha256(p.text.encode("utf-8")).hexdigest(),
                "uncertain_cells": p.uncertain_cells,
                "excerpt": p.text[:240],
            }
            for p in pages
        ],
    }

    return DocumentBuildOutput(
        document_id=document_id,
        revision_label=revision_label,
        pdf_sha256=pdf_sha256,
        page_count=page_count,
        pages=pages,
        index_dict=index_dict,
    )


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
