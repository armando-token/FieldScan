"""Generic multimodal CAD v2 recipe synthesizer and VLM client (Stage 3).

ZERO HARDCODING PER SENSOR:
- Operates generically on any manufacturer/model/variant datasheet PNGs + ephemeral reference photos.
- Enforces strict truth hierarchy: official PDF datasheet dimensions, internal anatomy, and citations
  are authoritative; harvested reference photos enrich external silhouette, hardware features, and PBR finishes.
- Supports OpenAI-compatible, Gemini, and Anthropic multimodal REST endpoints via `httpx`.
- Degrades honestly to `docs_only` (`INTERNAL_GEOMETRY_UNCONFIRMED`) when VLM is disabled/unavailable
  and no verified CAD recipe or STEP geometry is present.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from io import BytesIO
import json
from pathlib import Path
import re
from typing import Any
from urllib.parse import quote as url_quote

import httpx
from PIL import Image, UnidentifiedImageError

from fieldscan_cloud.documents.pipeline import DocumentBuildOutput
from fieldscan_cloud.sources.image_harvester import HarvestedImage

SUPPORTED_PRIMITIVE_KINDS: frozenset[str] = frozenset(
    {
        "cylinder",
        "box",
        "lathe_profile",
        "extruded_polygon",
        "slotted_cylinder",
        "hex_prism",
        "rounded_box",
        "tube_path",
        "pattern",
        "composite_part",
    }
)

_ENGINEERING_PAGE_KEYWORDS = re.compile(
    r"\b(dimension|mm|cm|inch|diameter|length|width|height|outline|drawing|mechanical|"
    r"diagram|schematic|wiring|pinout|connector|terminal|mounting|flange|bracket|"
    r"enclosure|housing|dip\s*switch|internal|pcb|sensor|specification|appearance|structure)\b",
    re.IGNORECASE,
)

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


class VlmSynthesisError(RuntimeError):
    """Raised when a configured VLM API call fails or returns unusable output."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class RecipeSynthesisResult:
    recipe: dict[str, Any] | None
    origin: str  # "vlm_synthesized" | "existing_recipe" | "existing_recipe_fallback" | "oem_step" | "degraded_docs_only"
    reason_codes: list[str]
    validation_errors: list[str]
    selected_pages: list[int]
    ref_image_count: int


def encode_image_bytes_for_vlm(
    raw_bytes: bytes,
    *,
    max_dim: int = 1024,
    out_format: str = "PNG",
) -> tuple[str, str]:
    """Validate raw image bytes via Pillow, clamp dimensions for token efficiency, and return (mime_type, base64_str)."""
    if not raw_bytes:
        raise VlmSynthesisError("VLM_INVALID_IMAGE", "Image payload is empty")
    try:
        with Image.open(BytesIO(raw_bytes)) as img:
            rgb = img.convert("RGB")
            w, h = rgb.size
            if w <= 0 or h <= 0:
                raise VlmSynthesisError("VLM_INVALID_IMAGE", "Image has invalid dimensions")
            if max(w, h) > max_dim:
                scale = max_dim / float(max(w, h))
                rgb = rgb.resize(
                    (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
                    Image.Resampling.LANCZOS,
                )
            buf = BytesIO()
            fmt = out_format.upper()
            if fmt == "JPEG":
                rgb.save(buf, format="JPEG", quality=85, optimize=True)
                return "image/jpeg", base64.b64encode(buf.getvalue()).decode("ascii")
            rgb.save(buf, format="PNG", optimize=True)
            return "image/png", base64.b64encode(buf.getvalue()).decode("ascii")
    except VlmSynthesisError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise VlmSynthesisError("VLM_INVALID_IMAGE", f"Invalid image data: {exc}") from exc


def _encode_image_for_vlm(path: Path, *, max_dim: int = 1024) -> tuple[str, str]:
    """Read an image from disk, clamp dimensions for token efficiency, and return (mime_type, base64_str)."""
    return encode_image_bytes_for_vlm(path.read_bytes(), max_dim=max_dim, out_format="PNG")


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    """Parse a JSON object from model output, tolerating optional markdown code fences."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = _CODE_FENCE_RE.sub("", cleaned).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise VlmSynthesisError("VLM_INVALID_JSON", "VLM response did not contain a valid JSON object")
        try:
            parsed = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as exc:
            raise VlmSynthesisError("VLM_INVALID_JSON", f"Failed to parse VLM JSON object: {exc}") from exc
    if not isinstance(parsed, dict):
        raise VlmSynthesisError("VLM_INVALID_JSON", "VLM JSON response root must be an object")
    return parsed


def _normalize_openai_chat_url(raw_url: str) -> str:
    """Allow either full `/chat/completions` URLs or OpenAI-compatible base URLs ending in `/v1`."""
    cleaned = raw_url.strip().rstrip("/")
    if cleaned.endswith("/v1") or cleaned.endswith("/openai/v1"):
        return f"{cleaned}/chat/completions"
    return raw_url.strip()


def _resolve_mantle_anthropic_url(raw_url: str) -> str:
    """Route `anthropic.*` models on Bedrock Mantle to `/anthropic/v1/messages`."""
    cleaned = raw_url.strip().rstrip("/")
    if cleaned.endswith("/anthropic/v1/messages"):
        return cleaned
    for suffix in ("/v1/chat/completions", "/openai/v1/chat/completions", "/v1", "/openai/v1"):
        if cleaned.endswith(suffix):
            base = cleaned[: -len(suffix)].rstrip("/")
            return f"{base}/anthropic/v1/messages"
    return cleaned


def _resolve_bedrock_converse_url(raw_url: str, model: str) -> str:
    """Resolve Amazon Bedrock Converse REST URL with mandatory percent-encoding for `modelId`."""
    quoted_model = url_quote(model.strip(), safe="")
    cleaned = raw_url.strip()
    if "{model}" in cleaned:
        return cleaned.replace("{model}", quoted_model)
    stripped = cleaned.rstrip("/")
    if stripped.endswith("/converse"):
        return stripped
    return f"{stripped}/model/{quoted_model}/converse"


def _mime_to_bedrock_image_format(mime: str) -> str:
    low = mime.strip().lower()
    if low in {"image/jpeg", "image/jpg"}:
        return "jpeg"
    if low == "image/webp":
        return "webp"
    if low == "image/gif":
        return "gif"
    return "png"


class VlmClient:
    """Provider-agnostic multimodal client over httpx (Bedrock Mantle, Bedrock Converse, OpenAI-compatible, Gemini, Anthropic)."""

    def __init__(
        self,
        *,
        provider: str,
        api_url: str,
        model: str,
        api_key: str,
        timeout_sec: float = 90.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.provider = provider.strip().lower()
        self.api_url = api_url.strip()
        self.model = model.strip()
        self.api_key = api_key.strip()
        self.timeout_sec = timeout_sec
        self._transport = transport

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        image_paths: list[Path],
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        encoded_images = [_encode_image_for_vlm(p) for p in image_paths if p.is_file()]
        result = self._invoke_multimodal(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            history=[],
            encoded_images=encoded_images,
            max_tokens=max_tokens,
            temperature=0.1,
            json_mode=True,
        )
        return _extract_json_object(str(result["reply_text"]))

    def generate_chat(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]] | None = None,
        image_paths: list[Path] | None = None,
        encoded_images: list[tuple[str, str]] | None = None,
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        imgs: list[tuple[str, str]] = list(encoded_images or [])
        for p in image_paths or []:
            if p.is_file():
                imgs.append(_encode_image_for_vlm(p))
        return self._invoke_multimodal(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            history=list(history or []),
            encoded_images=imgs,
            max_tokens=max_tokens,
            temperature=temperature,
            json_mode=False,
        )

    def _invoke_multimodal(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]],
        encoded_images: list[tuple[str, str]],
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> dict[str, Any]:
        if self.provider == "bedrock_mantle" and self.model.lower().startswith("anthropic."):
            return self._call_anthropic(
                system_prompt,
                user_prompt,
                history,
                encoded_images,
                max_tokens=max_tokens,
                temperature=temperature,
                api_url=_resolve_mantle_anthropic_url(self.api_url),
                use_bearer_auth=True,
            )
        if self.provider in {"openai_compatible", "bedrock_mantle"}:
            return self._call_openai_compatible(
                system_prompt,
                user_prompt,
                history,
                encoded_images,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
            )
        if self.provider == "bedrock":
            return self._call_bedrock_converse(
                system_prompt,
                user_prompt,
                history,
                encoded_images,
                max_tokens=max_tokens,
                temperature=temperature,
            )
        if self.provider == "gemini":
            return self._call_gemini(
                system_prompt,
                user_prompt,
                history,
                encoded_images,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
            )
        if self.provider == "anthropic":
            return self._call_anthropic(
                system_prompt,
                user_prompt,
                history,
                encoded_images,
                max_tokens=max_tokens,
                temperature=temperature,
            )
        raise VlmSynthesisError("VLM_UNSUPPORTED_PROVIDER", f"Unsupported VLM provider: {self.provider!r}")

    def _post_raw(self, url: str, *, headers: dict[str, str], payload: dict[str, Any]) -> httpx.Response:
        try:
            with httpx.Client(timeout=self.timeout_sec, transport=self._transport) as client:
                return client.post(url, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise VlmSynthesisError("VLM_NETWORK_ERROR", f"VLM request failed: {exc.__class__.__name__}") from exc

    def _parse_response(self, resp: httpx.Response) -> dict[str, Any]:
        if resp.status_code == 429:
            raise VlmSynthesisError("VLM_RATE_LIMITED", "VLM provider returned HTTP 429")
        if resp.status_code in {401, 403}:
            raise VlmSynthesisError("VLM_AUTH_ERROR", f"VLM provider rejected credentials (HTTP {resp.status_code})")
        if resp.status_code >= 400:
            raise VlmSynthesisError("VLM_HTTP_ERROR", f"VLM provider returned HTTP {resp.status_code}: {resp.text[:300]}")
        try:
            data = resp.json()
        except Exception as exc:
            raise VlmSynthesisError("VLM_BAD_RESPONSE", "VLM response was not valid JSON") from exc
        if not isinstance(data, dict):
            raise VlmSynthesisError("VLM_BAD_RESPONSE", "VLM response body must be a JSON object")
        return data

    def _post(self, url: str, *, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
        resp = self._post_raw(url, headers=headers, payload=payload)
        return self._parse_response(resp)

    def _call_openai_compatible(
        self,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]],
        encoded_images: list[tuple[str, str]],
        *,
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> dict[str, Any]:
        messages: list[dict[str, Any]] = []
        if system_prompt.strip():
            messages.append({"role": "system", "content": system_prompt})
        for turn in history:
            role = turn.get("role", "")
            content = str(turn.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

        if encoded_images:
            user_content: list[dict[str, Any]] = [{"type": "text", "text": user_prompt}]
            for mime, b64 in encoded_images:
                user_content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})
            messages.append({"role": "user", "content": user_content})
        else:
            messages.append({"role": "user", "content": user_prompt})

        payload: dict[str, Any] = {
            "model": self.model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        url = _normalize_openai_chat_url(self.api_url)
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        # Retry gracefully on HTTP 400 parameter-dialect mismatches across Bedrock Mantle / frontier OpenAI models
        resp = self._post_raw(url, headers=headers, payload=payload)
        for _ in range(3):
            if resp.status_code != 400:
                break
            err_lower = resp.text.lower()
            adjusted = False
            if "response_format" in payload and ("response_format" in err_lower or "json_object" in err_lower):
                payload = {k: v for k, v in payload.items() if k != "response_format"}
                adjusted = True
            elif "max_tokens" in payload and "max_completion_tokens" in err_lower:
                payload = {k: v for k, v in payload.items() if k != "max_tokens"}
                payload["max_completion_tokens"] = max_tokens
                adjusted = True
            elif "temperature" in payload and "temperature" in err_lower:
                payload = {k: v for k, v in payload.items() if k != "temperature"}
                adjusted = True
            if not adjusted:
                break
            resp = self._post_raw(url, headers=headers, payload=payload)

        data = self._parse_response(resp)
        choices = data.get("choices") or []
        if not choices or not isinstance(choices[0], dict):
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "OpenAI-compatible response missing choices")
        content = choices[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            text = "\n".join(str(item.get("text", "")) for item in content if isinstance(item, dict) and "text" in item)
        else:
            text = str(content)
        text = text.strip()
        if not text:
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "OpenAI-compatible response returned empty text")

        usage_raw = data.get("usage")
        usage: dict[str, int] | None = None
        if isinstance(usage_raw, dict):
            usage = {
                k: int(usage_raw[k])
                for k in ("prompt_tokens", "completion_tokens", "total_tokens")
                if isinstance(usage_raw.get(k), (int, float))
            } or None

        return {
            "reply_text": text,
            "model": str(data.get("model") or self.model),
            "provider": self.provider,
            "usage": usage,
        }

    def _call_bedrock_converse(
        self,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]],
        encoded_images: list[tuple[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> dict[str, Any]:
        messages: list[dict[str, Any]] = []
        for turn in history:
            role = turn.get("role", "")
            content = str(turn.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": [{"text": content}]})

        user_blocks: list[dict[str, Any]] = []
        for mime, b64 in encoded_images:
            user_blocks.append(
                {
                    "image": {
                        "format": _mime_to_bedrock_image_format(mime),
                        "source": {"bytes": b64},
                    }
                }
            )
        user_blocks.append({"text": user_prompt})
        messages.append({"role": "user", "content": user_blocks})

        payload: dict[str, Any] = {
            "messages": messages,
            "inferenceConfig": {
                "maxTokens": max_tokens,
                "temperature": temperature,
            },
        }
        if system_prompt.strip():
            payload["system"] = [{"text": system_prompt}]

        url = _resolve_bedrock_converse_url(self.api_url, self.model)
        data = self._post(
            url,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            payload=payload,
        )
        out_blocks = data.get("output", {}).get("message", {}).get("content", [])
        text = "\n".join(str(b.get("text", "")) for b in out_blocks if isinstance(b, dict) and "text" in b).strip()
        if not text:
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "Bedrock Converse response returned empty text")

        usage_raw = data.get("usage")
        usage: dict[str, int] | None = None
        if isinstance(usage_raw, dict):
            mapped: dict[str, int] = {}
            if isinstance(usage_raw.get("inputTokens"), (int, float)):
                mapped["prompt_tokens"] = int(usage_raw["inputTokens"])
            if isinstance(usage_raw.get("outputTokens"), (int, float)):
                mapped["completion_tokens"] = int(usage_raw["outputTokens"])
            if isinstance(usage_raw.get("totalTokens"), (int, float)):
                mapped["total_tokens"] = int(usage_raw["totalTokens"])
            usage = mapped or None

        return {
            "reply_text": text,
            "model": self.model,
            "provider": self.provider,
            "usage": usage,
        }

    def _call_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]],
        encoded_images: list[tuple[str, str]],
        *,
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> dict[str, Any]:
        contents: list[dict[str, Any]] = []
        for turn in history:
            role = turn.get("role", "")
            content = str(turn.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                contents.append(
                    {
                        "role": "model" if role == "assistant" else "user",
                        "parts": [{"text": content}],
                    }
                )
        parts: list[dict[str, Any]] = [{"text": user_prompt}]
        for mime, b64 in encoded_images:
            parts.append({"inlineData": {"mimeType": mime, "data": b64}})
        contents.append({"role": "user", "parts": parts})

        gen_cfg: dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
        if json_mode:
            gen_cfg["responseMimeType"] = "application/json"

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": gen_cfg,
        }
        if system_prompt.strip():
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        url = self.api_url
        if "{model}" in url:
            url = url.replace("{model}", self.model)
        data = self._post(
            url,
            headers={"x-goog-api-key": self.api_key, "Content-Type": "application/json"},
            payload=payload,
        )
        candidates = data.get("candidates") or []
        if not candidates or not isinstance(candidates[0], dict):
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "Gemini response missing candidates")
        resp_parts = candidates[0].get("content", {}).get("parts", [])
        text = "\n".join(str(p.get("text", "")) for p in resp_parts if isinstance(p, dict) and "text" in p).strip()
        if not text:
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "Gemini response returned empty text")

        usage_raw = data.get("usageMetadata")
        usage: dict[str, int] | None = None
        if isinstance(usage_raw, dict):
            mapped: dict[str, int] = {}
            if isinstance(usage_raw.get("promptTokenCount"), (int, float)):
                mapped["prompt_tokens"] = int(usage_raw["promptTokenCount"])
            if isinstance(usage_raw.get("candidatesTokenCount"), (int, float)):
                mapped["completion_tokens"] = int(usage_raw["candidatesTokenCount"])
            if isinstance(usage_raw.get("totalTokenCount"), (int, float)):
                mapped["total_tokens"] = int(usage_raw["totalTokenCount"])
            usage = mapped or None

        return {
            "reply_text": text,
            "model": self.model,
            "provider": self.provider,
            "usage": usage,
        }

    def _call_anthropic(
        self,
        system_prompt: str,
        user_prompt: str,
        history: list[dict[str, str]],
        encoded_images: list[tuple[str, str]],
        *,
        max_tokens: int,
        temperature: float,
        api_url: str | None = None,
        use_bearer_auth: bool = False,
    ) -> dict[str, Any]:
        messages: list[dict[str, Any]] = []
        for turn in history:
            role = turn.get("role", "")
            content = str(turn.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

        content_blocks: list[dict[str, Any]] = []
        for mime, b64 in encoded_images:
            content_blocks.append(
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": mime, "data": b64},
                }
            )
        content_blocks.append({"type": "text", "text": user_prompt})
        messages.append({"role": "user", "content": content_blocks})

        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system_prompt.strip():
            payload["system"] = system_prompt

        headers = {
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        if use_bearer_auth:
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            headers["x-api-key"] = self.api_key

        data = self._post(
            api_url or self.api_url,
            headers=headers,
            payload=payload,
        )
        blocks = data.get("content") or []
        text = "\n".join(str(b.get("text", "")) for b in blocks if isinstance(b, dict) and b.get("type") == "text").strip()
        if not text:
            raise VlmSynthesisError("VLM_EMPTY_RESPONSE", "Anthropic response returned empty text")

        usage_raw = data.get("usage")
        usage: dict[str, int] | None = None
        if isinstance(usage_raw, dict):
            mapped: dict[str, int] = {}
            if isinstance(usage_raw.get("input_tokens"), (int, float)):
                mapped["prompt_tokens"] = int(usage_raw["input_tokens"])
            if isinstance(usage_raw.get("output_tokens"), (int, float)):
                mapped["completion_tokens"] = int(usage_raw["output_tokens"])
            if "prompt_tokens" in mapped and "completion_tokens" in mapped:
                mapped["total_tokens"] = mapped["prompt_tokens"] + mapped["completion_tokens"]
            usage = mapped or None

        return {
            "reply_text": text,
            "model": str(data.get("model") or self.model),
            "provider": self.provider,
            "usage": usage,
        }


def select_key_datasheet_pages(doc_out: DocumentBuildOutput, *, max_pages: int = 4) -> list[tuple[int, Path]]:
    """
    Generically choose the most informative rasterized datasheet PNG pages for multimodal analysis
    (cover/overview page + pages with highest engineering/dimension/diagram keyword density).
    """
    available = [
        p for p in doc_out.pages if p.image_local_path is not None and p.image_local_path.is_file()
    ]
    if not available or max_pages <= 0:
        return []

    chosen: dict[int, Path] = {}
    # Always include page 1 if available (product photo / overview / cover)
    for p in available:
        if p.page == 1 and p.image_local_path is not None:
            chosen[1] = p.image_local_path
            break

    scored: list[tuple[int, int, Path]] = []
    for p in available:
        if p.page in chosen or p.image_local_path is None:
            continue
        hits = len(_ENGINEERING_PAGE_KEYWORDS.findall(p.text))
        # Extra boost when numeric millimeter values appear in page text
        mm_hits = len(re.findall(r"\b\d+(?:\.\d+)?\s*mm\b", p.text, re.IGNORECASE))
        score = hits + (mm_hits * 3)
        scored.append((score, -p.page, p.image_local_path))

    scored.sort(reverse=True)
    for _score, neg_page, path in scored:
        if len(chosen) >= max_pages:
            break
        chosen[-neg_page] = path

    return sorted(chosen.items(), key=lambda kv: kv[0])


def _validate_geometry_node(node: dict[str, Any], *, path: str, errors: list[str], depth: int = 0) -> None:
    if depth > 6:
        errors.append(f"{path}: geometry nesting depth exceeds 6")
        return
    if not isinstance(node, dict):
        errors.append(f"{path}: geometry entry must be an object")
        return
    kind = str(node.get("kind", "")).strip()
    if kind not in SUPPORTED_PRIMITIVE_KINDS:
        errors.append(f"{path}: unsupported geometry kind {kind!r}")
        return

    if kind == "composite_part":
        children = node.get("children")
        if not isinstance(children, list) or not children:
            errors.append(f"{path}: composite_part requires non-empty children[]")
            return
        for idx, child in enumerate(children):
            _validate_geometry_node(child, path=f"{path}.children[{idx}]", errors=errors, depth=depth + 1)
    elif kind == "pattern":
        count = node.get("count")
        if not isinstance(count, int) or count < 1 or count > 256:
            errors.append(f"{path}: pattern count must be an integer in 1..256")
        item = node.get("item")
        if not isinstance(item, dict):
            errors.append(f"{path}: pattern requires an item object")
        else:
            _validate_geometry_node(item, path=f"{path}.item", errors=errors, depth=depth + 1)
    elif kind == "lathe_profile":
        pts = node.get("points_mm")
        if not isinstance(pts, list) or len(pts) < 2:
            errors.append(f"{path}: lathe_profile requires at least 2 [r, z] points_mm")
    elif kind == "extruded_polygon":
        outer = node.get("outer_mm")
        if not isinstance(outer, list) or len(outer) < 3:
            errors.append(f"{path}: extruded_polygon requires outer_mm with >= 3 [x, y] points")
    elif kind == "slotted_cylinder":
        if float(node.get("outer_diameter_mm", 0)) <= 0:
            errors.append(f"{path}: slotted_cylinder requires positive outer_diameter_mm")
    elif kind == "hex_prism":
        if float(node.get("across_flats_mm", node.get("diameter_mm", 0))) <= 0:
            errors.append(f"{path}: hex_prism requires positive across_flats_mm or diameter_mm")
    elif kind in {"box", "rounded_box"}:
        sz = node.get("size_mm")
        if not isinstance(sz, list) or len(sz) != 3 or any(float(v) <= 0 for v in sz):
            errors.append(f"{path}: {kind} requires positive 3-element size_mm")
    elif kind == "tube_path":
        pts = node.get("points_mm")
        if not isinstance(pts, list) or len(pts) < 2:
            errors.append(f"{path}: tube_path requires at least 2 [x, y, z] points_mm")
        if float(node.get("diameter_mm", 0)) <= 0:
            errors.append(f"{path}: tube_path requires positive diameter_mm")
    elif kind == "cylinder":
        if float(node.get("diameter_mm", 0)) <= 0:
            errors.append(f"{path}: cylinder requires positive diameter_mm")


def validate_recipe_schema(
    recipe: dict[str, Any],
    *,
    document_page_count: int | None = None,
) -> tuple[bool, list[str]]:
    """Validate declarative CAD recipe v1/v2 structure generically before building a GLB."""
    errors: list[str] = []
    if not isinstance(recipe, dict):
        return False, ["Recipe root must be a JSON object"]

    schema_ver = int(recipe.get("recipe_schema_version", recipe.get("schema_version", 1)))
    if schema_ver not in {1, 2}:
        errors.append(f"Unsupported recipe schema version: {schema_ver}")

    for field in ("product_id", "variant_id"):
        if not str(recipe.get(field, "")).strip():
            errors.append(f"Missing required field: {field}")

    parts = recipe.get("parts")
    if not isinstance(parts, list) or not parts:
        errors.append("Recipe must contain a non-empty parts[] array")
        return False, errors

    seen_part_ids: set[str] = set()
    seen_node_ids: set[str] = set()
    for idx, part in enumerate(parts):
        if not isinstance(part, dict):
            errors.append(f"parts[{idx}] must be an object")
            continue
        pid = str(part.get("part_id", "")).strip()
        nid = str(part.get("node_id", "")).strip()
        if not pid:
            errors.append(f"parts[{idx}] missing part_id")
        elif pid in seen_part_ids:
            errors.append(f"Duplicate part_id: {pid}")
        else:
            seen_part_ids.add(pid)

        if not nid:
            errors.append(f"parts[{idx}] missing node_id")
        elif nid in seen_node_ids:
            errors.append(f"Duplicate node_id: {nid}")
        else:
            seen_node_ids.add(nid)

        if not str(part.get("citation_id", "")).strip():
            errors.append(f"parts[{idx}] ({pid}) missing citation_id")

        page = part.get("page")
        if page is None:
            errors.append(f"parts[{idx}] ({pid}) missing page")
        elif document_page_count is not None:
            try:
                p_int = int(page)
                if p_int < 1 or p_int > document_page_count:
                    errors.append(f"parts[{idx}] ({pid}) page {p_int} outside 1..{document_page_count}")
            except (TypeError, ValueError):
                errors.append(f"parts[{idx}] ({pid}) has non-integer page {page!r}")

        _validate_geometry_node(part, path=f"parts[{idx}]", errors=errors)

    for idx, act in enumerate(recipe.get("actions", [])):
        if not isinstance(act, dict):
            errors.append(f"actions[{idx}] must be an object")
            continue
        pid = str(act.get("part_id", "")).strip()
        if pid and pid not in seen_part_ids:
            errors.append(f"actions[{idx}] references unknown part_id: {pid}")
        if document_page_count is not None and "page" in act and act["page"] is not None:
            try:
                p_int = int(act["page"])
                if p_int < 1 or p_int > document_page_count:
                    errors.append(f"actions[{idx}] page {p_int} outside 1..{document_page_count}")
            except (TypeError, ValueError):
                errors.append(f"actions[{idx}] has non-integer page {act['page']!r}")

    return len(errors) == 0, errors


def build_recipe_synthesis_prompts(
    *,
    manufacturer: str,
    model: str,
    variant: str | None,
    product_id: str,
    variant_id: str,
    doc_out: DocumentBuildOutput,
    selected_pages: list[int],
    ref_image_count: int,
    existing_recipe: dict[str, Any] | None = None,
    review_feedback: str | None = None,
) -> tuple[str, str]:
    """Build generic system + user prompts instructing a VLM to emit CAD recipe schema v2 JSON."""
    system_prompt = (
        "You are a precision mechanical CAD engineer generating a declarative JSON v2 parametric CAD recipe "
        "for glTF 2.0 PBR digital twin construction.\n"
        "STRICT TRUTH HIERARCHY (MANDATORY):\n"
        "1. The official OEM PDF datasheet pages and extracted text are the sole authoritative source for "
        "overall dimensions (in millimeters), mechanical drawings, internal components (PCBs, switches, "
        "terminals, sensors), wiring color codes, and physical page citations.\n"
        "2. Multi-angle external product photos may ONLY enrich outer silhouette, chamfers/bevels, "
        "ventilation slots, hex nuts, mounting hole geometry, and PBR surface finishes "
        "(baseColorFactor RGBA 0..1, metallicFactor 0..1, roughnessFactor 0..1).\n"
        "3. NEVER invent internal parts not documented in the datasheet. If dimensions or geometry cannot be "
        "determined with engineering fidelity, return {\"unconfirmed\": true, \"reason\": \"...\"}.\n"
        "4. Output ONLY valid JSON (English keys/labels only) conforming to recipe_schema_version=2.\n"
        "SUPPORTED UNIVERSAL PRIMITIVES:\n"
        "- lathe_profile: {kind, points_mm: [[r,z],...], segments, material}\n"
        "- extruded_polygon: {kind, outer_mm: [[x,y],...], holes_mm: [[[x,y],...]], z_start_mm, z_end_mm, bevel_mm, material}\n"
        "- slotted_cylinder: {kind, outer_diameter_mm, inner_diameter_mm, z_start_mm, z_end_mm, slot_count, slot_rows, core_diameter_mm, material}\n"
        "- hex_prism: {kind, across_flats_mm, z_start_mm, z_end_mm, chamfer_mm, material}\n"
        "- rounded_box: {kind, size_mm: [sx,sy,sz], center_mm: [cx,cy,cz], bevel_mm, material}\n"
        "- tube_path: {kind, points_mm: [[x,y,z],...], diameter_mm, sections, material}\n"
        "- pattern: {kind, mode: 'linear'|'radial', count, step_mm|radius_mm, item: <primitive>}\n"
        "- composite_part: {kind, children: [<primitive>, ...]}\n"
        "All parts must include part_id, node_id, aliases, citation_id (format '<document_id>:p<page>:section1'), "
        "and page (integer 1..page_count)."
    )

    page_snippets = []
    for p in doc_out.pages:
        if p.page in selected_pages or p.page <= 3:
            excerpt = p.text[:1400].strip()
            if excerpt:
                page_snippets.append(f"--- PAGE {p.page} ({p.citation_id}) ---\n{excerpt}")

    user_sections = [
        f"Target Device: manufacturer={manufacturer!r}, model={model!r}, variant={variant!r}",
        f"Canonical IDs: product_id={product_id!r}, variant_id={variant_id!r}",
        f"Document ID: {doc_out.document_id!r}, Revision: {doc_out.revision_label!r}, Total Pages: {doc_out.page_count}",
        f"Attached Images: {len(selected_pages)} datasheet PNG page(s) {selected_pages}, "
        f"plus {ref_image_count} ephemeral multi-angle reference photo(s).",
        "Extracted Datasheet Text Excerpts:\n" + ("\n\n".join(page_snippets) or "(No embedded text; inspect PNGs)"),
    ]
    if existing_recipe is not None:
        user_sections.append(
            "Existing Verified Baseline Recipe (preserve all part_id, node_id, legacy_zone_id, "
            "control_measurements_m, views, and actions while upgrading geometry/PBR fidelity):\n"
            + json.dumps(existing_recipe, indent=2)
        )
    if review_feedback:
        user_sections.append(
            "VISUAL SELF-REVIEW FEEDBACK FROM PREVIOUS ATTEMPT (fix every listed defect):\n" + review_feedback
        )

    user_sections.append(
        "Return a single JSON object with recipe_schema_version=2, scale_to_meters=0.001, "
        "control_measurements_m, parts[], views[], and actions[]."
    )
    return system_prompt, "\n\n".join(user_sections)


def synthesize_cad_recipe(
    *,
    doc_out: DocumentBuildOutput,
    manufacturer: str,
    model: str,
    variant: str | None,
    product_id: str,
    variant_id: str,
    harvested_images: list[HarvestedImage] | None = None,
    existing_recipe: dict[str, Any] | None = None,
    step_path: Path | None = None,
    vlm_client: VlmClient | None = None,
    review_feedback: str | None = None,
) -> RecipeSynthesisResult:
    """
    Generically synthesize or select a validated CAD v2 recipe for any product/variant.
    Never hardcodes sensor-specific geometry in Python.
    """
    refs = list(harvested_images or [])
    key_pages = select_key_datasheet_pages(doc_out, max_pages=4)
    selected_page_nums = [pg for pg, _ in key_pages]

    if step_path is not None and step_path.is_file():
        return RecipeSynthesisResult(
            recipe=existing_recipe,
            origin="oem_step",
            reason_codes=[],
            validation_errors=[],
            selected_pages=selected_page_nums,
            ref_image_count=len(refs),
        )

    if vlm_client is not None:
        system_prompt, user_prompt = build_recipe_synthesis_prompts(
            manufacturer=manufacturer,
            model=model,
            variant=variant,
            product_id=product_id,
            variant_id=variant_id,
            doc_out=doc_out,
            selected_pages=selected_page_nums,
            ref_image_count=len(refs),
            existing_recipe=existing_recipe,
            review_feedback=review_feedback,
        )
        image_inputs = [p for _, p in key_pages] + [h.local_path for h in refs[:6]]
        try:
            raw_recipe = vlm_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                image_paths=image_inputs,
            )
        except VlmSynthesisError as exc:
            if existing_recipe is not None:
                ok_ex, ex_errs = validate_recipe_schema(existing_recipe, document_page_count=doc_out.page_count)
                if ok_ex:
                    return RecipeSynthesisResult(
                        recipe=existing_recipe,
                        origin="existing_recipe_fallback",
                        reason_codes=[exc.code],
                        validation_errors=[],
                        selected_pages=selected_page_nums,
                        ref_image_count=len(refs),
                    )
                return RecipeSynthesisResult(
                    recipe=None,
                    origin="degraded_docs_only",
                    reason_codes=[exc.code, "INTERNAL_GEOMETRY_UNCONFIRMED"],
                    validation_errors=ex_errs,
                    selected_pages=selected_page_nums,
                    ref_image_count=len(refs),
                )
            return RecipeSynthesisResult(
                recipe=None,
                origin="degraded_docs_only",
                reason_codes=[exc.code, "INTERNAL_GEOMETRY_UNCONFIRMED"],
                validation_errors=[str(exc)],
                selected_pages=selected_page_nums,
                ref_image_count=len(refs),
            )

        if raw_recipe.get("unconfirmed") is True:
            if existing_recipe is not None:
                ok_ex, _ = validate_recipe_schema(existing_recipe, document_page_count=doc_out.page_count)
                if ok_ex:
                    return RecipeSynthesisResult(
                        recipe=existing_recipe,
                        origin="existing_recipe_fallback",
                        reason_codes=[],
                        validation_errors=[],
                        selected_pages=selected_page_nums,
                        ref_image_count=len(refs),
                    )
            return RecipeSynthesisResult(
                recipe=None,
                origin="degraded_docs_only",
                reason_codes=["INTERNAL_GEOMETRY_UNCONFIRMED"],
                validation_errors=[str(raw_recipe.get("reason", "VLM marked geometry unconfirmed"))],
                selected_pages=selected_page_nums,
                ref_image_count=len(refs),
            )

        raw_recipe.setdefault("product_id", product_id)
        raw_recipe.setdefault("variant_id", variant_id)
        raw_recipe.setdefault("recipe_schema_version", 2)
        raw_recipe.setdefault("scale_to_meters", 0.001)

        ok, val_errors = validate_recipe_schema(raw_recipe, document_page_count=doc_out.page_count)
        if ok:
            return RecipeSynthesisResult(
                recipe=raw_recipe,
                origin="vlm_synthesized",
                reason_codes=[],
                validation_errors=[],
                selected_pages=selected_page_nums,
                ref_image_count=len(refs),
            )
        if existing_recipe is not None:
            ok_ex, _ = validate_recipe_schema(existing_recipe, document_page_count=doc_out.page_count)
            if ok_ex:
                return RecipeSynthesisResult(
                    recipe=existing_recipe,
                    origin="existing_recipe_fallback",
                    reason_codes=["VLM_RECIPE_SCHEMA_INVALID"],
                    validation_errors=val_errors,
                    selected_pages=selected_page_nums,
                    ref_image_count=len(refs),
                )
        return RecipeSynthesisResult(
            recipe=None,
            origin="degraded_docs_only",
            reason_codes=["VLM_RECIPE_SCHEMA_INVALID", "INTERNAL_GEOMETRY_UNCONFIRMED"],
            validation_errors=val_errors,
            selected_pages=selected_page_nums,
            ref_image_count=len(refs),
        )

    # VLM disabled: use verified existing recipe if available; otherwise degrade honestly to docs_only
    if existing_recipe is not None:
        ok_ex, ex_errs = validate_recipe_schema(existing_recipe, document_page_count=doc_out.page_count)
        if ok_ex:
            return RecipeSynthesisResult(
                recipe=existing_recipe,
                origin="existing_recipe",
                reason_codes=[],
                validation_errors=[],
                selected_pages=selected_page_nums,
                ref_image_count=len(refs),
            )
        return RecipeSynthesisResult(
            recipe=None,
            origin="degraded_docs_only",
            reason_codes=["RECIPE_SCHEMA_INVALID", "INTERNAL_GEOMETRY_UNCONFIRMED"],
            validation_errors=ex_errs,
            selected_pages=selected_page_nums,
            ref_image_count=len(refs),
        )

    return RecipeSynthesisResult(
        recipe=None,
        origin="degraded_docs_only",
        reason_codes=["INTERNAL_GEOMETRY_UNCONFIRMED"],
        validation_errors=[],
        selected_pages=selected_page_nums,
        ref_image_count=len(refs),
    )
