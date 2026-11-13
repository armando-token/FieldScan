"""Fast offline PDF schematic inspection & fuzzy ASR/text sensor matcher for TZ THT-02.

Executes in < 50 ms (~2-5 ms typical cold start) using PyMuPDF (`pymupdf`) without
requiring network access or heavy OCR pipelines.
"""

from __future__ import annotations

import copy
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import time
from typing import Any
import unicodedata

import pymupdf

PROJECT_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
ASSETS_DIR = PROJECT_ROOT / "assets"

SPEC_PATH = KNOWLEDGE_DIR / "THT02_spec.json"
DATASHEET_PATH = KNOWLEDGE_DIR / "THT02_datasheet.md"
DEFAULT_PDF_PATH = ASSETS_DIR / "THT02_Users_Manual_v1.1.pdf"

PT_TO_MM = 25.4 / 72.0

# Matches standard PDF XObject image placement: `<a> <b> <c> <d> <e> <f> cm /<ImgName> Do`
_PDF_IMAGE_CTM_RE = re.compile(
    rb"([+-]?\d+(?:\.\d+)?)\s+"
    rb"([+-]?\d+(?:\.\d+)?)\s+"
    rb"([+-]?\d+(?:\.\d+)?)\s+"
    rb"([+-]?\d+(?:\.\d+)?)\s+"
    rb"([+-]?\d+(?:\.\d+)?)\s+"
    rb"([+-]?\d+(?:\.\d+)?)\s+cm\s+/([^\s/()<>[\]{}%]+)\s+Do"
)

# Spoken English phonetic normalizations common in Whisper / LFM3-Audio ASR
_PHONETIC_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    ("tee aitch tee", "tht"),
    ("tee h tee", "tht"),
    ("tee aitch ess", "ths"),
    ("tee h s", "ths"),
    ("tee aitch pee", "thp"),
    ("tee h p", "thp"),
    ("zero zero", "00"),
    ("zero two", "02"),
    ("oh two", "02"),
    ("oh oh", "00"),
    ("zero", "0"),
    ("two", "2"),
    ("thirty", "30"),
)

_DOMAIN_PHRASES: dict[str, float] = {
    "temperature and humidity sensor": 0.93,
    "temperature and humidity transmitter": 0.93,
    "rs485 temperature and humidity sensor": 0.95,
    "temperature sensor": 0.88,
    "humidity sensor": 0.88,
    "temperature probe": 0.88,
    "humidity probe": 0.88,
    "rs485 sensor": 0.90,
    "sensor rs485": 0.88,
    "modbus sensor": 0.88,
    "sensor modbus": 0.86,
    "sht3x": 0.94,
    "sht30": 0.94,
    "tz sensor": 0.88,
}

_DOMAIN_TOKENS: set[str] = {
    "tht",
    "ths",
    "thp",
    "tht02",
    "ths00",
    "thp02",
    "sht30",
    "sht3x",
    "tz",
    "temperature",
    "humidity",
    "sensor",
    "probe",
    "transmitter",
    "rs485",
    "modbus",
}

_SPEC_CACHE: tuple[int, dict[str, Any]] | None = None
_DATASHEET_CACHE: tuple[int, str] | None = None
_PDF_CACHE: dict[tuple[str, int, int], dict[str, Any]] = {}


def load_tht02_spec() -> dict[str, Any]:
    """Load and return a clean copy of `knowledge/THT02_spec.json`."""
    global _SPEC_CACHE
    stat = SPEC_PATH.stat()
    if _SPEC_CACHE is None or _SPEC_CACHE[0] != stat.st_mtime_ns:
        data = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
        _SPEC_CACHE = (stat.st_mtime_ns, data)
    return copy.deepcopy(_SPEC_CACHE[1])


def load_tht02_datasheet() -> str:
    """Load and return the full Industrial English Markdown technical reference (`THT02_datasheet.md`)."""
    global _DATASHEET_CACHE
    stat = DATASHEET_PATH.stat()
    if _DATASHEET_CACHE is None or _DATASHEET_CACHE[0] != stat.st_mtime_ns:
        text = DATASHEET_PATH.read_text(encoding="utf-8")
        _DATASHEET_CACHE = (stat.st_mtime_ns, text)
    return _DATASHEET_CACHE[1]


def _extract_fast_image_bboxes(page: pymupdf.Page, page_height_pt: float) -> dict[str, list[float]]:
    """Extract XObject placement bboxes from the page content stream without decoding image rasters."""
    bboxes: dict[str, list[float]] = {}
    raw_stream = page.read_contents()
    if not raw_stream:
        return bboxes

    for match in _PDF_IMAGE_CTM_RE.finditer(raw_stream):
        a_b, b_b, c_b, d_b, e_b, f_b, raw_name = match.groups()
        a, b, c, d, e, f = (
            float(a_b),
            float(b_b),
            float(c_b),
            float(d_b),
            float(e_b),
            float(f_b),
        )
        # Only use direct rectangular CTM when shear components are zero; rotated matrices fall back cleanly
        if abs(b) > 1e-6 or abs(c) > 1e-6:
            continue
        width_pt = abs(a)
        height_pt = abs(d)
        x0 = e if a >= 0 else e + a
        y_pdf_bottom = f if d >= 0 else f + d
        # Convert PDF bottom-left origin to top-left origin [x0, y0, x1, y1]
        y1 = page_height_pt - y_pdf_bottom
        y0 = y1 - height_pt
        name = raw_name.decode("latin1", errors="replace")
        bboxes[name] = [round(x0, 2), round(y0, 2), round(x0 + width_pt, 2), round(y1, 2)]
    return bboxes


def inspect_pdf_document(pdf_path: Path = DEFAULT_PDF_PATH) -> dict[str, Any]:
    """Inspect a PDF manual in < 50 ms, extracting page count and embedded schematic image bboxes."""
    t0 = time.perf_counter()
    resolved = Path(pdf_path).expanduser().resolve()

    if not resolved.exists():
        raise FileNotFoundError(f"PDF manual not found at: {resolved}")

    stat = resolved.stat()
    cache_key = (str(resolved), stat.st_mtime_ns, stat.st_size)
    cached = _PDF_CACHE.get(cache_key)
    if cached is not None:
        result = copy.deepcopy(cached)
        result["inspected_in_ms"] = round((time.perf_counter() - t0) * 1000.0, 3)
        return result

    is_tht02_manual = resolved.name == DEFAULT_PDF_PATH.name
    pages_meta: list[dict[str, Any]] = []
    total_images = 0

    with pymupdf.open(resolved) as doc:
        page_count = len(doc)
        doc_meta = doc.metadata or {}
        title = (doc_meta.get("title") or "").strip() or resolved.stem

        for idx in range(page_count):
            page = doc[idx]
            rect = page.rect
            width_pt = round(float(rect.width), 2)
            height_pt = round(float(rect.height), 2)
            fast_bboxes = _extract_fast_image_bboxes(page, height_pt)

            raw_images = page.get_images(full=True)
            embedded_images: list[dict[str, Any]] = []
            for img_tuple in raw_images:
                xref, _smask, px_w, px_h, bpc, colorspace, _alt_cs, name, img_filter, _ref = img_tuple
                bbox = fast_bboxes.get(name)
                if bbox is None:
                    # Fallback for complex nested CTM streams
                    rects = page.get_image_rects(xref)
                    if rects:
                        r0 = rects[0]
                        bbox = [round(float(r0.x0), 2), round(float(r0.y0), 2), round(float(r0.x1), 2), round(float(r0.y1), 2)]
                    else:
                        bbox = [0.0, 0.0, width_pt, height_pt]

                embedded_images.append(
                    {
                        "xref": int(xref),
                        "name": str(name),
                        "width": int(px_w),
                        "height": int(px_h),
                        "aspect_ratio": round(px_w / px_h, 4) if px_h else 0.0,
                        "bpc": int(bpc),
                        "colorspace": str(colorspace),
                        "filter": str(img_filter),
                        "bbox": bbox,
                        "bbox_mm": [round(coord * PT_TO_MM, 2) for coord in bbox],
                    }
                )

            total_images += len(embedded_images)
            raw_text = page.get_text("text").strip()
            page_num = idx + 1
            page_entry: dict[str, Any] = {
                "page": page_num,
                "width_pt": width_pt,
                "height_pt": height_pt,
                "width_mm": round(width_pt * PT_TO_MM, 2),
                "height_mm": round(height_pt * PT_TO_MM, 2),
                "bbox": [0.0, 0.0, width_pt, height_pt],
                "image_count": len(embedded_images),
                "images": embedded_images,
                "has_embedded_text": bool(raw_text),
                "text_snippet": raw_text[:200] if raw_text else "",
            }
            if is_tht02_manual and 1 <= page_num <= 9:
                page_entry["image_url"] = f"/assets/manual_pages/page_{page_num}.png"
            pages_meta.append(page_entry)

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 3)
    output: dict[str, Any] = {
        "pdf_path": str(resolved),
        "filename": resolved.name,
        "title": title,
        "file_size_bytes": int(stat.st_size),
        "page_count": page_count,
        "total_embedded_images": total_images,
        "pages": pages_meta,
        "inspected_in_ms": elapsed_ms,
    }
    _PDF_CACHE[cache_key] = copy.deepcopy(output)
    return output


def _normalize_query(raw: str) -> str:
    """Normalize punctuation, casing, and spoken English ASR phonetic tokens."""
    decomposed = unicodedata.normalize("NFKD", raw or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", stripped).strip()
    for src, dst in _PHONETIC_REPLACEMENTS:
        cleaned = re.sub(rf"\b{re.escape(src)}\b", dst, cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def _compact_alnum(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def match_and_load_sensor(query: str) -> dict[str, Any]:
    """Match spoken/typed sensor queries (including fuzzy ASR like 'THS 00' or 'THP02') to TZ THT-02."""
    t0 = time.perf_counter()
    spec = load_tht02_spec()
    datasheet_md = load_tht02_datasheet()
    pdf_info = inspect_pdf_document(DEFAULT_PDF_PATH)

    norm_query = _normalize_query(query)
    compact_query = _compact_alnum(norm_query)

    aliases: list[str] = [spec["sensor_id"], *spec.get("aliases", [])]
    best_alias = spec["sensor_id"]
    best_score = 0.0
    match_reason = "default_active_sensor"

    if not norm_query:
        # Empty query loads the default active THT-02 workspace twin cleanly
        best_score = 1.0
        matched = True
    else:
        query_tokens = norm_query.split()
        # 1) Exact or substring alias matching (covers 'THT-02', 'THS 00', 'THT 02', 'SHT30')
        for alias in aliases:
            norm_alias = _normalize_query(alias)
            comp_alias = _compact_alnum(norm_alias)
            if norm_query == norm_alias or compact_query == comp_alias:
                best_score = 1.0
                best_alias = alias
                match_reason = "exact_alias"
                break
            if norm_alias and re.search(rf"\b{re.escape(norm_alias)}\b", norm_query):
                if 0.98 > best_score:
                    best_score = 0.98
                    best_alias = alias
                    match_reason = "embedded_alias"
            elif comp_alias and len(comp_alias) >= 4 and comp_alias in compact_query:
                if 0.96 > best_score:
                    best_score = 0.96
                    best_alias = alias
                    match_reason = "compact_alias_substring"

        # 2) Industrial English descriptive domain phrases ('temperature and humidity sensor', 'RS485 sensor')
        if best_score < 0.95:
            for phrase, weight in _DOMAIN_PHRASES.items():
                if phrase in norm_query and weight > best_score:
                    best_score = weight
                    best_alias = phrase
                    match_reason = "domain_phrase"

        # 3) Phonetic & token-window SequenceMatcher similarity against aliases
        if best_score < 0.95:
            candidate_windows = [norm_query, compact_query, *query_tokens]
            for i in range(len(query_tokens) - 1):
                candidate_windows.append(f"{query_tokens[i]} {query_tokens[i + 1]}")
                candidate_windows.append(f"{query_tokens[i]}{query_tokens[i + 1]}")

            for alias in aliases:
                norm_alias = _normalize_query(alias)
                comp_alias = _compact_alnum(norm_alias)
                for win in candidate_windows:
                    if not win:
                        continue
                    ratio = max(
                        SequenceMatcher(None, win, norm_alias).ratio(),
                        SequenceMatcher(None, _compact_alnum(win), comp_alias).ratio(),
                    )
                    # Boost phonetic near-hits on short industrial model codes (e.g., THS01, THT03, THP02)
                    if ratio >= 0.72 and ratio > best_score:
                        best_score = round(ratio, 3)
                        best_alias = alias
                        match_reason = "fuzzy_phonetic_alias"

        # 4) Token overlap fallback for general English field queries
        overlap = _DOMAIN_TOKENS.intersection(query_tokens)
        if overlap and best_score < 0.82:
            token_score = min(0.88, 0.72 + 0.06 * len(overlap))
            if token_score > best_score:
                best_score = round(token_score, 3)
                best_alias = " ".join(sorted(overlap))
                match_reason = "domain_token_overlap"

        matched = best_score >= 0.60

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 3)
    return {
        "matched": matched,
        "sensor_id": spec["sensor_id"],
        "name": spec["name"],
        "query": query,
        "normalized_query": norm_query,
        "matched_alias": best_alias,
        "match_reason": match_reason,
        "confidence": round(float(best_score), 3),
        "spec": spec,
        "datasheet_md": datasheet_md,
        "datasheet": datasheet_md,
        "pdf_document": pdf_info,
        "pdf_info": pdf_info,
        "manual_pages": spec.get("manual_pages", []),
        "elapsed_ms": elapsed_ms,
    }
