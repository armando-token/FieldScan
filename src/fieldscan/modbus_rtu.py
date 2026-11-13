"""Industrial RS-485 Modbus-RTU Master & SCADA Telemetry Engine for TZ THT-02.

Supports:
1. Real FTDI `FT2232HL` Dual-Channel Isolated USB-to-RS485 converters (auto-probing both
   Channel A and Channel B on Linux `/dev/ttyUSB*` and macOS `/dev/cu.usbserial*`).
2. Exact TZ THT-02 Modbus-RTU protocol (Manual V1.1 Pages 5-9):
   - Frame format: 8N1 (`4800` / `9600` default / `19200` bps), CRC-16 `0xA001` little-endian.
   - Function `0x03`: Holding registers `0x0000` (Temp 0.1 C, signed 16-bit, `0x7FFF` = abnormal),
     `0x0001` (Humidity 0.1 %RH, `0x7FFF` = abnormal), `0x0004` (DIP-8 Slave Address),
     `0x0005` (Baud rate), `0x0006` (HW ver), `0x0007` (SW ver).
3. Hardware-free Workbench Bus Simulator (`sim_disconnected`, `sim_abnormal_7fff`,
   `sim_online`, `sim_breath_test`) so full closed-loop repair workflows can be tested
   anywhere with zero mocks.
"""

from __future__ import annotations

from collections import deque
import glob
import math
import os
import struct
import sys
import threading
import time
from typing import Any

import serial
from serial.tools import list_ports

DIP_WEIGHTS: tuple[int, ...] = (128, 64, 32, 16, 8, 4, 2, 1)
SUPPORTED_BAUDS: tuple[int, ...] = (9600, 4800, 19200)
ABNORMAL_SENTINEL = 0x7FFF

MODBUS_MODES: tuple[str, ...] = (
    "auto",
    "hardware",
    "sim_disconnected",
    "sim_abnormal_7fff",
    "sim_online",
    "sim_breath_test",
)


def compute_crc16_modbus(data: bytes) -> int:
    """Compute standard Modbus-RTU CRC-16 (init 0xFFFF, reflected poly 0xA001) per Manual Page 9."""
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc & 0xFFFF


def append_crc16(pdu: bytes) -> bytes:
    """Append little-endian [CRC_Lo, CRC_Hi] to a Modbus RTU frame."""
    crc = compute_crc16_modbus(pdu)
    return pdu + bytes([crc & 0xFF, (crc >> 8) & 0xFF])


def verify_crc16(frame: bytes) -> bool:
    """Verify trailing little-endian CRC-16 on a received Modbus RTU frame."""
    if len(frame) < 4:
        return False
    expected = compute_crc16_modbus(frame[:-2])
    received = frame[-2] | (frame[-1] << 8)
    return expected == received


def format_hex(frame: bytes) -> str:
    return " ".join(f"{b:02X}" for b in frame)


def dip_bits_to_address(bits: list[int] | tuple[int, ...]) -> int:
    """Convert 8 DIP switch positions (1..8, weights 128..1) to Modbus Slave ID (0..255)."""
    padded = list(bits)[:8] + [0] * max(0, 8 - len(bits))
    return sum(w for b, w in zip(padded, DIP_WEIGHTS) if int(b) != 0)


def address_to_dip_bits(address: int) -> list[int]:
    """Convert Modbus Slave ID (1..247) to 8 DIP switch positions [pin1..pin8] with weights 128..1."""
    val = max(0, min(255, int(address)))
    return [1 if (val & w) else 0 for w in DIP_WEIGHTS]


def describe_dip_pins(address: int) -> dict[str, Any]:
    """Generate crisp Industrial English DIP-8 pin instructions for a target Modbus Slave ID."""
    addr = max(1, min(247, int(address)))
    bits = address_to_dip_bits(addr)
    on_pins = [idx + 1 for idx, b in enumerate(bits) if b == 1]
    off_pins = [idx + 1 for idx, b in enumerate(bits) if b == 0]
    weights_used = [DIP_WEIGHTS[p - 1] for p in on_pins]
    sum_expr = " + ".join(str(w) for w in weights_used) + f" = {addr}" if weights_used else "0"

    if on_pins == [8]:
        pin_txt = "Set Pins 1 through 7 to OFF and flip Pin 8 to ON"
    elif on_pins == [1]:
        pin_txt = "Flip Pin 1 to ON (128) and set Pins 2 through 8 to OFF"
    elif len(on_pins) == 1:
        pin_txt = (
            f"Flip only Pin {on_pins[0]} to ON ({sum_expr}) "
            f"and set Pins {', '.join(map(str, off_pins))} to OFF"
        )
    else:
        pin_txt = (
            f"Flip Pins {', '.join(map(str, on_pins))} to ON ({sum_expr}) "
            f"and set Pins {', '.join(map(str, off_pins))} to OFF"
        )

    return {
        "slave_id": addr,
        "hex_id": f"0x{addr:02X}",
        "dip_bits": bits,
        "dip_binary": "".join(map(str, bits)),
        "on_pins": on_pins,
        "off_pins": off_pins,
        "sum_expression": sum_expr,
        "instruction": pin_txt,
        "instruction_en": pin_txt,
    }


def build_read_registers_request(slave_id: int = 1, start_reg: int = 0x0000, count: int = 8) -> bytes:
    """Build Function 0x03 Read Holding Registers frame (e.g. `01 03 00 00 00 08 44 0C` on Page 7)."""
    pdu = struct.pack(">BBHH", slave_id & 0xFF, 0x03, start_reg & 0xFFFF, count & 0xFFFF)
    return append_crc16(pdu)


def build_write_single_coil_request(slave_id: int, coil_addr: int, turn_on: bool) -> bytes:
    """Build Function 0x05 Write Single Coil RTU frame (`0xFF00` = ON, `0x0000` = OFF + CRC-16) for optional RS-485 Andon relay boards."""
    coil_val = 0xFF00 if turn_on else 0x0000
    pdu = struct.pack(">BBHH", slave_id & 0xFF, 0x05, coil_addr & 0xFFFF, coil_val)
    return append_crc16(pdu)


def decode_tht02_holding_response(frame: bytes) -> dict[str, Any]:
    """Decode a TZ THT-02 Function 0x03 response frame per Manual Pages 6, 7, and 8."""
    if len(frame) < 5:
        raise ValueError(f"Short Modbus RTU frame ({len(frame)} bytes)")
    if not verify_crc16(frame):
        raise ValueError(f"CRC-16 mismatch on frame: {format_hex(frame)}")

    slave_id = frame[0]
    func_code = frame[1]
    if func_code & 0x80:
        err_code = frame[2]
        err_map = {1: "Illegal Function", 2: "Illegal Data Address", 3: "Illegal Data Value"}
        raise ValueError(
            f"Modbus Exception 0x{func_code:02X} code 0x{err_code:02X} ({err_map.get(err_code, 'Unknown')})"
        )
    if func_code != 0x03:
        raise ValueError(f"Unexpected function code 0x{func_code:02X}")

    byte_count = frame[2]
    payload = frame[3:-2]
    if len(payload) != byte_count or byte_count < 4:
        raise ValueError(f"Invalid payload byte count {byte_count} vs {len(payload)}")

    reg_count = byte_count // 2
    regs_u16 = struct.unpack(f">{reg_count}H", payload)

    raw_temp = regs_u16[0]
    raw_hum = regs_u16[1]

    temp_abnormal = raw_temp == ABNORMAL_SENTINEL
    hum_abnormal = raw_hum == ABNORMAL_SENTINEL
    sensor_abnormal = temp_abnormal or hum_abnormal

    # Signed two's complement decoding for sub-zero temperatures (-40.0..+125.0 C)
    if temp_abnormal:
        temp_c = None
    else:
        signed_temp = raw_temp - 0x10000 if (raw_temp & 0x8000) else raw_temp
        temp_c = round(signed_temp / 10.0, 1)

    humidity_rh = None if hum_abnormal else round(raw_hum / 10.0, 1)

    reported_addr = int(regs_u16[4]) if reg_count > 4 else int(slave_id)
    raw_baud = int(regs_u16[5]) if reg_count > 5 else 0x2580
    baud_map = {0x12C0: 4800, 0x2580: 9600, 0x4B00: 19200, 4800: 4800, 9600: 9600, 19200: 19200, 0: 4800, 1: 9600, 2: 19200}
    baud_bps = baud_map.get(raw_baud, 9600)

    hw_ver_raw = int(regs_u16[6]) if reg_count > 6 else 0x0600
    sw_ver_raw = int(regs_u16[7]) if reg_count > 7 else 0x000A

    return {
        "slave_id": int(slave_id),
        "reported_slave_id": reported_addr,
        "dip_bits": address_to_dip_bits(reported_addr),
        "temp_c": temp_c,
        "humidity_rh": humidity_rh,
        "raw_temp_hex": f"0x{raw_temp:04X}",
        "raw_humidity_hex": f"0x{raw_hum:04X}",
        "sensor_abnormal_7fff": sensor_abnormal,
        "baud_bps": baud_bps,
        "hw_version": f"0x{hw_ver_raw:04X}",
        "sw_version": f"V{sw_ver_raw / 10.0:.1f}",
        "registers_u16": list(regs_u16),
        "crc_valid": True,
    }


def build_simulated_tht02_response(
    slave_id: int = 1,
    temp_c: float | None = 24.4,
    humidity_rh: float | None = 48.6,
    baud_bps: int = 9600,
    abnormal_7fff: bool = False,
) -> bytes:
    """Synthesize a byte-exact 21-byte TZ THT-02 Function 0x03 response frame with valid CRC-16."""
    if abnormal_7fff or temp_c is None:
        raw_t = ABNORMAL_SENTINEL
    else:
        t_int = int(round(temp_c * 10.0))
        raw_t = (t_int + 0x10000) & 0xFFFF if t_int < 0 else (t_int & 0xFFFF)

    if abnormal_7fff or humidity_rh is None:
        raw_h = ABNORMAL_SENTINEL
    else:
        raw_h = max(0, min(1000, int(round(humidity_rh * 10.0))))

    baud_reg = {4800: 0x12C0, 9600: 0x2580, 19200: 0x4B00}.get(baud_bps, 0x2580)
    regs = (
        raw_t,
        raw_h,
        0x0000,
        0x0000,
        slave_id & 0xFF,
        baud_reg,
        0x0600,
        0x000B,  # V1.1
    )
    pdu = struct.pack(">BBB8H", slave_id & 0xFF, 0x03, 16, *regs)
    return append_crc16(pdu)


def discover_serial_ports() -> list[dict[str, Any]]:
    """Discover USB-to-RS485 ports across Linux (`/dev/ttyUSB*`) and macOS (`/dev/cu.usbserial*`).

    Prioritizes FTDI `FT2232HL` (VID `0x0403`, PID `0x6010`) 2-channel isolated industrial adapters.
    """
    seen: set[str] = set()
    candidates: list[dict[str, Any]] = []

    env_port = os.environ.get("FIELDSCAN_MODBUS_PORT")
    if env_port:
        seen.add(env_port)
        candidates.append(
            {
                "device": env_port,
                "description": "FIELDSCAN_MODBUS_PORT override",
                "is_ftdi": True,
                "priority": 0,
            }
        )

    try:
        ports = list(list_ports.comports())
    except Exception:
        ports = []

    for p in ports:
        dev = p.device
        if not dev or dev in seen:
            continue
        desc = f"{p.manufacturer or ''} {p.product or ''} {p.description or ''}".strip()
        is_ft2232 = (p.vid == 0x0403 and p.pid == 0x6010) or ("ft2232" in desc.lower())
        is_ftdi = (p.vid == 0x0403) or ("ftdi" in desc.lower()) or ("rs485" in desc.lower())
        is_usb_serial = any(
            tok in dev.lower()
            for tok in ("ttyusb", "ttyacm", "cu.usbserial", "cu.usbmodem", "tty.usbserial")
        )
        if not (is_ftdi or is_usb_serial):
            continue
        # On macOS, always prefer `/dev/cu.*` callout devices over `/dev/tty.*` so open() never blocks on DCD
        if sys.platform == "darwin" and dev.startswith("/dev/tty."):
            cu_equiv = dev.replace("/dev/tty.", "/dev/cu.", 1)
            if os.path.exists(cu_equiv):
                dev = cu_equiv
                if dev in seen:
                    continue
        seen.add(dev)
        prio = 1 if is_ft2232 else (2 if is_ftdi else 3)
        candidates.append(
            {
                "device": dev,
                "description": desc or "USB-RS485 Serial Adapter",
                "vid": p.vid,
                "pid": p.pid,
                "is_ftdi": is_ftdi,
                "is_ft2232hl": is_ft2232,
                "priority": prio,
            }
        )

    # Fallback filesystem globs for minimal containers/UDEV setups
    globs = (
        ["/dev/cu.usbserial*", "/dev/cu.usbmodem*"]
        if sys.platform == "darwin"
        else ["/dev/ttyUSB*", "/dev/ttyACM*"]
    )
    for pattern in globs:
        for path in sorted(glob.glob(pattern)):
            if path not in seen:
                seen.add(path)
                candidates.append(
                    {
                        "device": path,
                        "description": "Serial RS-485 Interface",
                        "is_ftdi": "usbserial" in path or "ttyUSB" in path,
                        "is_ft2232hl": False,
                        "priority": 4,
                    }
                )

    candidates.sort(key=lambda item: (item["priority"], item["device"]))
    return candidates


class ModbusRTUScanner:
    """Continuous 2 Hz RS-485 Modbus-RTU poller + auto-scanner + workbench simulator."""

    def __init__(
        self,
        initial_mode: str | None = None,
        target_slave_id: int = 1,
        baud_bps: int = 9600,
        poll_interval_s: float = 0.5,
        auto_start: bool = False,
    ) -> None:
        self._lock = threading.Lock()
        self._mode = (initial_mode or os.environ.get("FIELDSCAN_MODBUS_MODE", "auto")).strip().lower()
        if self._mode not in MODBUS_MODES:
            self._mode = "auto"

        self.target_slave_id = max(1, min(247, int(target_slave_id)))
        self.baud_bps = int(baud_bps) if int(baud_bps) in SUPPORTED_BAUDS else 9600
        self.poll_interval_s = max(0.2, float(poll_interval_s))

        self._running = False
        self._thread: threading.Thread | None = None
        self._active_port: str | None = None
        self._active_slave_id: int = self.target_slave_id
        self._active_baud: int = self.baud_bps
        self._poll_seq: int = 0
        self._breath_started_at: float = 0.0
        self._history: deque[dict[str, Any]] = deque(maxlen=36)
        self._latest_telemetry: dict[str, Any] = {}

        self.step_once()
        if auto_start:
            self.start()

    def start(self) -> None:
        with self._lock:
            if self._running and self._thread is not None and self._thread.is_alive():
                return
            self._running = True
            self._thread = threading.Thread(
                target=self._run_loop, name="fieldscan-modbus-loop", daemon=True
            )
            self._thread.start()

    def stop(self) -> None:
        with self._lock:
            self._running = False
            thread = self._thread
            self._thread = None
        if thread is not None and thread.is_alive():
            thread.join(timeout=1.5)

    def set_mode(
        self,
        mode: str,
        target_slave_id: int | None = None,
        baud_bps: int | None = None,
    ) -> dict[str, Any]:
        clean = (mode or "auto").strip().lower()
        if clean not in MODBUS_MODES:
            raise ValueError(f"Unsupported Modbus mode '{mode}'. Valid: {MODBUS_MODES}")
        with self._lock:
            self._mode = clean
            if clean == "sim_breath_test":
                self._breath_started_at = time.perf_counter()
            if target_slave_id is not None and 1 <= int(target_slave_id) <= 247:
                self.target_slave_id = int(target_slave_id)
                self._active_slave_id = int(target_slave_id)
            if baud_bps is not None and int(baud_bps) in SUPPORTED_BAUDS:
                self.baud_bps = int(baud_bps)
                self._active_baud = int(baud_bps)
        return self.step_once()

    def set_target_slave(self, slave_id: int, baud_bps: int | None = None) -> dict[str, Any]:
        with self._lock:
            if 1 <= int(slave_id) <= 247:
                self.target_slave_id = int(slave_id)
                self._active_slave_id = int(slave_id)
            if baud_bps is not None and int(baud_bps) in SUPPORTED_BAUDS:
                self.baud_bps = int(baud_bps)
                self._active_baud = int(baud_bps)
        return self.step_once()

    def _probe_single_serial(
        self, port_name: str, slave_id: int, baud_bps: int, timeout_s: float = 0.085
    ) -> tuple[dict[str, Any] | None, str, str, float]:
        """Send Function 0x03 Read Holding Registers over real RS-485 serial port."""
        tx = build_read_registers_request(slave_id=slave_id, start_reg=0x0000, count=8)
        tx_hex = format_hex(tx)
        t0 = time.perf_counter()
        try:
            with serial.Serial(
                port=port_name,
                baudrate=baud_bps,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=timeout_s,
                write_timeout=timeout_s,
            ) as ser:
                ser.reset_input_buffer()
                ser.write(tx)
                ser.flush()
                # 8 registers response = 1(addr) + 1(func) + 1(byte_count=16) + 16(data) + 2(crc) = 21 bytes
                rx = ser.read(21)
            rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            if not rx:
                return None, tx_hex, "", rtt_ms
            decoded = decode_tht02_holding_response(rx)
            return decoded, tx_hex, format_hex(rx), rtt_ms
        except Exception:
            rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            return None, tx_hex, "", rtt_ms

    def scan_hardware_bus(self, quick: bool = True) -> dict[str, Any]:
        """Auto-discover port (FT2232HL CH-A / CH-B), baud rate, and DIP-8 Slave ID of a real TZ THT-02."""
        ports = discover_serial_ports()
        if not ports:
            return {
                "found": False,
                "ports_checked": [],
                "reason": "No USB-RS485 serial adapter detected (/dev/ttyUSB* or /dev/cu.usbserial*).",
            }

        priority_slaves = []
        for sid in (self._active_slave_id, self.target_slave_id, 1, 176, 2, 3):
            if 1 <= sid <= 247 and sid not in priority_slaves:
                priority_slaves.append(sid)
        if not quick:
            for sid in range(1, 33):
                if sid not in priority_slaves:
                    priority_slaves.append(sid)

        bauds = [self._active_baud] + [b for b in SUPPORTED_BAUDS if b != self._active_baud]
        checked_ports = [p["device"] for p in ports]

        for p_info in ports:
            dev = p_info["device"]
            for baud in bauds:
                for sid in priority_slaves:
                    decoded, tx_hex, rx_hex, rtt_ms = self._probe_single_serial(
                        dev, slave_id=sid, baud_bps=baud, timeout_s=0.075
                    )
                    if decoded is not None:
                        with self._lock:
                            self._active_port = dev
                            self._active_slave_id = decoded["reported_slave_id"] or sid
                            self._active_baud = baud
                        return {
                            "found": True,
                            "port": dev,
                            "adapter": p_info.get("description", "FT2232HL USB-RS485"),
                            "baud_bps": baud,
                            "slave_id": decoded["reported_slave_id"] or sid,
                            "dip_bits": decoded["dip_bits"],
                            "temp_c": decoded["temp_c"],
                            "humidity_rh": decoded["humidity_rh"],
                            "tx_hex": tx_hex,
                            "rx_hex": rx_hex,
                            "roundtrip_ms": rtt_ms,
                            "ports_checked": checked_ports,
                        }

        return {
            "found": False,
            "ports_checked": checked_ports,
            "reason": "Adapter present, but no Modbus-RTU slave responded on probed addresses.",
        }

    def step_once(self) -> dict[str, Any]:
        with self._lock:
            mode = self._mode
            target_sid = self.target_slave_id
            active_port = self._active_port
            active_sid = self._active_slave_id
            active_baud = self._active_baud
            breath_t0 = self._breath_started_at

        ports = discover_serial_ports()
        hw_present = len(ports) > 0

        # 1. Hardware probing when mode is "hardware" or ("auto" with real USB-RS485 plugged in)
        if mode == "hardware" or (mode == "auto" and hw_present):
            port_list = [active_port] + [p["device"] for p in ports if p["device"] != active_port]
            port_list = [p for p in port_list if p]
            slave_candidates = []
            for s in (active_sid, target_sid, 1, 176):
                if 1 <= s <= 247 and s not in slave_candidates:
                    slave_candidates.append(s)

            for dev in port_list:
                for sid in slave_candidates:
                    decoded, tx_hex, rx_hex, rtt_ms = self._probe_single_serial(
                        dev, slave_id=sid, baud_bps=active_baud, timeout_s=0.08
                    )
                    if decoded is not None:
                        return self._record_telemetry(
                            online=True,
                            source=f"hardware:{dev}",
                            port=dev,
                            adapter_present=True,
                            mode=mode,
                            baud_bps=active_baud,
                            decoded=decoded,
                            tx_hex=tx_hex,
                            rx_hex=rx_hex,
                            roundtrip_ms=rtt_ms,
                            status_label="SCADA ONLINE (7FFFH FAULT)"
                            if decoded["sensor_abnormal_7fff"]
                            else "SCADA ONLINE · VERIFIED",
                        )

            # Hardware adapter present (or requested), but sensor unpowered / wrong DIP / disconnected
            tx_probe = build_read_registers_request(slave_id=target_sid, start_reg=0x0000, count=8)
            first_dev = port_list[0] if port_list else None
            return self._record_telemetry(
                online=False,
                source=f"hardware:{first_dev}" if first_dev else "hardware:no_usb_rs485",
                port=first_dev,
                adapter_present=hw_present,
                mode=mode,
                baud_bps=active_baud,
                decoded=None,
                tx_hex=format_hex(tx_probe),
                rx_hex="",
                roundtrip_ms=80.0 if hw_present else 0.0,
                status_label="BUS TIMEOUT · NO RS-485 SIGNAL"
                if hw_present
                else "USB-RS485 ADAPTER DISCONNECTED",
            )

        # 2. Deterministic Workbench Bus Simulation modes (for VM & rehearsal)
        now = time.perf_counter()
        tx = build_read_registers_request(slave_id=target_sid, start_reg=0x0000, count=8)
        tx_hex = format_hex(tx)

        if mode in ("auto", "sim_disconnected"):
            return self._record_telemetry(
                online=False,
                source="simulator:rs485_disconnected",
                port="sim://ft2232hl-ch1",
                adapter_present=hw_present,
                mode=mode,
                baud_bps=active_baud,
                decoded=None,
                tx_hex=tx_hex,
                rx_hex="",
                roundtrip_ms=52.0,
                status_label="NO MODBUS SIGNAL (TIMEOUT)",
            )

        if mode == "sim_abnormal_7fff":
            rx = build_simulated_tht02_response(
                slave_id=target_sid,
                abnormal_7fff=True,
                baud_bps=active_baud,
            )
            decoded = decode_tht02_holding_response(rx)
            return self._record_telemetry(
                online=True,
                source="simulator:rs485_7fff",
                port="sim://ft2232hl-ch1",
                adapter_present=hw_present,
                mode=mode,
                baud_bps=active_baud,
                decoded=decoded,
                tx_hex=tx_hex,
                rx_hex=format_hex(rx),
                roundtrip_ms=11.4,
                status_label="ALARM 7FFFH · SHT30 PROBE ABNORMAL",
            )

        if mode == "sim_breath_test":
            elapsed = max(0.0, now - breath_t0)
            # Smoothly ramp from 24.4 C / 48.6 %RH up to 27.6 C / 83.4 %RH over 4 seconds, then decay slowly
            envelope = math.sin(min(math.pi * 0.85, elapsed * 0.45)) if elapsed < 6.0 else max(0.15, math.exp(-(elapsed - 6.0) / 8.0))
            sim_temp = round(24.4 + 3.2 * max(0.0, envelope), 1)
            sim_hum = round(48.6 + 34.8 * max(0.0, envelope), 1)
        else:
            # sim_online: realistic subtle laboratory ambient readings
            sim_temp = round(24.3 + 0.15 * math.sin(now * 0.7), 1)
            sim_hum = round(48.8 + 0.45 * math.cos(now * 0.55), 1)

        rx = build_simulated_tht02_response(
            slave_id=target_sid,
            temp_c=sim_temp,
            humidity_rh=sim_hum,
            baud_bps=active_baud,
            abnormal_7fff=False,
        )
        decoded = decode_tht02_holding_response(rx)
        return self._record_telemetry(
            online=True,
            source=f"simulator:{mode}",
            port="sim://ft2232hl-ch1",
            adapter_present=hw_present,
            mode=mode,
            baud_bps=active_baud,
            decoded=decoded,
            tx_hex=tx_hex,
            rx_hex=format_hex(rx),
            roundtrip_ms=11.8,
            status_label="SCADA ONLINE · SIGNAL VERIFIED",
        )

    def drive_andon_relay(self, tier_color: str, relay_slave_id: int = 2) -> dict[str, Any]:
        """Build (and optionally transmit over RS-485) Function 0x05 coil frames for a 3-tier Andon stacklight."""
        clean_tier = (tier_color or "RED").strip().upper()
        coil_states = {
            0: clean_tier == "RED",
            1: clean_tier == "YELLOW",
            2: clean_tier == "GREEN",
        }
        frames_hex: list[str] = []
        raw_frames: list[bytes] = []
        for c_addr, on_flag in coil_states.items():
            frm = build_write_single_coil_request(slave_id=relay_slave_id, coil_addr=c_addr, turn_on=on_flag)
            raw_frames.append(frm)
            frames_hex.append(format_hex(frm))

        transmitted = False
        with self._lock:
            port_name = self._active_port
            baud = self._active_baud

        if port_name and not port_name.startswith("sim://") and os.environ.get("FIELDSCAN_ANDON_RELAY_SLAVE"):
            try:
                with serial.Serial(
                    port=port_name,
                    baudrate=baud,
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=0.05,
                    write_timeout=0.05,
                ) as ser:
                    for frm in raw_frames:
                        ser.write(frm)
                        ser.flush()
                        ser.read(8)
                    transmitted = True
            except Exception:
                transmitted = False

        return {
            "andon_light": clean_tier,
            "relay_slave_id": relay_slave_id,
            "coil_frames_hex": frames_hex,
            "transmitted_hardware": transmitted,
        }

    def _record_telemetry(
        self,
        *,
        online: bool,
        source: str,
        port: str | None,
        adapter_present: bool,
        mode: str,
        baud_bps: int,
        decoded: dict[str, Any] | None,
        tx_hex: str,
        rx_hex: str,
        roundtrip_ms: float,
        status_label: str,
    ) -> dict[str, Any]:
        with self._lock:
            self._poll_seq += 1
            if port:
                self._active_port = port
            ts = time.time()

            temp_c = decoded["temp_c"] if decoded else None
            hum_rh = decoded["humidity_rh"] if decoded else None
            abnormal = bool(decoded["sensor_abnormal_7fff"]) if decoded else False
            slave_id = decoded["reported_slave_id"] if decoded else self.target_slave_id
            dip_bits = decoded["dip_bits"] if decoded else address_to_dip_bits(self.target_slave_id)
            healthy = bool(online and not abnormal and temp_c is not None and hum_rh is not None)
            andon_light = "GREEN" if healthy else "RED"

            if online and temp_c is not None and hum_rh is not None:
                self._history.append(
                    {
                        "ts": round(ts, 2),
                        "temp_c": temp_c,
                        "humidity_rh": hum_rh,
                    }
                )

            payload: dict[str, Any] = {
                "online": online,
                "healthy": healthy,
                "andon_light": andon_light,
                "sensor_abnormal_7fff": abnormal,
                "mode": mode,
                "source": source,
                "port": port,
                "adapter_present": adapter_present,
                "baud_bps": baud_bps,
                "frame_format": "8N1",
                "slave_id": slave_id,
                "target_slave_id": self.target_slave_id,
                "dip_bits": dip_bits,
                "temp_c": temp_c,
                "humidity_rh": hum_rh,
                "raw_temp_hex": decoded["raw_temp_hex"] if decoded else None,
                "raw_humidity_hex": decoded["raw_humidity_hex"] if decoded else None,
                "hw_version": decoded["hw_version"] if decoded else None,
                "sw_version": decoded["sw_version"] if decoded else None,
                "last_tx_hex": tx_hex,
                "last_rx_hex": rx_hex,
                "crc_valid": bool(decoded["crc_valid"]) if decoded else False,
                "roundtrip_ms": roundtrip_ms,
                "status_label": status_label,
                "poll_seq": self._poll_seq,
                "history": list(self._history),
            }
            self._latest_telemetry = payload
            return dict(payload)

    def _run_loop(self) -> None:
        while True:
            with self._lock:
                if not self._running:
                    break
            t0 = time.perf_counter()
            try:
                self.step_once()
            except Exception:
                pass
            dt = time.perf_counter() - t0
            sleep_s = self.poll_interval_s - dt
            if sleep_s > 0.01:
                time.sleep(sleep_s)

    def get_telemetry(self) -> dict[str, Any]:
        with self._lock:
            if self._latest_telemetry:
                return dict(self._latest_telemetry)
        return self.step_once()
