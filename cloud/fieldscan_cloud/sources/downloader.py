"""Defensive HTTPS downloader for allowlisted OEM sources (Megaplan §8.3, CL-SRC-05)."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx

MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024  # 25 MiB cap
MAX_REDIRECTS = 5


class SourceDownloadError(RuntimeError):
    """Typed rejection raised when an external OEM source fails security or content checks."""

    def __init__(self, code: str, message: str, *, transient: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.transient = transient


@dataclass(frozen=True)
class DownloadResult:
    final_url: str
    status_code: int
    not_modified: bool
    content: bytes
    sha256: str | None
    content_type: str
    etag: str | None
    last_modified: str | None


def _is_domain_allowed(hostname: str, allowed_domains: set[str]) -> bool:
    host = hostname.lower().rstrip(".")
    for allowed in allowed_domains:
        dom = allowed.lower().rstrip(".")
        if host == dom or host.endswith(f".{dom}"):
            return True
    return False


def _is_strictly_public_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    check_ip: ipaddress.IPv4Address | ipaddress.IPv6Address = ip
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        check_ip = ip.ipv4_mapped
    if (
        not check_ip.is_global
        or check_ip.is_private
        or check_ip.is_loopback
        or check_ip.is_link_local
        or check_ip.is_multicast
        or check_ip.is_reserved
        or check_ip.is_unspecified
    ):
        return False
    return True


def _validate_public_hostname(hostname: str, *, check_dns: bool = True) -> None:
    if not hostname:
        raise SourceDownloadError("SOURCE_URL_INVALID", "Missing hostname in source URL")
    try:
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        ip = None

    if ip is not None:
        if not _is_strictly_public_ip(ip):
            raise SourceDownloadError("SOURCE_NON_PUBLIC_IP", f"Rejected non-public IP: {hostname}")
        return

    if not check_dns:
        return

    try:
        infos = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise SourceDownloadError("SOURCE_DNS_FAILED", f"DNS lookup failed for {hostname}", transient=True) from exc

    for info in infos:
        addr = info[4][0]
        parsed_ip = ipaddress.ip_address(addr)
        if not _is_strictly_public_ip(parsed_ip):
            raise SourceDownloadError(
                "SOURCE_NON_PUBLIC_IP", f"Hostname {hostname} resolved to non-public address"
            )


def _validate_target_url(url: str, allowed_domains: set[str] | None, *, check_dns: bool) -> str:
    parsed = urlsplit(url)
    if parsed.scheme.lower() != "https":
        raise SourceDownloadError("SOURCE_SCHEME_REJECTED", "Only https:// URLs are permitted")
    if parsed.username or parsed.password:
        raise SourceDownloadError("SOURCE_EMBEDDED_CREDENTIALS", "Embedded URL credentials are forbidden")
    hostname = (parsed.hostname or "").lower()
    if allowed_domains is not None and not _is_domain_allowed(hostname, allowed_domains):
        raise SourceDownloadError(
            "SOURCE_DOMAIN_NOT_ALLOWED", f"Host {hostname!r} is outside allowlisted OEM origins"
        )
    _validate_public_hostname(hostname, check_dns=check_dns)
    return url


def download_allowlisted_source(
    url: str,
    *,
    allowed_domains: set[str] | None,
    expected_kind: str = "pdf",
    max_bytes: int = MAX_DOWNLOAD_BYTES,
    timeout_sec: float = 25.0,
    if_none_match: str | None = None,
    if_modified_since: str | None = None,
    transport: httpx.BaseTransport | None = None,
    check_dns: bool = True,
) -> DownloadResult:
    """
    Download an external resource validating every redirect hop, public DNS, byte cap,
    and true content magic bytes (rejecting HTML login portals masquerading as PDFs).
    """
    current_url = _validate_target_url(url, allowed_domains, check_dns=check_dns)
    headers: dict[str, str] = {"User-Agent": "FieldScanCloud/0.1 (+catalog-worker)"}
    if if_none_match:
        headers["If-None-Match"] = if_none_match
    if if_modified_since:
        headers["If-Modified-Since"] = if_modified_since

    with httpx.Client(
        timeout=httpx.Timeout(timeout_sec, connect=8.0),
        follow_redirects=False,
        transport=transport,
    ) as client:
        for _hop in range(MAX_REDIRECTS + 1):
            try:
                with client.stream("GET", current_url, headers=headers) as resp:
                    if resp.status_code in {301, 302, 303, 307, 308}:
                        loc = resp.headers.get("location")
                        if not loc:
                            raise SourceDownloadError("SOURCE_REDIRECT_INVALID", "Redirect missing Location header")
                        next_url = urljoin(current_url, loc)
                        current_url = _validate_target_url(next_url, allowed_domains, check_dns=check_dns)
                        continue

                    if resp.status_code == 304:
                        return DownloadResult(
                            final_url=current_url,
                            status_code=304,
                            not_modified=True,
                            content=b"",
                            sha256=None,
                            content_type=resp.headers.get("content-type", ""),
                            etag=resp.headers.get("etag"),
                            last_modified=resp.headers.get("last-modified"),
                        )

                    if resp.status_code >= 500:
                        raise SourceDownloadError(
                            "SOURCE_UPSTREAM_5XX", f"OEM origin returned {resp.status_code}", transient=True
                        )
                    if resp.status_code != 200:
                        raise SourceDownloadError(
                            "SOURCE_HTTP_REJECTED", f"OEM origin returned status {resp.status_code}"
                        )

                    content_len_hdr = resp.headers.get("content-length")
                    if content_len_hdr and content_len_hdr.isdigit() and int(content_len_hdr) > max_bytes:
                        raise SourceDownloadError(
                            "SOURCE_TOO_LARGE",
                            f"Declared Content-Length {content_len_hdr} exceeds limit {max_bytes}",
                        )

                    chunks: list[bytes] = []
                    total = 0
                    for chunk in resp.iter_bytes(chunk_size=65536):
                        total += len(chunk)
                        if total > max_bytes:
                            raise SourceDownloadError(
                                "SOURCE_TOO_LARGE", f"Response stream exceeded max limit {max_bytes}"
                            )
                        chunks.append(chunk)

                    raw = b"".join(chunks)
                    ctype = (resp.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
                    _verify_content_kind(raw, ctype, expected_kind)

                    return DownloadResult(
                        final_url=current_url,
                        status_code=200,
                        not_modified=False,
                        content=raw,
                        sha256=hashlib.sha256(raw).hexdigest(),
                        content_type=ctype or "application/octet-stream",
                        etag=resp.headers.get("etag"),
                        last_modified=resp.headers.get("last-modified"),
                    )
            except SourceDownloadError:
                raise
            except httpx.TimeoutException as exc:
                raise SourceDownloadError("SOURCE_TIMEOUT", "OEM source download timed out", transient=True) from exc
            except httpx.HTTPError as exc:
                raise SourceDownloadError(
                    "SOURCE_NETWORK_ERROR", f"Network error downloading source: {type(exc).__name__}", transient=True
                ) from exc

        raise SourceDownloadError("SOURCE_TOO_MANY_REDIRECTS", f"Exceeded max redirects ({MAX_REDIRECTS})")


def _verify_content_kind(raw: bytes, content_type: str, expected_kind: str) -> None:
    head = raw[:512].lstrip()
    head_lower = head.lower()
    is_html = (
        content_type in {"text/html", "application/xhtml+xml"}
        or head_lower.startswith(b"<!doctype html")
        or head_lower.startswith(b"<html")
        or b"<title>" in head_lower
    )
    if expected_kind == "pdf":
        if is_html:
            raise SourceDownloadError(
                "SOURCE_HTML_PORTAL_REJECTED",
                "Received HTML page/login portal instead of PDF binary",
            )
        if not raw.startswith(b"%PDF-"):
            raise SourceDownloadError(
                "SOURCE_MAGIC_MISMATCH",
                f"Downloaded payload does not start with %PDF- (content-type={content_type!r})",
            )
    elif expected_kind == "glb":
        if is_html or not raw.startswith(b"glTF"):
            raise SourceDownloadError(
                "SOURCE_MAGIC_MISMATCH",
                "Downloaded payload is not a valid glTF binary (.glb)",
            )
    elif expected_kind == "image":
        if is_html:
            raise SourceDownloadError(
                "SOURCE_HTML_PORTAL_REJECTED",
                "Received HTML page instead of image binary",
            )
        is_png = raw.startswith(b"\x89PNG\r\n\x1a\n")
        is_jpeg = raw.startswith(b"\xff\xd8\xff")
        is_webp = len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
        if not (is_png or is_jpeg or is_webp):
            raise SourceDownloadError(
                "SOURCE_IMAGE_MAGIC_MISMATCH",
                f"Downloaded image is not JPEG/PNG/WebP (content-type={content_type!r})",
            )
    elif expected_kind == "html":
        if not (is_html or content_type.startswith("text/")):
            raise SourceDownloadError(
                "SOURCE_NOT_HTML",
                f"Expected HTML product page, got content-type={content_type!r}",
            )
