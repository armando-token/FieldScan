# 01 — Pegamento de Hardware: Cámara USB Acer 4K UVC ↔ Qualcomm Dragonwing IQ-9075 (`IQ9`)

Este documento resume **únicamente los puntos exactos de conexión física y de software** entre la cámara **Acer 4K USB (Sony 1/2", PDAF, 2 Mics)** y la placa **Qualcomm Dragonwing IQ-9075 EVK (Ubuntu ARM64)** para evitar perder tiempo durante las 2 horas del hackathon.

---

## 1. Conexión Física (¡Crítico en el IQ-9075!)

Según el manual oficial del **Dragonwing IQ-9075 EVK (`80-90441-253`)**:
- La placa principal **NO tiene puertos USB-A rectangulares grandes**; expone:
  - **`JUSB0` (USB Type-C)**: USB 3.1 Gen 2 (soporta Host y Device).
  - **`JUSB1` (USB Type-C)**: USB 3.1 Gen 2 (**Modo Host dedicado — USAR ESTE PUERTO PREFERENTEMENTE**).
  - **`JUSB2` (Micro-USB)**: USB 2.0 Host.
- **Checklist de cables en mochila**:
  1. Cable **USB-C a USB-C** directo (o el cable original de la Acer 4K + **adaptador/hub USB-C macho a USB-A hembra**).
  2. Abrir la **tapa física de privacidad (*Privacy Cover*)** de la Acer 4K antes de iniciar la prueba.

---

## 2. Verificación Instantánea en Ubuntu Linux (10 segundos)

Al enchufar la cámara Acer 4K en `JUSB1`, el kernel Linux carga automáticamente `uvcvideo` (video) y `snd-usb-audio` (los 2 micrófonos integrados) **sin instalar drivers ni necesitar internet**:

```bash
# 1. Verificar nodo de video (/dev/video0)
ls -l /dev/video*

# 2. Verificar permisos del usuario actual (si da Permission Denied, usar grupo video)
id | grep -q video || sudo usermod -aG video $USER

# 3. Verificar que los 2 micrófonos con reducción de ruido de la Acer aparecen en ALSA
arecord -l
```

---

## 3. El "Pegamento" Exacto en OpenCV (Evitar Lag USB en 4K)

**Trampa común**: Si abres una cámara 4K (`3840×2160`) sin especificar códec en Linux V4L2, OpenCV negocia `YUYV` sin comprimir y cae a **`5 FPS` con `800 ms` de retraso**.

**Solución probada en `src/fieldscan/vision_scanner.py`**:
1. Abrir con backend explícito `cv2.CAP_V4L2`.
2. Forzar **`FOURCC = 'MJPG'`** ANTES de fijar resolución.
3. Fijar **`1280 × 720` a `30 FPS`** (`MJPEG`) y **`CAP_PROP_BUFFERSIZE = 1`** (descarta frames viejos para tener latencia cero en tiempo real):

```python
cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
```

---

## 4. Calibración Longitudinal del Sensor `TZ THT-02` en Mesa

- El sensor real `TZ THT-02` mide exactamente **`140.0 mm` de largo × `16.0 mm` de diámetro** (relación de aspecto `8.75 : 1`).
- Colocar el sensor sobre una **superficie oscura mate** (mesa oscura, mousepad negro o cartulina gris oscura) para que el cuerpo gris claro del `THT-02` tenga contraste limpio del 100% bajo las luces del salón.
- Para marcar una falla externa en vivo frente al jurado:
  - Usar un **pedazo pequeño de cinta roja/naranja o una X roja** sobre la **punta ranurada del filtro (`strainer_head`)** o sobre el **prensaestopas trasero (`waterproof_gland_leads`)**, **o desenroscar la mitad del cilindro** (Paso 2 de la pág. 5 del manual) para dejar visible la **placa PCB azul del DIP switch**.
- `OpenCV` proyecta la posición del parche/apertura sobre el eje mayor `[-70 mm, +70 mm]` en `< 4 ms` por cuadro y sincroniza el giro y la alerta roja en `Three.js` a `30–60 FPS`.
