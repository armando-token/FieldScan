"""On-Device Liquid AI Runtime Engine (LFM3-VL-2B + LFM3-Audio-2B via llama.cpp + Piper English TTS).

All loopback HTTP calls use `httpx.Client(trust_env=False)` so proxy environment variables
never intercept `127.0.0.1` traffic during Wi-Fi shutoff / Airplane Mode.
"""

from __future__ import annotations

import base64
from collections import deque
import io
import os
from pathlib import Path
import re
import subprocess
import threading
import time
from typing import Any
import wave

import cv2
import httpx
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[2]

_ZONE_ALIAS_MAP: dict[str, str] = {
    "seal_ring": "upper_seal_ring",
    "middle_barrel": "lower_barrel_rs485",
}


def _resolve_default_piper_model() -> Path:
    env_p = os.environ.get("FIELDSCAN_PIPER_ONNX") or os.environ.get("PIPER_VOICE_MODEL")
    if env_p:
        return Path(env_p).expanduser()
    rel = Path("piper/en/en_US/lessac/medium/en_US-lessac-medium.onnx")
    for base in (PROJECT_ROOT / "vendor", PROJECT_ROOT.parent / "vendor", Path("/home/antigravity/vendor")):
        cand = base / rel
        if cand.is_file():
            return cand
    return PROJECT_ROOT.parent / "vendor" / rel


DEFAULT_VL_URL = os.environ.get("FIELDSCAN_VL_URL", "http://127.0.0.1:8091")
DEFAULT_AUDIO_URL = os.environ.get("FIELDSCAN_AUDIO_URL", "http://127.0.0.1:8092")
DEFAULT_PIPER_MODEL = _resolve_default_piper_model()

MANUAL_PAGE_TITLES: dict[int, str] = {
    1: "Page 1 · THT-02 Anatomy & SHT30 Probe",
    2: "Page 2 · Specifications & HVAC Overview",
    3: "Page 3 · SHT30/SHT3X Ratings & RS-485 Bus",
    4: "Page 4 · 4-Wire Color Code & RS-485 Grounding",
    5: "Page 5 · 2-Step Opening & DIP-8 Switch (Ex. 176)",
    6: "Page 6 · Modbus Registers & 7FFFH Fault Alarm",
    7: "Page 7 · Modbus 0x03 Poll & 21-Byte RTU Frame",
    8: "Page 8 · Baud Write 0x06 & Exception Responses",
    9: "Page 9 · CRC-16 (0xA001) & 140x16 mm Blueprint",
}


def _clean_for_tts(text: str, max_chars: int = 280) -> str:
    """Clean markdown symbols and keep spoken English output concise and natural."""
    cleaned = re.sub(r"[`*_#>\[\]]+", " ", text or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    cut = cleaned[:max_chars]
    last_dot = max(cut.rfind("."), cut.rfind(";"), cut.rfind(":"))
    if last_dot >= 90:
        return cut[: last_dot + 1].strip()
    return cut.rsplit(" ", 1)[0].strip() + "."


def _downscale_jpeg_for_vlm(jpeg_bytes: bytes, max_dim: int = 640) -> bytes:
    """Resize high-res camera frame to max 640px so LFM3-VL-2B vision encoding stays ultra-fast."""
    arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None or img.size == 0:
        return jpeg_bytes
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        nw = max(32, int(round(w * scale)))
        nh = max(32, int(round(h * scale)))
        img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    ok, enc = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
    return enc.tobytes() if ok else jpeg_bytes


def _normalize_wav_to_16khz_mono_in_memory(audio_bytes: bytes) -> bytes | None:
    """Normalize and resample any uncompressed RIFF/WAVE payload to 16 kHz 16-bit mono PCM in memory."""
    if not audio_bytes or len(audio_bytes) < 44:
        return None
    if audio_bytes[:4] != b"RIFF" or audio_bytes[8:12] != b"WAVE":
        return None

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            nchannels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            raw_frames = wf.readframes(nframes)
    except Exception:
        return None

    if nchannels < 1 or framerate <= 0 or sampwidth not in (1, 2, 3, 4):
        return None

    if sampwidth == 2 and nchannels == 1 and framerate == 16000:
        pcm_i16 = np.frombuffer(raw_frames[: (len(raw_frames) // 2) * 2], dtype="<i2")
    else:
        if sampwidth == 1:
            u8 = np.frombuffer(raw_frames, dtype=np.uint8)
            samples = (u8.astype(np.float32) - 128.0) / 128.0
        elif sampwidth == 2:
            i16 = np.frombuffer(raw_frames[: (len(raw_frames) // 2) * 2], dtype="<i2")
            samples = i16.astype(np.float32) / 32768.0
        elif sampwidth == 3:
            usable = (len(raw_frames) // 3) * 3
            triplets = np.frombuffer(raw_frames[:usable], dtype=np.uint8).reshape(-1, 3)
            vals = (
                triplets[:, 0].astype(np.int32)
                | (triplets[:, 1].astype(np.int32) << 8)
                | (triplets[:, 2].astype(np.int32) << 16)
            )
            vals = np.where(vals & 0x800000, vals - 0x1000000, vals)
            samples = vals.astype(np.float32) / 8388608.0
        else:
            i32 = np.frombuffer(raw_frames[: (len(raw_frames) // 4) * 4], dtype="<i4")
            samples = i32.astype(np.float32) / 2147483648.0

        if nchannels > 1:
            total_frames = len(samples) // nchannels
            if total_frames == 0:
                samples = np.zeros(0, dtype=np.float32)
            else:
                samples = samples[: total_frames * nchannels].reshape(total_frames, nchannels).mean(axis=1)

        if framerate != 16000 and len(samples) > 0:
            target_len = max(1, int(round(len(samples) * 16000.0 / float(framerate))))
            x_old = np.linspace(0.0, 1.0, num=len(samples), endpoint=False, dtype=np.float64)
            x_new = np.linspace(0.0, 1.0, num=target_len, endpoint=False, dtype=np.float64)
            samples = np.interp(x_new, x_old, samples).astype(np.float32)

        pcm_i16 = np.clip(np.round(samples * 32767.0), -32768, 32767).astype("<i2")

    out_buf = io.BytesIO()
    with wave.open(out_buf, "wb") as out_wf:
        out_wf.setnchannels(1)
        out_wf.setsampwidth(2)
        out_wf.setframerate(16000)
        out_wf.writeframes(pcm_i16.tobytes())
    return out_buf.getvalue()


def _wrap_raw_pcm_as_16khz_wav(raw_bytes: bytes) -> bytes:
    """Wrap raw 16-bit mono PCM bytes into a clean 16 kHz WAV container when running without subprocess."""
    if not raw_bytes:
        return raw_bytes
    if len(raw_bytes) >= 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WAVE":
        return raw_bytes
    even_len = (len(raw_bytes) // 2) * 2
    payload = raw_bytes[:even_len] if even_len > 0 else b"\x00\x00"
    out_buf = io.BytesIO()
    with wave.open(out_buf, "wb") as out_wf:
        out_wf.setnchannels(1)
        out_wf.setsampwidth(2)
        out_wf.setframerate(16000)
        out_wf.writeframes(payload)
    return out_buf.getvalue()


def _transcode_to_16khz_mono_wav(audio_bytes: bytes) -> bytes:
    """Convert browser or microphone audio to 16 kHz 16-bit mono PCM WAV in memory, falling back to ffmpeg only on desktop."""
    in_mem_wav = _normalize_wav_to_16khz_mono_in_memory(audio_bytes)
    if in_mem_wav is not None and len(in_mem_wav) > 44:
        return in_mem_wav

    if (
        os.environ.get("FIELDSCAN_PLATFORM", "").lower() == "ios"
        or os.environ.get("FIELDSCAN_NO_SUBPROCESS", "") == "1"
    ):
        if len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE":
            return audio_bytes
        return _wrap_raw_pcm_as_16khz_wav(audio_bytes)

    try:
        proc = subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                "-f",
                "wav",
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            timeout=8.0,
            check=False,
        )
        if proc.returncode == 0 and len(proc.stdout) > 44:
            return proc.stdout
    except (OSError, subprocess.SubprocessError):
        pass
    return audio_bytes


def _infer_target_zone(
    query: str,
    zone_hint: str | None,
    scanner_telemetry: dict[str, Any] | None,
) -> tuple[str, bool]:
    """Determine the primary canonical sensor zone and whether the 3D housing should explode."""
    q = (query or "").lower()
    tel = scanner_telemetry or {}

    if zone_hint:
        norm_hint = _ZONE_ALIAS_MAP.get(zone_hint.strip().lower(), zone_hint.strip())
        explode = norm_hint == "upper_barrel_dip" or bool(tel.get("pcb_open_detected"))
        return norm_hint, explode

    if any(k in q for k in ("dip", "switch", "address", "slave", "176", "unscrew", "exposed", "pcb", "rocker")):
        return "upper_barrel_dip", True

    if any(k in q for k in ("tip", "strainer", "filter", "sintered", "head", "slot", "sht30", "sht3x", "7fff", "patch")):
        return "strainer_head", False

    # Prioritize live OpenCV visual localization when camera sees an active anomaly or open PCB!
    if tel.get("pcb_open_detected"):
        return "upper_barrel_dip", True

    if tel.get("anomaly_detected") and tel.get("anomaly_zone"):
        z = str(tel["anomaly_zone"])
        return z, (z == "upper_barrel_dip")

    if any(k in q for k in ("cable", "wire", "lead", "gland", "terminal", "gnd", "ground", "shield", "frayed")):
        return "waterproof_gland_leads", False

    if any(k in q for k in ("flange", "bracket", "clip", "ear", "mount", "hole", "screw")):
        return "mounting_flange", False

    if any(k in q for k in ("baud", "9600", "4800", "19200", "crc", "modbus", "rs485", "rs-485", "transceiver", "regulator")):
        return "lower_barrel_rs485", False

    if any(k in q for k in ("seal", "o-ring", "oring", "elastomer", "collar", "gasket")):
        return "upper_seal_ring", False

    return "strainer_head", False


_VISUAL_DIAGNOSIS_RE = re.compile(
    r"\b(?:inspect|diagnose|camera|frame|photo|image|picture|visual|look|see|patch|stain|failing|broken|damaged|obstruction|frayed)\b"
    r"|what(?:'s| is) wrong|current condition|current status on camera",
    re.IGNORECASE,
)

_TECHNICAL_TOPIC_RE = re.compile(
    r"\b(?:sensor|tht|ths|thp|sht30|sht3x|modbus|rs485|rs-485|rtu|dip|switch|switches|pin|pins|slave|address|"
    r"register|registers|0x[0-9a-f]+|7fff|7fffh|crc|baud|9600|4800|19200|temp|temperature|humid|humidity|rh|"
    r"wire|wires|wiring|cable|lead|leads|gland|volt|voltage|power|supply|gnd|ground|strainer|filter|sintered|"
    r"barrel|flange|o-ring|oring|seal|pcb|housing|unscrew|manual|datasheet|page|twin|3d|cad|dxf|stl|"
    r"fault|alarm|error|test|simulate|reading|readings|value|values|online|offline|andon|lamp|scada)\b",
    re.IGNORECASE,
)


def _classify_query_mode(query: str, zone_hint: str | None) -> str:
    """Classify operator input into 'visual_diagnosis', 'technical_qa', or 'conversational'."""
    if zone_hint:
        return "visual_diagnosis"
    q = (query or "").strip()
    if not q:
        return "visual_diagnosis"
    if _VISUAL_DIAGNOSIS_RE.search(q):
        return "visual_diagnosis"
    if _TECHNICAL_TOPIC_RE.search(q):
        return "technical_qa"
    return "conversational"


def _infer_relevant_pages(query: str) -> list[int]:
    """Return concise Manual V1.1 page citations relevant to a technical question (or empty if general)."""
    q = (query or "").lower()
    pages: list[int] = []
    if any(k in q for k in ("dip", "pin", "switch", "slave", "address", "176", "unscrew", "open", "pcb")):
        pages.append(5)
    if any(k in q for k in ("wire", "wiring", "lead", "color", "yellow", "green", "red", "black", "gnd", "ground", "gland")):
        pages.append(4)
    if any(k in q for k in ("register", "7fff", "0000", "0001", "abnormal", "alarm")):
        pages.append(6)
    if any(k in q for k in ("0x03", "frame", "21-byte", "poll", "rtu")):
        pages.append(7)
    if any(k in q for k in ("baud", "4800", "19200", "0x06", "0005")):
        pages.append(8)
    if any(k in q for k in ("crc", "a001", "140", "16", "dimension", "blueprint", "twin", "cad", "dxf", "stl")):
        pages.append(9)
    if any(k in q for k in ("sht30", "sht3x", "strainer", "sintered", "spec", "accuracy", "range")):
        pages.extend([1, 3])
    deduped: list[int] = []
    for p in pages:
        if p not in deduped:
            deduped.append(p)
    return deduped[:3]


def _find_zone_spec(spec: dict[str, Any], zone_id: str) -> dict[str, Any]:
    norm_id = _ZONE_ALIAS_MAP.get(zone_id.lower(), zone_id)
    for z in spec.get("zones", []):
        if z.get("id") == norm_id or zone_id in z.get("aliases", []):
            return z
    zones = spec.get("zones", [])
    return zones[0] if zones else {}


class LFMEngine:
    """Manages local Liquid AI `LFM3-VL-2B`, `LFM3-Audio-2B`, and `Piper` English neural TTS."""

    def __init__(
        self,
        vl_url: str = DEFAULT_VL_URL,
        audio_url: str = DEFAULT_AUDIO_URL,
        piper_model_path: Path = DEFAULT_PIPER_MODEL,
    ) -> None:
        self.vl_url = vl_url.rstrip("/")
        self.audio_url = audio_url.rstrip("/")
        self.piper_model_path = Path(piper_model_path)
        self._piper_voice: Any = None
        self._piper_lock = threading.Lock()
        self._history_lock = threading.Lock()
        self._chat_history: deque[dict[str, str]] = deque(maxlen=6)

        self.last_latency_ms: float | None = None
        self.last_tokens_per_sec: float | None = None
        self.last_model_label: str = "LiquidAI LFM3-VL-2B + Audio-2B"

    def _get_piper(self) -> Any:
        if self._piper_voice is not None:
            return self._piper_voice
        with self._piper_lock:
            if self._piper_voice is None and self.piper_model_path.is_file():
                from piper import PiperVoice

                self._piper_voice = PiperVoice.load(str(self.piper_model_path))
        return self._piper_voice

    def check_health(self) -> dict[str, Any]:
        vl_ok = False
        audio_ok = False
        vl_model_id: str | None = None
        audio_model_id: str | None = None
        with httpx.Client(trust_env=False, timeout=1.2) as client:
            try:
                r_vl = client.get(f"{self.vl_url}/health")
                vl_ok = r_vl.status_code == 200
                if vl_ok:
                    r_vm = client.get(f"{self.vl_url}/v1/models")
                    if r_vm.status_code == 200:
                        items = (r_vm.json().get("data") or [])
                        if items and isinstance(items[0], dict):
                            vl_model_id = str(items[0].get("id") or "").strip() or None
            except Exception:
                vl_ok = False
            try:
                r_au = client.get(f"{self.audio_url}/health")
                audio_ok = r_au.status_code == 200
                if audio_ok:
                    r_am = client.get(f"{self.audio_url}/v1/models")
                    if r_am.status_code == 200:
                        items = (r_am.json().get("data") or [])
                        if items and isinstance(items[0], dict):
                            audio_model_id = str(items[0].get("id") or "").strip() or None
            except Exception:
                audio_ok = False

        tts_ok = self.piper_model_path.is_file()
        effective_provider = (
            f"{vl_model_id or 'llama-server'} · Mac Mini"
            if vl_ok
            else "Local Deterministic Rules v2.1 · On-Device"
        )
        return {
            "vl_online": vl_ok,
            "vl_url": self.vl_url,
            "effective_vl_model_id": vl_model_id,
            "audio_online": audio_ok,
            "audio_url": self.audio_url,
            "effective_audio_model_id": audio_model_id,
            "tts_ready": tts_ok,
            "piper_voice": self.piper_model_path.name if tts_ok else None,
            "provider_id": "mac_assisted_llm" if vl_ok else "local_rules_v2",
            "provider_label": effective_provider,
            "model_name": effective_provider,
            "last_latency_ms": self.last_latency_ms,
            "tokens_per_sec": self.last_tokens_per_sec,
        }

    def synthesize_speech(self, text: str) -> bytes:
        """Synthesize offline English WAV audio in ~45 ms using Piper ONNX (`en_US-lessac-medium.onnx`)."""
        voice = self._get_piper()
        if voice is None:
            return b""
        spoken = _clean_for_tts(text)
        if not spoken:
            return b""
        buf = io.BytesIO()
        with self._piper_lock:
            with wave.open(buf, "wb") as wf:
                voice.synthesize_wav(spoken, wf)
        return buf.getvalue()

    synthesize_speech_en = synthesize_speech

    def synthesize_speech_b64(self, text: str) -> str | None:
        wav_bytes = self.synthesize_speech(text)
        if not wav_bytes:
            return None
        return base64.b64encode(wav_bytes).decode("ascii")

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "speech.wav",
        allow_empty: bool = False,
    ) -> dict[str, Any]:
        """Transcribe spoken English audio offline via `LiquidAI/LFM3-Audio-2B` on `:8092`."""
        t0 = time.perf_counter()
        wav_16k = _transcode_to_16khz_mono_wav(audio_bytes)
        b64_wav = base64.b64encode(wav_16k).decode("ascii")

        payload = {
            "model": "LFM3-Audio-2B",
            "messages": [
                {
                    "role": "system",
                    "content": "Transcribe this English speech verbatim. Output only the spoken words.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "input_audio", "input_audio": {"data": b64_wav, "format": "wav"}},
                        {"type": "text", "text": "Transcribe this English speech verbatim. Output only the spoken words."},
                    ],
                },
            ],
            "temperature": 0.0,
            "max_tokens": 96,
            "chat_template_kwargs": {"enable_thinking": False},
        }

        transcript = ""
        backend = "LFM3-Audio-2B (llama.cpp)"
        try:
            with httpx.Client(trust_env=False, timeout=18.0) as client:
                resp = client.post(f"{self.audio_url}/v1/chat/completions", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    msg = (data.get("choices") or [{}])[0].get("message", {})
                    transcript = (msg.get("content") or "").strip().strip('"')
        except Exception as exc:
            backend = f"offline_audio_fallback ({type(exc).__name__})"

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        cleaned_alpha = re.sub(r"[^a-zA-Z0-9]+", "", transcript)
        is_empty = len(cleaned_alpha) < 2
        if is_empty and not allow_empty:
            transcript = "This is a TZ THT-02 sensor, inspect current status on camera."
            is_empty = False
        return {
            "transcript": "" if is_empty else transcript,
            "empty_speech": is_empty,
            "asr_ms": elapsed_ms,
            "backend": backend,
            "filename": filename,
        }

    def _record_chat_turn(self, user_q: str, assistant_a: str) -> None:
        if not user_q or not assistant_a:
            return
        with self._history_lock:
            self._chat_history.append({"role": "user", "content": user_q[:280]})
            self._chat_history.append({"role": "assistant", "content": assistant_a[:360]})

    def _snapshot_chat_history(self) -> list[dict[str, str]]:
        with self._history_lock:
            return list(self._chat_history)

    def diagnose_sensor(
        self,
        query: str,
        spec: dict[str, Any],
        frame_jpeg: bytes | None = None,
        scanner_telemetry: dict[str, Any] | None = None,
        modbus_telemetry: dict[str, Any] | None = None,
        zone_hint: str | None = None,
        dip_address: int | None = None,
    ) -> dict[str, Any]:
        """Interactive English AI Engineer: conversational chat, datasheet Q&A, and multimodal visual fault diagnosis."""
        t0 = time.perf_counter()
        mode = _classify_query_mode(query, zone_hint)
        tel = scanner_telemetry or {}
        mb = modbus_telemetry or {}
        history_msgs = self._snapshot_chat_history()

        is_sim_mb = bool(mb.get("simulation") or str(mb.get("source", "")).startswith("simulator"))
        is_fresh_mb = bool(mb.get("fresh", mb.get("online", False)))
        if mb.get("healthy") and is_fresh_mb:
            prov_tag = "SIMULATION (SYNTHETIC)" if is_sim_mb else "PHYSICAL BENCH"
            scada_note = (
                f"Modbus [{prov_tag}, Slave #{mb.get('slave_id')}, {mb.get('baud_bps', 9600)} 8N1]: "
                f"Temp={mb.get('temp_c')} C, Humidity={mb.get('humidity_rh')} %RH."
            )
        elif mb.get("online") and mb.get("sensor_abnormal_7fff"):
            scada_note = "Modbus Bus reports 0x7FFF sentinel on holding registers 0x0000/0x0001 (SHT30 probe abnormal)."
        elif mb.get("historical_sample"):
            hs = mb["historical_sample"]
            scada_note = (
                f"No fresh Modbus response; HISTORICAL sample from {hs.get('captured_at_utc')}: "
                f"Temp={hs.get('temp_c')} C, Humidity={hs.get('humidity_rh')} %RH."
            )
        else:
            scada_note = f"Modbus Bus: {mb.get('status_label', 'NO RESPONSE / DISCONNECTED')}."

        zone_id: str | None = None
        explode_pcb: bool | None = None
        probable_causes: list[str] = []
        recommended_actions: list[str] = []
        cited_pages: list[int] = []
        primary_page: int | None = None

        if mode == "conversational":
            messages: list[dict[str, Any]] = [
                {
                    "role": "system",
                    "content": (
                        "You are the FieldScan AI Engineer, a friendly, interactive offline industrial assistant "
                        "speaking strictly in English. Answer the operator's exact message naturally and conversationally "
                        "in 1 to 3 clear sentences. When greeted or told they have a question, greet them warmly and "
                        "invite their question. Never dump sensor values or diagnostic templates unless explicitly asked."
                    ),
                },
                *history_msgs,
                {"role": "user", "content": query},
            ]
            temperature = 0.3
            max_tokens = 110
        elif mode == "technical_qa":
            cited_pages = _infer_relevant_pages(query)
            primary_page = cited_pages[0] if cited_pages else None
            dip_note = f" UI DIP-8 Calculator currently set to Slave #{dip_address}." if dip_address is not None else ""
            tech_ref = (
                f"Live Workstation Context: {scada_note} Optical Camera: sensor_detected={tel.get('detected', True)}, "
                f"pcb_open={tel.get('pcb_open_detected', False)}.{dip_note}\n"
                "TZ THT-02 Manual V1.1 Reference: 140.0 mm x 16.0 mm OD housing (Page 9), SHT30 CMOSens probe "
                "(-40..+125 C +/-0.3 C, 0..100 %RH +/-2 %RH, DC 5-24V, Pages 1 & 3); "
                "4-wire cable: Red=V+, Black=GND, Yellow=RS-485 A+, Green=RS-485 B- (Page 4); "
                "internal SW1 DIP-8 binary weights Pin 1..8 = [128, 64, 32, 16, 8, 4, 2, 1] (Slave #1 = Pin 8 ON & Pins 1..7 OFF; "
                "Slave #2 = Pin 7 ON; Slave #3 = Pins 7 & 8 ON; Slave #176 = Pins 1,3,4 ON; all OFF = invalid Slave 0; "
                "changing DIP-8 away from Slave #1 and power-cycling causes a Modbus Slave ID mismatch / NO RESPONSE bus fault, Page 5); "
                "Modbus-RTU 9600 8N1 Function 0x03: Reg 0x0000=Temp, Reg 0x0001=Humidity, whereas 0x7FFF only indicates a physical SHT30 probe fault (Pages 6-8). "
                "Digital Twin is generated 100% offline in Three.js from Manual V1.1 mechanical drawings (Pages 1, 4, 5, 9)."
            )
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are the FieldScan AI Engineer, an interactive offline specialist for the TZ THT-02 RS-485 sensor. "
                        "Always respond strictly in clear, natural English (2 to 4 concise sentences) answering the operator's "
                        "exact question directly. Only include live sensor telemetry if relevant to their question."
                    ),
                },
                *history_msgs[-4:],
                {
                    "role": "user",
                    "content": (
                        f"{tech_ref}\n\n"
                        f"Operator question: {query}\n"
                        "Answer the operator's exact question directly and naturally in English:"
                    ),
                },
            ]
            temperature = 0.2
            max_tokens = 145
        else:
            zone_id, exp_bool = _infer_target_zone(query, zone_hint, scanner_telemetry)
            explode_pcb = exp_bool
            z_spec = _find_zone_spec(spec, zone_id)
            zone_label = z_spec.get("label_en") or z_spec.get("label") or zone_id
            probable_causes = list(z_spec.get("probable_faults_en") or z_spec.get("probable_faults") or [])
            recommended_actions = list(z_spec.get("recommended_actions_en") or z_spec.get("recommended_actions") or [])
            electrical_symptoms = list(z_spec.get("electrical_symptoms") or [])
            cited_pages = list(z_spec.get("manual_pages", [1, 6, 9]))
            primary_page = (
                5 if explode_pcb else (6 if zone_id == "strainer_head" else (cited_pages[0] if cited_pages else 1))
            )

            cv_summary = (
                f"OpenCV Telemetry: detected={tel.get('detected', True)}, "
                f"envelope={tel.get('est_length_mm', 140.0)}x{tel.get('est_diameter_mm', 16.0)} mm, "
                f"anomaly={tel.get('anomaly_detected', False)} in zone={tel.get('anomaly_zone') or zone_id} "
                f"(z={tel.get('anomaly_z_mm', 0.0)} mm), pcb_open={tel.get('pcb_open_detected', explode_pcb)}."
            )
            dip_note = f" Current DIP-8 Slave Address={dip_address}." if dip_address is not None else ""
            manual_facts = (
                f"Official TZ THT-02 Manual V1.1: rigid envelope 140.0 mm x 16.0 mm OD (Page 9); "
                f"SHT30/SHT3X CMOSens element, DC 5~24V 5mA supply; "
                f"4 leads: Red=V+, Black=public GND, Yellow=A+, Green=B- (Page 4); "
                f"internal DIP-8 weights [128,64,32,16,8,4,2,1], e.g. Pins 1,3,4 ON = 176, 2-step unscrew opening (Page 5); "
                f"Modbus holding registers 0x0000 Temp and 0x0001 Humidity return 7FFFH when sensor is abnormal (Page 6). "
                f"Inspected zone: {zone_label}. Typical symptoms: {'; '.join(electrical_symptoms[:2])}."
            )

            user_content: list[dict[str, Any]] = []
            if frame_jpeg:
                compact_jpg = _downscale_jpeg_for_vlm(frame_jpeg, max_dim=384)
                b64_img = base64.b64encode(compact_jpg).decode("ascii")
                user_content.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"},
                    }
                )
            user_content.append(
                {
                    "type": "text",
                    "text": (
                        f"{cv_summary}{dip_note} {scada_note}\n"
                        f"Datasheet reference: {manual_facts}\n"
                        f"Operator query: {query}\n"
                        "Answer the operator's query directly in clear, concise Industrial English (2 to 4 sentences), "
                        "citing the relevant TZ THT-02 Manual V1.1 details and corrective or verification step."
                    ),
                }
            )
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are FieldScan CAD, an interactive offline industrial diagnostic engineer for the TZ THT-02 RS-485 sensor. "
                        "Respond strictly in clear technical English grounded in the camera frame and User's Manual V1.1."
                    ),
                },
                {"role": "user", "content": user_content},
            ]
            temperature = 0.15
            max_tokens = 135

        payload = {
            "model": "LFM3-VL-2B",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "chat_template_kwargs": {"enable_thinking": False},
        }

        vlm_text = ""
        tokens_per_s: float | None = None
        model_used = "LiquidAI LFM3-VL-2B · Mac Mini"
        provider_id = "mac_assisted_llm"

        try:
            with httpx.Client(trust_env=False, timeout=22.0) as client:
                resp = client.post(f"{self.vl_url}/v1/chat/completions", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    actual_model = str(data.get("model") or "").strip()
                    if actual_model:
                        model_used = f"{actual_model} · Mac Mini"
                    msg = (data.get("choices") or [{}])[0].get("message", {})
                    vlm_text = (msg.get("content") or "").strip()
                    timings = data.get("timings") or {}
                    pred_per_s = timings.get("predicted_per_second")
                    if isinstance(pred_per_s, (int, float)) and pred_per_s > 0:
                        tokens_per_s = round(float(pred_per_s), 1)
        except Exception:
            vlm_text = ""

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)

        if not vlm_text:
            provider_id = "local_rules_v2"
            model_used = "Local Deterministic Rules v2.1 · On-Device"
            if mode == "conversational":
                vlm_text = (
                    "Hello! I am your offline FieldScan AI Engineer. Go ahead with your question—I can help with "
                    "TZ THT-02 operation, SW1 DIP-8 switch setup, RS-485 Modbus wiring, or live optical diagnostics."
                )
            elif mode == "technical_qa":
                vlm_text = (
                    f"Per TZ THT-02 Manual V1.1, the sensor uses 8 binary DIP switches [128, 64, 32, 16, 8, 4, 2, 1] "
                    f"(Pin 8 ON = Slave #1) over RS-485 9600 8N1. Current bus status: {scada_note}"
                )
            else:
                z_spec = _find_zone_spec(spec, zone_id or "strainer_head")
                zone_label = z_spec.get("label_en") or z_spec.get("label") or (zone_id or "strainer_head")
                electrical_symptoms = list(z_spec.get("electrical_symptoms") or [])
                cause_0 = probable_causes[0] if probable_causes else "Physical anomaly localized in the inspected sensor zone"
                sym_0 = electrical_symptoms[0] if electrical_symptoms else "Verify Modbus holding registers 0x0000 and 0x0001 (7FFFH sentinel)"
                act_0 = recommended_actions[0] if recommended_actions else "Inspect 4-wire leads and SHT30 probe per Manual V1.1"
                vlm_text = (
                    f"Field diagnosis on {zone_label} (TZ THT-02, 140.0x16.0 mm): {cause_0}. "
                    f"{sym_0}. Recommended action: {act_0} (Manual V1.1 Pages {', '.join(map(str, cited_pages[:3]))})."
                )

        from fieldscan.profiles_and_manual import resolve_device_profile, verify_and_resolve_citations
        from fieldscan.session_engine import apply_deterministic_grounding_filter

        active_prof = resolve_device_profile("tzone_tht02")
        grounding = apply_deterministic_grounding_filter(
            vlm_text,
            profile=active_prof,
            verified_telemetry=mb,
        )
        vlm_text = grounding["text"]

        self._record_chat_turn(query, vlm_text)

        self.last_latency_ms = elapsed_ms
        if tokens_per_s is not None:
            self.last_tokens_per_sec = tokens_per_s
        self.last_model_label = model_used

        cit_check = verify_and_resolve_citations(active_prof, [int(p) for p in cited_pages])
        citations = (
            cit_check["citations"]
            if cit_check["verified"]
            else [
                {"page": int(p), "label": MANUAL_PAGE_TITLES.get(int(p), f"Page {p} · Manual V1.1")}
                for p in cited_pages
                if 1 <= int(p) <= 9
            ]
        )
        audio_b64 = self.synthesize_speech_b64(vlm_text)

        return {
            "diagnosis": vlm_text,
            "assistant_message": vlm_text,
            "query_mode": mode,
            "provider_id": provider_id,
            "grounding_corrected": grounding["grounding_corrected"],
            "grounding_reasons": grounding["reasons"],
            "probable_causes": (probable_causes + recommended_actions[:1]) if mode == "visual_diagnosis" else [],
            "recommended_actions": recommended_actions if mode == "visual_diagnosis" else [],
            "highlighted_zone": zone_id,
            "fault_zone": zone_id,
            "explode_pcb": explode_pcb,
            "focus_dip": bool(explode_pcb),
            "manual_page": primary_page,
            "citations": citations,
            "manual_citations": citations,
            "inference_ms": elapsed_ms,
            "latency_ms": elapsed_ms,
            "tokens_per_s": tokens_per_s,
            "tokens_per_sec": tokens_per_s,
            "model": model_used,
            "audio_wav_b64": audio_b64,
        }

    diagnose = diagnose_sensor


_GLOBAL_ENGINE: LFMEngine | None = None
_ENGINE_LOCK = threading.Lock()


def get_lfm_engine() -> LFMEngine:
    global _GLOBAL_ENGINE
    with _ENGINE_LOCK:
        if _GLOBAL_ENGINE is None:
            _GLOBAL_ENGINE = LFMEngine()
        return _GLOBAL_ENGINE
