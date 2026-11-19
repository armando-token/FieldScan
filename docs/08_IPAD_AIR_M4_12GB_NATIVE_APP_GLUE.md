# 08 — iPad Air M4 (12 GB Unified RAM) Native App & USB-C Hardware Glue Architecture

## 1. Executive Overview & 12 GB Unified Memory Budget

FieldScan CAD v2.0 (`TZ THT-02` Closed-Loop Repair & SCADA Twin) is engineered to run with 100% functional parity on the **Apple iPad Air M4 (12 GB LPDDR5X Unified Memory, 9-Core Metal 3 GPU, 16-Core Neural Engine)** both as a standalone offline iPadOS application (`ios/FieldScanM4`) and over a zero-latency USB-C NCM tether (`en6`: `169.254.37.69` <-> `169.254.45.65`).

### 1.1 Memory Allocation on iPad Air M4 (12 GB RAM)

With the official Apple entitlement `com.apple.developer.kernel.increased-memory-limit = true` and `com.apple.developer.kernel.extended-virtual-addressing = true` enabled in `ios/FieldScanM4/FieldScanM4.entitlements`, iPadOS unlocks up to **8.5–9.0 GB** of usable unified memory for the FieldScan process—leaving over **5.0 GB of headroom** above the entire multimodal stack:

| Subsystem | Model / Artifact | Resident Unified RAM | Compute Backend |
|---|---|---|---|
| **Vision-Language Engine (`:8091`)** | `LFM3-VL-2B-QAD-Q4_0.gguf` (1.05 GB) + `mmproj-LFM3-VL-2B-Q8_0.gguf` (203 MB) | `~1.45 GB` | Metal 3 GPU (`-ngl 99`) |
| **Speech ASR Engine (`:8092`)** | `LFM3-Audio-2B-Q4_0.gguf` (1.05 GB) + `mmproj-LFM3-Audio-2B-Q8_0.gguf` (161 MB) | `~1.35 GB` | Metal 3 GPU (`-ngl 99`) |
| **Offline Neural TTS** | `en_US-lessac-medium.onnx` (`PiperVoice`) | `~0.08 GB` | CPU / Accelerate |
| **Spatial Vision & CAD Core (`:8088`)** | OpenCV 30 FPS + NumPy + `ezdxf` + `PyMuPDF` + FastAPI | `~0.28 GB` | ARM64 NEON / Accelerate |
| **Widescreen 3D HMI (`WKWebView`)** | `Three.js v0.170` (60 FPS WebGL2) + `uPlot v1.6.32` | `~0.19 GB` | WebKit Metal 3 Compositor |
| **Total Active Footprint** | **All subsystems resident simultaneously** | **`~3.35 GB` / `12.0 GB`** | **Zero swap / Zero Jetsam** |

---

## 2. Solving the 4 iPadOS Sandbox Constraints Without Losing Any Capabilities

| iPadOS Sandbox Constraint | Desktop macOS Implementation | iPad Air M4 (12 GB) Native & Hybrid Solution |
|---|---|---|
| **1. No external `fork()` / `subprocess.Popen`** | `start_all.sh` spawns external `llama-server` binaries; `lfm_engine.py` invokes `ffmpeg` via `subprocess.run`; `vision_scanner.py` spawns `mac_uvc_worker.py`. | **In-Process Execution**: `LlamaServerBridge.mm` runs `LFM3-VL-2B` (`127.0.0.1:8091`) and `LFM3-Audio-2B` (`127.0.0.1:8092`) on background `std::thread` instances inside the app process. Audio normalization uses an in-memory NumPy/wave 16 kHz mono PCM resampler (`_normalize_to_16khz_mono_wav_in_memory`) with zero `ffmpeg` subprocess calls. Camera frames enter directly via in-memory buffers (`ingest_external_jpeg` / `NativeCameraBridge.swift`). |
| **2. Per-Process Memory Ceiling** | Unrestricted 8 GB macOS user space. | `FieldScanM4.entitlements` enables `com.apple.developer.kernel.increased-memory-limit` and `com.apple.developer.kernel.extended-virtual-addressing` to utilize the 12 GB M4 unified memory pool. |
| **3. No `/dev/cu.usbserial-*` Kernel Driver in iPadOS** | macOS mounts FTDI `FT2232HL` at `/dev/cu.usbserial-*`. | **Dual-Transport Modbus-RTU**: All 4 deterministic workbench simulators (`sim_disconnected`, `sim_abnormal_7fff`, `sim_online`, `sim_breath_test`) run 100% inside the iPad. For physical `FT2232HL` hardware, `modbus_rtu.py` transparently polls `tcp://169.254.37.69:5502` (`_poll_tcp_rs485_bridge`) served by `scripts/start_rs485_usb_bridge.py` over the USB-C tether or a local RS-485 gateway. |
| **4. Airplane-Mode Socket Guard (`offline_guard.py`)** | Blocks all non-`127.0.0.1` sockets. | `GLOBAL_OFFLINE_GUARD` strictly blocks all public internet IPs (`8.8.8.8:53`, `1.1.1.1`, etc.) while permitting `127.0.0.1` loopback and Apple USB-C NCM link-local tether addresses (`169.254.*.*` and `fe80::*` when `FIELDSCAN_ALLOW_USB_TETHER=1`). |

---

## 3. Direct USB-C Tether Mode (`en6`: `169.254.37.69`) & HTTPS Secure Context

When the iPad Air M4 is connected to the Mac Mini via a USB-C cable, macOS and iPadOS establish a high-speed, offline USB-C NCM network interface (`en6`):
- **Mac Mini Host IP**: `169.254.37.69`
- **iPad Air M4 Client IP**: `169.254.45.65` (`armandos-ipad.local`)

### 3.1 Launching the Stack with iPad USB-C & HTTPS Support

```bash
./scripts/start_all.sh --usb-ipad
```

`scripts/start_all.sh` automatically:
1. Starts `LiquidAI/LFM3-VL-2B` on `127.0.0.1:8091` and `LiquidAI/LFM3-Audio-2B` on `127.0.0.1:8092` with Metal GPU acceleration (`-ngl 99`).
2. Generates a self-signed X.509 certificate (`logs/ipad_tls.crt` and `logs/ipad_tls.key`) covering `IP:127.0.0.1`, `IP:169.254.37.69`, `IP:10.0.0.15`, and `DNS:localhost`.
3. Serves HTTP on `http://0.0.0.0:8088` (`http://169.254.37.69:8088`) and HTTPS on `https://0.0.0.0:8443` (`https://169.254.37.69:8443`) so iPad Safari / `WKWebView` operates in a Secure Context (`window.isSecureContext === true`) and grants `navigator.mediaDevices.getUserMedia` for the iPad's built-in camera and microphone.

---

## 4. In-Memory 16 kHz Mono PCM WAV Pipeline (Zero `ffmpeg` Subprocess)

To guarantee voice ASR works inside the iPadOS sandbox (where spawning an external `ffmpeg` binary is forbidden):
1. **Frontend WebAudio Encoder (`static/app.js`)**: Captures raw floating-point audio samples directly from `AudioContext`, downsamples to `16000 Hz` mono, and encodes a canonical 44-byte RIFF `WAVE` (`PCM_16`) payload in memory before posting to `/api/voice`.
2. **Backend In-Memory Normalizer (`src/fieldscan/lfm_engine.py`)**: Parses incoming RIFF WAV containers (8-bit, 16-bit, 24-bit, 32-bit int, or 32-bit IEEE float, mono or stereo, at any sample rate such as 44.1 kHz or 48 kHz), mixes stereo channels to mono, linearly resamples to `16000 Hz` via `numpy.interp`, and writes a clean 16-bit PCM WAV buffer in memory without invoking `subprocess.run(["ffmpeg", ...])`.

---

## 5. USB-C / TCP to RS-485 `FT2232HL` Hardware Bridge (`port 5502`)

Because iPadOS does not expose FTDI VCP `/dev/cu.usbserial-*` nodes directly to sandboxed apps, FieldScan CAD v2.0 includes a lightweight, byte-exact Modbus-RTU TCP bridge:

### 5.1 Starting the RS-485 Bridge on the Mac Mini

```bash
# Bridge physical FT2232HL (/dev/cu.usbserial-*) to TCP port 5502:
./scripts/start_rs485_usb_bridge.py --host 0.0.0.0 --port 5502

# Or run with deterministic Slave #1 fallback when testing without physical RS-485 hardware:
./scripts/start_rs485_usb_bridge.py --host 0.0.0.0 --port 5502 --sim-slave 1
```

### 5.2 Polling the Bridge from `modbus_rtu.py`

In `src/fieldscan/modbus_rtu.py`:
- Setting `FIELDSCAN_RS485_BRIDGE=169.254.37.69:5502` (or running on `FIELDSCAN_PLATFORM=ios` with `169.254.37.69:5502` reachable) registers `tcp://169.254.37.69:5502` in `discover_serial_ports()`.
- `_poll_tcp_rs485_bridge(host_port, slave_id, baud_bps, timeout_s=0.35)` opens a TCP stream socket, transmits the exact 8-byte Modbus-RTU Function `0x03` frame (`01 03 00 00 00 08 44 0C`), reads back the 21-byte response frame, verifies the little-endian `0xA001` CRC-16, and feeds the decoded registers into the 2 Hz SCADA telemetry loop and Stage 3 Zero-Click Reactive Recovery.

---

## 6. Native iPadOS Application (`ios/FieldScanM4`)

The `ios/FieldScanM4` directory contains the native Xcode target for iPad Air M4 (iPadOS 17.0+, `arm64`):
- **`FieldScanM4.entitlements`**: Requests `com.apple.developer.kernel.increased-memory-limit` and `com.apple.developer.kernel.extended-virtual-addressing` for 12 GB unified RAM access.
- **`Info.plist`**: Declares `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocalNetworkUsageDescription`, widescreen landscape orientations, and `UIFileSharingEnabled` for exporting `.DXF`, `.STL`, `.EML`, and `.ZIP` sign-off dossiers to the iPad Files app.
- **`LlamaServerBridge.mm`**: Objective-C++ bridge managing embedded `llama.cpp` Metal inference threads on `127.0.0.1:8091` (`LFM3-VL-2B`) and `127.0.0.1:8092` (`LFM3-Audio-2B`).
- **`PythonRuntimeBridge.swift`**: Boots the embedded Python runtime (`FIELDSCAN_PLATFORM=ios`) serving `fieldscan.server:app` on `127.0.0.1:8088`.
- **`NativeCameraBridge.swift`**: Streams 30 FPS frames from the iPad Air M4 rear camera or an attached USB-C UVC camera (`AVCaptureDevice.DeviceType.external`) directly into `VisionScanner`.
- **`FieldScanWebViewController.swift`**: Fullscreen landscape `WKWebView` with hardware-accelerated WebGL2 (`Three.js v0.170`), automatic camera/microphone permission grant, and native share sheet integration.
