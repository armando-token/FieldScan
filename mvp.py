"""Industrial Datasheet + FieldScan · CLI entry point.

    python3 mvp.py --self-test
    python3 mvp.py --port 8765 --open
    python3 mvp.py --html FIELD_SCAN_DEMO.html --open
    python3 mvp.py --tool simulate_fault --args '{"scenario": "dip_fix"}'
    python3 mvp.py --mcp
"""

import argparse
import json
import sys
import webbrowser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from core import fieldscan  # noqa: E402
from edge.server import portable_html, serve  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="FieldScan diagnosis and spare-part verifier with 3D digital twins.")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--html", type=Path, help="Write a self-contained offline HTML file (e.g. FIELD_SCAN_DEMO.html).")
    parser.add_argument("--open", action="store_true", help="Open the local browser.")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--tool", choices=sorted(fieldscan.TOOLS), help="Run one tool in a fresh session (after capture and confirm).")
    parser.add_argument("--args", default="{}", help="JSON arguments for --tool.")
    parser.add_argument("--mcp", action="store_true", help="Serve the tools over MCP stdio.")
    args = parser.parse_args()
    if args.self_test:
        result = fieldscan.run_all_self_tests()
        print(f"OK: {result['total']} checks · loop {len(result['loop']['cases'])} · "
              f"modbus {len(result['modbus']['cases'])} · session {len(result['session']['cases'])}")
        return
    if args.mcp:
        from edge.mcp_stdio import serve as serve_mcp
        serve_mcp()
        return
    if args.tool:
        session = fieldscan.Session()
        if args.tool not in ("capture_frame", "confirm_asset", "check_replacement"):
            session.confirm_asset(session.capture_frame()["plate_text"][0], confirmed=True)
        try:
            result = fieldscan.call_tool(session, args.tool, json.loads(args.args))
        except ValueError as error:
            sys.exit("Error: " + str(error))
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return
    if args.html:
        output = args.html.resolve()
        output.write_text(portable_html(), encoding="utf-8")
        print("Portable demo: " + str(output))
        if args.open:
            webbrowser.open(output.as_uri())
        return
    serve(args.port, args.open)


if __name__ == "__main__":
    main()
