"""Loopback HTTP server: UI, FieldScan tools, compatibility API and optional streaming AI proxy."""

import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from adapters import ai
from core import fieldscan
from core.compatibility import evaluate

WEB_DIR = Path(__file__).resolve().parent.parent / "web"
STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
    "/dist/app.js": ("dist/app.js", "text/javascript; charset=utf-8"),
}
MAX_BODY = 64 * 1024
SESSION = fieldscan.Session()
SESSION_LOCK = threading.Lock()
CSP = (
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; "
    "frame-ancestors 'none'; form-action 'none'"
)


def portable_html():
    """Single self-contained HTML file with CSS, JS bundle and the versioned data bundle inlined."""
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")
    css = (WEB_DIR / "styles.css").read_text(encoding="utf-8")
    js = (WEB_DIR / "dist" / "app.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
    data = json.dumps(fieldscan.bundle(), ensure_ascii=False).replace("<", r"\u003c")
    marker = '<script id="embedded-bundle" type="application/json">'
    replacements = [
        ('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + "\n</style>"),
        ('<script src="dist/app.js" defer></script>', ""),
        (marker + "null", marker + data),
        ("</body>", "<script>\n" + js + "\n</script>\n</body>"),
    ]
    for old, new in replacements:
        if old not in html:
            raise RuntimeError("Template marker missing: " + old)
        html = html.replace(old, new, 1)
    return html


class Handler(BaseHTTPRequestHandler):
    server_version = "IndustrialDatasheet/0.2"

    def log_message(self, fmt, *args):
        pass

    def _headers(self, status, content_type, length=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        if length is not None:
            self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", CSP)
        self.end_headers()

    def respond(self, status, payload, content_type):
        data = payload if isinstance(payload, bytes) else payload.encode("utf-8")
        self._headers(status, content_type, len(data))
        self.wfile.write(data)

    def respond_json(self, status, payload):
        self.respond(status, json.dumps(payload, ensure_ascii=False), "application/json; charset=utf-8")

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path in STATIC:
            name, content_type = STATIC[url.path]
            path = WEB_DIR / name
            if not path.is_file():
                self.respond_json(500, {"error": "Missing asset " + name + ". Run npm run build."})
                return
            self.respond(200, path.read_bytes(), content_type)
            return
        if url.path == "/health":
            self.respond_json(200, {"ok": True})
            return
        if url.path == "/api/ai":
            self.respond_json(200, ai.status())
            return
        if url.path == "/api/bundle":
            self.respond_json(200, fieldscan.bundle())
            return
        if url.path == "/api/tools":
            self.respond_json(200, {"tools": fieldscan.tool_specs()})
            return
        if url.path == "/api/session":
            with SESSION_LOCK:
                self.respond_json(200, {"pins": SESSION.pins(), "identity": SESSION.identity, "events": SESSION.events[-50:],
                                        "bus": SESSION.bus_state()})
            return
        if url.path == "/api/selftest":
            try:
                self.respond_json(200, fieldscan.run_all_self_tests())
            except AssertionError as error:
                self.respond_json(500, {"ok": False, "error": repr(error)})
            return
        if url.path != "/api/check":
            self.respond_json(404, {"error": "Unknown route."})
            return
        try:
            args = parse_qs(url.query, keep_blank_values=True, max_num_fields=3)
            allowed = {"voltage", "revision", "scenario"}
            if any(key not in allowed or len(values) != 1 for key, values in args.items()):
                raise ValueError("Unknown or duplicated parameter.")
            report = evaluate(
                int(args.get("voltage", ["24"])[0]),
                args.get("revision", ["v1"])[0],
                args.get("scenario", ["nominal"])[0],
            )
        except ValueError as error:
            self.respond_json(400, {"error": str(error)})
            return
        self.respond_json(200, report)

    def _body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if not 0 < length <= MAX_BODY:
            raise ValueError("Invalid body size.")
        body = json.loads(self.rfile.read(length))
        if not isinstance(body, dict):
            raise ValueError("Body must be a JSON object.")
        return body

    def do_POST(self):
        path = urlsplit(self.path).path
        if path.startswith("/api/tools/"):
            self._tool(path.removeprefix("/api/tools/"))
            return
        if path != "/api/chat":
            self.respond_json(404, {"error": "Unknown route."})
            return
        try:
            body = self._body()
            question = body["message"]
            if not isinstance(question, str) or not question.strip():
                raise ValueError("Empty message.")
            context = body.get("context") or {}
            history = body.get("history") or []
            if not isinstance(context, dict) or not isinstance(history, list):
                raise ValueError("Invalid context or history.")
        except (ValueError, KeyError, TypeError) as error:
            self.respond_json(400, {"error": str(error)})
            return
        if not ai.config():
            self.respond_json(503, {"error": "AI adapter not configured."})
            return

        self._headers(200, "text/event-stream; charset=utf-8")
        try:
            for delta in ai.stream_chat(question, context, history):
                self._event({"delta": delta})
            self._event({"done": True})
        except ai.AIError as error:
            self._event({"error": str(error)})
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _tool(self, name):
        try:
            args = self._body() if int(self.headers.get("Content-Length", "0")) else {}
            with SESSION_LOCK:
                result = fieldscan.call_tool(SESSION, name, args)
        except (ValueError, TypeError) as error:
            self.respond_json(400, {"error": str(error)})
            return
        self.respond_json(200, result)

    def _event(self, payload):
        self.wfile.write(("data: " + json.dumps(payload, ensure_ascii=False) + "\n\n").encode("utf-8"))
        self.wfile.flush()


def serve(port, open_browser=False):
    with ThreadingHTTPServer(("127.0.0.1", port), Handler) as server:
        url = "http://127.0.0.1:" + str(server.server_port)
        print("Local demo: " + url, flush=True)
        if open_browser:
            threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
