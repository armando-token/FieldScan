# 12 · Cloud Catalog Contract, Signed Package Store & iPad Air M4 Runbook (`Contract v2.1.0`)

## 1. Baseline & Architectural Scope

- **Baseline Reference Commit:** `8e6a06504f916cc40e0e7c85177efb7cffa16d04` (`main`)
- **Active Developer Toolchain:** Xcode `27.2` (`Build version 27B52`), `arm64-apple-ios17.0`, Python `3.12.15` (`uv`)
- **Target Hardware:** Apple iPad Air 11-inch (M4, 12 GB Unified Memory, Bundle ID `com.fieldscan.tht02.ipadm4`)

FieldScan CAD v2.1 preserves **100% offline startup and full air-gapped operation** for bundled assets (`TZ THT-02` 1:1 parametric 3D twin, 9-page datasheet `V1.1`, English Push-to-Talk, `.voiceChat` Hands-Free Barge-In, and read-only pilot Modbus `FC03`) while adding an **Ed25519-verified transactional local package store** and an **opt-in HTTPS Cloud Catalog client** for multi-variant industrial documentation, self-contained binary `.glb` 3D scenes, and structured inspection procedures.

---

## 2. Network & Security Boundaries

1. **Zero Unsolicited WAN Egress on Startup (`M4-BASE-01`):**
   - `sync_enabled` defaults to `false` on every launch (`egress_policy = "strict_local_only"`, `https_requests_emitted = 0`).
   - On iPadOS, `StandaloneFieldScanServer` binds its `NWListener` strictly to loopback (`127.0.0.1:8088`).
   - `FieldScanRuntimeConfig.isTrustedHMIHost(_:)` explicitly excludes `cloudCatalogBaseURL` so `WKWebView` never navigates to or executes scripts from remote catalog origins (`M4-WAN-06`).
2. **Dedicated Cloud HTTPS Client (`FieldScanCatalogClient`):**
   - Enforces `https://` in production (loopback `http://127.0.0.1` permitted strictly in automated test harnesses).
   - Blocks cross-origin `30x` HTTP redirects (`REDIRECT_BLOCKED`, `M4-WAN-04`).
   - Stores bearer tokens exclusively in iOS Keychain (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) or native process memory; credentials, serial numbers, inspection photos, and bench IP addresses are never sent to `/v1/catalog/resolve` or exposed to JavaScript (`M4-WAN-06`).
3. **Strict Isolation Between Visual Simulation and Bus Polling (`M4-BUS-01..03`):**
   - Conversational or voice commands (e.g., `"Configure it for slave 3"`) update only `simulated_visual_dip_address` on the 3D twin and never mutate the live Modbus polling target (`target_slave_id`) or emit bus frames.
   - Changing `target_slave_id` requires an explicit technician confirmation call to `POST /api/modbus/target_slave` with `{"slave_id": <1..247>, "confirmed": true}` on a homologated bench profile (`bench_modbus_homologated == true`). Unhomologated catalog profiles return `409 PROFILE_NOT_HOMOLOGATED_FOR_BUS`.

---

## 3. Cryptographic Package & Manifest Contract

### 3.1 Signed Manifest Envelope (`manifest.envelope.json`)

Every package is distributed with a detached-payload JSON envelope (`<= 512 KB`) verified **over raw decoded `payload_b64` bytes prior to JSON parsing**:

```json
{
  "key_id": "demo-1",
  "payload_b64": "<base64-utf8-manifest-bytes>",
  "signature_b64": "<base64-64-byte-ed25519-signature>"
}
```

- **Signature Algorithm:** RFC 8032 Ed25519 (`CryptoKit.Curve25519.Signing.PublicKey` on iPadOS/macOS; bit-identical RFC 8032 verifier in Python `catalog_store.py`).
- **Labeled Reference Fixture Public Key (`key_id = "demo-1"`, `issuer = "fieldscan-demo"`):**
  - Base64: `dY3z2CiJZsOxQuwsAHq4jGNIfYDzRWQ4U1yAV3IMsb0=`
  - Hex: `758df3d8288966c3b142ec2c007ab88c63487d80f3456438535c8057720cb1bd`
  - Scope: Labeled test and reference fixture verification only; production deployments register their production `key_id` + 32-byte Base64 public key at runtime via `POST /api/catalog/sync_config` (`trusted_signers: [{key_id, public_key_b64}]`) without embedding private keys in the repository.

### 3.2 Strict Payload Validation & Budgets (`M4-PKG-01..09`)

Before any file enters `packages/<manifest-sha256>/`, both Swift and Python stores enforce:
- Zero duplicate JSON keys at every nesting depth (`DUPLICATE_JSON_KEYS`).
- Envelope `key_id` matches inner `manifest.key_id` and resolves in `trusted_keys` (`UNTRUSTED_KEY_ID`, `KEY_ID_MISMATCH`).
- `schema_version == 1`, `interaction_version == 1`, and `minimum_app_build <= 210` (`UNSUPPORTED_SCHEMA_VERSION`, `MINIMUM_BUILD_NOT_MET`).
- Normalized relative paths only: rejects `/`, `\`, `:`, `.`, `..`, symlinks, and executable/script extensions (`.sh`, `.py`, `.js`, `.html`, `.dylib`, `.app`, etc. -> `EXECUTABLE_OR_UNSAFE_PATH`).
- Hard resource budgets: `<= 256` artifacts per package (accommodating per-page `manual_markdown` up to 200-page Cloud manuals), `<= 50 MB` per single artifact, `<= 120 MB` total uncompressed package bytes (`SIZE_BUDGET_EXCEEDED`, `ARCHIVE_LIMIT_EXCEEDED`), plus pre-flight free disk space check (`DISK_FULL`).
- Capability dependency & semantic validation (`MISSING_CAPABILITY_DEPENDENCY`, `SEMANTIC_REFERENCE_BROKEN`):
  - `documentation == true`: accepts `manual_pdf` or Cloud `reference_only` (`document_index`/`manual_index` + `manual_markdown`), supporting both multi-document `documents[]` and Cloud single-document root `docs/index.json` (`revision_label`, `excerpt`, `markdown_path`).
  - `interactive_twin == true`: requires `twin_glb`, `twin_parts`, and `twin_actions`; inspects binary glTF 2.0 header, blocks external buffer/image URIs, verifies unique `part_id`s, accepts both `node_name`/`node_id`, `units`/`unit` (`m`/`meters`/`mm`/`millimeters`), and meter-space view offsets (`camera_offset_m`, `target_m`, `exploded_offsets_m`), confirms every node exists in the `.glb` scene graph, and checks every `citation_id` (`<doc_id>:p<page>[:<section>]`) against real page counts.
  - `procedures == true`: satisfied by explicit `procedures` artifact or Cloud `twin_actions` with verified page citations; `withdrawn_procedures` and `revoked_instructions` are both recorded into `revoked_instructions` SQLite table.
  - Partial packages (`interactive_twin == false`) declare explicit `reason_codes` (e.g. `INTERNAL_GEOMETRY_UNCONFIRMED`) and render cleanly in `docs_only_no_3d` mode.
- Optional private deployment gate support: `POST /api/catalog/sync_config` accepts an optional `boat_port_auth_token` (stored in Keychain/native memory only, never echoed to JS or logs) transmitted as `Cookie: _port_auth=<token>` alongside `Authorization: Bearer <token>`.
- Anti-rollback ordering (`M4-PKG-06`): `publication_seq <= active_seq` for `(issuer, channel, product_id, variant_id)` is rejected with `409 ROLLBACK_BLOCKED`. Legitimate content reverts must be published with a strictly higher `publication_seq`.

---

## 4. Agreed Cloud HTTPS API & Local Store Endpoints

### 4.1 Upstream Cloud Catalog Service Contract (`Section 3.1`)

| Method & Path | Purpose | Status Codes Handled |
|---|---|---|
| `GET /healthz` | Service reachability probe | `200`, `401/403`, `5xx` |
| `POST /v1/catalog/resolve` | Minimal identity lookup (`manufacturer`, `model`, `variant`, `hardware_revision`) | `200` (cached/ambiguous), `202` (`job_id` queued), `401/403`, `429` (`Retry-After`), `5xx` |
| `GET /v1/jobs/{job_id}` | Poll synthesis job (`job_state` decoupled from `availability`) | `200`, `404/410` (`HTTP_JOB_EXPIRED`), `429`, `5xx` |
| `GET /v1/catalog/products/{product_id}/variants/{variant_id}/manifest` | Fetch signed `manifest.envelope.json` with `If-None-Match` ETag | `200`, `304` (`not_modified_304`), `404/410` |
| `GET /v1/catalog/blobs/{sha256}` | Stream immutable content-addressed artifact blob | `200` (verified byte count + SHA-256 before install) |

### 4.2 Local Studio & Native Loopback Routes (`/api/catalog/*`)

- `GET /api/catalog/status` — Sync telemetry, `selected_context`, `pinned_session_context`, `update_ready_for_next_session`, and `scene_generation`.
- `GET /api/catalog/packages` — Verified installed packages in `Application Support/FieldScanCatalog/`.
- `POST /api/catalog/select` — Select `manifest_sha256` (or `"bundle"`) for the next session and advance `scene_generation`.
- `POST /api/catalog/import` — Import a signed `.zip`/`.fspkg` archive or folder completely offline (wired to native `UIDocumentPickerViewController` on iPadOS).
- `POST /api/catalog/sync_config` — Configure HTTPS `base_url`, Keychain `auth_token`, and `sync_enabled` toggle.
- `GET /api/catalog/healthz`, `POST /api/catalog/resolve`, `GET /api/catalog/jobs/{job_id}`, `POST /api/catalog/install`.
- `POST /api/catalog/scene_ready` — Non-blocking WebGL `GLTFLoader` completion fence (`scene_generation`, `turn_id`).
- `GET` / `HEAD /api/catalog/installed/{manifest_sha256}/objects/{object_sha256}` — Read-only local object streaming with `Range: bytes=start-end` (`206 Partial Content`), invalid range rejection (`416`), and zero exposure of `staging/`.

---

## 5. Operator Runbook & Operational Rollback

### 5.1 Standard Verification & Build Commands (Mac Root)

```bash
uv sync
uv run python scripts/build_reference_catalog_fixtures.py
uv run python scripts/sync_manifest.py --sync-bundle --verify
uv run python scripts/audit_no_regressions.py
uv run pytest -q

./scripts/build_ipad_m4_app.sh --verify-only
./scripts/build_ipad_m4_app.sh --unsigned
# For paired physical iPad Air M4 USB-C installation:
./scripts/build_ipad_m4_app.sh --install
```

### 5.2 Field & Bench Operational Walkthrough

1. **Offline Bundled Mode:** Launch `FieldScanM4` with Wi-Fi / WAN disabled. Confirm `Strict Local Only · 0 HTTPS reqs`, bundled `TZ THT-02` 3D twin, 9-page datasheet drawer, Push-to-Talk, and Hands-Free Barge-In.
2. **Offline Signed Package Import:** Tap **Catalog** in the top bar -> **Import Signed Package (.zip)** and select `knowledge/fixtures/cloud_catalog_v1/reference_full_m12_seq10.zip` from iPadOS Files. Select the verified package (`seq #10`) when no session is open to load the 12-page manual + 4-page wiring bulletin + `.glb` 3D twin locally.
3. **Mid-Session Revision Pinning:** While an inspection session is open, importing or downloading `seq #11` keeps the active session pinned to `seq #10` (`update_ready_for_next_session = true`) until the technician closes the session.
4. **Operational Rollback:** Uncheck **Enable HTTPS Cloud Catalog Sync** in the Catalog modal to cancel any active transfer immediately, and click **Use Bundled TZ THT-02 V1.1** (or select any previously verified package) for the next session. Existing closed/open sessions retain their pinned historical provenance.

---

## 6. Explicit Separation of Verified Results vs External Dependencies

| Verification Layer | Status | Scope & Notes |
|---|---|---|
| Automated Python + Compiled Swift Contract Matrix (`38` baseline + `42` Cloud Catalog = `80` tests) | **PASS (`80/80`)** | Full coverage of `M4-BASE-01..03`, `M4-ID-01..03`, `M4-WAN-01..06`, `M4-PKG-01..09`, `M4-DOC-01..03`, `M4-3D-01..05`, `M4-VOICE-01..04`, `M4-CAM-01`, `M4-BUS-01..03`, `M4-SESSION-01..03`, `M4-REVOKE-01`, and `M4-END-01`. |
| Native iPad Air M4 (`arm64-apple-ios17.0`) Release Build (`FieldScanM4.app`) | **PASS (`BUILD SUCCEEDED`)** | Compiled with Xcode `27.2 (27B52)`, `BundleResources` 100% SHA-256 verified. |
| Live Upstream Production Cloud Endpoint (`https://<prod-host>`) | **PENDING_ENDPOINT_CREDENTIALS** | Client and protocol verified against deterministic `httpx.MockTransport` and Swift `URLProtocol` harnesses; live WAN test awaits production URL + bearer token + production Ed25519 `key_id`. |
| Physical RS-485 / PUSR USR-DR164 Hardware Bench Read (`M4-BUS-02` physical) | **PENDING_BENCH_HARDWARE** | MBAP TCP framing and target slave confirmation verified against local TCP gateway stub; physical sensor bus verification requires attached `PUSR USR-DR164` (`:502`) or `FT2232HL` + powered `TZ THT-02`. |
