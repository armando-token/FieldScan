# Phase 0 Baseline Audit, Port Contracts & Capability Matrix

## 1. Repository & Build Baseline

| Item | Verified Value |
|---|---|
| Repository Root | `/Users/armandosilva/Projects/Beta_2` |
| Prior Branch Commit | `ce3daa5fb1beee317fa5ac156384a23e69ea7786` (`fix/macos-uvc-1080p-autozoom-modbus-stability`) |
| Restorable Snapshot Commit | `2d223bb` (`backup/pre-megaplan-20261119`) |
| Active Implementation Branch | `feat/fieldscan-megaplan-v2-validation` |
| Developer Toolchain | Xcode `27.2` (`Build 27B52`), SDK `iphoneos27.2` / `iphonesimulator27.2`, Swift `5.0` |
| Target Bundle Identifier | `com.fieldscan.tht02.ipadm4` (Team `ZT5222SBBL`, Deployment Target `iOS 17.0`, `arm64`) |
| Entitlements | `com.apple.developer.kernel.increased-memory-limit = true` |
| Physical iPad Connected | `Armando's iPad` — iPad Air 11-inch (M4) (`iPad16,8`, UDID `00008132-000C79663C8BC01C`, iPadOS `27.0.1` Build `24A446`, Developer Mode Enabled) |
| Active USB-C Link-Local (`en5`) | Mac Mini `169.254.125.35` (`armandos-mac-mini.local`) <-> iPad `169.254.183.85` (`armandos-ipad.local`) |
| Baseline Test Suite | `16 collected / 16 passed` (`tests/test_fieldscan_glue.py` + `tests/test_ipad_m4_port_parity.py`) |

## 2. Port & Protocol Contract Inventory

| Port | Default Bind | Service / Process | Framing & Protocol Contract |
|---|---|---|---|
| `:8088` | `127.0.0.1` (iPad Swift) / `0.0.0.0` (Mac FastAPI) | `StandaloneFieldScanServer` (Swift) or `uvicorn fieldscan.server:app` (Python) | HTTP/1.1 REST JSON + `multipart/x-mixed-replace` MJPEG stream + static offline HMI |
| `:8443` | `0.0.0.0` (Mac tether) | `uvicorn fieldscan.server:app --ssl-*` | HTTPS/1.1 for WebKit `getUserMedia` over USB-C link-local tether (`en5`/`en6`) |
| `:8091` | `127.0.0.1` | `llama-server` (`LFM3-VL-2B` / `Qwen3-VL-4B` / `LFM3-Omni-2B`) | OpenAI-compatible HTTP `/health`, `/v1/models`, `/v1/chat/completions` (text + vision) |
| `:8092` | `127.0.0.1` | `llama-server` (`LFM3-Audio-2B`) | OpenAI-compatible HTTP `/health`, `/v1/chat/completions` (`input_audio` WAV ASR) |
| `:5502` | `0.0.0.0` / `127.0.0.1` | `scripts/start_rs485_usb_bridge.py` | **Raw Modbus-RTU over TCP** (8-byte FC03 request with trailing CRC-16 `0xA001` -> 21-byte RTU response with CRC-16). **Not** Modbus TCP MBAP. |
| `:502` (configurable) | Bench LAN IP | PUSR `USR-DR164` Modbus Gateway | **Modbus TCP (MBAP + PDU)** (7-byte MBAP header `[TxID, Proto=0x0000, Len, UnitID]` + FC03 PDU; gateway translates to RS-485 RTU on serial side). |

## 3. Embedded iOS Dynamic Libraries Audit (`ios/FieldScanM4/Frameworks/`)

All 10 dynamic libraries are verified `Mach-O 64-bit arm64` built for `platform IOS`, `minos 17.0`, `sdk 27.2`:
- `libggml-base.0.dylib`, `libggml-blas.0.dylib`, `libggml-cpu.0.dylib`, `libggml-metal.0.dylib`, `libggml-rpc.0.dylib`, `libggml.0.dylib`
- `libllama.0.dylib`, `libmtmd.0.dylib`, `libllama-common.0.dylib`, `libllama-server-impl.dylib` (exports `__Z12llama_serveriPPc` and `__Z22llama_server_terminatev`)

## 4. Phase 1.1 Pre-Fix Overclaiming Surface Inventory

Before Phase 1 remediation, the following surfaces overstated provenance or scope and are replaced by source-accurate claims:

1. `src/fieldscan/modbus_rtu.py` (lines 691-693, 729-731, 758-760, 853): Returned `"SCADA ONLINE · VERIFIED"` and `"SCADA ONLINE · SIGNAL VERIFIED"` even in simulator mode (`sim_online`, `sim_breath_test`).
2. `src/fieldscan/live_repair.py` (lines 267, 539-543, 792, 898-902): Spoke `"Current calibrated values are ... Field repair successfully verified"` and labeled photo strip slot 3 `"3. AFTER (SCADA ONLINE)"`.
3. `ios/FieldScanM4/StandaloneFieldScanServer.swift` (lines 2287, 2479, 3343): Mirrored `"SCADA ONLINE · SIGNAL VERIFIED"` and `"Current calibrated values are ... Field repair successfully verified"` in Swift simulator and TTS.
4. `static/index.html` (lines 308, 715) & `static/app.js` (lines 2755, 4748): Displayed `"100% DIGITAL TWIN MATCH"`, `"NOMINAL · SCADA ONLINE"`, and `"SCADA ONLINE VERIFIED"`.
5. `src/fieldscan/modbus_rtu.py` (line 856): Included `drive_andon_relay` capable of emitting `0x05` coil writes if `FIELDSCAN_ANDON_RELAY_SLAVE` was set; locked disabled in pilot (`pilot_read_only = True`).

## 5. Bench Hardware Status at Baseline Execution

| Hardware Component | Baseline Presence | Impact on Test Protocol |
|---|---|---|
| `Armando's iPad` (iPad Air 11-inch M4, 12 GB) | **Connected & Paired** (`00008132-000C79663C8BC01C`) | Signed build, installation, process launch, memory telemetry, local loopback server, and WebKit origin tests run on physical hardware. |
| Local GGUF Weights (`vendor/models/`) & Piper TTS | **Present on Mac** (~8.5 GB) | Local AI provider manifest and fallback rules verified offline. |
| FTDI `FT2232HL` USB-RS485 (`/dev/cu.usbserial*`) | Not attached to USB bus during baseline run | Protocol/framing validated via loopback & PTY/TCP stubs; physical bus cases (`BUS-01`) logged `BLOCKED` pending physical cable attachment. |
| PUSR `USR-DR164` Modbus TCP Gateway (`:502`) | Not reachable on `10.0.0.0/24` during baseline run | Full MBAP stream parser, split-packet, exception, timeout, and reconnect tests pass against local MBAP test server; physical gateway case (`BUS-02`) logged `BLOCKED` pending powered gateway on isolated bench Wi-Fi. |
| Physical `TZ THT-02` (`11240221`) & `TZ THT-03R` | Not energized on RS-485 bus during baseline run | Profiles, read-only guards, and manual citations verified; live physical sensor runs (`BUS-01`, `BUS-02`, `BUS-11`) ready for bench rehearsal. |
