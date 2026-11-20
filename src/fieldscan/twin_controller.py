"""Modular 3D Digital Twin Interactive Controller (`twin_action` Contract).

Translates natural English operator requests ("show me the pins", "how do I wire the back cable",
"show me the main sensor probe", "set DIP switches for slave 3", "show X-ray view", "close housing")
into deterministic Three.js 3D Digital Twin camera, explosion, pin-rocker, and callout commands.
"""

from __future__ import annotations

import re
from typing import Any
import uuid

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


_WORD_PIN_MAP: dict[str, int] = {
    "1": 1,
    "one": 1,
    "2": 2,
    "two": 2,
    "3": 3,
    "three": 3,
    "4": 4,
    "four": 4,
    "5": 5,
    "five": 5,
    "6": 6,
    "six": 6,
    "7": 7,
    "seven": 7,
    "8": 8,
    "eight": 8,
}

_SINGLE_PIN_RE = re.compile(
    r"\bpin\s*#?\s*(1|2|3|4|5|6|7|8|one|two|three|four|five|six|seven|eight)\b",
    re.IGNORECASE,
)


def _extract_single_pin_reference(query: str) -> int | None:
    m = _SINGLE_PIN_RE.search(query or "")
    if not m:
        return None
    return _WORD_PIN_MAP.get(m.group(1).lower())


def prepare_visual_action(
    query: str,
    *,
    descriptor: dict[str, Any] | None = None,
    zone_hint: str | None = None,
    current_dip_address: int = 1,
    scene_generation: int = 1,
    turn_id: str | None = None,
) -> dict[str, Any]:
    """Resolve `twin_action_v1` with pin-ambiguity protection and turn/scene fencing (`M4-VOICE-01..03`)."""
    q = (query or "").strip().lower()
    tid = turn_id or f"turn-{uuid.uuid4().hex[:10]}"
    ctx = (descriptor or {}).get("context") or {}
    manifest_sha = str(ctx.get("manifest_sha256") or "bundle-tzone-tht02-v2.1")
    scene_origin = str((descriptor or {}).get("scene_origin") or "bundled_parametric")

    if scene_origin == "docs_only_no_3d":
        return {
            "ambiguous": False,
            "clarification_required": False,
            "clarification_prompt": None,
            "candidate_part_ids": [],
            "twin_action": None,
            "twin_action_v1": None,
            "turn_id": tid,
            "scene_generation": int(scene_generation),
            "manifest_sha256": manifest_sha,
        }

    has_dip_qualifier = any(k in q for k in ("dip", "switch", "switches", "sw1", "rocker", "slave", "address", "binary"))
    has_rear_qualifier = any(
        k in q for k in ("rear", "connector", "m12", "plug", "cable", "wire", "wiring", "terminal", "gland", "back")
    )

    if scene_origin == "catalog_glb" and isinstance((descriptor or {}).get("twin"), dict):
        twin = descriptor["twin"]
        parts = list(twin.get("parts") or [])
        actions = list(twin.get("actions") or [])

        # 1. Ambiguous single-pin check (`M4-VOICE-03`: e.g. `dip.pin_1` vs `rear.pin_1`)
        pin_num = _extract_single_pin_reference(q)
        if pin_num is not None:
            group_key = f"pin_{pin_num}"
            matching_pin_parts = [
                p
                for p in parts
                if p.get("ambiguous_group") == group_key or str(p.get("part_id") or "").endswith(f".pin_{pin_num}")
            ]
            if len(matching_pin_parts) > 1 and not has_dip_qualifier and not has_rear_qualifier:
                labels = [f"{p.get('label', '')} ({p.get('part_id', '')})" for p in matching_pin_parts]
                cands = [str(p["part_id"]) for p in matching_pin_parts if p.get("part_id")]
                return {
                    "ambiguous": True,
                    "clarification_required": True,
                    "clarification_prompt": (
                        f"Ambiguous component reference for Pin {pin_num}. "
                        f"Please specify which Pin {pin_num} to highlight: {' or '.join(labels)}?"
                    ),
                    "candidate_part_ids": cands,
                    "twin_action": None,
                    "twin_action_v1": None,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                }
            if matching_pin_parts:
                chosen = None
                if has_dip_qualifier:
                    chosen = next((p for p in matching_pin_parts if "dip" in str(p.get("part_id") or "")), matching_pin_parts[0])
                elif has_rear_qualifier:
                    chosen = next((p for p in matching_pin_parts if "rear" in str(p.get("part_id") or "")), matching_pin_parts[0])
                elif len(matching_pin_parts) == 1:
                    chosen = matching_pin_parts[0]

                if chosen is not None:
                    pid = str(chosen["part_id"])
                    lbl = str(chosen.get("label") or pid)
                    summary = str(chosen.get("summary") or "")
                    view_id = "open_dip" if "dip" in pid else ("rear_connector" if "rear" in pid else "isometric_home")
                    v1 = {
                        "schema": "twin_action_v1",
                        "kind": "highlight_part",
                        "part_id": pid,
                        "view_id": view_id,
                        "citation_id": chosen.get("citation_id"),
                        "simulated_state": None,
                        "callout_title": lbl.upper(),
                        "callout_body": summary,
                        "turn_id": tid,
                        "scene_generation": int(scene_generation),
                        "manifest_sha256": manifest_sha,
                        "requires_scene_ready": True,
                    }
                    legacy = {
                        "action": "focus_part",
                        "part_id": pid,
                        "view_id": view_id,
                        "explode_pcb": view_id == "open_dip",
                        "callout_title": lbl.upper(),
                        "callout_body": summary,
                    }
                    return {
                        "ambiguous": False,
                        "clarification_required": False,
                        "clarification_prompt": None,
                        "candidate_part_ids": [],
                        "twin_action": legacy,
                        "twin_action_v1": v1,
                        "turn_id": tid,
                        "scene_generation": int(scene_generation),
                        "manifest_sha256": manifest_sha,
                    }

        # 2. Match explicit `twin.actions.json` triggers OR linked part aliases/labels (`PR #4` & `PR #5` parity)
        wants_reset = any(
            p in q
            for p in ("reset view", "reset 3d", "close housing", "close the housing", "close the sensor", "reassemble", "default overview", "full view")
        )
        if wants_reset:
            reset_act = next((a for a in actions if str(a.get("kind") or "") == "reset_view"), None)
            if reset_act is not None:
                vid = str(reset_act.get("view_id") or "default_overview")
                v1 = {
                    "schema": "twin_action_v1",
                    "kind": "reset_view",
                    "part_id": reset_act.get("part_id"),
                    "view_id": vid,
                    "citation_id": reset_act.get("citation_id"),
                    "simulated_state": None,
                    "callout_title": "ASSEMBLED OVERVIEW",
                    "callout_body": "Resetting verified 3D Digital Twin to assembled overview.",
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                    "requires_scene_ready": True,
                }
                legacy = {
                    "action": "reset_view",
                    "part_id": reset_act.get("part_id"),
                    "view_id": vid,
                    "explode_pcb": False,
                    "callout_title": "ASSEMBLED OVERVIEW",
                    "callout_body": "Resetting verified 3D Digital Twin to assembled overview.",
                }
                return {
                    "ambiguous": False,
                    "clarification_required": False,
                    "clarification_prompt": None,
                    "candidate_part_ids": [],
                    "twin_action": legacy,
                    "twin_action_v1": v1,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                }

        for act in actions:
            kind = str(act.get("kind") or "focus_part")
            if kind == "reset_view" and not act.get("triggers"):
                continue
            triggers = [str(t).lower() for t in act.get("triggers", []) if str(t).strip()]
            pid = act.get("part_id")
            matched_part = next((p for p in parts if p.get("part_id") == pid), None)
            part_terms: list[str] = []
            if matched_part:
                for al in matched_part.get("aliases") or []:
                    s_al = str(al).strip().lower()
                    if s_al:
                        part_terms.append(s_al)
                for extra_k in ("label", "legacy_zone_id"):
                    v_ex = str(matched_part.get(extra_k) or "").strip().lower()
                    if v_ex:
                        part_terms.append(v_ex)
            if (
                any(t in q for t in triggers)
                or (pid and str(pid).lower() in q)
                or any(term in q for term in part_terms)
            ):
                vid = str(act.get("view_id") or "isometric_home")
                lbl = str((matched_part or {}).get("label") or pid or vid)
                summary = str((matched_part or {}).get("summary") or "Verified 3D catalog twin inspection view.")
                v1 = {
                    "schema": "twin_action_v1",
                    "kind": kind,
                    "part_id": pid,
                    "view_id": vid,
                    "citation_id": act.get("citation_id"),
                    "simulated_state": None,
                    "callout_title": lbl.upper(),
                    "callout_body": summary,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                    "requires_scene_ready": True,
                }
                legacy = {
                    "action": "reset_view" if kind == "reset_view" else "focus_part",
                    "part_id": pid,
                    "view_id": vid,
                    "explode_pcb": vid == "open_dip",
                    "callout_title": lbl.upper(),
                    "callout_body": summary,
                }
                return {
                    "ambiguous": False,
                    "clarification_required": False,
                    "clarification_prompt": None,
                    "candidate_part_ids": [],
                    "twin_action": legacy,
                    "twin_action_v1": v1,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                }

        # 3. Direct part_id / label / aliases match in `twin.parts.json`
        for p in parts:
            pid = str(p.get("part_id") or "")
            lbl = str(p.get("label") or pid)
            aliases = [str(al).strip().lower() for al in (p.get("aliases") or []) if str(al).strip()]
            legacy_z = str(p.get("legacy_zone_id") or "").strip().lower()
            if pid and (
                pid.lower() in q
                or lbl.lower() in q
                or (legacy_z and legacy_z in q)
                or any(al in q for al in aliases)
            ):
                vid = (
                    "open_dip"
                    if "dip" in pid
                    else ("rear_connector" if "rear" in pid else ("probe_tip" if "probe" in pid else "isometric_home"))
                )
                summary = str(p.get("summary") or "")
                v1 = {
                    "schema": "twin_action_v1",
                    "kind": "focus_part",
                    "part_id": pid,
                    "view_id": vid,
                    "citation_id": p.get("citation_id"),
                    "simulated_state": None,
                    "callout_title": lbl.upper(),
                    "callout_body": summary,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                    "requires_scene_ready": True,
                }
                legacy = {
                    "action": "focus_part",
                    "part_id": pid,
                    "view_id": vid,
                    "explode_pcb": vid == "open_dip",
                    "callout_title": lbl.upper(),
                    "callout_body": summary,
                }
                return {
                    "ambiguous": False,
                    "clarification_required": False,
                    "clarification_prompt": None,
                    "candidate_part_ids": [],
                    "twin_action": legacy,
                    "twin_action_v1": v1,
                    "turn_id": tid,
                    "scene_generation": int(scene_generation),
                    "manifest_sha256": manifest_sha,
                }

    # Bundled parametric path: check ambiguous single-pin ("show me pin one") first (`M4-VOICE-03`)
    pin_num = _extract_single_pin_reference(q)
    if pin_num in (1, 2, 3, 4) and not has_dip_qualifier and not has_rear_qualifier:
        return {
            "ambiguous": True,
            "clarification_required": True,
            "clarification_prompt": (
                f"Ambiguous reference for Pin {pin_num}. Do you want to highlight "
                f"SW1 DIP-8 Switch Pin {pin_num} (dip.pin_{pin_num}) or Rear 4-Wire Lead #{pin_num} (rear.pin_{pin_num})?"
            ),
            "candidate_part_ids": [f"dip.pin_{pin_num}", f"rear.pin_{pin_num}"],
            "twin_action": None,
            "twin_action_v1": None,
            "turn_id": tid,
            "scene_generation": int(scene_generation),
            "manifest_sha256": manifest_sha,
        }

    legacy = resolve_twin_action(query, zone_hint=zone_hint, current_dip_address=current_dip_address)
    if legacy is None:
        return {
            "ambiguous": False,
            "clarification_required": False,
            "clarification_prompt": None,
            "candidate_part_ids": [],
            "twin_action": None,
            "twin_action_v1": None,
            "turn_id": tid,
            "scene_generation": int(scene_generation),
            "manifest_sha256": manifest_sha,
        }

    act_type = str(legacy.get("action") or "focus_zone")
    kind = (
        "reset_view"
        if act_type == "reset_view"
        else ("simulate_state" if act_type == "configure_dip" else ("show_view" if act_type == "xray_view" else "focus_part"))
    )
    mp = legacy.get("manual_page")
    sim_state = (
        {
            "visual_dip_address": legacy.get("target_slave_id", current_dip_address),
            "dip_bits": legacy.get("dip_bits", []),
            "bus_target_mutated": False,
        }
        if act_type == "configure_dip"
        else None
    )
    v1 = {
        "schema": "twin_action_v1",
        "kind": kind,
        "part_id": legacy.get("focus_zone"),
        "view_id": str(legacy.get("camera_pose") or "overview"),
        "citation_id": f"tht02_manual_v1_1:p{mp}:{mp}.1" if mp else None,
        "simulated_state": sim_state,
        "callout_title": legacy.get("callout_title", ""),
        "callout_body": legacy.get("callout_body", ""),
        "turn_id": tid,
        "scene_generation": int(scene_generation),
        "manifest_sha256": manifest_sha,
        "requires_scene_ready": False,
    }
    return {
        "ambiguous": False,
        "clarification_required": False,
        "clarification_prompt": None,
        "candidate_part_ids": [],
        "twin_action": legacy,
        "twin_action_v1": v1,
        "turn_id": tid,
        "scene_generation": int(scene_generation),
        "manifest_sha256": manifest_sha,
    }
