#!/usr/bin/env python3
"""Physical Bench Hardware Verification Harness for FieldScan CAD (`BUS-01`, `BUS-02`, `BUS-11`, `OFF-04`).

Checks for attached physical bench transports:
1. Mac USB-RS485 (`FT2232HL` / `/dev/cu.usbserial*` or `/dev/cu.usbmodem*`)
2. Isolated Bench LAN PUSR `USR-DR164` Modbus TCP Gateway (`--pusr-host`, default port `502`)

Outputs honest `PASA` / `FALLA` / `BLOQUEADA` JSON records without fabricating synthetic responses.
"""

from __future__ import annotations

import argparse
import glob
import json
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT / "src") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "src"))

from fieldscan.modbus_rtu import ModbusRTUScanner
from fieldscan.modbus_tcp import ModbusTCPClient


def detect_usb_serial_candidates() -> list[str]:
    patterns = ("/dev/cu.usbserial*", "/dev/cu.usbmodem*", "/dev/ttyUSB*")
    found: list[str] = []
    for pat in patterns:
        found.extend(sorted(glob.glob(pat)))
    return found


def run_bench_probe(pusr_host: str, pusr_port: int, slave_id: int, samples: int, interval_s: float) -> dict:
    usb_ports = detect_usb_serial_candidates()
    report: dict = {
        "evaluated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "usb_rs485_candidates": usb_ports,
        "pusr_target": f"{pusr_host}:{pusr_port}" if pusr_host else None,
        "bus_01_usb_rtu": {"status": "BLOQUEADA", "reason": "No physical FT2232HL / USB-RS485 serial device attached on /dev/cu.usbserial*"},
        "bus_02_pusr_tcp": {"status": "BLOQUEADA", "reason": "No physical PUSR USR-DR164 gateway host provided or reachable on bench LAN"},
    }

    if usb_ports:
        mgr = ModbusRTUScanner(initial_mode="hardware", target_slave_id=slave_id, baud_bps=9600, auto_start=False)
        ok_count = 0
        latencies: list[float] = []
        for _ in range(max(1, samples)):
            tel = mgr.step_once()
            if tel.get("online") and not tel.get("simulation"):
                ok_count += 1
                latencies.append(float(tel.get("roundtrip_ms") or 0.0))
            if samples > 1:
                time.sleep(interval_s)
        mgr.stop()
        report["bus_01_usb_rtu"] = {
            "status": "PASA" if ok_count == max(1, samples) else "FALLA",
            "port": usb_ports[0],
            "ok_polls": ok_count,
            "total_polls": max(1, samples),
            "mean_rtt_ms": round(sum(latencies) / len(latencies), 2) if latencies else None,
        }

    if pusr_host:
        client = ModbusTCPClient(host=pusr_host, port=pusr_port, timeout_s=1.0, pilot_readonly=True)
        ok_count = 0
        latencies = []
        last_err = None
        for _ in range(max(1, samples)):
            res = client.read_tht02_holding(unit_id=slave_id, respect_backoff=False)
            if res.get("ok"):
                ok_count += 1
                latencies.append(float(res.get("roundtrip_ms") or 0.0))
            else:
                last_err = res.get("error_code")
            if samples > 1:
                time.sleep(interval_s)
        client.close()
        if ok_count == 0 and last_err in ("SOURCE_UNAVAILABLE", "READ_TIMEOUT"):
            report["bus_02_pusr_tcp"] = {
                "status": "BLOQUEADA",
                "reason": f"PUSR gateway {pusr_host}:{pusr_port} unreachable ({last_err}); attach powered USR-DR164 + TZ THT-02",
            }
        else:
            report["bus_02_pusr_tcp"] = {
                "status": "PASA" if ok_count == max(1, samples) else "FALLA",
                "ok_polls": ok_count,
                "total_polls": max(1, samples),
                "mean_rtt_ms": round(sum(latencies) / len(latencies), 2) if latencies else None,
                "tx_audit_writes": sum(1 for entry in client.tx_audit_log if entry.get("function_code") != 3),
            }

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Run physical RS-485 / PUSR Modbus TCP bench check")
    parser.add_argument("--pusr-host", default="", help="IP of PUSR USR-DR164 gateway (e.g. 192.168.0.7)")
    parser.add_argument("--pusr-port", type=int, default=502, help="Modbus TCP MBAP port (default 502)")
    parser.add_argument("--slave-id", type=int, default=1, help="Target Modbus Unit/Slave ID")
    parser.add_argument("--samples", type=int, default=3, help="Number of consecutive read-only polls")
    parser.add_argument("--interval", type=float, default=0.5, help="Interval between polls in seconds")
    args = parser.parse_args()

    res = run_bench_probe(args.pusr_host, args.pusr_port, args.slave_id, args.samples, args.interval)
    print(json.dumps(res, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
