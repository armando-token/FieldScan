"""Modbus TCP (MBAP + PDU) Client, Bounded Stream Parser & Framing Contract Validator.

Implements Phase 2.2 of the FieldScan specification for PUSR `USR-DR164` gateways:
- 7-byte MBAP header `[TxID:u16][Proto=0x0000:u16][Len:u16][UnitID:u8]` + PDU.
- Bounded receive buffer (`max_buffer_bytes = 4096`) with incremental stream reassembly
  supporting split MBAP headers and multiple concatenated responses per TCP chunk (`BUS-04`).
- Corrupt MBAP, non-zero protocol ID, oversized length, and byte-count validation (`BUS-05`).
- Strict correlation of `transaction_id`, `unit_id`, and `connection_generation` (`BUS-06`).
- Distinct Modbus Exception (`func | 0x80` + code `01..04`) vs `READ_TIMEOUT` reporting (`BUS-07`).
- Explicit protocol separation from `:5502` raw RTU-over-TCP bridges (`BUS-03`).
- Never fabricates RTU CRC-16 bytes on MBAP TCP payloads (`crc_checked_by_client = False`, `BUS-02`).
- Strict Pilot Read-Only Gate (`allowed_function_codes = {0x03}`) with TX audit log (`BUS-12`).
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
import socket
import socketserver
import struct
import threading
import time
from typing import Any

from fieldscan.modbus_rtu import (
    ABNORMAL_SENTINEL,
    address_to_dip_bits,
    build_simulated_tht02_response,
    format_hex,
    verify_crc16,
)

MAX_MBAP_PDU_LENGTH = 260
DEFAULT_MAX_BUFFER_BYTES = 4096
LEGACY_RTU_BRIDGE_PORT = 5502
DEFAULT_MODBUS_TCP_PORT = 502
DEFAULT_PUSR_AP_HOST = "10.10.100.254"
ALTERNATE_PUSR_AP_HOST = "192.168.0.7"
FALLBACK_PUSR_AP_HOST = "192.168.4.1"
RECONNECT_BACKOFF_SCHEDULE_S: tuple[float, ...] = (0.5, 1.0, 2.0, 4.0)

MODBUS_EXCEPTION_NAMES: dict[int, str] = {
    0x01: "Illegal Function",
    0x02: "Illegal Data Address",
    0x03: "Illegal Data Value",
    0x04: "Server Device Failure",
    0x05: "Acknowledge",
    0x06: "Server Device Busy",
    0x0A: "Gateway Path Unavailable",
    0x0B: "Gateway Target Device Failed to Respond",
}


class ModbusFramingError(ValueError):
    """Raised when an incoming TCP stream violates MBAP or protocol framing contracts."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class PilotWriteBlockedError(PermissionError):
    """Raised if any caller attempts a non-read-only Modbus function code in P0 pilot mode."""

    def __init__(self, func_code: int) -> None:
        super().__init__(f"Modbus write function 0x{func_code:02X} is blocked in read-only pilot mode")
        self.code = "PILOT_WRITE_BLOCKED"
        self.func_code = func_code


@dataclass(frozen=True)
class ParsedMBAPFrame:
    transaction_id: int
    protocol_id: int
    length: int
    unit_id: int
    function_code: int
    pdu_payload: bytes
    raw_bytes: bytes
    is_exception: bool = False
    exception_code: int | None = None
    exception_name: str | None = None


def build_mbap_read_holding_request(
    transaction_id: int,
    unit_id: int = 1,
    start_reg: int = 0x0000,
    count: int = 8,
    *,
    pilot_readonly: bool = True,
    function_code: int = 0x03,
) -> bytes:
    """Build a 12-byte Modbus TCP MBAP + FC03 Read Holding Registers request frame."""
    if pilot_readonly and function_code != 0x03:
        raise PilotWriteBlockedError(function_code)
    if not (1 <= count <= 125):
        raise ValueError(f"Invalid register count {count}; expected 1..125")
    tx_id = int(transaction_id) & 0xFFFF
    uid = int(unit_id) & 0xFF
    pdu = struct.pack(">BHH", function_code & 0xFF, int(start_reg) & 0xFFFF, int(count) & 0xFFFF)
    mbap_len = 1 + len(pdu)  # Unit ID (1 byte) + PDU (5 bytes) = 6
    header = struct.pack(">HHHB", tx_id, 0x0000, mbap_len, uid)
    return header + pdu


def build_mbap_holding_response(
    transaction_id: int,
    unit_id: int = 1,
    registers_u16: list[int] | tuple[int, ...] = (),
) -> bytes:
    """Build a valid Modbus TCP MBAP FC03 response frame (for testing & gateway simulation)."""
    byte_count = len(registers_u16) * 2
    pdu = struct.pack(f">BB{len(registers_u16)}H", 0x03, byte_count, *(r & 0xFFFF for r in registers_u16))
    header = struct.pack(">HHHB", transaction_id & 0xFFFF, 0x0000, 1 + len(pdu), unit_id & 0xFF)
    return header + pdu


def build_mbap_exception_response(
    transaction_id: int,
    unit_id: int,
    function_code: int,
    exception_code: int,
) -> bytes:
    """Build a 9-byte Modbus TCP MBAP exception frame (`func | 0x80` + `exception_code`)."""
    pdu = struct.pack(">BB", (function_code & 0x7F) | 0x80, exception_code & 0xFF)
    header = struct.pack(">HHHB", transaction_id & 0xFFFF, 0x0000, 1 + len(pdu), unit_id & 0xFF)
    return header + pdu


def decode_tht02_pdu_registers(
    unit_id: int,
    pdu_payload: bytes,
    *,
    expected_reg_count: int | None = 8,
) -> dict[str, Any]:
    """Decode FC03 PDU payload (`[byte_count][reg_bytes...]`) with independent per-channel quality (`DAT-05`)."""
    if len(pdu_payload) < 1:
        raise ModbusFramingError("INVALID_REGISTER_DATA", "Empty FC03 PDU payload")
    byte_count = pdu_payload[0]
    reg_bytes = pdu_payload[1:]
    if len(reg_bytes) != byte_count or byte_count < 4 or (byte_count % 2) != 0:
        raise ModbusFramingError(
            "INVALID_REGISTER_DATA",
            f"Incompatible FC03 byte_count={byte_count} vs actual={len(reg_bytes)}",
        )
    reg_count = byte_count // 2
    if expected_reg_count is not None and reg_count != expected_reg_count:
        raise ModbusFramingError(
            "INVALID_REGISTER_DATA",
            f"Expected {expected_reg_count} registers, received {reg_count}",
        )

    regs_u16 = struct.unpack(f">{reg_count}H", reg_bytes)
    raw_temp = regs_u16[0]
    raw_hum = regs_u16[1]

    temp_abnormal = raw_temp == ABNORMAL_SENTINEL
    hum_abnormal = raw_hum == ABNORMAL_SENTINEL

    if temp_abnormal:
        temp_c: float | None = None
        temp_quality = "invalid_sentinel_7fff"
    else:
        signed_temp = raw_temp - 0x10000 if (raw_temp & 0x8000) else raw_temp
        temp_c = round(signed_temp / 10.0, 1)
        temp_quality = "valid" if -45.0 <= temp_c <= 130.0 else "out_of_range"
        if temp_quality != "valid":
            temp_c = None

    if hum_abnormal:
        humidity_rh: float | None = None
        humidity_quality = "invalid_sentinel_7fff"
    else:
        cand_hum = round(raw_hum / 10.0, 1)
        humidity_quality = "valid" if 0.0 <= cand_hum <= 100.0 else "out_of_range"
        humidity_rh = cand_hum if humidity_quality == "valid" else None

    reported_addr = int(regs_u16[4]) if reg_count > 4 and 1 <= regs_u16[4] <= 247 else int(unit_id)
    raw_baud = int(regs_u16[5]) if reg_count > 5 else 0x2580
    baud_map = {
        0x12C0: 4800,
        0x2580: 9600,
        0x4B00: 19200,
        4800: 4800,
        9600: 9600,
        19200: 19200,
        0: 4800,
        1: 9600,
        2: 19200,
    }
    baud_bps = baud_map.get(raw_baud, 9600)
    hw_ver_raw = int(regs_u16[6]) if reg_count > 6 else 0x0600
    sw_ver_raw = int(regs_u16[7]) if reg_count > 7 else 0x000A

    return {
        "slave_id": int(unit_id),
        "reported_slave_id": reported_addr,
        "dip_bits": address_to_dip_bits(reported_addr),
        "temp_c": temp_c,
        "humidity_rh": humidity_rh,
        "temp_quality": temp_quality,
        "humidity_quality": humidity_quality,
        "raw_temp_hex": f"0x{raw_temp:04X}",
        "raw_humidity_hex": f"0x{raw_hum:04X}",
        "sensor_abnormal_7fff": bool(temp_abnormal or hum_abnormal),
        "temp_abnormal_7fff": temp_abnormal,
        "humidity_abnormal_7fff": hum_abnormal,
        "baud_bps": baud_bps,
        "hw_version": f"0x{hw_ver_raw:04X}",
        "sw_version": f"V{sw_ver_raw / 10.0:.1f}",
        "registers_u16": list(regs_u16),
    }


class ModbusTCPStreamParser:
    """Bounded incremental stream parser for Modbus TCP MBAP frames (`BUS-04`, `BUS-05`)."""

    def __init__(self, max_buffer_bytes: int = DEFAULT_MAX_BUFFER_BYTES, *, expect_requests: bool = False) -> None:
        self.max_buffer_bytes = max(64, int(max_buffer_bytes))
        self.expect_requests = bool(expect_requests)
        self._buf = bytearray()

    @property
    def buffered_bytes(self) -> int:
        return len(self._buf)

    def reset(self) -> None:
        self._buf.clear()

    def feed(self, chunk: bytes) -> list[ParsedMBAPFrame]:
        """Append incoming TCP bytes and return zero or more complete validated MBAP frames."""
        if not chunk:
            return []
        if len(self._buf) + len(chunk) > self.max_buffer_bytes:
            self._buf.clear()
            raise ModbusFramingError(
                "BUFFER_OVERFLOW",
                f"Incoming TCP data exceeded bounded buffer limit ({self.max_buffer_bytes} bytes)",
            )
        self._buf.extend(chunk)

        frames: list[ParsedMBAPFrame] = []
        while len(self._buf) >= 7:
            tx_id, proto_id, mbap_len, unit_id = struct.unpack(">HHHB", self._buf[:7])

            # Detect accidental raw Modbus-RTU frame arriving on an MBAP client (`BUS-03`)
            if proto_id != 0x0000:
                raw_sample = bytes(self._buf[: min(len(self._buf), 24)])
                self._buf.clear()
                if len(raw_sample) >= 5 and verify_crc16(raw_sample):
                    raise ModbusFramingError(
                        "PROTOCOL_MISMATCH",
                        "Received raw Modbus-RTU frame with CRC-16 on a Modbus TCP (MBAP) session",
                    )
                raise ModbusFramingError(
                    "INVALID_MBAP_PROTOCOL",
                    f"Invalid MBAP protocol_id=0x{proto_id:04X} (expected 0x0000)",
                )

            if mbap_len < 2 or mbap_len > MAX_MBAP_PDU_LENGTH:
                self._buf.clear()
                raise ModbusFramingError(
                    "INVALID_MBAP_LENGTH",
                    f"Invalid MBAP length={mbap_len} (allowed 2..{MAX_MBAP_PDU_LENGTH})",
                )

            total_frame_len = 6 + mbap_len  # 6 bytes (TxID+Proto+Len) + mbap_len (UnitID+PDU)
            if len(self._buf) < total_frame_len:
                # Wait for remaining bytes in next TCP chunk (`BUS-04`)
                break

            raw_frame = bytes(self._buf[:total_frame_len])
            del self._buf[:total_frame_len]

            func_code = raw_frame[7]
            pdu_payload = raw_frame[8:]

            if func_code & 0x80:
                if len(pdu_payload) != 1:
                    raise ModbusFramingError(
                        "INVALID_EXCEPTION_PDU",
                        f"Exception frame 0x{func_code:02X} expected 1 code byte, got {len(pdu_payload)}",
                    )
                exc_code = pdu_payload[0]
                frames.append(
                    ParsedMBAPFrame(
                        transaction_id=tx_id,
                        protocol_id=proto_id,
                        length=mbap_len,
                        unit_id=unit_id,
                        function_code=func_code,
                        pdu_payload=pdu_payload,
                        raw_bytes=raw_frame,
                        is_exception=True,
                        exception_code=exc_code,
                        exception_name=MODBUS_EXCEPTION_NAMES.get(exc_code, f"Unknown Exception 0x{exc_code:02X}"),
                    )
                )
                continue

            if func_code == 0x03:
                if self.expect_requests:
                    if len(pdu_payload) != 4:
                        raise ModbusFramingError("INVALID_REQUEST_PDU", f"FC03 request expected 4 bytes, got {len(pdu_payload)}")
                else:
                    if len(pdu_payload) < 1:
                        raise ModbusFramingError("INVALID_REGISTER_DATA", "Missing FC03 byte_count")
                    declared_bytes = pdu_payload[0]
                    if len(pdu_payload) - 1 != declared_bytes or declared_bytes < 2 or (declared_bytes % 2) != 0:
                        raise ModbusFramingError(
                            "INVALID_REGISTER_DATA",
                            f"FC03 byte_count={declared_bytes} incompatible with payload length {len(pdu_payload) - 1}",
                        )

            frames.append(
                ParsedMBAPFrame(
                    transaction_id=tx_id,
                    protocol_id=proto_id,
                    length=mbap_len,
                    unit_id=unit_id,
                    function_code=func_code,
                    pdu_payload=pdu_payload,
                    raw_bytes=raw_frame,
                    is_exception=False,
                )
            )
        return frames


@dataclass
class ModbusTCPClient:
    """Serialized, cancellable single-pending-request Modbus TCP client for PUSR gateways."""

    host: str
    port: int = DEFAULT_MODBUS_TCP_PORT
    timeout_s: float = 1.0
    pilot_readonly: bool = True
    allow_legacy_bridge_port: bool = False
    backoff_schedule_s: tuple[float, ...] = RECONNECT_BACKOFF_SCHEDULE_S
    monotonic_fn: Any = time.monotonic
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False, repr=False)
    _sock: socket.socket | None = field(default=None, init=False, repr=False)
    _parser: ModbusTCPStreamParser = field(default_factory=ModbusTCPStreamParser, init=False, repr=False)
    _tx_seq: int = field(default=0, init=False, repr=False)
    _conn_gen: int = field(default=0, init=False, repr=False)
    _consecutive_failures: int = field(default=0, init=False, repr=False)
    _next_retry_monotonic: float = field(default=0.0, init=False, repr=False)
    tx_audit_log: deque[dict[str, Any]] = field(default_factory=lambda: deque(maxlen=256), init=False, repr=False)

    def close(self) -> None:
        with self._lock:
            self._close_unlocked()

    def _close_unlocked(self) -> None:
        self._conn_gen += 1
        self._parser.reset()
        if self._sock is not None:
            try:
                self._sock.close()
            except OSError:
                pass
            self._sock = None

    def current_backoff_delay_s(self) -> float:
        if self._consecutive_failures <= 0:
            return 0.0
        idx = min(self._consecutive_failures - 1, len(self.backoff_schedule_s) - 1)
        return float(self.backoff_schedule_s[idx])

    def _record_failure_unlocked(self) -> float:
        self._close_unlocked()
        self._consecutive_failures += 1
        delay = self.current_backoff_delay_s()
        self._next_retry_monotonic = float(self.monotonic_fn()) + delay
        return delay

    def send_raw_for_audit_check(self, function_code: int) -> None:
        """Enforce P0 pilot read-only gate (`BUS-12`)."""
        if self.pilot_readonly and function_code != 0x03:
            raise PilotWriteBlockedError(function_code)

    def read_tht02_holding(
        self,
        unit_id: int = 1,
        start_reg: int = 0x0000,
        count: int = 8,
        *,
        respect_backoff: bool = False,
    ) -> dict[str, Any]:
        """Execute a single correlated FC03 read over Modbus TCP (MBAP) and return structured diagnostics."""
        if int(self.port) == LEGACY_RTU_BRIDGE_PORT and not self.allow_legacy_bridge_port:
            return {
                "ok": False,
                "error_code": "PROTOCOL_MISMATCH",
                "error_detail": (
                    f"Port {LEGACY_RTU_BRIDGE_PORT} is reserved for raw RTU-over-TCP bridge framing; "
                    "Modbus TCP (MBAP) refuses to target :5502 by default."
                ),
                "protocol": "modbus_tcp_mbap",
                "transport_status": "protocol_blocked",
                "tx_hex": "",
                "rx_hex": "",
                "crc_checked_by_client": False,
                "mbap_valid": False,
            }

        with self._lock:
            now_mono = float(self.monotonic_fn())
            if respect_backoff and now_mono < self._next_retry_monotonic:
                wait_rem = round(self._next_retry_monotonic - now_mono, 2)
                return {
                    "ok": False,
                    "error_code": "BACKOFF_ACTIVE",
                    "error_detail": f"Reconnect backoff active ({wait_rem}s remaining)",
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "backoff_waiting",
                    "tx_hex": "",
                    "rx_hex": "",
                    "crc_checked_by_client": False,
                    "mbap_valid": False,
                    "backoff_s": wait_rem,
                }

            self._tx_seq = (self._tx_seq % 0xFFFF) + 1
            tx_id = self._tx_seq
            req_bytes = build_mbap_read_holding_request(
                transaction_id=tx_id,
                unit_id=unit_id,
                start_reg=start_reg,
                count=count,
                pilot_readonly=self.pilot_readonly,
                function_code=0x03,
            )
            tx_hex = format_hex(req_bytes)
            t0 = time.perf_counter()

            tcp_connected = False
            try:
                if self._sock is None:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(max(0.1, float(self.timeout_s)))
                    sock.connect((self.host, int(self.port)))
                    self._sock = sock
                    self._conn_gen += 1
                    self._parser.reset()

                active_gen = self._conn_gen
                assert self._sock is not None

                # Drain any stale unread bytes from a late prior response before sending (`BUS-06`)
                self._sock.setblocking(False)
                try:
                    while True:
                        stale = self._sock.recv(1024)
                        if not stale:
                            break
                except BlockingIOError:
                    pass
                finally:
                    self._sock.settimeout(max(0.1, float(self.timeout_s)))
                self._parser.reset()

                self.tx_audit_log.append(
                    {
                        "ts_monotonic": round(time.monotonic(), 4),
                        "transaction_id": tx_id,
                        "unit_id": unit_id,
                        "function_code": 0x03,
                        "tx_hex": tx_hex,
                        "endpoint": f"{self.host}:{self.port}",
                    }
                )
                self._sock.sendall(req_bytes)
                tcp_connected = True

                deadline = time.perf_counter() + max(0.1, float(self.timeout_s))
                discarded_frames: list[dict[str, Any]] = []

                while True:
                    remaining = deadline - time.perf_counter()
                    if remaining <= 0:
                        rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                        backoff_s = self._record_failure_unlocked()
                        return {
                            "ok": False,
                            "gateway_connected": True,
                            "error_code": "READ_TIMEOUT",
                            "error_detail": f"Timed out after {self.timeout_s:.2f}s awaiting MBAP TxID {tx_id}",
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "timeout",
                            "transaction_id": tx_id,
                            "tx_hex": tx_hex,
                            "rx_hex": "",
                            "roundtrip_ms": rtt_ms,
                            "crc_checked_by_client": False,
                            "mbap_valid": False,
                            "discarded_frames": discarded_frames,
                            "backoff_s": backoff_s,
                        }

                    self._sock.settimeout(max(0.02, remaining))
                    chunk = self._sock.recv(512)
                    if not chunk:
                        rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                        backoff_s = self._record_failure_unlocked()
                        return {
                            "ok": False,
                            "gateway_connected": False,
                            "error_code": "SOURCE_UNAVAILABLE",
                            "error_detail": "Gateway closed TCP connection before full MBAP frame arrived",
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "disconnected",
                            "transaction_id": tx_id,
                            "tx_hex": tx_hex,
                            "rx_hex": "",
                            "roundtrip_ms": rtt_ms,
                            "crc_checked_by_client": False,
                            "mbap_valid": False,
                            "backoff_s": backoff_s,
                        }

                    if active_gen != self._conn_gen:
                        return {
                            "ok": False,
                            "error_code": "CONNECTION_CANCELLED",
                            "error_detail": "Connection generation changed while awaiting response",
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "cancelled",
                            "transaction_id": tx_id,
                            "tx_hex": tx_hex,
                            "rx_hex": "",
                            "crc_checked_by_client": False,
                            "mbap_valid": False,
                        }

                    parsed_list = self._parser.feed(chunk)
                    for frame in parsed_list:
                        # Discard mismatched transaction IDs (e.g. late response from earlier timed-out poll, `BUS-06`)
                        if frame.transaction_id != tx_id:
                            discarded_frames.append(
                                {
                                    "reason": "WRONG_TRANSACTION_ID",
                                    "expected_tx_id": tx_id,
                                    "received_tx_id": frame.transaction_id,
                                    "rx_hex": format_hex(frame.raw_bytes),
                                }
                            )
                            continue

                        if frame.unit_id != (unit_id & 0xFF):
                            discarded_frames.append(
                                {
                                    "reason": "WRONG_UNIT",
                                    "expected_unit_id": unit_id,
                                    "received_unit_id": frame.unit_id,
                                    "rx_hex": format_hex(frame.raw_bytes),
                                }
                            )
                            rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                            return {
                                "ok": False,
                                "gateway_connected": True,
                                "error_code": "WRONG_UNIT",
                                "error_detail": f"Expected Unit ID {unit_id}, received Unit ID {frame.unit_id}",
                                "protocol": "modbus_tcp_mbap",
                                "transport_status": "wrong_unit",
                                "transaction_id": tx_id,
                                "tx_hex": tx_hex,
                                "rx_hex": format_hex(frame.raw_bytes),
                                "roundtrip_ms": rtt_ms,
                                "crc_checked_by_client": False,
                                "mbap_valid": True,
                                "discarded_frames": discarded_frames,
                            }

                        rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                        self._consecutive_failures = 0
                        self._next_retry_monotonic = 0.0

                        if frame.is_exception:
                            return {
                                "ok": False,
                                "gateway_connected": True,
                                "error_code": "MODBUS_EXCEPTION",
                                "exception_code": frame.exception_code,
                                "exception_name": frame.exception_name,
                                "error_detail": (
                                    f"Modbus Exception 0x{frame.function_code:02X} "
                                    f"code 0x{(frame.exception_code or 0):02X} ({frame.exception_name})"
                                ),
                                "protocol": "modbus_tcp_mbap",
                                "transport_status": "modbus_exception",
                                "transaction_id": tx_id,
                                "unit_id": frame.unit_id,
                                "tx_hex": tx_hex,
                                "rx_hex": format_hex(frame.raw_bytes),
                                "roundtrip_ms": rtt_ms,
                                "crc_checked_by_client": False,
                                "mbap_valid": True,
                                "discarded_frames": discarded_frames,
                            }

                        decoded = decode_tht02_pdu_registers(
                            unit_id=frame.unit_id,
                            pdu_payload=frame.pdu_payload,
                            expected_reg_count=count,
                        )
                        return {
                            "ok": True,
                            "gateway_connected": True,
                            "error_code": None,
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "response_received",
                            "transaction_id": tx_id,
                            "unit_id": frame.unit_id,
                            "tx_hex": tx_hex,
                            "rx_hex": format_hex(frame.raw_bytes),
                            "roundtrip_ms": rtt_ms,
                            "crc_checked_by_client": False,
                            "crc_valid": None,
                            "mbap_valid": True,
                            "decoded": decoded,
                            "discarded_frames": discarded_frames,
                        }

            except ModbusFramingError as exc:
                rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                backoff_s = self._record_failure_unlocked()
                return {
                    "ok": False,
                    "gateway_connected": tcp_connected,
                    "error_code": exc.code,
                    "error_detail": str(exc),
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "framing_error",
                    "transaction_id": tx_id,
                    "tx_hex": tx_hex,
                    "rx_hex": "",
                    "roundtrip_ms": rtt_ms,
                    "crc_checked_by_client": False,
                    "mbap_valid": False,
                    "backoff_s": backoff_s,
                }
            except socket.timeout:
                rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                backoff_s = self._record_failure_unlocked()
                return {
                    "ok": False,
                    "gateway_connected": tcp_connected,
                    "error_code": "READ_TIMEOUT",
                    "error_detail": f"Socket timeout ({self.timeout_s:.2f}s) connecting/reading {self.host}:{self.port}",
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "timeout",
                    "transaction_id": tx_id,
                    "tx_hex": tx_hex,
                    "rx_hex": "",
                    "roundtrip_ms": rtt_ms,
                    "crc_checked_by_client": False,
                    "mbap_valid": False,
                    "backoff_s": backoff_s,
                }
            except OSError as exc:
                rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                backoff_s = self._record_failure_unlocked()
                return {
                    "ok": False,
                    "gateway_connected": False,
                    "error_code": "SOURCE_UNAVAILABLE",
                    "error_detail": f"TCP gateway {self.host}:{self.port} unreachable: {exc}",
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "unreachable",
                    "transaction_id": tx_id,
                    "tx_hex": tx_hex,
                    "rx_hex": "",
                    "roundtrip_ms": rtt_ms,
                    "crc_checked_by_client": False,
                    "mbap_valid": False,
                    "backoff_s": backoff_s,
                }


class _MBAPStubTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True
    behavior: dict[str, Any]


class _MBAPStubHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        cfg = self.server.behavior  # type: ignore[attr-defined]
        parser = ModbusTCPStreamParser(expect_requests=True)
        self.request.settimeout(2.5)
        try:
            while True:
                data = self.request.recv(256)
                if not data:
                    break
                cfg["rx_log"].append(data)
                mode = cfg.get("mode", "nominal")

                if mode == "drop_silent":
                    continue
                if mode == "raw_rtu_reply":
                    rtu = build_simulated_tht02_response(slave_id=1, temp_c=24.5, humidity_rh=50.2)
                    self.request.sendall(rtu)
                    continue
                if mode == "corrupt_mbap":
                    self.request.sendall(b"\x00\x01\x00\x05\x00\x06\x01\x03\x02\x00\xfa")
                    continue

                frames = parser.feed(data)
                for req in frames:
                    if mode == "exception_02":
                        resp = build_mbap_exception_response(req.transaction_id, req.unit_id, req.function_code, 0x02)
                        self.request.sendall(resp)
                        continue

                    raw_temp = int(round(cfg.get("temp_c", 24.7) * 10.0)) & 0xFFFF
                    if cfg.get("temp_7fff"):
                        raw_temp = ABNORMAL_SENTINEL
                    raw_hum = int(round(cfg.get("humidity_rh", 51.2) * 10.0)) & 0xFFFF
                    if cfg.get("hum_7fff"):
                        raw_hum = ABNORMAL_SENTINEL

                    regs = [raw_temp, raw_hum, 0, 0, req.unit_id, 0x2580, 0x0600, 0x000B]

                    if mode == "wrong_unit":
                        resp = build_mbap_holding_response(req.transaction_id, (req.unit_id % 240) + 2, regs)
                        self.request.sendall(resp)
                    elif mode == "stale_then_valid":
                        stale = build_mbap_holding_response((req.transaction_id + 99) & 0xFFFF, req.unit_id, regs)
                        valid = build_mbap_holding_response(req.transaction_id, req.unit_id, regs)
                        # Send both concatenated in a single TCP chunk (`BUS-04` + `BUS-06`)
                        self.request.sendall(stale + valid)
                    elif mode == "split_header":
                        valid = build_mbap_holding_response(req.transaction_id, req.unit_id, regs)
                        self.request.sendall(valid[:3])
                        time.sleep(0.015)
                        self.request.sendall(valid[3:7])
                        time.sleep(0.015)
                        self.request.sendall(valid[7:])
                    else:
                        valid = build_mbap_holding_response(req.transaction_id, req.unit_id, regs)
                        self.request.sendall(valid)
        except (OSError, ModbusFramingError):
            pass


def start_mbap_test_gateway(
    host: str = "127.0.0.1",
    port: int = 0,
    mode: str = "nominal",
    temp_c: float = 24.7,
    humidity_rh: float = 51.2,
) -> tuple[_MBAPStubTCPServer, str, int, dict[str, Any]]:
    """Launch an in-memory PUSR MBAP test gateway on loopback for deterministic contract tests."""
    behavior: dict[str, Any] = {
        "mode": mode,
        "temp_c": temp_c,
        "humidity_rh": humidity_rh,
        "temp_7fff": False,
        "hum_7fff": False,
        "rx_log": [],
    }
    srv = _MBAPStubTCPServer((host, port), _MBAPStubHandler)
    srv.behavior = behavior
    bound_host, bound_port = srv.server_address[:2]
    t = threading.Thread(target=srv.serve_forever, name="mbap-stub-gateway", daemon=True)
    t.start()
    return srv, str(bound_host), int(bound_port), behavior


# =============================================================================
# AP-First Direct PUSR Gateway Discovery (Explicit Operator Action Only)
# =============================================================================


def is_private_rfc1918_ipv4(host: str, *, allow_loopback: bool = False) -> bool:
    """Return True strictly for private RFC1918 IPv4 addresses (10/8, 172.16/12, 192.168/16)."""
    import ipaddress

    clean = (host or "").strip()
    if not clean:
        return False
    try:
        ip_obj = ipaddress.ip_address(clean)
    except ValueError:
        return False
    if not isinstance(ip_obj, ipaddress.IPv4Address):
        return False
    if ip_obj.is_loopback:
        return bool(allow_loopback)
    first = int(ip_obj.packed[0])
    second = int(ip_obj.packed[1])
    if first == 10:
        return True
    if first == 172 and 16 <= second <= 31:
        return True
    if first == 192 and second == 168:
        return True
    return False


def detect_local_wifi_ipv4() -> str | None:
    """Read active local Wi-Fi (en0 / wlan0) private RFC1918 IPv4 without emitting any network packets."""
    try:
        import psutil
    except Exception:
        return None

    fallback: str | None = None
    try:
        addrs = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
    except Exception:
        return None

    for if_name, snic_list in addrs.items():
        st = stats.get(if_name)
        if st is not None and not st.isup:
            continue
        for snic in snic_list:
            if snic.family != socket.AF_INET:
                continue
            ip_str = (snic.address or "").strip()
            if not is_private_rfc1918_ipv4(ip_str):
                continue
            if if_name in ("en0", "wlan0"):
                return ip_str
            if (if_name.startswith("en") or if_name.startswith("wlan")) and fallback is None:
                fallback = ip_str
    return fallback


def build_direct_ap_candidates(
    wifi_ip: str | None,
    *,
    saved_host: str | None = None,
    extra_hosts: list[str] | None = None,
    allow_loopback_extra: bool = False,
) -> list[dict[str, str]]:
    """Build prioritized, deduplicated private RFC1918 Direct PUSR AP candidates."""
    seen: set[str] = set()
    out: list[dict[str, str]] = []
    clean_wifi = (wifi_ip or "").strip()

    def _add(host: str, label: str, topology: str = "ap_direct", allow_lo: bool = False) -> None:
        h = (host or "").strip()
        if not h or h == clean_wifi:
            return
        if not is_private_rfc1918_ipv4(h, allow_loopback=allow_lo):
            return
        if h in seen:
            return
        seen.add(h)
        out.append({"host": h, "label": label, "topology": topology})

    if clean_wifi and is_private_rfc1918_ipv4(clean_wifi):
        octets = clean_wifi.split(".")
        if len(octets) == 4:
            prefix = f"{octets[0]}.{octets[1]}.{octets[2]}"
            is_pusr_sub = prefix == "10.10.100"
            _add(
                f"{prefix}.254",
                "Direct PUSR AP Default (Active Subnet)" if is_pusr_sub else "Active Wi-Fi Subnet AP (.254)",
            )
            _add(f"{prefix}.1", "Active Wi-Fi Subnet AP (.1)")
            _add(f"{prefix}.7", "Active Wi-Fi Subnet Static (.7)")

    _add(DEFAULT_PUSR_AP_HOST, "Direct PUSR AP Default")
    _add(ALTERNATE_PUSR_AP_HOST, "Direct PUSR Alternate AP")
    _add(FALLBACK_PUSR_AP_HOST, "Direct Wi-Fi AP Fallback")

    if saved_host:
        _add(saved_host, "Saved Gateway", topology="ap_direct")

    for extra in extra_hosts or []:
        _add(extra, "Explicit Bench Candidate", topology="ap_direct", allow_lo=allow_loopback_extra)

    return out


def probe_tcp_port(
    host: str,
    port: int = DEFAULT_MODBUS_TCP_PORT,
    timeout_s: float = 0.45,
    *,
    allow_loopback: bool = False,
) -> dict[str, Any]:
    """Fast non-blocking TCP reachability probe on MBAP port (default :502); blocks :5502 and WAN IPs."""
    if int(port) == LEGACY_RTU_BRIDGE_PORT:
        return {"reachable": False, "rtt_ms": 0.0, "error_code": "PROTOCOL_MISMATCH"}
    clean_host = (host or "").strip()
    if not is_private_rfc1918_ipv4(clean_host, allow_loopback=allow_loopback):
        return {"reachable": False, "rtt_ms": 0.0, "error_code": "WAN_HOST_BLOCKED"}

    bounded_timeout = min(max(float(timeout_s), 0.10), 2.0)
    t0 = time.monotonic()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.settimeout(bounded_timeout)
        sock.connect((clean_host, int(port)))
        rtt_ms = round((time.monotonic() - t0) * 1000.0, 1)
        return {"reachable": True, "rtt_ms": rtt_ms, "error_code": None}
    except socket.timeout:
        rtt_ms = round((time.monotonic() - t0) * 1000.0, 1)
        return {"reachable": False, "rtt_ms": rtt_ms, "error_code": "TIMEOUT"}
    except PermissionError:
        rtt_ms = round((time.monotonic() - t0) * 1000.0, 1)
        return {"reachable": False, "rtt_ms": rtt_ms, "error_code": "LOCAL_NETWORK_DENIED"}
    except OSError:
        rtt_ms = round((time.monotonic() - t0) * 1000.0, 1)
        return {"reachable": False, "rtt_ms": rtt_ms, "error_code": "UNREACHABLE"}
    finally:
        try:
            sock.close()
        except Exception:
            pass


def discover_direct_pusr_ap(
    *,
    port: int = DEFAULT_MODBUS_TCP_PORT,
    timeout_s: float = 0.45,
    saved_host: str | None = None,
    wifi_ip_override: str | None = None,
    extra_hosts: list[str] | None = None,
    allow_loopback_extra: bool = False,
) -> dict[str, Any]:
    """Parallel AP-First discovery across active Wi-Fi subnet and PUSR factory Direct AP defaults."""
    from concurrent.futures import ThreadPoolExecutor
    from fieldscan.offline_guard import authorized_bench_probe_scope

    clean_port = int(port)
    presets = [
        {"host": DEFAULT_PUSR_AP_HOST, "port": clean_port, "label": "Direct PUSR AP Default", "topology": "ap_direct"},
        {"host": ALTERNATE_PUSR_AP_HOST, "port": clean_port, "label": "Direct PUSR Alternate AP", "topology": "ap_direct"},
    ]

    if clean_port == LEGACY_RTU_BRIDGE_PORT:
        return {
            "ok": False,
            "found": False,
            "error_code": "PROTOCOL_MISMATCH",
            "port": clean_port,
            "wifi_ip": None,
            "recommended_host": None,
            "recommended_topology": "ap_direct",
            "candidates": [],
            "presets": presets,
            "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 in Modbus TCP (MBAP) mode on port 502.",
        }

    wifi_ip = wifi_ip_override if wifi_ip_override is not None else detect_local_wifi_ipv4()
    candidates = build_direct_ap_candidates(
        wifi_ip,
        saved_host=saved_host,
        extra_hosts=extra_hosts,
        allow_loopback_extra=allow_loopback_extra,
    )

    candidate_hosts = [c["host"] for c in candidates]
    rows: list[dict[str, Any]] = []
    with authorized_bench_probe_scope(candidate_hosts, allow_loopback=allow_loopback_extra):
        def _probe_one(cand: dict[str, str]) -> dict[str, Any]:
            res = probe_tcp_port(
                cand["host"],
                port=clean_port,
                timeout_s=timeout_s,
                allow_loopback=allow_loopback_extra,
            )
            return {
                "host": cand["host"],
                "port": clean_port,
                "label": cand["label"],
                "topology": cand["topology"],
                "reachable": bool(res["reachable"]),
                "rtt_ms": float(res["rtt_ms"]),
                "error_code": res["error_code"],
            }

        if candidates:
            with ThreadPoolExecutor(max_workers=min(8, len(candidates))) as pool:
                rows = list(pool.map(_probe_one, candidates))

    winner = next((r for r in rows if r["reachable"]), None)
    rec_host = winner["host"] if winner else None
    rec_topo = winner["topology"] if winner else "ap_direct"
    any_denied = any(r.get("error_code") == "LOCAL_NETWORK_DENIED" for r in rows)

    if rec_host and winner:
        message = f"Detected PUSR Modbus TCP gateway at {rec_host}:{clean_port} ({winner['rtt_ms']:.1f} ms)."
    elif any_denied:
        message = "Local Network permission denied. Enable Local Network access and retry."
    elif wifi_ip:
        message = (
            f"No PUSR gateway answered on port {clean_port} from Wi-Fi IP {wifi_ip}. "
            f"Join the PUSR AP Wi-Fi SSID, verify pure AP Mode + Modbus TCP (:{clean_port}), or tap a preset below."
        )
    else:
        message = (
            "No active Wi-Fi IPv4 address detected. Join the PUSR USR-DR164 Direct AP Wi-Fi SSID "
            "(no router or internet needed), then retry."
        )

    return {
        "ok": True,
        "found": rec_host is not None,
        "wifi_ip": wifi_ip,
        "port": clean_port,
        "recommended_host": rec_host,
        "recommended_topology": rec_topo,
        "candidates": rows,
        "presets": presets,
        "message": message,
    }


PUSR_UDP_CONFIG_PORT = 48899
PUSR_FACTORY_TCP_PORT = 8899


def send_pusr_udp_command(
    host: str,
    command: str,
    *,
    port: int = PUSR_UDP_CONFIG_PORT,
    timeout_s: float = 0.55,
    sock: socket.socket | None = None,
) -> tuple[str | None, str | None, str | None]:
    """Send one UDP datagram on private RFC1918 LAN to PUSR Network AT port (`48899`)."""
    clean_host = (host or "").strip()
    if not is_private_rfc1918_ipv4(clean_host):
        return None, None, "WAN_HOST_BLOCKED"

    owns_sock = sock is None
    udp_sock = sock
    if udp_sock is None:
        udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        udp_sock.settimeout(min(max(float(timeout_s), 0.15), 2.0))
        udp_sock.sendto(command.encode("utf-8"), (clean_host, int(port)))
        data, sender = udp_sock.recvfrom(1024)
        reply = data.decode("utf-8", errors="ignore").strip()
        sender_ip = str(sender[0]) if sender else None
        return reply, sender_ip, None
    except socket.timeout:
        return None, None, "TIMEOUT"
    except PermissionError:
        return None, None, "LOCAL_NETWORK_DENIED"
    except OSError:
        return None, None, "UDP_SEND_FAILED"
    finally:
        if owns_sock:
            try:
                udp_sock.close()
            except Exception:
                pass


def ensure_pusr_web_modbus_enabled(
    host: str,
    *,
    baud: int = 9600,
    force_restart: bool = False,
) -> dict[str, Any]:
    """Inspect `http://<host>/port_en.html` (strictly RFC1918 LAN) and enable USR-DR164 Modbus TCP Protocol Conversion."""
    import base64
    import re
    import urllib.parse
    import urllib.request
    from fieldscan.offline_guard import authorized_bench_probe_scope

    clean_host = (host or "").strip()
    if not is_private_rfc1918_ipv4(clean_host):
        return {
            "checked": False,
            "changed": False,
            "restarted": False,
            "modbus_mode": None,
            "baud_read": None,
            "log": [{"cmd": "HTTP port_en.html", "reply": "WAN_HOST_BLOCKED"}],
        }

    auth_hdr = "Basic " + base64.b64encode(b"admin:admin").decode("ascii")
    log: list[dict[str, str]] = []

    def _http(path: str, method: str = "GET", body: bytes | None = None, referer: str | None = None) -> tuple[int, str] | None:
        req = urllib.request.Request(f"http://{clean_host}/{path}", data=body, method=method)
        req.add_header("Authorization", auth_hdr)
        if referer:
            req.add_header("Referer", referer)
        if body is not None:
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
        try:
            with urllib.request.urlopen(req, timeout=2.2) as resp:
                return int(resp.status), resp.read().decode("utf-8", errors="replace")
        except Exception:
            return None

    with authorized_bench_probe_scope([clean_host]):
        res = _http("port_en.html")
        if not res or res[0] != 200 or "modbus_mode_setting" not in res[1]:
            return {"checked": False, "changed": False, "restarted": False, "modbus_mode": None, "baud_read": None, "log": log}
        html = res[1]
        m_mb = re.search(r'var\s+modbus_mode_setting\s*=\s*"([^"]*)"', html)
        m_bd = re.search(r'var\s+uart_setting_baud\s*=\s*"([^"]*)"', html)
        cur_mb = m_mb.group(1) if m_mb else None
        cur_bd = m_bd.group(1) if m_bd else None
        log.append({"cmd": "GET port_en.html", "reply": f"baud={cur_bd or '?'}, modbus_mode={cur_mb or '?'}"})

        needs_update = (cur_mb not in ("1", "2")) or (cur_bd != str(baud))
        changed = False
        if needs_update:
            payload = urllib.parse.urlencode(
                [
                    ("uart_setting_baud", str(baud)),
                    ("uart_setting_data", "databit_8"),
                    ("uart_setting_parity", "none"),
                    ("uart_setting_stop", "stopbit_1"),
                    ("uart_setting_fc", "NFC"),
                    ("uart_setting_packtime", "20"),
                    ("uart_setting_packsize", "1400"),
                    ("com_setting_hearten", "0"),
                    ("com_setting_hearttm", "60"),
                    ("com_setting_heartdt", "5553522D4452313634"),
                    ("com_setting_heartty", "0"),
                    ("modbus_mode_setting", "1"),
                    ("modbus_outt_setting", "200"),
                    ("modbus_polt_setting", "10"),
                    ("modbus_eack_setting", "0"),
                ]
            ).encode("utf-8")
            pres = _http("do_cmd_en.html", method="POST", body=payload, referer=f"http://{clean_host}/port_en.html")
            if pres and pres[0] == 200:
                changed = ("Saved Successfully" in pres[1]) or ("RESTART" in pres[1])
                log.append({"cmd": f"POST do_cmd_en.html (modbus=1, baud={baud})", "reply": "Saved Successfully" if changed else f"HTTP {pres[0]}"})

        restarted = False
        if changed or force_restart:
            rres = _http("success_en.html", method="POST", body=b"HF_PROCESS_CMD=RESTART", referer=f"http://{clean_host}/restart_en.html")
            if rres:
                restarted = rres[0] == 200
                log.append({"cmd": "POST success_en.html (RESTART)", "reply": f"HTTP {rres[0]}"})
            else:
                restarted = True
                log.append({"cmd": "POST success_en.html (RESTART)", "reply": "REBOOTING"})

    return {
        "checked": True,
        "changed": changed,
        "restarted": restarted,
        "modbus_mode": cur_mb,
        "baud_read": cur_bd,
        "log": log,
    }


def auto_provision_pusr_gateway(
    *,
    preferred_host: str | None = None,
    baud: int = 9600,
    target_port: int = DEFAULT_MODBUS_TCP_PORT,
    wifi_ip_override: str | None = None,
) -> dict[str, Any]:
    """1-Tap PUSR USR-DR164 diagnostics & automatic UDP `48899` provisioning (`9600 8N1`, `TCP Server :502`, `Modbus TCP`, `AT+Z`)."""
    from fieldscan.offline_guard import authorized_bench_probe_scope

    clean_port = int(target_port)
    if clean_port == LEGACY_RTU_BRIDGE_PORT:
        return {
            "ok": False,
            "status": "protocol_mismatch",
            "error_code": "PROTOCOL_MISMATCH",
            "message": "Port 5502 is forbidden; PUSR USR-DR164 must run Modbus TCP (MBAP) on port 502.",
        }

    wifi_ip = wifi_ip_override if wifi_ip_override is not None else detect_local_wifi_ipv4()
    candidates = build_direct_ap_candidates(wifi_ip, saved_host=preferred_host)
    candidate_hosts = [c["host"] for c in candidates]

    udp_targets: list[str] = []
    if wifi_ip and is_private_rfc1918_ipv4(wifi_ip):
        octs = wifi_ip.split(".")
        if len(octs) == 4:
            pfx = f"{octs[0]}.{octs[1]}.{octs[2]}"
            for suffix in (".254", ".255", ".1"):
                cand = f"{pfx}{suffix}"
                if cand not in udp_targets:
                    udp_targets.append(cand)
    for h in (preferred_host or "", DEFAULT_PUSR_AP_HOST, ALTERNATE_PUSR_AP_HOST):
        if h and is_private_rfc1918_ipv4(h) and h not in udp_targets:
            udp_targets.append(h)

    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    udp_reply: str | None = None
    udp_host: str | None = None
    local_net_denied = False
    host_502: str | None = None
    host_8899: str | None = None
    host_80: str | None = None
    at_log: list[dict[str, str]] = []
    applied_count = 0
    reboot_sent = False

    try:
        for target in udp_targets:
            rep, sip, err = send_pusr_udp_command(
                target,
                "www.usr.cn",
                port=PUSR_UDP_CONFIG_PORT,
                timeout_s=0.45,
                sock=udp_sock,
            )
            if err == "LOCAL_NETWORK_DENIED":
                local_net_denied = True
                break
            if rep:
                udp_reply = rep
                first_field = rep.split(",")[0].strip()
                if is_private_rfc1918_ipv4(first_field):
                    udp_host = first_field
                elif sip and is_private_rfc1918_ipv4(sip):
                    udp_host = sip
                elif not target.endswith(".255"):
                    udp_host = target
                break

        probe_list: list[str] = []
        if udp_host:
            probe_list.append(udp_host)
        for h in candidate_hosts:
            if h not in probe_list:
                probe_list.append(h)

        with authorized_bench_probe_scope(probe_list[:4]):
            for h in probe_list[:4]:
                p502 = probe_tcp_port(h, port=clean_port, timeout_s=0.75)
                if p502.get("error_code") == "LOCAL_NETWORK_DENIED":
                    local_net_denied = True
                    break
                if p502.get("reachable"):
                    host_502 = h
                    break
                p8899 = probe_tcp_port(h, port=PUSR_FACTORY_TCP_PORT, timeout_s=0.35)
                if p8899.get("reachable") and host_8899 is None:
                    host_8899 = h
                p80 = probe_tcp_port(h, port=80, timeout_s=0.40)
                if p80.get("reachable") and host_80 is None:
                    host_80 = h

        if local_net_denied:
            return {
                "ok": False,
                "status": "local_network_denied",
                "error_code": "LOCAL_NETWORK_DENIED",
                "wifi_ip": wifi_ip,
                "message": "Local Network permission is OFF. Enable Local Network access and retry.",
            }

        if host_502:
            web_res = ensure_pusr_web_modbus_enabled(host_502, baud=baud, force_restart=False)
            if web_res["changed"] and web_res["restarted"]:
                time.sleep(3.2)
                reopened = False
                with authorized_bench_probe_scope([host_502]):
                    for _ in range(8):
                        if probe_tcp_port(host_502, port=clean_port, timeout_s=0.40).get("reachable"):
                            reopened = True
                            break
                        time.sleep(0.45)
                if reopened:
                    return {
                        "ok": True,
                        "status": "ready_on_502",
                        "host": host_502,
                        "port": clean_port,
                        "topology": "ap_direct",
                        "wifi_ip": wifi_ip,
                        "udp_identity": udp_reply,
                        "port_502_open": True,
                        "port_8899_open": False,
                        "at_log": web_res["log"],
                        "message": f"Auto-enabled ModBUS Protocol Conversion + {baud} 8N1 on {host_502} and restarted cleanly. Gateway live on :{clean_port}; scanning RS-485 bus now.",
                    }
                return {
                    "ok": True,
                    "status": "provisioned_rebooting",
                    "host": host_502,
                    "port": clean_port,
                    "topology": "ap_direct",
                    "wifi_ip": wifi_ip,
                    "udp_identity": udp_reply,
                    "port_502_open": False,
                    "port_8899_open": False,
                    "at_log": web_res["log"],
                    "message": f"Auto-enabled ModBUS Protocol Conversion + {baud} 8N1 on {host_502} and triggered software restart. Wait 5 seconds and tap 1-Tap Auto-Setup again.",
                }
            return {
                "ok": True,
                "status": "ready_on_502",
                "host": host_502,
                "port": clean_port,
                "topology": "ap_direct",
                "wifi_ip": wifi_ip,
                "udp_identity": udp_reply,
                "port_502_open": True,
                "port_8899_open": False,
                "at_log": web_res["log"],
                "message": f"PUSR gateway is live on {host_502}:{clean_port} (Modbus TCP). Selected gateway and scanning RS-485 bus now.",
            }

        found_host = udp_host or host_8899 or host_80
        if found_host:
            hello_rep, _, _ = send_pusr_udp_command(
                found_host,
                "www.usr.cn",
                port=PUSR_UDP_CONFIG_PORT,
                timeout_s=0.50,
                sock=udp_sock,
            )
            if hello_rep:
                at_log.append({"cmd": "www.usr.cn", "reply": hello_rep})
                ack_rep, _, _ = send_pusr_udp_command(
                    found_host,
                    "+ok",
                    port=PUSR_UDP_CONFIG_PORT,
                    timeout_s=0.40,
                    sock=udp_sock,
                )
                if ack_rep:
                    at_log.append({"cmd": "+ok", "reply": ack_rep})

                def _run_at(cmd: str) -> str:
                    r, _, e = send_pusr_udp_command(
                        found_host,
                        f"{cmd}\r\n",
                        port=PUSR_UDP_CONFIG_PORT,
                        timeout_s=0.55,
                        sock=udp_sock,
                    )
                    out = r or e or "NO_REPLY"
                    at_log.append({"cmd": cmd, "reply": out})
                    return out

                _run_at("AT+VER")
                if "ok" in _run_at("AT+WMODE=AP").lower():
                    applied_count += 1

                u_resp = _run_at(f"AT+UART={baud},8,1,None,NFC")
                if "ok" not in u_resp.lower():
                    u_resp = _run_at(f"AT+UART={baud},8,N,1")
                if "ok" in u_resp.lower():
                    applied_count += 1

                s_resp = _run_at(f"AT+NETP=TCP,Server,{clean_port},{found_host}")
                if "ok" not in s_resp.lower():
                    s_resp = _run_at(f"AT+NETP=TCP,SERVER,{clean_port},{found_host}")
                if "ok" not in s_resp.lower():
                    s_resp = _run_at(f"AT+SOCKA=TCPS,{found_host},{clean_port}")
                if "ok" not in s_resp.lower():
                    s_resp = _run_at(f"AT+SOCKA=TCPS,{clean_port},{found_host}")
                if "ok" in s_resp.lower():
                    applied_count += 1

                web_prov = ensure_pusr_web_modbus_enabled(found_host, baud=baud, force_restart=applied_count > 0)
                at_log.extend(web_prov["log"])
                if web_prov["changed"]:
                    applied_count += 1
                if web_prov["restarted"]:
                    reboot_sent = True

                if not reboot_sent and applied_count > 0:
                    z_resp = _run_at("AT+Z")
                    reboot_sent = ("ok" in z_resp.lower()) or ("err" not in z_resp.lower())

            if applied_count >= 2 and reboot_sent:
                return {
                    "ok": True,
                    "status": "provisioned_rebooting",
                    "host": found_host,
                    "port": clean_port,
                    "topology": "ap_direct",
                    "wifi_ip": wifi_ip,
                    "udp_identity": udp_reply,
                    "port_502_open": False,
                    "port_8899_open": host_8899 is not None,
                    "port_80_open": host_80 is not None,
                    "at_applied_count": applied_count,
                    "at_log": at_log,
                    "message": (
                        f"Auto-configured PUSR at {found_host} (Pure AP, {baud} 8N1, TCP Server :{clean_port}, ModBUS Protocol Conversion) "
                        "and triggered software restart. Wait 5 seconds, ensure Wi-Fi stays on USR-DR164, then tap 1-Tap Auto-Setup again."
                    ),
                }

            factory_hint = (
                f"Port 8899 (factory default) is open, but port {clean_port} is closed — likely reset by the physical Reload button."
                if host_8899 is not None
                else f"Web UI (http://{found_host}) is reachable, but port {clean_port} is closed."
            )
            return {
                "ok": True,
                "status": "needs_port_502",
                "host": found_host,
                "port": clean_port,
                "topology": "ap_direct",
                "wifi_ip": wifi_ip,
                "udp_identity": udp_reply,
                "port_502_open": False,
                "port_8899_open": host_8899 is not None,
                "port_80_open": host_80 is not None,
                "at_applied_count": applied_count,
                "at_log": at_log,
                "message": (
                    f"Detected PUSR at {found_host}. {factory_hint} "
                    f"Open http://{found_host} (admin/admin), set Serial = {baud} 8N1, Socket = TCP Server Port {clean_port} + Modbus TCP, "
                    "click Save + Software Restart (do NOT press physical Reload button!)."
                ),
            }

        wifi_text = f"Current Wi-Fi IP is {wifi_ip}." if wifi_ip else "No active Wi-Fi IPv4 address detected."
        return {
            "ok": False,
            "status": "not_found",
            "host": None,
            "port": clean_port,
            "topology": "ap_direct",
            "wifi_ip": wifi_ip,
            "port_502_open": False,
            "port_8899_open": False,
            "at_log": [],
            "message": f"PUSR gateway not reachable. {wifi_text} Join USR-DR164-XXXX in Wi-Fi Settings ('Use Without Internet') and tap 1-Tap Auto-Setup again.",
        }
    finally:
        try:
            udp_sock.close()
        except Exception:
            pass
