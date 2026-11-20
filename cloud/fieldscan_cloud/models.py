"""Pydantic v2 API, job, and manifest contract models (Megaplan §6 & §11)."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

_URL_SCHEME_RE = re.compile(r"https?://", re.IGNORECASE)
_CLEAN_SPACE_RE = re.compile(r"\s+")

CapabilityStatus = Literal["available", "unavailable"]
JobState = Literal["queued", "running", "completed", "failed"]
AvailabilityState = Literal["ready", "partial", "needs_identification"]
ResolutionKind = Literal["exact", "ambiguous", "unresolved"]


def normalize_token(value: str | None) -> str:
    if not value:
        return ""
    cleaned = _CLEAN_SPACE_RE.sub(" ", value.strip()).lower()
    return re.sub(r"[^a-z0-9]+", "", cleaned)


def _reject_url_or_control(value: str | None, field_name: str) -> str | None:
    if value is None:
        return None
    cleaned = _CLEAN_SPACE_RE.sub(" ", value.strip())
    if not cleaned:
        return None
    if _URL_SCHEME_RE.search(cleaned):
        raise ValueError(f"{field_name} must not contain a URL")
    if any(ord(ch) < 32 for ch in cleaned):
        raise ValueError(f"{field_name} contains invalid control characters")
    return cleaned


class ResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manufacturer: str = Field(..., min_length=1, max_length=80)
    model: str = Field(..., min_length=1, max_length=120)
    variant: str | None = Field(default=None, max_length=80)
    hardware_revision: str | None = Field(default=None, max_length=40)
    force_refresh: bool = Field(default=False)

    @field_validator("manufacturer", "model")
    @classmethod
    def _validate_required(cls, v: str, info) -> str:
        cleaned = _reject_url_or_control(v, info.field_name)
        if not cleaned:
            raise ValueError(f"{info.field_name} must not be empty")
        return cleaned

    @field_validator("variant", "hardware_revision")
    @classmethod
    def _validate_optional(cls, v: str | None, info) -> str | None:
        return _reject_url_or_control(v, info.field_name)


class IdentityInfo(BaseModel):
    product_id: str | None = None
    variant_id: str | None = None
    resolution: ResolutionKind


class CapabilitiesStatus(BaseModel):
    documentation: CapabilityStatus
    interactive_twin: CapabilityStatus
    procedures: CapabilityStatus


class CandidateVariant(BaseModel):
    product_id: str
    variant_id: str
    variant_code: str
    hardware_revision: str | None = None
    display_name: str
    discriminant_hint: str


class CachedPublicationRef(BaseModel):
    product_id: str
    variant_id: str
    publication_seq: int
    availability: Literal["ready", "partial"]
    manifest_url: str


class ResolveAcceptedResponse(BaseModel):
    job_id: str
    job_state: Literal["queued", "running"]
    availability: AvailabilityState | None = None
    retry_after_seconds: int = 2
    cached_publication: CachedPublicationRef | None = None


class JobStatusResponse(BaseModel):
    job_id: str | None = None
    job_state: JobState
    phase: str | None = None
    availability: AvailabilityState | None = None
    retry_after_seconds: int | None = None
    identity: IdentityInfo | None = None
    capabilities: CapabilitiesStatus | None = None
    reason_codes: list[str] = Field(default_factory=list)
    candidates: list[CandidateVariant] = Field(default_factory=list)
    publication_seq: int | None = None
    manifest_url: str | None = None
    cached_publication: CachedPublicationRef | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
    request_id: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str = "fieldscan-cloud-api"
    revision: str
    schema_version: int
    journal_mode: str


class ManifestSource(BaseModel):
    source_id: str
    origin: str
    revision_label: str


class ManifestCapabilities(BaseModel):
    documentation: bool
    interactive_twin: bool
    procedures: bool


class ManifestArtifact(BaseModel):
    role: str
    path: str
    sha256: str = Field(..., min_length=64, max_length=64)
    byte_count: int = Field(..., ge=0)
    document_id: str | None = None


class ManifestPayload(BaseModel):
    schema_version: int = 1
    interaction_version: int = 1
    issuer: str
    key_id: str
    product_id: str
    variant_id: str
    publication_seq: int = Field(..., ge=1)
    minimum_app_build: int = 1
    sources: list[ManifestSource]
    capabilities: ManifestCapabilities
    artifacts: list[ManifestArtifact]
    reason_codes: list[str] = Field(default_factory=list)
    withdrawn_procedures: list[str] = Field(default_factory=list)
    restored_from_seq: int | None = None


class SignedManifestEnvelope(BaseModel):
    key_id: str
    payload_b64: str
    signature_b64: str


class DeviceEnrollRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    device_id: str = Field(..., min_length=6, max_length=128)
    platform: str = Field(default="ipados", min_length=2, max_length=32)
    app_version: str = Field(default="2.1", min_length=1, max_length=32)

    @field_validator("device_id", "platform", "app_version")
    @classmethod
    def _clean_enroll_str(cls, v: str, info) -> str:
        cleaned = _reject_url_or_control(v, info.field_name)
        if not cleaned:
            raise ValueError(f"{info.field_name} must not be empty")
        return cleaned


class DeviceEnrollResponse(BaseModel):
    access_token: str
    tenant_id: str
    channel: str
    credential_id: str
    key_id: str
