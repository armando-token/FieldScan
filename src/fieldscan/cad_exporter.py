"""Offline parametric CAD exporter (AutoCAD R2010 DXF, Binary STL) & Escalation Packager.

Designed for edge execution in < 80 ms without network dependencies using `ezdxf`,
vectorized `numpy` / `struct` binary STL packing, Pillow HUD rendering, and stdlib
RFC-5322 `.eml` Store-and-Forward Outbox generation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import format_datetime, make_msgid
import hashlib
from io import BytesIO
import math
from pathlib import Path
import struct
import time
from typing import Any
import zipfile

import ezdxf
from ezdxf import units
import numpy as np
from PIL import Image, ImageDraw, ImageFont

_HUD_FONT = ImageFont.load_default()

# Binary STL triangle record: normal (3f), v1 (3f), v2 (3f), v3 (3f), attr_byte_count (u2) = 50 bytes
_STL_DTYPE = np.dtype(
    [
        ("normal", "<f4", (3,)),
        ("v1", "<f4", (3,)),
        ("v2", "<f4", (3,)),
        ("v3", "<f4", (3,)),
        ("attr", "<u2"),
    ]
)

_PACKAGE_COUNTER = 0


def _resolve_zone(spec: dict[str, Any], fault_zone: str | None) -> dict[str, Any] | None:
    """Resolve a canonical zone dict from `spec['zones']` by exact or partial ID/label."""
    if not fault_zone:
        return None
    needle = fault_zone.strip().lower()
    if not needle:
        return None
    zones: list[dict[str, Any]] = spec.get("zones", [])
    for z in zones:
        if z.get("id", "").lower() == needle:
            return z
    for z in zones:
        zid = z.get("id", "").lower()
        lbl_es = z.get("label_es", "").lower()
        lbl_en = z.get("label_en", "").lower()
        if needle in zid or zid in needle or needle in lbl_es or needle in lbl_en:
            return z
    # Fallback synthetic zone spanning full envelope if an unknown custom string was supplied
    total_len = float(spec.get("dimensions_mm", {}).get("total_length", 140.0))
    outer_d = float(spec.get("dimensions_mm", {}).get("outer_diameter", 16.0))
    return {
        "id": fault_zone.strip(),
        "label_es": f"Zona reportada ({fault_zone.strip()})",
        "label_en": f"Reported Zone ({fault_zone.strip()})",
        "z_start_mm": 0.0,
        "z_end_mm": total_len,
        "diameter_mm": outer_d,
        "manual_pages": [1, 9],
        "probable_faults_es": ["Anomalía reportada en inspección de campo"],
        "electrical_symptoms": ["Verificar registros Modbus 0x0000..0x0007"],
        "recommended_actions_es": ["Inspección física y eléctrica según manual TZ THT-02 V1.1"],
    }


def _add_linear_dim_graphic(
    msp: Any,
    p1: tuple[float, float],
    p2: tuple[float, float],
    offset: float,
    label: str,
    vertical: bool = False,
    layer: str = "DIMENSIONS",
) -> None:
    """Draw clean, CAD-portable extension lines, dimension line, arrowheads, and text on `DIMENSIONS`."""
    arrow = 2.0
    if not vertical:
        y_dim = p1[1] + offset
        ext_dir = 1.5 if offset >= 0 else -1.5
        msp.add_line((p1[0], p1[1]), (p1[0], y_dim + ext_dir), dxfattribs={"layer": layer})
        msp.add_line((p2[0], p2[1]), (p2[0], y_dim + ext_dir), dxfattribs={"layer": layer})
        msp.add_line((p1[0], y_dim), (p2[0], y_dim), dxfattribs={"layer": layer})
        # Left & right arrowheads
        msp.add_lwpolyline(
            [(p1[0] + arrow, y_dim + 0.7), (p1[0], y_dim), (p1[0] + arrow, y_dim - 0.7)],
            dxfattribs={"layer": layer},
        )
        msp.add_lwpolyline(
            [(p2[0] - arrow, y_dim + 0.7), (p2[0], y_dim), (p2[0] - arrow, y_dim - 0.7)],
            dxfattribs={"layer": layer},
        )
        mid_x = 0.5 * (p1[0] + p2[0])
        txt_y = y_dim + (1.4 if offset >= 0 else -3.6)
        msp.add_text(
            label,
            dxfattribs={"layer": layer, "height": 2.3},
        ).set_placement((mid_x - len(label) * 0.75, txt_y))
    else:
        x_dim = p1[0] + offset
        ext_dir = 1.5 if offset >= 0 else -1.5
        msp.add_line((p1[0], p1[1]), (x_dim + ext_dir, p1[1]), dxfattribs={"layer": layer})
        msp.add_line((p2[0], p2[1]), (x_dim + ext_dir, p2[1]), dxfattribs={"layer": layer})
        msp.add_line((x_dim, p1[1]), (x_dim, p2[1]), dxfattribs={"layer": layer})
        y_lo, y_hi = min(p1[1], p2[1]), max(p1[1], p2[1])
        msp.add_lwpolyline(
            [(x_dim - 0.7, y_lo + arrow), (x_dim, y_lo), (x_dim + 0.7, y_lo + arrow)],
            dxfattribs={"layer": layer},
        )
        msp.add_lwpolyline(
            [(x_dim - 0.7, y_hi - arrow), (x_dim, y_hi), (x_dim + 0.7, y_hi - arrow)],
            dxfattribs={"layer": layer},
        )
        mid_y = 0.5 * (y_lo + y_hi)
        txt_x = x_dim + (2.0 if offset >= 0 else -len(label) * 1.7 - 2.0)
        msp.add_text(
            label,
            dxfattribs={"layer": layer, "height": 2.3},
        ).set_placement((txt_x, mid_y - 1.1))


def export_autocad_dxf(
    spec: dict[str, Any],
    out_path: Path,
    fault_zone: str | None = None,
    diagnosis_summary: str = "",
) -> Path:
    """Export a multi-view AutoCAD R2010 `.dxf` blueprint of the TZ THT-02 (`140mm x Ø16mm`)."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    dims = spec.get("dimensions_mm", {})
    L = float(dims.get("total_length", 140.0))
    D = float(dims.get("outer_diameter", 16.0))
    R = float(dims.get("radius", D / 2.0))
    flange_w = float(dims.get("bracket_width", 42.0))
    flange_h = float(dims.get("bracket_height", 20.0))
    hole_d = float(dims.get("mounting_hole_diameter", 4.2))
    hole_sp = float(dims.get("mounting_hole_spacing", 32.0))
    cable_d = float(dims.get("cable_diameter", 5.0))

    doc = ezdxf.new("R2010", setup=False)
    doc.units = units.MM
    if "DASHED" not in doc.linetypes:
        doc.linetypes.add("DASHED", pattern=[3.0, 2.0, -1.0], description="Dashed __ __ __")
    if "CENTER" not in doc.linetypes:
        doc.linetypes.add("CENTER", pattern=[7.0, 4.0, -1.0, 1.0, -1.0], description="Center ____ _ ____")
    msp = doc.modelspace()

    # Configure engineering CAD layers
    layers = doc.layers
    layer_defs = [
        ("OUTLINE", 7, "CONTINUOUS", 35),
        ("STRAINER_VENTS", 8, "CONTINUOUS", 18),
        ("SEAL_ORINGS", 250, "CONTINUOUS", 30),
        ("INTERNAL_PCB", 4, "DASHED", 18),
        ("GLAND_RIBS", 9, "CONTINUOUS", 15),
        ("CENTERLINE", 6, "CENTER", 13),
        ("DIMENSIONS", 3, "CONTINUOUS", 18),
        ("TITLE_BLOCK", 7, "CONTINUOUS", 25),
        ("LEAD_RED_VP", 1, "CONTINUOUS", 30),
        ("LEAD_BLACK_GND", 7, "CONTINUOUS", 30),
        ("LEAD_YELLOW_AP", 2, "CONTINUOUS", 30),
        ("LEAD_GREEN_BM", 3, "CONTINUOUS", 30),
    ]
    for lname, aci, ltype, lw in layer_defs:
        if lname not in layers:
            layers.add(lname, color=aci, linetype=ltype, lineweight=lw)

    # =========================================================================
    # 1. SIDE ELEVATION VIEW (Z-axis mapped horizontally x = 0..140, y = -8..+8)
    # =========================================================================
    msp.add_line((-8.0, 0.0), (182.0, 0.0), dxfattribs={"layer": "CENTERLINE"})
    msp.add_text("SIDE ELEVATION VIEW (SCALE 1:1)", dxfattribs={"layer": "TITLE_BLOCK", "height": 2.4}).set_placement(
        (0.0, -31.0)
    )

    # 1a. Strainer Head (0..32 mm) with chamfered dome tip & slotted vents
    msp.add_arc((2.5, R - 2.5), radius=2.5, start_angle=90.0, end_angle=180.0, dxfattribs={"layer": "OUTLINE"})
    msp.add_arc((2.5, -R + 2.5), radius=2.5, start_angle=180.0, end_angle=270.0, dxfattribs={"layer": "OUTLINE"})
    msp.add_line((0.0, -R + 2.5), (0.0, R - 2.5), dxfattribs={"layer": "OUTLINE"})
    msp.add_line((2.5, R), (32.0, R), dxfattribs={"layer": "OUTLINE"})
    msp.add_line((2.5, -R), (32.0, -R), dxfattribs={"layer": "OUTLINE"})
    msp.add_line((32.0, -R), (32.0, R), dxfattribs={"layer": "OUTLINE"})

    # Longitudinal slotted strainer vents
    for slot_y in (-5.6, -2.2, 2.2, 5.6):
        msp.add_lwpolyline(
            [(4.5, slot_y - 0.85), (28.5, slot_y - 0.85), (28.5, slot_y + 0.85), (4.5, slot_y + 0.85)],
            close=True,
            dxfattribs={"layer": "STRAINER_VENTS"},
        )

    # 1b. Upper Seal Ring / Quality Probe O-ring (32..38 mm)
    r_seal = R + 0.25
    msp.add_lwpolyline(
        [(32.0, -r_seal), (38.0, -r_seal), (38.0, r_seal), (32.0, r_seal)],
        close=True,
        dxfattribs={"layer": "SEAL_ORINGS"},
    )
    for gx in (33.5, 35.0, 36.5):
        msp.add_line((gx, -r_seal), (gx, r_seal), dxfattribs={"layer": "SEAL_ORINGS"})

    # 1c. Upper Barrel (38..68 mm) & Internal Dashed DIP-8 PCB Outline
    msp.add_lwpolyline(
        [(38.0, -R), (68.0, -R), (68.0, R), (38.0, R)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    # Internal SHT30 probe finger + DIP-8 switch PCB (dashed)
    msp.add_lwpolyline(
        [(7.0, -3.0), (38.0, -3.0), (38.0, 3.0), (7.0, 3.0)],
        close=True,
        dxfattribs={"layer": "INTERNAL_PCB", "linetype": "DASHED"},
    )
    msp.add_lwpolyline(
        [(40.0, -5.2), (66.5, -5.2), (66.5, 5.2), (40.0, 5.2)],
        close=True,
        dxfattribs={"layer": "INTERNAL_PCB", "linetype": "DASHED"},
    )
    # 8 individual DIP switch bit actuators (1..8 -> 128..1)
    for bit_idx in range(8):
        bx = 42.2 + bit_idx * 2.8
        msp.add_lwpolyline(
            [(bx, -2.6), (bx + 1.8, -2.6), (bx + 1.8, 2.6), (bx, 2.6)],
            close=True,
            dxfattribs={"layer": "INTERNAL_PCB"},
        )
    msp.add_text("DIP-8 [128..1]", dxfattribs={"layer": "INTERNAL_PCB", "height": 1.4}).set_placement((42.0, -4.6))

    # 1d. Mounting Flange Collar & Ears in Side Profile (68..88 mm, height=20 mm)
    z_flange_0 = 68.0
    z_flange_1 = z_flange_0 + flange_h
    r_collar = R + 1.0
    msp.add_lwpolyline(
        [(z_flange_0, -r_collar), (z_flange_1, -r_collar), (z_flange_1, r_collar), (z_flange_0, r_collar)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    # Side view projection of mounting flange plate & mid-body thread O-ring seam at z = 78.0 mm
    msp.add_lwpolyline(
        [(z_flange_0, -2.2), (z_flange_1, -2.2), (z_flange_1, 2.2), (z_flange_0, 2.2)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    msp.add_line((78.0, -r_collar), (78.0, r_collar), dxfattribs={"layer": "SEAL_ORINGS"})

    # 1e. Lower Barrel RS-485 Section (88..122 mm)
    msp.add_lwpolyline(
        [(z_flange_1, -R), (122.0, -R), (122.0, R), (z_flange_1, R)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    msp.add_lwpolyline(
        [(90.0, -5.0), (119.5, -5.0), (119.5, 5.0), (90.0, 5.0)],
        close=True,
        dxfattribs={"layer": "INTERNAL_PCB", "linetype": "DASHED"},
    )
    msp.add_text("RS485 + 5-24VDC", dxfattribs={"layer": "INTERNAL_PCB", "height": 1.4}).set_placement((92.0, -0.7))

    # 1f. Tapered Ribbed Waterproof Terminal Gland (122..140 mm)
    r_gland_start = 7.8
    r_gland_end = 5.8
    msp.add_lwpolyline(
        [(122.0, -r_gland_start), (L, -r_gland_end), (L, r_gland_end), (122.0, r_gland_start)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    for rib_y_frac in (-0.75, -0.45, -0.15, 0.15, 0.45, 0.75):
        msp.add_line(
            (123.5, rib_y_frac * r_gland_start),
            (L - 1.0, rib_y_frac * r_gland_end),
            dxfattribs={"layer": "GLAND_RIBS"},
        )

    # 1g. Cable Jacket Stub & 4 Color-Coded Wire Leads (Red V+, Black GND, Yellow A+, Green B-)
    r_cab = cable_d / 2.0
    msp.add_lwpolyline(
        [(L, -r_cab), (L + 14.0, -r_cab), (L + 14.0, r_cab), (L, r_cab)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    lead_specs = [
        ("LEAD_RED_VP", 4.8, "RED: V+ (DC 5-24V)"),
        ("LEAD_BLACK_GND", 1.6, "BLACK: GND"),
        ("LEAD_YELLOW_AP", -1.6, "YELLOW: RS485 A+"),
        ("LEAD_GREEN_BM", -4.8, "GREEN: RS485 B-"),
    ]
    for l_layer, target_y, l_txt in lead_specs:
        msp.add_lwpolyline(
            [(L + 14.0, target_y * 0.35), (L + 22.0, target_y), (L + 34.0, target_y)],
            dxfattribs={"layer": l_layer},
        )
        msp.add_text(l_txt, dxfattribs={"layer": l_layer, "height": 1.45}).set_placement((L + 35.0, target_y - 0.6))

    # =========================================================================
    # 2. FRONT CROSS-SECTION VIEW (Ø16mm Barrel + 42x20mm Flange + Ø4.2mm Holes)
    # =========================================================================
    cx, cy = 232.0, 0.0
    half_fw = flange_w / 2.0
    half_fh = flange_h / 2.0
    half_sp = hole_sp / 2.0
    hole_r = hole_d / 2.0

    msp.add_text("FRONT CROSS-SECTION", dxfattribs={"layer": "TITLE_BLOCK", "height": 2.4}).set_placement(
        (cx - 21.0, -31.0)
    )
    # Mounting flange outer rectangle (42mm x 20mm)
    msp.add_lwpolyline(
        [(cx - half_fw, cy - half_fh), (cx + half_fw, cy - half_fh), (cx + half_fw, cy + half_fh), (cx - half_fw, cy + half_fh)],
        close=True,
        dxfattribs={"layer": "OUTLINE"},
    )
    # Mounting holes (2x Ø4.2mm @ 32.0mm spacing)
    for hx in (cx - half_sp, cx + half_sp):
        msp.add_circle((hx, cy), radius=hole_r, dxfattribs={"layer": "OUTLINE"})
        msp.add_line((hx - 3.5, cy), (hx + 3.5, cy), dxfattribs={"layer": "CENTERLINE"})
        msp.add_line((hx, cy - 3.5), (hx, cy + 3.5), dxfattribs={"layer": "CENTERLINE"})

    # Clamping collar (Ø18mm), Sensor outer barrel (Ø16.0mm), Inner bore (Ø13.2mm), Internal PCB
    msp.add_circle((cx, cy), radius=R + 1.0, dxfattribs={"layer": "SEAL_ORINGS"})
    msp.add_circle((cx, cy), radius=R, dxfattribs={"layer": "OUTLINE"})
    msp.add_circle((cx, cy), radius=R - 1.4, dxfattribs={"layer": "INTERNAL_PCB", "linetype": "DASHED"})
    msp.add_lwpolyline(
        [(cx - 5.0, cy - 0.8), (cx + 5.0, cy - 0.8), (cx + 5.0, cy + 0.8), (cx - 5.0, cy + 0.8)],
        close=True,
        dxfattribs={"layer": "INTERNAL_PCB"},
    )
    msp.add_line((cx - half_fw - 4.0, cy), (cx + half_fw + 4.0, cy), dxfattribs={"layer": "CENTERLINE"})
    msp.add_line((cx, cy - half_fh - 6.0), (cx, cy + half_fh + 6.0), dxfattribs={"layer": "CENTERLINE"})

    # =========================================================================
    # 3. DIMENSIONS LAYER (`140.0 MM`, `Ø16.0 MM`, `42.0 MM`, `32.0 MM`, `Ø4.2 MM`)
    # =========================================================================
    _add_linear_dim_graphic(msp, (0.0, -R), (L, -R), offset=-13.0, label=f"{L:.1f} MM", vertical=False)
    _add_linear_dim_graphic(msp, (0.0, -R), (0.0, R), offset=-10.0, label=f"Ø{D:.1f} MM", vertical=True)
    _add_linear_dim_graphic(
        msp, (cx - half_fw, -half_fh), (cx + half_fw, -half_fh), offset=-11.0, label=f"{flange_w:.1f} MM", vertical=False
    )
    _add_linear_dim_graphic(
        msp, (cx - half_sp, half_fh), (cx + half_sp, half_fh), offset=8.0, label=f"{hole_sp:.1f} MM", vertical=False
    )
    msp.add_text(f"2X Ø{hole_d:.1f} MM HOLES", dxfattribs={"layer": "DIMENSIONS", "height": 1.9}).set_placement(
        (cx - 14.0, half_fh + 13.5)
    )

    # =========================================================================
    # 4. BRIGHT RED FAULT_CALLOUT LAYER (When `fault_zone` is active)
    # =========================================================================
    resolved_zone = _resolve_zone(spec, fault_zone)
    status_str = "NOMINAL / VERIFIED"
    if resolved_zone is not None:
        if "FAULT_CALLOUT" not in layers:
            fl = layers.add("FAULT_CALLOUT", color=1, linetype="CONTINUOUS", lineweight=50)
            fl.rgb = (255, 23, 68)

        z0 = float(resolved_zone["z_start_mm"])
        z1 = float(resolved_zone["z_end_mm"])
        zid = str(resolved_zone["id"])
        zlabel = str(resolved_zone.get("label_es") or resolved_zone.get("label_en") or zid)
        half_box_y = R + 3.2 if zid != "mounting_flange" else R + 4.5

        # Red highlight envelope over exact z_start_mm..z_end_mm
        msp.add_lwpolyline(
            [(z0, -half_box_y), (z1, -half_box_y), (z1, half_box_y), (z0, half_box_y)],
            close=True,
            dxfattribs={"layer": "FAULT_CALLOUT"},
        )
        # Diagonal warning hatch strokes inside the fault envelope
        step = max(3.5, (z1 - z0) / 5.0)
        x_tick = z0 + step * 0.5
        while x_tick < z1:
            msp.add_line(
                (max(z0, x_tick - 2.0), -half_box_y),
                (min(z1, x_tick + 2.0), half_box_y),
                dxfattribs={"layer": "FAULT_CALLOUT"},
            )
            x_tick += step

        # Leader line with arrow from fault zone to RED callout banner
        mid_z = 0.5 * (z0 + z1)
        elbow_x = min(max(mid_z + 8.0, 12.0), 135.0)
        elbow_y = 26.0
        msp.add_lwpolyline(
            [(mid_z, half_box_y), (mid_z + 1.2, half_box_y + 2.4), (mid_z - 1.2, half_box_y + 2.4)],
            close=True,
            dxfattribs={"layer": "FAULT_CALLOUT"},
        )
        msp.add_lwpolyline(
            [(mid_z, half_box_y), (elbow_x, elbow_y), (elbow_x + 92.0, elbow_y)],
            dxfattribs={"layer": "FAULT_CALLOUT"},
        )

        summary_clean = (diagnosis_summary or "").strip()
        if not summary_clean:
            faults_es = resolved_zone.get("probable_faults_es") or []
            summary_clean = faults_es[0] if faults_es else "Anomalía detectada en zona inspeccionada"
        if len(summary_clean) > 84:
            summary_clean = summary_clean[:81] + "..."

        msp.add_text(
            f"FAULT CALLOUT: {zid.upper()} [{z0:.1f}..{z1:.1f} MM]",
            dxfattribs={"layer": "FAULT_CALLOUT", "height": 2.3},
        ).set_placement((elbow_x + 1.5, elbow_y + 4.2))
        msp.add_text(
            f"{zlabel} | {summary_clean}",
            dxfattribs={"layer": "FAULT_CALLOUT", "height": 1.8},
        ).set_placement((elbow_x + 1.5, elbow_y + 1.2))

        # Highlight Front Cross-Section ring in red as secondary visual cue
        msp.add_circle((cx, cy), radius=R + 2.2, dxfattribs={"layer": "FAULT_CALLOUT"})
        status_str = f"ALERT: {zid.upper()}"

    # =========================================================================
    # 5. BORDER & ENGINEERING TITLE BLOCK
    # =========================================================================
    bx0, by0, bx1, by1 = -26.0, -56.0, 272.0, 42.0
    msp.add_lwpolyline([(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)], close=True, dxfattribs={"layer": "TITLE_BLOCK"})
    tb_y = -37.0
    msp.add_line((bx0, tb_y), (bx1, tb_y), dxfattribs={"layer": "TITLE_BLOCK"})
    msp.add_line((95.0, by0), (95.0, tb_y), dxfattribs={"layer": "TITLE_BLOCK"})
    msp.add_line((195.0, by0), (195.0, tb_y), dxfattribs={"layer": "TITLE_BLOCK"})

    ts_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    msp.add_text("PART: TZ THT-02 RS-485 TEMP & HUMIDITY SENSOR", dxfattribs={"layer": "TITLE_BLOCK", "height": 2.3}).set_placement(
        (bx0 + 3.0, tb_y - 5.0)
    )
    msp.add_text("CHIP: SHT30 / SHT3X CMOSENS | MODBUS-RTU 8N1", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (bx0 + 3.0, tb_y - 10.0)
    )
    msp.add_text(f"ENVELOPE: {L:.1f} MM X Ø{D:.1f} MM | FLANGE: {flange_w:.1f} MM", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (bx0 + 3.0, tb_y - 15.0)
    )

    msp.add_text("DWG: FIELDSCAN DIGITAL TWIN", dxfattribs={"layer": "TITLE_BLOCK", "height": 2.0}).set_placement(
        (98.0, tb_y - 5.0)
    )
    msp.add_text("MANUAL REV: V1.1 (DC 5-24V, 5MA)", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (98.0, tb_y - 10.0)
    )
    msp.add_text(f"GENERATED: {ts_utc}", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (98.0, tb_y - 15.0)
    )

    msp.add_text("UNITS: MILLIMETERS (1:1)", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.9}).set_placement(
        (198.0, tb_y - 5.0)
    )
    msp.add_text("CAD FORMAT: AUTOCAD R2010", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (198.0, tb_y - 10.0)
    )
    msp.add_text(f"STATUS: {status_str}", dxfattribs={"layer": "TITLE_BLOCK", "height": 1.8}).set_placement(
        (198.0, tb_y - 15.0)
    )

    doc.saveas(out_path)
    return out_path


def _revolve_profile_triangles(
    z_vals: np.ndarray,
    r_vals_fn: Any,
    n_theta: int = 48,
    cap_start: bool = False,
    cap_end: bool = False,
) -> list[np.ndarray]:
    """Build triangulated 3D revolution surface (with optional radial modulation and end caps)."""
    thetas = np.linspace(0.0, 2.0 * math.pi, n_theta, endpoint=False)
    cos_t = np.cos(thetas)
    sin_t = np.sin(thetas)
    tris: list[np.ndarray] = []

    n_z = len(z_vals)
    # Compute grid of (n_z, n_theta, 3) vertices
    grid = np.zeros((n_z, n_theta, 3), dtype=np.float32)
    for i, z in enumerate(z_vals):
        radii = r_vals_fn(float(z), thetas)
        grid[i, :, 0] = radii * cos_t
        grid[i, :, 1] = radii * sin_t
        grid[i, :, 2] = z

    idx_next = np.roll(np.arange(n_theta), -1)
    for i in range(n_z - 1):
        p00 = grid[i]
        p01 = grid[i, idx_next]
        p10 = grid[i + 1]
        p11 = grid[i + 1, idx_next]
        t1 = np.stack([p00, p01, p11], axis=1)
        t2 = np.stack([p00, p11, p10], axis=1)
        tris.append(t1)
        tris.append(t2)

    if cap_start:
        c0 = np.zeros((n_theta, 3), dtype=np.float32)
        c0[:, 2] = float(z_vals[0])
        # Outward normal -Z
        tris.append(np.stack([c0, grid[0, idx_next], grid[0]], axis=1))

    if cap_end:
        c1 = np.zeros((n_theta, 3), dtype=np.float32)
        c1[:, 2] = float(z_vals[-1])
        # Outward normal +Z
        tris.append(np.stack([c1, grid[-1], grid[-1, idx_next]], axis=1))

    return tris


def _perforated_flange_ear_triangles(
    x_min: float,
    x_max: float,
    z_min: float,
    z_max: float,
    y_half: float,
    hole_x: float,
    hole_z: float,
    hole_r: float,
    n_seg: int = 20,
) -> np.ndarray:
    """Triangulate a 3D mounting flange ear `[x_min, x_max] x [-y_half, y_half] x [z_min, z_max]` with a circular through-hole."""
    angles = np.linspace(0.0, 2.0 * math.pi, n_seg, endpoint=False)
    inner_pts: list[tuple[float, float]] = []
    outer_pts: list[tuple[float, float]] = []

    for ang in angles:
        dx = math.cos(ang)
        dz = math.sin(ang)
        inner_pts.append((hole_x + hole_r * dx, hole_z + hole_r * dz))
        # Ray intersection from `(hole_x, hole_z)` to bounding rectangle `[x_min, x_max] x [z_min, z_max]`
        t_candidates: list[float] = []
        if dx > 1e-8:
            t_candidates.append((x_max - hole_x) / dx)
        elif dx < -1e-8:
            t_candidates.append((x_min - hole_x) / dx)
        if dz > 1e-8:
            t_candidates.append((z_max - hole_z) / dz)
        elif dz < -1e-8:
            t_candidates.append((z_min - hole_z) / dz)
        t_hit = min(t_candidates)
        outer_pts.append((hole_x + t_hit * dx, hole_z + t_hit * dz))

    tri_list: list[list[list[float]]] = []
    for k in range(n_seg):
        kn = (k + 1) % n_seg
        ix0, iz0 = inner_pts[k]
        ix1, iz1 = inner_pts[kn]
        ox0, oz0 = outer_pts[k]
        ox1, oz1 = outer_pts[kn]

        # Front face (+y_half, outward normal +Y)
        tri_list.append([[ix0, y_half, iz0], [ox0, y_half, oz0], [ox1, y_half, oz1]])
        tri_list.append([[ix0, y_half, iz0], [ox1, y_half, oz1], [ix1, y_half, iz1]])

        # Back face (-y_half, outward normal -Y)
        tri_list.append([[ix0, -y_half, iz0], [ox1, -y_half, oz1], [ox0, -y_half, oz0]])
        tri_list.append([[ix0, -y_half, iz0], [ix1, -y_half, iz1], [ox1, -y_half, oz1]])

        # Inner cylindrical hole bore wall (pointing inward toward hole center)
        tri_list.append([[ix0, -y_half, iz0], [ix0, y_half, iz0], [ix1, y_half, iz1]])
        tri_list.append([[ix0, -y_half, iz0], [ix1, y_half, iz1], [ix1, -y_half, iz1]])

        # Outer perimeter wall around the ear
        tri_list.append([[ox0, -y_half, oz0], [ox1, y_half, oz1], [ox0, y_half, oz0]])
        tri_list.append([[ox0, -y_half, oz0], [ox1, -y_half, oz1], [ox1, y_half, oz1]])

    return np.asarray(tri_list, dtype=np.float32)


def export_parametric_stl(spec: dict[str, Any], out_path: Path) -> Path:
    """Generate a binary `.stl` 3D mesh of the TZ THT-02 in exact millimeter coordinates (`140mm x Ø16mm`)."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    dims = spec.get("dimensions_mm", {})
    L = float(dims.get("total_length", 140.0))
    D = float(dims.get("outer_diameter", 16.0))
    R = float(dims.get("radius", D / 2.0))
    flange_w = float(dims.get("bracket_width", 42.0))
    flange_h = float(dims.get("bracket_height", 20.0))
    hole_d = float(dims.get("mounting_hole_diameter", 4.2))
    hole_sp = float(dims.get("mounting_hole_spacing", 32.0))

    z_stations = np.array(
        [
            0.0,
            1.2,
            2.8,
            5.0,
            5.01,
            29.0,
            29.01,
            32.0,
            32.5,
            37.5,
            38.0,
            68.0,
            68.01,
            77.7,
            78.0,
            78.3,
            87.99,
            88.0,
            122.0,
            123.5,
            138.5,
            L,
        ],
        dtype=np.float32,
    )

    def _body_radius(z: float, thetas: np.ndarray) -> np.ndarray:
        if z <= 1.2:
            base = R - 2.2 + (z / 1.2) * 1.4
            return np.full_like(thetas, base, dtype=np.float32)
        if z <= 2.8:
            base = (R - 0.8) + ((z - 1.2) / 1.6) * 0.8
            return np.full_like(thetas, base, dtype=np.float32)
        if 5.0 < z < 29.01:
            # 6 longitudinal recessed strainer vents around circumference
            slot_wave = np.cos(6.0 * thetas)
            return np.where(slot_wave > 0.45, R - 1.25, R).astype(np.float32)
        if 32.0 < z < 38.0:
            # Upper quality-probe O-ring seal
            return np.full_like(thetas, R + 0.2, dtype=np.float32)
        if 68.0 < z < 88.0:
            # Snap-on mounting flange central collar with mid-seam groove at z=78
            if abs(z - 78.0) < 0.25:
                return np.full_like(thetas, R + 0.3, dtype=np.float32)
            return np.full_like(thetas, R + 1.0, dtype=np.float32)
        if z > 122.0:
            # Tapered ribbed waterproof compression terminal gland (122..140 mm)
            t = (z - 122.0) / max(1e-6, (L - 122.0))
            taper_r = (R - 0.15) * (1.0 - t) + 5.8 * t
            if 123.0 <= z <= L - 1.0:
                ribs = 0.22 * np.maximum(0.0, np.cos(12.0 * thetas))
                return (taper_r + ribs).astype(np.float32)
            return np.full_like(thetas, taper_r, dtype=np.float32)
        return np.full_like(thetas, R, dtype=np.float32)

    mesh_chunks = _revolve_profile_triangles(z_stations, _body_radius, n_theta=48, cap_start=True, cap_end=True)

    # Add left and right perforated mounting flange ears (`bracket_width = 42 mm`, `Ø4.2 mm` holes @ `32 mm`)
    half_fw = flange_w / 2.0
    half_sp = hole_sp / 2.0
    hole_r = hole_d / 2.0
    ear_inner_x = R + 0.6
    z_f0 = 68.0
    z_f1 = z_f0 + flange_h
    z_fc = 0.5 * (z_f0 + z_f1)

    mesh_chunks.append(
        _perforated_flange_ear_triangles(
            x_min=ear_inner_x,
            x_max=half_fw,
            z_min=z_f0,
            z_max=z_f1,
            y_half=2.0,
            hole_x=half_sp,
            hole_z=z_fc,
            hole_r=hole_r,
            n_seg=20,
        )
    )
    mesh_chunks.append(
        _perforated_flange_ear_triangles(
            x_min=-half_fw,
            x_max=-ear_inner_x,
            z_min=z_f0,
            z_max=z_f1,
            y_half=2.0,
            hole_x=-half_sp,
            hole_z=z_fc,
            hole_r=hole_r,
            n_seg=20,
        )
    )

    all_tris = np.concatenate(mesh_chunks, axis=0)  # shape (N, 3, 3)
    v1 = all_tris[:, 0, :]
    v2 = all_tris[:, 1, :]
    v3 = all_tris[:, 2, :]

    # Compute unit face normals via vectorized cross product
    raw_normals = np.cross(v2 - v1, v3 - v1)
    norms = np.linalg.norm(raw_normals, axis=1, keepdims=True)
    valid_mask = norms[:, 0] > 1e-10
    v1 = v1[valid_mask]
    v2 = v2[valid_mask]
    v3 = v3[valid_mask]
    unit_normals = raw_normals[valid_mask] / norms[valid_mask]

    tri_count = len(v1)
    stl_records = np.zeros(tri_count, dtype=_STL_DTYPE)
    stl_records["normal"] = unit_normals
    stl_records["v1"] = v1
    stl_records["v2"] = v2
    stl_records["v3"] = v3
    stl_records["attr"] = 0

    header_str = f"TZ THT-02 Parametric Twin | {L:.1f}x{D:.1f}mm | FieldScan Offline CAD"
    header_bytes = header_str.encode("ascii", errors="ignore")[:80].ljust(80, b"\x00")

    with out_path.open("wb") as fh:
        fh.write(header_bytes)
        fh.write(struct.pack("<I", tri_count))
        fh.write(stl_records.tobytes())

    return out_path


def _render_annotated_snapshot(
    spec: dict[str, Any],
    out_png: Path,
    resolved_zone: dict[str, Any] | None,
    diagnosis_text: str,
    camera_png_bytes: bytes | None,
    ts_str: str,
) -> Path:
    """Create an annotated diagnostic PNG (overlays HUD on camera frame or renders twin schematic)."""
    if camera_png_bytes:
        try:
            base_img = Image.open(BytesIO(camera_png_bytes)).convert("RGB")
            w, h = base_img.size
            if w < 480 or h < 300:
                base_img = base_img.resize((max(640, w), max(400, h)))
                w, h = base_img.size
        except Exception:
            camera_png_bytes = None

    if not camera_png_bytes:
        w, h = 800, 420
        base_img = Image.new("RGB", (w, h), (15, 23, 34))
        draw = ImageDraw.Draw(base_img)
        # Technical grid lines
        for gx in range(0, w, 40):
            draw.line([(gx, 52), (gx, h - 72)], fill=(24, 36, 52), width=1)
        for gy in range(52, h - 72, 40):
            draw.line([(0, gy), (w, gy)], fill=(24, 36, 52), width=1)

        # Draw proportional 140mm x 16mm TZ THT-02 elevation diagram (`scale = 3.6 px/mm`)
        x0_px = 90
        cy_px = 205
        scale = 3.6
        for z_item in spec.get("zones", []):
            zs = float(z_item["z_start_mm"])
            ze = float(z_item["z_end_mm"])
            zd = float(z_item.get("diameter_mm", 16.0))
            chex = z_item.get("color_hex", "#B8C4D0").lstrip("#")
            rgb = (int(chex[0:2], 16), int(chex[2:4], 16), int(chex[4:6], 16))
            px0 = int(x0_px + zs * scale)
            px1 = int(x0_px + ze * scale)
            half_h = int((zd * scale) * 0.9)
            if z_item["id"] == "mounting_flange":
                draw.rectangle([px0, cy_px - 44, px1, cy_px + 44], fill=(115, 130, 145), outline=(210, 220, 230))
            draw.rectangle([px0, cy_px - half_h, px1, cy_px + half_h], fill=rgb, outline=(220, 230, 240))

        # 4 color wire leads on right side
        end_px = int(x0_px + 140.0 * scale)
        draw.rectangle([end_px, cy_px - 8, end_px + 38, cy_px + 8], fill=(35, 40, 46), outline=(120, 130, 140))
        lead_colors = [
            ((229, 57, 53), -24, "RED V+"),
            ((90, 98, 108), -8, "BLK GND"),
            ((253, 216, 53), 8, "YEL A+"),
            ((67, 160, 71), 24, "GRN B-"),
        ]
        for l_rgb, dy, l_lbl in lead_colors:
            draw.line([(end_px + 38, cy_px + dy // 3), (end_px + 90, cy_px + dy)], fill=l_rgb, width=3)
            draw.text((end_px + 96, cy_px + dy - 6), l_lbl, fill=l_rgb, font=_HUD_FONT)

        # Dimension ruler 140.0 MM
        ruler_y = cy_px + 68
        draw.line([(x0_px, ruler_y), (end_px, ruler_y)], fill=(56, 189, 248), width=2)
        draw.line([(x0_px, cy_px + 25), (x0_px, ruler_y + 6)], fill=(56, 189, 248), width=1)
        draw.line([(end_px, cy_px + 25), (end_px, ruler_y + 6)], fill=(56, 189, 248), width=1)
        draw.text((x0_px + 195, ruler_y + 6), "140.0 MM x DIA 16.0 MM", fill=(56, 189, 248), font=_HUD_FONT)

        if resolved_zone is not None:
            zs = float(resolved_zone["z_start_mm"])
            ze = float(resolved_zone["z_end_mm"])
            fx0 = int(x0_px + zs * scale) - 3
            fx1 = int(x0_px + ze * scale) + 3
            draw.rectangle([fx0, cy_px - 50, fx1, cy_px + 50], outline=(255, 35, 75), width=3)
            fmid = (fx0 + fx1) // 2
            draw.line([(fmid, cy_px - 50), (fmid + 24, 98), (fmid + 260, 98)], fill=(255, 35, 75), width=2)
            draw.text(
                (fmid + 28, 80),
                f"FAULT: {resolved_zone['id'].upper()} ({zs:.0f}-{ze:.0f}mm)",
                fill=(255, 82, 108),
                font=_HUD_FONT,
            )

    # Common top & bottom industrial telemetry HUD bars
    draw = ImageDraw.Draw(base_img)
    draw.rectangle([0, 0, w, 46], fill=(10, 15, 24))
    badge_color = (210, 32, 60) if resolved_zone else (16, 165, 110)
    zone_tag = resolved_zone["id"].upper() if resolved_zone else "NOMINAL"
    draw.rectangle([w - 230, 8, w - 12, 38], fill=badge_color)
    draw.text((14, 15), f"FIELDSCAN THT-02 | {ts_str}", fill=(235, 242, 250), font=_HUD_FONT)
    draw.text((w - 220, 16), f"ZONE: {zone_tag[:18]}", fill=(255, 255, 255), font=_HUD_FONT)

    draw.rectangle([0, h - 64, w, h], fill=(10, 15, 24))
    diag_line = (diagnosis_text or "Inspección registrada en gemelo digital offline.").replace("\n", " ").strip()
    if len(diag_line) > 96:
        diag_line = diag_line[:93] + "..."
    draw.text((14, h - 50), f"DIAGNOSIS: {diag_line}", fill=(255, 205, 110), font=_HUD_FONT)
    draw.text((14, h - 26), "SPEC: TZ THT-02 | DC 5-24V 5mA | RS-485 MODBUS RTU | SHT30/SHT3X", fill=(148, 163, 184), font=_HUD_FONT)

    base_img.save(out_png, format="PNG", compress_level=1)
    return out_png


def _sha256_short(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def build_escalation_package(
    spec: dict[str, Any],
    exports_dir: Path,
    outbox_dir: Path,
    fault_zone: str | None,
    diagnosis_text: str,
    camera_png_bytes: bytes | None = None,
    operator_notes: str = "",
) -> dict[str, Any]:
    """Generate DXF, STL, annotated PNG, Markdown report, offline Outbox `.eml`, and `.zip` bundle."""
    global _PACKAGE_COUNTER
    t0 = time.perf_counter()

    exports_dir = Path(exports_dir)
    outbox_dir = Path(outbox_dir)
    exports_dir.mkdir(parents=True, exist_ok=True)
    outbox_dir.mkdir(parents=True, exist_ok=True)

    _PACKAGE_COUNTER += 1
    now_utc = datetime.now(timezone.utc)
    ts_compact = now_utc.strftime("%Y%m%d_%H%M%S")
    ts_human = now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
    package_id = f"ESC-THT02-{ts_compact}-{_PACKAGE_COUNTER:03d}"
    stem = package_id.lower().replace("-", "_")

    resolved_zone = _resolve_zone(spec, fault_zone)
    zone_id = resolved_zone["id"] if resolved_zone else None
    zone_label_es = resolved_zone["label_es"] if resolved_zone else "Inspección General (Sin fallo localizado)"
    zone_label_en = resolved_zone["label_en"] if resolved_zone else "General Inspection (No localized fault)"
    zone_span = (
        f"{resolved_zone['z_start_mm']:.1f} .. {resolved_zone['z_end_mm']:.1f} mm"
        if resolved_zone
        else "0.0 .. 140.0 mm"
    )

    dxf_path = exports_dir / f"{stem}.dxf"
    stl_path = exports_dir / f"{stem}.stl"
    png_path = exports_dir / f"{stem}_snapshot.png"
    md_path = exports_dir / f"{stem}_report.md"
    zip_path = exports_dir / f"{stem}_bundle.zip"
    eml_path = outbox_dir / f"{stem}.eml"

    # 1. CAD Blueprint (.dxf) & 3D Parametric Mesh (.stl)
    export_autocad_dxf(spec, dxf_path, fault_zone=zone_id, diagnosis_summary=diagnosis_text)
    export_parametric_stl(spec, stl_path)

    # 2. Annotated Visual Evidence (.png)
    _render_annotated_snapshot(spec, png_path, resolved_zone, diagnosis_text, camera_png_bytes, ts_human)

    # 3. Markdown Engineering Escalation Report (.md)
    faults_bullets = "\n".join(
        f"- {item}" for item in (resolved_zone.get("probable_faults_es", []) if resolved_zone else ["N/A"])
    )
    symptoms_bullets = "\n".join(
        f"- {item}" for item in (resolved_zone.get("electrical_symptoms", []) if resolved_zone else ["N/A"])
    )
    actions_bullets = "\n".join(
        f"- {item}" for item in (resolved_zone.get("recommended_actions_es", []) if resolved_zone else ["N/A"])
    )
    pages_ref = ", ".join(str(p) for p in (resolved_zone.get("manual_pages", [1, 9]) if resolved_zone else [1, 9]))

    report_md = f"""# Dossier de Escalamiento de Ingeniería / Engineering Escalation Report

- **Package ID**: `{package_id}`
- **Fecha / Timestamp**: `{ts_human}`
- **Sensor**: `{spec.get("sensor_id", "TZ-THT-02")}` — {spec.get("name", "TZ THT-02")}
- **Zona Afectada / Fault Zone**: `{zone_id or "NOMINAL"}` — **{zone_label_es}** (*{zone_label_en}*)
- **Cota Axial / Axial Span**: `{zone_span}` (Envolvente total: `140.0 mm × Ø16.0 mm`)
- **Páginas del Manual V1.1 Relacionadas**: Páginas `{pages_ref}`

## 1. Diagnóstico en Campo / Field Diagnosis
{diagnosis_text.strip() or "Sin diagnóstico textual adicional."}

## 2. Notas del Operador / Operator Notes
{operator_notes.strip() or "Sin notas manuales registradas por el operador."}

## 3. Matriz Técnica de Zona (`{zone_id or "general"}`)
### Causas Físicas Probables
{faults_bullets}

### Síntomas Eléctricos / Modbus RTU Asociados
{symptoms_bullets}

### Acciones Correctivas Recomendadas
{actions_bullets}

## 4. Manifiesto de Artefactos Adjuntos / Artifact Manifest
| Archivo | Tipo | Tamaño (Bytes) | SHA-256 (16-hex) |
| :--- | :--- | ---: | :--- |
| `{dxf_path.name}` | Plano AutoCAD R2010 (`140×16mm` + `FAULT_CALLOUT`) | {dxf_path.stat().st_size} | `{_sha256_short(dxf_path)}` |
| `{stl_path.name}` | Malla Sólida 3D Binaria `.STL` (Escala 1:1 mm) | {stl_path.stat().st_size} | `{_sha256_short(stl_path)}` |
| `{png_path.name}` | Captura Anotada con Telemetría HUD | {png_path.stat().st_size} | `{_sha256_short(png_path)}` |
"""
    md_path.write_text(report_md, encoding="utf-8")

    # 4. RFC-5322 Store-and-Forward Offline Outbox Email (.eml)
    sender = "fieldscan-copilot@edge-iq9075.local"
    recipient = "mantenimiento-ingenieria@planta-industrial.local"
    subject = f"[FIELDSCAN ESCALATION] {spec.get('sensor_id', 'TZ-THT-02')} | Zona: {zone_id or 'GENERAL'} ({package_id})"
    msg_id = make_msgid(domain="edge-iq9075.local")
    date_hdr = format_datetime(now_utc)

    email_body = (
        f"PAQUETE DE ESCALAMIENTO OFFLINE (STORE-AND-FORWARD OUTBOX)\n"
        f"==========================================================\n"
        f"ID Paquete : {package_id}\n"
        f"Fecha UTC  : {ts_human}\n"
        f"Equipo     : {spec.get('name', 'TZ THT-02')} ({spec.get('sensor_id', 'TZ-THT-02')})\n"
        f"Zona Fallo : {zone_id or 'NOMINAL'} - {zone_label_es} [{zone_span}]\n"
        f"Manual Ref : TZ THT-02 User's Manual V1.1 (Pags. {pages_ref})\n\n"
        f"DIAGNOSTICO:\n{diagnosis_text.strip() or 'N/A'}\n\n"
        f"NOTAS DEL OPERADOR:\n{operator_notes.strip() or 'N/A'}\n\n"
        f"ADJUNTOS TECNICOS:\n"
        f"  1. {dxf_path.name} (Plano AutoCAD R2010 con capa FAULT_CALLOUT)\n"
        f"  2. {stl_path.name} (Modelo 3D binario STL 140mm x 16mm)\n"
        f"  3. {png_path.name} (Evidencia visual anotada)\n"
        f"  4. {md_path.name} (Reporte de ingenieria en Markdown)\n"
    )

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg["Date"] = date_hdr
    msg["Message-ID"] = msg_id
    msg["X-FieldScan-Package-ID"] = package_id
    msg["X-FieldScan-Sensor-ID"] = str(spec.get("sensor_id", "TZ-THT-02"))
    msg["X-FieldScan-Fault-Zone"] = str(zone_id or "NOMINAL")
    msg["X-FieldScan-Outbox-Mode"] = "STORE_AND_FORWARD_OFFLINE"
    msg.set_content(email_body)

    attachment_specs = [
        (dxf_path, "application", "dxf"),
        (stl_path, "model", "stl"),
        (png_path, "image", "png"),
        (md_path, "text", "markdown"),
    ]
    attachment_summaries: list[dict[str, Any]] = []
    for fpath, maintype, subtype in attachment_specs:
        raw_bytes = fpath.read_bytes()
        msg.add_attachment(raw_bytes, maintype=maintype, subtype=subtype, filename=fpath.name)
        attachment_summaries.append({"filename": fpath.name, "size_bytes": len(raw_bytes), "mime": f"{maintype}/{subtype}"})

    eml_path.write_bytes(msg.as_bytes())

    # 5. Bundle everything into a portable `.zip` archive in `exports_dir`
    with zipfile.ZipFile(zip_path, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=1) as zf:
        for artifact in (dxf_path, stl_path, png_path, md_path, eml_path):
            zf.write(artifact, arcname=artifact.name)

    generated_in_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    files_map = {
        "dxf": str(dxf_path.resolve()),
        "stl": str(stl_path.resolve()),
        "png": str(png_path.resolve()),
        "report_md": str(md_path.resolve()),
        "eml": str(eml_path.resolve()),
        "zip": str(zip_path.resolve()),
    }
    urls_map = {
        "dxf": f"/exports/{dxf_path.name}",
        "stl": f"/exports/{stl_path.name}",
        "png": f"/exports/{png_path.name}",
        "report_md": f"/exports/{md_path.name}",
        "zip": f"/exports/{zip_path.name}",
        "eml": f"/outbox/{eml_path.name}",
    }
    email_preview = {
        "message_id": msg_id,
        "from": sender,
        "to": recipient,
        "subject": subject,
        "date": date_hdr,
        "status": "QUEUED_OFFLINE_OUTBOX",
        "fault_zone": zone_id,
        "outbox_filename": eml_path.name,
        "attachments": attachment_summaries,
        "body": email_body,
    }

    return {
        "package_id": package_id,
        "sensor_id": spec.get("sensor_id", "TZ-THT-02"),
        "timestamp_utc": ts_human,
        "fault_zone": zone_id,
        "fault_zone_label_es": zone_label_es,
        "diagnosis_text": diagnosis_text,
        "operator_notes": operator_notes,
        "generated_in_ms": generated_in_ms,
        "files": files_map,
        "urls": urls_map,
        "dxf_path": files_map["dxf"],
        "stl_path": files_map["stl"],
        "png_path": files_map["png"],
        "report_path": files_map["report_md"],
        "eml_path": files_map["eml"],
        "zip_path": files_map["zip"],
        "dxf_url": urls_map["dxf"],
        "stl_url": urls_map["stl"],
        "png_url": urls_map["png"],
        "report_url": urls_map["report_md"],
        "eml_url": urls_map["eml"],
        "zip_url": urls_map["zip"],
        "email_preview": email_preview,
    }
