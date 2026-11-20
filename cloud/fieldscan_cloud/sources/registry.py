"""OEM source allowlist registry, classification, permission policy, and seed entries (Megaplan §8.2)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

from fieldscan_cloud.sources.context_client import SearchCandidate

ALLOWED_OEM_DOMAINS: dict[str, set[str]] = {
    "tzone": {"tzonedigital.com", "www.tzonedigital.com"},
}

SEED_TZONE_THT02_SOURCES: list[dict[str, str]] = [
    {
        "source_id": "tzone_oem_product_page",
        "origin_kind": "oem_official",
        "canonical_url": "https://www.tzonedigital.com/en/product/details/31.aspx",
        "allowed_domain": "www.tzonedigital.com",
        "source_class": "product_page",
        "permission_policy": "reference_only",
        "decision_evidence": "Official TZONE product page for TZ THT-02 RS-485 sensor.",
    },
    {
        "source_id": "tzone_oem_download_portal",
        "origin_kind": "oem_portal",
        "canonical_url": "https://tzonedigital.com/en/download.aspx",
        "allowed_domain": "tzonedigital.com",
        "source_class": "catalog_pdf",
        "permission_policy": "reference_only",
        "decision_evidence": "Official TZONE downloads portal for manuals/catalogs.",
    },
    {
        "source_id": "tzone_public_spec_v1_0",
        "origin_kind": "distributor_public",
        "canonical_url": "https://p.globalsources.com/IMAGES/PDT/SPEC/387/K1195613387.pdf",
        "allowed_domain": "p.globalsources.com",
        "source_class": "datasheet_pdf",
        "permission_policy": "derived_only",
        "decision_evidence": "Public distributor V1.0 datasheet; requires hardware revision confirmation before activating procedures.",
    },
]


@dataclass(frozen=True)
class ClassifiedCandidate:
    url: str
    domain: str
    title: str
    snippet: str
    origin_kind: str
    source_class: str
    allowed_for_download: bool
    permission_policy: str
    score: int


def classify_search_candidate(candidate: SearchCandidate, *, manufacturer_norm: str) -> ClassifiedCandidate:
    """Classify a Context.dev search result without treating search rank as applicability certification."""
    domain = candidate.domain.lower()
    allowed_set = ALLOWED_OEM_DOMAINS.get(manufacturer_norm, set())
    is_oem = any(domain == d or domain.endswith(f".{d}") for d in allowed_set)
    path_lower = urlsplit(candidate.url).path.lower()
    text_lower = f"{candidate.title} {candidate.snippet}".lower()

    if path_lower.endswith(".pdf"):
        if "catalog" in text_lower or "brochure" in text_lower:
            source_class = "catalog_pdf"
        elif "manual" in text_lower or "user" in text_lower:
            source_class = "manual_pdf"
        else:
            source_class = "datasheet_pdf"
    elif path_lower.endswith((".step", ".stp")):
        source_class = "cad_step"
    elif path_lower.endswith(".glb"):
        source_class = "cad_glb"
    else:
        source_class = "product_page"

    if is_oem:
        origin_kind = "oem_official"
        permission = "redistributable" if source_class in {"manual_pdf", "datasheet_pdf"} else "reference_only"
        score = 100 if source_class == "manual_pdf" else 80
    else:
        origin_kind = "context_candidate"
        permission = "restricted"
        score = 20

    return ClassifiedCandidate(
        url=candidate.url,
        domain=domain,
        title=candidate.title,
        snippet=candidate.snippet,
        origin_kind=origin_kind,
        source_class=source_class,
        allowed_for_download=is_oem and source_class in {"manual_pdf", "datasheet_pdf"},
        permission_policy=permission,
        score=score,
    )


def filter_artifacts_by_permission(
    artifacts: list[dict[str, Any]],
    *,
    permission_policy: str,
) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Enforce source distribution rights (CL-SRC-06):
    - redistributable: original PDF + derived index/markdown allowed
    - derived_only: exclude raw `manual_pdf`, publish derived `document_index` / `manual_markdown`
    - reference_only / restricted: emit no raw PDF and flag SOURCE_RIGHTS_RESTRICTED
    """
    if permission_policy == "redistributable":
        return list(artifacts), []
    if permission_policy == "derived_only":
        filtered = [a for a in artifacts if a.get("role") != "manual_pdf"]
        return filtered, ["SOURCE_RIGHTS_DERIVED_ONLY"]
    filtered = [a for a in artifacts if a.get("role") == "document_index"]
    return filtered, ["SOURCE_RIGHTS_RESTRICTED"]
