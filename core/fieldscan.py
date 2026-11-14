"""FieldScan session core: catalog, evidence and the six tool contracts.

One session per asset. Every answer is pinned to asset_id, product_id,
catalog_version, rules_version and an event_id. The `source` field
always says whether a value is observed, simulated or documented.
"""

import itertools
from datetime import datetime, timezone

from core import compatibility, modbus

CATALOG_VERSION = "demo-catalog/2026-11-14.1"
DIAG_RULES_VERSION = "modbus-diag/1"
LOOP_RULES_VERSION = "loop-load/1"

PRODUCTS = {
    "tzone-tht-02": {
        "product_id": "tzone-tht-02",
        "manufacturer": "Tzone (TZ)",
        "model": "TZ THT-02",
        "kind": "RS-485 Modbus RTU temperature and humidity sensor",
        "aliases": ["TZ THT-02", "THT-02", "THT02", "THT 02"],
        "interface": "RS-485 · Modbus RTU · default 9600 8N1 · DIP-8 address",
        "document_ids": ["TZ-THT02-UM-V1.0"],
        "variant_fields": ["Order variant", "Factory preset address", "Factory preset baud rate", "Lead length"],
    },
    "eh-fmx11": {
        "product_id": "eh-fmx11",
        "manufacturer": "Endress+Hauser",
        "model": "Waterpilot FMX11",
        "kind": "Hydrostatic level probe · 2-wire 4–20 mA",
        "aliases": ["FMX11", "Waterpilot FMX11"],
        "interface": "4–20 mA, 2-wire",
        "document_ids": ["EH-TI01524P"],
        "variant_fields": ["Order code", "Measuring range", "Cable length"],
    },
    "wika-ls10": {
        "product_id": "wika-ls10",
        "manufacturer": "WIKA",
        "model": "LS-10",
        "kind": "Submersible level transmitter · 4–20 mA",
        "aliases": ["LS-10", "WIKA LS-10"],
        "interface": "4–20 mA",
        "document_ids": ["WIKA-LS10"],
        "variant_fields": ["Installed variant", "Measuring range"],
    },
    "siemens-sm1231": {
        "product_id": "siemens-sm1231",
        "manufacturer": "Siemens",
        "model": "SM 1231 AI 6ES7231-4HD32-0XB0",
        "kind": "S7-1200 analog input module",
        "aliases": ["SM 1231", "6ES7231-4HD32-0XB0"],
        "interface": "4 analog inputs · 4–20 mA mode",
        "document_ids": ["SIEMENS-SM1231"],
        "variant_fields": [],
    },
}

THT02_MANUAL = {
    "id": "TZ-THT02-UM-V1.0",
    "product_id": "tzone-tht-02",
    "type": "user_manual",
    "title": "TZ THT-02 Temperature and humidity Sensor User's Manual",
    "edition": "V1.0",
    "date": "2021-03-18",
    "origin": "Manufacturer document hosted by a third party (Global Sources)",
    "url": "https://p.globalsources.com/IMAGES/PDT/SPEC/387/K1195613387.pdf",
    "validity": "to_confirm",
    "validity_note": "Current edition not verified against the manufacturer. The FieldScan knowledge base "
                     "references a V1.1 copy; editions are not reconciled. Correspondence with the physical "
                     "unit is not checked.",
    "sections": {
        "4.6": {"title": "Lead description", "page": 4,
                "excerpt": "Green B− · Yellow A+ · Black GND · Red V+ (DC power positive)."},
        "5": {"title": "DIP switch and address code", "page": 4,
              "excerpt": "The DIP switch has 8 positions. Positions 1 to 8 are worth 128, 64, 32, 16, 8, 4, 2 and 1; "
                         "the values of the switches set to ON are added to form the address code "
                         "(example: 1, 3 and 4 ON → 128 + 32 + 16 = 176)."},
        "6.1": {"title": "Data frame format", "page": 5,
                "excerpt": "Default format: 1 start bit, 8 data bits, no parity, 1 stop bit."},
        "6.4": {"title": "Register definition", "page": 6,
                "excerpt": "Register 0 temperature and register 1 relative humidity, unit 0.1, MSB first, two's "
                           "complement; 7FFF H means the sensor is abnormal. Register 4 is the address code set by "
                           "the DIP switch; register 5 the baud rate (4800, 9600, 19200)."},
        "6.7": {"title": "Host reads sensor information (function code 03)", "page": 7,
                "excerpt": "Request 01 03 00 00 00 08 44 0C; the reply carries 16 data bytes "
                           "(00FA H = 25.0 °C, 0258 H = 60.0 %RH) and ends with CRC D4 64."},
        "6.9": {"title": "Abnormal response", "page": 8,
                "excerpt": "On error the sensor sets the highest bit of the function code and returns an error "
                           "code: 01 illegal function, 02 illegal data address, 03 illegal data value."},
        "6.10": {"title": "CRC check code", "page": 9,
                 "excerpt": "CRC-16 preset FFFF, polynomial A001, two bytes. If the check code is wrong the "
                            "sensor ignores the request and does not respond."},
    },
}


def _compat_documents():
    product_of = {"WIKA-LS10": "wika-ls10", "EH-TI01524P": "eh-fmx11", "SIEMENS-SM1231": "siemens-sm1231"}
    docs = {}
    for src in compatibility.SOURCES:
        docs[src["id"]] = {
            "id": src["id"], "product_id": product_of[src["id"]],
            "type": "product_page" if src["id"] == "WIKA-LS10" else "datasheet",
            "title": src["title"], "edition": None, "date": None,
            "origin": "Manufacturer", "url": src["url"], "validity": "to_confirm",
            "validity_note": "Preloaded snapshot; edition and date not pinned in this demo.",
            "sections": {"cited": {"title": "Cited passage", "page": None, "excerpt": src["section"]}},
        }
    return docs


DOCUMENTS = {THT02_MANUAL["id"]: THT02_MANUAL, **_compat_documents()}

ASSETS = {
    "BOAT-ER-TH-02": {
        "asset_id": "BOAT-ER-TH-02",
        "location": "Engine room · electrical bulkhead frame 42",
        "role": "Ambient temperature and humidity for switchboard ventilation",
        "bus": "RS-485 segment B · master polls address 1 · 9600 8N1",
        "expected_product": "tzone-tht-02",
        "synthetic": True,
        "plate_lines": ["TZ THT-02", "TEMPERATURE & HUMIDITY SENSOR", "RS485 · MODBUS-RTU", "DC 5–24 V",
                        "S/N SYN-2411-0042", "SYNTHETIC PLATE · DEMO"],
    },
    "BOAT-T03-LT301": {
        "asset_id": "BOAT-T03-LT301",
        "location": "Freshwater tank T-03",
        "role": "Level loop LT-301 · 4–20 mA into SM 1231 AI0",
        "bus": "4–20 mA loop",
        "expected_product": "wika-ls10",
        "synthetic": True,
        "plate_lines": [],
    },
}

INCIDENT = {"master_address": 1, "device_address": 2, "temperature_c": 23.4, "humidity_rh": 57.8}


class ToolError(ValueError):
    pass


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _find_product(model):
    key = " ".join(str(model).upper().replace("-", " ").split())
    for product in PRODUCTS.values():
        names = [product["model"], *product["aliases"]]
        if any(" ".join(n.upper().replace("-", " ").split()) == key for n in names):
            return product
    return None


class Session:
    """One inspection session for one asset. Not thread-safe; the server serialises calls."""

    def __init__(self):
        self._ids = itertools.count(1)
        self.events = []
        self.identity = None
        self.reset_case()

    # ---------------------------------------------------------------- bookkeeping

    def _event(self, tool, summary, source):
        event = {"event_id": f"EV-{next(self._ids):04d}", "at": _now(), "tool": tool, "summary": summary, "source": source}
        self.events.append(event)
        return event["event_id"]

    def pins(self):
        return {
            "asset_id": self.identity["asset_id"] if self.identity else None,
            "product_id": self.identity["product_id"] if self.identity else None,
            "catalog_version": CATALOG_VERSION,
            "rules_version": {"diagnosis": DIAG_RULES_VERSION, "loop": LOOP_RULES_VERSION},
            "last_event_id": self.events[-1]["event_id"] if self.events else None,
            "source_status": {doc_id: doc["validity"] for doc_id, doc in DOCUMENTS.items()},
        }

    def reset_case(self):
        self.master_address = INCIDENT["master_address"]
        self.model = modbus.Tht02Model(modbus.address_to_dip(INCIDENT["device_address"]),
                                       INCIDENT["temperature_c"], INCIDENT["humidity_rh"])

    def bus_state(self):
        """Simulated bus configuration, for display only (not evidence)."""
        return {"source": "simulated", "master_address": self.master_address,
                "device_address": self.model.address, "dip_bits": list(self.model.dip_bits)}

    def _require_identity(self):
        if not self.identity:
            raise ToolError("No confirmed asset in this session. Run capture_frame and confirm_asset first.")

    # ---------------------------------------------------------------- tools

    def capture_frame(self, source="simulated"):
        if source == "uvc":
            raise ToolError("UVC capture is not integrated in this build (planned: FieldScan camera adapter).")
        if source != "simulated":
            raise ToolError("source must be 'simulated' or 'uvc'.")
        asset = ASSETS["BOAT-ER-TH-02"]
        event_id = self._event("capture_frame", "Simulated frame of the engine-room bulkhead", "simulated")
        return {"frame_id": f"FRAME-{event_id}", "source": "simulated", "kind": "html_scene", "captured_at": _now(),
                "plate_text": asset["plate_lines"], "asset_hint": asset["asset_id"], "event_id": event_id}

    def confirm_asset(self, model, variant=None, id_source="plate_simulated", confirmed=False, asset_id="BOAT-ER-TH-02"):
        product = _find_product(model)
        asset = ASSETS.get(asset_id)
        if not asset:
            raise ToolError("Unknown asset_id.")
        if not product:
            event_id = self._event("confirm_asset", f"Model '{model}' not in catalog", "documented")
            return {"status": "insufficient_evidence", "missing": f"Model '{model}' is not in catalog {CATALOG_VERSION}.",
                    "event_id": event_id}
        if product["product_id"] != asset["expected_product"]:
            event_id = self._event("confirm_asset", "Model does not match the installed asset record", "documented")
            return {"status": "insufficient_evidence",
                    "missing": f"{product['model']} does not match the record for {asset_id}. Confirm the asset.",
                    "event_id": event_id}
        pending = [f for f in product["variant_fields"] if not (variant and f == "Order variant")]
        self.identity = {
            "asset_id": asset_id, "product_id": product["product_id"], "model": product["model"],
            "variant": variant, "id_source": id_source, "confirmed": bool(confirmed),
            "status": "confirmed" if confirmed else "needs_confirmation", "pending_fields": pending,
        }
        event_id = self._event("confirm_asset", f"{product['model']} · {self.identity['status']}", "observed" if id_source == "uvc" else "simulated")
        return {**self.identity, "event_id": event_id, "pins": self.pins()}

    def get_document(self, product_id=None, doc_type="user_manual", catalog_version=None, section=None):
        if catalog_version and catalog_version != CATALOG_VERSION:
            event_id = self._event("get_document", "Catalog version mismatch", "documented")
            return {"status": "insufficient_evidence",
                    "missing": f"Catalog {catalog_version} requested; this package holds {CATALOG_VERSION}.",
                    "event_id": event_id}
        if product_id is None:
            self._require_identity()
            product_id = self.identity["product_id"]
        product = PRODUCTS.get(product_id)
        if not product:
            raise ToolError("Unknown product_id.")
        docs = [DOCUMENTS[d] for d in product["document_ids"] if DOCUMENTS[d]["type"] == doc_type]
        if not docs:
            event_id = self._event("get_document", f"No {doc_type} for {product_id}", "documented")
            return {"status": "insufficient_evidence", "missing": f"No {doc_type} in the package for {product['model']}.",
                    "event_id": event_id}
        doc = docs[0]
        if section is not None and section not in doc["sections"]:
            raise ToolError(f"Section {section} is not in {doc['id']}.")
        event_id = self._event("get_document", f"{doc['id']} § {section or 'all'}", "documented")
        meta = {k: doc[k] for k in ("id", "title", "edition", "date", "origin", "url", "validity", "validity_note")}
        return {"status": "ok", "source": "documented", "document": meta,
                "sections": {section: doc["sections"][section]} if section else doc["sections"], "event_id": event_id}

    def get_asset_status(self, transport="simulated_rtu", injection="none"):
        self._require_identity()
        if transport == "rtu_bench":
            event_id = self._event("get_asset_status", "Bench reader not connected", "observed")
            return {"source": "no_evidence", "reading": None, "detail": "No bench RS-485 reader in this build.", "event_id": event_id}
        if transport != "simulated_rtu":
            raise ToolError("transport must be 'simulated_rtu' or 'rtu_bench'.")
        tx = modbus.poll(self.master_address, self.model, injection)
        event_id = self._event("get_asset_status", f"Poll addr {self.master_address}: {tx['decode']['status']}", "simulated")
        return {"source": "simulated", "reading": tx["decode"]["values"], "transaction": tx, "event_id": event_id}

    def simulate_fault(self, scenario="address_mismatch", dip_bits=None):
        self._require_identity()
        before = modbus.poll(self.master_address, self.model)
        if scenario == "reset" or scenario == "address_mismatch":
            self.reset_case()
            action = f"Incident restored: master polls {self.master_address}, DIP set to {self.model.address}."
        elif scenario == "dip_fix":
            self.model.dip_bits = modbus.address_to_dip(self.master_address)
            action = f"DIP set to {self.master_address} (switch 8 ON, others OFF) inside the simulation."
        elif scenario == "set_dip":
            bits = list(dip_bits or [])
            address = modbus.dip_to_address(bits)
            self.model.dip_bits = bits
            action = f"DIP set to address {address} inside the simulation."
        elif scenario in ("bad_crc", "foreign_address", "sensor_fault"):
            after = modbus.poll(self.master_address, self.model, scenario)
            event_id = self._event("simulate_fault", f"Injected {scenario}: {after['decode']['status']}", "simulated")
            return {"source": "simulated", "scenario": scenario, "before": before, "action": f"One reply with {scenario}.",
                    "after": after, "event_id": event_id}
        else:
            raise ToolError("scenario must be address_mismatch, dip_fix, set_dip, bad_crc, foreign_address, sensor_fault or reset.")
        after = modbus.poll(self.master_address, self.model)
        event_id = self._event("simulate_fault", action, "simulated")
        return {"source": "simulated", "scenario": scenario, "before": before, "action": action, "after": after, "event_id": event_id}

    def check_replacement(self, candidate="eh-fmx11", voltage=24, revision="v1", scenario="nominal", rules_version=LOOP_RULES_VERSION):
        if rules_version != LOOP_RULES_VERSION:
            event_id = self._event("check_replacement", "Rules version mismatch", "documented")
            return {"status": "insufficient_evidence",
                    "missing": f"Rules {rules_version} requested; the engine runs {LOOP_RULES_VERSION}.", "event_id": event_id}
        if candidate != "eh-fmx11":
            event_id = self._event("check_replacement", f"No profile for {candidate}", "documented")
            return {"status": "insufficient_evidence", "missing": f"No evaluated profile for candidate {candidate}.", "event_id": event_id}
        report = compatibility.evaluate(int(voltage), revision, scenario)
        load = report["load_check"]
        criteria = [
            {"criterion": "signal_type", "status": "pass", "detail": "Reference and candidate are 4–20 mA.",
             "source_ids": ["WIKA-LS10", "EH-TI01524P"]},
            {"criterion": "loop_load", "status": load["status"], "margin_ohm": load["margin_ohm"],
             "detail": f"{load['evaluated_ohm']} Ω evaluated vs {load['available_ohm']} Ω available at {voltage} V.",
             "source_ids": load["source_ids"]},
            {"criterion": "range_and_scaling", "status": "pending", "detail": "Order codes, range and scaling not confirmed.", "source_ids": []},
            {"criterion": "materials_mounting_approvals", "status": "pending", "detail": "Materials, mounting, cable and approvals not confirmed.", "source_ids": []},
        ]
        event_id = self._event("check_replacement", f"FMX11 at {voltage} V/{revision}: {report['replacement_status']}", "documented")
        return {"status": report["replacement_status"], "candidate": candidate, "criteria": criteria,
                "rules_version": LOOP_RULES_VERSION, "report": report, "event_id": event_id}


TOOLS = {
    "capture_frame": ("Capture a frame from the FieldScan camera (simulated scene or UVC).",
                      {"source": {"type": "string", "enum": ["simulated", "uvc"]}}),
    "confirm_asset": ("Pin the asset identity: model, variant, identification source and technician confirmation.",
                      {"model": {"type": "string"}, "variant": {"type": "string"}, "id_source": {"type": "string"},
                       "confirmed": {"type": "boolean"}, "asset_id": {"type": "string"}}),
    "get_document": ("Return the applicable document, edition, date, URL, section and validity status.",
                     {"product_id": {"type": "string"}, "doc_type": {"type": "string"}, "catalog_version": {"type": "string"},
                      "section": {"type": "string"}}),
    "get_asset_status": ("Read the asset over the selected transport; says whether the value is measured, simulated or missing.",
                         {"transport": {"type": "string", "enum": ["simulated_rtu", "rtu_bench"]},
                          "injection": {"type": "string", "enum": list(modbus.INJECTIONS)}}),
    "simulate_fault": ("Run a scenario on the behaviour model and return before, action and after evidence.",
                       {"scenario": {"type": "string", "enum": ["address_mismatch", "dip_fix", "set_dip", "bad_crc",
                                                                "foreign_address", "sensor_fault", "reset"]},
                        "dip_bits": {"type": "array", "items": {"type": "integer"}}}),
    "check_replacement": ("Per-criterion replacement verdict for a candidate in a given installation.",
                          {"candidate": {"type": "string"}, "voltage": {"type": "integer", "enum": [12, 24]},
                           "revision": {"type": "string", "enum": ["v1", "v2"]},
                           "scenario": {"type": "string", "enum": ["nominal", "empty", "open"]},
                           "rules_version": {"type": "string"}}),
}


def tool_specs():
    return [{"name": name, "description": desc, "inputSchema": {"type": "object", "properties": props, "additionalProperties": False}}
            for name, (desc, props) in TOOLS.items()]


def call_tool(session, name, args):
    if name not in TOOLS:
        raise ToolError(f"Unknown tool {name}.")
    if not isinstance(args, dict) or any(k not in TOOLS[name][1] for k in args):
        raise ToolError(f"Unexpected arguments for {name}.")
    return getattr(session, name)(**args)


def bundle():
    """Everything the offline browser build needs, versioned."""
    return {
        "catalog_version": CATALOG_VERSION,
        "rules_versions": {"diagnosis": DIAG_RULES_VERSION, "loop": LOOP_RULES_VERSION},
        "products": PRODUCTS,
        "documents": DOCUMENTS,
        "assets": ASSETS,
        "incident": INCIDENT,
        "golden": modbus.golden_vectors(),
        "reports": compatibility.all_reports(),
    }


def self_test():
    s = Session()
    try:
        s.get_asset_status()
    except ToolError:
        pass
    else:
        raise AssertionError("Status read without a confirmed asset.")
    frame = s.capture_frame()
    assert frame["source"] == "simulated"
    ident = s.confirm_asset(frame["plate_text"][0], confirmed=True)
    assert ident["product_id"] == "tzone-tht-02" and ident["pins"]["catalog_version"] == CATALOG_VERSION
    assert s.confirm_asset("Unknown 9000")["status"] == "insufficient_evidence"
    s.confirm_asset("THT-02", confirmed=True)
    doc = s.get_document(section="5")
    assert doc["document"]["edition"] == "V1.0" and doc["document"]["validity"] == "to_confirm"
    assert s.get_document(catalog_version="demo-catalog/old")["status"] == "insufficient_evidence"
    assert s.get_asset_status()["transaction"]["decode"]["status"] == "timeout"
    fix = s.simulate_fault("dip_fix")
    assert fix["before"]["decode"]["status"] == "timeout"
    assert fix["after"]["decode"]["values"] == {"temperature_c": 23.4, "humidity_rh": 57.8}
    for bad in ("bad_crc", "foreign_address", "sensor_fault"):
        assert s.simulate_fault(bad)["after"]["decode"]["values"] is None, bad
    assert s.get_asset_status(transport="rtu_bench")["source"] == "no_evidence"
    assert s.check_replacement(voltage=24)["status"] == "insufficient_evidence"
    assert s.check_replacement(voltage=12)["status"] == "incompatible_with_profile"
    assert s.check_replacement(rules_version="loop-load/0")["status"] == "insufficient_evidence"
    s.simulate_fault("reset")
    assert s.get_asset_status()["transaction"]["decode"]["status"] == "timeout"
    ids = [e["event_id"] for e in s.events]
    assert len(ids) == len(set(ids))
    return {"ok": True, "cases": ["identity required", "plate → THT-02", "unknown model", "manual V1.0 § 5",
                                  "catalog mismatch", "incident timeout", "DIP fix → 23.4 °C / 57.8 %RH",
                                  "injected faults rejected", "bench = no evidence", "12 V incompatible",
                                  "rules mismatch", "reset", "unique event ids"]}


def run_all_self_tests():
    loop = compatibility.self_test()
    rtu = modbus.self_test()
    flow = self_test()
    return {"ok": True, "loop": loop, "modbus": rtu, "session": flow,
            "total": len(loop["cases"]) + len(rtu["cases"]) + len(flow["cases"])}
