# 05 — Runbook de Recreación en 2 Horas (`6:30 PM – 8:30 PM`) + Guion Ganador (120 Segundos)

Este plan cronometrado evita cualquier bloqueo técnico mañana en **On-Device AI Hackathon: Cleared for Takeoff ✈️ (Qualcomm × Liquid AI)** con el nuevo flujo v2.0 (**Autodiagnóstico en Vivo + Reparación Guiada DIP-8 + Validación SCADA `FT2232HL` RS-485 + Dossier 4-Vistas al Fabricante**).

---

## Antes de que Apaguen el Wi-Fi (`5:30 PM – 6:35 PM` · Pre-vuelo obligatorio)

1. **Enchufar hardware al Qualcomm IQ9 (`IQ-9075`) vía Hub USB-C**:
   - **Cámara Acer 4K USB** (destapar cobertor físico de privacidad de la lente).
   - **Convertidor Industrial `FT2232HL` USB a 2CH RS-485** cableado al `TZ THT-02` (`Amarillo→A+`, `Verde→B-`, `Rojo→+Fuente DC`, `Negro→GND común`).
   - Dar permisos instantáneos al puerto serie en Linux:
     ```bash
     sudo chmod 666 /dev/ttyUSB*
     ls -l /dev/video* /dev/ttyUSB*
     ```
2. **Pre-cachear binarios y modelos (mientras hay Wi-Fi rápido)**:
   ```bash
   ./scripts/download_assets.sh
   ```
   *(O copiar tu carpeta `vendor/` de `2.4 GB` desde un pendrive USB-C como respaldo instantáneo).*

---

## Construcción Orgánica en las 2 Horas (`6:30 PM – 8:30 PM`)

| Minuto | Bloque | Qué se conecta ("El Pegamento") | Verificación rápida |
| :---: | :--- | :--- | :--- |
| `00–20` | **Bloque 1: Motor Liquid AI** | Levantar `llama-server` en `127.0.0.1:8091` (`LFM3-VL-2B`, `--reasoning off --reasoning-budget 0`) y `127.0.0.1:8092` (`LFM3-Audio-2B`). | `curl --noproxy '*' http://127.0.0.1:8091/health` → `{"status":"ok"}` |
| `20–45` | **Bloque 2: Ficha PDF + Bus Modbus-RTU** | Conectar `pdf_ingest.py` (`THT02_Users_Manual_v1.1.pdf`) y `modbus_rtu.py` (`FT2232HL`, CRC-16 `0xA001`, trama `01 03 00 00 00 08 44 0C`, matemática DIP-8). | Ver `01 03 00 00 00 08 44 0C` y lectura real `°C / %RH`. |
| `45–75` | **Bloque 3: Cámara 30 FPS + Coordinador de Reparación** | Conectar `vision_scanner.py` + `live_repair.py` + `cad_exporter.py` (evidencia Antes/Durante/Después + lámina 4-ángulos + `.DXF`/`.STL`/`.EML`). | Probar transición reactiva cero-clic al energizar el sensor. |
| `75–105` | **Bloque 4: Estudio Three.js 60 FPS + Tarjeta SCADA** | Conectar `server.py` (`127.0.0.1:8088`) con `static/index.html` + `static/app.js` (gemelo 3D explosivo, palancas DIP-8 animadas, tarjeta SCADA en vivo). | Rotar gemelo 3D a 60 FPS y ver capturas WebGL de 4 vistas. |
| `105–120` | **Bloque 5: Simulacro Final en Modo Avión** | **Apagar nosotros mismos el Wi-Fi 15 min antes que los jueces**, poner el THT-02 abierto con DIP mal puesto y fuente apagada, y ensayar 3 veces. | Badges `MODO AVIÓN: VERIFICADO` y `MODBUS: EN LÍNEA` listos. |

---

## Guion Exacto de Demo en Vivo Frente a los Jueces (`8:30 PM` · 120 Segundos)

1. **`0:00 – 0:20` · El Caso Real en Planta (con el `TZ THT-02` abierto y apagado en tu mano)**:
   > *"Imaginen una planta minera, un buque o un hangar sin internet. Encontramos este transmisor industrial `TZ THT-02` abierto, desconfigurado y muerto en la línea RS-485. No tenemos nube ni archivos CAD, solo un PDF técnico en 2D y este Qualcomm IQ9."*
2. **`0:20 – 0:50` · Autodiagnóstico Visual + Voz en Tiempo Real (Etapas 1 y 2)**:
   - Muestras el sensor abierto bajo la **Acer 4K** y hablas: **"Encontré este sensor abierto y no funciona. Lo necesito en modo Modbus estándar, mira los pines."**
   - El gemelo **Three.js 60 FPS se explota solo** mostrando la PCB interna y el bloque DIP-8; la IA cruza la cámara con la Página 4 del manual y **te responde hablándote**: *"La carcasa está abierta, no hay señal RS-485 y los pines DIP están mal configurados. Para Modo Modbus Esclavo 1 a 9600 bps, baja los pines 1 al 7 a OFF y sube únicamente el Pin 8 a ON. Luego enchúfalo."*
3. **`0:50 – 1:30` · El Momento Mágico "Cero-Clic" (Reparación Física + SCADA en Vivo)**:
   - Frente a los jueces, mueves el **Pin 8 a ON** con un destornillador fino y **enciendes la fuente / enchufas el conector al `FT2232HL`**.
   - **¡Sin tocar el teclado ni el mouse!**, el Qualcomm IQ9 detecta tramas Modbus-RTU reales (`CRC-16 OK`), cierra el gemelo 3D, pinta la temperatura y humedad reales de la sala en pantalla y **la IA habla sola**: *"¡Conectado y funcionando correctamente! Ya recibo señal válida en el esclavo 1..."*
   - Soplas suavemente sobre la punta del sensor → **la humedad `%RH` sube en vivo en la pantalla frente a los jueces**.
4. **`1:30 – 2:00` · Cierre Ejecutivo: Dossier 3D de 4 Ángulos + Planos AutoCAD para Garantía**:
   - Pulsas **`📐 4. Dossier 4-Vistas Fabricante`**: el sistema toma 4 planos 3D acotados (`Isométrica`, `Frontal 140×Ø16 mm`, `Explotada DIP-8`, `Prensaestopas IP65`), adjunta las fotos **Antes / Durante / Después**, exporta `.DXF` + `.STL` y deja en bandeja offline el correo técnico preguntándole al fabricante si la intervención conserva garantía IP65.
