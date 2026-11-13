# 04 — Pegamento de Voz y Bandeja de Escalación Offline (`Store-and-Forward Outbox`)

Este documento explica cómo resolver los dos puntos donde suelen fallar las demos multimodales cuando apagan el Wi-Fi del salón.

---

## 1. Cadena Completa de Voz 100% Local (Micrófono Acer 4K → `LFM3-Audio-2B` → `Piper TTS`)

```
[2 Mics Acer 4K USB]
   │  MediaRecorder (navegador en http://127.0.0.1:8088)
   ▼
[POST /api/voice (WebM/WAV)]
   │  ffmpeg pipe: convierte cualquier formato de navegador a PCM WAV 16 kHz Mono
   ▼
[llama-server :8092 — LiquidAI/LFM3-Audio-2B-Q4_0.gguf]
   │  System: "Perform ASR in Spanish." | User: input_audio base64
   ▼
[Texto Transcrito] ──► (Fuzzy Match THT-02 / THS-00  ó  Diagnóstico Multimodal LFM3-VL-2B :8091)
   ▼
[Piper Neural TTS (es_ES-davefx-medium.onnx en RAM)]
   │  Genera respuesta hablada natural en español en ~50 ms (WAV Base64)
   ▼
[Altavoces Laptop / Monitor HDMI + Resaltado Rojo en Three.js]
```

> **Nota importante de seguridad del navegador**: Chrome y Firefox permiten `navigator.mediaDevices.getUserMedia({ audio: true })` sin HTTPS **únicamente** cuando entras por **`http://127.0.0.1:8088`** o **`http://localhost:8088`** (nunca por IP LAN `192.168.x.x` sin TLS). Siempre abrir `http://127.0.0.1:8088`.

> **Seguro anti-ruido de salón**: Además del botón de micrófono real, la interfaz incluye **botones de disparo de 1 clic** con las 4 frases exactas de la demo por si hay música o aplausos fuertes durante los 2 minutos del pitch.

---

## 2. Cómo Funciona el "Envío al Fabricante / Ingeniería" con el Wi-Fi Apagado

Durante la prueba final del hackathon (*"We'll turn off the Wi-Fi"*), cualquier intento de conectar a `smtp.gmail.com` daría timeout o violaría la regla offline.

Por eso implementamos el patrón industrial real **`Store-and-Forward Outbox` (`outbox/` + `exports/`)**:
1. En `< 60 ms`, `POST /api/escalate` genera localmente:
   - `THT02_fieldscan_<id>.dxf` (plano técnico 2D/3D para AutoCAD con la zona dañada acotada en rojo),
   - `THT02_fieldscan_<id>.stl` (modelo 3D en milímetros reales),
   - `THT02_camera_evidence_<id>.png` (foto real de la cámara Acer 4K con el encuadre de falla de OpenCV),
   - `THT02_escalation_<id>.eml` (correo estándar RFC-5322 con adjuntos MIME incrustados, listo para abrir en cualquier cliente de correo o despachar automáticamente al reconectar red),
   - `THT02_escalation_bundle_<id>.zip` (paquete completo descargable por USB).
2. En la pantalla el jurado ve el **correo técnico completo ya redactado**, con sus archivos CAD adjuntos listos para descargar/abrir y el sello verde **`QUEUED IN OFFLINE OUTBOX (ZERO EXTERNAL SOCKETS)`**.
