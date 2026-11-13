# 05 — 2-Hour Hackathon Recreation Runbook (`6:30 PM – 8:30 PM`) & 120-Second English Judge Pitch

This time-boxed runbook eliminates every hardware, serial-port, and offline-network bottleneck at the **On-Device AI Hackathon: Cleared for Takeoff (Qualcomm × Liquid AI)** for FieldScan CAD v2.0 (**Live Visual Autodiagnosis + Guided `DIP-8` Repair + `FT2232HL` RS-485 SCADA Validation + 4-View Manufacturer Warranty Dossier**).

---

## Pre-Flight Checklist Before Wi-Fi Cutoff (`5:30 PM – 6:35 PM` · Mandatory)

1. **Attach Physical Hardware to the Qualcomm Dragonwing IQ-9075 (`IQ9`) via USB-C 3.0 Hub on `JUSB1`**:
   - **Acer 4K USB Camera** (slide open the physical lens privacy shutter).
   - **`FT2232HL` Dual-Channel Isolated USB-to-RS485 Converter** wired to the **`Tzone TZ THT-02`** (`Red -> DC 5-24V+`, `Black -> Common GND`, `Yellow -> RS485 A+`, `Green -> RS485 B-`).
   - Grant immediate user-space serial and video permissions on Linux:
     ```bash
     sudo chmod 666 /dev/ttyUSB*
     ls -l /dev/video* /dev/ttyUSB*
     ```
2. **Pre-Cache Native Binaries, GGUF Weights & English Voice Models (While Venue Wi-Fi Is Active)**:
   ```bash
   ./scripts/download_assets.sh
   ```
   *(Keep a USB-C flash drive backup of the `~2.4 GB` `vendor/` folder in your pocket for instant zero-network recovery).*

---

## Organic 2-Hour Build Schedule (`6:30 PM – 8:30 PM`)

| Minute | Build Block | Core Integration ("The Glue") | Instant Verification |
| :---: | :--- | :--- | :--- |
| `00–20` | **Block 1: Liquid AI Local Engine** | Launch `llama-server` on `127.0.0.1:8091` (`LiquidAI/LFM3-VL-2B-GGUF`, `--reasoning off --reasoning-budget 0 --image-max-tokens 128`) and `127.0.0.1:8092` (`LiquidAI/LFM3-Audio-2B-GGUF` English ASR) + load `Piper` `en_US-lessac-medium.onnx`. | `curl --noproxy '*' http://127.0.0.1:8091/health` → `{"status":"ok"}` |
| `20–45` | **Block 2: PDF Blueprint + Modbus-RTU Bus** | Wire `pdf_ingest.py` (`THT02_Users_Manual_v1.1.pdf`) and `modbus_rtu.py` (`FT2232HL` dual-channel scan, CRC-16 `0xA001`, poll frame `01 03 00 00 00 08 44 0C`, `0x7FFF` sentinel, `DIP-8` binary switch math). | Confirm `01 03 00 00 00 08 44 0C` poll and live `°C / %RH` decode. |
| `45–75` | **Block 3: 30 FPS Vision + Live Repair Loop** | Connect `vision_scanner.py` + `live_repair.py` + `cad_exporter.py` (Before/During/After photo audit strip + 4-angle CAD sheet + `.DXF`/`.STL`/`.EML` offline outbox). | Verify zero-click reactive transition when DC power energizes the sensor. |
| `75–105` | **Block 4: Widescreen Open-Source HMI** | Connect `server.py` (`127.0.0.1:8088`) with local `static/vendor/` (`Three.js v0.170` 60 FPS twin & red fault stain comparison, `uPlot v1.6.32` SCADA chart, `Lucide v1.72`, `Open Props`, 3-Tier `Red/Amber/Green` Andon Stack Light). | Orbit 3D twin at `60 FPS`, verify `uPlot` trace and 4-view WebGL capture. |
| `105–120` | **Block 5: Airplane-Mode Dress Rehearsal** | **Turn off Wi-Fi ourselves 15 minutes before the judges**, stage the physical `TZ THT-02` unscrewed with misconfigured `DIP-8` pins and DC power OFF, and run 3 full rehearsals. | Confirm `AIRPLANE MODE: VERIFIED (0 EXT SOCKETS)` and Andon transitions. |

---

## Winning 120-Second Live English Pitch Script (`8:30 PM` · Judge Demo)

1. **`0:00 – 0:20` · The Real-World Plant Problem (holding the unscrewed, unpowered `TZ THT-02` in hand)**:
   > *"Imagine an underground mine, an offshore rig, or an aircraft hangar with zero internet. We just found this industrial `TZ THT-02` transmitter unscrewed, misconfigured, and completely silent on the RS-485 bus. We have no cloud and no 3D CAD files—only a flat 2D PDF manual and this Qualcomm Dragonwing IQ-9075 running 100% offline."*

2. **`0:20 – 0:50` · Live Visual + Spoken English Autodiagnosis (Stages 1 & 2 · Andon `RED` → `AMBER`)**:
   - Place the open sensor under the **Acer 4K** camera and speak in English: **"I found this sensor open and dead on the RS-485 line. Configure it for standard Modbus Slave 1—check the DIP switches."**
   - The **`Three.js v0.170` 60 FPS digital twin automatically explodes**, highlighting the internal PCB and red fault zone while the **3-Tier Andon Stack Light shifts from Red to Amber**. Cross-referencing Manual Pages 4 and 5, `LFM3-VL-2B` + `Piper Neural TTS` (`en_US-lessac-medium.onnx`) speaks back in `< 60 ms`:
     > *"Housing is open, no RS-485 signal is present, and DIP-8 switches are misconfigured at Slave 176. For standard Modbus Slave 1 at 9600 8N1, set Pins 1 through 7 OFF and flip only Pin 8 ON, then power the RS-485 bus."*

3. **`0:50 – 1:30` · The Zero-Click Magic Moment (Physical Repair + Live `uPlot` SCADA · Andon `GREEN`)**:
   - Live in front of the judges, flip **Pin 8 ON** with a precision screwdriver and **turn ON the 5–24V DC power supply / plug into the `FT2232HL` RS-485 converter**.
   - **Without touching the keyboard or mouse**, the Qualcomm IQ-9075 detects valid Modbus-RTU frames (`01 03 00 00 00 08 44 0C`, `CRC-16 0xA001 OK`), closes the 3D digital twin, switches the **Andon Stack Light to Solid Green**, plots real room temperature and humidity live on the **`uPlot` SCADA chart**, and **speaks automatically**:
     > *"Connected and verified! Receiving valid Modbus-RTU telemetry from Slave 1..."*
   - Gently breathe onto the sintered stainless sensor tip → **judges watch `%RH` climb in real time on the `uPlot` SCADA chart**.

4. **`1:30 – 2:00` · Executive Close: 4-Angle 3D CAD & IP65 Warranty Sign-Off Dossier**:
   - Click **`4. 4-View Manufacturer Dossier`**: FieldScan captures 4 dimensioned WebGL 3D views (`Isometric`, `Front 140×Ø16 mm`, `Exploded DIP-8`, `IP65 Cable Gland`), attaches the **Before / During / After** camera audit strip, exports AutoCAD **`.DXF`** + **`.STL`**, and queues a complete RFC-5322 **`.EML`** package in the offline outbox requesting manufacturer IP65 warranty sign-off—with zero external network sockets.
