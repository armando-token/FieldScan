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

                deadline = time.perf_counter() + max(0.1, float(self.timeout_s))
                discarded_frames: list[dict[str, Any]] = []

                while True:
                    remaining = deadline - time.perf_counter()
                    if remaining <= 0:
                        rtt_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                        backoff_s = self._record_failure_unlocked()
                        return {
                            "ok": False,
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
        self.request.settimeout(1.0)
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
