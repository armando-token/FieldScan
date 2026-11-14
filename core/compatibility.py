"""Pure loop-load compatibility engine for the onboard spare-part verifier.

All values come from the OEM documents listed in SOURCES, except the
installation data, which is synthetic and marked as such in every report.
"""

SOURCES = [
    {
        "id": "WIKA-LS10",
        "title": "WIKA LS-10 · product page",
        "section": "Description: 4–20 mA output.",
        "url": "https://www.wika.com/en-en/ls_10.WIKA",
    },
    {
        "id": "EH-TI01524P",
        "title": "Endress+Hauser FMX11 · TI01524P",
        "section": "Page 7, Maximum load: 8 V minimum and 22 mA design current.",
        "url": "https://bdih-download.endress.com/file/5cd7eb8d07ab2acb1a9c262c0519741d/TI01524PEN_0120.pdf#page=7",
    },
    {
        "id": "SIEMENS-SM1231",
        "title": "Siemens SM 1231 AI · 6ES7231-4HD32-0XB0",
        "section": "Article column: 4–20 mA mode, input impedance 270–<290 Ω, nominal range and diagnostics.",
        "url": "https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/analog-signal-modules-sms/sm-1231-analog-input-module-specifications",
    },
]

VOLTAGES = (12, 24)
ADDITIONAL_OHMS = {"v1": 30, "v2": 475}
LEVELS = {"nominal": 0.5, "empty": 0.0, "open": None}
INPUT_OHMS_BOUND = 290
TRANSMITTER_MIN_V = 8
DESIGN_CURRENT_A = 0.022
PLC_NOMINAL_MAX = 27648


def evaluate(voltage, revision, scenario):
    if voltage not in VOLTAGES or revision not in ADDITIONAL_OHMS or scenario not in LEVELS:
        raise ValueError("Use voltage=12|24, revision=v1|v2, scenario=nominal|empty|open.")

    additional = ADDITIONAL_OHMS[revision]
    load = INPUT_OHMS_BOUND + additional
    limit = (voltage - TRANSMITTER_MIN_V) / DESIGN_CURRENT_A
    passes = load <= limit
    level = LEVELS[scenario]

    if scenario == "open":
        circuit, signal, count = "open_circuit", 0.0, None
    elif not passes:
        circuit, signal, count = "outside_load_envelope", None, None
    else:
        signal = 4 + 16 * level
        count = round(level * PLC_NOMINAL_MAX)
        circuit = "empty_tank" if scenario == "empty" else "nominal"

    return {
        "schema_version": 1,
        "rules_version": "loop-load/1",
        "evidence_version": "demo-oem-snapshot/1",
        "demo_mode": "synthetic_installation",
        "reference_device": "WIKA LS-10 (installed variant unconfirmed)",
        "candidate": "Endress+Hauser Waterpilot FMX11",
        "plc_module": "Siemens SM 1231 AI 6ES7231-4HD32-0XB0",
        "inputs": {
            "supply_v": voltage,
            "synthetic_installation_revision": revision,
            "plc_input_upper_bound_ohm": INPUT_OHMS_BOUND,
            "synthetic_additional_series_ohm": additional,
            "scenario": scenario,
        },
        "load_check": {
            "status": "pass" if passes else "fail",
            "formula": "(supply_v - 8 V) / 0.022 A",
            "available_ohm": round(limit, 3),
            "evaluated_ohm": load,
            "margin_ohm": round(limit - load, 3),
            "source_ids": ["EH-TI01524P", "SIEMENS-SM1231"],
        },
        "replacement_status": "insufficient_evidence" if passes else "incompatible_with_profile",
        "simulation": {
            "state": circuit,
            "level_fraction": level,
            "loop_signal_ma": signal,
            "plc_ideal_count": count,
        },
        "pending": [
            "Confirm variants and order codes, range and scaling.",
            "Confirm materials, mounting, actual cable and applicable approvals.",
        ],
        "sources": SOURCES,
    }


def all_reports():
    return {
        f"{voltage}:{revision}:{scenario}": evaluate(voltage, revision, scenario)
        for voltage in VOLTAGES
        for revision in ADDITIONAL_OHMS
        for scenario in LEVELS
    }


SELF_TEST_CASES = [
    (24, "v1", "nominal", "pass", "nominal", 12.0, 13824, 407.273),
    (12, "v1", "nominal", "fail", "outside_load_envelope", None, None, -138.182),
    (24, "v1", "empty", "pass", "empty_tank", 4.0, 0, 407.273),
    (24, "v1", "open", "pass", "open_circuit", 0.0, None, 407.273),
    (24, "v2", "nominal", "fail", "outside_load_envelope", None, None, -37.727),
    (12, "v1", "open", "fail", "open_circuit", 0.0, None, -138.182),
]


def self_test():
    """Run the golden cases. Returns a summary dict or raises AssertionError."""
    results = []
    for voltage, revision, scenario, status, state, signal, count, margin in SELF_TEST_CASES:
        report = evaluate(voltage, revision, scenario)
        load = report["load_check"]
        simulation = report["simulation"]
        actual = (load["status"], simulation["state"], simulation["loop_signal_ma"],
                  simulation["plc_ideal_count"], load["margin_ohm"])
        expected = (status, state, signal, count, margin)
        if actual != expected:
            raise AssertionError((voltage, revision, scenario, actual, expected))
        replacement = "insufficient_evidence" if status == "pass" else "incompatible_with_profile"
        if report["replacement_status"] != replacement or len(report["sources"]) != 3:
            raise AssertionError("Wrong replacement status or sources.")
        results.append({"case": f"{voltage}:{revision}:{scenario}", "status": status, "state": state})
    try:
        evaluate(48, "v1", "nominal")
    except ValueError:
        pass
    else:
        raise AssertionError("A voltage outside the demo was accepted.")
    return {"ok": True, "cases": results, "invalid_input_rejected": True}
