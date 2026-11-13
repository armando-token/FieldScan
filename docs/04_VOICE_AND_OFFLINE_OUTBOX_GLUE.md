# 04 — Offline English Voice Loop & Store-and-Forward Outbox Glue

This document details how FieldScan CAD v2.0 solves the two failure points that break almost every multimodal field demo the moment venue Wi-Fi is switched off: **browser audio capture / offline speech synthesis** and **manufacturer warranty escalation without internet sockets**.

---

## 1. Complete 100% On-Device English Voice Chain (Acer 4K Dual Mics → `LFM3-Audio-2B` → `Piper Neural TTS`)

```text
[Acer 4K Dual USB Microphones]
   |  Browser MediaRecorder (http://127.0.0.1:8088)
   v
[POST /api/voice (WebM / MP4 / WAV)]
   |  In-memory ffmpeg pipe: normalizes any browser container to 16 kHz Mono PCM WAV
   v
[llama-server :8092 — LiquidAI/LFM3-Audio-2B-Q4_0.gguf]
   |  System: "Perform ASR in English." | User: input_audio Base64 (--reasoning off --reasoning-budget 0)
   v
[English Transcript] --> (Fuzzy Part Match THT-02 / THS-00  OR  Multimodal Diagnosis via LFM3-VL-2B :8091)
   v
[Piper Neural TTS (en_US-lessac-medium.onnx resident in RAM)]
   |  Synthesizes crisp spoken English operator guidance in < 60 ms (Base64 WAV)
   v
[Workstation / HDMI Speakers + Three.js v0.170 Red Fault Stain + 3-Tier Andon Stack Light]
```

> **Critical Browser Security Rule**: Chrome, Firefox, and Safari permit `navigator.mediaDevices.getUserMedia({ audio: true })` without TLS certificates **only** on **`http://127.0.0.1:8088`** or **`http://localhost:8088`** (never over raw LAN addresses like `192.168.x.x` without HTTPS). Always open the workstation at `http://127.0.0.1:8088`.

> **Loud Venue Fail-Safe**: Alongside live push-to-talk microphone capture, the HMI includes **1-click English voice-command preset buttons** covering the 4 canonical diagnostic and repair intents, guaranteeing rock-solid execution even if music or applause spikes during the 120-second pitch.

---

## 2. Manufacturer Warranty & Engineering Escalation With Wi-Fi Turned Off

During final hackathon judging (*"We'll turn off the Wi-Fi"*), any naive attempt to open a socket to `smtp.gmail.com` or a cloud webhook either hangs on DNS/TCP timeout or violates strict offline compliance.

FieldScan CAD v2.0 implements an authentic industrial **`Store-and-Forward Outbox` (`outbox/` + `exports/`)**:
1. In `< 60 ms`, `POST /api/escalate` and `POST /api/repair/signoff` generate locally on disk:
   - `THT02_fieldscan_<id>.dxf` (AutoCAD R2010 2D/3D engineering drawing with the damaged zone dimensioned in red on layer `FAULT_CALLOUT`),
   - `THT02_fieldscan_<id>.stl` (1:1 millimeter binary 3D solid mesh),
   - `THT02_quad_cad_<id>.png` (`1280×800` 4-angle WebGL 3D CAD sheet: `Isometric`, `Front Elevation 140×Ø16 mm`, `Exploded DIP-8`, and `IP65 Cable Gland`),
   - `THT02_camera_evidence_<id>.png` / `THT02_evidence_strip_<id>.png` (real Acer 4K camera frame and chronological **Before / During / After** inspection strip),
   - `THT02_escalation_<id>.eml` (standard RFC-5322 MIME message with `X-FieldScan-SignOff-Request: TRUE` and embedded CAD/photo attachments, ready to open in any desktop mail client or auto-dispatch when plant connectivity returns),
   - `THT02_escalation_bundle_<id>.zip` (single-click portable USB archive).
2. On screen, judges inspect the **fully drafted English engineering sign-off email**, live CAD download links, and the green verification badge: **`QUEUED IN OFFLINE OUTBOX (ZERO EXTERNAL SOCKETS)`**.
