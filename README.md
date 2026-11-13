# FieldScan CAD v2.0 — Closed-Loop Offline Twin, Live Repair & Modbus-RTU SCADA (`TZ THT-02`)

Sistema de ingeniería de campo **100 % On-Device / Offline (Modo Avión)** diseñado para **Qualcomm Dragonwing IQ-9075 (`IQ9`)**, **Mac Mini (`Apple Silicon Metal` / `Intel`)** y **Linux `x86_64`**, impulsado por **Liquid Foundation Models (`LFM3-VL-2B` & `LFM3-Audio-2B`)**.

## Arquitectura v2.0 (~3.0 GB RAM Total · Cero Internet)

1. **Escaneo de Video en Tiempo Real (`OpenCV` @ `30 FPS`, `< 4 ms/frame`)**:
   - Captura USB UVC (`Acer 4K` vía `CAP_V4L2` en Linux y `CAP_AVFOUNDATION` en macOS) + simulador de banco industrial con fotografías reales del manual `TZ THT-02`.
2. **Maestro Industrial USB-RS485 Modbus-RTU (`FT2232HL` Dual-Channel + `pyserial`)**:
   - Auto-descubre ambos canales del chip original **`FT2232HL`** (`/dev/ttyUSB0..1` en Linux, `/dev/cu.usbserial-*` en macOS), verifica tramas exactas de la Página 7 (`01 03 00 00 00 08 44 0C`, CRC-16 `0xA001`), lee temperatura (`0.1 °C`), humedad (`0.1 %RH`), centinela de sonda abierta (`0x7FFF`) y calcula interruptores `DIP-8` (`128..1`).
3. **Autodiagnóstico y Reparación Guiada "Cero-Clic" (`LiveRepairCoordinator`)**:
   - **Etapa 1**: Detecta carcasa abierta + pines `DIP-8` desconfigurados + bus RS-485 sin respuesta y explota el gemelo 3D en `Three.js` a `60 FPS`.
   - **Etapa 2**: Prescribe en voz alta la posición exacta de los pines (ej. `1..7 OFF`, **Pin 8 ON** para `Slave 001` @ `9600 8N1`).
   - **Etapa 3 (Reactiva Cero-Clic)**: Al enchufar el sensor al bus RS-485, detecta tramas válidas automáticamente, cierra el gemelo 3D, pinta `°C` y `%RH` en vivo y confirma por voz sin tocar el teclado.
4. **Dossier 3D Multi-Ángulo de Conformidad para el Fabricante (`Store-and-Forward Outbox`)**:
   - Captura **4 vistas WebGL 3D acotadas** (`Isométrica`, `Frontal 140×Ø16 mm`, `Explotada DIP-8`, `Prensaestopas IP65`), tira fotográfica **Antes / Durante / Después**, planos AutoCAD **`.DXF`** + **`.STL`** y correo `.EML` (`X-FieldScan-SignOff-Request: TRUE`) solicitando validación de garantía IP65 al fabricante.

## Arranque Rápido (Mac Mini / Qualcomm IQ-9075 / Linux)

```bash
# 1. Pre-descargar llama.cpp nativo para tu OS/CPU + LFM3-VL-2B + LFM3-Audio-2B + Voz Piper
./scripts/download_assets.sh

# 2. Iniciar todo el stack local en loopback (127.0.0.1:8091, :8092 y Web Studio :8088)
./scripts/start_all.sh
```

## Guías del "Pegamento" para Prueba en Mac Mini y Recreación en el Hackathon

- [`docs/01_HARDWARE_USB_CAMERA_GLUE.md`](docs/01_HARDWARE_USB_CAMERA_GLUE.md)
- [`docs/02_LIQUID_LFM3_LLAMA_CPP_GLUE.md`](docs/02_LIQUID_LFM3_LLAMA_CPP_GLUE.md)
- [`docs/03_PDF_TO_THREEJS_CAD_GLUE.md`](docs/03_PDF_TO_THREEJS_CAD_GLUE.md)
- [`docs/04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md`](docs/04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md)
- [`docs/05_HACKATHON_2H_RECREATION_RUNBOOK.md`](docs/05_HACKATHON_2H_RECREATION_RUNBOOK.md)
- [`docs/06_MODBUS_RS485_LIVE_REPAIR_GLUE.md`](docs/06_MODBUS_RS485_LIVE_REPAIR_GLUE.md)
- [`docs/07_MAC_MINI_LOCAL_TESTING_GUIDE.md`](docs/07_MAC_MINI_LOCAL_TESTING_GUIDE.md)
