"""Ed25519 manifest signing and strict verification coordinated with Swift/iPad M4 (Megaplan §11.2)."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


class ManifestVerificationError(ValueError):
    """Raised when a signed manifest fails structure, key_id, duplicate key, or Ed25519 checks."""


def _unique_json_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in pairs:
        if key in out:
            raise ManifestVerificationError(f"Duplicate JSON key rejected: {key}")
        out[key] = value
    return out


def load_private_key(pem_path: Path) -> Ed25519PrivateKey:
    key = serialization.load_pem_private_key(pem_path.read_bytes(), password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise TypeError("Signing key must be an Ed25519 private key")
    return key


def public_key_raw_b64(public_key: Ed25519PublicKey) -> str:
    raw = public_key.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    if len(raw) != 32:
        raise ValueError("Ed25519 raw public key must be 32 bytes")
    return base64.b64encode(raw).decode("ascii")


def load_public_key_from_raw_b64(raw_b64: str) -> Ed25519PublicKey:
    try:
        raw = base64.b64decode(raw_b64, validate=True)
    except Exception as exc:
        raise ManifestVerificationError("Invalid Base64 public key") from exc
    if len(raw) != 32:
        raise ManifestVerificationError("Ed25519 public key must decode to exactly 32 raw bytes")
    return Ed25519PublicKey.from_public_bytes(raw)


def sign_manifest_payload(
    payload_dict: dict[str, Any],
    *,
    private_key: Ed25519PrivateKey,
    key_id: str,
) -> tuple[bytes, str, str]:
    """
    Serialize payload deterministically, sign exact UTF-8 bytes with Ed25519,
    locally verify with the derived public key, and return (envelope_bytes, manifest_sha256, etag).
    """
    if payload_dict.get("key_id") != key_id:
        raise ValueError("Inner payload key_id must match signing key_id")

    payload_bytes = json.dumps(
        payload_dict,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")

    signature = private_key.sign(payload_bytes)
    if len(signature) != 64:
        raise RuntimeError("Ed25519 signature must be 64 bytes")

    envelope = {
        "key_id": key_id,
        "payload_b64": base64.b64encode(payload_bytes).decode("ascii"),
        "signature_b64": base64.b64encode(signature).decode("ascii"),
    }
    envelope_bytes = json.dumps(
        envelope,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")

    # Local self-verification before ever committing (§11.3 step 3)
    raw_pub_b64 = public_key_raw_b64(private_key.public_key())
    verify_signed_envelope(
        envelope_bytes,
        public_key_b64=raw_pub_b64,
        expected_key_id=key_id,
    )

    manifest_sha256 = hashlib.sha256(payload_bytes).hexdigest()
    etag = f'"{hashlib.sha256(envelope_bytes).hexdigest()}"'
    return envelope_bytes, manifest_sha256, etag


def verify_signed_envelope(
    envelope_bytes: bytes,
    *,
    public_key_b64: str,
    expected_key_id: str,
) -> dict[str, Any]:
    """Verify Ed25519 signature over exact UTF-8 payload bytes and reject duplicate keys."""
    try:
        envelope = json.loads(envelope_bytes.decode("utf-8"), object_pairs_hook=_unique_json_keys)
    except ManifestVerificationError:
        raise
    except Exception as exc:
        raise ManifestVerificationError("Invalid envelope JSON") from exc

    if not isinstance(envelope, dict):
        raise ManifestVerificationError("Envelope must be a JSON object")
    if envelope.get("key_id") != expected_key_id:
        raise ManifestVerificationError(
            f"Unexpected envelope key_id={envelope.get('key_id')!r}, expected {expected_key_id!r}"
        )

    try:
        payload_bytes = base64.b64decode(envelope["payload_b64"], validate=True)
        signature = base64.b64decode(envelope["signature_b64"], validate=True)
    except Exception as exc:
        raise ManifestVerificationError("Invalid Base64 in payload_b64 or signature_b64") from exc

    if len(signature) != 64:
        raise ManifestVerificationError("Ed25519 signature must be exactly 64 bytes")

    public_key = load_public_key_from_raw_b64(public_key_b64)
    try:
        public_key.verify(signature, payload_bytes)
    except InvalidSignature as exc:
        raise ManifestVerificationError("Ed25519 signature verification failed") from exc

    try:
        payload = json.loads(payload_bytes.decode("utf-8"), object_pairs_hook=_unique_json_keys)
    except ManifestVerificationError:
        raise
    except Exception as exc:
        raise ManifestVerificationError("Invalid payload JSON") from exc

    if not isinstance(payload, dict):
        raise ManifestVerificationError("Payload must be a JSON object")
    if payload.get("key_id") != expected_key_id:
        raise ManifestVerificationError("Inner payload key_id does not match expected key_id")
    return payload
