# 06 — Isolated USB-RS485 (`FT2232HL`) Wiring, Guided `DIP-8` Repair & Manufacturer Sign-Off Glue

This document specifies the exact electrical wiring, Modbus-RTU frame math, OS serial permissions, and reactive state machine connecting the **`FT2232HL` Dual-Channel Isolated USB-to-RS485 Converter**, the physical **`Tzone TZ THT-02`** transmitter, the offline English voice engine, and the **4-Angle 3D Manufacturer Compliance Dossier**.

---

## 1. Exact Physical RS-485 & Power Wiring (`Tzone TZ THT-02` ↔ `FT2232HL` + DC Supply)

Per **Page 4, Section 3.2 of the `TZ THT-02` User Manual V1.1**:

| `TZ THT-02` Wire Color | Signal Function | Bench Termination (`FT2232HL` + External DC Supply) |
| :--- | :--- | :--- |
| **`Red`** | `VDD` (`DC 5–24V+`) | **`Red -> DC 5-24V+`** (Positive `+` output of `5V`, `12V`, or `24V` DC supply, min `500 mA`) |
| **`Black`** | `Common GND` | **`Black -> Common GND`** (Negative `-` of DC supply **bonded in common** with `GND` on the active `FT2232HL` channel) |
| **`Yellow`** | `RS-485 A+` (`D+`) | **`Yellow -> RS485 A+`** (`A+` screw terminal on Channel 1 / `CH-A` of the isolated `FT2232HL` adapter) |
| **`Green`** | `RS-485 B-` (`D-`) | **`Green -> RS485 B-`** (`B-` screw terminal on Channel 1 / `CH-A` of the isolated `FT2232HL` adapter) |

> **Classic Hackathon Pitfall #1 (Dual-Channel `FT2232HL` Port Enumeration)**:
> The genuine **`FT2232HL`** controller (`VID=0x0403`, `PID=0x6010`) exposes **two** independent UART/RS-485 channels simultaneously:
> - **Linux / Qualcomm Dragonwing IQ-9075**: `/dev/ttyUSB0` (`CH-A`) and `/dev/ttyUSB1` (`CH-B`).
> - **macOS (Mac Mini)**: `/dev/cu.usbserial-XXXX0` (`CH-A`) and `/dev/cu.usbserial-XXXX1` (`CH-B`).
> `src/fieldscan/modbus_rtu.py` (`discover_rs485_ports()`) prioritizes FTDI `0x0403` interfaces and **automatically probes both channels**, so wiring `A+/B-` to either Channel 1 or Channel 2 works out of the box.

> **Classic Hackathon Pitfall #2 (Linux `dialout` Permissions vs. macOS Native Access)**:
> On Ubuntu / Qualcomm Linux, `/dev/ttyUSB*` devices belong to the `dialout` group. Run once immediately after plugging in the `FT2232HL` (takes effect instantly without logging out):
> ```bash
> sudo chmod 666 /dev/ttyUSB*
> ```
> On **macOS (Mac Mini)**, `sudo` is **not** required: `/dev/cu.usbserial-*` nodes are directly readable and writable by the logged-in user via Apple's built-in FTDI driver.

> **Classic Hackathon Pitfall #3 (Multi-Port USB 3.0 Hub)**:
> Pack a compact **USB 3.0 Hub** so both the **Acer 4K USB Camera** and the **`FT2232HL` Dual-Channel Isolated USB-to-RS485 Converter** connect simultaneously to `JUSB1` on the Qualcomm IQ-9075 or to your Mac Mini.

---

## 2. Exact Modbus-RTU Frame & `DIP-8` Binary Switch Math (Manual Pages 4, 6 & 7)

- **Serial Framing**: `9600 bps`, `8` data bits, `None` parity, `1` stop bit (`9600 8N1`).
- **Master Poll Frame (`Function 0x03` — Read 8 Holding Registers from `0x0000`)**:
  - Exact frame for `Slave = 1`: **`01 03 00 00 00 08 44 0C`** — verified byte-for-byte against the Manual Page 7 reference frame using Modbus **CRC-16 (`0xA001` reflected polynomial, LSB-first: `44 0C`)**.
- **Holding Register Decoding (Manual Pages 6 & 7)**:
  - `Reg 0x0000`: Signed 16-bit two's-complement Temperature in `0.1 °C` units (e.g., `253` → `25.3 °C`). Sentinel **`0x7FFF`** indicates an open or damaged `SHT30` sensing element (`sensor_abnormal_7fff = True`).
  - `Reg 0x0001`: Unsigned 16-bit Relative Humidity in `0.1 %RH` units (e.g., `562` → `56.2 %RH`; `0x7FFF` = sensor fault).
  - `Reg 0x0004`: Active Modbus Slave address latched from the internal `DIP-8` switch bank (`1..247`).
  - `Reg 0x0005`: Active UART baud rate (`4800`, `9600`, or `19200` bps).
  - `Reg 0x0006 / 0x0007`: Transmitter hardware and firmware revision numbers.
- **`DIP-8` Binary Switch Weights (Manual Page 4, Section 3.3 — `ON = 1`, MSB-to-LSB weights `128, 64, 32, 16, 8, 4, 2, 1` across Pins `1..8`)**:
  - Example field fault at `Slave 176` (`10110000` = `128 + 32 + 16`): **Pins 1, 3, and 4 `ON`**.
  - **Standard Plant Target — `Slave 1` (`00000001`)**: Set **Pins `1..7` `OFF`** and flip **only `Pin 8 ON`**.

---

## 3. Closed-Loop Reactive Live Repair State Machine (`src/fieldscan/live_repair.py`)

`LiveRepairCoordinator` unifies the 30 FPS camera, `Three.js v0.170` digital twin, `uPlot v1.6.32` SCADA chart, **3-Tier Andon Stack Light (`Red / Amber / Green`)**, offline English voice (`LFM3-VL-2B` + `LFM3-Audio-2B` + `Piper` `en_US-lessac-medium.onnx`), and the `FT2232HL` RS-485 bus across 4 deterministic stages:

1. **Stage 1 (`inspect_open` / `1. Inspect Fault` · Andon `RED`)**:
   - Captures the **BEFORE** camera snapshot, detects the open barrel + `DIP-8` misconfigured at `10110000` (`Slave 176`) + `RS-485 NO SIGNAL`, explodes the `Three.js` 3D twin with red fault stain comparison, sets the Andon stack light to **Red**, and speaks the diagnosis in English.
2. **Stage 2 (`guide_dip` / `2. Guide DIP-8` · Andon `AMBER`)**:
   - Captures the **DURING** camera snapshot, computes the exact binary switch changes (`Pins 1..7 OFF`, **`Pin 8 ON`** = `Slave 1` @ `9600 8N1`), animates the 3D `DIP-8` switches in `Three.js`, shifts the Andon stack light to **Amber**, and instructs the technician in English to connect the sensor to the RS-485 bus.
3. **Stage 3 (`Zero-Click Reactive Recovery` · Andon `GREEN`)**:
   - A background watchdog polls `ModbusRTUReader.get_telemetry()` every `350 ms`.
   - The exact moment the physical `TZ THT-02` answers with valid CRC-16 frames over the `FT2232HL` adapter (or via the bench simulator trigger), FieldScan captures the **AFTER** snapshot, closes the 3D housing, turns the Andon stack light **Green**, streams live `°C` and `%RH` onto `uPlot v1.6.32`, and **speaks hands-free English confirmation without touching a single key**.
4. **Stage 4 (`signoff` / `4. 4-View Manufacturer Dossier`)**:
   - Automatically captures **4 dimensioned WebGL 3D views** (`Isometric`, `Front Elevation 140×Ø16 mm`, `Exploded DIP-8`, `IP65 Cable Gland & Leads`), builds the `1280×800` engineering quad sheet + chronological **Before / During / After** photo strip, exports `.DXF` + `.STL`, and queues the RFC-5322 `.EML` (`X-FieldScan-SignOff-Request: TRUE`) warranty sign-off request in the offline outbox.
