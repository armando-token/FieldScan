"""Minimal MCP server over stdio (JSON-RPC 2.0, newline-delimited), stdlib only.

Exposes the same six FieldScan tools as the HTTP API so a local MCP client
can drive the session core. Run with: python3 mvp.py --mcp
"""

import json
import sys

from core import fieldscan

PROTOCOL_VERSION = "2025-06-18"


def handle(session, message):
    method = message.get("method")
    params = message.get("params") or {}
    if method == "initialize":
        return {
            "protocolVersion": params.get("protocolVersion", PROTOCOL_VERSION),
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "industrial-datasheet-fieldscan", "version": "0.2.0"},
        }
    if method == "ping":
        return {}
    if method == "tools/list":
        return {"tools": fieldscan.tool_specs()}
    if method == "tools/call":
        try:
            result = fieldscan.call_tool(session, params.get("name"), params.get("arguments") or {})
        except (ValueError, TypeError) as error:
            return {"content": [{"type": "text", "text": str(error)}], "isError": True}
        return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}],
                "structuredContent": result, "isError": False}
    raise LookupError(method)


def serve(stdin=sys.stdin, stdout=sys.stdout):
    session = fieldscan.Session()
    for line in stdin:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            reply = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}
        else:
            if "id" not in message:
                continue  # notification, e.g. notifications/initialized
            try:
                reply = {"jsonrpc": "2.0", "id": message["id"], "result": handle(session, message)}
            except LookupError:
                reply = {"jsonrpc": "2.0", "id": message["id"], "error": {"code": -32601, "message": "Method not found"}}
        stdout.write(json.dumps(reply, ensure_ascii=False) + "\n")
        stdout.flush()
