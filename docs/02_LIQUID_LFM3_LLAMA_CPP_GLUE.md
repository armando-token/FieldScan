# 02 — Pegamento de IA Local: Liquid AI (`LFM3-VL-2B` + `LFM3-Audio-2B`) ↔ `llama.cpp`

Este documento contiene los **hallazgos reales descubiertos al probar los modelos en vivo** para que mañana la conexión entre Python y Liquid AI funcione al primer intento y sin errores silenciosos.

---

## 1. Binarios Precompilados Exactos (Cero Compilación C++ en el Hackathon)

`ggml-org/llama.cpp` (`b12328` / `v0.9.0+`, requerido por la arquitectura `LFM3`) publica binarios listos para correr:
- **En Qualcomm Dragonwing IQ-9075 (`aarch64` / Ubuntu ARM64)**:
  - Opción optimizada Snapdragon: `llama-b12328-bin-linux-arm64-snapdragon.tar.gz`
  - Respaldo ARM64 genérico: `llama-b12328-bin-ubuntu-arm64.tar.gz`
- **En Laptop / Servidor Linux `x86_64`**:
  - `llama-b12328-bin-ubuntu-x64.tar.gz`

### Trampa #1 descubierta y resuelta: `LD_LIBRARY_PATH`
Al descomprimir el `.tar.gz`, `llama-server` busca `libllama.so`, `libggml.so` y `libmtmd.so` en su misma carpeta. Siempre exportar:
```bash
export LD_LIBRARY_PATH="/ruta/a/llama-b12328:${LD_LIBRARY_PATH:-}"
```

---

## 2. Pesos Oficiales `GGUF` de Liquid AI (`~2.34 GB` en disco, `~3.0 GB` en RAM total)

Descargar **ANTES** de que apaguen el Wi-Fi:
1. **Visión + Planos 2D + Diagnóstico (`1.19 GB` total)**:
   - Repo: `LiquidAI/LFM3-VL-2B-GGUF`
   - Modelo: `LFM3-VL-2B-QAD-Q4_0.gguf` (`1,001 MB` — *Quantization-Aware Distillation*)
   - Proyector visual obligatorio: `mmproj-LFM3-VL-2B-Q8_0.gguf` (`193.6 MB`)
2. **Reconocimiento de Voz Offline en Español (`1.15 GB` total)**:
   - Repo: `LiquidAI/LFM3-Audio-2B-GGUF`
   - Modelo: `LFM3-Audio-2B-Q4_0.gguf` (`1,001 MB`)
   - Proyector de audio obligatorio: `mmproj-LFM3-Audio-2B-Q4_0.gguf` (`153.9 MB`)
3. **Voz Hablada Neuronal en Español (`< 60 ms`, `~60 MB`)**:
   - `rhasspy/piper-voices` -> `es/es_ES/davefx/medium/es_ES-davefx-medium.onnx` + `.onnx.json`

---

## 3. Trampa Crítica #2 Descubierta en Pruebas Reales: `LFM3-VL-2B` y el Modo *Thinking*

**Qué rompe si no pones este pegamento**:
Por defecto, `LFM3-VL-2B` activa razonamiento interno (`<think>...</think>`). Si llamas a `/v1/chat/completions` con `max_tokens: 90` sin apagar el modo *thinking*, el modelo gasta los 90 tokens en `message.reasoning_content` y **devuelve `message.content = ""` (vacío)** además de tardar el triple.

**Solución exacta verificada**:
1. Arrancar `llama-server` con:
   ```bash
   llama-server \
     -m LFM3-VL-2B-QAD-Q4_0.gguf \
     --mmproj mmproj-LFM3-VL-2B-Q8_0.gguf \
     --host 127.0.0.1 --port 8091 \
     -c 2048 -t 6 \
     --image-max-tokens 128 \
     --reasoning off \
     --reasoning-budget 0 \
     --no-reasoning-preserve
   ```
2. Y en cada request JSON desde Python incluir:
   ```json
   "chat_template_kwargs": {"enable_thinking": false}
   ```
3. Redimensionar la imagen JPEG a `<= 512px` antes de codificarla en Base64: reduce los tokens visuales a `~128` y acelera la lectura del plano/cámara por **3×** sin perder detalle del parche ni de las cotas (`140MM × 16MM`).

---

## 4. Trampa Crítica #3: Proxy Local y Formato de Audio del Navegador

1. **`httpx.AsyncClient(trust_env=False)`**: Si el entorno Linux tiene variables `HTTP_PROXY` configuradas, Python puede intentar mandar `http://127.0.0.1:8091` al proxy y fallar cuando corten el Wi-Fi. `trust_env=False` garantiza conexión directa por loopback `127.0.0.1`.
2. **Conversión `WebM/Opus -> WAV 16kHz Mono` con `ffmpeg`**:
   El `MediaRecorder` de Chrome/Firefox en Linux graba por defecto en contenedor `audio/webm;codecs=opus`, pero `LFM3-Audio-2B` exige `WAV PCM 16 kHz mono`. Convertir siempre en memoria con `ffmpeg -i pipe:0 -ar 16000 -ac 1 -f wav pipe:1` elimina el 100% de errores `400 Bad Request` de audio.
3. **Coincidencia Fonética de Códigos (`THS 00` / `THP02` / `THT-02`)**:
   Al hablar rápido en español *"THT cero dos"*, el ASR puede transcribir `"THP02"`, `"THT 02"` o `"THS 00"`. Nuestro `pdf_ingest.py` normaliza fonéticamente todas esas variantes hacia `TZ-THT-02`.
