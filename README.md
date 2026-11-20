# FieldScan CAD v2.1 — Offline Interactive 3D Digital Twin, Native iPad Air M4 App & Modbus SCADA (`TZ THT-02`)

A **100% On-Device / Offline (Airplane Mode)** industrial field engineering, interactive **3D Digital Twin**, live optical vision, and **Modbus-RTU / Modbus-TCP (MBAP)** diagnostics platform engineered for:
- **Apple iPad Air 11-inch (M4, 12 GB Unified Memory)** — Native standalone iOS/iPadOS application (`ios/FieldScanM4/`, Bundle ID `com.fieldscan.tht02.ipadm4`) with in-process Metal `llama-server` (`Qwen3-VL-4B-Instruct`), `AVFoundation` 30 FPS camera + `1.96 ms` integral-image optical detector, `.voiceChat` hardware AEC Hands-Free Barge-In, `NWConnection` Modbus TCP (`:502`), and `WKWebView` 60 FPS `Three.js` CAD studio.
- **Mac Mini (`Apple Silicon Metal`) / Qualcomm Dragonwing IQ-9075 (`IQ9`) / Linux `x86_64`** — FastAPI + Uvicorn + OpenCV + `pyserial` (`FT2232HL` Dual-Channel Isolated RS-485) + local `llama.cpp` (`Qwen3-VL-4B-Instruct` / `LFM3-VL-2B` + `LFM3-Audio-2B`) + `Piper` Neural English TTS.

---

## Key Capabilities in v2.1 (Contract `v2.1.0` · 100% English Software)

1. **Interactive AI-Driven 3D Digital Twin (`twin_action` Contract · `60 FPS` Three.js v0.170)**:
   - Parametric 1:1 CAD assembly (`140.0 mm × Ø16.0 mm`) across 6 canonical sub-assemblies (`strainer_head`, `upper_seal_ring`, `upper_barrel_dip`, `mounting_flange`, `lower_barrel_rs485`, `waterproof_gland_leads`).
   - Natural English voice or text requests (whether **Hands-Free** is ON or OFF) actively manipulate the 3D Digital Twin—exploding/closing the housing, orbiting and zooming the 3D camera (`focusZone3DCamera`), toggling the 8-pin `SW1 DIP-8` 3D rockers to the requested Modbus Slave ID, switching to X-Ray wireframe view, and anchoring a live cyan 3D interactive guide callout while the operator replicates the step in front of the live camera.
2. **Offline English Voice Loop: Hybrid Push-to-Talk + Real-Time Hands-Free Barge-In**:
   - **Push-to-Talk (`#btnVoiceRecord`)**: Supports both **Press-and-Hold-to-Speak** (`>= 380 ms` hold auto-sends on release) and **Tap-to-Start / Tap-to-Send**, with live RMS metering, live partial transcription, `endAudio()` flush before task teardown, and `22 s` VLM completion budget.
   - **Hands-Free Live Voice with Instant Barge-In**: Uses iPad M4 `.voiceChat` hardware Acoustic Echo Cancellation (and WebAudio RMS barge-in in browsers) while keeping `AVAudioEngine` live during TTS playback—speaking mid-sentence immediately interrupts AI speech (`stopTtsImmediatelyOnMain()`), preserves pre-roll PCM audio, and processes the operator's new question with zero restart lag.
3. **30 FPS Optical Scanner, Hand/Tool Spatial Masking & Carpet-Proof Sensor Lock (`< 2 ms/frame`)**:
   - Dual-space `YCrCb + HSV` skin locus masking and thin-shaft screwdriver vector exclusion prevent hands or tools from corrupting 3D sensor tracking.
   - `O(1)` summed-area (integral-image) micro-grain suppression rejects textured carpets/floors while locking immediately onto the `140×16 mm` cylindrical sensor body and high-resolution 8-pin `SW1 DIP-8` metallic comb (`1.96 ms` on M4).
   - Dedicated `scene_vision` intent inspects real camera surroundings (floor, carpet, desk, objects) via raw un-annotated camera frames + `Qwen3-VL-4B-Instruct` + Apple `Vision`.
4. **Verified 9-Page Datasheet Navigator & Section Highlighter (`VIS-10`)**:
   - SHA-256 verified against `assets/THT02_Users_Manual_v1.1.pdf` (`Pages 1..9`).
   - Asking where any topic lives in the datasheet (e.g., factory calibration on **Page 3 · Section 3.1**, 4-wire RS-485 color code on **Page 4 · Section 4.1**, `SW1 DIP-8` weights on **Page 5 · Section 5.1**, `0x7FFF` fault sentinel on **Page 6 · Section 5.2**, CRC-16 `0xA001` & blueprint on **Page 9 · Section 6.1**) automatically expands the manual drawer, highlights the exact section excerpt, and opens the full-page lightbox.
5. **Read-Only Pilot Modbus-RTU (`FT2232HL`) & Modbus-TCP MBAP (`PUSR USR-DR164 :502`)**:
   - Strict read-only pilot safety gate (`pilot_readonly = true`, `allowed_function_codes_pilot = [0x03]`, `0` bus writes; explicitly rejects `:5502` raw RTU-over-TCP mismatch).
   - Bounded MBAP TCP stream parser (`4096 B`), TxID/UnitID/generation correlation, CRC-16 (`0xA001`) validation on serial RTU, signed `0.1 °C` / `0.1 %RH` decoding, and `0x7FFF` probe-fault sentinel handling.
6. **Authoritative Session Engine, Grounding Filter (`IA-04`) & Compliance Exports**:
   - Persistent SQLite session state (`Identify -> As-Found -> Inspect -> Verify Modbus -> Review -> Close`) with explicit technician confirmation required before logging any physical change (`DAT-03` / `DAT-04`).
   - Deterministic grounding filter (`0 False Claims`: blocks unverified `SCADA`, `PLC`, `calibrated`, or out-of-range page claims).
   - Exports `.PDF` + `.JSON` maintenance dossiers (with `public_demo` serial masking), AutoCAD R12 `.DXF`, binary `.STL`, and 4-angle `.ZIP`/`.EML` sign-off bundles.
7. **Permanent System-Wide Anti-Regression & Dependency Audit Gate**:
   - `scripts/audit_no_regressions.py` + `tests/test_system_integrity_audit.py` run automatically inside `scripts/build_ipad_m4_app.sh` and `pytest`, enforcing acyclic module dependencies, 100% English-only source files, PTT/Barge-In/3D-Twin/Manual invariants, CoreAudio serial-queue isolation, and 100% SHA-256 `BundleResources` parity.
8. **Ed25519 Signed Package Store, Multi-Doc/GLB Adapter & Opt-In HTTPS Cloud Catalog (`docs/12_CLOUD_CATALOG_CONTRACT_AND_RUNBOOK.md`)**:
   - Launches 100% offline (`sync_enabled = false`, `0` WAN requests, iPadOS `NWListener` bound strictly to `127.0.0.1:8088`).
   - Verifies detached Ed25519 manifest envelopes (`CryptoKit.Curve25519` on iPadOS + RFC 8032 in Python), blocks duplicate JSON keys, rollbacks, unsafe paths, and external GLB URIs, and serves verified `.pdf` (`12+` multi-document pages) and self-contained `.glb` 3D twins via local `206` Byte-Range streaming with immutable `catalog_context` session pinning.

---

## Complete Repository Structure

```text
FieldScan/
├── README.md                                  # Architecture, directory map, quick start & verification guide
├── MEGAPLAN_IPAD_M4_12GB.md                   # Contract v2.1.0 specification & iPad Air M4 (12 GB) design
├── pyproject.toml                             # Python 3.10+ project metadata & dependencies (uv / pytest)
├── uv.lock                                    # Deterministic Python lockfile
├── .gitignore                                 # Excludes weights (vendor/), .venv/, ios/build/, dylibs & runtime DBs
│
├── src/fieldscan/                             # Modular Python Backend & Shared Contract Reference
│   ├── server.py                              # FastAPI HTTP/HTTPS studio server (:8088 / :8443) & REST endpoints
│   ├── lfm_engine.py                          # Local VLM (Qwen3-VL-4B / LFM3-VL-2B), Audio ASR & Piper English TTS
│   ├── manual_navigator.py                    # 9-page datasheet topic/section resolver & auto-open flags
│   ├── twin_controller.py                     # Deterministic 3D Digital Twin manipulation (`twin_action`) leaf module
│   ├── scene_and_chat_router.py               # Intent router (general_chat, scene_vision, manual_lookup, sensor_diagnostics)
│   ├── video_scanner.py                       # 30 FPS OpenCV UVC scanner, skin/tool masking & DIP-8 deskewed macro
│   ├── modbus_rtu.py                          # FT2232HL USB-RS485 Modbus-RTU master, CRC-16 (0xA001) & simulator
│   ├── modbus_tcp.py                          # PUSR USR-DR164 (:502) MBAP stream parser & read-only FC03 client
│   ├── session_engine.py                      # Authoritative SQLite session state machine, grounding filter & PDF/JSON exporter
│   ├── profiles_and_manual.py                 # Versioned device profiles (tzone_tht02, tzone_tht03r) & SHA-256 verifier
│   ├── calibration_contract.py                # Read-only reference thermometer/hygrometer comparison contract (CAL-00..09)
│   ├── live_repair.py                         # 4-step closed-loop guided repair & Andon stack-light coordinator
│   ├── cad_builder.py                         # Server-side parametric AutoCAD .DXF & binary .STL generator
│   └── escalator.py                           # Offline store-and-forward .ZIP + RFC-5322 .EML sign-off packager
│
├── ios/                                       # Native Standalone iPad Air M4 (12 GB RAM) App (Swift / Xcode)
│   ├── FieldScanM4.xcodeproj/                 # Xcode project (arm64-apple-ios17.0, Bundle ID com.fieldscan.tht02.ipadm4)
│   └── FieldScanM4/
│       ├── AppDelegate.swift                  # App lifecycle, Metal llama-server warmup & loopback HTTP startup
│       ├── SceneDelegate.swift                # Full-screen iPadOS window & scene management
│       ├── FieldScanWebViewController.swift   # WKWebView host, native JS bridge & share-sheet export handler
│       ├── StandaloneFieldScanServer.swift    # Embedded NWListener HTTP server, en-US ASR/TTS, PTT & .voiceChat Barge-In
│       ├── FieldScanConversationEngine.swift  # 1:1 Swift intent router, Qwen3-VL-4B / FoundationModels client & fallbacks
│       ├── FieldScanTwinController.swift      # 1:1 Swift 3D Digital Twin controller (`twin_action` & DIP-8 rocker math)
│       ├── FieldScanManualNavigator.swift     # 1:1 Swift 9-page datasheet section resolver & lightbox triggers
│       ├── FieldScanVisionDetector.swift      # 1.96 ms O(1) integral-image carpet-proof cylinder & 8-pin DIP-8 detector
│       ├── FieldScanSessionEngine.swift       # 1:1 Swift session engine, IA-04 grounding filter & CoreGraphics PDF builder
│       ├── ModbusTCPClient.swift              # Native NWConnection MBAP TCP (:502) client & stream parser
│       ├── NativeCameraBridge.swift           # 30 FPS AVFoundation back-camera capture & orientation normalization
│       ├── LlamaServerBridge.swift            # Dynamic libllama-server-impl.dylib loader & health/warmup poller
│       ├── FieldScanRuntimeConfig.swift       # M4 12 GB unified memory budget & runtime flags
│       ├── PythonRuntimeBridge.swift          # Optional embedded runtime bridge stub
│       ├── Info.plist                         # Camera, Microphone, Speech Recognition & Local Network permissions
│       └── FieldScanM4.entitlements           # Increased memory limit entitlement for on-device VLM on iPad Air M4
│
├── static/                                    # Air-Gapped Widescreen SCADA & 3D Digital Twin HMI (0 External CDNs)
│   ├── index.html                             # Widescreen studio layout, 3D stage, SCADA deck, chat & 9-page manual viewer
│   ├── styles.css                             # Industrial dark-slate HMI tokens, Andon tower & cyan `.is-guided` 3D callouts
│   ├── app.js                                 # Three.js 1:1 CAD rig, `applyTwinAction`, Spatial CV HUD, PTT & Barge-In VAD
│   └── vendor/                                # Bundled Three.js v0.170, OrbitControls, STLExporter, uPlot, Lucide & Open Props
│
├── knowledge/                                 # Verified Device Profiles, Manual Index, Manifest & Golden Vectors
│   ├── THT02_spec.json                        # Canonical dimensional, electrical, DIP-8 & fault specification
│   ├── manual_index.json                      # Page-by-page verified section excerpts & SHA-256 index
│   ├── resource_manifest.json                 # 26-file SHA-256 tree manifest synced into iOS BundleResources
│   ├── profiles/                              # `tzone_tht02.json` & `tzone_tht03r.json`
│   └── fixtures/golden_contracts_v2_1.json    # Golden MBAP frames, voice intents & adversarial safety test corpus
│
├── assets/                                    # Official TZ THT-02 Datasheet & Rendered High-DPI Pages
│   ├── THT02_Users_Manual_v1.1.pdf            # Official 9-page datasheet (SHA-256 verified at runtime)
│   └── manual_pages/page_1.png .. page_9.png  # Pre-rendered pages for offline drawer & full-screen lightbox
│
├── scripts/                                   # Build, Sync, Startup & Permanent Anti-Regression Tooling
│   ├── download_assets.sh                     # Downloads llama.cpp + GGUF models + Piper voice into local `vendor/`
│   ├── start_all.sh                           # Starts local VLM (:8091), Audio ASR (:8092), HTTP (:8088) & HTTPS (:8443)
│   ├── sync_manifest.py                       # Verifies SHA-256 manifest & syncs `ios/FieldScanM4/BundleResources`
│   ├── audit_no_regressions.py                # Permanent DAG, English-only, PTT, Barge-In, 3D Twin & Bundle audit gate
│   ├── build_ipad_m4_app.sh                   # Full iPad Air M4 verification, Xcode build & USB-C deployment script
│   └── run_swift_contract_tests.swift         # Native Swift CLI contract, MBAP, grounding, 3D Twin & vision test runner
│
├── tests/                                     # Automated Python + Swift Anti-Regression Suite (80 Tests)
│   ├── test_system_integrity_audit.py         # Runs `audit_no_regressions.py` inside pytest
│   ├── test_modular_ai_manual_vision.py       # Tests English intent router, `twin_action`, manual lookup & carpet vision
│   ├── test_megaplan_contracts_and_matrix.py  # Tests Contract v2.1.0, MBAP TCP, SQLite sessions & Swift parity binary
│   ├── test_cloud_catalog_megaplan_matrix.py  # Tests all 42 Cloud Catalog cases (`M4-BASE-01` .. `M4-END-01`)
│   └── test_fieldscan_glue.py                 # Tests 100% English repo gate, CAD DXF/STL, Modbus CRC-16 & repair loop
│
└── docs/                                      # Hardware, AI, CAD, Modbus, iPad M4 & Cloud Catalog Guides (01..13)
    ├── 01_HARDWARE_USB_CAMERA_GLUE.md
    ├── 02_LIQUID_LFM3_LLAMA_CPP_GLUE.md
    ├── 03_PDF_TO_THREEJS_CAD_GLUE.md
    ├── 04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md
    ├── 05_HACKATHON_2H_RECREATION_RUNBOOK.md
    ├── 06_MODBUS_RS485_LIVE_REPAIR_GLUE.md
    ├── 07_MAC_MINI_LOCAL_TESTING_GUIDE.md
    ├── 08_IPAD_AIR_M4_12GB_NATIVE_APP_GLUE.md
    ├── 09_BASELINE_AND_CAPABILITY_MATRIX.md
    ├── 10_BENCH_SETUP_EVENT_RUNBOOK_AND_TEST_MATRIX.md
    └── 11_SECTION14_EXECUTION_LOG.yaml
```

---

## Quick Start

### 1. Mac Mini / Linux Workstation
```bash
# 1. Install Python environment via uv
uv sync

# 2. Download local GGUF models (Qwen3-VL-4B / LFM3) + llama.cpp + Piper voice into ./vendor/
./scripts/download_assets.sh

# 3. Launch full offline workstation (HTTP :8088 + USB-C iPad HTTPS :8443)
./scripts/start_all.sh --usb-ipad
```

### 2. Native iPad Air M4 (12 GB RAM) App
```bash
# Sync BundleResources, run anti-regression audit, typecheck Swift & build Release-iphoneos bundle
./scripts/build_ipad_m4_app.sh --unsigned

# Or open ios/FieldScanM4.xcodeproj in Xcode, select your iPad Air M4, and press Cmd+R
open -a Xcode ios/FieldScanM4.xcodeproj
```

### 3. Run Permanent Anti-Regression Audit & Full Test Suite
```bash
uv run python scripts/sync_manifest.py --sync-bundle --verify
uv run python scripts/audit_no_regressions.py
uv run pytest -q
```
