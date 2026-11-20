"""Modular 3D Digital Twin Interactive Controller (`twin_action` Contract).

Translates natural English operator requests ("show me the pins", "how do I wire the back cable",
"show me the main sensor probe", "set DIP switches for slave 3", "show X-ray view", "close housing")
into deterministic Three.js 3D Digital Twin camera, explosion, pin-rocker, and callout commands.
"""

from __future__ import annotations

import re
from typing import Any

_DIP_WEIGHTS: tuple[int, ...] = (128, 64, 32, 16, 8, 4, 2, 1)


def _address_to_dip_bits(address: int) -> list[int]:
    clamped = max(0, min(255, int(address)))
    return [1 if (clamped & w) else 0 for w in _DIP_WEIGHTS]


def _format_dip_instruction_en(bits: list[int]) -> str:
    on_pins = [str(i + 1) for i, b in enumerate(bits) if b == 1]
    off_pins = [str(i + 1) for i, b in enumerate(bits) if b == 0]
    if not on_pins:
        return "Set all Pins 1..8 OFF"
    if not off_pins:
        return "Set all Pins 1..8 ON"
    return f"Set Pin {', '.join(on_pins)} ON and Pin {', '.join(off_pins)} OFF"

_SLAVE_NUM_RE = re.compile(
    r"\b(?:slave|address|id|node)\s*#?\s*(\d{1,3})\b|\bto\s+(\d{1,3})\b",
    re.IGNORECASE,
)


def parse_requested_slave_id(query: str, default_slave_id: int = 1) -> tuple[int, bool]:
    """Extract an explicit Modbus Slave ID (1..247) from English query if present."""
    for m in _SLAVE_NUM_RE.finditer(query or ""):
        raw = m.group(1) or m.group(2)
        if raw and raw.isdigit():
            val = int(raw)
            if 1 <= val <= 247:
                return val, True
    if "176" in (query or ""):
        return 176, True
    return max(1, min(247, int(default_slave_id or 1))), False


def resolve_twin_action(
    query: str,
    *,
    zone_hint: str | None = None,
    current_dip_address: int | None = None,
    vision_telemetry: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Return a structured `twin_action` dict when the operator asks to inspect/manipulate the sensor."""
    q = (query or "").strip().lower()
    if not q and not zone_hint:
        return None

    default_addr = int(current_dip_address or 1)

    # 1. Explicit close / reassemble / reset 3D view
    if any(
        p in q
        for p in (
            "close the housing",
            "close housing",
            "close the sensor",
            "reassemble",
            "reset 3d",
            "reset view",
            "full view",
            "overview of the sensor",
        )
    ):
        return {
            "action": "reset_view",
            "focus_zone": None,
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "overview",
            "callout_title": "1:1 PARAMETRIC DIGITAL TWIN (140.0 x 16.0 mm)",
            "callout_body": "Housing closed in nominal isometric pose. Ask to inspect any sub-assembly, wiring, or DIP-8 pins.",
        }

    # 2. Explicit X-Ray / translucent internal view
    if any(p in q for p in ("x-ray", "xray", "wireframe", "see inside", "translucent", "internal layout")):
        return {
            "action": "xray_view",
            "focus_zone": "lower_barrel_rs485",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "wireframe",
            "camera_pose": "overview",
            "callout_title": "X-RAY INTERNAL INSPECTION MODE",
            "callout_body": "Translucent housing active: showing internal SHT30 probe tip, SW1 DIP-8 PCB, and RS-485 transceiver stage.",
        }

    # 3. SW1 DIP-8 switches / pins / Slave ID configuration
    if zone_hint == "upper_barrel_dip" or any(
        k in q
        for k in (
            "pin",
            "pins",
            "dip",
            "switch",
            "switches",
            "rocker",
            "rockers",
            "slave",
            "address",
            "unscrew",
            "open the sensor",
            "open the housing",
            "open housing",
            "expose pcb",
            "pcb",
        )
    ):
        target_addr, _ = parse_requested_slave_id(q, default_addr)
        bits = _address_to_dip_bits(target_addr)
        instr_en = _format_dip_instruction_en(bits)
        on_pins = [str(i + 1) for i, b in enumerate(bits) if b == 1]
        pins_str = f"Pin {', '.join(on_pins)} ON" if on_pins else "All OFF"
        return {
            "action": "configure_dip",
            "focus_zone": "upper_barrel_dip",
            "explode_pcb": True,
            "open_dip_pip": True,
            "render_mode": "solid",
            "camera_pose": "dip_closeup",
            "target_slave_id": target_addr,
            "dip_bits": bits,
            "manual_page": 5,
            "callout_title": f"SW1 DIP-8 INTERACTIVE GUIDE · SLAVE #{target_addr} ({pins_str})",
            "callout_body": (
                f"{instr_en} (Weights 128..1, Page 5). "
                "Step 1: loosen rear gland nut first. Step 2: unscrew middle barrel."
            ),
        }

    # 4. Rear cable / 4-wire connection / waterproof gland ("at the back, how the cable connects")
    if zone_hint == "waterproof_gland_leads" or any(
        k in q
        for k in (
            "cable",
            "wire",
            "wires",
            "wiring",
            "lead",
            "leads",
            "gland",
            "back of the sensor",
            "rear",
            "connect the sensor",
            "how it connects",
            "how to connect",
            "color code",
            "power wire",
            "gnd",
            "rs-485 a",
            "rs485 a",
            "terminal",
            "frayed",
        )
    ):
        return {
            "action": "focus_zone",
            "focus_zone": "waterproof_gland_leads",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "rear_wiring",
            "callout_title": "REAR GLAND & 4-WIRE RS-485 CONNECTION (Page 4)",
            "callout_body": (
                "Red = V+ (5-24V DC) | Black = Common GND | Yellow = RS-485 A+ | Green = RS-485 B-. "
                "Bond Black GND & shield to converter ground; tighten dome nut last."
            ),
        }

    # 5. Main sensing head / SHT30 probe / strainer tip ("main sensor, how it is placed")
    if zone_hint == "strainer_head" or any(
        k in q
        for k in (
            "main sensor",
            "sensing element",
            "probe",
            "tip",
            "front",
            "head",
            "strainer",
            "filter",
            "sintered",
            "sht30",
            "sht3x",
            "7fff",
            "patch",
        )
    ):
        return {
            "action": "focus_zone",
            "focus_zone": "strainer_head",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "tip_closeup",
            "callout_title": "MAIN SHT30 SENSING PROBE & SS316L STRAINER (Pages 1 & 3)",
            "callout_body": (
                "Slotted stainless steel cap protecting the sintered filter and SHT30 CMOSens die "
                "(+/-0.3 C, +/-2 %RH). Keep slots clear of dust/condensation; never touch internal die."
            ),
        }

    # 6. Mounting bracket / flange / installation ("how it is placed / mounted")
    if zone_hint == "mounting_flange" or any(
        k in q
        for k in (
            "mount",
            "mounting",
            "install",
            "placed",
            "place it",
            "bracket",
            "flange",
            "clip",
            "ear",
            "screw",
            "hole",
            "wall",
            "duct",
        )
    ):
        return {
            "action": "focus_zone",
            "focus_zone": "mounting_flange",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "flange_closeup",
            "callout_title": "SNAP-ON MOUNTING FLANGE (2x 4.2 mm Holes · 32 mm Pitch)",
            "callout_body": (
                "Snap saddle bracket onto the 16.0 mm barrel and fasten with M4 screws on 32.0 mm centers "
                "(Pages 1 & 9). Point sensing tip into representative airflow."
            ),
        }

    # 7. Upper O-ring environmental seal
    if zone_hint in ("upper_seal_ring", "seal_ring") or any(
        k in q for k in ("o-ring", "oring", "seal", "gasket", "collar", "elastomer")
    ):
        return {
            "action": "focus_zone",
            "focus_zone": "upper_seal_ring",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "seal_closeup",
            "callout_title": "UPPER ELASTOMER O-RING SEAL (z = +40 mm)",
            "callout_body": "Weatherproof perimeter O-ring isolating internal PCB electronics from duct moisture (-40..+85 C).",
        }

    # 8. Lower barrel / RS-485 transceiver stage
    if zone_hint in ("lower_barrel_rs485", "middle_barrel") or any(
        k in q for k in ("transceiver", "lower barrel", "middle barrel", "regulator")
    ):
        return {
            "action": "focus_zone",
            "focus_zone": "lower_barrel_rs485",
            "explode_pcb": False,
            "open_dip_pip": False,
            "render_mode": "solid",
            "camera_pose": "barrel_closeup",
            "callout_title": "LOWER BARREL & RS-485 TRANSCEIVER STAGE",
            "callout_body": "Houses the 5-24V DC regulator and half-duplex Modbus-RTU transceiver (9600 bps 8N1 default).",
        }

    return None
