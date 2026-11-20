# 07 — Mac Mini Local Hardware Testing Guide (Acer 4K Camera + `FT2232HL` RS-485 + `TZ THT-02`)

This guide lets you run **the exact same full-stack system 100% locally on your Mac Mini**, wired directly to your physical USB camera, isolated RS-485 transceiver, and `TZ THT-02` sensor—including a complete **Wi-Fi OFF (Airplane Mode)** dress rehearsal.

---

## Why Running Natively on Your Mac Mini Is 10× Better Than Tunneling to a Cloud VM

1. **Direct Kernel Access to the Isolated RS-485 Bus (`FT2232HL`)**: Plugging the `FT2232HL` into macOS creates native serial character devices (`/dev/cu.usbserial-*`) with zero `sudo` setup. An HTTP browser tunnel to a remote cloud VM **cannot forward differential `RS-485 A+/B-` wires or `/dev/cu.*` serial ports** without fragile TCP-to-serial relays (`ser2net`/`socat`) that do not exist at the hackathon.
2. **Apple Silicon `Metal` GPU Acceleration (`-ngl 99`)**: `scripts/download_assets.sh` automatically pulls `llama-b12328-bin-macos-arm64.tar.gz` (or `macos-x64`) and `scripts/start_all.sh` enables `-ngl 99` on Metal. Both `LiquidAI/LFM3-VL-2B-GGUF` and `LiquidAI/LFM3-Audio-2B-GGUF` run at **60–100+ tokens/s**, paired with `< 60 ms` offline English speech from `Piper Neural TTS` (`en_US-lessac-medium.onnx`).
3. **Zero-Latency UVC Camera (`AVFoundation`) + Dual Microphones**: `src/fieldscan/vision_scanner.py` detects `Darwin` and opens your Acer 4K USB camera via `cv2.CAP_AVFOUNDATION` at `30 FPS` with zero network serialization lag.
4. **Authentic Airplane-Mode Dress Rehearsal**: Once assets are cached on your Mac Mini, you can **turn Mac Mini Wi-Fi completely OFF** and rehearse the full 120-second English judge pitch—verifying that `Three.js v0.170`, `uPlot v1.6.32`, `Lucide v1.72`, and `Open Props` render from `static/vendor/` with `0` external sockets.

---

## Step 1 — Wire & Connect Physical Hardware to Your Mac Mini

1. Plug the **Acer 4K USB Camera** into a USB port on your Mac Mini (and slide open the lens privacy shutter).
2. Wire your **`Tzone TZ THT-02`** sensor to Channel 1 (`CH-A`) of the **`FT2232HL` Dual-Channel Isolated USB-to-RS485 Converter** and your **DC bench supply (`5–24V`)**:
   - **`Red -> DC 5-24V+`** (`12V DC` recommended; supports `5V..24V`, min `500 mA`).
   - **`Black -> Common GND`** (tie DC supply `-` and `FT2232HL` Channel 1 `GND` together).
   - **`Yellow -> RS485 A+`** (`A+` terminal on `FT2232HL` Channel 1).
   - **`Green -> RS485 B-`** (`B-` terminal on `FT2232HL` Channel 1).
3. Plug the **`FT2232HL`** USB cable into the Mac Mini (keep the DC supply switched **OFF** initially so you can simulate the dead RS-485 bus and trigger the live zero-click recovery on cue).
4. Verify in macOS Terminal that Apple's built-in FTDI driver enumerated both channels:
   ```bash
   ls -l /dev/cu.usbserial*
   ```

---

## Step 2 — Pre-Cache Assets & Launch Stack (3 Commands in macOS Terminal)

```bash
# 1. Enter the project directory
cd fieldscan_tht02

# 2. (WITH WI-FI ON — takes ~2 min on fiber)
# Downloads native macOS llama.cpp + LFM3-VL-2B + LFM3-Audio-2B + Piper en_US-lessac-medium.onnx + pyserial
./scripts/download_assets.sh

# 3. (RECOMMENDED: TURN OFF MAC MINI WI-FI NOW TO VERIFY AIRPLANE MODE!)
# Starts LFM3-VL (:8091) + LFM3-Audio (:8092) + FieldScan Widescreen HMI (:8088)
./scripts/start_all.sh
```

Once `Application startup complete` appears in Terminal, open Chrome or Safari on your Mac Mini at **`http://127.0.0.1:8088`**.

---

## Step 3 — Exact Live Hardware Rehearsal Walkthrough (100% English)

1. In the top scanner bar, switch the camera source to **Live USB Camera (`/dev/video0` / `AVFoundation`)** to frame your physical `TZ THT-02` under the Acer 4K lens.
2. In the **Modbus-RTU SCADA** panel, click **Scan USB-RS485** (selecting the physical `FT2232HL` `/dev/cu.usbserial-*` interface). With DC power switched OFF or `DIP-8` misconfigured, bus status reads `NO SIGNAL` and the **3-Tier Andon Stack Light** glows **Red**.
3. Unscrew the middle barrel of the sensor to expose the blue `DIP-8` PCB and click **`1. Inspect Fault`** (or hold **Talk to AI** and say in English: *"I found this sensor open and unresponsive—does it work?"*). Watch `Three.js v0.170` explode the 3D twin with red fault stain highlighting while `Piper` speaks the diagnosis in English.
4. Click **`2. Guide DIP-8`** (or say in English: *"I need standard Modbus Slave 1, check the DIP switches"*). The Andon stack light shifts to **Amber** and the AI prescribes setting `Pins 1..7 OFF` and **`Pin 8 ON`** (`Slave 1`, `9600 8N1`).
5. Flip **`Pin 8 ON`** on your physical `TZ THT-02` and **switch ON the 5–24V DC power supply / connect RS-485**:
   - **Hands-free (zero clicks!)**: within `< 1 second`, FieldScan validates live `01 03 00 00 00 08 44 0C` (`CRC-16 0xA001`) frames from the `FT2232HL`, closes the 3D twin, switches the **Andon Stack Light to Green**, plots real room temperature and humidity (`°C` and `%RH`) on the **`uPlot v1.6.32`** SCADA chart, and **speaks aloud in English confirming the repair is verified**.
   - Breathe gently onto the porous sintered tip to watch `%RH` rise in real time on `uPlot`.
6. Click **`4. 4-View Manufacturer Dossier`** to compile the 4 dimensioned WebGL 3D views + chronological Before/During/After camera strip + AutoCAD `.DXF` + `.STL` + offline `.EML` manufacturer warranty sign-off bundle.
