"""Optional LLM adapter (OpenAI-compatible chat completions API).

Configured only through server-side environment variables so the key never
reaches the browser:

    AI_BASE_URL   e.g. https://api.openai.com/v1
    AI_MODEL      e.g. gpt-4o-mini
    AI_API_KEY    secret key

Every call has an 8 second timeout. Callers must fall back to the local
reasoning engine when this adapter is not configured or raises AIError.
"""

import json
import os
import urllib.error
import urllib.request

TIMEOUT_S = 8

SYSTEM_PROMPT = (
    "You are the onboard assistant of a ship's spare-part verification platform. "
    "You talk to a marine engineer in English. Ground every technical statement in the "
    "JSON report and live telemetry supplied in the context; never invent values. "
    "Keep the electrical verdict, the computed margin and the pending checks intact. "
    "Distinguish loop compatibility from replacement equivalence, and say which data "
    "is from the manufacturer and which is synthetic. Be concise (max 5 sentences)."
)


class AIError(Exception):
    pass


def config():
    base = os.environ.get("AI_BASE_URL", "").rstrip("/")
    model = os.environ.get("AI_MODEL", "")
    key = os.environ.get("AI_API_KEY", "")
    if base and model and key:
        return {"base_url": base, "model": model, "key": key}
    return None


def status():
    cfg = config()
    return {"configured": bool(cfg), "model": cfg["model"] if cfg else None}


def _messages(question, context, history):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": "Context JSON:\n" + json.dumps(context, ensure_ascii=False)},
    ]
    for turn in history[-8:]:
        if turn.get("role") in ("user", "assistant") and isinstance(turn.get("content"), str):
            messages.append({"role": turn["role"], "content": turn["content"][:2000]})
    messages.append({"role": "user", "content": question[:2000]})
    return messages


def _request(cfg, messages, stream):
    body = json.dumps({
        "model": cfg["model"],
        "messages": messages,
        "temperature": 0.2,
        "stream": stream,
    }).encode("utf-8")
    req = urllib.request.Request(
        cfg["base_url"] + "/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + cfg["key"],
            "Accept": "text/event-stream" if stream else "application/json",
        },
        method="POST",
    )
    try:
        return urllib.request.urlopen(req, timeout=TIMEOUT_S)
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise AIError(str(error)) from error


def stream_chat(question, context, history=()):
    """Yield text deltas from the configured model."""
    cfg = config()
    if not cfg:
        raise AIError("AI adapter not configured.")
    response = _request(cfg, _messages(question, context, list(history)), stream=True)
    try:
        with response:
            for raw in response:
                line = raw.decode("utf-8", "replace").strip()
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    return
                try:
                    delta = json.loads(data)["choices"][0].get("delta", {}).get("content")
                except (ValueError, KeyError, IndexError):
                    continue
                if delta:
                    yield delta
    except (TimeoutError, OSError) as error:
        raise AIError(str(error)) from error


def explain(report):
    """Contract from the manual: explain(report) -> text."""
    return "".join(stream_chat(
        "Summarise this report in three sentences for a marine engineer.", {"report": report}))
