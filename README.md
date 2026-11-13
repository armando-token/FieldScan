# FieldScan CAD v2.0 — Closed-Loop Offline Twin, Live Repair & Modbus-RTU SCADA (`TZ THT-02`)

A **100% On-Device / Offline (Airplane Mode)** industrial field engineering and SCADA diagnostics workstation engineered for **Qualcomm Dragonwing IQ-9075 (`IQ9`)**, **Mac Mini (`Apple Silicon Metal` / `Intel`)**, and **Linux `x86_64`**, powered locally by **Liquid Foundation Models (`LFM3-VL-2B` & `LFM3-Audio-2B`)** and **Piper Neural TTS (`en_US-lessac-medium.onnx`)**.

## Architecture v2.0 (~3.0 GB Total RAM · Zero Internet · Zero External CDNs)

1. **Real-Time Optical Video Scanner (`OpenCV` @ `30 FPS`, `< 4 ms/frame`)**:
   - Live USB UVC capture (`Acer 4K` via `CAP_V4L2` on Linux and `CAP_AVFOUNDATION` on macOS) paired with a deterministic industrial bench simulator backed by authentic `Tzone TZ THT-02` datasheet photography.
2. **100% Offline English Multimodal & Voice AI Stack (`llama.cpp` + `Piper Neural TTS`)**:
   - **`LiquidAI/LFM3-VL-2B-GGUF`** on `127.0.0.1:8091` (`--reasoning off --reasoning-budget 0 --image-max-tokens 128`) for visual fault localization, `DIP-8` inspection, and 2D PDF blueprint cross-referencing.
   - **`LiquidAI/LFM3-Audio-2B-GGUF`** on `127.0.0.1:8092` for offline **English** Automatic Speech Recognition (`16 kHz` mono PCM WAV normalized in-memory via `ffmpeg`).
   - **`Piper Neural TTS`** (`en_US-lessac-medium.onnx`) for `< 60 ms` offline **English** spoken operator guidance.
3. **Industrial Isolated USB-RS485 Modbus-RTU Master (`FT2232HL` Dual-Channel + `pyserial`)**:
   - Auto-discovers both serial channels on the **`FT2232HL`** isolated transceiver (`/dev/ttyUSB0..1` on Linux, `/dev/cu.usbserial-*` on macOS), validates exact Manual Page 7 poll frames (`01 03 00 00 00 08 44 0C`, CRC-16 `0xA001`), decodes signed temperature (`0.1 °C`), relative humidity (`0.1 %RH`), open-probe fault sentinel (`0x7FFF`), and computes `DIP-8` binary switch states (`128..1`, `Pin 8 ON` = `Slave 1`).
4. **Zero-Click Closed-Loop Autodiagnosis & Guided Repair (`LiveRepairCoordinator`)**:
   - **Stage 1 (`Inspect Fault` · Andon `RED`)**: Detects an unscrewed housing + misconfigured `DIP-8` pins + silent RS-485 bus, explodes the `Three.js` 3D digital twin at `60 FPS` with red fault stain highlighting, illuminates the **Red** Andon tier, and speaks the English root-cause diagnosis.
   - **Stage 2 (`Guide DIP-8` · Andon `AMBER`)**: Shifts the Andon stack light to **Amber** and speaks the exact binary switch prescription (`Pins 1..7 OFF`, **Pin 8 ON** for `Slave 1` @ `9600 8N1`).
   - **Stage 3 (`Zero-Click Reactive Recovery` · Andon `GREEN`)**: The instant the physical `TZ THT-02` sensor is powered on the `FT2232HL` RS-485 bus, the watchdog validates live Modbus-RTU frames (`CRC-16 OK`), closes the 3D twin, turns the Andon stack light **Green**, streams real-time `°C` and `%RH` curves on `uPlot`, and speaks hands-free English confirmation without touching keyboard or mouse.
5. **Open-Source Widescreen Industrial HMI (`static/vendor/` · `0` External CDNs)**:
   - Bundled completely locally for strict Airplane Mode compliance: **`Three.js v0.170`** (`60 FPS` 1:1 parametric 3D reconstruction & red fault stain comparison), **`uPlot v1.6.32`** (Grafana's real-time SCADA telemetry chart), **`Lucide v1.72`** (industrial vector icons), **`Open Props`** (CSS design tokens), and a **Virtual/Physical 3-Tier Andon Stack Light (`Red / Amber / Green`)**.
6. **4-Angle 3D Manufacturer Compliance & Warranty Dossier (`Store-and-Forward Outbox`)**:
   - Compiles **4 dimensioned WebGL 3D views** (`Isometric`, `Front Elevation 140×Ø16 mm`, `Exploded DIP-8`, `IP65 Cable Gland`), a chronological **Before / During / After** camera audit strip, AutoCAD **`.DXF`** + binary **`.STL`** CAD models, and an RFC-5322 **`.EML`** sign-off package (`X-FieldScan-SignOff-Request: TRUE`) requesting IP65 warranty validation from the manufacturer.

## Quick Start (Mac Mini / Qualcomm IQ-9075 / Linux)

```bash
# 1. Pre-cache native OS/CPU llama.cpp + LFM3-VL-2B + LFM3-Audio-2B + Piper English Voice (while online)
./scripts/download_assets.sh

# 2. Launch the full offline stack on loopback (127.0.0.1:8091, :8092, and Widescreen HMI :8088)
./scripts/start_all.sh
```

## Technical Glue Guides (Mac Mini Rehearsal & 2-Hour Hackathon Runbook)

- [`docs/01_HARDWARE_USB_CAMERA_GLUE.md`](docs/01_HARDWARE_USB_CAMERA_GLUE.md) — Acer 4K UVC Camera & Qualcomm Dragonwing IQ-9075 Hardware Glue
- [`docs/02_LIQUID_LFM3_LLAMA_CPP_GLUE.md`](docs/02_LIQUID_LFM3_LLAMA_CPP_GLUE.md) — Liquid AI (`LFM3-VL-2B` + `LFM3-Audio-2B`), `llama.cpp` & Piper English TTS Glue
- [`docs/03_PDF_TO_THREEJS_CAD_GLUE.md`](docs/03_PDF_TO_THREEJS_CAD_GLUE.md) — 2D PDF Manual to `Three.js v0.170`, `uPlot` HMI & AutoCAD `.DXF`/`.STL` Glue
- [`docs/04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md`](docs/04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md) — 100% Offline English Voice Loop & Store-and-Forward Outbox Glue
- [`docs/05_HACKATHON_2H_RECREATION_RUNBOOK.md`](docs/05_HACKATHON_2H_RECREATION_RUNBOOK.md) — 2-Hour Hackathon Recreation Runbook & 120-Second English Judge Pitch
- [`docs/06_MODBUS_RS485_LIVE_REPAIR_GLUE.md`](docs/06_MODBUS_RS485_LIVE_REPAIR_GLUE.md) — `FT2232HL` Isolated RS-485 Wiring, `DIP-8` Math & Closed-Loop Live Repair Glue
- [`docs/07_MAC_MINI_LOCAL_TESTING_GUIDE.md`](docs/07_MAC_MINI_LOCAL_TESTING_GUIDE.md) — Mac Mini Native Hardware Testing & Airplane-Mode Rehearsal Guide
