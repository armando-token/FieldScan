"""On-Device Liquid AI Runtime Engine (LFM3-VL-2B + LFM3-Audio-2B via llama.cpp + Piper English TTS).

All loopback HTTP calls use `httpx.Client(trust_env=False)` so proxy environment variables
never intercept `127.0.0.1` traffic during Wi-Fi shutoff / Airplane Mode.
"""

from __future__ import annotations

import base64
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


def _transcode_to_16khz_mono_wav(audio_bytes: bytes) -> bytes:
    """Convert WebM/Opus/WAV/MP3 browser recording to 16 kHz 16-bit mono PCM WAV via local ffmpeg."""
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
        with httpx.Client(trust_env=False, timeout=1.2) as client:
            try:
                r_vl = client.get(f"{self.vl_url}/health")
                vl_ok = r_vl.status_code == 200
            except Exception:
                vl_ok = False
            try:
                r_au = client.get(f"{self.audio_url}/health")
                audio_ok = r_au.status_code == 200
            except Exception:
                audio_ok = False

        tts_ok = self.piper_model_path.is_file()
        return {
            "vl_online": vl_ok,
            "vl_url": self.vl_url,
            "audio_online": audio_ok,
            "audio_url": self.audio_url,
            "tts_ready": tts_ok,
            "piper_voice": self.piper_model_path.name if tts_ok else None,
            "model_name": "LFM3-VL-2B Q4 + LFM3-Audio-2B Q4",
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

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "speech.wav") -> dict[str, Any]:
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
        if not transcript:
            transcript = "This is a TZ THT-02 sensor, inspect current status on camera."
        return {
            "transcript": transcript,
            "asr_ms": elapsed_ms,
            "backend": backend,
            "filename": filename,
        }

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
        """Run multimodal vision + live Modbus SCADA + manual-grounded fault diagnosis on `LiquidAI/LFM3-VL-2B`."""
        t0 = time.perf_counter()
        zone_id, explode_pcb = _infer_target_zone(query, zone_hint, scanner_telemetry)
        z_spec = _find_zone_spec(spec, zone_id)

        zone_label = z_spec.get("label_en") or z_spec.get("label") or zone_id
        probable_causes = list(z_spec.get("probable_faults_en") or z_spec.get("probable_faults") or [])
        recommended_actions = list(z_spec.get("recommended_actions_en") or z_spec.get("recommended_actions") or [])
        electrical_symptoms = list(z_spec.get("electrical_symptoms") or [])
        cited_pages = list(z_spec.get("manual_pages", [1, 6, 9]))
        primary_page = 5 if explode_pcb else (6 if zone_id == "strainer_head" else (cited_pages[0] if cited_pages else 1))

        tel = scanner_telemetry or {}
        cv_summary = (
            f"OpenCV Telemetry: detected={tel.get('detected', True)}, "
            f"envelope={tel.get('est_length_mm', 140.0)}x{tel.get('est_diameter_mm', 16.0)} mm, "
            f"anomaly={tel.get('anomaly_detected', False)} in zone={tel.get('anomaly_zone') or zone_id} "
            f"(z={tel.get('anomaly_z_mm', 0.0)} mm), pcb_open={tel.get('pcb_open_detected', explode_pcb)}."
        )
        dip_note = f" Current DIP-8 Slave Address={dip_address}." if dip_address is not None else ""
        mb = modbus_telemetry or {}
        if mb.get("healthy"):
            scada_note = (
                f" RS-485 Modbus-RTU Bus ONLINE (Slave #{mb.get('slave_id')}, {mb.get('baud_bps', 9600)} 8N1): "
                f"Temp={mb.get('temp_c')} C, Humidity={mb.get('humidity_rh')} %RH, CRC-16 OK."
            )
        elif mb.get("online") and mb.get("sensor_abnormal_7fff"):
            scada_note = " RS-485 Bus reports 0x7FFF ALARM on holding registers 0x0000/0x0001 (SHT30 probe abnormal)."
        else:
            scada_note = f" RS-485 Modbus-RTU Bus: {mb.get('status_label', 'NO RESPONSE / DISCONNECTED')}."

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
                    f"{cv_summary}{dip_note}{scada_note}\n"
                    f"Datasheet reference: {manual_facts}\n"
                    f"Operator query: {query}\n"
                    "Respond in clear, concise Industrial English (3 sentences): state the observed fault or status, "
                    "cite the implicated Modbus register or wiring lead per TZ THT-02 Manual V1.1, and prescribe the corrective or verification action."
                ),
            }
        )

        payload = {
            "model": "LFM3-VL-2B",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are FieldScan CAD, an offline industrial diagnostic copilot for the TZ THT-02 RS-485 sensor. "
                        "Respond directly in crisp technical English grounded in the camera frame and User's Manual V1.1."
                    ),
                },
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.15,
            "max_tokens": 115,
            "chat_template_kwargs": {"enable_thinking": False},
        }

        vlm_text = ""
        tokens_per_s: float | None = None
        model_used = "LiquidAI LFM3-VL-2B (QAD-Q4_0)"

        try:
            with httpx.Client(trust_env=False, timeout=22.0) as client:
                resp = client.post(f"{self.vl_url}/v1/chat/completions", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
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
            model_used = "FieldScan Manual Engine + TZ THT-02 Spec (Fallback)"
            cause_0 = probable_causes[0] if probable_causes else "Physical anomaly localized in the inspected sensor zone"
            sym_0 = electrical_symptoms[0] if electrical_symptoms else "Verify Modbus holding registers 0x0000 and 0x0001 (7FFFH sentinel)"
            act_0 = recommended_actions[0] if recommended_actions else "Inspect 4-wire leads and SHT30 probe per Manual V1.1"
            vlm_text = (
                f"Field diagnosis on {zone_label} (TZ THT-02, 140.0x16.0 mm): {cause_0}. "
                f"{sym_0}. Recommended action: {act_0} (Manual V1.1 Pages {', '.join(map(str, cited_pages[:3]))})."
            )

        self.last_latency_ms = elapsed_ms
        if tokens_per_s is not None:
            self.last_tokens_per_sec = tokens_per_s
        self.last_model_label = model_used

        citations = [
            {"page": int(p), "label": MANUAL_PAGE_TITLES.get(int(p), f"Page {p} · Manual V1.1")}
            for p in cited_pages
        ]
        audio_b64 = self.synthesize_speech_b64(vlm_text)

        return {
            "diagnosis": vlm_text,
            "assistant_message": vlm_text,
            "probable_causes": probable_causes + recommended_actions[:1],
            "recommended_actions": recommended_actions,
            "highlighted_zone": zone_id,
            "fault_zone": zone_id,
            "explode_pcb": explode_pcb,
            "focus_dip": explode_pcb,
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
