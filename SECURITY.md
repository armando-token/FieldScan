# Security & Industrial Safety Policy

FieldScan is an offline-first industrial field-engineering assistant designed to operate safely inside air-gapped industrial facilities while offering an opt-in, cryptographically verified cloud catalog pipeline.

---

## 1. Operational Safety Boundaries (Industrial Pilot Gate)

| Boundary | Enforcement Mechanism | Verification |
|---|---|---|
| **Read-Only Modbus Pilot** | `pilot_readonly = true`, `pilot_writes_enabled = false`, `allowed_function_codes_pilot = [0x03]` (`Read Holding Registers` only). Zero write function codes (`0x05`, `0x06`, `0x0F`, `0x10`) are executed on live bus paths. | [`audit_no_regressions.py`](scripts/audit_no_regressions.py), [`modbus_tcp.py`](src/fieldscan/modbus_tcp.py), [`ModbusTCPClient.swift`](ios/FieldScanM4/ModbusTCPClient.swift) |
| **Bus-Target Isolation** | Visually simulated DIP-8 switch previews (`simulatedVisualDipAddress`) are strictly isolated from the operator-authorized Modbus slave address (`targetSlaveId`). Voice previews or 3D twin interactions never mutate the live bus target without explicit technician confirmation. | [`test_copilot_unification_acceptance.py`](tests/test_copilot_unification_acceptance.py) |
| **Fail-Closed Grounding Filter (`IA-04`)** | Blocks unverified claims (`SCADA`, `PLC`, `calibrated`, out-of-range datasheet page citations, or live-bus assertions when telemetry is disconnected or simulated). | [`session_engine.py`](src/fieldscan/session_engine.py), [`FieldScanSessionEngine.swift`](ios/FieldScanM4/FieldScanSessionEngine.swift) |
| **Human-in-the-Loop Confirmation (`DAT-03`/`DAT-04`)** | Physical hardware changes are never committed to the session audit trail without explicit technician confirmation (`confirmed=true`). | [`FieldScanSessionEngine.swift`](ios/FieldScanM4/FieldScanSessionEngine.swift) |

---

## 2. Network & Deployment Boundaries

### Edge / iPad Air M4 Runtime
- **Zero-Network Boot Invariant:** Launches with `sync_enabled = false` and makes `0` external WAN requests until an operator explicitly triggers opt-in cloud onboarding or catalog updates.
- **Loopback-Only Embedded Server:** On iPadOS, `StandaloneFieldScanServer` (`NWListener`) binds strictly to `127.0.0.1:8088`.
- **Airplane Mode Socket Guard:** On macOS/Linux workstations, [`offline_guard.py`](src/fieldscan/offline_guard.py) blocks non-loopback external IP egress while allowing local loopback and explicitly configured private Modbus gateway targets (such as `10.10.100.254:502` on a direct PUSR AP).
- **Private LAN Caution:** When running the desktop workstation server with `--usb-ipad` or LAN exposure, deploy strictly on a trusted local bench network or direct USB-C link. Never expose the local studio server directly to the public internet without an authenticating reverse proxy.

### FieldScan Cloud Backend (`cloud/`)
- **Device Authentication:** Device enrollment (`POST /v1/devices/enroll`) issues scoped bearer tokens (`fsdev_*`) with quota controls; administrative endpoints are protected separately.
- **Server-Side Secret Isolation:** Upstream VLM provider keys (e.g., Amazon Bedrock Mantle/Converse credentials) remain strictly server-side (`0600` environment files) and are never shipped to the iPad client.
- **SSRF & Domain Allowlisting:** Cloud OEM document and image harvesting enforces HTTPS-only downloads, private/link-local IP rejection, and explicit `ALLOWED_OEM_DOMAINS` allowlisting.
- **Ephemeral Reference-Image Privacy Guarantee:** Multi-angle visual reference photos harvested during Stage 2 live solely in ephemeral `staging/<job_id>/ref_images/` directories and are unconditionally deleted upon job completion. Zero external reference photos or URLs ever enter CAS `objects/`, signed manifests, or `.glb` binaries.

---

## 3. Cryptographic Package Verification (`Ed25519` + `SHA-256`)

Every downloadable sensor package is verified fail-closed before installation or activation (`CryptoKit.Curve25519` on iPadOS and RFC 8032 `cryptography` in Python):

1. **Detached Signature Envelope:** Manifest bytes must pass Ed25519 verification against the pinned `pilot-1` public key.
2. **Duplicate JSON Key Rejection:** Custom strict parser rejects ambiguous duplicate keys in signed manifests.
3. **Artifact Digest Integrity:** Every PDF page, index JSON, and `.glb` 3D twin is verified against its declared SHA-256 digest and artifact budget (`<= 256` files / `<= 120 MB`).
4. **Anti-Rollback & Path Safety:** Sequence regressions (`seq` downgrade), path traversal (`..` / absolute paths), and external URIs inside `.glb` assets are rejected unconditionally.
5. **Session Context Pinning:** Active inspection sessions pin their `manifest_sha256` and reject conflicting manifest updates (`MANIFEST_SESSION_MISMATCH`) until the session is closed.

---

## 4. Reporting a Vulnerability

Please report security or safety issues **privately** to the repository owner via GitHub Security Advisories or direct contact rather than opening a public issue. Include reproduction steps, affected component (`ios/`, `src/`, `cloud/`, or `static/`), and observed impact.
