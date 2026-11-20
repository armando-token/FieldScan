"""Context.dev search API adapter (Megaplan §8.1 & §8.2, CL-SRC-01 & CL-SRC-04)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

import httpx


class ContextSearchError(RuntimeError):
    """Typed Context.dev error distinguishing auth, quota, rate limit, and transient transport errors."""

    def __init__(self, code: str, message: str, *, transient: bool = False, retry_after: int | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.transient = transient
        self.retry_after = retry_after


@dataclass(frozen=True)
class SearchCandidate:
    url: str
    domain: str
    title: str
    snippet: str


@dataclass(frozen=True)
class ContextSearchResult:
    query: str
    vendor_request_id: str | None
    candidates: list[SearchCandidate]


def build_technical_query(manufacturer: str, model: str, variant: str | None = None) -> str:
    parts = [manufacturer.strip(), model.strip()]
    if variant and variant.strip():
        parts.append(variant.strip())
    parts.append("datasheet manual")
    return " ".join(parts)


class ContextSearchClient:
    """Bounded HTTPS client for POST https://api.context.dev/v1/web/search."""

    def __init__(
        self,
        *,
        search_url: str,
        api_key: str,
        max_results: int = 10,
        timeout_sec: float = 25.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if not search_url.startswith("https://"):
            raise ValueError("Context search URL must use https://")
        self.search_url = search_url
        self._api_key = api_key
        self.max_results = max(1, min(max_results, 20))
        self.timeout_sec = timeout_sec
        self._transport = transport

    def search(
        self,
        *,
        query: str,
        include_domains: list[str] | None = None,
        num_results: int | None = None,
    ) -> ContextSearchResult:
        limit = max(1, min(num_results or self.max_results, self.max_results))
        payload: dict[str, Any] = {
            "query": query,
            "numResults": limit,
        }
        if include_domains:
            payload["includeDomains"] = list(include_domains)

        try:
            with httpx.Client(
                timeout=httpx.Timeout(self.timeout_sec, connect=8.0),
                transport=self._transport,
            ) as client:
                resp = client.post(
                    self.search_url,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise ContextSearchError("CONTEXT_TIMEOUT", "Context.dev search timed out", transient=True) from exc
        except httpx.HTTPError as exc:
            raise ContextSearchError(
                "CONTEXT_NETWORK_ERROR", f"Context.dev transport failure: {type(exc).__name__}", transient=True
            ) from exc

        vendor_req_id = resp.headers.get("x-request-id") or resp.headers.get("request-id")
        if resp.status_code == 401 or resp.status_code == 403:
            raise ContextSearchError("CONTEXT_AUTH_FAILED", "Context.dev API credentials rejected", transient=False)
        if resp.status_code == 402:
            raise ContextSearchError("CONTEXT_QUOTA_EXCEEDED", "Context.dev credits/quota exhausted", transient=False)
        if resp.status_code == 429:
            retry_hdr = resp.headers.get("retry-after")
            retry_sec = int(retry_hdr) if retry_hdr and retry_hdr.isdigit() else 15
            raise ContextSearchError(
                "CONTEXT_RATE_LIMITED",
                "Context.dev rate limit hit",
                transient=True,
                retry_after=retry_sec,
            )
        if resp.status_code >= 500:
            raise ContextSearchError(
                "CONTEXT_UPSTREAM_5XX",
                f"Context.dev upstream error ({resp.status_code})",
                transient=True,
            )
        if resp.status_code != 200:
            raise ContextSearchError(
                "CONTEXT_HTTP_ERROR",
                f"Unexpected Context.dev status {resp.status_code}",
                transient=False,
            )

        try:
            data = resp.json()
        except Exception as exc:
            raise ContextSearchError("CONTEXT_INVALID_JSON", "Context.dev returned invalid JSON", transient=False) from exc

        raw_results = data.get("results")
        if not isinstance(raw_results, list):
            raise ContextSearchError("CONTEXT_INVALID_SCHEMA", "Context.dev response missing results list", transient=False)

        candidates: list[SearchCandidate] = []
        for item in raw_results[:limit]:
            if not isinstance(item, dict):
                continue
            url = str(item.get("url", "")).strip()
            if not url.startswith("https://"):
                continue
            domain = (urlsplit(url).hostname or "").lower()
            candidates.append(
                SearchCandidate(
                    url=url,
                    domain=domain,
                    title=str(item.get("title", "")).strip(),
                    snippet=str(item.get("snippet") or item.get("text") or "").strip()[:400],
                )
            )
        return ContextSearchResult(
            query=query,
            vendor_request_id=vendor_req_id,
            candidates=candidates,
        )
