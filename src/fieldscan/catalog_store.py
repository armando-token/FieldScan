"""FieldScan Cloud Catalog Store, Ed25519 Manifest Verifier, Binary GLB Validator & Reference Fixture Builder.

Implements Sections 3, 4, and 5 of the iPad Air M4 Cloud Integration Megaplan (`Contract v2.1.0`):
- Pure-stdlib RFC 8032 Ed25519 signature verification & deterministic fixture signing (`key_id = "demo-1"`),
  100% bit-identical to Apple `CryptoKit.Curve25519.Signing.PublicKey`.
- Strict raw-bytes envelope verification, duplicate JSON key rejection, safe relative path normalization,
  executable/external-URI blocking, size/count budgets, and capability dependency checks (`M4-PKG-01..09`).
- Binary glTF 2.0 (`.glb`) parser & reference builder (`M4-3D-01..05`) validating self-contained buffers,
  unique `part_id`s, authoritative `node_name` existence, and meter-to-millimeter normalization.
- Transactional `FieldScanCatalog/` store (`staging/`, `packages/<manifest-sha256>/`, `catalog.sqlite3`)
  with anti-rollback `publication_seq` ordering, crash recovery, instruction revocations (`M4-REVOKE-01`),
  bounded `.zip` / directory import, and local read-only Byte-Range (`200`/`206`/`416`/`HEAD`) streaming.
"""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import re
import shutil
import sqlite3
import struct
import tempfile
import threading
from datetime import datetime, timezone
from typing import Any
import uuid
import zipfile

# ==============================================================================
# 1. RFC 8032 Pure-Python Ed25519 (Bit-Identical to Apple CryptoKit Curve25519)
# ==============================================================================

_ED_Q = 2**255 - 19
_ED_L = 2**252 + 27742317777372353535851937790883648493
_ED_D = (-121665 * pow(121666, _ED_Q - 2, _ED_Q)) % _ED_Q
_ED_I = pow(2, (_ED_Q - 1) // 4, _ED_Q)


def _ed_xrecover(y: int) -> int:
    xx = (y * y - 1) * pow(_ED_D * y * y + 1, _ED_Q - 2, _ED_Q) % _ED_Q
    x = pow(xx, (_ED_Q + 3) // 8, _ED_Q)
    if (x * x - xx) % _ED_Q != 0:
        x = (x * _ED_I) % _ED_Q
    if x % 2 != 0:
        x = _ED_Q - x
    return x


_BY = (4 * pow(5, _ED_Q - 2, _ED_Q)) % _ED_Q
_BX = _ed_xrecover(_BY)
_ED_B = (_BX % _ED_Q, _BY % _ED_Q, 1, (_BX * _BY) % _ED_Q)


def _ed_add(p1: tuple[int, int, int, int], p2: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    x1, y1, z1, t1 = p1
    x2, y2, z2, t2 = p2
    a = (y1 - x1) * (y2 - x2) % _ED_Q
    b = (y1 + x1) * (y2 + x2) % _ED_Q
    c = (t1 * 2 * _ED_D * t2) % _ED_Q
    dd = (z1 * 2 * z2) % _ED_Q
    e = (b - a) % _ED_Q
    f = (dd - c) % _ED_Q
    g = (dd + c) % _ED_Q
    h = (b + a) % _ED_Q
    return ((e * f) % _ED_Q, (g * h) % _ED_Q, (f * g) % _ED_Q, (e * h) % _ED_Q)


def _ed_scalarmult(pt: tuple[int, int, int, int], scalar: int) -> tuple[int, int, int, int]:
    res = (0, 1, 1, 0)
    cur = pt
    e = scalar
    while e > 0:
        if e & 1:
            res = _ed_add(res, cur)
        cur = _ed_add(cur, cur)
        e >>= 1
    return res


def _ed_encodepoint(pt: tuple[int, int, int, int]) -> bytes:
    x, y, z, _ = pt
    zi = pow(z, _ED_Q - 2, _ED_Q)
    x = (x * zi) % _ED_Q
    y = (y * zi) % _ED_Q
    out = bytearray(y.to_bytes(32, "little"))
    if x & 1:
        out[31] |= 0x80
    return bytes(out)


def _ed_decodepoint(raw: bytes) -> tuple[int, int, int, int]:
    if len(raw) != 32:
        raise ValueError("Invalid Ed25519 public key length")
    y = int.from_bytes(raw, "little") & ((1 << 255) - 1)
    x_sign = (raw[31] >> 7) & 1
    if y >= _ED_Q:
        raise ValueError("Ed25519 point y out of range")
    xx = (y * y - 1) * pow(_ED_D * y * y + 1, _ED_Q - 2, _ED_Q) % _ED_Q
    x = pow(xx, (_ED_Q + 3) // 8, _ED_Q)
    if (x * x - xx) % _ED_Q != 0:
        x = (x * _ED_I) % _ED_Q
    if (x * x - xx) % _ED_Q != 0:
        raise ValueError("Point is not on Ed25519 curve")
    if x == 0 and x_sign == 1:
        raise ValueError("Invalid Ed25519 x=0 sign bit")
    if (x & 1) != x_sign:
        x = _ED_Q - x
    return (x, y, 1, (x * y) % _ED_Q)


def ed25519_public_key_from_seed(seed32: bytes) -> bytes:
    if len(seed32) != 32:
        raise ValueError("Ed25519 seed must be 32 bytes")
    h = hashlib.sha512(seed32).digest()
    a = int.from_bytes(h[:32], "little")
    a &= (1 << 254) - 8
    a |= 1 << 254
    return _ed_encodepoint(_ed_scalarmult(_ED_B, a))


def ed25519_sign(seed32: bytes, message: bytes) -> bytes:
    h = hashlib.sha512(seed32).digest()
    a = int.from_bytes(h[:32], "little")
    a &= (1 << 254) - 8
    a |= 1 << 254
    prefix = h[32:]
    pub = _ed_encodepoint(_ed_scalarmult(_ED_B, a))
    r = int.from_bytes(hashlib.sha512(prefix + message).digest(), "little") % _ED_L
    r_bytes = _ed_encodepoint(_ed_scalarmult(_ED_B, r))
    k = int.from_bytes(hashlib.sha512(r_bytes + pub + message).digest(), "little") % _ED_L
    s = (r + k * a) % _ED_L
    return r_bytes + s.to_bytes(32, "little")


def ed25519_verify(public_key32: bytes, message: bytes, signature64: bytes) -> bool:
    if len(public_key32) != 32 or len(signature64) != 64:
        return False
    try:
        r_bytes = signature64[:32]
        s = int.from_bytes(signature64[32:], "little")
        if s >= _ED_L:
            return False
        r_pt = _ed_decodepoint(r_bytes)
        a_pt = _ed_decodepoint(public_key32)
        k = int.from_bytes(hashlib.sha512(r_bytes + public_key32 + message).digest(), "little") % _ED_L
        lhs = _ed_encodepoint(_ed_scalarmult(_ED_B, s))
        rhs = _ed_encodepoint(_ed_add(r_pt, _ed_scalarmult(a_pt, k)))
        return lhs == rhs
    except Exception:
        return False


# Labeled fixture signing seed (used ONLY in test/reference fixture generation; only public key is trusted at runtime)
DEMO_FIXTURE_SEED_32: bytes = hashlib.sha256(b"fieldscan-demo-fixture-key-v1-not-for-production").digest()
DEMO_FIXTURE_PUBLIC_KEY_32: bytes = ed25519_public_key_from_seed(DEMO_FIXTURE_SEED_32)
DEMO_FIXTURE_PUBLIC_KEY_HEX: str = DEMO_FIXTURE_PUBLIC_KEY_32.hex()
DEMO_FIXTURE_PUBLIC_KEY_B64: str = base64.b64encode(DEMO_FIXTURE_PUBLIC_KEY_32).decode("ascii")

DEFAULT_TRUSTED_PUBLIC_KEYS: dict[str, bytes] = {
    "demo-1": DEMO_FIXTURE_PUBLIC_KEY_32,
}

# ==============================================================================
# 2. Typed Catalog Domain Errors & Contract Limits
# ==============================================================================

MAX_ENVELOPE_BYTES = 512 * 1024
MAX_ARTIFACTS_PER_PACKAGE = 256
MAX_SINGLE_ARTIFACT_BYTES = 50 * 1024 * 1024
MAX_PACKAGE_TOTAL_BYTES = 120 * 1024 * 1024
CURRENT_APP_BUILD = 210

FORBIDDEN_EXECUTABLE_EXTS = {
    ".sh", ".bash", ".zsh", ".exe", ".dll", ".dylib", ".so", ".bin",
    ".py", ".pyc", ".js", ".mjs", ".html", ".htm", ".command", ".app",
}

ALLOWED_ARTIFACT_ROLES = {
    "manual_pdf",
    "manual_index",
    "document_index",
    "manual_page_image",
    "manual_markdown",
    "twin_glb",
    "twin_parts",
    "twin_actions",
    "procedures",
    "thumbnail",
}

ALLOWED_TWIN_ACTION_KINDS = {
    "show_view",
    "focus_part",
    "highlight_part",
    "simulate_state",
    "show_reference",
    "reset_view",
}

ROLE_MIME_TYPES: dict[str, str] = {
    "manual_pdf": "application/pdf",
    "manual_index": "application/json; charset=utf-8",
    "document_index": "application/json; charset=utf-8",
    "manual_page_image": "image/png",
    "manual_markdown": "text/markdown; charset=utf-8",
    "twin_glb": "model/gltf-binary",
    "twin_parts": "application/json; charset=utf-8",
    "twin_actions": "application/json; charset=utf-8",
    "procedures": "application/json; charset=utf-8",
    "thumbnail": "image/png",
}


class CatalogDomainError(Exception):
    """Typed protocol/store error strictly separated from UI presentation strings."""

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": False,
            "error_code": self.code,
            "message": self.message,
        }


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def sanitize_reference_text(raw: str) -> str:
    """Escape/strip HTML tags, scripts, and external URLs from manufacturer markdown/labels (`M4-DOC-03`)."""
    text = str(raw or "")
    text = re.sub(r"<\s*script[^>]*>[\s\S]*?<\s*/\s*script\s*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<\s*(?:iframe|object|embed|style|link|meta)[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"javascript\s*:", "", text, flags=re.IGNORECASE)
    return text.strip()


def _parse_json_strict_no_duplicate_keys(raw_bytes: bytes) -> Any:
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise CatalogDomainError("INVALID_ENVELOPE", "Payload is not valid UTF-8") from exc

    def _no_dups(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for k, v in pairs:
            if k in out:
                raise CatalogDomainError("DUPLICATE_JSON_KEYS", f"Duplicate JSON key '{k}' rejected")
            out[k] = v
        return out

    try:
        return json.loads(text, object_pairs_hook=_no_dups)
    except CatalogDomainError:
        raise
    except json.JSONDecodeError as exc:
        raise CatalogDomainError("INVALID_ENVELOPE", f"Malformed JSON: {exc.msg}") from exc


def normalize_safe_relative_path(raw_path: str) -> str:
    trimmed = (raw_path or "").strip()
    if not trimmed or trimmed.startswith("/") or "\\" in trimmed or ":" in trimmed:
        raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Unsafe artifact path '{raw_path}'")
    parts = [p for p in trimmed.split("/") if p]
    if not parts or any(p in (".", "..") for p in parts):
        raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Path traversal rejected in '{raw_path}'")
    norm = "/".join(parts)
    ext = Path(norm).suffix.lower()
    if ext in FORBIDDEN_EXECUTABLE_EXTS:
        raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Executable/script extension '{ext}' rejected")
    return norm


# ==============================================================================
# 3. Binary glTF 2.0 (`.glb`) Inspector & Self-Contained Reference Builder
# ==============================================================================


def inspect_glb_binary(glb_bytes: bytes) -> dict[str, Any]:
    """Validate glTF 2.0 binary header, reject external URIs, and extract node names & bounds (`M4-3D-01..04`)."""
    if len(glb_bytes) < 20:
        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "GLB file shorter than 20-byte header")
    magic, version, total_len = struct.unpack_from("<III", glb_bytes, 0)
    if magic != 0x46546C67 or version != 2:
        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "Invalid glTF 2.0 binary magic or version")
    if total_len != len(glb_bytes):
        raise CatalogDomainError("BLOB_TRUNCATED", f"GLB header length {total_len} != actual {len(glb_bytes)}")

    offset = 12
    json_chunk: dict[str, Any] | None = None
    has_bin_chunk = False
    while offset + 8 <= len(glb_bytes):
        chunk_len, chunk_type = struct.unpack_from("<II", glb_bytes, offset)
        offset += 8
        if offset + chunk_len > len(glb_bytes):
            raise CatalogDomainError("BLOB_TRUNCATED", "GLB chunk exceeds file bounds")
        chunk_data = glb_bytes[offset : offset + chunk_len]
        offset += chunk_len
        if chunk_type == 0x4E4F534A:  # JSON
            json_chunk = _parse_json_strict_no_duplicate_keys(chunk_data)
        elif chunk_type == 0x004E4942:  # BIN
            has_bin_chunk = True

    if not isinstance(json_chunk, dict):
        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "GLB missing JSON scene chunk")

    # Block external URIs in buffers and images (`Section 5.3`, `M4-3D-02`)
    for buf in json_chunk.get("buffers", []):
        uri = buf.get("uri")
        if uri and not str(uri).startswith("data:"):
            raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"External buffer URI '{uri}' forbidden in self-contained GLB")
    for img in json_chunk.get("images", []):
        uri = img.get("uri")
        if uri and not str(uri).startswith("data:"):
            raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"External image URI '{uri}' forbidden in self-contained GLB")

    # Reject unsupported compression extensions unless explicitly bundled
    req_ext = json_chunk.get("extensionsRequired") or []
    if req_ext:
        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Unsupported required glTF extensions: {req_ext}")

    nodes = json_chunk.get("nodes") or []
    node_names: list[str] = []
    seen_names: set[str] = set()
    for n in nodes:
        if isinstance(n, dict) and n.get("name"):
            nm = str(n["name"])
            if nm in seen_names:
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Duplicate GLB node name '{nm}'")
            seen_names.add(nm)
            node_names.append(nm)

    return {
        "valid": True,
        "has_bin_chunk": has_bin_chunk,
        "node_count": len(nodes),
        "node_names": node_names,
        "mesh_count": len(json_chunk.get("meshes") or []),
    }


def _make_box_geometry_bytes(hx: float, hy: float, hz: float) -> tuple[bytes, list[float], list[float], int, int]:
    """Build 8-vertex indexed box (positions + normals + uint16 indices) in glTF meters."""
    verts = [
        (-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
        (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz),
    ]
    norms = [
        (0.0, 0.0, -1.0), (0.0, 0.0, -1.0), (0.0, 0.0, -1.0), (0.0, 0.0, -1.0),
        (0.0, 0.0, 1.0), (0.0, 0.0, 1.0), (0.0, 0.0, 1.0), (0.0, 0.0, 1.0),
    ]
    indices = [
        0, 1, 2, 2, 3, 0,
        4, 6, 5, 6, 4, 7,
        0, 4, 5, 5, 1, 0,
        2, 6, 7, 7, 3, 2,
        0, 3, 7, 7, 4, 0,
        1, 5, 6, 6, 2, 1,
    ]
    pos_bin = b"".join(struct.pack("<fff", *v) for v in verts)
    nrm_bin = b"".join(struct.pack("<fff", *n) for n in norms)
    idx_bin = b"".join(struct.pack("<H", idx) for idx in indices)
    while len(idx_bin) % 4 != 0:
        idx_bin += b"\x00"
    return pos_bin + nrm_bin + idx_bin, [-hx, -hy, -hz], [hx, hy, hz], len(verts), len(indices)


def build_reference_sensor_glb(extra_duplicate_node: bool = False) -> bytes:
    """Create a valid self-contained glTF 2.0 binary (`twin.glb`) in meters (`0.140 m x 0.016 m`)."""
    # Unit box scaled per component node so every part is a real renderable 3D mesh in Three.js!
    bin_blob, vmin, vmax, vcount, icount = _make_box_geometry_bytes(0.5, 0.5, 0.5)
    pos_len = vcount * 12
    nrm_len = vcount * 12
    idx_len = icount * 2

    part_specs = [
        ("housing.cap", [0.016, 0.016, 0.028], [0.0, 0.0, 0.056], [0.78, 0.81, 0.85, 1.0]),
        ("probe.sht30", [0.008, 0.008, 0.020], [0.0, 0.0, 0.054], [0.12, 0.65, 0.58, 1.0]),
        ("seal.oring", [0.0164, 0.0164, 0.004], [0.0, 0.0, 0.040], [0.14, 0.16, 0.18, 1.0]),
        ("housing.barrel", [0.016, 0.016, 0.088], [0.0, 0.0, -0.006], [0.84, 0.86, 0.89, 1.0]),
        ("flange.mount", [0.042, 0.005, 0.020], [0.0, -0.007, 0.018], [0.68, 0.72, 0.78, 1.0]),
        ("dip.bank", [0.010, 0.004, 0.022], [0.0, 0.002, 0.014], [0.76, 0.16, 0.16, 1.0]),
        ("rear.connector", [0.013, 0.013, 0.020], [0.0, 0.0, -0.060], [0.22, 0.26, 0.32, 1.0]),
        ("rear.pin_1", [0.002, 0.002, 0.012], [0.003, 0.002, -0.068], [0.88, 0.18, 0.18, 1.0]),
    ]
    for pin_idx in range(1, 9):
        z_off = 0.022 - (pin_idx - 1) * 0.0022
        part_specs.append(
            (f"dip.pin_{pin_idx}", [0.0022, 0.0018, 0.0016], [0.0, 0.0045, round(z_off, 5)], [0.96, 0.82, 0.24, 1.0])
        )

    materials = []
    meshes = []
    child_nodes = []
    for idx, (name, scale, trans, rgba) in enumerate(part_specs):
        materials.append(
            {
                "name": f"mat_{name}",
                "pbrMetallicRoughness": {
                    "baseColorFactor": rgba,
                    "metallicFactor": 0.2,
                    "roughnessFactor": 0.45,
                },
            }
        )
        meshes.append(
            {
                "name": f"mesh_{name}",
                "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "material": idx}],
            }
        )
        child_nodes.append(
            {
                "name": name,
                "mesh": idx,
                "translation": trans,
                "scale": scale,
            }
        )

    if extra_duplicate_node:
        child_nodes.append({"name": "dip.bank", "mesh": 0})

    root_idx = len(child_nodes)
    all_nodes = [*child_nodes, {"name": "sensor.root", "children": list(range(len(child_nodes)))}]

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "FieldScan Cloud Reference Builder v2.1"},
        "scene": 0,
        "scenes": [{"name": "FieldScanTwinScene", "nodes": [root_idx]}],
        "nodes": all_nodes,
        "meshes": meshes,
        "materials": materials,
        "buffers": [{"byteLength": len(bin_blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": pos_len, "target": 34962},
            {"buffer": 0, "byteOffset": pos_len, "byteLength": nrm_len, "target": 34962},
            {"buffer": 0, "byteOffset": pos_len + nrm_len, "byteLength": idx_len, "target": 34963},
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": vcount,
                "type": "VEC3",
                "min": vmin,
                "max": vmax,
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": vcount,
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5123,
                "count": icount,
                "type": "SCALAR",
            },
        ],
    }

    json_bytes = json.dumps(gltf_dict, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "
    while len(bin_blob) % 4 != 0:
        bin_blob += b"\x00"

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    header = struct.pack("<III", 0x46546C67, 2, total_len)
    json_hdr = struct.pack("<II", len(json_bytes), 0x4E4F534A)
    bin_hdr = struct.pack("<II", len(bin_blob), 0x004E4942)
    return header + json_hdr + json_bytes + bin_hdr + bin_blob


# ==============================================================================
# 4. Signed Manifest Envelope Verifier & Semantic Validator
# ==============================================================================


def create_signed_manifest_envelope(
    manifest_payload: dict[str, Any],
    *,
    key_id: str = "demo-1",
    seed32: bytes = DEMO_FIXTURE_SEED_32,
) -> dict[str, str]:
    """Serialize `manifest_payload` deterministically and sign raw UTF-8 bytes with Ed25519."""
    payload_copy = dict(manifest_payload)
    payload_copy["key_id"] = key_id
    raw_payload = json.dumps(payload_copy, indent=2, sort_keys=True).encode("utf-8")
    sig = ed25519_sign(seed32, raw_payload)
    return {
        "key_id": key_id,
        "payload_b64": base64.b64encode(raw_payload).decode("ascii"),
        "signature_b64": base64.b64encode(sig).decode("ascii"),
    }


def verify_and_decode_manifest_envelope(
    envelope_bytes: bytes,
    *,
    trusted_keys: dict[str, bytes] | None = None,
    current_app_build: int = CURRENT_APP_BUILD,
) -> tuple[dict[str, Any], str, bytes]:
    """Verify Ed25519 signature over raw `payload_b64` bytes before decoding manifest JSON (`Section 3.3`)."""
    if len(envelope_bytes) > MAX_ENVELOPE_BYTES:
        raise CatalogDomainError("SIZE_BUDGET_EXCEEDED", "Manifest envelope exceeds 512 KB limit")

    env = _parse_json_strict_no_duplicate_keys(envelope_bytes)
    if not isinstance(env, dict):
        raise CatalogDomainError("INVALID_ENVELOPE", "Envelope root must be a JSON object")

    key_id = env.get("key_id")
    payload_b64 = env.get("payload_b64")
    sig_b64 = env.get("signature_b64")
    if not isinstance(key_id, str) or not key_id.strip():
        raise CatalogDomainError("INVALID_ENVELOPE", "Missing envelope key_id")
    if not isinstance(payload_b64, str) or not isinstance(sig_b64, str):
        raise CatalogDomainError("INVALID_ENVELOPE", "Missing payload_b64 or signature_b64")

    keyring = trusted_keys if trusted_keys is not None else DEFAULT_TRUSTED_PUBLIC_KEYS
    pub_key = keyring.get(key_id)
    if pub_key is None:
        raise CatalogDomainError("UNTRUSTED_KEY_ID", f"Untrusted signing key_id '{key_id}'")

    try:
        raw_payload = base64.b64decode(payload_b64, validate=True)
        raw_sig = base64.b64decode(sig_b64, validate=True)
    except Exception as exc:
        raise CatalogDomainError("INVALID_ENVELOPE", "Invalid strict Base64 in envelope") from exc

    if not ed25519_verify(pub_key, raw_payload, raw_sig):
        raise CatalogDomainError("INVALID_SIGNATURE", "Ed25519 signature verification failed on raw payload bytes")

    payload = _parse_json_strict_no_duplicate_keys(raw_payload)
    if not isinstance(payload, dict):
        raise CatalogDomainError("INVALID_ENVELOPE", "Signed payload must be a JSON object")

    if payload.get("key_id") != key_id:
        raise CatalogDomainError("KEY_ID_MISMATCH", "Envelope key_id does not match signed payload key_id")

    if payload.get("schema_version") != 1 or payload.get("interaction_version") != 1:
        raise CatalogDomainError("UNSUPPORTED_SCHEMA_VERSION", "Unsupported manifest schema_version or interaction_version")

    min_build = payload.get("minimum_app_build", 1)
    if not isinstance(min_build, int) or min_build > current_app_build:
        raise CatalogDomainError("INCOMPATIBLE_APP_BUILD", f"Package requires minimum_app_build {min_build} (> {current_app_build})")

    for req_str in ("issuer", "product_id", "variant_id"):
        val = payload.get(req_str)
        if not isinstance(val, str) or not val.strip():
            raise CatalogDomainError("INVALID_ENVELOPE", f"Missing required string field '{req_str}'")

    pub_seq = payload.get("publication_seq")
    if not isinstance(pub_seq, int) or pub_seq < 1:
        raise CatalogDomainError("INVALID_ENVELOPE", "publication_seq must be a positive integer")

    artifacts = payload.get("artifacts")
    if not isinstance(artifacts, list) or len(artifacts) == 0:
        raise CatalogDomainError("INVALID_ENVELOPE", "Manifest must declare at least one artifact")
    if len(artifacts) > MAX_ARTIFACTS_PER_PACKAGE:
        raise CatalogDomainError("ARTIFACT_COUNT_EXCEEDED", f"Artifact count {len(artifacts)} exceeds limit {MAX_ARTIFACTS_PER_PACKAGE}")

    seen_paths: set[str] = set()
    total_bytes = 0
    roles_present: set[str] = set()
    for art in artifacts:
        if not isinstance(art, dict):
            raise CatalogDomainError("INVALID_ENVELOPE", "Artifact entry must be an object")
        role = str(art.get("role") or "")
        if role not in ALLOWED_ARTIFACT_ROLES:
            raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Unsupported artifact role '{role}'")
        norm_path = normalize_safe_relative_path(str(art.get("path") or ""))
        if norm_path in seen_paths:
            raise CatalogDomainError("DUPLICATE_ARTIFACT_PATH", f"Duplicate normalized path '{norm_path}'")
        seen_paths.add(norm_path)
        art["path"] = norm_path

        sha = str(art.get("sha256") or "").lower()
        if not re.fullmatch(r"[0-9a-f]{64}", sha):
            raise CatalogDomainError("INVALID_ENVELOPE", f"Invalid SHA-256 digest for '{norm_path}'")
        art["sha256"] = sha

        bcount = art.get("byte_count")
        if not isinstance(bcount, int) or bcount <= 0 or bcount > MAX_SINGLE_ARTIFACT_BYTES:
            raise CatalogDomainError("SIZE_BUDGET_EXCEEDED", f"Invalid or oversized byte_count {bcount} on '{norm_path}'")
        total_bytes += bcount
        roles_present.add(role)

    if total_bytes > MAX_PACKAGE_TOTAL_BYTES:
        raise CatalogDomainError("SIZE_BUDGET_EXCEEDED", f"Package total size {total_bytes} exceeds budget {MAX_PACKAGE_TOTAL_BYTES}")

    caps = payload.get("capabilities")
    if not isinstance(caps, dict):
        raise CatalogDomainError("INVALID_ENVELOPE", "Missing capabilities object")

    has_doc_index_and_md = (
        ("manual_index" in roles_present or "document_index" in roles_present)
        and "manual_markdown" in roles_present
    )
    if caps.get("documentation") is True and "manual_pdf" not in roles_present and not has_doc_index_and_md:
        raise CatalogDomainError(
            "MISSING_CAPABILITY_DEPENDENCY",
            "documentation=true requires manual_pdf or document_index + manual_markdown artifacts",
        )
    if caps.get("interactive_twin") is True:
        for req_role in ("twin_glb", "twin_parts", "twin_actions"):
            if req_role not in roles_present:
                raise CatalogDomainError("MISSING_CAPABILITY_DEPENDENCY", f"interactive_twin=true requires '{req_role}'")
    if caps.get("procedures") is True and "procedures" not in roles_present and "twin_actions" not in roles_present:
        raise CatalogDomainError(
            "MISSING_CAPABILITY_DEPENDENCY",
            "procedures=true requires 'procedures' or 'twin_actions' artifact",
        )

    manifest_sha256 = sha256_bytes(raw_payload)
    return payload, manifest_sha256, raw_payload


# ==============================================================================
# 5. Transactional FieldScanPackageStore (`Application Support/FieldScanCatalog/`)
# ==============================================================================


class FieldScanPackageStore:
    """Manages immutable installed Cloud Catalog packages, crash recovery, revocations & blob streaming."""

    def __init__(
        self,
        catalog_root: Path,
        *,
        bundle_root: Path | None = None,
        trusted_keys: dict[str, bytes] | None = None,
        min_free_bytes: int = 4 * 1024 * 1024,
    ) -> None:
        self.catalog_root = Path(catalog_root)
        self.staging_dir = self.catalog_root / "staging"
        self.packages_dir = self.catalog_root / "packages"
        self.db_path = self.catalog_root / "catalog.sqlite3"
        self.bundle_root = Path(bundle_root) if bundle_root else Path(__file__).resolve().parents[2]
        self.trusted_keys = dict(trusted_keys or DEFAULT_TRUSTED_PUBLIC_KEYS)
        self.min_free_bytes = min_free_bytes
        self._lock = threading.RLock()
        self._active_selection: dict[str, Any] | None = None

        self.staging_dir.mkdir(parents=True, exist_ok=True)
        self.packages_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self.recover_on_boot()

    def register_trusted_signer(self, key_id: str, public_key_b64: str) -> dict[str, Any]:
        """Register an authorized Ed25519 signing public key (raw 32-byte Base64) for production/cloud verification."""
        clean_id = (key_id or "").strip()
        if not clean_id:
            raise CatalogDomainError("UNTRUSTED_KEY_ID", "Signer key_id cannot be empty")
        try:
            raw = base64.b64decode((public_key_b64 or "").strip(), validate=True)
        except Exception as exc:
            raise CatalogDomainError("UNTRUSTED_KEY_ID", "Invalid Base64 Ed25519 public key") from exc
        if len(raw) != 32:
            raise CatalogDomainError("UNTRUSTED_KEY_ID", f"Ed25519 public key must be 32 bytes (got {len(raw)})")
        try:
            _ed_decodepoint(raw)
        except Exception as exc:
            raise CatalogDomainError("UNTRUSTED_KEY_ID", f"Invalid Ed25519 curve point for '{clean_id}'") from exc
        with self._lock:
            self.trusted_keys[clean_id] = raw
            return {"key_id": clean_id, "trusted_key_ids": sorted(self.trusted_keys.keys())}

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._lock, self._connect() as conn:
            conn.executescript(
                """
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS installations (
                    manifest_sha256 TEXT PRIMARY KEY,
                    issuer TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    product_id TEXT NOT NULL,
                    variant_id TEXT NOT NULL,
                    publication_seq INTEGER NOT NULL,
                    state TEXT NOT NULL,
                    installed_at_utc TEXT NOT NULL,
                    source_origin TEXT NOT NULL,
                    envelope_json TEXT NOT NULL,
                    manifest_json TEXT NOT NULL,
                    capabilities_json TEXT NOT NULL,
                    revocations_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS active_variants (
                    issuer TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    product_id TEXT NOT NULL,
                    variant_id TEXT NOT NULL,
                    manifest_sha256 TEXT NOT NULL,
                    publication_seq INTEGER NOT NULL,
                    updated_at_utc TEXT NOT NULL,
                    PRIMARY KEY (issuer, channel, product_id, variant_id)
                );
                CREATE TABLE IF NOT EXISTS revoked_instructions (
                    instruction_id TEXT PRIMARY KEY,
                    product_id TEXT NOT NULL,
                    variant_id TEXT NOT NULL,
                    revoked_by_manifest_sha256 TEXT NOT NULL,
                    publication_seq INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    recorded_at_utc TEXT NOT NULL
                );
                """
            )

    def recover_on_boot(self) -> dict[str, Any]:
        """Clean orphan staging directories and ensure active pointers strictly reference intact on-disk packages (`M4-PKG-04`)."""
        with self._lock:
            cleaned_staging = 0
            for child in self.staging_dir.iterdir():
                shutil.rmtree(child, ignore_errors=True)
                cleaned_staging += 1

            quarantined: list[str] = []
            with self._connect() as conn:
                rows = conn.execute("SELECT manifest_sha256, manifest_json FROM installations WHERE state = 'verified'").fetchall()
                verified_shas: set[str] = set()
                for r in rows:
                    msha = str(r["manifest_sha256"])
                    pkg_dir = self.packages_dir / msha
                    manifest = json.loads(str(r["manifest_json"]))
                    intact = pkg_dir.is_dir() and all(
                        (pkg_dir / art["path"]).is_file() for art in manifest.get("artifacts", [])
                    )
                    if intact:
                        verified_shas.add(msha)
                    else:
                        conn.execute("UPDATE installations SET state = 'failed' WHERE manifest_sha256 = ?", (msha,))
                        quarantined.append(msha)

                # Repair active_variants if any pointer lost its backing folder
                act_rows = conn.execute("SELECT issuer, channel, product_id, variant_id, manifest_sha256 FROM active_variants").fetchall()
                for ar in act_rows:
                    if str(ar["manifest_sha256"]) not in verified_shas:
                        fallback = conn.execute(
                            """
                            SELECT manifest_sha256, publication_seq FROM installations
                            WHERE issuer=? AND channel=? AND product_id=? AND variant_id=? AND state='verified'
                            ORDER BY publication_seq DESC LIMIT 1
                            """,
                            (ar["issuer"], ar["channel"], ar["product_id"], ar["variant_id"]),
                        ).fetchone()
                        if fallback and str(fallback["manifest_sha256"]) in verified_shas:
                            conn.execute(
                                """
                                UPDATE active_variants SET manifest_sha256=?, publication_seq=?, updated_at_utc=?
                                WHERE issuer=? AND channel=? AND product_id=? AND variant_id=?
                                """,
                                (
                                    fallback["manifest_sha256"],
                                    fallback["publication_seq"],
                                    utc_now_iso(),
                                    ar["issuer"],
                                    ar["channel"],
                                    ar["product_id"],
                                    ar["variant_id"],
                                ),
                            )
                        else:
                            conn.execute(
                                "DELETE FROM active_variants WHERE issuer=? AND channel=? AND product_id=? AND variant_id=?",
                                (ar["issuer"], ar["channel"], ar["product_id"], ar["variant_id"]),
                            )

                # Remove any unreferenced partial package folders left by a crash before SQLite commit
                for pdir in self.packages_dir.iterdir():
                    if pdir.name not in verified_shas:
                        shutil.rmtree(pdir, ignore_errors=True)
                        quarantined.append(pdir.name)

            return {"cleaned_staging": cleaned_staging, "quarantined": quarantined}

    def _check_disk_space(self, required_bytes: int) -> None:
        usage = shutil.disk_usage(self.catalog_root)
        if usage.free < (required_bytes + self.min_free_bytes):
            raise CatalogDomainError(
                "DISK_FULL",
                f"Insufficient storage space ({usage.free} bytes available, {required_bytes + self.min_free_bytes} required).",
                status_code=507,
            )

    def _validate_package_semantics(self, stage_pkg_dir: Path, manifest: dict[str, Any]) -> dict[str, Any]:
        """Validate cross-references between PDFs, `manual_index`, `twin.glb`, `twin.parts.json`, `twin.actions.json`, and `procedures.json`."""
        artifacts_by_role: dict[str, list[dict[str, Any]]] = {}
        artifacts_by_doc_id: dict[str, dict[str, Any]] = {}
        for art in manifest["artifacts"]:
            artifacts_by_role.setdefault(art["role"], []).append(art)
            if art.get("document_id"):
                artifacts_by_doc_id[str(art["document_id"])] = art

        doc_page_counts: dict[str, int] = {}
        if "manual_pdf" in artifacts_by_role:
            import pymupdf

            for pdf_art in artifacts_by_role["manual_pdf"]:
                pdf_path = stage_pkg_dir / pdf_art["path"]
                try:
                    with pymupdf.open(pdf_path) as doc:
                        pcount = len(doc)
                except Exception as exc:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Unreadable PDF '{pdf_art['path']}'") from exc
                if pcount < 1:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Empty PDF '{pdf_art['path']}'")
                doc_id = str(pdf_art.get("document_id") or Path(pdf_art["path"]).stem)
                doc_page_counts[doc_id] = pcount

        idx_role_arts = artifacts_by_role.get("manual_index") or artifacts_by_role.get("document_index") or []
        if idx_role_arts:
            idx_path = stage_pkg_dir / idx_role_arts[0]["path"]
            idx_obj = _parse_json_strict_no_duplicate_keys(idx_path.read_bytes())
            if not isinstance(idx_obj, dict):
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "manual_index must be a JSON object")
            doc_entries = (
                idx_obj["documents"]
                if isinstance(idx_obj.get("documents"), list)
                else ([idx_obj] if idx_obj.get("document_id") else [])
            )
            has_manual_pdfs = "manual_pdf" in artifacts_by_role
            for doc_entry in doc_entries:
                did = str(doc_entry.get("document_id") or "")
                if not did:
                    continue
                if has_manual_pdfs:
                    if did not in doc_page_counts:
                        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"manual_index references unknown document_id '{did}'")
                else:
                    # PR #4 reference_only OEM packages strip manual_pdf and derive verified page counts from document_index
                    pc = int(doc_entry.get("page_count") or len(doc_entry.get("pages") or []))
                    if pc < 1:
                        raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"document_index '{did}' has invalid page_count")
                    doc_page_counts[did] = pc

        glb_meta: dict[str, Any] | None = None
        valid_part_ids: set[str] = set()
        valid_view_ids: set[str] = set()

        if manifest["capabilities"].get("interactive_twin") is True:
            glb_path = stage_pkg_dir / artifacts_by_role["twin_glb"][0]["path"]
            parts_path = stage_pkg_dir / artifacts_by_role["twin_parts"][0]["path"]
            actions_path = stage_pkg_dir / artifacts_by_role["twin_actions"][0]["path"]

            glb_meta = inspect_glb_binary(glb_path.read_bytes())
            glb_nodes = set(glb_meta["node_names"])

            parts_obj = _parse_json_strict_no_duplicate_keys(parts_path.read_bytes())
            if not isinstance(parts_obj, dict):
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "twin.parts.json must be an object")

            raw_units = str(parts_obj.get("units") or parts_obj.get("unit") or "meters").strip().lower()
            if raw_units not in ("m", "meter", "meters", "mm", "millimeter", "millimeters"):
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Unsupported twin units '{raw_units}'")

            parts_list = parts_obj.get("parts")
            if not isinstance(parts_list, list) or not parts_list:
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "twin.parts.json must declare non-empty parts[]")

            for p in parts_list:
                pid = str(p.get("part_id") or "").strip()
                nname = str(p.get("node_name") or p.get("node_id") or "").strip()
                if not pid or not nname:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "Every part requires part_id and node_name/node_id")
                if pid in valid_part_ids:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Duplicate part_id '{pid}' in twin.parts.json")
                if nname not in glb_nodes:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Part '{pid}' references missing GLB node '{nname}'")
                valid_part_ids.add(pid)

            for v in parts_obj.get("views", []):
                vid = str(v.get("view_id") or "").strip()
                if vid:
                    valid_view_ids.add(vid)

            actions_obj = _parse_json_strict_no_duplicate_keys(actions_path.read_bytes())
            if not isinstance(actions_obj, dict) or not isinstance(actions_obj.get("actions"), list):
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "twin.actions.json must declare actions[]")

            for act in actions_obj["actions"]:
                kind = str(act.get("kind") or "")
                if kind not in ALLOWED_TWIN_ACTION_KINDS:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Unsupported twin action kind '{kind}'")
                pid = act.get("part_id")
                if pid is not None and str(pid) not in valid_part_ids:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Action references unknown part_id '{pid}'")
                vid = act.get("view_id")
                if vid is not None and valid_view_ids and str(vid) not in valid_view_ids:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Action references unknown view_id '{vid}'")
                cit = act.get("citation_id")
                if cit:
                    self._validate_citation_id_format(str(cit), doc_page_counts)

        if manifest["capabilities"].get("procedures") is True and "procedures" in artifacts_by_role:
            proc_path = stage_pkg_dir / artifacts_by_role["procedures"][0]["path"]
            proc_obj = _parse_json_strict_no_duplicate_keys(proc_path.read_bytes())
            if not isinstance(proc_obj, dict) or not isinstance(proc_obj.get("steps"), list):
                raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", "procedures.json must declare steps[]")
            for st in proc_obj["steps"]:
                if st.get("citation_id"):
                    self._validate_citation_id_format(str(st["citation_id"]), doc_page_counts)
                if st.get("part_id") and valid_part_ids and str(st["part_id"]) not in valid_part_ids:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Procedure step references unknown part_id '{st['part_id']}'")

        return {
            "doc_page_counts": doc_page_counts,
            "glb_meta": glb_meta,
            "part_count": len(valid_part_ids),
        }

    @staticmethod
    def _validate_citation_id_format(cit_id: str, doc_page_counts: dict[str, int]) -> None:
        # Format: "<document_id>:p<page_num>[:<section_id>]"
        parts = cit_id.split(":")
        if len(parts) < 2 or not parts[1].startswith("p") or not parts[1][1:].isdigit():
            raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Malformed citation_id '{cit_id}'")
        doc_id = parts[0]
        pnum = int(parts[1][1:])
        if doc_id not in doc_page_counts:
            raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Citation '{cit_id}' references missing document '{doc_id}'")
        if pnum < 1 or pnum > doc_page_counts[doc_id]:
            raise CatalogDomainError(
                "SEMANTIC_REFERENCE_BROKEN",
                f"Citation '{cit_id}' page {pnum} out of range 1..{doc_page_counts[doc_id]}",
            )

    def install_verified_package(
        self,
        envelope_bytes: bytes,
        blobs_by_sha256: dict[str, bytes | Path],
        *,
        channel: str = "default",
        source_origin: str = "file_import",
        simulate_crash_before_db_commit: bool = False,
    ) -> dict[str, Any]:
        """Execute full 7-step transactional verification & installation (`Section 4.2`, `M4-PKG-01..09`)."""
        manifest, manifest_sha, _ = verify_and_decode_manifest_envelope(
            envelope_bytes,
            trusted_keys=self.trusted_keys,
        )

        total_bytes = sum(int(a["byte_count"]) for a in manifest["artifacts"])
        self._check_disk_space(total_bytes)

        issuer = str(manifest["issuer"])
        product_id = str(manifest["product_id"])
        variant_id = str(manifest["variant_id"])
        pub_seq = int(manifest["publication_seq"])

        with self._lock:
            # Anti-rollback check BEFORE staging/moving (`M4-PKG-06`)
            with self._connect() as conn:
                cur_act = conn.execute(
                    "SELECT publication_seq, manifest_sha256 FROM active_variants WHERE issuer=? AND channel=? AND product_id=? AND variant_id=?",
                    (issuer, channel, product_id, variant_id),
                ).fetchone()
                if cur_act is not None:
                    cur_seq = int(cur_act["publication_seq"])
                    if str(cur_act["manifest_sha256"]) == manifest_sha:
                        return self.get_installed_package(manifest_sha)  # Idempotent coalesce (`M4-PKG-05`)
                    if pub_seq <= cur_seq:
                        raise CatalogDomainError(
                            "ROLLBACK_BLOCKED",
                            f"Rejected older/equal publication_seq {pub_seq} (active is {cur_seq} for {product_id}/{variant_id}).",
                            status_code=409,
                        )

            install_id = f"inst-{uuid.uuid4().hex[:12]}"
            stage_dir = self.staging_dir / install_id
            stage_dir.mkdir(parents=True, exist_ok=True)
            try:
                # Reject unexpected extra blobs if caller passed unmatched artifacts (`M4-PKG-03`)
                expected_shas = {a["sha256"] for a in manifest["artifacts"]}
                unexpected = set(blobs_by_sha256.keys()) - expected_shas
                if unexpected:
                    raise CatalogDomainError("SEMANTIC_REFERENCE_BROKEN", f"Unexpected undeclared blob(s): {sorted(unexpected)[:2]}")

                for art in manifest["artifacts"]:
                    exp_sha = art["sha256"]
                    exp_len = int(art["byte_count"])
                    src_blob = blobs_by_sha256.get(exp_sha)
                    if src_blob is None:
                        raise CatalogDomainError("BLOB_TRUNCATED", f"Missing required blob for '{art['path']}' ({exp_sha[:12]}...)")

                    dest_file = stage_dir / art["path"]
                    dest_file.parent.mkdir(parents=True, exist_ok=True)
                    if isinstance(src_blob, Path):
                        shutil.copyfile(src_blob, dest_file)
                    else:
                        dest_file.write_bytes(src_blob)

                    actual_len = dest_file.stat().st_size
                    if actual_len != exp_len:
                        raise CatalogDomainError(
                            "BLOB_TRUNCATED",
                            f"Artifact '{art['path']}' byte_count mismatch ({actual_len} != {exp_len})",
                        )
                    actual_sha = sha256_file(dest_file)
                    if actual_sha != exp_sha:
                        raise CatalogDomainError(
                            "BLOB_HASH_MISMATCH",
                            f"Artifact '{art['path']}' SHA-256 mismatch",
                        )

                (stage_dir / "manifest.envelope.json").write_bytes(envelope_bytes)
                semantics = self._validate_package_semantics(stage_dir, manifest)

                final_dir = self.packages_dir / manifest_sha
                if final_dir.exists():
                    shutil.rmtree(final_dir)
                shutil.move(str(stage_dir), str(final_dir))

                if simulate_crash_before_db_commit:
                    raise RuntimeError("SIMULATED_CRASH_AFTER_MOVE_BEFORE_DB_COMMIT")

                now_utc = utc_now_iso()
                revocations = list(manifest.get("revoked_instructions") or [])
                for wp_id in manifest.get("withdrawn_procedures") or []:
                    if str(wp_id).strip():
                        revocations.append({"instruction_id": str(wp_id).strip(), "reason": "Withdrawn by catalog publication"})
                with self._connect() as conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO installations (
                            manifest_sha256, issuer, channel, product_id, variant_id, publication_seq,
                            state, installed_at_utc, source_origin, envelope_json, manifest_json,
                            capabilities_json, revocations_json
                        ) VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            manifest_sha,
                            issuer,
                            channel,
                            product_id,
                            variant_id,
                            pub_seq,
                            now_utc,
                            source_origin,
                            envelope_bytes.decode("utf-8"),
                            json.dumps(manifest),
                            json.dumps(manifest["capabilities"]),
                            json.dumps(revocations),
                        ),
                    )
                    conn.execute(
                        """
                        INSERT INTO active_variants (issuer, channel, product_id, variant_id, manifest_sha256, publication_seq, updated_at_utc)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(issuer, channel, product_id, variant_id) DO UPDATE SET
                            manifest_sha256=excluded.manifest_sha256,
                            publication_seq=excluded.publication_seq,
                            updated_at_utc=excluded.updated_at_utc
                        """,
                        (issuer, channel, product_id, variant_id, manifest_sha, pub_seq, now_utc),
                    )
                    for rev in revocations:
                        if isinstance(rev, dict) and rev.get("instruction_id"):
                            conn.execute(
                                """
                                INSERT OR REPLACE INTO revoked_instructions (
                                    instruction_id, product_id, variant_id, revoked_by_manifest_sha256,
                                    publication_seq, reason, recorded_at_utc
                                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    str(rev["instruction_id"]),
                                    product_id,
                                    variant_id,
                                    manifest_sha,
                                    pub_seq,
                                    str(rev.get("reason") or "Revoked by manufacturer bulletin"),
                                    now_utc,
                                ),
                            )
            except CatalogDomainError:
                shutil.rmtree(stage_dir, ignore_errors=True)
                raise
            except Exception:
                shutil.rmtree(stage_dir, ignore_errors=True)
                raise

            installed = self.get_installed_package(manifest_sha)
            installed["semantics"] = semantics
            return installed

    def import_package_from_path(self, source_path: Path, *, channel: str = "default") -> dict[str, Any]:
        """Import a signed package from a local directory or bounded `.zip`/`.fspkg` archive (`Section 4.3`, `M4-PKG-01`, `M4-PKG-09`)."""
        p = Path(source_path)
        if not p.exists():
            raise CatalogDomainError("INVALID_ENVELOPE", f"Import path does not exist: {p}")

        if p.is_dir():
            env_file = p / "manifest.envelope.json"
            if not env_file.is_file():
                raise CatalogDomainError("INVALID_ENVELOPE", "Directory missing manifest.envelope.json")
            env_bytes = env_file.read_bytes()
            manifest, _, _ = verify_and_decode_manifest_envelope(env_bytes, trusted_keys=self.trusted_keys)
            blobs: dict[str, bytes | Path] = {}
            for art in manifest["artifacts"]:
                cand = (p / art["path"]).resolve()
                if not str(cand).startswith(str(p.resolve())):
                    raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Path escapes import directory: {art['path']}")
                if not cand.is_file() or cand.is_symlink():
                    raise CatalogDomainError("BLOB_TRUNCATED", f"Missing or non-regular artifact file: {art['path']}")
                blobs[art["sha256"]] = cand
            return self.install_verified_package(env_bytes, blobs, channel=channel, source_origin="directory_import")

        # Bounded ZIP archive reader (`M4-PKG-09`)
        if not zipfile.is_zipfile(p):
            raise CatalogDomainError("INVALID_ENVELOPE", "Import file is neither a package directory nor a valid ZIP archive")

        with tempfile.TemporaryDirectory(dir=str(self.staging_dir), prefix="zipimp-") as tmp_extract:
            tmp_root = Path(tmp_extract)
            with zipfile.ZipFile(p, "r") as zf:
                infos = zf.infolist()
                if len(infos) > (MAX_ARTIFACTS_PER_PACKAGE + 8):
                    raise CatalogDomainError("ARCHIVE_LIMIT_EXCEEDED", f"ZIP entry count {len(infos)} exceeds limit")
                total_uncomp = 0
                for info in infos:
                    if info.is_dir():
                        continue
                    norm_member = normalize_safe_relative_path(info.filename)
                    # Reject UNIX symlinks encoded in external_attr
                    if ((info.external_attr >> 16) & 0o170000) == 0o120000:
                        raise CatalogDomainError("EXECUTABLE_OR_UNSAFE_PATH", f"Symlink rejected in archive: {info.filename}")
                    if info.file_size > MAX_SINGLE_ARTIFACT_BYTES:
                        raise CatalogDomainError("ARCHIVE_LIMIT_EXCEEDED", f"ZIP member '{norm_member}' exceeds 50 MB limit")
                    total_uncomp += info.file_size
                    if total_uncomp > MAX_PACKAGE_TOTAL_BYTES:
                        raise CatalogDomainError("ARCHIVE_LIMIT_EXCEEDED", "ZIP uncompressed total exceeds 120 MB budget")

                    target = tmp_root / norm_member
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with zf.open(info, "r") as src_f, target.open("wb") as dst_f:
                        written = 0
                        while True:
                            chunk = src_f.read(65536)
                            if not chunk:
                                break
                            written += len(chunk)
                            if written > MAX_SINGLE_ARTIFACT_BYTES:
                                raise CatalogDomainError("ARCHIVE_LIMIT_EXCEEDED", "Actual stream exceeded declared size")
                            dst_f.write(chunk)

            env_file = tmp_root / "manifest.envelope.json"
            if not env_file.is_file():
                raise CatalogDomainError("INVALID_ENVELOPE", "Archive missing manifest.envelope.json")
            env_bytes = env_file.read_bytes()
            manifest, _, _ = verify_and_decode_manifest_envelope(env_bytes, trusted_keys=self.trusted_keys)
            blobs = {}
            for art in manifest["artifacts"]:
                f_art = tmp_root / art["path"]
                if not f_art.is_file():
                    raise CatalogDomainError("BLOB_TRUNCATED", f"Archive missing declared artifact '{art['path']}'")
                blobs[art["sha256"]] = f_art
            return self.install_verified_package(env_bytes, blobs, channel=channel, source_origin="archive_import")

    def list_installed_packages(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            active_map = {
                (r["issuer"], r["channel"], r["product_id"], r["variant_id"]): r["manifest_sha256"]
                for r in conn.execute("SELECT issuer, channel, product_id, variant_id, manifest_sha256 FROM active_variants").fetchall()
            }
            rows = conn.execute(
                "SELECT * FROM installations WHERE state='verified' ORDER BY publication_seq DESC, installed_at_utc DESC"
            ).fetchall()
            out: list[dict[str, Any]] = []
            for r in rows:
                manifest = json.loads(str(r["manifest_json"]))
                key = (r["issuer"], r["channel"], r["product_id"], r["variant_id"])
                out.append(
                    {
                        "manifest_sha256": str(r["manifest_sha256"]),
                        "issuer": str(r["issuer"]),
                        "channel": str(r["channel"]),
                        "product_id": str(r["product_id"]),
                        "variant_id": str(r["variant_id"]),
                        "title": manifest.get("title") or f"{r['product_id']} ({r['variant_id']})",
                        "manufacturer": manifest.get("manufacturer") or manifest.get("issuer") or "UNKNOWN",
                        "model": manifest.get("model", str(r["product_id"])),
                        "connector_type": manifest.get("connector_type"),
                        "publication_seq": int(r["publication_seq"]),
                        "installed_at_utc": str(r["installed_at_utc"]),
                        "source_origin": str(r["source_origin"]),
                        "is_active_for_variant": active_map.get(key) == str(r["manifest_sha256"]),
                        "capabilities": json.loads(str(r["capabilities_json"])),
                        "reason_codes": manifest.get("reason_codes", []),
                        "bench_profile_id": manifest.get("bench_profile_id"),
                        "bench_modbus_homologated": bool(manifest.get("bench_modbus_homologated", False)),
                        "artifact_count": len(manifest.get("artifacts", [])),
                    }
                )
            return out

    def get_installed_package(self, manifest_sha256: str) -> dict[str, Any]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM installations WHERE manifest_sha256=? AND state='verified'",
                (manifest_sha256,),
            ).fetchone()
            if row is None:
                raise CatalogDomainError("PACKAGE_NOT_FOUND", f"Installed package '{manifest_sha256}' not found", status_code=404)
            manifest = json.loads(str(row["manifest_json"]))
            pkg_dir = self.packages_dir / manifest_sha256
            if not pkg_dir.is_dir() or not all(
                (pkg_dir / str(art.get("path") or "")).is_file() for art in manifest.get("artifacts", [])
            ):
                raise CatalogDomainError("HISTORICAL_SOURCE_UNAVAILABLE", "Historical source unavailable", status_code=404)

            artifacts_with_urls = []
            for art in manifest.get("artifacts", []):
                a_copy = dict(art)
                a_copy["local_url"] = f"/api/catalog/installed/{manifest_sha256}/objects/{art['sha256']}"
                a_copy["mime_type"] = ROLE_MIME_TYPES.get(art["role"], "application/octet-stream")
                artifacts_with_urls.append(a_copy)

            return {
                "manifest_sha256": manifest_sha256,
                "product_id": str(row["product_id"]),
                "variant_id": str(row["variant_id"]),
                "publication_seq": int(row["publication_seq"]),
                "source_origin": str(row["source_origin"]),
                "installed_at_utc": str(row["installed_at_utc"]),
                "capabilities": json.loads(str(row["capabilities_json"])),
                "revoked_instructions": json.loads(str(row["revocations_json"])),
                "manifest": manifest,
                "artifacts": artifacts_with_urls,
                "package_dir": str(pkg_dir),
            }

    def get_revoked_instructions(self, product_id: str | None = None, variant_id: str | None = None) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            if product_id and variant_id:
                rows = conn.execute(
                    "SELECT * FROM revoked_instructions WHERE product_id=? AND variant_id=? ORDER BY publication_seq DESC",
                    (product_id, variant_id),
                ).fetchall()
            else:
                rows = conn.execute("SELECT * FROM revoked_instructions ORDER BY publication_seq DESC").fetchall()
            return [dict(r) for r in rows]

    def resolve_installed_object(self, manifest_sha256: str, object_sha256: str) -> tuple[Path, str, int]:
        """Resolve an immutable installed artifact for read-only local HTTP/Range streaming (`Section 4.4`)."""
        if not re.fullmatch(r"[0-9a-f]{64}", manifest_sha256) or not re.fullmatch(r"[0-9a-f]{64}", object_sha256):
            raise CatalogDomainError("PACKAGE_NOT_FOUND", "Invalid SHA-256 identifier", status_code=404)
        pkg = self.get_installed_package(manifest_sha256)
        matched_art = next((a for a in pkg["artifacts"] if a["sha256"] == object_sha256), None)
        if matched_art is None:
            raise CatalogDomainError("OBJECT_NOT_DECLARED", "Object SHA-256 is not declared in this package manifest", status_code=404)
        file_path = (self.packages_dir / manifest_sha256 / matched_art["path"]).resolve()
        pkg_root = (self.packages_dir / manifest_sha256).resolve()
        if not str(file_path).startswith(str(pkg_root)) or not file_path.is_file():
            raise CatalogDomainError("OBJECT_MISSING", "Declared artifact missing on disk", status_code=404)
        mime = ROLE_MIME_TYPES.get(matched_art["role"], "application/octet-stream")
        return file_path, mime, file_path.stat().st_size

    def read_object_range(
        self,
        manifest_sha256: str,
        object_sha256: str,
        range_header: str | None = None,
    ) -> dict[str, Any]:
        """Serve full or HTTP 206 Partial Content byte range without materializing unbounded files (`Section 4.4`)."""
        fpath, mime, total_size = self.resolve_installed_object(manifest_sha256, object_sha256)
        if not range_header or not range_header.strip().lower().startswith("bytes="):
            with fpath.open("rb") as fh:
                data = fh.read()
            return {
                "status_code": 200,
                "mime_type": mime,
                "total_size": total_size,
                "headers": {
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(total_size),
                    "ETag": f'"{object_sha256}"',
                },
                "body": data,
            }

        spec = range_header.strip()[6:].strip()
        if "," in spec or "-" not in spec:
            raise CatalogDomainError("INVALID_BYTE_RANGE", "Unsupported multipart or malformed Range header", status_code=416)
        start_s, end_s = spec.split("-", 1)
        try:
            if start_s == "":
                suffix_len = int(end_s)
                if suffix_len <= 0:
                    raise ValueError
                start = max(0, total_size - suffix_len)
                end = total_size - 1
            else:
                start = int(start_s)
                end = int(end_s) if end_s != "" else (total_size - 1)
        except ValueError as exc:
            raise CatalogDomainError("INVALID_BYTE_RANGE", "Invalid integer in Range header", status_code=416) from exc

        if start < 0 or start >= total_size or end < start:
            raise CatalogDomainError("INVALID_BYTE_RANGE", f"Byte range {start}-{end} out of bounds for {total_size}", status_code=416)
        end = min(end, total_size - 1)
        length = end - start + 1
        with fpath.open("rb") as fh:
            fh.seek(start)
            data = fh.read(length)
        return {
            "status_code": 206,
            "mime_type": mime,
            "total_size": total_size,
            "headers": {
                "Accept-Ranges": "bytes",
                "Content-Range": f"bytes {start}-{end}/{total_size}",
                "Content-Length": str(len(data)),
                "ETag": f'"{object_sha256}"',
            },
            "body": data,
        }

    def build_bundle_default_context(self) -> dict[str, Any]:
        """Return canonical `SessionContentContext` for the bundled `TZ THT-02 V1.1` package."""
        manifest_file = self.bundle_root / "knowledge" / "resource_manifest.json"
        tree_sha = "bundle-tzone-tht02-v2.1"
        if manifest_file.is_file():
            try:
                tree_sha = str(json.loads(manifest_file.read_text(encoding="utf-8")).get("tree_sha256") or tree_sha)
            except Exception:
                pass
        return {
            "product_id": "tzone_tht02",
            "variant_id": "bundled_v1_1",
            "title": "TZ THT-02 · Bundled 1:1 Parametric Reference (V1.1)",
            "publication_seq": 1,
            "manifest_sha256": tree_sha,
            "local_profile_id": "tzone_tht02",
            "content_origin": "bundle",
            "bench_modbus_homologated": True,
            "capabilities": {
                "documentation": True,
                "interactive_twin": True,
                "procedures": True,
            },
        }

    def select_context_for_next_session(self, manifest_sha256: str | None) -> dict[str, Any]:
        """Select a verified catalog package (or None / 'bundle' for bundled THT-02) for upcoming sessions."""
        with self._lock:
            if not manifest_sha256 or manifest_sha256 == "bundle":
                self._active_selection = None
                return self.build_bundle_default_context()
            pkg = self.get_installed_package(manifest_sha256)
            m = pkg["manifest"]
            ctx = {
                "product_id": pkg["product_id"],
                "variant_id": pkg["variant_id"],
                "title": m.get("title") or f"{pkg['product_id']} ({pkg['variant_id']})",
                "publication_seq": pkg["publication_seq"],
                "manifest_sha256": manifest_sha256,
                "local_profile_id": m.get("bench_profile_id") if m.get("bench_modbus_homologated") else None,
                "content_origin": "catalog",
                "bench_modbus_homologated": bool(m.get("bench_modbus_homologated", False)),
                "capabilities": pkg["capabilities"],
            }
            self._active_selection = ctx
            return ctx

    def get_selected_context(self) -> dict[str, Any]:
        with self._lock:
            if self._active_selection is not None:
                msha = str(self._active_selection["manifest_sha256"])
                try:
                    _ = self.get_installed_package(msha)
                    return dict(self._active_selection)
                except CatalogDomainError:
                    self._active_selection = None
            return self.build_bundle_default_context()

    def build_scene_and_manual_descriptor(self, context_ref: dict[str, Any] | None = None) -> dict[str, Any]:
        """Load the full resolved manual documents, 3D GLB/parametric scene descriptor, and actions for a context."""
        ctx = context_ref or self.get_selected_context()
        if ctx.get("content_origin") != "catalog":
            return {
                "context": ctx,
                "scene_origin": "bundled_parametric",
                "cad_exports_supported": ["dxf", "stl", "pdf", "json"],
                "documents": [
                    {
                        "document_id": "tht02_manual_v1_1",
                        "title": "TZ THT-02 User's Manual V1.1",
                        "revision": "V1.1",
                        "page_count": 9,
                        "pdf_url": "/assets/THT02_Users_Manual_v1.1.pdf",
                        "pages": [
                            {"page": p, "printed_page": str(p), "image_url": f"/assets/manual_pages/page_{p}.png"}
                            for p in range(1, 10)
                        ],
                    }
                ],
                "twin": None,
                "revoked_instructions": self.get_revoked_instructions("tzone_tht02", "bundled_v1_1"),
            }

        msha = str(ctx["manifest_sha256"])
        pkg = self.get_installed_package(msha)
        pkg_dir = Path(pkg["package_dir"])
        arts = pkg["artifacts"]

        docs_out: list[dict[str, Any]] = []
        idx_art = next((a for a in arts if a["role"] in ("manual_index", "document_index")), None)
        pdf_arts = {
            str(a.get("document_id") or Path(a["path"]).stem): a
            for a in arts
            if a["role"] == "manual_pdf"
        }
        img_arts = {a["path"]: a for a in arts if a["role"] == "manual_page_image"}
        md_arts = {a["path"]: a for a in arts if a["role"] == "manual_markdown"}

        if idx_art is not None:
            idx_json = json.loads((pkg_dir / idx_art["path"]).read_text(encoding="utf-8"))
            doc_entries = (
                idx_json["documents"]
                if isinstance(idx_json.get("documents"), list)
                else ([idx_json] if idx_json.get("document_id") else [])
            )
            for d in doc_entries:
                did = str(d.get("document_id") or "")
                pdf_a = pdf_arts.get(did)
                pdf_url = pdf_a["local_url"] if pdf_a else None
                pages_out = []
                for pg in d.get("pages", []):
                    pnum = int(pg["page"])
                    img_rel = pg.get("image_path")
                    img_url = img_arts[img_rel]["local_url"] if (img_rel and img_rel in img_arts) else None
                    md_rel = pg.get("markdown_path")
                    md_url = md_arts[md_rel]["local_url"] if (md_rel and md_rel in md_arts) else None
                    cit_raw = str(pg.get("citation_id") or "")
                    sec_from_cit = cit_raw.split(":")[2] if len(cit_raw.split(":")) >= 3 else None
                    sec_id = sanitize_reference_text(str(pg.get("section_id") or sec_from_cit or f"{pnum}.1"))
                    excerpt_raw = pg.get("verified_excerpt")
                    if excerpt_raw is None:
                        excerpt_raw = pg.get("excerpt") or ""
                    pages_out.append(
                        {
                            "page": pnum,
                            "printed_page": sanitize_reference_text(str(pg.get("printed_page") or pnum)),
                            "title": sanitize_reference_text(str(pg.get("title") or f"Page {pnum}")),
                            "section_id": sec_id,
                            "citation_id": cit_raw or f"{did}:p{pnum}:{sec_id}",
                            "verified_excerpt": sanitize_reference_text(str(excerpt_raw)),
                            "image_url": img_url,
                            "markdown_url": md_url,
                            "pdf_fallback_url": f"{pdf_url}#page={pnum}" if pdf_url else None,
                            "keywords": [str(k).lower() for k in pg.get("keywords", [])],
                        }
                    )
                docs_out.append(
                    {
                        "document_id": did,
                        "title": sanitize_reference_text(str(d.get("title") or did)),
                        "revision": sanitize_reference_text(str(d.get("revision") or d.get("revision_label") or "rev-1")),
                        "page_count": len(pages_out) or int(d.get("page_count") or 1),
                        "pdf_url": pdf_url,
                        "pdf_sha256": pdf_a["sha256"] if pdf_a else d.get("pdf_sha256"),
                        "pages": pages_out,
                    }
                )
        else:
            import pymupdf

            for did, pdf_a in pdf_arts.items():
                with pymupdf.open(pkg_dir / pdf_a["path"]) as doc:
                    pc = len(doc)
                docs_out.append(
                    {
                        "document_id": did,
                        "title": sanitize_reference_text(did),
                        "revision": "rev-1",
                        "page_count": pc,
                        "pdf_url": pdf_a["local_url"],
                        "pdf_sha256": pdf_a["sha256"],
                        "pages": [
                            {
                                "page": p,
                                "printed_page": str(p),
                                "title": f"Page {p}",
                                "section_id": f"{p}.1",
                                "verified_excerpt": "",
                                "image_url": None,
                                "pdf_fallback_url": f"{pdf_a['local_url']}#page={p}",
                                "keywords": [],
                            }
                            for p in range(1, pc + 1)
                        ],
                    }
                )

        twin_desc: dict[str, Any] | None = None
        if pkg["capabilities"].get("interactive_twin") is True:
            glb_a = next(a for a in arts if a["role"] == "twin_glb")
            parts_a = next(a for a in arts if a["role"] == "twin_parts")
            actions_a = next(a for a in arts if a["role"] == "twin_actions")
            parts_json = json.loads((pkg_dir / parts_a["path"]).read_text(encoding="utf-8"))
            actions_json = json.loads((pkg_dir / actions_a["path"]).read_text(encoding="utf-8"))
            raw_units = str(parts_json.get("units") or parts_json.get("unit") or "meters").strip().lower()
            is_meters = raw_units in ("m", "meter", "meters")
            scale_mm = 1000.0 if is_meters else 1.0
            # Sanitize part labels/summaries and normalize PR #4 (`node_id`, `aliases`) <-> PR #5 (`node_name`, `label`)
            norm_parts: list[dict[str, Any]] = []
            for p in parts_json.get("parts", []):
                p_copy = dict(p)
                aliases = [sanitize_reference_text(str(al)) for al in (p.get("aliases") or []) if str(al).strip()]
                node_nm = str(p.get("node_name") or p.get("node_id") or "").strip()
                p_copy["node_name"] = node_nm
                p_copy["node_id"] = node_nm
                p_copy["aliases"] = aliases
                fallback_lbl = aliases[0] if aliases else str(p.get("part_id") or "")
                p_copy["label"] = sanitize_reference_text(str(p.get("label") or fallback_lbl))
                fallback_sum = f"Verified CAD component ({', '.join(aliases[:3])})" if aliases else ""
                p_copy["summary"] = sanitize_reference_text(str(p.get("summary") or fallback_sum))
                norm_parts.append(p_copy)

            norm_views: list[dict[str, Any]] = []
            for v in parts_json.get("views", []):
                v_copy = dict(v)
                if "camera_pos_mm" not in v_copy and isinstance(v_copy.get("camera_offset_m"), list) and len(v_copy["camera_offset_m"]) == 3:
                    v_copy["camera_pos_mm"] = [round(float(c) * scale_mm, 3) for c in v_copy["camera_offset_m"]]
                if "target_mm" not in v_copy and isinstance(v_copy.get("target_m"), list) and len(v_copy["target_m"]) == 3:
                    v_copy["target_mm"] = [round(float(c) * scale_mm, 3) for c in v_copy["target_m"]]
                norm_views.append(v_copy)

            twin_desc = {
                "glb_url": glb_a["local_url"],
                "glb_sha256": glb_a["sha256"],
                "units": "meters" if is_meters else "millimeters",
                "scale_to_studio_mm": scale_mm,
                "reference_dimensions_mm": parts_json.get("reference_dimensions_mm", {}),
                "parts": norm_parts,
                "views": norm_views,
                "actions": actions_json.get("actions", []),
            }

        return {
            "context": ctx,
            "scene_origin": "catalog_glb" if twin_desc is not None else "docs_only_no_3d",
            "cad_exports_supported": ["glb", "pdf", "json"] if twin_desc is not None else ["pdf", "json"],
            "documents": docs_out,
            "twin": twin_desc,
            "revoked_instructions": self.get_revoked_instructions(pkg["product_id"], pkg["variant_id"]),
        }

    def resolve_asset_query(self, raw_query: str) -> dict[str, Any]:
        """Resolve asset search strictly by verified identity/variant without unconditional THT-02 fallback (`M4-ID-01..03`)."""
        q = (raw_query or "").strip()
        if not q:
            ctx = self.get_selected_context()
            return {
                "matched": True,
                "resolution": "exact",
                "identity_status": "matched",
                "sensor_id": "TZ-THT-02" if ctx["product_id"] == "tzone_tht02" else ctx["product_id"].upper(),
                "context": ctx,
                "candidates": [],
            }

        norm = re.sub(r"[^a-z0-9]+", " ", q.lower()).strip()
        compact = re.sub(r"[^a-z0-9]+", "", q.lower())

        # Collect candidate variants from active catalog packages + bundled profiles
        candidates: list[dict[str, Any]] = []
        installed = [p for p in self.list_installed_packages() if p.get("is_active_for_variant")]
        for pkg in installed:
            m_pkg = self.get_installed_package(pkg["manifest_sha256"])["manifest"]
            aliases = [
                pkg["product_id"],
                pkg["variant_id"],
                f"{pkg['product_id']} {pkg['variant_id']}",
                pkg.get("model", ""),
                *(m_pkg.get("aliases") or []),
            ]
            candidates.append(
                {
                    "product_id": pkg["product_id"],
                    "variant_id": pkg["variant_id"],
                    "sensor_id": m_pkg.get("sensor_id") or pkg["model"],
                    "title": pkg["title"],
                    "connector_type": pkg.get("connector_type") or m_pkg.get("connector_type") or "standard",
                    "discriminant_hint": m_pkg.get("discriminant_hint") or f"Variant: {pkg['variant_id']}",
                    "aliases": aliases,
                    "family_tokens": [re.sub(r"[^a-z0-9]+", "", str(pkg.get("model") or pkg["product_id"]).lower())],
                    "context": {
                        "product_id": pkg["product_id"],
                        "variant_id": pkg["variant_id"],
                        "title": pkg["title"],
                        "publication_seq": pkg["publication_seq"],
                        "manifest_sha256": pkg["manifest_sha256"],
                        "local_profile_id": pkg["bench_profile_id"] if pkg["bench_modbus_homologated"] else None,
                        "content_origin": "catalog",
                        "bench_modbus_homologated": pkg["bench_modbus_homologated"],
                        "capabilities": pkg["capabilities"],
                    },
                }
            )

        # Bundled profiles (`tzone_tht02` and `tzone_tht03r`)
        bundle_ctx = self.build_bundle_default_context()
        candidates.append(
            {
                "product_id": "tzone_tht02",
                "variant_id": "bundled_v1_1",
                "sensor_id": "TZ-THT-02",
                "title": "TZ THT-02 · 4-Wire Waterproof Pigtail (Bundled V1.1)",
                "connector_type": "4_wire_pigtail",
                "discriminant_hint": "1 m 4-wire shielded pigtail (Red/Black/Yellow/Green), no LCD",
                "aliases": [
                    "tz tht 02", "tht 02", "tht02", "tzone tht02", "ths 00", "ths00", "thp 02", "thp02",
                    "rs485 temperature and humidity sensor",
                ],
                "family_tokens": ["tzonetht", "thtseries"],
                "context": bundle_ctx,
            }
        )
        candidates.append(
            {
                "product_id": "tzone_tht03r",
                "variant_id": "bundled_pending",
                "sensor_id": "TZ-THT-03R",
                "title": "TZ THT-03R · Wall-Mount RS-485 Display Variant (Pending Bench Validation)",
                "connector_type": "terminal_block_wall",
                "discriminant_hint": "Wall housing with internal screw terminal block",
                "aliases": ["tz tht 03r", "tht 03r", "tht03r", "tzone tht03r"],
                "family_tokens": ["tzonetht", "thtseries"],
                "context": {
                    "product_id": "tzone_tht03r",
                    "variant_id": "bundled_pending",
                    "title": "TZ THT-03R (Pending Bench Validation)",
                    "publication_seq": 1,
                    "manifest_sha256": bundle_ctx["manifest_sha256"],
                    "local_profile_id": "tzone_tht03r",
                    "content_origin": "bundle",
                    "bench_modbus_homologated": False,
                    "capabilities": {"documentation": False, "interactive_twin": False, "procedures": False},
                },
            }
        )

        # Check exact variant / alias matches
        exact_hits: list[dict[str, Any]] = []
        for cand in candidates:
            for al in cand["aliases"]:
                al_norm = re.sub(r"[^a-z0-9]+", " ", str(al).lower()).strip()
                al_comp = re.sub(r"[^a-z0-9]+", "", str(al).lower())
                if not al_comp:
                    continue
                if norm == al_norm or compact == al_comp or (len(al_norm) >= 5 and re.search(rf"\b{re.escape(al_norm)}\b", norm)) or (len(al_comp) >= 5 and al_comp in compact):
                    exact_hits.append(cand)
                    break

        # Deduplicate exact_hits by (product_id, variant_id)
        dedup_hits: list[dict[str, Any]] = []
        seen_pv: set[tuple[str, str]] = set()
        for h in exact_hits:
            pv = (h["product_id"], h["variant_id"])
            if pv not in seen_pv:
                seen_pv.add(pv)
                dedup_hits.append(h)

        # If multiple variants have distinct connector/variant_id for the same query -> AMBIGUOUS (`M4-ID-02`)!
        if len(dedup_hits) > 1:
            # Prefer specific variant if query explicitly names variant_id or connector_type
            narrowed = [
                h for h in dedup_hits
                if h["variant_id"].lower().replace("_", "") in compact
                or str(h.get("connector_type") or "").lower().replace("_", "") in compact
            ]
            if len(narrowed) == 1:
                dedup_hits = narrowed
            else:
                return {
                    "matched": False,
                    "resolution": "ambiguous",
                    "identity_status": "identify_variant",
                    "sensor_id": None,
                    "resolved_model": None,
                    "discriminant_field": "connector_or_variant_suffix",
                    "discriminant_prompt": "Multiple hardware variants match this model family. Confirm the physical connector or variant suffix before opening a session.",
                    "candidates": [
                        {
                            "product_id": h["product_id"],
                            "variant_id": h["variant_id"],
                            "title": h["title"],
                            "connector_type": h["connector_type"],
                            "discriminant_hint": h["discriminant_hint"],
                            "manifest_sha256": h["context"]["manifest_sha256"],
                        }
                        for h in dedup_hits
                    ],
                }

        if len(dedup_hits) == 1:
            winner = dedup_hits[0]
            return {
                "matched": True,
                "resolution": "exact",
                "identity_status": "matched" if winner["context"]["bench_modbus_homologated"] or winner["context"]["content_origin"] == "catalog" else "identity_pending",
                "sensor_id": winner["sensor_id"],
                "resolved_model": winner["sensor_id"],
                "matched_alias": winner["aliases"][0],
                "confidence": 0.99,
                "context": winner["context"],
                "candidates": [],
            }

        # Check family-level ambiguous query (e.g. "TZONE THT" or "THT series")
        if compact in ("tzonetht", "tht", "thtseries", "tzonethtsensor"):
            fam_cands = [c for c in candidates if c["product_id"].startswith("tzone_tht")]
            return {
                "matched": False,
                "resolution": "ambiguous",
                "identity_status": "identify_variant",
                "sensor_id": None,
                "resolved_model": None,
                "discriminant_field": "variant_suffix_and_connector",
                "discriminant_prompt": "Ambiguous TZONE THT family query. Confirm exact model suffix and connector type.",
                "candidates": [
                    {
                        "product_id": h["product_id"],
                        "variant_id": h["variant_id"],
                        "title": h["title"],
                        "connector_type": h["connector_type"],
                        "discriminant_hint": h["discriminant_hint"],
                        "manifest_sha256": h["context"]["manifest_sha256"],
                    }
                    for h in fam_cands
                ],
            }

        # Foreign / unknown equipment (`M4-ID-01`): NEVER return TZ-THT-02!
        tokens = q.split()
        guessed_mfg = tokens[0].upper() if len(tokens) >= 2 else None
        return {
            "matched": False,
            "resolution": "unknown",
            "identity_status": "unknown_pending_identity",
            "sensor_id": None,
            "resolved_model": None,
            "confidence": 0.0,
            "can_query_cloud_catalog": True,
            "suggested_cloud_query": {
                "manufacturer": guessed_mfg,
                "model": q,
                "variant": None,
                "hardware_revision": None,
            },
            "candidates": [],
        }


# ==============================================================================
# 6. Reference Signed Package Fixture Builders (12+ Page Multi-Doc + GLB + Partial)
# ==============================================================================


def build_synthetic_pdf_bytes(title: str, page_lines: list[str]) -> bytes:
    """Create a real multi-page searchable PDF using PyMuPDF (`M4-DOC-01..03`)."""
    import pymupdf

    doc = pymupdf.open()
    for idx, text in enumerate(page_lines, start=1):
        page = doc.new_page(width=595, height=842)
        page.insert_text((48, 64), f"{title} — Physical Page {idx}", fontsize=14)
        page.insert_text((48, 102), text, fontsize=11)
    out = doc.tobytes()
    doc.close()
    return out


def write_reference_signed_package_fixture(
    dest_dir: Path,
    *,
    variant_id: str = "m12_4pin_rev2",
    publication_seq: int = 10,
    include_twin: bool = True,
    include_procedures: bool = True,
    connector_type: str = "m12_4pin",
    extra_aliases: list[str] | None = None,
    revoked_instructions: list[dict[str, str]] | None = None,
    write_zip_path: Path | None = None,
) -> dict[str, Any]:
    """Generate a complete or partial Ed25519-signed FieldScan Cloud package directory (and optional `.zip`)."""
    dest = Path(dest_dir)
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)

    # Document 1: 12-page installation & register manual (tests > 9 pages & printed vs physical numbering `M4-DOC-01`)
    doc1_pages = [
        f"Section {p}.1 (Printed Page A-{p}): THT-02-M12 Industrial Transmitter Reference. "
        + (
            "SW1 8-Pin DIP Switch Bank binary weights [128, 64, 32, 16, 8, 4, 2, 1]. Open housing cap to focus dip.bank."
            if p == 5
            else (
                "Extended Calibration & Drift Appendix: factory CMOSens +/-0.25 %RH/yr, 12-page cloud manual verification."
                if p == 12
                else f"Verified technical specification for page {p}."
            )
        )
        for p in range(1, 13)
    ]
    pdf1_bytes = build_synthetic_pdf_bytes("THT-02 M12 Cloud Manual Rev 2", doc1_pages)
    pdf1_rel = "docs/manual_12p.pdf"
    (dest / pdf1_rel).parent.mkdir(parents=True, exist_ok=True)
    (dest / pdf1_rel).write_bytes(pdf1_bytes)

    # Document 2: 4-page field wiring bulletin (same page numbers 1..4 to test multi-document disambiguation `M4-DOC-01`!)
    doc2_pages = [
        f"Bulletin Page {p} (Printed B-{p}): M12 4-Pin A-Coded Connector Pinout — Pin 1 V+, Pin 2 B-, Pin 3 GND, Pin 4 A+."
        for p in range(1, 5)
    ]
    pdf2_bytes = build_synthetic_pdf_bytes("Field Wiring Bulletin TB-204", doc2_pages)
    pdf2_rel = "docs/wiring_bulletin_4p.pdf"
    (dest / pdf2_rel).write_bytes(pdf2_bytes)

    manual_index_obj = {
        "schema_version": 1,
        "documents": [
            {
                "document_id": "fixture_manual_12p",
                "title": "TZ THT-02 M12 Extended Manual (12 Pages)",
                "revision": f"rev-{publication_seq}",
                "page_count": 12,
                "pages": [
                    {
                        "page": p,
                        "printed_page": f"A-{p}",
                        "section_id": f"{p}.1",
                        "title": "DIP-8 Switch Bank" if p == 5 else ("Extended Calibration Appendix" if p == 12 else f"Section {p}.1"),
                        "verified_excerpt": doc1_pages[p - 1],
                        "keywords": ["dip", "switch", "bank"] if p == 5 else (["calibration", "appendix", "drift"] if p == 12 else [f"page{p}"]),
                    }
                    for p in range(1, 13)
                ],
            },
            {
                "document_id": "wiring_bulletin_tb204",
                "title": "M12 Connector Wiring Bulletin TB-204 (4 Pages)",
                "revision": "TB-204-A",
                "page_count": 4,
                "pages": [
                    {
                        "page": p,
                        "printed_page": f"B-{p}",
                        "section_id": f"TB.{p}",
                        "title": f"M12 Pinout Page {p}",
                        "verified_excerpt": doc2_pages[p - 1],
                        "keywords": ["m12", "connector", "wiring", "pinout"] if p == 4 else ["bulletin"],
                    }
                    for p in range(1, 5)
                ],
            },
        ],
    }
    idx_bytes = json.dumps(manual_index_obj, indent=2).encode("utf-8")
    idx_rel = "docs/manual_index.json"
    (dest / idx_rel).write_bytes(idx_bytes)

    artifacts: list[dict[str, Any]] = [
        {
            "role": "manual_pdf",
            "path": pdf1_rel,
            "document_id": "fixture_manual_12p",
            "sha256": sha256_bytes(pdf1_bytes),
            "byte_count": len(pdf1_bytes),
        },
        {
            "role": "manual_pdf",
            "path": pdf2_rel,
            "document_id": "wiring_bulletin_tb204",
            "sha256": sha256_bytes(pdf2_bytes),
            "byte_count": len(pdf2_bytes),
        },
        {
            "role": "manual_index",
            "path": idx_rel,
            "sha256": sha256_bytes(idx_bytes),
            "byte_count": len(idx_bytes),
        },
    ]

    if include_twin:
        glb_bytes = build_reference_sensor_glb()
        glb_rel = "scene/twin.glb"
        (dest / glb_rel).parent.mkdir(parents=True, exist_ok=True)
        (dest / glb_rel).write_bytes(glb_bytes)

        parts_obj = {
            "schema_version": 1,
            "units": "meters",
            "reference_dimensions_mm": {"length": 140.0, "outer_diameter": 16.0},
            "parts": [
                {"part_id": "housing.cap", "node_name": "housing.cap", "label": "Slotted SHT30 Cap", "summary": "Protective SS316L cap", "explode_offset_m": [0.0, 0.0, 0.035], "citation_id": "fixture_manual_12p:p1:1.1"},
                {"part_id": "probe.sht30", "node_name": "probe.sht30", "label": "SHT30 Sensing Probe", "summary": "Factory CMOSens die", "citation_id": "fixture_manual_12p:p12:12.1"},
                {"part_id": "seal.oring", "node_name": "seal.oring", "label": "IP65 O-Ring Seal", "summary": "Elastomer perimeter seal", "citation_id": "fixture_manual_12p:p2:2.1"},
                {"part_id": "housing.barrel", "node_name": "housing.barrel", "label": "Main Cylindrical Barrel", "summary": "RS-485 transceiver barrel", "citation_id": "fixture_manual_12p:p3:3.1"},
                {"part_id": "flange.mount", "node_name": "flange.mount", "label": "Snap-On Mounting Flange", "summary": "32 mm pitch wall clip", "citation_id": "fixture_manual_12p:p1:1.1"},
                {"part_id": "dip.bank", "node_name": "dip.bank", "label": "SW1 8-Pin DIP Switch Bank", "summary": "Binary address weights 128..1", "citation_id": "fixture_manual_12p:p5:5.1"},
                {"part_id": "dip.pin_1", "node_name": "dip.pin_1", "label": "DIP Switch Pin 1 (Weight 128)", "summary": "MSB address rocker on SW1", "ambiguous_group": "pin_1", "citation_id": "fixture_manual_12p:p5:5.1"},
                {"part_id": "dip.pin_8", "node_name": "dip.pin_8", "label": "DIP Switch Pin 8 (Weight 1)", "summary": "LSB address rocker on SW1", "citation_id": "fixture_manual_12p:p5:5.1"},
                {"part_id": "rear.connector", "node_name": "rear.connector", "label": "Rear M12 4-Pin Connector", "summary": "A-coded RS-485 rear plug", "explode_offset_m": [0.0, 0.0, -0.018], "citation_id": "wiring_bulletin_tb204:p4:TB.4"},
                {"part_id": "rear.pin_1", "node_name": "rear.pin_1", "label": "Rear Connector Pin 1 (DC V+)", "summary": "5-24V DC supply pin on M12 plug", "ambiguous_group": "pin_1", "citation_id": "wiring_bulletin_tb204:p4:TB.4"},
            ],
            "views": [
                {"view_id": "isometric_home", "camera_pos_mm": [22.0, 48.0, 185.0], "target_mm": [0.0, 0.0, 0.0], "exploded": False},
                {"view_id": "open_dip", "camera_pos_mm": [12.0, 30.0, 82.0], "target_mm": [0.0, 2.0, 14.0], "exploded": True},
                {"view_id": "rear_connector", "camera_pos_mm": [-42.0, 26.0, -128.0], "target_mm": [0.0, 0.0, -60.0], "exploded": False},
                {"view_id": "probe_tip", "camera_pos_mm": [28.0, 22.0, 116.0], "target_mm": [0.0, 0.0, 56.0], "exploded": False},
            ],
        }
        parts_bytes = json.dumps(parts_obj, indent=2).encode("utf-8")
        parts_rel = "scene/twin.parts.json"
        (dest / parts_rel).write_bytes(parts_bytes)

        actions_obj = {
            "schema_version": 1,
            "actions": [
                {"action_id": "act_focus_dip", "kind": "focus_part", "part_id": "dip.bank", "view_id": "open_dip", "citation_id": "fixture_manual_12p:p5:5.1", "triggers": ["dip bank", "dip switch", "switches"]},
                {"action_id": "act_focus_rear", "kind": "focus_part", "part_id": "rear.connector", "view_id": "rear_connector", "citation_id": "wiring_bulletin_tb204:p4:TB.4", "triggers": ["rear connector", "m12", "back cable", "wiring"]},
                {"action_id": "act_focus_probe", "kind": "focus_part", "part_id": "probe.sht30", "view_id": "probe_tip", "citation_id": "fixture_manual_12p:p12:12.1", "triggers": ["main sensor", "probe", "sht30"]},
                {"action_id": "act_reset", "kind": "reset_view", "view_id": "isometric_home", "triggers": ["reset view", "close housing"]},
            ],
        }
        actions_bytes = json.dumps(actions_obj, indent=2).encode("utf-8")
        actions_rel = "scene/twin.actions.json"
        (dest / actions_rel).write_bytes(actions_bytes)

        artifacts.extend(
            [
                {"role": "twin_glb", "path": glb_rel, "sha256": sha256_bytes(glb_bytes), "byte_count": len(glb_bytes)},
                {"role": "twin_parts", "path": parts_rel, "sha256": sha256_bytes(parts_bytes), "byte_count": len(parts_bytes)},
                {"role": "twin_actions", "path": actions_rel, "sha256": sha256_bytes(actions_bytes), "byte_count": len(actions_bytes)},
            ]
        )

    if include_procedures:
        proc_obj = {
            "schema_version": 1,
            "steps": [
                {
                    "instruction_id": "proc_step_open_cap",
                    "title": "Open housing & inspect SW1 DIP-8 bank",
                    "part_id": "dip.bank" if include_twin else None,
                    "citation_id": "fixture_manual_12p:p5:5.1",
                },
                {
                    "instruction_id": "proc_step_legacy_jumper",
                    "title": "Verify M12 shield jumper strap",
                    "part_id": "rear.connector" if include_twin else None,
                    "citation_id": "wiring_bulletin_tb204:p4:TB.4",
                },
            ],
        }
        proc_bytes = json.dumps(proc_obj, indent=2).encode("utf-8")
        proc_rel = "procedures/procedures.json"
        (dest / proc_rel).parent.mkdir(parents=True, exist_ok=True)
        (dest / proc_rel).write_bytes(proc_bytes)
        artifacts.append(
            {"role": "procedures", "path": proc_rel, "sha256": sha256_bytes(proc_bytes), "byte_count": len(proc_bytes)}
        )

    manifest_payload: dict[str, Any] = {
        "schema_version": 1,
        "interaction_version": 1,
        "issuer": "fieldscan-demo",
        "key_id": "demo-1",
        "product_id": "tzone_tht02",
        "variant_id": variant_id,
        "title": f"TZ THT-02 ({variant_id} · Cloud Signed Fixture seq #{publication_seq})",
        "manufacturer": "TZONE",
        "model": f"TZ THT-02-{variant_id.upper()}",
        "sensor_id": f"TZ-THT-02-{variant_id.upper()}",
        "connector_type": connector_type,
        "discriminant_hint": f"Connector: {connector_type} (seq #{publication_seq})",
        "aliases": extra_aliases or [f"tht-02-{variant_id}", f"tht02 {variant_id}"],
        "publication_seq": publication_seq,
        "minimum_app_build": 1,
        "bench_profile_id": "tzone_tht02" if variant_id.startswith("m12") else None,
        "bench_modbus_homologated": False,
        "sources": [
            {"source_id": "fixture_manual_12p", "origin": "test_fixture", "revision_label": f"rev-{publication_seq}"},
            {"source_id": "wiring_bulletin_tb204", "origin": "test_fixture", "revision_label": "TB-204-A"},
        ],
        "capabilities": {
            "documentation": True,
            "interactive_twin": include_twin,
            "procedures": include_procedures,
        },
        "reason_codes": [] if include_twin else ["INTERNAL_GEOMETRY_UNCONFIRMED"],
        "revoked_instructions": revoked_instructions or [],
        "artifacts": artifacts,
    }

    envelope = create_signed_manifest_envelope(manifest_payload, key_id="demo-1")
    env_bytes = (json.dumps(envelope, indent=2) + "\n").encode("utf-8")
    (dest / "manifest.envelope.json").write_bytes(env_bytes)

    if write_zip_path is not None:
        zpath = Path(write_zip_path)
        zpath.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zpath, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for f in sorted(dest.rglob("*")):
                if f.is_file():
                    zf.write(f, f.relative_to(dest).as_posix())

    _, msha, _ = verify_and_decode_manifest_envelope(env_bytes)
    return {
        "package_dir": str(dest),
        "zip_path": str(write_zip_path) if write_zip_path else None,
        "manifest_sha256": msha,
        "envelope": envelope,
        "manifest": manifest_payload,
    }
