#!/usr/bin/env python3
"""USB-C / TCP to RS-485 FT2232HL Hardware Bridge for FieldScan CAD v2.0 (iPad Air M4).

Runs on the Mac Mini host (defaulting to 0.0.0.0:5502, reachable from the iPad Air M4
over the USB-C NCM link-local tether at 169.254.37.69:5502) and forwards raw 8-byte
Modbus-RTU Function 0x03 / 0x05 frames to the physical FTDI FT2232HL RS-485 transceiver
(/dev/cu.usbserial-* at 9600 8N1), returning the 21-byte CRC-16 response frame.

Includes a deterministic --sim-slave fallback mode so automated Hardware-in-the-Loop (HIL)
and parity tests can validate full TCP-to-Modbus-RTU framing even when no physical
FT2232HL transceiver is attached.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import socket
import socketserver
import sys
import threading
import time
from typing import Any

import serial

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fieldscan.modbus_rtu import (  # noqa: E402
    build_simulated_tht02_response,
    discover_serial_ports,
    format_hex,
    verify_crc16,
)


class _BridgeConfig:
    def __init__(
        self,
        serial_port: str | None = None,
        baud_bps: int = 9600,
        timeout_s: float = 0.25,
        sim_slave: int | None = None,
        sim_temp_c: float = 24.6,
        sim_humidity_rh: float = 52.8,
        sim_abnormal_7fff: bool = False,
        verbose: bool = True,
    ) -> None:
        self.serial_port = serial_port
        self.baud_bps = int(baud_bps)
        self.timeout_s = float(timeout_s)
        self.sim_slave = int(sim_slave) if sim_slave is not None else None
        self.sim_temp_c = float(sim_temp_c)
        self.sim_humidity_rh = float(sim_humidity_rh)
        self.sim_abnormal_7fff = bool(sim_abnormal_7fff)
        self.verbose = bool(verbose)
        self.serial_lock = threading.Lock()

    def resolve_serial_port(self) -> str | None:
        if self.serial_port:
            return self.serial_port
        for p in discover_serial_ports():
            dev = str(p.get("device", ""))
            if dev and not dev.startswith(("tcp://", "socket://", "sim://")):
                return dev
        return None

    def transceive(self, tx_frame: bytes) -> bytes:
        if not tx_frame:
            return b""

        with self.serial_lock:
            port_name = self.resolve_serial_port()
            if port_name:
                try:
                    with serial.Serial(
                        port=port_name,
                        baudrate=self.baud_bps,
                        bytesize=serial.EIGHTBITS,
                        parity=serial.PARITY_NONE,
                        stopbits=serial.STOPBITS_ONE,
                        timeout=self.timeout_s,
                        write_timeout=self.timeout_s,
                    ) as ser:
                        ser.reset_input_buffer()
                        ser.write(tx_frame)
                        ser.flush()
                        rx = ser.read(21)
                        if rx and (len(rx) < 21 or not verify_crc16(rx)):
                            waiting = ser.in_waiting
                            if waiting > 0:
                                rx += ser.read(min(16, waiting))
                        if rx:
                            return rx
                except Exception as exc:
                    if self.verbose:
                        print(f"[RS485-BRIDGE] Serial hardware error on {port_name}: {exc}", flush=True)

            # Fallback to simulated THT-02 slave when --sim-slave is enabled
            if self.sim_slave is not None and len(tx_frame) >= 8 and verify_crc16(tx_frame[:8]):
                req_slave = tx_frame[0]
                func_code = tx_frame[1]
                if func_code == 0x03 and (self.sim_slave == 0 or req_slave == self.sim_slave):
                    return build_simulated_tht02_response(
                        slave_id=req_slave,
                        temp_c=self.sim_temp_c,
                        humidity_rh=self.sim_humidity_rh,
                        baud_bps=self.baud_bps,
                        abnormal_7fff=self.sim_abnormal_7fff,
                    )
                if func_code == 0x05:
                    # Echo standard 8-byte Write Single Coil response
                    return tx_frame[:8]

        return b""


class _ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True
    bridge_config: _BridgeConfig


class _ModbusBridgeHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        cfg: _BridgeConfig = self.server.bridge_config  # type: ignore[attr-defined]
        self.request.settimeout(1.0)
        try:
            while True:
                tx = self.request.recv(64)
                if not tx:
                    break
                t0 = time.perf_counter()
                rx = cfg.transceive(tx)
                dt_ms = (time.perf_counter() - t0) * 1000.0
                if rx:
                    self.request.sendall(rx)
                if cfg.verbose:
                    peer = f"{self.client_address[0]}:{self.client_address[1]}"
                    print(
                        f"[RS485-BRIDGE] {peer} | TX ({len(tx)}B): {format_hex(tx)} -> "
                        f"RX ({len(rx)}B): {format_hex(rx) if rx else 'TIMEOUT'} ({dt_ms:.1f} ms)",
                        flush=True,
                    )
        except (socket.timeout, ConnectionResetError, BrokenPipeError, OSError):
            pass


def start_background_bridge(
    host: str = "127.0.0.1",
    port: int = 0,
    sim_slave: int | None = 1,
    sim_temp_c: float = 24.6,
    sim_humidity_rh: float = 52.8,
    sim_abnormal_7fff: bool = False,
    serial_port: str | None = None,
    baud_bps: int = 9600,
    verbose: bool = False,
) -> tuple[_ThreadedTCPServer, str, int]:
    """Start an in-process threaded TCP-to-RS485 bridge server and return (server, host, bound_port)."""
    cfg = _BridgeConfig(
        serial_port=serial_port,
        baud_bps=baud_bps,
        sim_slave=sim_slave,
        sim_temp_c=sim_temp_c,
        sim_humidity_rh=sim_humidity_rh,
        sim_abnormal_7fff=sim_abnormal_7fff,
        verbose=verbose,
    )
    srv = _ThreadedTCPServer((host, port), _ModbusBridgeHandler)
    srv.bridge_config = cfg
    bound_host, bound_port = srv.server_address[:2]
    thread = threading.Thread(target=srv.serve_forever, name="rs485-usb-bridge", daemon=True)
    thread.start()
    return srv, str(bound_host), int(bound_port)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="FieldScan THT-02 USB-C / TCP to RS-485 FT2232HL Bridge for iPad Air M4"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="TCP bind address (default: 0.0.0.0, covers USB-C 169.254.37.69 and loopback)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5502,
        help="TCP port for raw Modbus-RTU frames (default: 5502)",
    )
    parser.add_argument(
        "--serial-port",
        default=None,
        help="Explicit serial device path (e.g. /dev/cu.usbserial-14100); auto-discovers FT2232HL if omitted",
    )
    parser.add_argument(
        "--baud",
        type=int,
        default=9600,
        help="RS-485 serial baud rate (default: 9600 8N1)",
    )
    parser.add_argument(
        "--sim-slave",
        type=int,
        default=None,
        help="Optional simulated TZ THT-02 Slave ID (e.g. 1) when no physical FT2232HL is attached",
    )
    parser.add_argument(
        "--sim-temp",
        type=float,
        default=24.6,
        help="Simulated temperature in Celsius when --sim-slave is active (default: 24.6)",
    )
    parser.add_argument(
        "--sim-humidity",
        type=float,
        default=52.8,
        help="Simulated relative humidity in %%RH when --sim-slave is active (default: 52.8)",
    )
    parser.add_argument(
        "--sim-7fff",
        action="store_true",
        help="Return 0x7FFF SHT30 probe fault sentinel when --sim-slave is active",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress per-frame console logging",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    cfg = _BridgeConfig(
        serial_port=args.serial_port,
        baud_bps=args.baud,
        sim_slave=args.sim_slave,
        sim_temp_c=args.sim_temp,
        sim_humidity_rh=args.sim_humidity,
        sim_abnormal_7fff=args.sim_7fff,
        verbose=not args.quiet,
    )
    hw_port = cfg.resolve_serial_port()
    srv = _ThreadedTCPServer((args.host, args.port), _ModbusBridgeHandler)
    srv.bridge_config = cfg
    bound_host, bound_port = srv.server_address[:2]

    print("==================================================================", flush=True)
    print(" FIELDSCAN CAD v2.0 — USB-C / TCP to RS-485 FT2232HL Bridge", flush=True)
    print(f" Listening Endpoint : tcp://{bound_host}:{bound_port}", flush=True)
    print(" iPad USB-C Target  : tcp://169.254.37.69:5502", flush=True)
    print(f" Physical Serial    : {hw_port or 'None detected (hotplug active)'} @ {args.baud} 8N1", flush=True)
    if args.sim_slave is not None:
        print(
            f" Sim Slave Fallback : Slave #{args.sim_slave} "
            f"({args.sim_temp:.1f} C / {args.sim_humidity:.1f} %RH, 7FFF={args.sim_7fff})",
            flush=True,
        )
    print("==================================================================", flush=True)

    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[RS485-BRIDGE] Shutting down cleanly.", flush=True)
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
