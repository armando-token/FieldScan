# 07 — Guía de Prueba Local en tu Mac Mini (Cámara Acer 4K + `FT2232HL` RS-485 + `TZ THT-02`)

Esta guía te permite correr **exactamente el mismo sistema completo de forma 100 % local en tu Mac Mini hoy mismo**, conectando tus equipos físicos reales por USB y ensayando incluso con el **Wi-Fi apagado**.

---

## ¿Por qué correrlo directo en tu Mac Mini es 10× mejor que hacer un túnel a la VM remota?

1. **Acceso USB nativo al bus industrial RS-485 (`FT2232HL`)**: El convertidor `FT2232HL` crea puertos serie físicos (`/dev/cu.usbserial-*`) en el kernel de tu Mac Mini. Un navegador o túnel HTTP hacia una VM en la nube **no puede pasar líneas diferenciales `RS-485 A+/B-` ni puertos serie `/dev/cu.*`** a Python remoto sin instalar demonios puente (`ser2net`/`socat`) que no existirán mañana en el hackathon.
2. **Aceleración GPU Apple Silicon (`Metal`)**: `scripts/download_assets.sh` descarga automáticamente el binario oficial `llama-b12328-bin-macos-arm64.tar.gz` (o `macos-x64`) y `scripts/start_all.sh` activa `-ngl 99` sobre Metal. `LFM3-VL-2B` y `LFM3-Audio-2B` corren a **60–100+ tokens/s** en tu Mac Mini.
3. **Cámara Acer 4K UVC nativa (`AVFoundation`) + Micrófono**: `vision_scanner.py` detecta `Darwin` y abre tu cámara USB 4K vía `cv2.CAP_AVFOUNDATION` sin latencia de red.
4. **Ensayo real de "Modo Avión"**: Una vez descargados los modelos en tu Mac Mini, puedes **apagar el Wi-Fi de tu Mac Mini** y ensayar la demo completa de 3 minutos tal cual sucederá mañana a las 8:30 PM.

---

## Paso 1 — Conecta tu Hardware Físico a la Mac Mini

1. Conecta la **cámara USB Acer 4K** a un puerto USB de la Mac Mini.
2. Cablea tu sensor **`Tzone TZ THT-02`** al convertidor **`FT2232HL` (Canal 1 / `CH-A`)** y a tu **fuente DC (`5V–24V`)**:
   - **Rojo (`VDD`)** → `+` de la fuente DC (`12V` recomendado; soporta `5V..24V`).
   - **Negro (`GND`)** → `-` de la fuente DC **y** `GND` del canal 1 del `FT2232HL`.
   - **Amarillo (`RS485 A+`)** → `A+` del canal 1 del `FT2232HL`.
   - **Verde (`RS485 B-`)** → `B-` del canal 1 del `FT2232HL`.
3. Conecta el USB del **`FT2232HL`** a la Mac Mini (puedes dejar la fuente DC apagada al inicio para simular la falla real y encenderla en vivo cuando la IA te lo pida).
4. Verifica en Terminal de macOS que el chip FTDI aparece (macOS ya trae el driver integrado):
   ```bash
   ls -l /dev/cu.usbserial*
   ```

---

## Paso 2 — Descarga e Inicia (3 Comandos en Terminal de tu Mac Mini)

```bash
# 1. Clona el repositorio (o entra a la carpeta fieldscan_tht02)
cd fieldscan_tht02

# 2. (CON WI-FI ENCENDIDO — toma ~2 min en fibra)
# Descarga llama.cpp nativo para macOS + LFM3-VL-2B + LFM3-Audio-2B + Voz Piper + pyserial
./scripts/download_assets.sh

# 3. (OPCIONAL PERO RECOMENDADO: ¡APAGA EL WI-FI DE LA MAC MINI AQUÍ PARA ENSAYAR!)
# Levanta LFM3-VL (:8091) + LFM3-Audio (:8092) + FieldScan CAD Studio (:8088)
./scripts/start_all.sh
```

Una vez que veas `Application startup complete` en la terminal de tu Mac Mini, abre Chrome o Safari en tu Mac Mini en el puerto `8088` de loopback local.

---

## Paso 3 — Guion Exacto para tu Ensayo con el Sensor Real esta Noche

1. En la barra superior del visor, cambia el selector de cámara a **`📷 Cámara USB Real`** para ver tu sensor físico bajo la cámara Acer 4K.
2. En la tarjeta **`TELEMETRÍA MODBUS-RTU`**, pulsa **`🔌 Escanear USB-RS485`** (o selecciona `🔌 Bus Físico FT2232HL`). Con la fuente DC apagada o los pines DIP mal puestos, verás `SIN SEÑAL`.
3. Abre la tapa del sensor o muéstralo a cámara y pulsa **`🔧 1. Inspeccionar Falla`** (o usa **`🎙️ Hablar con IA`** y di: *"Encontré este sensor abierto y no enciende, ¿funciona?"*).
4. Pulsa **`🎛️ 2. Guiar DIP-8`** (o di: *"Lo necesito en modo Modbus estándar, mira los pines"*). La IA te indicará poner `1..7 OFF` y **Pin 8 `ON`** (`Slave 001`, `9600 8N1`).
5. Ajusta el Pin 8 en tu THT-02 físico y **enciende la fuente DC / enchufa el conector RS-485**.
   - **¡Sin tocar nada en la computadora!**, en menos de 1 segundo el sistema detectará las tramas reales del `FT2232HL`, mostrará la temperatura y humedad real de tu habitación (`°C` y `%RH`) y **te hablará en voz alta confirmando que la reparación quedó validada**.
   - Sopla suavemente sobre la punta porosa del sensor para ver subir `%RH` en tiempo real frente a tus ojos.
6. Pulsa **`📐 4. Dossier 4-Vistas Fabricante`** para generar las 4 capturas 3D acotadas + tira fotográfica Antes/Durante/Después + planos AutoCAD `.DXF` + `.STL` + correo `.EML` de validación al fabricante.
