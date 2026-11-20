# 10 — Bench Setup, Event Runbook & Section 14 Validation Matrix

- **Contract Version**: `2.1.0`
- **Target Device Verified**: Physical `Armando's iPad` — **iPad Air 11-inch (M4)** (`iPad16,8`, `arm64e`, iPadOS `27.0.1`, UDID `00008132-000C79663C8BC01C`, Bundle ID `com.fieldscan.tht02.ipadm4`)
- **Workstation Verified**: Apple Silicon Mac Mini (`Darwin arm64`, Xcode `27.2`, Python `3.12.15` via `uv`)
- **Pilot Safety Invariants**:
  - **Zero False Verification Claims**: `0` claims of `SCADA ONLINE`, `PLC verified`, `calibrated values`, or unconfirmed physical repairs in UI, TTS, or exported PDF/JSON.
  - **Zero Pilot Bus Writes**: `0` Modbus write frames (`0x05`, `0x06`, `0x10`) emitted in pilot mode (`pilot_writes_enabled = false`, `andon_hardware_writes_enabled = false`).

---

## 1. Bench Topologies & Pre-Event Setup (Section 15.1)

### Topology A — Autonomous iPad Air M4 + PUSR `USR-DR164` (No Mac)
1. **Electrical & Bus Isolation**:
   - Isolate the bench from any plant operational bus.
   - Wire `TZ THT-02` leads per Manual V1.1 Page 4: **Red** = `DC 5-24V (+)`, **Black** = `Common GND`, **Yellow** = `RS-485 A+`, **Green** = `RS-485 B-`.
   - Configure PUSR `USR-DR164` serial side to `9600 bps, 8N1` and network side to **Modbus TCP (`MBAP` <-> `Modbus RTU`)** on port `502` (never raw transparent serial on `:5502`).
2. **iPad Configuration**:
   - Disconnect Mac USB-C cable when demonstrating pure iPad autonomy (`IA-02`, `OFF-01`, `OFF-02`).
   - Connect iPad Wi-Fi to the isolated bench AP/router (no WAN/Internet required).
   - Launch **FieldScanM4** -> tap top-right pill (`M4 12GB · iPad Local · Share`) -> **Configure PUSR USR-DR164 Modbus TCP Gateway** -> enter gateway IP (e.g. `192.168.0.7`) and port `502`.

### Topology B — Assisted Mac Mini Bench (USB-C Tether + `FT2232HL`)
1. Attach isolated `FT2232HL` USB-RS485 adapter to Mac Mini (`/dev/cu.usbserial*`) and connect iPad Air M4 via USB-C cable.
2. Start the Mac stack (automatically detects dynamic `169.254.x.x` USB-C link-local IP and degrades cleanly to deterministic rules if `:8091` GGUF server is absent):
   ```bash
   ./scripts/start_all.sh --usb-ipad
   # Or test deterministic local-rules fallback without :8091 (OFF-03):
   ./scripts/start_all.sh --usb-ipad --no-llm
   ```
3. On iPad Air M4, open the top-right control pill -> **Mac Mini Assisted · USB-C HTTPS**. Confirm TLS SHA-256 certificate pin on first connection (`OFF-06`).
4. **Single-Master Rule**: Never poll the same RS-485 bus simultaneously from both `FT2232HL` and `PUSR USR-DR164`.

---

## 2. Recommended 6-Step Live Event Walkthrough (Section 15.2)

| Step | Operator Action | Expected Visible & Audible Evidence | Fallback / Contingency |
| :--- | :--- | :--- | :--- |
| **1. Open Session** | Launch FieldScanM4 and verify `TZ THT-02` profile (`2026.11.19-r1`). | Top status shows active transport (`PUSR` or `FT2232HL`), AI provider identity, and `PARAMETRIC CAD MODEL · 140.0x16.0 MM`. | Switch topology via top-right pill or open explicit Simulation session (amber banner). |
| **2. Voice / 3D Inspection** | Ask in EN or ES (e.g., *"Show me the connector"* or Spanish equivalent for page 4 / connector). | Highlight focuses `waterproof_gland_leads` on 3D CAD model and opens verified Manual V1.1 Page 4 (`fe5be7370ac4...`). | Tap component chip or Manual Page tab directly if venue noise is excessive. |
| **3. Camera Evidence** | Aim iPad or UVC camera at sensor; briefly occlude with hand, then hold steady for 1.5s. | Occluded frames are rejected; once 5 sharp frames stabilize, 1 automatic physical photo is saved with SHA-256 hash. | Tap **Capture Photo** (`manual_physical_camera` origin recorded in dossier). |
| **4. Read-Only Poll** | Tap **Start Read-Only Poll** (or ask *"Is the sensor responding?"*). | Fresh reading (`<= 3.0s`) displays `Temp (degC)`, `RH (%RH)`, `FC03` TX/RX hex, and scope `SENSOR RESPONDED · COMM OK`. | On timeout, UI shows `NO RESPONSE` and preserves any prior reading strictly as `HISTORICAL`. |
| **5. Close & Export** | Record observation (or explicit **Confirm Change** if DIP was modified) and tap **PDF + JSON**. | Multi-page PDF + JSON + ZIP generated atomically in `Documents/exports/`; `0` confirmed changes if inspection-only. | If evidence is missing, exports truthfully as `[PARTIAL REPORT]` listing pending items. |
| **6. Planned Extension** | Click **`Calibration · Planned`** badge in header. | Opens Modal 3 (`Calibration & Verified Adjustment · Planned`) explaining reference comparison & compatible-model roadmap (`CAL-00`). | Keeps TZONE strictly read-only (`0` writes). |

---

## 3. Contingency & Recovery Playbook (Section 15.3)

| Incident | Immediate Action & Truthful Communicable State |
| :--- | :--- |
| **PUSR unreachable / Local Network permission denied** | iPadOS surfaces `LOCAL_NETWORK_DENIED` or `SOURCE_UNAVAILABLE` with `0.5/1/2/4s` backoff; enable Local Network toggle in iPad Settings or switch to Assisted Mac USB-C mode. |
| **High ambient noise disrupts Hands-Free VAD** | Switch immediately to **Push-to-Talk** or touch controls; audio engine releases input tap cleanly without duplicate listeners. |
| **Camera glare, motion blur, or white label occlusion** | Auto-capture pauses cleanly (`FRAME_REJECTED_OCCLUDED_OR_BLURRY`); reposition lighting or trigger explicit **Capture Photo** (`manual_operator`). |
| **Multimodal VLM (`:8091`) offline or memory warning** | `LlamaServerBridge` unloads weights on memory pressure and routes seamlessly to `Local Deterministic Rules v2.1` + verified manual index (`< 50 ms`). |
| **Physical sensor unrecoverable during live demo** | Close partial physical record honestly; if demonstrating synthetic response, switch to explicit `Sim: Nominal Bus` (amber `SIMULATION` banner + `SIMULATION_` filename prefix). |

---

## 4. Section 14.3 Complete Validation Execution Matrix (77 Test Cases)

Status legend (per Section 14.1):
- **`PASS`**: Executed and verified in automated Python/FastAPI suite, compiled Swift contract suite, and/or physical iPad Air M4 build & deployment.
- **`BLOCKED_HARDWARE`**: Software/protocol path is implemented and contract-tested, but physical electrical/optical bench verification requires unplugged hardware (`FT2232HL`, `PUSR USR-DR164`, physical `TZ THT-02` / `THT-03R`, external UVC camera, or metrology reference standard).

### 4.1 Data, Provenance, Sessions & Parity (`DAT-01` .. `DAT-09`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `DAT-01` | **PASS** | `test_dat01_as_found_timeout_records_no_response_without_overclaims` + Swift `run_swift_contract_tests.swift` | Timeout records `no_response`; zero `SCADA` / `calibrated` claims. |
| `DAT-02` | **PASS** | `test_dat02_stale_sample_after_3s_and_prior_boot_marked_historical` | Samples `> 3.0s` or from prior `boot_id` transition to `historical`. |
| `DAT-03` | **PASS** | `test_dat03_dat04_unconfirmed_vs_confirmed_changes_and_partial_report` + Swift runner | Suggestions keep `confirmed_changes = 0`; explicit confirmation records actor & UTC. |
| `DAT-04` | **PASS** | `test_dat03_dat04_unconfirmed_vs_confirmed_changes_and_partial_report` | Missing photo or physical sample marks session & PDF `[PARTIAL REPORT]`. |
| `DAT-05` | **PASS** | `test_dat05_dat06_dat07_dat08_simulation_isolation_single_active_orphan_and_idempotency` | Simulation sessions carry `simulation=true` and `SIMULATION_` export prefix. |
| `DAT-06` | **PASS** | `test_dat05_dat06_dat07_dat08_simulation_isolation_single_active_orphan_and_idempotency` | Opening a second session pauses prior open session cleanly without data loss. |
| `DAT-07` | **PASS** | `test_dat05_dat06_dat07_dat08_simulation_isolation_single_active_orphan_and_idempotency` + Swift runner | SQLite WAL durability + automatic `.tmp` orphan cleanup on engine startup. |
| `DAT-08` | **PASS** | `test_dat05_dat06_dat07_dat08_simulation_isolation_single_active_orphan_and_idempotency` + Swift runner | Idempotent replay (`200`), payload mismatch (`409 IDEMPOTENCY_CONFLICT`), stale `expected_seq` (`409`). |
| `DAT-09` | **PASS** | `test_dat09_fastapi_endpoints_and_swift_engine_parity` | Live FastAPI + compiled Swift `FieldScanSessionEngine` parity (`contract_version = 2.1.0`). |

### 4.2 Modbus RTU & Modbus TCP (`MBAP`) Transport (`BUS-01` .. `BUS-12`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `BUS-01` | **BLOCKED_HARDWARE** | `scripts/run_bench_hardware_check.py` (`bus_01_usb_rtu`) | Requires physical `FT2232HL` (`/dev/cu.usbserial*`) + powered `TZ THT-02`. |
| `BUS-02` | **BLOCKED_HARDWARE** | MBAP framing verified in `test_bus04_bus05_*`; physical run via `scripts/run_bench_hardware_check.py --pusr-host <IP>` | Client verified `crc_checked_by_client=false, mbap_valid=true`; awaits physical `USR-DR164` + `THT-02`. |
| `BUS-03` | **PASS** | `test_bus02_bus03_mbap_no_fake_crc_and_port_5502_raw_rtu_guard` + Swift runner | Port `:5502` and raw RTU CRC frames on MBAP rejected with `PROTOCOL_MISMATCH`. |
| `BUS-04` | **PASS** | `test_bus04_bus05_split_7byte_mbap_header_and_concatenated_frames` + Swift runner | 7-byte MBAP header split across 3 TCP packets reassembles and decodes `25.0 C / 60.0 %RH`. |
| `BUS-05` | **PASS** | `test_bus04_bus05_split_7byte_mbap_header_and_concatenated_frames` + Swift runner | Concatenated frames parsed in order; `>4096B` stream triggers `BUFFER_OVERFLOW` & clean reset. |
| `BUS-06` | **PASS** | `test_bus06_bus07_bus08_late_txid_wrong_unit_exception_and_per_channel_7fff` | Late `TxID` discarded; mismatched `UnitID` flagged `WRONG_UNIT`; signed `-10.0 C` (`0xFF9C`) verified. |
| `BUS-07` | **PASS** | `test_bus06_bus07_bus08_late_txid_wrong_unit_exception_and_per_channel_7fff` + Swift runner | Exception `0x83 0x02` (`MODBUS_EXCEPTION`) distinguished from `READ_TIMEOUT`. |
| `BUS-08` | **PASS** | `test_bus06_bus07_bus08_late_txid_wrong_unit_exception_and_per_channel_7fff` + Swift runner | Per-channel `0x7FFF` sentinel invalidates faulty channel while preserving valid sibling channel. |
| `BUS-09` | **PASS** | `test_bus09_bus10_bus12_backoff_recovery_and_zero_write_gate` | `0.5, 1.0, 2.0, 4.0s` backoff schedule verified without socket storms. |
| `BUS-10` | **PASS** | `test_bus04_bus05_*` + `test_bus09_*` | Socket disconnect/reconnect resets generation and recovers cleanly on next valid MBAP poll. |
| `BUS-11` | **BLOCKED_HARDWARE** | `knowledge/profiles/tzone_tht03r.json` (`pending_bench_verification`) | Awaits physical `THT-03R` unit to confirm register map before enabling auto-decode. |
| `BUS-12` | **PASS** | `test_bus09_bus10_bus12_backoff_recovery_and_zero_write_gate` + Swift runner | `0x05`, `0x06`, `0x10` raise `PILOT_WRITE_BLOCKED`; `drive_andon_relay` hardware TX locked `False`. |

### 4.3 Guided Procedure & Computer Vision (`FLU-01` .. `FLU-06`, `VIS-01` .. `VIS-10`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `FLU-01` | **PASS** | `test_flu01_to_flu06_guided_workflow_and_unknown_profile_gate` | Full inspection session with `0` fabricated adjustments. |
| `FLU-02` | **PASS** | `test_dat03_dat04_*` + `session_engine.py` post-change sample check | Confirmed change requires post-change Modbus sample before non-partial close. |
| `FLU-03` | **PASS** | `test_dat05_dat06_dat07_dat08_*` (`expected_seq` & idempotency) | Duplicate/stale-step actions rejected without mutating state. |
| `FLU-04` | **PASS** | `test_flu01_to_flu06_guided_workflow_and_unknown_profile_gate` + Swift runner | Unknown model & `THT-03R` enforce `identity_pending=true` and block register scaling (`409`). |
| `FLU-05` | **PASS** | `test_dat03_dat04_unconfirmed_vs_confirmed_changes_and_partial_report` | Closing with missing photo/sample preserves real observations and flags `partial_close=true`. |
| `FLU-06` | **PASS** | `SceneDelegate.swift` (`handleAppSuspend`) + `test_dat02_*` | App suspend closes active TCP socket and marks sample `historical` until re-verified. |
| `VIS-01` | **PASS** | `test_vis01_to_vis10_auto_capture_freeze_occlusion_and_manual_integrity` | 5 sharp unoccluded frames within `1.5s` trigger 1 `live_physical_camera` capture + dedup. |
| `VIS-02` | **PASS** | `test_vis01_to_vis10_*` + `test_open_two_half_sensor_rejects_white_stickers_and_locks_dip8_pins` | Hand, tool, glare, and white sticker occlusions block auto-capture; manual photo labeled `manual_operator`. |
| `VIS-03` | **PASS** | `test_vis01_to_vis10_auto_capture_freeze_occlusion_and_manual_integrity` | Blur resets stability window; auto-capture fires only after 5 sharp frames stabilize. |
| `VIS-04` | **BLOCKED_HARDWARE** | `notify_camera_source_changed` (`camera_epoch` reset) verified in `test_vis01_to_vis10_*` | Software epoch/ROI reset passes; physical UVC hot-plug on iPad USB-C awaits external UVC camera. |
| `VIS-05` | **PASS** | `test_live_camera_multi_background_all_angle_and_no_fake_fallback` | Multi-angle orientation & HUD coordinate alignment verified across synthetic & live frames. |
| `VIS-06` | **PASS** | `test_vis01_to_vis10_auto_capture_freeze_occlusion_and_manual_integrity` | Repeated SHA-256 JPEG digests pause auto-capture with `stream_frozen = true`. |
| `VIS-07` | **PASS** | `test_vis01_to_vis10_auto_capture_freeze_occlusion_and_manual_integrity` | Simulated and uploaded frames blocked from auto-capture and tagged `simulation` / `uploaded_file`. |
| `VIS-08` | **PASS** | `test_vis01_to_vis10_*` + `static/app.js` Solid/X-Ray/Explode & zone focus | Parametric CAD badge (`140.0x16.0 MM`) active; `100% DIGITAL TWIN MATCH` removed. |
| `VIS-09` | **PASS** | `test_ipad_m4_port_parity.py` + `StandaloneFieldScanServer.swift` pixel telemetry | Shared sharpness, exposure, skin-mask, blue-PCB, and white-sticker rejection contract. |
| `VIS-10` | **PASS** | `test_vis01_to_vis10_*` + Swift `run_swift_contract_tests.swift` | Missing page (`99`) or tampered PDF SHA-256 blocks dependent instruction (`MANUAL_HASH_MISMATCH`). |

### 4.4 Voice & Edge AI Inference (`VOZ-01` .. `VOZ-10`, `IA-01` .. `IA-06`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `VOZ-01` | **PASS** | `test_voz01_to_voz10_*` + `StandaloneFieldScanServer.swift` (`requiresOnDeviceRecognition`) | Bilingual EN/ES intent engine + on-device `SFSpeechRecognizer` locale selection (`en-US` / `es-MX`). |
| `VOZ-02` | **PASS** | `test_voz01_to_voz10_*` + Swift runner | Connector & manual page queries resolve verified profile component & SHA-256 manual citation. |
| `VOZ-03` | **PASS** | `StandaloneFieldScanServer.swift` (`handsfree_start/poll/stop`) + `static/app.js` | Hands-free state, RMS meter, and pause/stop controls exposed in HMI. |
| `VOZ-04` | **PASS** | `test_voz01_to_voz10_*` + Swift runner (`registerTTSPlayback`) | Acoustic cooldown + lexical overlap filter reject speaker TTS echo (`TTS_ACOUSTIC_ECHO_REJECTED`). |
| `VOZ-05` | **PASS** | `StandaloneFieldScanServer.swift` + `static/index.html` | Explicit error state when speech permission/model unavailable; full touch/text controls always active. |
| `VOZ-06` | **PASS** | `test_voz01_to_voz10_*` + Swift runner | Bare numbers without unit (`"176"`, `"25"`) return `AMBIGUOUS_NUMERIC_WITHOUT_UNIT`. |
| `VOZ-07` | **PASS** | `test_voz01_to_voz10_*` (`CONFIRMATION_REQUIRED` / `bypass_blocked`) | Voice cannot self-confirm physical changes or bypass confirmation tokens. |
| `VOZ-08` | **PASS** | `StandaloneFieldScanServer.swift` (`activeSpeechSessionGeneration` tap teardown) | Previous `AVAudioEngine` input tap removed outside lock before re-initializing. |
| `VOZ-09` | **PASS** | `test_voz01_to_voz10_*` (`should_emit_transition_alert`) | `3.0s` cooldown + `>=3` transitions collapse into `intermittent_link` without alert storms. |
| `VOZ-10` | **PASS** | `test_voz01_to_voz10_*` (`switch_language` EN <-> ES) | Mid-session language switch updates session & recognizer preference without losing state. |
| `IA-01` | **PASS** | `lfm_engine.py` (`/v1/models`) + `LlamaServerBridge.swift` + `test_dat09_*` | `/api/capabilities` reports actual served model ID vs `Local Deterministic Rules v2.1`. |
| `IA-02` | **PASS** | `LlamaServerBridge.swift` (`macProbingSuppressedInAutonomousMode`) + physical iPad launch | Autonomous iPad mode suppresses all Mac IP probing and runs 100% locally on `127.0.0.1:8088`. |
| `IA-03` | **PASS** | `LlamaServerBridge.swift` (`SystemLanguageModel.default.availability`) + `StandaloneFieldScanServer.swift` | Cleanly branches between Apple Foundation Models (when enabled) and deterministic rules. |
| `IA-04` | **PASS** | `test_ia04_deterministic_grounding_filter` + Swift runner | Hallucinated pages (`Page 12/14`), unverified registers, and `SCADA/calibrated` claims sanitized. |
| `IA-05` | **BLOCKED_HARDWARE** | `project.pbxproj` embeds all 10 `arm64` IOS `.dylib`s; `LlamaServerBridge.swift` implements `_Z12llama_serveriPPc` | No `.gguf` weights copied into iPad `Documents/models` yet; kept experimental outside P0 default path per Section 10.2. |
| `IA-06` | **PASS** | `LlamaServerBridge.swift` (`handleMemoryWarning` -> `_Z22llama_server_terminatev`) + timeout cancellation | Memory warning observer & endpoint switch cancel in-flight work and degrade to local rules. |

### 4.5 Dossier Exports, Network Security & Offline Operation (`EXP-01` .. `EXP-07`, `OFF-01` .. `OFF-08`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `EXP-01` | **PASS** | `test_exp01_to_exp07_*` + Swift runner | PDF & JSON generated from single `dossier_record` with matching revision & SHA-256 digests. |
| `EXP-02` | **PASS** | `test_dat03_dat04_*` + `test_dat05_*` + `test_exp01_to_exp07_*` | Partial, simulated, and 33-event multi-page (`>=2` pages) PDFs verified without text truncation. |
| `EXP-03` | **PASS** | `test_dat05_dat06_dat07_dat08_*` + `test_exp01_to_exp07_*` | Atomic `.tmp` write + PyMuPDF/JSON verification before `os.replace`; orphan `.tmp` purged on boot. |
| `EXP-04` | **PASS** | `test_exp01_to_exp07_*` (`DISK_FULL` `507`) + `public_demo` serial masking | Insufficient storage raises `507 DISK_FULL` with `0` `.tmp` leftovers and preserves session DB. |
| `EXP-05` | **PASS** | `test_exp01_to_exp07_*` + Swift runner + `FieldScanWebViewController.swift` | Canonical `exports/` allowlist blocks `../` and external paths; cancelling Share Sheet keeps files. |
| `EXP-06` | **PASS** | `test_cad_exporter_dxf_stl_and_offline_outbox` + `test_closed_loop_live_repair_*` | DXF (`ezdxf`), binary STL, PNG sheets, RFC-5322 `.eml`, and `.zip` verified structurally. |
| `EXP-07` | **PASS** | `test_exp01_to_exp07_*` (`amend_closed_session` + `supersedes_export_id`) | Same `(session, seq, audience)` replays idempotently; amended session links `supersedes_export_id`. |
| `OFF-01` | **PASS** | Signed `FieldScanM4.app` installed & launched on physical iPad Air M4 + `test_zero_external_cdn_links_in_frontend` | 100% bundled HTML/CSS/JS/Three.js, 9 manual PNGs, PDF, and SQLite engine run with zero WAN. |
| `OFF-02` | **BLOCKED_HARDWARE** | `offline_guard.py` (`set_authorized_bench_gateway`) verified in `test_off01_*` | Software allows RFC1918 PUSR IP without WAN; awaits physical PUSR AP + `THT-02` on bench. |
| `OFF-03` | **PASS** | `scripts/start_all.sh --usb-ipad --no-llm` + `test_full_fastapi_stack_*` | FastAPI bench server runs cleanly both with and without `:8091` VLM server. |
| `OFF-04` | **BLOCKED_HARDWARE** | `ModbusTCPClient.swift` maps `EACCES/EPERM` -> `LOCAL_NETWORK_DENIED` | Requires interactive iPadOS Settings toggle against a live LAN PUSR IP on physical bench. |
| `OFF-05` | **PASS** | `FieldScanWebViewController.swift` (`isTrustedHMIHost`) + `Info.plist` audit in `test_off01_*` | `NSAllowsArbitraryLoadsInWebContent` removed; untrusted origins denied WebView nav & JS bridge. |
| `OFF-06` | **PASS** | `FieldScanWebViewController.swift` (`pinnedTLSFingerprintSHA256`) | Self-signed TLS leaf cert pinned via SHA-256 DER digest; cert change requires operator re-pin. |
| `OFF-07` | **PASS** | `test_airplane_mode_guard_blocks_external_sockets` + `test_off01_*` | Public WAN (`8.8.8.8:443`) blocked & counted separately from loopback/tether/bench-gateway traffic. |
| `OFF-08` | **PASS** | `scripts/sync_manifest.py --sync-bundle --verify` + Swift `verifyResourceManifest()` | 26/26 tracked bundle files verified 100% SHA-256 identical (`tree_sha256 = 90a2dd53a4b6...`). |

### 4.6 Planned Metrology Extension (`CAL-00` .. `CAL-09`)

| ID | Status | Verification Evidence / Automated Test | Notes |
| :--- | :--- | :--- | :--- |
| `CAL-00` | **PASS** | `test_cal00_to_cal09_*` + HMI Modal 3 (`Calibration & Verified Adjustment · Planned`) | Active in P0 UI & `/api/calibration/planned`; explicitly states `Planned` and `0` writes on TZONE. |
| `CAL-01` | **PASS** | `test_cal00_to_cal09_planned_calibration_and_metrology_contracts` (`REFERENCE_EXPIRED`) | Contract test passes (expired/incomplete/unit-mismatch blocked); physical lab run planned for C1/C2. |
| `CAL-02` | **PASS** | `test_cal00_to_cal09_*` (`INDETERMINATE_UNSTABLE_OR_SKEWED`) | Contract test passes (spread/skew gate); physical chamber stability test planned for C1/C2. |
| `CAL-03` | **PASS** | `test_cal00_to_cal09_*` + Swift runner (`READONLY_COMPARISON_COMPLETE`) | Contract test passes (`writes_emitted = 0`, `claimed_calibrated = false` on `tzone_tht02`). |
| `CAL-04` | **PASS** | `test_cal00_to_cal09_*` (`novus_rht_climate_lab` additive offset math) | Contract fixture passes (`prior_offset + (ref - uut)` & bounds check); physical NOVUS bench in C2. |
| `CAL-05` | **PASS** | `test_cal00_to_cal09_*` (`as_found_preserved` + `residual_error`) | Contract fixture passes; physical write/readback disabled in P0 (`pilot_writes_enabled = false`). |
| `CAL-06` | **PASS** | `test_cal00_to_cal09_*` (`UNCERTAIN_RESULT_RECONCILIATION_REQUIRED`) | Contract fixture blocks blind retry on dropped link until parameter readback reconciliation. |
| `CAL-07` | **PASS** | `test_cal00_to_cal09_*` (`persistence_verified` post-reboot check) | Contract fixture verifies post-reboot offset persistence & residual tolerance. |
| `CAL-08` | **PASS** | `test_cal00_to_cal09_*` (`NONLINEAR_OR_RESIDUAL_OUT_OF_CRITERIA`) | Two-point slope/non-linearity exceeding tolerance blocks pass and never claims `calibrated`. |
| `CAL-09` | **PASS** | `test_cal00_to_cal09_*` (`vaisala_hmp110_lab` + `CLARIFICATION_REQUIRED`) | Multi-vendor profile + ambiguous spoken reference unit gate verified. |
