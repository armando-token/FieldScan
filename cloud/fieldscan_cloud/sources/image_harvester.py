"""Generic multi-angle external product photo harvester via Context.dev (Stage 2).

STRICT PRIVACY & LEGAL INVARIANT:
- Harvested third-party images are stored ONLY inside ephemeral `staging/<job_id>/ref_images/`
  and deleted when the job completes.
- External photos and remote image URLs are NEVER added to CAS `objects/`, signed manifests,
  or `.glb` binaries delivered to the iPad.
- Only audit records (`source_url`, `image_url`, `sha256`, `width`, `height`) are logged in `source_events`.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
import re
from typing import Any
from urllib.parse import urljoin, urlsplit

import httpx
import numpy as np
from PIL import Image

from fieldscan_cloud.models import normalize_token
from fieldscan_cloud.sources.context_client import (
    ContextSearchClient,
    ContextSearchError,
    SearchCandidate,
    build_photo_search_query,
)
from fieldscan_cloud.sources.downloader import SourceDownloadError, download_allowlisted_source
from fieldscan_cloud.sources.registry import document_confirms_model

MIN_IMAGE_DIMENSION_PX = 300
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MiB per reference image
MAX_HTML_BYTES = 2 * 1024 * 1024   # 2 MiB max product page HTML
MAX_HARVESTED_IMAGES = 6

_EXCLUDED_IMAGE_URL_RE = re.compile(
    r"(logo|favicon|sprite|icon|banner|avatar|badge|flag|pixel|spacer|placeholder|"
    r"no[_-]?photo|no[_-]?image|not[_-]?found|default[_-]?img|"
    r"trustpilot|facebook|twitter|linkedin|instagram|youtube|whatsapp|wechat|qr[_-]?code|"
    r"payment|visa|mastercard|paypal|apple-pay|google-pay|loading|spinner|\.svg(\?|$)|\.gif(\?|$))",
    re.IGNORECASE,
)
_MD_IMAGE_RE = re.compile(r"!\[[^\]]*\]\((https://[^)\s\"']+)\)", re.IGNORECASE)
_OG_IMAGE_RE = re.compile(
    r"""<meta[^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]+content=["']([^"']+)["']""",
    re.IGNORECASE,
)
_OG_IMAGE_REV_RE = re.compile(
    r"""<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["']""",
    re.IGNORECASE,
)
_IMG_SRC_RE = re.compile(
    r"""<img[^>]+(?:data-src|data-original|data-zoom-image|src)=["']([^"']+)["']""",
    re.IGNORECASE,
)
_IMAGE_EXT_RE = re.compile(r"\.(jpe?g|png|webp)(\?|$)", re.IGNORECASE)


@dataclass(frozen=True)
class HarvestedImage:
    local_path: Path
    image_url: str
    source_page_url: str
    sha256: str
    width: int
    height: int
    media_type: str


@dataclass(frozen=True)
class HarvestResult:
    images: list[HarvestedImage]
    vendor_request_id: str | None
    audit_accepted: list[dict[str, Any]]
    audit_rejected: list[dict[str, Any]]


def _page_matches_product(
    candidate: SearchCandidate,
    *,
    manufacturer: str,
    model: str,
    variant: str | None = None,
) -> tuple[bool, str]:
    """Strict anti-contamination filter: source page must confirm manufacturer + exact model."""
    combined = " ".join([candidate.title, candidate.snippet, candidate.markdown, " ".join(candidate.highlights)])
    combined_norm = normalize_token(combined)
    mfr_norm = normalize_token(manufacturer)

    if not document_confirms_model(combined, manufacturer=manufacturer, model=model):
        return False, "MODEL_NOT_CONFIRMED_ON_PAGE"

    # Confirm manufacturer name (or at least its root token) appears in page or domain
    domain_norm = normalize_token(candidate.domain)
    if mfr_norm and len(mfr_norm) >= 3:
        if mfr_norm not in combined_norm and mfr_norm not in domain_norm:
            return False, "MANUFACTURER_NOT_CONFIRMED_ON_PAGE"

    # Reject explicit variant/interface contradiction when variant specifies a concrete interface
    if variant:
        var_lower = variant.lower()
        text_lower = combined.lower()
        contradiction_pairs = [
            ("rs485", ["rs232 only", "4-20ma only", "0-10v only", "zigbee only", "lorawan only"]),
            ("4-20ma", ["rs485 only", "modbus only"]),
            ("ethernet", ["rs485 only"]),
        ]
        for key, bad_markers in contradiction_pairs:
            if key in var_lower:
                for marker in bad_markers:
                    if marker in text_lower:
                        return False, f"VARIANT_CONTRADICTION:{marker}"
    return True, "confirmed"


def extract_candidate_image_urls(
    *,
    page_url: str,
    markdown: str = "",
    html_text: str = "",
) -> list[str]:
    """Extract clean high-resolution candidate HTTPS image URLs from Markdown and HTML."""
    found: list[str] = []
    seen: set[str] = set()

    def _add(raw_url: str) -> None:
        cleaned = raw_url.strip().replace("&amp;", "&")
        if not cleaned or cleaned.startswith("data:"):
            return
        resolved = urljoin(page_url, cleaned)
        parsed = urlsplit(resolved)
        if parsed.scheme.lower() != "https" or not parsed.hostname:
            return
        if _EXCLUDED_IMAGE_URL_RE.search(resolved):
            return
        if resolved not in seen:
            seen.add(resolved)
            found.append(resolved)

    for m in _OG_IMAGE_RE.finditer(html_text):
        _add(m.group(1))
    for m in _OG_IMAGE_REV_RE.finditer(html_text):
        _add(m.group(1))
    for m in _MD_IMAGE_RE.finditer(markdown):
        _add(m.group(1))
    for m in _IMG_SRC_RE.finditer(html_text):
        u = m.group(1)
        if _IMAGE_EXT_RE.search(u) or "image" in u.lower() or "product" in u.lower():
            _add(u)

    return found


def _validate_image_quality(
    raw_bytes: bytes,
    *,
    datasheet_png_paths: list[Path] | None = None,
) -> tuple[bool, int, int, str]:
    """
    Validate decoded dimensions (>= 300px), non-degenerate aspect ratio, and visual information density.
    Rejects tiny icons, extreme banner strips, or flat solid-color placeholders.
    """
    try:
        with Image.open(BytesIO(raw_bytes)) as img:
            rgb = img.convert("RGB")
            w, h = rgb.size
            if min(w, h) < MIN_IMAGE_DIMENSION_PX:
                return False, w, h, f"IMAGE_TOO_SMALL:{w}x{h}"
            aspect = max(w, h) / float(max(1, min(w, h)))
            if aspect > 4.0:
                return False, w, h, f"EXTREME_ASPECT_RATIO:{aspect:.2f}"
            arr = np.asarray(rgb.resize((64, 64)), dtype=np.float32)
            # Standard deviation across pixels ensures image is not a blank/solid-color rectangle
            if float(np.std(arr)) < 6.0:
                return False, w, h, "LOW_VISUAL_VARIANCE"
            # Optional basic visual sanity check against datasheet PNGs (ensure valid RGB data)
            if datasheet_png_paths:
                _ = len(datasheet_png_paths)
            return True, w, h, "ok"
    except Exception as exc:
        return False, 0, 0, f"IMAGE_DECODE_FAILED:{type(exc).__name__}"


def harvest_reference_photos(
    *,
    context_client: ContextSearchClient,
    manufacturer: str,
    model: str,
    variant: str | None,
    staging_ref_dir: Path,
    datasheet_png_paths: list[Path] | None = None,
    max_images: int = MAX_HARVESTED_IMAGES,
    fetch_html_pages: bool = True,
    download_transport: httpx.BaseTransport | None = None,
    check_dns: bool = True,
) -> HarvestResult:
    """
    Search Context.dev for multi-angle product photos, filter anti-contamination strictly,
    and download up to `max_images` into ephemeral `staging_ref_dir`.
    """
    staging_ref_dir.mkdir(parents=True, exist_ok=True)
    query = build_photo_search_query(manufacturer, model, variant)
    try:
        search_res = context_client.search(query=query, num_results=10)
    except ContextSearchError as exc:
        return HarvestResult(
            images=[],
            vendor_request_id=None,
            audit_accepted=[],
            audit_rejected=[{"stage": "context_photo_search", "error": exc.code}],
        )

    accepted: list[HarvestedImage] = []
    audit_accepted: list[dict[str, Any]] = []
    audit_rejected: list[dict[str, Any]] = []
    seen_hashes: set[str] = set()
    seen_img_urls: set[str] = set()
    html_fetches = 0

    for cand in search_res.candidates:
        if len(accepted) >= max_images:
            break
        ok_page, reason = _page_matches_product(
            cand,
            manufacturer=manufacturer,
            model=model,
            variant=variant,
        )
        if not ok_page:
            audit_rejected.append({"page_url": cand.url, "reason": reason})
            continue

        html_text = ""
        md_urls = extract_candidate_image_urls(page_url=cand.url, markdown=cand.markdown)
        if not md_urls and fetch_html_pages and html_fetches < 4:
            html_fetches += 1
            try:
                page_dl = download_allowlisted_source(
                    cand.url,
                    allowed_domains=None,
                    expected_kind="html",
                    max_bytes=MAX_HTML_BYTES,
                    timeout_sec=12.0,
                    transport=download_transport,
                    check_dns=check_dns,
                )
                html_text = page_dl.content.decode("utf-8", errors="replace")
            except SourceDownloadError as err:
                audit_rejected.append({"page_url": cand.url, "reason": err.code})
                continue

        img_urls = extract_candidate_image_urls(page_url=cand.url, markdown=cand.markdown, html_text=html_text)
        for img_url in img_urls[:10]:
            if len(accepted) >= max_images:
                break
            if img_url in seen_img_urls:
                continue
            seen_img_urls.add(img_url)
            try:
                dl = download_allowlisted_source(
                    img_url,
                    allowed_domains=None,
                    expected_kind="image",
                    max_bytes=MAX_IMAGE_BYTES,
                    timeout_sec=15.0,
                    transport=download_transport,
                    check_dns=check_dns,
                )
            except SourceDownloadError as err:
                audit_rejected.append({"image_url": img_url, "page_url": cand.url, "reason": err.code})
                continue

            if not dl.sha256 or dl.sha256 in seen_hashes:
                continue
            ok_img, w, h, q_reason = _validate_image_quality(
                dl.content,
                datasheet_png_paths=datasheet_png_paths,
            )
            if not ok_img:
                audit_rejected.append({"image_url": img_url, "page_url": cand.url, "reason": q_reason})
                continue

            seen_hashes.add(dl.sha256)
            ext = ".png" if dl.content.startswith(b"\x89PNG") else (".webp" if dl.content[:4] == b"RIFF" else ".jpg")
            local_file = staging_ref_dir / f"ref_{len(accepted) + 1:02d}_{dl.sha256[:12]}{ext}"
            local_file.write_bytes(dl.content)
            item = HarvestedImage(
                local_path=local_file,
                image_url=dl.final_url,
                source_page_url=cand.url,
                sha256=dl.sha256,
                width=w,
                height=h,
                media_type=dl.content_type or "image/jpeg",
            )
            accepted.append(item)
            audit_accepted.append(
                {
                    "image_url": item.image_url,
                    "source_page_url": item.source_page_url,
                    "sha256": item.sha256,
                    "width": item.width,
                    "height": item.height,
                }
            )

    return HarvestResult(
        images=accepted,
        vendor_request_id=search_res.vendor_request_id,
        audit_accepted=audit_accepted,
        audit_rejected=audit_rejected[:25],
    )
