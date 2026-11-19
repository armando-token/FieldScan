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
from datetime import datetime, timezone
import glob
import math
import os
import socket
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
DEFAULT_MAX_SAMPLE_AGE_S = 3.0

MODBUS_MODES: tuple[str, ...] = (
    "auto",
    "hardware",
    "pusr_tcp",
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
        temp_quality = "invalid_sentinel_7fff"
    else:
        signed_temp = raw_temp - 0x10000 if (raw_temp & 0x8000) else raw_temp
        temp_c = round(signed_temp / 10.0, 1)
        temp_quality = "valid"

    if hum_abnormal:
        humidity_rh = None
        humidity_quality = "invalid_sentinel_7fff"
    else:
        humidity_rh = round(raw_hum / 10.0, 1)
        humidity_quality = "valid"

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
        "temp_quality": temp_quality,
        "humidity_quality": humidity_quality,
        "raw_temp_hex": f"0x{raw_temp:04X}",
        "raw_humidity_hex": f"0x{raw_hum:04X}",
        "sensor_abnormal_7fff": sensor_abnormal,
        "temp_abnormal_7fff": temp_abnormal,
        "humidity_abnormal_7fff": hum_abnormal,
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
    *,
    temp_7fff: bool = False,
    humidity_7fff: bool = False,
) -> bytes:
    """Synthesize a byte-exact 21-byte TZ THT-02 Function 0x03 response frame with valid CRC-16."""
    if abnormal_7fff or temp_7fff or temp_c is None:
        raw_t = ABNORMAL_SENTINEL
    else:
        t_int = int(round(temp_c * 10.0))
        raw_t = (t_int + 0x10000) & 0xFFFF if t_int < 0 else (t_int & 0xFFFF)

    if abnormal_7fff or humidity_7fff or humidity_rh is None:
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


def _parse_tcp_bridge_endpoint(host_port: str, default_port: int = 5502) -> tuple[str, int]:
    """Parse a TCP serial bridge URI or host:port string into (host, port)."""
    raw = (host_port or "").strip()
    for prefix in ("tcp://", "socket://"):
        if raw.lower().startswith(prefix):
            raw = raw[len(prefix) :].strip()
            break
    if "/" in raw:
        raw = raw.split("/", 1)[0]
    if ":" in raw:
        host_part, port_part = raw.rsplit(":", 1)
        try:
            return host_part.strip() or "169.254.37.69", int(port_part.strip())
        except ValueError:
            return host_part.strip() or "169.254.37.69", default_port
    return (raw or "169.254.37.69"), default_port


def _poll_tcp_rs485_bridge(
    host_port: str,
    slave_id: int = 1,
    baud_bps: int = 9600,
    timeout_s: float = 0.35,
) -> tuple[bytes, bytes]:
    """Poll a TCP-to-RS485 Modbus-RTU bridge over USB-C NCM tether or local LAN.

    Sends the 8-byte Function 0x03 request (`build_read_registers_request(slave_id, 0x0000, 8)`)
    and reads up to 21 bytes back, returning `(tx_frame, rx_frame)`.
    """
    _ = baud_bps
    tx_frame = build_read_registers_request(slave_id=slave_id, start_reg=0x0000, count=8)
    host, port = _parse_tcp_bridge_endpoint(host_port)
    rx_chunks = bytearray()
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(max(0.05, float(timeout_s)))
        sock.connect((host, port))
        sock.sendall(tx_frame)
        deadline = time.perf_counter() + max(0.05, float(timeout_s))
        while len(rx_chunks) < 21:
            remaining = deadline - time.perf_counter()
            if remaining <= 0:
                break
            sock.settimeout(max(0.02, remaining))
            try:
                chunk = sock.recv(21 - len(rx_chunks))
            except socket.timeout:
                break
            if not chunk:
                break
            rx_chunks.extend(chunk)
            if len(rx_chunks) >= 5 and (rx_chunks[1] & 0x80) and verify_crc16(bytes(rx_chunks[:5])):
                break
    return tx_frame, bytes(rx_chunks)


def _is_tcp_bridge_reachable(host_port: str, timeout_s: float = 0.04) -> bool:
    """Quick non-blocking check whether a TCP RS-485 bridge socket is listening."""
    host, port = _parse_tcp_bridge_endpoint(host_port)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(timeout_s)
            sock.connect((host, port))
            return True
    except Exception:
        return False


def discover_serial_ports() -> list[dict[str, Any]]:
    """Discover USB-to-RS485 ports across Linux (`/dev/ttyUSB*`), macOS (`/dev/cu.usbserial*`),
    and iPadOS / USB-C TCP RS-485 bridges (`tcp://169.254.37.69:5502`).

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

    env_bridge = os.environ.get("FIELDSCAN_RS485_BRIDGE", "").strip()
    if env_bridge:
        host, port = _parse_tcp_bridge_endpoint(env_bridge)
        bridge_uri = f"tcp://{host}:{port}"
        if bridge_uri not in seen:
            seen.add(bridge_uri)
            candidates.append(
                {
                    "device": bridge_uri,
                    "description": f"USB-C / TCP RS-485 Bridge ({host}:{port})",
                    "is_ftdi": True,
                    "is_ft2232hl": True,
                    "is_tcp_bridge": True,
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

    # On iPadOS (or when USB-C bridge probing is enabled) with no local /dev/cu.usbserial*,
    # check if the Mac Mini FT2232HL USB-C bridge (169.254.37.69:5502) is reachable.
    if not candidates and (
        os.environ.get("FIELDSCAN_PLATFORM", "").strip().lower() == "ios"
        or sys.platform == "ios"
        or os.environ.get("FIELDSCAN_PROBE_USB_BRIDGE", "0") == "1"
    ):
        default_bridge = os.environ.get("FIELDSCAN_DEFAULT_RS485_BRIDGE", "169.254.37.69:5502")
        if _is_tcp_bridge_reachable(default_bridge):
            host, port = _parse_tcp_bridge_endpoint(default_bridge)
            bridge_uri = f"tcp://{host}:{port}"
            seen.add(bridge_uri)
            candidates.append(
                {
                    "device": bridge_uri,
                    "description": f"USB-C FT2232HL Bridge ({host}:{port})",
                    "is_ftdi": True,
                    "is_ft2232hl": True,
                    "is_tcp_bridge": True,
                    "priority": 1,
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
        self._hw_miss_streak: int = 0
        self._last_hw_success: dict[str, Any] | None = None
        self._last_valid_historical: dict[str, Any] | None = None
        self._last_valid_monotonic: float = -999.0
        self._connection_generation: int = 1
        self.max_sample_age_s: float = DEFAULT_MAX_SAMPLE_AGE_S
        self._pusr_host: str = os.environ.get("FIELDSCAN_PUSR_HOST", "").strip()
        self._pusr_port: int = int(os.environ.get("FIELDSCAN_PUSR_PORT", "502") or 502)
        self._pusr_client: Any = None
        self.tx_audit_log: deque[dict[str, Any]] = deque(maxlen=256)
        self._breath_started_at: float = 0.0
        self._history: deque[dict[str, Any]] = deque(maxlen=36)
        self._latest_telemetry: dict[str, Any] = {}

        self.step_once()
        if auto_start:
            self.start()

    def set_pusr_gateway(self, host: str, port: int = 502) -> dict[str, Any]:
        """Configure isolated bench PUSR USR-DR164 Modbus TCP gateway (`MBAP`), cancelling prior connections."""
        from fieldscan.offline_guard import set_authorized_bench_gateway

        clean_host = (host or "").strip()
        clean_port = int(port)
        with self._lock:
            if self._pusr_client is not None:
                try:
                    self._pusr_client.close()
                except Exception:
                    pass
                self._pusr_client = None
            self._pusr_host = clean_host
            self._pusr_port = clean_port
            self._connection_generation += 1
            self._last_hw_success = None
            self._last_valid_monotonic = -999.0
            set_authorized_bench_gateway(clean_host or None)
        return self.get_gateway_config()

    def get_gateway_config(self) -> dict[str, Any]:
        with self._lock:
            return {
                "pusr_host": self._pusr_host,
                "pusr_port": self._pusr_port,
                "connection_generation": self._connection_generation,
            }

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
            if self._pusr_client is not None:
                try:
                    self._pusr_client.close()
                except Exception:
                    pass
                self._pusr_client = None
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
            if clean != self._mode:
                self._connection_generation += 1
                self._last_valid_monotonic = -999.0
                if self._pusr_client is not None and clean != "pusr_tcp":
                    try:
                        self._pusr_client.close()
                    except Exception:
                        pass
                    self._pusr_client = None
            self._mode = clean
            self._hw_miss_streak = 0
            if clean not in ("auto", "hardware"):
                self._last_hw_success = None
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

    @staticmethod
    def _poll_tcp_rs485_bridge(
        host_port: str,
        slave_id: int = 1,
        baud_bps: int = 9600,
        timeout_s: float = 0.35,
    ) -> tuple[bytes, bytes]:
        return _poll_tcp_rs485_bridge(
            host_port=host_port,
            slave_id=slave_id,
            baud_bps=baud_bps,
            timeout_s=timeout_s,
        )

    def _probe_single_serial(
        self, port_name: str, slave_id: int, baud_bps: int, timeout_s: float = 0.18
    ) -> tuple[dict[str, Any] | None, str, str, float]:
        """Send Function 0x03 Read Holding Registers over real RS-485 serial port or USB-C TCP bridge."""
        tx = build_read_registers_request(slave_id=slave_id, start_reg=0x0000, count=8)
        tx_hex = format_hex(tx)
        self.tx_audit_log.append(
            {
                "ts_monotonic": round(time.monotonic(), 4),
                "unit_id": slave_id,
                "function_code": 0x03,
                "tx_hex": tx_hex,
                "endpoint": port_name,
            }
        )
        t0 = time.perf_counter()
        try:
            if port_name.lower().startswith(("tcp://", "socket://")):
                tx_sent, rx = _poll_tcp_rs485_bridge(
                    host_port=port_name,
                    slave_id=slave_id,
                    baud_bps=baud_bps,
                    timeout_s=max(timeout_s, 0.35),
                )
                tx_hex = format_hex(tx_sent)
            else:
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
                    if rx and (len(rx) < 21 or not verify_crc16(rx)):
                        waiting = ser.in_waiting
                        if waiting > 0:
                            rx += ser.read(min(16, waiting))
            rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            if not rx:
                return None, tx_hex, "", rtt_ms
            if len(rx) > 21 and not verify_crc16(rx):
                for off in range(0, len(rx) - 20):
                    cand = rx[off : off + 21]
                    if verify_crc16(cand):
                        rx = cand
                        break
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
                        dev, slave_id=sid, baud_bps=baud, timeout_s=0.14
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
            pusr_host = self._pusr_host
            pusr_port = self._pusr_port

        # 0. PUSR USR-DR164 Modbus TCP (MBAP -> RTU Gateway) autonomous bench path (`BUS-02..10`)
        if mode == "pusr_tcp":
            if not pusr_host:
                return self._record_telemetry(
                    online=False,
                    source="physical_tcp_gateway:unconfigured",
                    port=None,
                    adapter_present=False,
                    mode=mode,
                    baud_bps=active_baud,
                    decoded=None,
                    tx_hex="",
                    rx_hex="",
                    roundtrip_ms=0.0,
                    status_label="PUSR GATEWAY NOT CONFIGURED",
                    protocol="modbus_tcp_mbap",
                    error_code="SOURCE_UNAVAILABLE",
                    crc_checked_by_client=False,
                    mbap_valid=False,
                )
            from fieldscan.modbus_tcp import ModbusTCPClient
            from fieldscan.offline_guard import set_authorized_bench_gateway

            set_authorized_bench_gateway(pusr_host)
            with self._lock:
                if (
                    self._pusr_client is None
                    or self._pusr_client.host != pusr_host
                    or int(self._pusr_client.port) != int(pusr_port)
                ):
                    if self._pusr_client is not None:
                        try:
                            self._pusr_client.close()
                        except Exception:
                            pass
                    self._pusr_client = ModbusTCPClient(host=pusr_host, port=pusr_port, timeout_s=1.0, pilot_readonly=True)
                client = self._pusr_client

            res = client.read_tht02_holding(unit_id=target_sid, start_reg=0x0000, count=8)
            for item in list(client.tx_audit_log)[-1:]:
                if not self.tx_audit_log or self.tx_audit_log[-1] != item:
                    self.tx_audit_log.append(item)

            gw_uri = f"modbus-tcp://{pusr_host}:{pusr_port}"
            if res.get("ok"):
                dec = res["decoded"]
                return self._record_telemetry(
                    online=True,
                    source="physical_tcp_gateway",
                    port=gw_uri,
                    adapter_present=True,
                    mode=mode,
                    baud_bps=dec.get("baud_bps", active_baud),
                    decoded=dec,
                    tx_hex=res.get("tx_hex", ""),
                    rx_hex=res.get("rx_hex", ""),
                    roundtrip_ms=float(res.get("roundtrip_ms", 0.0)),
                    status_label="SENSOR RESPONDED · 0x7FFF PROBE FAULT"
                    if dec.get("sensor_abnormal_7fff")
                    else "SENSOR RESPONDED · COMM OK (MODBUS TCP)",
                    protocol="modbus_tcp_mbap",
                    transaction_id=res.get("transaction_id"),
                    crc_checked_by_client=False,
                    mbap_valid=True,
                )
            err_code = str(res.get("error_code") or "READ_TIMEOUT")
            err_detail = str(res.get("error_detail") or err_code)
            return self._record_telemetry(
                online=False,
                source="physical_tcp_gateway",
                port=gw_uri,
                adapter_present=False,
                mode=mode,
                baud_bps=active_baud,
                decoded=None,
                tx_hex=res.get("tx_hex", ""),
                rx_hex=res.get("rx_hex", ""),
                roundtrip_ms=float(res.get("roundtrip_ms", 0.0)),
                status_label=f"PUSR {err_code} · {err_detail[:42]}",
                protocol="modbus_tcp_mbap",
                transaction_id=res.get("transaction_id"),
                error_code=err_code,
                error_detail=err_detail,
                crc_checked_by_client=False,
                mbap_valid=bool(res.get("mbap_valid", False)),
            )

        ports = discover_serial_ports()
        hw_present = len(ports) > 0

        # 1. Hardware probing when mode is "hardware" or ("auto" with real USB-RS485 plugged in)
        if mode == "hardware" or (mode == "auto" and hw_present):
            avail_devs = [p["device"] for p in ports if p.get("device")]
            port_list = (
                ([active_port] if active_port in avail_devs else [])
                + [d for d in avail_devs if d != active_port]
            )
            slave_candidates = []
            for s in (active_sid, target_sid, 1, 176):
                if 1 <= s <= 247 and s not in slave_candidates:
                    slave_candidates.append(s)

            # Fast locked-link probe with 220ms turnaround budget + 1 immediate retry
            if active_port and active_port in avail_devs:
                proto_name = "rtu_over_tcp_bridge" if str(active_port).startswith(("tcp://", "socket://")) else "modbus_rtu_serial"
                for attempt in range(2):
                    decoded, tx_hex, rx_hex, rtt_ms = self._probe_single_serial(
                        active_port, slave_id=active_sid, baud_bps=active_baud, timeout_s=0.22
                    )
                    if decoded is not None:
                        with self._lock:
                            self._hw_miss_streak = 0
                            self._last_hw_success = {
                                "port": active_port,
                                "baud_bps": active_baud,
                                "decoded": decoded,
                                "tx_hex": tx_hex,
                                "rx_hex": rx_hex,
                                "rtt_ms": rtt_ms,
                            }
                        return self._record_telemetry(
                            online=True,
                            source=f"hardware:{active_port}",
                            port=active_port,
                            adapter_present=True,
                            mode=mode,
                            baud_bps=active_baud,
                            decoded=decoded,
                            tx_hex=tx_hex,
                            rx_hex=rx_hex,
                            roundtrip_ms=rtt_ms,
                            status_label="SENSOR RESPONDED · 0x7FFF PROBE FAULT"
                            if decoded["sensor_abnormal_7fff"]
                            else "SENSOR RESPONDED · COMM OK",
                            protocol=proto_name,
                            crc_checked_by_client=True,
                        )
                    if attempt == 0:
                        time.sleep(0.015)

            for dev in port_list:
                proto_name = "rtu_over_tcp_bridge" if str(dev).startswith(("tcp://", "socket://")) else "modbus_rtu_serial"
                for sid in slave_candidates:
                    if dev == active_port and sid == active_sid:
                        continue
                    decoded, tx_hex, rx_hex, rtt_ms = self._probe_single_serial(
                        dev, slave_id=sid, baud_bps=active_baud, timeout_s=0.16
                    )
                    if decoded is not None:
                        with self._lock:
                            self._active_port = dev
                            self._active_slave_id = decoded["reported_slave_id"] or sid
                            self._hw_miss_streak = 0
                            self._last_hw_success = {
                                "port": dev,
                                "baud_bps": active_baud,
                                "decoded": decoded,
                                "tx_hex": tx_hex,
                                "rx_hex": rx_hex,
                                "rtt_ms": rtt_ms,
                            }
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
                            status_label="SENSOR RESPONDED · 0x7FFF PROBE FAULT"
                            if decoded["sensor_abnormal_7fff"]
                            else "SENSOR RESPONDED · COMM OK",
                            protocol=proto_name,
                            crc_checked_by_client=True,
                        )

            # Debounce isolated single-frame RS-485 collisions (within freshness budget)
            with self._lock:
                prev_ok = self._last_hw_success
                age_since_ok = time.monotonic() - self._last_valid_monotonic
                if (
                    prev_ok is not None
                    and hw_present
                    and prev_ok["port"] in avail_devs
                    and self._hw_miss_streak < 2
                    and age_since_ok <= self.max_sample_age_s
                ):
                    self._hw_miss_streak += 1
                    hold_ok = dict(prev_ok)
                else:
                    self._hw_miss_streak = 0
                    self._last_hw_success = None
                    hold_ok = None

            if hold_ok is not None:
                dec_hold = hold_ok["decoded"]
                proto_hold = "rtu_over_tcp_bridge" if str(hold_ok["port"]).startswith(("tcp://", "socket://")) else "modbus_rtu_serial"
                return self._record_telemetry(
                    online=True,
                    source=f"hardware:{hold_ok['port']}",
                    port=hold_ok["port"],
                    adapter_present=True,
                    mode=mode,
                    baud_bps=hold_ok["baud_bps"],
                    decoded=dec_hold,
                    tx_hex=hold_ok["tx_hex"],
                    rx_hex=hold_ok["rx_hex"],
                    roundtrip_ms=hold_ok["rtt_ms"],
                    status_label="SENSOR RESPONDED · 0x7FFF PROBE FAULT"
                    if dec_hold["sensor_abnormal_7fff"]
                    else "SENSOR RESPONDED · COMM OK",
                    protocol=proto_hold,
                    crc_checked_by_client=True,
                    preserve_original_timestamp=True,
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
                roundtrip_ms=160.0 if hw_present else 0.0,
                status_label="BUS TIMEOUT · HISTORICAL DATA ONLY"
                if (hw_present and self._last_valid_historical)
                else ("BUS TIMEOUT · NO RS-485 SIGNAL" if hw_present else "USB-RS485 ADAPTER DISCONNECTED"),
                protocol="modbus_rtu_serial",
                error_code="READ_TIMEOUT" if hw_present else "SOURCE_UNAVAILABLE",
                crc_checked_by_client=False,
            )

        # 2. Deterministic Workbench Bus Simulation modes (explicitly labeled as simulation)
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
                protocol="simulation" if mode == "sim_disconnected" else "standby_no_adapter",
                error_code="READ_TIMEOUT" if mode == "sim_disconnected" else "SOURCE_UNAVAILABLE",
                crc_checked_by_client=False,
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
                status_label="SIMULATION · 0x7FFF PROBE ALARM",
                protocol="simulation",
                crc_checked_by_client=True,
            )

        if mode == "sim_breath_test":
            elapsed = max(0.0, now - breath_t0)
            envelope = math.sin(min(math.pi * 0.85, elapsed * 0.45)) if elapsed < 6.0 else max(0.15, math.exp(-(elapsed - 6.0) / 8.0))
            sim_temp = round(24.4 + 3.2 * max(0.0, envelope), 1)
            sim_hum = round(48.6 + 34.8 * max(0.0, envelope), 1)
        else:
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
            status_label="SIMULATION · SYNTHETIC RESPONSE",
            protocol="simulation",
            crc_checked_by_client=True,
        )

    def drive_andon_relay(self, tier_color: str, relay_slave_id: int = 2) -> dict[str, Any]:
        """Preview Function 0x05 coil frames while keeping hardware Andon writes strictly disabled in pilot (`BUS-12`)."""
        clean_tier = (tier_color or "RED").strip().upper()
        coil_states = {
            0: clean_tier == "RED",
            1: clean_tier == "YELLOW",
            2: clean_tier == "GREEN",
        }
        frames_hex: list[str] = []
        for c_addr, on_flag in coil_states.items():
            frm = build_write_single_coil_request(slave_id=relay_slave_id, coil_addr=c_addr, turn_on=on_flag)
            frames_hex.append(format_hex(frm))

        # Phase 1.4 & BUS-12 safety gate: physical Andon coil transmission is disabled in pilot builds.
        return {
            "andon_light": clean_tier,
            "relay_slave_id": relay_slave_id,
            "coil_frames_hex": frames_hex,
            "transmitted_hardware": False,
            "pilot_disabled": True,
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
        protocol: str = "modbus_rtu_serial",
        transaction_id: int | None = None,
        error_code: str | None = None,
        error_detail: str | None = None,
        crc_checked_by_client: bool = False,
        mbap_valid: bool | None = None,
        preserve_original_timestamp: bool = False,
    ) -> dict[str, Any]:
        with self._lock:
            self._poll_seq += 1
            if port:
                self._active_port = port
            ts = time.time()
            now_mono = time.monotonic()
            now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

            is_sim = source.startswith("simulator:")
            temp_c = decoded["temp_c"] if decoded else None
            hum_rh = decoded["humidity_rh"] if decoded else None
            temp_q = decoded.get("temp_quality", "valid" if temp_c is not None else "unavailable") if decoded else "unavailable"
            hum_q = decoded.get("humidity_quality", "valid" if hum_rh is not None else "unavailable") if decoded else "unavailable"
            abnormal = bool(decoded["sensor_abnormal_7fff"]) if decoded else False
            slave_id = decoded["reported_slave_id"] if decoded else self.target_slave_id
            dip_bits = decoded["dip_bits"] if decoded else address_to_dip_bits(self.target_slave_id)
            healthy = bool(online and not abnormal and temp_c is not None and hum_rh is not None)
            andon_light = "GREEN" if healthy else "RED"

            if online and decoded is not None:
                if not preserve_original_timestamp or self._last_valid_historical is None:
                    self._last_valid_monotonic = now_mono
                    captured_utc = now_utc
                else:
                    captured_utc = str(self._last_valid_historical.get("captured_at_utc") or now_utc)
                self._last_valid_historical = {
                    "captured_at_utc": captured_utc,
                    "temp_c": temp_c,
                    "humidity_rh": hum_rh,
                    "temp_quality": temp_q,
                    "humidity_quality": hum_q,
                    "slave_id": slave_id,
                    "source": source,
                    "protocol": protocol,
                    "simulation": is_sim,
                }
                fresh = True
                sample_state = "fresh"
            else:
                self._last_valid_monotonic = -999.0
                captured_utc = None
                fresh = False
                sample_state = "historical" if self._last_valid_historical else "none"

            if online and temp_c is not None and hum_rh is not None:
                self._history.append(
                    {
                        "ts": round(ts, 2),
                        "temp_c": temp_c,
                        "humidity_rh": hum_rh,
                    }
                )

            if online:
                if is_sim:
                    visible_verdict = "Simulation Mode"
                    scope = "simulation"
                elif abnormal:
                    visible_verdict = "Measurement Fault (0x7FFF)"
                    scope = "sensor_communication"
                else:
                    visible_verdict = "Sensor Responded"
                    scope = "sensor_communication"
            else:
                visible_verdict = "Historical Data Only" if self._last_valid_historical else "No Sensor Response"
                scope = "historical_only" if self._last_valid_historical else "unverified"

            crc_field: bool | None
            if protocol == "modbus_tcp_mbap":
                crc_field = None
            else:
                crc_field = bool(decoded["crc_valid"]) if (decoded and crc_checked_by_client) else False

            payload: dict[str, Any] = {
                "online": online,
                "healthy": healthy,
                "fresh": fresh,
                "sample_state": sample_state,
                "captured_at_utc": captured_utc,
                "max_sample_age_s": self.max_sample_age_s,
                "simulation": is_sim,
                "scope": scope,
                "visible_verdict": visible_verdict,
                "plc_verified": False,
                "scada_verified": False,
                "calibrated_against_reference": False,
                "andon_light": andon_light,
                "andon_hardware_pilot_disabled": True,
                "sensor_abnormal_7fff": abnormal,
                "temp_quality": temp_q,
                "humidity_quality": hum_q,
                "mode": mode,
                "protocol": protocol,
                "transaction_id": transaction_id,
                "connection_generation": self._connection_generation,
                "error_code": error_code,
                "error_detail": error_detail,
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
                "crc_valid": crc_field,
                "crc_checked_by_client": crc_checked_by_client,
                "mbap_valid": mbap_valid,
                "roundtrip_ms": roundtrip_ms,
                "status_label": status_label,
                "poll_seq": self._poll_seq,
                "historical_sample": dict(self._last_valid_historical) if (not fresh and self._last_valid_historical) else None,
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
                snap = dict(self._latest_telemetry)
                # Enforce monotonic aging (`max_sample_age_s`) on physical samples even between polls (`DAT-03`)
                if snap.get("online") and not snap.get("simulation") and self._last_valid_monotonic > 0:
                    age_s = time.monotonic() - self._last_valid_monotonic
                    snap["sample_age_s"] = round(max(0.0, age_s), 3)
                    if age_s > self.max_sample_age_s:
                        snap["online"] = False
                        snap["healthy"] = False
                        snap["fresh"] = False
                        snap["sample_state"] = "historical"
                        snap["error_code"] = "STALE_SAMPLE"
                        snap["visible_verdict"] = "Historical Data Only"
                        snap["scope"] = "historical_only"
                        snap["andon_light"] = "RED"
                        snap["temp_c"] = None
                        snap["humidity_rh"] = None
                        snap["status_label"] = "STALE SAMPLE · HISTORICAL DATA ONLY"
                        if self._last_valid_historical:
                            snap["historical_sample"] = dict(self._last_valid_historical)
                return snap
        return self.step_once()
