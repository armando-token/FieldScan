# TZ THT-02 — Industrial Engineering Datasheet & Field Service Reference

- **Model**: `TZ THT-02` (`TZ-THT-02`) — Industrial RS-485 Temperature & Humidity Sensor
- **Source Manual**: *TZ THT-02 Temperature and humidity Sensor User's Manual V1.1* (Header rev: `V1.0`, Date: `Mach 18th, 2021`)
- **Sensing Elements**: Sensirion **SHT30** (Temperature) / **SHT3X** (Relative Humidity) — **CMOSens®** Technology
- **Interface & Protocol**: Half-duplex industrial **RS-485** bus, standard **Modbus-RTU** protocol
- **Mechanical Envelope**: **`140.0 mm` total axial length × `Ø16.0 mm` outer barrel diameter** (`1.0 m` / `1000.0 mm` standard shielded 4-wire lead)

---

## 1. Overview, CMOSens Architecture & Application Areas (Manual Pages 1–2)

### 1.1 External Physical Anatomy (Page 1 Callouts)
From the top sensing tip (`z = 0.0 mm`) to the rear cable exit (`z = 140.0 mm`):
1. **`Stainless steel strainer`**: Slotted protective cap and sintered stainless steel mesh shielding the SHT30/SHT3X element from airborne particulates while maintaining laminar airflow.
2. **`Quality probe` (Upper elastomeric seal ring)**: Black perimeter O-ring isolating the sampling head from the internal electronics cavity.
3. **`Wiring` (4-wire color-coded leads)**: Tinned conductor ends (`Green = B-`, `Yellow = A+`, `Black = GND`, `Red = V+`).
4. **`Mounting holes` (Snap-on mounting flange)**: Detachable lateral saddle bracket with two symmetrical mounting ears for wall or duct installation.
5. **`Standard one meter lead`**: Black 4-conductor shielded jacket (`Ø5.0 mm`) providing RS-485 common-mode ground reference.
6. **`Waterproof terminal` (Compression gland nut)**: Tapered ribbed compression nut sealing the rear cable entry.

### 1.2 SHT30 / SHT3X CMOSens® Architecture (Page 2)
- Combines an improved **capacitive relative humidity sensing element** and a **standard energy-gap temperature sensing element** on a single CMOSens® silicon die.
- Outperforms legacy `SHT1x` and `SHT7x` sensors with full-range temperature compensation, fast step response, complete factory calibration, minimal annual drift, and high resilience in demanding industrial atmospheres.
- Integrates an internal **8-position `DIP switch`** so field technicians can assign the hardware Modbus slave address directly on the bench without requiring upper-computer pre-configuration.

### 1.3 Key Features & Application Areas (Page 2)
- **Key Features**: Ultra-low current draw (`5 mA`), factory-calibrated linear output, high accuracy and repeatability, full-span temperature compensation, native `Modbus-RTU` framing, and rugged RS-485 bus protection.
- **Typical Indoor & Clean Industrial Applications**:
  - Commercial & industrial **HVAC** ducts and **Building Automation Systems (BAS)**.
  - Laboratories, hospitals, cleanrooms, and libraries.
  - Telecom equipment rooms, climate-controlled warehouses, pharmaceutical plants, paper mills, food processing, and electronics manufacturing lines.

---

## 2. Power, RS-485 Bus & Sensing Specifications (Manual Pages 3–4)

### 2.1 Power Supply (`4.1 Power supply`, Page 3)
| Parameter | Official Manual Rating | Field Engineering Notes |
| :--- | :--- | :--- |
| Supply voltage | **`DC 5~24V`** | Accepts standard `5V`, `12V`, or `24V DC` industrial rails. |
| Nominal current | **`5mA`** | Ultra-low power (`~25 mW @ 5V`, `~120 mW @ 24V`). |

### 2.2 RS-485 Interface & Bus Topology (`4.2 & 4.3`, Page 3)
| Parameter | Official Manual Rating | Field Engineering Notes |
| :--- | :--- | :--- |
| Transmission rate | **`Optional 4800bps / 9600bps / 19200bps`** | Factory default: **`9600 bps`**. Software-configurable via register `0x0005`. |
| Maximum transmission distance | **`About 1200 meters` (`1200m`)** | Requires shielded twisted-pair cable and proper common-mode grounding. |
| Number of theoretical nodes | **`32` nodes** | Up to 32 sensors per unrepeatered RS-485 segment. |

### 2.3 Temperature Parameters (`4.4 Temperature parameter`, Page 3)
| Parameter | Exact Specification |
| :--- | :--- |
| Sensing element | **`SHT30`** |
| Measuring range | **`-40~125°C`** *(Note: housing operating limit is `-40~85°C`; see §2.5)* |
| Resolution | **`0.1°C`** |
| Measurement accuracy | **`±0.3°C` (`0~60°C`)**; **`±0.5°C`** for other range |

### 2.4 Relative Humidity Parameters (`4.5 Humidity parameters`, Page 3)
| Parameter | Exact Specification |
| :--- | :--- |
| Sensing element | **`SHT3X`** |
| Working range | **`5~95%RH`** |
| Resolution | **`0.1%RH`** |
| Measurement accuracy | **`±2%RH` (`10%~90%RH`)**; **`±5%RH`** for other range |
| Hysteresis | **`< ±0.8%RH`** |
| Response time | **`About 8s`** (from `33%RH` to `75%RH` in flowing air) |
| Long-term stability (drift) | **`< ±0.25%RH/year`** (under no chemical pollution) |

### 2.5 Operating & Storage Environment (`4.6 Environmental conditions`, Page 4)
- **Working environment**: **`-40~85°C / 5~95%RH (Non-condensing)`**
- **Storage environment**: **`-40~85°C / 5~95%RH (Non-condensing)`**
- *Field Caution*: Although the bare SHT30 silicon supports readings up to `125°C`, the polymer barrel, RS-485 transceiver, and elastomeric seals are rated to **`85°C` non-condensing**. Liquid condensation causes temporary saturation or `0x7FFF` fault states.

---

## 3. 4-Wire Lead Color Code & RS-485 Grounding (Manual Page 4)

### 3.1 Conductor Assignment (`4.7 Lead description`, Page 4)
| Wire Color (`Lead`) | Label | Electrical Function (`Function description`) |
| :--- | :---: | :--- |
| **Green** | **`B-`** | Inverting differential data line (**RS485 interface B-**) |
| **Yellow** | **`A+`** | Non-inverting differential data line (**RS485 interface A+**) |
| **Black** | **`GND`** | **Public ground**: connect to DC supply negative (`-`) and RS-485 reference |
| **Red** | **`V+`** | **Power supply positive**: connect to `DC 5~24V` positive (`+`) terminal |

### 3.2 Critical RS-485 Common-Mode Grounding Warning (`4.8 Schematic diagram Note`, Page 4)
> **COMMON-MODE VOLTAGE GROUNDING REQUIREMENT:**
> When deploying a multi-drop RS-485 network, bond all sensor public ground (`Black / GND`) leads together and tie them to the `Gnd` reference terminal of the `RS-232/RS-485 transverter` (such as an isolated FT2232HL adapter) to eliminate **common-mode voltage**. Use the cable **shielding layer** as the equipotential ground reference across long industrial runs.

---

## 4. Internal 8-Position DIP Switch & Mandatory 2-Step Opening (Manual Page 5)

### 4.1 Binary DIP-8 Address Weights (`5 DIP switch and address code`, Page 5)
The internal DIP switch block contains **8 rockers numbered `1` through `8`**, ordered from **MSB to LSB** (Note: Pin `1` equals `128`, NOT `1`):

| DIP Position (`Switch #`) | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Decimal Weight (`Bit Weight`)** | **`128`** | **`64`** | **`32`** | **`16`** | **`8`** | **`4`** | **`2`** | **`1`** |

- **Slave Address Calculation (`Address Code`)**: Sum the binary weights of all switches set to **`ON`**.
- **Official Manual Example (Page 5)**:
  - Switches set to `ON`: **`1, 3, 4`** (all others `OFF`).
  - Resulting Modbus Slave ID: `128 + 32 + 16 =` **`176`** (`0xB0`).
- **Common Industrial Slave Addresses**:
  - Slave `1` (`0x01`): Pins `1–7 = OFF`, **`Pin 8 = ON`**.
  - Slave `2` (`0x02`): **`Pin 7 = ON`**, all others `OFF`.
  - Slave `10` (`0x0A`): **`Pin 5 (8) + Pin 7 (2) = ON`**.

### 4.2 Mandatory 2-Step Mechanical Opening Procedure (`First Step / Second Step`, Page 5)
To expose the internal blue DIP-8 PCB **without twisting or tearing the 4 internal wire solder joints**:
1. **`First Step` (Loosen Rear Waterproof Nut)**: Unscrew the rear tapered waterproof compression nut (`Waterproof terminal`) first and slide it back along the cable jacket to release torsional friction.
2. **`Second Step` (Unscrew Middle Barrel Seam)**: Hold the upper strainer barrel steady and unscrew the lower housing cylinder at the mid-body thread seam to expose the blue **8-pin DIP switch** PCB.
- *Reassembly*: Thread the middle barrel closed first while checking the black O-ring seat, then torque the rear waterproof compression nut last.

---

## 5. Modbus-RTU Protocol, Frame Timing & Holding Register Map (Manual Pages 5–9)

### 5.1 Serial Byte Format & RTU Frame Timing (`6.1 – 6.3`, Pages 5–6)
- **Byte format (`6.1 Data frame format`)**: `1 Start bit`, `8 Data bits`, `0 Parity bit` (`None`), `1 Stop bit` (**`8N1`** factory default).
- **Frame delimiter (`6.2 RTU message frame format`)**: Minimum silent interval of **`>= 3.5 characters`** (`T1-T2-T3-T4`) before and after each frame.
- **Inter-byte continuity (Silent Drop Rule)**: All bytes within a frame must be transmitted back-to-back. If an inter-character pause **`> 1.5 characters`** occurs, the sensor treats the frame as incomplete and **silently discards it without responding (`will not respond`)**.
- **Frame layout (`6.3 Information frame format`)**:
  `[Start >=3.5 char] + [Slave Address: 1B] + [Function Code: 1B] + [Data Payload: NB] + [CRC-16: 2B (Low, High)] + [End >=3.5 char]`

### 5.2 Holding Register Map (`6.4 Register definition`, Page 6)
| Hex Addr (`Dec`) | Meaning | Format, Scaling & Fault Sentinel | Access |
| :---: | :--- | :--- | :---: |
| **`0x0000`** (`0`) | **Temperature** | Unit **`0.1°C`**, `MSB First`, signed two's complement. **`7FFF H` (`32767`) means sensor is abnormal**. | Read only (`R`) |
| **`0x0001`** (`1`) | **Relative humidity** | Unit **`0.1%RH`**, `MSB First`, complement format. **`7FFF H` (`32767`) means sensor is abnormal**. | Read only (`R`) |
| **`0x0002`** (`2`) | **Reserved 1** | Internal factory register (`0000H` nominal). | Read only (`R`) |
| **`0x0003`** (`3`) | **Reserved 2** | Internal factory register (`0000H` nominal). | Read only (`R`) |
| **`0x0004`** (`4`) | **Address code** | Reflects hardware slave ID set by internal DIP-8 switch. | Read only (`R`) |
| **`0x0005`** (`5`) | **Baud rate** | Supports **`4800`** (`0x12C0`), **`9600`** (`0x2580`), **`19200`** (`0x4B00`). | **Read / Write (`R/W`)** |
| **`0x0006`** (`6`) | **Hardware version** | Example: `0600H`. | Read only (`R`) |
| **`0x0007`** (`7`) | **Software version** | Example: `000AH` = `10` decimal = `V1.0`. | Read only (`R`) |

### 5.3 Supported Function Codes (`6.7 & 6.8`, Pages 7–8)
1. **Function `0x03` — Read Holding Registers (`Host reads sensor information`)**:
   - **Example Host Poll** (Slave `0x01`, read `8` registers starting at `0x0000`):
     `01 03 00 00 00 08 44 0C` *(CRC Low=`44`, High=`0C`)*
   - **Example 21-Byte Sensor Reply**:
     `01 03 10 00 FA 02 58 00 00 00 00 00 01 25 80 06 00 00 0A D4 64`
     - Temperature = `00FA H` = `250 / 10` = **`25.0°C`** *(For sub-zero two's complement values: `signed = raw - 65536` when `raw >= 0x8000`, then `/ 10.0`)*.
     - Humidity = `0258 H` = `600 / 10` = **`60.0%RH`**.
     - DIP Address = `0001 H` = `1`; Baud = `2580 H` = `9600`; HW = `0600 H`; SW = `000A H` (`V1.0`).
2. **Function `0x06` — Write Single Register (`Host setting sensor information`)**:
   - Supported on register **`0x0005` (Baud rate)**.
   - **Example setting `9600 bps` (`0x2580`) on Slave `0x01`**:
     - Host Request: `01 06 00 05 25 80 82 FB`
     - Sensor Echo Reply: `01 06 00 05 25 80 82 FB`

### 5.4 Exception Responses & CRC-16/MODBUS (`6.9 & 6.10`, Pages 8–9)
- **Exception Frame (`6.9 Abnormal response`)**: Sets MSB of the function code (`0x03 -> 0x83`, `0x06 -> 0x86`) and returns `[Slave (1B)] [Func|0x80 (1B)] [Error Code (1B)] [CRC (2B)]`:
  - **`01`**: `Illegal function code`
  - **`02`**: `Illegal data address`
  - **`03`**: `Illegal data value`
- **CRC-16 Calculation (`6.10 CRC check code`, Page 9)**:
  - Initialize 16-bit register to **`0xFFFF`**.
  - XOR each message byte into the low byte, shift right 8 times (`LSB first`), and XOR with reflected polynomial **`0xA001`** whenever the shifted-out LSB is `1`.
  - Append **`CRC Low` first, `CRC High` second**. Invalid CRC frames are silently ignored.

---

## 6. Mechanical Dimensions (`7 Dimensions`, Page 9)

- **Total rigid housing length**: **`140.0 mm`** (slotted strainer crown to rear waterproof gland base, excluding flexible cable).
- **Outer barrel diameter**: **`16.0 mm` (`Ø16.0 mm`, radius `8.0 mm`)**.
- **Snap-on mounting flange**: Total width `42.0 mm`, axial height `20.0 mm`, two `Ø4.2 mm` mounting holes spaced `32.0 mm` on center.
- **Shielded output cable**: Nominal `Ø5.0 mm` outer jacket, standard length `1000.0 mm` (`1.0 m`).

---

## 7. Canonical 6-Zone Fault Diagnostic Matrix (`z = 0.0 .. 140.0 mm`)

| Zone ID (`z_start..z_end`) | Physical Sub-Assembly | Visual / Mechanical Faults | Electrical & Modbus-RTU Symptoms | Corrective Field Action |
| :--- | :--- | :--- | :--- | :--- |
| **`strainer_head`**<br>(`0.0 – 32.0 mm`) | Slotted Stainless Steel Strainer & SHT30/SHT3X Probe | Dust/oil clogging strainer slots, impact denting, liquid condensation or chemical film on SHT30 die. | Registers `0x0000` (Temp) and/or `0x0001` (RH) return **`7FFF H` (`32767`, sensor abnormal)**; sluggish response `>> 8s`; drift `> ±2%RH`. | De-energize, purge slots with dry compressed air (`< 1 bar`) without touching the SHT30 die; desiccant-dry or replace probe head if `7FFF H` persists. |
| **`upper_seal_ring`** / **`seal_ring`**<br>(`32.0 – 38.0 mm`) | Upper Quality Probe Elastomeric O-Ring Seal | Cracked, brittle, pinched, or unseated black NBR/Viton perimeter seal ring. | Moisture migration into DIP-8 PCB cavity; intermittent RH drift or transient `7FFF H` alarms above `85%RH`. | Inspect groove seating around `Ø16.0 mm` collar, dry internal chamber, and replace damaged elastomeric O-ring. |
| **`upper_barrel_dip`**<br>(`38.0 – 68.0 mm`) | Upper Barrel & Internal 8-Position DIP Switch PCB | Unscrewed housing exposing blue PCB, reversed MSB/LSB pin math (`1=128..8=1`), all switches `OFF` (`ID=0`), or half-seated rockers. | **Total Modbus poll timeout** on expected Slave ID, RS-485 address collision, or unexpected value in register `0x0004`. | Open via **2-Step Procedure** (loosen rear gland nut first, unscrew barrel second), set binary weights `[128,64,32,16,8,4,2,1]`, and verify `0x0004`. |
| **`mounting_flange`**<br>(`68.0 – 88.0 mm`) | Snap-On Mounting Flange & Mid-Body Thread Seam | Cracked `42.0 mm` mounting ear, over-torqued M4 screws deforming barrel, or partially open central seam. | Vibration-induced contact chatter causing `> 1.5 char` inter-byte gaps (silent frame drops) or loss of mid-seam sealing. | Replace cracked bracket, secure M4 fasteners on `32.0 mm` centers without crushing the `Ø16.0 mm` tube, and close central threads fully. |
| **`lower_barrel_rs485`** / **`middle_barrel`**<br>(`88.0 – 122.0 mm`) | Lower/Middle Barrel: RS-485 Transceiver & DC Regulator | Thermal discoloration from `> 24V DC` overvoltage, reverse polarity, or common-mode voltage stress. | Abnormal supply draw (`!= 5 mA`), recurring `CRC-16` (`0xA001`) errors, differential `A+/B-` latch-up, or `0x83`/`0x86` exceptions. | Confirm `DC 5~24V` on `Red (V+)` / `Black (GND)`, tie all `GND` leads and cable shields to converter `Gnd`, and match baud rate in `0x0005`. |
| **`waterproof_gland_leads`**<br>(`122.0 – 140.0 mm`) | Waterproof Compression Gland & 1m 4-Wire Lead | Loose compression nut, twisted/pulled internal leads from skipping First Step, or swapped `Yellow (A+)` / `Green (B-)`. | Zero RS-485 response (inverted `A+/B-` or open wire), intermittent power loss on cable flex, or EMI packet loss on `1200 m` runs. | Verify color code (`Red=V+`, `Black=GND`, `Yellow=A+`, `Green=B-`), repair strained joints, ground cable shield, and tighten gland nut. |
