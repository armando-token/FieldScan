"""Modular Datasheet & Manual Section Navigator (`TZ THT-02 User's Manual V1.1`).

Provides a single, side-effect-free English source of truth for:
- Exact page & section resolution across Pages 1..9 of `THT02_Users_Manual_v1.1.pdf`
- Auto-open & lightbox triggers when the operator asks where a topic (e.g., calibration,
  wiring, DIP-8 address, Modbus registers, CRC-16, dimensions) is located in the datasheet
- Grounded, zero-false-claim English section summaries & verified citations (`VIS-10`)
"""

from __future__ import annotations

import re
from typing import Any
import unicodedata

from fieldscan.profiles_and_manual import (
    MANUAL_INDEX_PATH,
    PROJECT_ROOT,
    load_manual_index,
    resolve_device_profile,
    verify_and_resolve_citations,
)


def strip_accents_lower(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()


def detect_query_language(text: str, default: str = "en") -> str:
    """All FieldScan HMI, voice, and AI outputs operate strictly in English ('en')."""
    _ = (text, default)
    return "en"


# Canonical English topic-to-manual-section catalog covering all 9 pages of Manual V1.1
MANUAL_TOPIC_CATALOG: list[dict[str, Any]] = [
    {
        "topic_id": "calibration_accuracy",
        "primary_page": 3,
        "cited_pages": [3, 2, 6],
        "section_id": "3.1",
        "heading_en": "Section 3.1 (Page 3) & Section 2.1 (Page 2) — Factory Calibration, Accuracy & Drift",
        "keywords": (
            "calibration",
            "calibrate",
            "calibrated",
            "offset",
            "adjustment",
            "precision",
            "accuracy",
            "tolerance",
            "drift",
            "0.3",
            "0.25",
            "metrolog",
        ),
        "weight": 12,
        "summary_en": (
            "In the official TZ THT-02 Manual V1.1, calibration and accuracy specifications are located on "
            "Page 3 (Section 3.1 · Technical Data) and Page 2 (Section 2.1 · SHT30 CMOSens Overview): "
            "the SHT30/SHT3X probe is factory-calibrated with ±0.3 °C accuracy (0–60 °C), ±2 %RH accuracy (5–95 %RH), "
            "0.1 °C / 0.1 %RH resolution, and < ±0.25 %RH/year long-term drift. Pages 6 and 8 (Sections 5.2 & 5.4) also show "
            "that register 0x0005 (baud rate) is the only writable parameter—no user calibration offset registers exist on this unit."
        ),
    },
    {
        "topic_id": "dip_switch_opening",
        "primary_page": 5,
        "cited_pages": [5, 6],
        "section_id": "5.1",
        "heading_en": "Section 5.1 (Page 5) — 8-Bit DIP Switch Address Weights & 2-Step Housing Opening",
        "keywords": (
            "dip",
            "switch",
            "switches",
            "pin",
            "pins",
            "rocker",
            "slave",
            "address",
            "176",
            "128",
            "unscrew",
            "open housing",
            "two step",
            "8n1",
        ),
        "weight": 10,
        "summary_en": (
            "Located on Page 5 (Section 5.1 · 8-Bit DIP Switch Address Code & 2-Step Housing Opening): "
            "Step 1 loosen the rear waterproof gland nut first, then Step 2 unscrew the middle barrel to access the SW1 DIP-8 "
            "switch with binary weights [128, 64, 32, 16, 8, 4, 2, 1] from Pin 1 to Pin 8 (Pin 8 ON = Slave #1; Pins 1,3,4 ON = 176)."
        ),
    },
    {
        "topic_id": "wiring_grounding",
        "primary_page": 4,
        "cited_pages": [4, 1],
        "section_id": "4.1",
        "heading_en": "Section 4.1 (Page 4) — 4-Lead Color Wiring, Operating Environment & RS-485 Grounding",
        "keywords": (
            "wiring",
            "wire",
            "wires",
            "cable",
            "cables",
            "lead",
            "leads",
            "color",
            "colors",
            "yellow",
            "green",
            "red",
            "black",
            "gnd",
            "ground",
            "grounding",
            "shield",
            "gland",
            "back",
            "rear",
        ),
        "weight": 10,
        "summary_en": (
            "Located on Page 4 (Section 4.1 · Environmental Conditions & 4-Lead Wiring Schematic): "
            "Red = Power V+ (DC 5–24 V), Black = Public GND, Yellow = RS-485 A+, Green = RS-485 B-. "
            "Bond Black GND and the cable shield to the RS-485 converter ground reference."
        ),
    },
    {
        "topic_id": "registers_7fff",
        "primary_page": 6,
        "cited_pages": [6, 7, 8],
        "section_id": "5.2",
        "heading_en": "Section 5.2 (Page 6) — Holding Register Map (0x0000..0x0007) & 0x7FFF Probe Alarm",
        "keywords": (
            "register",
            "registers",
            "holding",
            "7fff",
            "7fffh",
            "0x0000",
            "0x0001",
            "0x0004",
            "0000h",
            "0001h",
            "inter-byte",
            "3.5 char",
            "sentinel",
        ),
        "weight": 10,
        "summary_en": (
            "Located on Page 6 (Section 5.2 · RTU Timing & Holding Register Map 0x0000..0x0007): "
            "0x0000 = Temperature (signed 0.1 °C), 0x0001 = Relative Humidity (0.1 %RH), 0x0004 = DIP Address (R), "
            "0x0005 = Baud Rate (R/W), and 7FFFH indicates an abnormal SHT30 sensing element."
        ),
    },
    {
        "topic_id": "poll_0x03",
        "primary_page": 7,
        "cited_pages": [7, 6],
        "section_id": "5.3",
        "heading_en": "Section 5.3 (Page 7) — Function Code 0x03 Read Request & 21-Byte RTU Response",
        "keywords": (
            "0x03",
            "function 03",
            "21-byte",
            "21 bytes",
            "44 0c",
            "01 03 00 00",
            "poll example",
        ),
        "weight": 10,
        "summary_en": (
            "Located on Page 7 (Section 5.3 · Function Code 0x03 Poll Request & 21-Byte Response): "
            "documents the host request `01 03 00 00 00 08 44 0C` for Slave #1 registers 0x0000..0x0007 and its 21-byte RTU reply."
        ),
    },
    {
        "topic_id": "baud_write_decoding",
        "primary_page": 8,
        "cited_pages": [8, 6],
        "section_id": "5.4",
        "heading_en": "Section 5.4 (Page 8) — Hex Data Decoding, Baud Rate Register 0x0005 (FC 0x06) & Exceptions",
        "keywords": (
            "0x06",
            "function 06",
            "0x0005",
            "0005h",
            "baud",
            "4800",
            "19200",
            "2580h",
            "00fah",
            "0258h",
            "decoding",
            "0x83",
            "0x86",
        ),
        "weight": 9,
        "summary_en": (
            "Located on Page 8 (Section 5.4 · Data Decoding Example, Function 0x06 Baud Write & Abnormal Response): "
            "covers `00FAH = 25.0 °C`, `0258H = 60.0 %RH`, baud configuration on register `0x0005` (blocked in read-only pilot mode), "
            "and exception replies `0x83` / `0x86`."
        ),
    },
    {
        "topic_id": "crc_dimensions_errors",
        "primary_page": 9,
        "cited_pages": [9, 1],
        "section_id": "6.1",
        "heading_en": "Section 6.1 (Page 9) — Exception Error Codes, CRC-16 (0xA001) & 140×16 mm Mechanical Blueprint",
        "keywords": (
            "crc",
            "crc-16",
            "crc16",
            "a001",
            "0xa001",
            "dimensions",
            "length",
            "diameter",
            "blueprint",
            "140",
            "16 mm",
            "16mm",
            "illegal function",
            "exception code",
            "error codes",
        ),
        "weight": 9,
        "summary_en": (
            "Located on Page 9 (Section 6.1 · Exception Error Codes, CRC-16 Algorithm & Mechanical Dimensions): "
            "lists exception codes `01/02/03`, CRC-16 (`0xFFFF` init, `0xA001` polynomial), and the `140.0 mm × Ø16.0 mm` envelope."
        ),
    },
    {
        "topic_id": "power_electrical_specs",
        "primary_page": 3,
        "cited_pages": [3, 2],
        "section_id": "3.1",
        "heading_en": "Section 3.1 (Page 3) — Power Supply (5–24 V DC), RS-485 Bus Distance & Sensing Range",
        "keywords": (
            "power",
            "voltage",
            "supply",
            "current",
            "24v",
            "5v",
            "5ma",
            "1200m",
            "1200 m",
            "range",
            "specifications",
            "specs",
            "technical data",
        ),
        "weight": 8,
        "summary_en": (
            "Located on Page 3 (Section 3.1 · Technical Data): DC 5–24 V supply (5 mA nominal), RS-485 bus up to 1200 m (32 nodes), "
            "SHT30 temperature range -40 to +125 °C (±0.3 °C), and SHT3X humidity range 5–95 %RH (±2 %RH)."
        ),
    },
    {
        "topic_id": "anatomy_parts",
        "primary_page": 1,
        "cited_pages": [1, 9],
        "section_id": "1.1",
        "heading_en": "Section 1.1 (Page 1) — External Physical Callouts & SHT30 Strainer Probe Anatomy",
        "keywords": (
            "anatomy",
            "parts",
            "components",
            "callouts",
            "strainer",
            "filter",
            "mesh",
            "sintered",
            "cover",
            "main sensor",
            "probe",
        ),
        "weight": 8,
        "summary_en": (
            "Located on Page 1 (Section 1.1 · Physical Callouts & Probe Anatomy): identifies the stainless steel strainer cap, "
            "SHT30 probe, mounting holes, 1 m 4-wire lead, and rear waterproof compression terminal."
        ),
    },
    {
        "topic_id": "overview_applications",
        "primary_page": 2,
        "cited_pages": [2, 3],
        "section_id": "2.1",
        "heading_en": "Section 2.1 (Page 2) — Product Overview, CMOSens Features & Application Areas",
        "keywords": (
            "applications",
            "hvac",
            "cleanroom",
            "overview",
            "features",
            "cmosens",
        ),
        "weight": 7,
        "summary_en": (
            "Located on Page 2 (Section 2.1 · Product Overview & Features): covers the factory-calibrated SHT30/SHT3X CMOSens "
            "architecture, RS-485 Modbus-RTU interface, and HVAC, cleanroom, and warehouse applications."
        ),
    },
]

_EXPLICIT_MANUAL_REQUEST_RE = re.compile(
    r"\b(?:manual|datasheet|page|pag\.?|section|where\s+in\s+the\s+manual|where\s+is\s+the\s+section|"
    r"which\s+page|what\s+page|what\s+section|open\s+the\s+manual|open\s+datasheet|in\s+the\s+datasheet|in\s+the\s+manual)\b",
    re.IGNORECASE,
)

_EXPLICIT_PAGE_NUMBER_RE = re.compile(
    r"\b(?:page|pag\.?|p)\s*#?\s*([1-9])\b",
    re.IGNORECASE,
)


def is_explicit_manual_lookup_query(query: str) -> bool:
    """Return True when the operator asks to open/locate/read something in the datasheet or manual."""
    norm = strip_accents_lower(query)
    if _EXPLICIT_PAGE_NUMBER_RE.search(norm):
        return True
    if _EXPLICIT_MANUAL_REQUEST_RE.search(norm):
        return True
    if any(k in norm for k in ("calibration", "calibrate", "calibrated")):
        return True
    return False


def lookup_manual_for_query(
    query: str,
    *,
    lang: str | None = None,
    profile_id: str = "tzone_tht02",
    project_root=PROJECT_ROOT,
    manual_index_path=MANUAL_INDEX_PATH,
) -> dict[str, Any]:
    """Search Manual V1.1 across all 9 pages & sections and build verified English citations + UI open flags."""
    norm = strip_accents_lower(query)
    resolved_lang = "en"
    _ = lang
    idx = load_manual_index(manual_index_path)
    pages_by_num = {int(p["page"]): p for p in idx.get("pages", []) if "page" in p}

    explicit_open = bool(_EXPLICIT_MANUAL_REQUEST_RE.search(norm))
    explicit_page_match = _EXPLICIT_PAGE_NUMBER_RE.search(norm)

    best_topic: dict[str, Any] | None = None
    best_score = 0

    for topic in MANUAL_TOPIC_CATALOG:
        hits = sum(1 for kw in topic["keywords"] if kw in norm)
        if hits > 0:
            score = hits * int(topic["weight"])
            if score > best_score:
                best_score = score
                best_topic = topic

    if explicit_page_match:
        req_page = int(explicit_page_match.group(1))
        page_entry = pages_by_num.get(req_page, {})
        sec_list = page_entry.get("sections") or [{}]
        sec0 = sec_list[0] if sec_list else {}
        primary_page = req_page
        cited_pages = [req_page]
        sec_id = str(sec0.get("section_id") or f"{req_page}.1")
        title_str = str(page_entry.get("title") or f"Page {req_page}")
        excerpt = str(sec0.get("verified_excerpt") or "")
        heading = f"Page {req_page} · Section {sec_id} — {sec0.get('heading') or title_str}"
        answer = f"Here is Page {req_page} (Section {sec_id} · {sec0.get('heading') or title_str}) of the TZ THT-02 Manual V1.1: {excerpt}"
        matched = True
        topic_id = f"explicit_page_{req_page}"
    elif best_topic is not None:
        primary_page = int(best_topic["primary_page"])
        cited_pages = [int(p) for p in best_topic["cited_pages"]]
        sec_id = str(best_topic["section_id"])
        heading = str(best_topic["heading_en"])
        answer = str(best_topic["summary_en"])
        page_entry = pages_by_num.get(primary_page, {})
        sec_list = page_entry.get("sections") or [{}]
        excerpt = str((sec_list[0] if sec_list else {}).get("verified_excerpt") or answer)
        matched = True
        topic_id = str(best_topic["topic_id"])
    elif explicit_open:
        primary_page = 3 if any(w in norm for w in ("spec", "accuracy", "range", "data")) else 1
        cited_pages = [primary_page, 5, 6]
        page_entry = pages_by_num.get(primary_page, {})
        sec_list = page_entry.get("sections") or [{}]
        sec0 = sec_list[0] if sec_list else {}
        sec_id = str(sec0.get("section_id") or f"{primary_page}.1")
        heading = f"Page {primary_page} · Section {sec_id} — {sec0.get('heading') or page_entry.get('title', 'Datasheet')}"
        answer = (
            "Opening the official TZ THT-02 Manual V1.1 (9 pages: P1 Anatomy, P2 SHT30 Overview, "
            "P3 Factory Calibration/Specs, P4 4-Wire RS-485, P5 DIP-8 Switch, P6–P8 Modbus Registers, P9 CRC-16 & 140×16 mm Blueprint)."
        )
        excerpt = str(sec0.get("verified_excerpt") or "")
        matched = True
        topic_id = "manual_overview"
    else:
        return {
            "matched": False,
            "topic_id": None,
            "language": resolved_lang,
            "open_manual": False,
            "open_manual_lightbox": False,
            "manual_page": None,
            "cited_pages": [],
            "citations": [],
            "manual_section": None,
            "answer": "",
        }

    prof = resolve_device_profile(profile_id)
    cit_check = verify_and_resolve_citations(
        prof,
        cited_pages,
        project_root=project_root,
        manual_index_path=manual_index_path,
    )
    citations = cit_check["citations"] if cit_check["verified"] else []

    should_open_lightbox = bool(
        explicit_open
        or explicit_page_match
        or (
            topic_id == "calibration_accuracy"
            and any(w in norm for w in ("where", "page", "section", "show", "open", "manual", "datasheet"))
        )
    )

    manual_section = {
        "page": primary_page,
        "section_id": sec_id,
        "heading": heading,
        "verified_excerpt": excerpt,
        "topic_id": topic_id,
    }

    return {
        "matched": matched,
        "topic_id": topic_id,
        "language": resolved_lang,
        "open_manual": True,
        "open_manual_lightbox": should_open_lightbox,
        "manual_page": primary_page,
        "cited_pages": cited_pages,
        "citations": citations,
        "manual_section": manual_section,
        "answer": answer,
    }
