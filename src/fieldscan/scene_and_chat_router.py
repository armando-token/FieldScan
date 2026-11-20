"""Modular English Intent Router, OpenCV Scene Environment Analyzer & Conversational Fallback.

Eliminates the "broken parrot" failure mode by cleanly separating:
1. `general_chat` — Natural English conversation, hearing checks ("can you hear me?"),
   greetings, time/date, math, and contextual follow-ups with ZERO unrequested sensor boilerplate.
2. `scene_vision` — Real camera scene inspection ("can you see what is on the carpet under the sensor?",
   "what else is around the sensor?"), backed by both VLM raw-image grounding and
   deterministic OpenCV color/texture/surface analysis.
3. `manual_lookup` — Datasheet & calibration section queries with automatic drawer/lightbox opening.
4. `sensor_diagnostics` — Explicit sensor state, 3D Digital Twin manipulation, Modbus/RS-485, DIP-8, and fault queries.
"""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any

import cv2
import numpy as np

from fieldscan.manual_navigator import (
    detect_query_language,
    is_explicit_manual_lookup_query,
    strip_accents_lower,
)

# 1. Explicit scene / background / floor / carpet / surroundings terms (100% English)
_SCENE_ENVIRONMENT_RE = re.compile(
    r"\b(?:floor|carpet|rug|mat|desk|table|background|surroundings|around\s+the\s+sensor|room|surface|"
    r"what\s+else\s+do\s+you\s+see|what\s+is\s+under|underneath|color\s+of\s+the)\b",
    re.IGNORECASE,
)

_GENERIC_CAMERA_SEE_RE = re.compile(
    r"\b(?:what\s+do\s+you\s+see|can\s+you\s+see|on\s+the\s+camera|in\s+front\s+of\s+the\s+camera)\b",
    re.IGNORECASE,
)

# 2. Explicit sensor / 3D Digital Twin / Modbus / fault / hardware terms (100% English)
_SENSOR_DIAGNOSTIC_RE = re.compile(
    r"\b(?:sensor|tht|ths|thp|sht30|sht3x|modbus|rs485|rs-485|rtu|dip|switch|switches|"
    r"pin|pins|rocker|rockers|slave|address|register|registers|0x[0-9a-f]+|7fff|7fffh|crc|"
    r"baud|9600|4800|19200|temp|temperature|humid|humidity|rh|wire|wires|wiring|"
    r"cable|cables|lead|leads|gland|back|rear|volt|voltage|power|gnd|ground|strainer|"
    r"filter|sintered|probe|tip|barrel|housing|flange|bracket|mount|mounting|o-ring|oring|"
    r"seal|gasket|pcb|unscrew|explode|close|xray|x-ray|wireframe|twin|digital\s+twin|3d|cad|"
    r"dxf|stl|fault|broken|damaged|failing|alarm|patch|stain|obstruction|frayed|andon|scada|plc)\b",
    re.IGNORECASE,
)

_HEARING_CHECK_RE = re.compile(
    r"\b(?:can\s+you\s+hear\s+me|do\s+you\s+hear\s+me|are\s+you\s+listening|testing\s+mic|"
    r"mic\s+check|audio\s+check|hear\s+me\s+okay|hear\s+me\s+now)\b",
    re.IGNORECASE,
)

_GREETING_OR_META_RE = re.compile(
    r"^(?:hey|hi|hello|good\s+morning|good\s+afternoon|good\s+evening|how\s+are\s+you|"
    r"who\s+are\s+you|what\s+can\s+you\s+do|thank\s+you|thanks|ok|okay|got\s+it|understood)\b",
    re.IGNORECASE,
)

_TIME_DATE_RE = re.compile(
    r"\b(?:what\s+time|current\s+time|time\s+is\s+it|what\s+day|what\s+date|today's\s+date)\b",
    re.IGNORECASE,
)


def classify_conversation_intent(
    query: str,
    zone_hint: str | None = None,
) -> dict[str, Any]:
    """Classify operator input into ('general_chat', 'scene_vision', 'manual_lookup', 'sensor_diagnostics')."""
    raw = (query or "").strip()
    norm = strip_accents_lower(raw)
    lang = detect_query_language(raw, default="en")

    if zone_hint and str(zone_hint).strip():
        return {"intent": "sensor_diagnostics", "language": lang}

    if not norm:
        return {"intent": "sensor_diagnostics", "language": lang}

    # 1. Explicit hearing/mic check or time/date -> NEVER dump sensor status!
    if _HEARING_CHECK_RE.search(norm) and not _SENSOR_DIAGNOSTIC_RE.search(norm):
        return {"intent": "general_chat", "subintent": "hearing_check", "language": lang}

    if _TIME_DATE_RE.search(norm) and not _SENSOR_DIAGNOSTIC_RE.search(norm):
        return {"intent": "general_chat", "subintent": "time_date", "language": lang}

    # 2. Scene / floor / carpet / surroundings inspection
    if _SCENE_ENVIRONMENT_RE.search(norm):
        return {"intent": "scene_vision", "subintent": "environment_detail", "language": lang}

    # 3. Datasheet / manual / page / calibration section lookup
    if is_explicit_manual_lookup_query(raw):
        if any(
            fk in norm
            for fk in ("patch", "frayed", "failing", "broken", "damaged", "obstruction")
        ):
            return {"intent": "sensor_diagnostics", "subintent": "visual_fault", "language": lang}
        return {"intent": "manual_lookup", "subintent": "datasheet_section", "language": lang}

    # 4. Generic "what do you see on camera?" without asking about a specific sensor part/fault -> scene_vision
    if _GENERIC_CAMERA_SEE_RE.search(norm) and not _SENSOR_DIAGNOSTIC_RE.search(norm):
        return {"intent": "scene_vision", "subintent": "camera_overview", "language": lang}

    # 5. Explicit sensor / 3D Digital Twin / Modbus / DIP / fault technical queries
    if _SENSOR_DIAGNOSTIC_RE.search(norm):
        return {"intent": "sensor_diagnostics", "subintent": "technical_or_fault", "language": lang}

    # 6. Everything else is natural human conversation!
    return {"intent": "general_chat", "subintent": "open_chat", "language": lang}


def evaluate_simple_math(query: str) -> str | None:
    norm = strip_accents_lower(query)
    m = re.search(
        r"(\d+(?:\.\d+)?)\s*(\+|plus|-|minus|\*|x|times|/|divided\s+by)\s*(\d+(?:\.\d+)?)",
        norm,
    )
    if not m:
        return None
    a = float(m.group(1))
    op = m.group(2)
    b = float(m.group(3))
    if op in ("+", "plus"):
        res = a + b
    elif op in ("-", "minus"):
        res = a - b
    elif op in ("*", "x", "times"):
        res = a * b
    else:
        if abs(b) < 1e-9:
            return None
        res = a / b
    return str(int(round(res))) if abs(res - round(res)) < 1e-6 else f"{res:.2f}"


def _describe_color_bgr(mean_b: float, mean_g: float, mean_r: float) -> str:
    luma = 0.299 * mean_r + 0.587 * mean_g + 0.114 * mean_b
    max_c = max(mean_r, mean_g, mean_b)
    min_c = min(mean_r, mean_g, mean_b)
    chroma = max_c - min_c

    if luma < 45:
        return "dark / charcoal-black"
    if luma > 212 and chroma < 24:
        return "bright white"
    if chroma < 20:
        if luma < 105:
            return "dark grey"
        if luma < 170:
            return "neutral grey"
        return "light grey / off-white"

    if mean_r >= mean_g and mean_r >= mean_b:
        if mean_g > mean_b * 1.18:
            return "warm beige / tan / wood-toned"
        return "warm reddish / terracotta"
    if mean_g >= mean_r and mean_g >= mean_b:
        return "muted green / sage"
    return "cool blue-grey"


def analyze_scene_environment(
    raw_jpeg: bytes | None,
    scanner_telemetry: dict[str, Any] | None = None,
    lang: str = "en",
) -> dict[str, Any]:
    """Extract genuine visual properties of the background/floor/carpet/surface from the raw camera frame."""
    _ = lang
    tel = scanner_telemetry or {}
    if not raw_jpeg:
        return {
            "has_frame": False,
            "surface_color": "unknown",
            "surface_texture": "no active frame",
            "lighting": "unknown",
            "summary": "No active camera frame is available yet.",
        }

    arr = np.frombuffer(raw_jpeg, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None or bgr.size == 0:
        return {
            "has_frame": False,
            "surface_color": "unknown",
            "surface_texture": "unreadable frame",
            "lighting": "unknown",
            "summary": "Could not decode the current camera frame.",
        }

    small = cv2.resize(bgr, (240, 135), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    # Mask out detected sensor bounding box (if any) so we inspect the actual surrounding floor/carpet/desk!
    bg_mask = np.ones((135, 240), dtype=np.uint8) * 255
    bbox = tel.get("bbox")
    orig_h, orig_w = bgr.shape[:2]
    if isinstance(bbox, (list, tuple)) and len(bbox) == 4 and tel.get("detected"):
        sx = 240.0 / max(1.0, float(orig_w))
        sy = 135.0 / max(1.0, float(orig_h))
        x0 = max(0, int(bbox[0] * sx) - 4)
        y0 = max(0, int(bbox[1] * sy) - 4)
        x1 = min(240, int((bbox[0] + bbox[2]) * sx) + 4)
        y1 = min(135, int((bbox[1] + bbox[3]) * sy) + 4)
        bg_mask[y0:y1, x0:x1] = 0

    bg_pixels = small[bg_mask > 0]
    if len(bg_pixels) < 200:
        bg_pixels = small.reshape(-1, 3)

    mean_bgr = bg_pixels.mean(axis=0)
    surface_color = _describe_color_bgr(float(mean_bgr[0]), float(mean_bgr[1]), float(mean_bgr[2]))

    # High-frequency micro-grain (difference between raw gray and 5x5 median blur) distinguishes carpet/fabric vs smooth desk
    med5 = cv2.medianBlur(gray, 5)
    grain_diff = np.abs(gray.astype(np.float32) - med5.astype(np.float32))
    bg_grain = float(grain_diff[bg_mask > 0].mean()) if np.any(bg_mask > 0) else float(grain_diff.mean())

    if bg_grain >= 2.8:
        texture_desc = "fibrous/woven textured surface (consistent with a carpet, rug, or mat)"
    elif bg_grain >= 1.4:
        texture_desc = "moderately textured matte surface"
    else:
        texture_desc = "smooth, uniform work surface"

    mean_luma = float(gray.mean())
    if mean_luma < 65:
        light_desc = "dim indoor lighting"
    elif mean_luma > 190:
        light_desc = "bright lighting"
    else:
        light_desc = "balanced indoor lighting"

    sensor_det = bool(tel.get("detected"))
    hand_det = bool(tel.get("hand_or_tool_detected") or tel.get("hand_detected"))

    objs = []
    if sensor_det:
        objs.append("the cylindrical sensor resting in view")
    if hand_det:
        objs.append("your hand/tool in the frame")
    obj_clause = f" I also see {' and '.join(objs)}." if objs else ""
    summary = (
        f"Yes, looking at the surface underneath, I see a {surface_color} background with a {texture_desc} "
        f"under {light_desc}.{obj_clause}"
    )

    return {
        "has_frame": True,
        "surface_color": surface_color,
        "surface_texture": texture_desc,
        "grain_score": round(bg_grain, 2),
        "lighting": light_desc,
        "mean_luma": round(mean_luma, 1),
        "sensor_visible": sensor_det,
        "hand_visible": hand_det,
        "summary": summary,
    }


def build_natural_conversational_fallback(
    query: str,
    intent_info: dict[str, Any],
    history_msgs: list[dict[str, str]],
    scene_info: dict[str, Any] | None = None,
) -> str:
    """Natural English reply when running without external LLM — NEVER dumps unrequested sensor status."""
    sub = intent_info.get("subintent", "open_chat")
    now_str = datetime.now().strftime("%H:%M")
    date_str = datetime.now().strftime("%Y-%m-%d")

    math_ans = evaluate_simple_math(query)
    if math_ans is not None:
        return f"The result is {math_ans}. Let me know if you need anything else!"

    if sub == "hearing_check":
        return (
            "Yes, I can hear you loud and clear! Ask me anything naturally—whether you want me to manipulate "
            "the 3D Digital Twin, look at what's on the camera, or open a specific section in the datasheet."
        )

    if sub == "time_date":
        return f"It is currently {now_str} ({date_str}). How can I help you?"

    if intent_info.get("intent") == "scene_vision" and scene_info:
        return str(scene_info.get("summary") or "")

    norm = strip_accents_lower(query)
    if _GREETING_OR_META_RE.search(norm):
        return "Hello! I'm right here and ready to assist in English. What would you like me to show on the 3D Digital Twin or inspect?"

    if any(k in norm for k in ("what did i just ask", "talking about", "previous question", "last question")):
        prev_users = [m["content"] for m in history_msgs if m.get("role") == "user"]
        if prev_users:
            last_q = prev_users[-1]
            return f"Right before this, you asked: \"{last_q}\". Would you like to continue on that?"

    return (
        "Got it—let me know what specific detail you'd like to explore, whether it's manipulating the 3D Digital Twin, "
        "checking the live camera scene, or opening an exact section of the datasheet."
    )
