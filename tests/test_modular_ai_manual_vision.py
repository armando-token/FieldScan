"""Anti-Regression Test Suite for 100% English Modular AI, Interactive 3D Digital Twin, Scene Vision & Manual Auto-Open."""

from __future__ import annotations

import cv2
from fastapi.testclient import TestClient
import numpy as np

from fieldscan.manual_navigator import detect_query_language, lookup_manual_for_query
from fieldscan.scene_and_chat_router import (
    analyze_scene_environment,
    classify_conversation_intent,
)
from fieldscan.server import app
from fieldscan.twin_controller import resolve_twin_action


def _make_textured_carpet_with_sensor_jpeg(include_sensor: bool = True) -> bytes:
    """Synthesize a realistic textured beige/brown woven carpet with optional TZ THT-02 cylinder."""
    rng = np.random.default_rng(42)
    h, w = 540, 960
    base = np.zeros((h, w, 3), dtype=np.int16)
    base[:, :, 0] = 108  # B
    base[:, :, 1] = 136  # G
    base[:, :, 2] = 164  # R
    grain = rng.integers(-28, 29, size=(h, w, 1), dtype=np.int16)
    weave_x = ((np.arange(w) % 3 == 0).astype(np.int16) * 14)[None, :, None]
    carpet = np.clip(base + grain + weave_x, 0, 255).astype(np.uint8)

    if include_sensor:
        cv2.rectangle(carpet, (180, 175), (560, 223), (218, 222, 226), -1)
        cv2.rectangle(carpet, (180, 183), (560, 193), (244, 246, 248), -1)
        cv2.rectangle(carpet, (355, 180), (435, 218), (168, 92, 16), -1)
        cv2.rectangle(carpet, (366, 187), (424, 211), (35, 32, 165), -1)
        for i in range(8):
            px = 370 + i * 6
            cv2.rectangle(carpet, (px, 189), (px + 3, 196), (248, 248, 248), -1)

    ok, enc = cv2.imencode(".jpg", carpet, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    assert ok is True
    return enc.tobytes()


def test_english_intent_router_never_confuses_chat_scene_manual_and_sensor() -> None:
    # 1. English hearing check -> general_chat (NEVER sensor_diagnostics)
    c1 = classify_conversation_intent("Can you hear me?")
    assert c1["intent"] == "general_chat"
    assert c1["subintent"] == "hearing_check"
    assert c1["language"] == "en"

    # 2. Scene / carpet question mentioning sensor as spatial anchor -> scene_vision!
    c2 = classify_conversation_intent("Can you see what is on the carpet under the sensor?")
    assert c2["intent"] == "scene_vision"
    assert c2["language"] == "en"

    # 3. Datasheet calibration location -> manual_lookup!
    c3 = classify_conversation_intent("Where in the datasheet is the calibration section located?")
    assert c3["intent"] == "manual_lookup"
    assert c3["language"] == "en"

    # 4. Interactive 3D Digital Twin query -> sensor_diagnostics!
    c4 = classify_conversation_intent("Show me how to configure the pins for Slave 3")
    assert c4["intent"] == "sensor_diagnostics"
    assert c4["language"] == "en"

    # 5. Fault query with manual reference -> sensor_diagnostics (preserves fault highlighting)
    c5 = classify_conversation_intent("There is a red fault patch on the strainer tip, what is failing according to the manual?")
    assert c5["intent"] == "sensor_diagnostics"
    assert c5["language"] == "en"


def test_manual_navigator_calibration_and_all_sections_english() -> None:
    assert detect_query_language("Where is calibration in the manual?") == "en"

    cal = lookup_manual_for_query("Where in the datasheet is the calibration section?")
    assert cal["matched"] is True
    assert cal["language"] == "en"
    assert cal["open_manual"] is True
    assert cal["open_manual_lightbox"] is True
    assert cal["manual_page"] == 3
    assert cal["manual_section"]["section_id"] == "3.1"
    assert "Page 3" in cal["answer"]
    assert "0.3" in cal["answer"]
    assert "0x0005" in cal["answer"]
    assert len(cal["citations"]) >= 2

    wire = lookup_manual_for_query("Show me the wiring colors in the manual")
    assert wire["open_manual"] is True
    assert wire["open_manual_lightbox"] is True
    assert wire["manual_page"] == 4
    assert wire["manual_section"]["section_id"] == "4.1"

    p7 = lookup_manual_for_query("Open page 7 of the manual")
    assert p7["open_manual"] is True
    assert p7["open_manual_lightbox"] is True
    assert p7["manual_page"] == 7


def test_interactive_3d_digital_twin_controller_actions() -> None:
    # 1. DIP-8 pin configuration for Slave #3 -> explode PCB + open Macro PiP + set bits [0,0,0,0,0,0,1,1]
    dip_act = resolve_twin_action("Show me how to configure the pins for Slave 3", current_dip_address=1)
    assert dip_act is not None
    assert dip_act["action"] == "configure_dip"
    assert dip_act["focus_zone"] == "upper_barrel_dip"
    assert dip_act["explode_pcb"] is True
    assert dip_act["open_dip_pip"] is True
    assert dip_act["target_slave_id"] == 3
    assert dip_act["dip_bits"] == [0, 0, 0, 0, 0, 0, 1, 1]

    # 2. Rear cable connection -> orbit 3D camera to waterproof_gland_leads
    gland_act = resolve_twin_action("Show me at the back how the cable connects")
    assert gland_act is not None
    assert gland_act["focus_zone"] == "waterproof_gland_leads"
    assert gland_act["camera_pose"] == "rear_wiring"
    assert "Red" in gland_act["callout_body"] and "Yellow" in gland_act["callout_body"]

    # 3. Main SHT30 probe tip -> orbit 3D camera to strainer_head
    tip_act = resolve_twin_action("I want to see the main sensor probe and how it is placed")
    assert tip_act is not None
    assert tip_act["focus_zone"] == "strainer_head"
    assert tip_act["camera_pose"] == "tip_closeup"

    # 4. Mounting flange -> orbit 3D camera to mounting_flange
    flange_act = resolve_twin_action("Show me how the mounting bracket attaches to the wall")
    assert flange_act is not None
    assert flange_act["focus_zone"] == "mounting_flange"

    # 5. X-ray wireframe & reset housing
    xray_act = resolve_twin_action("Switch to X-ray wireframe view")
    assert xray_act is not None
    assert xray_act["render_mode"] == "wireframe"

    close_act = resolve_twin_action("Close the housing and reset view")
    assert close_act is not None
    assert close_act["action"] == "reset_view"
    assert close_act["explode_pcb"] is False


def test_scene_environment_and_api_end_to_end_with_twin_actions() -> None:
    carpet_jpg = _make_textured_carpet_with_sensor_jpeg(include_sensor=True)
    scene = analyze_scene_environment(carpet_jpg, {"detected": True, "bbox": [175, 170, 390, 60]}, lang="en")
    assert scene["has_frame"] is True
    assert "carpet" in scene["surface_texture"] or scene["grain_score"] >= 5.0

    with TestClient(app) as client:
        r_push = client.post("/api/video/ipad_frame", content=carpet_jpg, headers={"Content-Type": "image/jpeg"})
        assert r_push.status_code == 200
        v_tel = r_push.json()["vision"]
        assert v_tel["detected"] is True
        assert v_tel["pcb_open_detected"] is True

        # A. Hearing check must NOT dump sensor status or flip manual page
        r_hear = client.post("/api/diagnose", json={"query": "Can you hear me?"})
        assert r_hear.status_code == 200
        j_hear = r_hear.json()
        assert j_hear["intent"] == "general_chat"
        assert j_hear["language"] == "en"
        assert j_hear["open_manual"] is False
        assert j_hear["manual_page"] is None
        assert "0x7fff" not in j_hear["assistant_message"].lower()

        # B. Interactive 3D Twin DIP-8 manipulation via /api/diagnose
        r_dip = client.post(
            "/api/diagnose",
            json={"query": "Show me how to configure the pins for Slave 3"},
        )
        assert r_dip.status_code == 200
        j_dip = r_dip.json()
        assert j_dip["language"] == "en"
        assert j_dip["explode_pcb"] is True
        assert j_dip["dip_bits"] == [0, 0, 0, 0, 0, 0, 1, 1]
        assert j_dip["twin_action"]["focus_zone"] == "upper_barrel_dip"
        assert j_dip["twin_action"]["open_dip_pip"] is True

        # C. Interactive 3D Twin rear cable manipulation via /api/diagnose
        r_rear = client.post(
            "/api/diagnose",
            json={"query": "Show me at the back how the cable is connected"},
        )
        assert r_rear.status_code == 200
        j_rear = r_rear.json()
        assert j_rear["twin_action"]["focus_zone"] == "waterproof_gland_leads"
        assert j_rear["twin_action"]["explode_pcb"] is False

        # D. Calibration datasheet lookup auto-opens manual at Page 3 Section 3.1 (zero regression!)
        r_cal = client.post(
            "/api/diagnose",
            json={"query": "Where in the datasheet is the calibration section located?"},
        )
        assert r_cal.status_code == 200
        j_cal = r_cal.json()
        assert j_cal["intent"] == "manual_lookup"
        assert j_cal["open_manual"] is True
        assert j_cal["open_manual_lightbox"] is True
        assert j_cal["manual_page"] == 3
        assert j_cal["manual_section"]["section_id"] == "3.1"
