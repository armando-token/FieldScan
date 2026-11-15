"""Optional LLM adapter (OpenAI-compatible chat completions API).

Two ways to enable it, both server-side so no key ever reaches the browser:

1. Local model (works offline on board). Run an OpenAI-compatible server on this
   machine, e.g. llama.cpp with a Liquid AI LFM model:

       llama-server -m LFM3-1.7B-Q4_K_M.gguf --port 8080 --jinja

   It is detected automatically at AI_LOCAL_URL (default http://127.0.0.1:8080/v1).

   For on-demand vision and offline voice input, also run Liquid AI LFM3-Omni:

       llama-server -m LFM3-Omni-2B-Q4_K_M.gguf --mmproj mmproj-LFM3-Omni-2B-Q8_0.gguf \
           --port 8081 --reasoning off --temp 0

   It is detected at AI_OMNI_URL (default http://127.0.0.1:8081/v1). When it is the
   only local model running, it also answers the text chat.

2. Remote model, used when set (takes precedence):

       AI_BASE_URL   e.g. https://api.openai.com/v1
       AI_MODEL      e.g. gpt-4o-mini
       AI_API_KEY    secret key

Callers must fall back to the local reasoning engine when this adapter is not
configured or raises AIError.
"""

import json
import os
import time
import urllib.error
import urllib.request

TIMEOUT_S = 20
LOCAL_URL = os.environ.get("AI_LOCAL_URL", "http://127.0.0.1:8080/v1").rstrip("/")
OMNI_URL = os.environ.get("AI_OMNI_URL", "http://127.0.0.1:8081/v1").rstrip("/")
_PROBES = {}

VISION_PROMPT = (
    "You are the vision module of a ship engine-room inspection platform. The image is a frame "
    "from the inspection camera; in this demo it is a simulated 3D render of the installation. "
    "Describe in English, in at most 4 short sentences, only what is clearly visible: equipment, "
    "labels you can actually read, cable routing, open or disassembled parts, warning colours. "
    "If a value or text is not legible, say so instead of guessing. Do not diagnose; the "
    "platform's rule engine does that."
)

SYSTEM_PROMPT = (
    "You are the onboard assistant of Industrial Datasheet + FieldScan, a ship engine-room "
    "inspection platform. Always answer in English, briefly (1-4 sentences), friendly and plain. "
    "Use ONLY the facts below and the session context JSON; if something is not there, say you "
    "cannot verify it and suggest a platform command. Never invent values, models or sources. "
    "Everything on the bus is simulated, never a field measurement.\n"
    "FACTS:\n"
    "- Open ticket: the ventilation controller shows no temperature from sensor BOAT-ER-TH-02 "
    "(TZ THT-02 temperature/humidity probe) since the last maintenance.\n"
    "- Modbus RTU over RS-485 (wired two-wire differential serial bus, not radio). Master polls a "
    "slave address with function 03; only the slave with that address replies. Frames end in a "
    "CRC-16; bad CRC frames are silently ignored (manual 6.10). Default 9600 baud 8N1 (6.1).\n"
    "- THT-02 address is set by an internal DIP-8 switch, switches 1-8 weigh 128..1 (manual 5). "
    "Registers: 0 temperature x0.1 C, 1 humidity x0.1 %RH, 7FFF H = sensor abnormal (6.4, 6.7). "
    "Leads: red V+, black GND, yellow A+, green B- (4.6).\n"
    "- Root cause of the incident: master polls address 1 but the DIP is 0000 0010 = address 2, so "
    "the sensor stays silent and the master times out. Fix: DIP 0000 0001 (address 1); then it "
    "reads 23.4 C and 57.8 %RH.\n"
    "- Manual TZ-THT02-UM-V1.0 validity is 'to confirm' (edition not verified with the maker).\n"
    "- Workspace 3: E+H FMX11 4-20 mA level probe replacing a WIKA LS-10 on tank T-03, loop into a "
    "Siemens SM 1231 input (max 290 ohm). FMX11 needs 8 V at 22 mA: available load 727.3 ohm at "
    "24 V, 181.8 ohm at 12 V. Evaluated loop 320 ohm (v1) or 765 ohm (v2). Passing the load check "
    "is not full replacement equivalence: range, scaling, materials and approvals stay pending.\n"
    "- Useful commands: 'Why does it fail?', 'show the manual section 6.4', 'simulate the DIP fix', "
    "'does it work now?', 'inject a bad CRC', 'x-ray view', 'disassemble the probe', "
    "'switch to 12 V', 'is the spare a valid replacement?', 'run self-test'."
)


class AIError(Exception):
    pass


def _probe(url):
    now = time.monotonic()
    cached = _PROBES.get(url)
    if cached and now - cached[0] < 15:
        return cached[1]
    cfg = None
    try:
        with urllib.request.urlopen(url + "/models", timeout=0.6) as resp:
            models = json.loads(resp.read()).get("data") or []
        if models:
            cfg = {"base_url": url, "model": models[0]["id"], "key": None, "local": True}
    except (urllib.error.URLError, OSError, ValueError, KeyError, TimeoutError):
        cfg = None
    _PROBES[url] = (now, cfg)
    return cfg


def omni_config():
    return _probe(OMNI_URL)


def cloud_config():
    base = os.environ.get("AI_BASE_URL", "").rstrip("/")
    model = os.environ.get("AI_MODEL", "")
    key = os.environ.get("AI_API_KEY", "")
    if base and model and key:
        return {"base_url": base, "model": model, "key": key, "local": False}
    return None


def local_config():
    return _probe(LOCAL_URL) or omni_config()


def config(link="online"):
    """Who answers free-form chat. Offline (no Internet on board) never leaves the machine."""
    if link == "offline":
        return local_config()
    return cloud_config() or local_config()


def _describe(cfg):
    return {"configured": bool(cfg), "model": cfg["model"] if cfg else None}


def status():
    cfg = config()
    omni = omni_config()
    return {"configured": bool(cfg), "model": cfg["model"] if cfg else None, "local": bool(cfg and cfg["local"]),
            "cloud": _describe(cloud_config()), "on_device": _describe(local_config()), "omni": _describe(omni)}


def _messages(question, context, history):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": "Context JSON:\n" + json.dumps(context, ensure_ascii=False)},
    ]
    for turn in history[-8:]:
        if turn.get("role") in ("user", "assistant") and isinstance(turn.get("content"), str):
            messages.append({"role": turn["role"], "content": turn["content"][:2000]})
    messages.append({"role": "user", "content": question[:2000]})
    messages.append({"role": "system", "content": "Reply in English only, even if the user writes in another language."})
    return messages


def _request(cfg, messages, stream):
    payload = {"model": cfg["model"], "messages": messages, "temperature": 0.2, "stream": stream}
    if cfg["local"]:
        # Small local models answer faster and more literally without a reasoning pass.
        payload.update(max_tokens=400, chat_template_kwargs={"enable_thinking": False})
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json",
               "Accept": "text/event-stream" if stream else "application/json"}
    if cfg["key"]:
        headers["Authorization"] = "Bearer " + cfg["key"]
    req = urllib.request.Request(
        cfg["base_url"] + "/chat/completions",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        return urllib.request.urlopen(req, timeout=TIMEOUT_S)
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise AIError(str(error)) from error


def stream_chat(question, context, history=(), link="online"):
    """Yield text deltas from the model chosen for the current link state."""
    cfg = config(link)
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


def _complete(cfg, messages, max_tokens=300):
    payload = {"model": cfg["model"], "messages": messages, "temperature": 0, "max_tokens": max_tokens,
               "stream": False, "chat_template_kwargs": {"enable_thinking": False}}
    req = urllib.request.Request(cfg["base_url"] + "/chat/completions", data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        return (data["choices"][0]["message"].get("content") or "").strip()
    except (urllib.error.URLError, OSError, ValueError, KeyError, IndexError, TimeoutError) as error:
        raise AIError(str(error)) from error


def describe_image(image_data_url, question="What do you see?"):
    """On-device vision with LFM3-Omni. Returns plain text; never evidence."""
    cfg = omni_config()
    if not cfg:
        raise AIError("Vision model not running.")
    return _complete(cfg, [
        {"role": "system", "content": VISION_PROMPT},
        {"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": image_data_url}},
            {"type": "text", "text": question[:500]},
        ]},
    ])


def transcribe(wav_base64, language="English"):
    """On-device speech recognition with LFM3-Omni (16 kHz mono WAV, base64)."""
    cfg = omni_config()
    if not cfg:
        raise AIError("Voice model not running.")
    return _complete(cfg, [
        {"role": "system", "content": f"Perform ASR in {language}."},
        {"role": "user", "content": [{"type": "input_audio", "input_audio": {"data": wav_base64, "format": "wav"}}]},
    ], max_tokens=200)

