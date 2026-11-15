import io
import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

from core import fieldscan, modbus
from edge import mcp_stdio, server


class ModbusTests(unittest.TestCase):
    def test_golden_frames(self):
        self.assertEqual(modbus.hexstr(modbus.read_request(1)), "01 03 00 00 00 02 C4 0B")
        self.assertEqual(modbus.hexstr(modbus.read_request(1, 0, 8)), "01 03 00 00 00 08 44 0C")
        reply = modbus.Tht02Model(modbus.address_to_dip(1)).transact(modbus.read_request(1))
        self.assertEqual(modbus.hexstr(reply), "01 03 04 00 EA 02 42 5A 96")

    def test_dip_weights(self):
        self.assertEqual(modbus.dip_to_address([0, 0, 0, 0, 0, 0, 1, 0]), 2)
        self.assertEqual(modbus.address_to_dip(1), [0, 0, 0, 0, 0, 0, 0, 1])
        with self.assertRaises(ValueError):
            modbus.dip_to_address([0, 1])

    def test_address_mismatch_times_out(self):
        model = modbus.Tht02Model(modbus.address_to_dip(2))
        self.assertIsNone(model.transact(modbus.read_request(1)))
        self.assertEqual(modbus.decode_read(None, 1)["status"], "timeout")

    def test_bad_request_crc_is_ignored(self):
        frame = bytearray(modbus.read_request(1))
        frame[-1] ^= 0xFF
        self.assertIsNone(modbus.Tht02Model(modbus.address_to_dip(1)).transact(bytes(frame)))


class SessionTests(unittest.TestCase):
    def setUp(self):
        self.session = fieldscan.Session()

    def confirm(self):
        self.session.capture_frame()
        return self.session.confirm_asset("THT-02", confirmed=True)

    def test_tools_require_identity(self):
        with self.assertRaises(fieldscan.ToolError):
            self.session.get_asset_status()

    def test_incident_diagnosis_and_fix(self):
        self.assertEqual(self.confirm()["status"], "confirmed")
        status = self.session.get_asset_status()
        self.assertIsNone(status["reading"])
        self.assertEqual(status["transaction"]["decode"]["status"], "timeout")
        fixed = self.session.simulate_fault("dip_fix")
        self.assertEqual(fixed["after"]["decode"]["values"], self.session.get_asset_status()["reading"])
        self.assertEqual(self.session.bus_state()["device_address"], 1)

    def test_sensor_fault_is_not_a_reading(self):
        self.confirm()
        self.session.simulate_fault("dip_fix")
        result = self.session.simulate_fault("sensor_fault")
        self.assertFalse(result["after"]["decode"]["valid"])

    def test_unknown_model_and_versions_are_insufficient_evidence(self):
        self.assertEqual(self.session.confirm_asset("XYZ-9")["status"], "insufficient_evidence")
        self.confirm()
        self.assertEqual(self.session.get_document(catalog_version="old")["status"], "insufficient_evidence")
        self.assertEqual(self.session.check_replacement(rules_version="old")["status"], "insufficient_evidence")

    def test_manual_section_keeps_validity(self):
        self.confirm()
        doc = self.session.get_document(section="6.4")
        self.assertEqual(doc["document"]["validity"], "to_confirm")
        self.assertIn("6.4", doc["sections"])

    def test_uvc_and_bench_are_not_faked(self):
        with self.assertRaises(fieldscan.ToolError):
            self.session.capture_frame("uvc")
        self.confirm()
        self.assertEqual(self.session.get_asset_status("rtu_bench")["source"], "no_evidence")

    def test_event_ids_are_sequential(self):
        self.confirm()
        self.assertEqual([e["event_id"] for e in self.session.events], ["EV-0001", "EV-0002"])

    def test_self_tests_pass(self):
        self.assertTrue(fieldscan.run_all_self_tests()["ok"])


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        server.SESSION = fieldscan.Session()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def request(self, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    def test_bundle_and_session(self):
        status, bundle = self.request("/api/bundle")
        self.assertEqual(status, 200)
        self.assertIn("catalog_version", json.dumps(bundle))
        status, session = self.request("/api/session")
        self.assertEqual(status, 200)
        self.assertIn("bus", session)

    def test_tool_call_and_bad_args(self):
        self.assertEqual(self.request("/api/tools/capture_frame", {})[0], 200)
        self.assertEqual(self.request("/api/tools/capture_frame", {"source": "bogus"})[0], 400)
        self.assertEqual(self.request("/api/tools/nope", {})[0], 400)

    def test_media_and_link_validation(self):
        self.assertEqual(self.request("/api/vision", {"image": "http://x/y.png"})[0], 400)
        self.assertEqual(self.request("/api/vision", {"image": "data:image/jpeg;base64,AAAA", "question": 3})[0], 400)
        self.assertEqual(self.request("/api/asr", {"audio": "not base64!"})[0], 400)
        self.assertEqual(self.request("/api/asr", {})[0], 400)
        self.assertEqual(self.request("/api/chat", {"message": "hi", "link": "satellite"})[0], 400)

    def test_offline_link_never_uses_cloud(self):
        from adapters import ai
        saved = ai.cloud_config, ai.local_config
        try:
            ai.cloud_config = lambda: {"model": "cloud-x", "local": False}
            ai.local_config = lambda: None
            self.assertIsNone(ai.config("offline"))
            self.assertEqual(ai.config("online")["model"], "cloud-x")
        finally:
            ai.cloud_config, ai.local_config = saved

    def test_portable_html_is_self_contained(self):
        html = server.portable_html()
        self.assertNotIn('src="dist/app.js"', html)
        self.assertNotIn('<script id="embedded-bundle" type="application/json">null', html)


class McpTests(unittest.TestCase):
    def test_stdio_round_trip(self):
        messages = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_asset_status", "arguments": {}}},
        ]
        out = io.StringIO()
        mcp_stdio.serve(io.StringIO("\n".join(json.dumps(m) for m in messages) + "\n"), out)
        replies = [json.loads(line) for line in out.getvalue().splitlines()]
        self.assertEqual([r["id"] for r in replies], [1, 2, 3])
        self.assertEqual(len(replies[1]["result"]["tools"]), 6)
        self.assertTrue(replies[2]["result"]["isError"])


if __name__ == "__main__":
    unittest.main()
