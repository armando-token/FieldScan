# 06 — Pegamento USB-RS485 (`FT2232HL`), Autodiagnóstico Guiado DIP-8 y Dossier Post-Reparación

Este documento cubre el pegamento exacto entre el **convertidor industrial USB a 2CH RS-485 (`FT2232HL`)**, el transmisor físico **`Tzone TZ THT-02`**, el motor reactivo de voz offline y el generador de **Dossier 3D Multi-Ángulo de Conformidad**.

---

## 1. Cableado Físico Exacto (`TZ THT-02` ↔ `FT2232HL` + Fuente DC)

Según la **Página 4, Sección 3.2 del Manual TZ THT-02 V1.1**:

| Color de Cable (`THT-02`) | Función | Destino Físico en Mesa de Pruebas |
| :--- | :--- | :--- |
| **Rojo (`Red`)** | `VDD` (`DC 5V ~ 24V`) | Positivo `+` de tu fuente DC (`5V`, `12V` o `24V`, mín. `500 mA`) |
| **Negro (`Black`)** | `GND` | Negativo `-` de la fuente DC **unido en común** al `GND` del canal usado en el `FT2232HL` |
| **Amarillo (`Yellow`)** | `RS-485 A+` (`D+`) | Borne `A+` (Canal 1 / `CH-A` del convertidor `FT2232HL`) |
| **Verde (`Green`)** | `RS-485 B-` (`D-`) | Borne `B-` (Canal 1 / `CH-A` del convertidor `FT2232HL`) |

> **Trampa clásica de Hackathon #1 (Doble puerto FT2232HL)**: El chip **`FT2232HL`** (`VID=0x0403`, `PID=0x6010`) expone **dos** puertos serie simultáneos:
> - En **Linux / Qualcomm IQ-9075**: `/dev/ttyUSB0` (CH-A) y `/dev/ttyUSB1` (CH-B).
> - En **macOS (Mac Mini)**: `/dev/cu.usbserial-XXXX0` y `/dev/cu.usbserial-XXXX1`.
> Nuestro módulo `src/fieldscan/modbus_rtu.py` (`discover_rs485_ports()`) prioriza chips FTDI `0x0403` y **sondea automáticamente ambos canales**, por lo que no importa si conectas `A+/B-` en Canal 1 o Canal 2.

> **Trampa clásica de Hackathon #2 (Permisos `dialout` en Linux)**:
> En Ubuntu / Qualcomm Linux, `/dev/ttyUSB0` pertenece al grupo `dialout`. Antes de apagar el Wi-Fi o al conectar el USB por primera vez en la placa Qualcomm IQ-9075, ejecuta una sola vez:
> ```bash
> sudo chmod 666 /dev/ttyUSB*   # Efecto instantáneo sin reiniciar sesión
> ```
> En **macOS (Mac Mini)** no hace falta `sudo`: los dispositivos `/dev/cu.usbserial-*` son accesibles directamente por tu usuario con el driver FTDI nativo de Apple.

> **Trampa clásica de Hackathon #3 (Hub USB)**:
> Lleva un **Hub USB 3.0 pequeño** para conectar simultáneamente la **cámara Acer 4K USB** + el **lector `FT2232HL` USB-RS485** a la Qualcomm IQ-9075 o a tu Mac Mini.

---

## 2. Trama Modbus-RTU Exacta y Matemática DIP-8 (Páginas 4, 6 y 7 del Manual)

- **Puerto serie**: `9600 bps`, `8` bits de datos, paridad `None`, `1` bit de parada (`8N1`).
- **Sondeo (`Function 0x03`)**: Leer 8 registros desde `0x0000`:
  - Trama para `Slave = 1`: `01 03 00 00 00 08 44 0C` (CRC-16 `0xA001` LSB-first verificado byte a byte contra el ejemplo de la Página 7 del manual).
- **Decodificación de Registros (Páginas 6 y 7 del Manual)**:
  - `Reg 0x0000`: Temperatura con signo en complemento a 2 en unidades de `0.1 °C` (ej. `253` → `25.3 °C`). Si vale `0x7FFF`, la sonda SHT30 está abierta/dañada (`sensor_abnormal_7fff = True`).
  - `Reg 0x0001`: Humedad relativa sin signo en unidades de `0.1 %RH` (ej. `562` → `56.2 %RH`; `0x7FFF` = anormal).
  - `Reg 0x0004`: Dirección esclava Modbus reportada por el bloque DIP-8 (`1..247`).
  - `Reg 0x0005`: Baudrate configurado (`4800`, `9600` o `19200` bps).
  - `Reg 0x0006 / 0x0007`: Versión de Hardware y Software del transmisor.
- **Configuración de Pines DIP-8 (Página 4, Sección 3.3 — `ON = 1`, pesos `128,64,32,16,8,4,2,1`)**:
  - Ej. Desconfigurado en `Slave 176` (`10110000`): pines **1, 3 y 4** en `ON`.
  - **Modo Estándar `Slave 001` (`00000001`)**: poner `1..7` en `OFF` y subir únicamente el **Pin 8 a `ON`**.

---

## 3. Flujo Reactivo de Reparación en Vivo (`src/fieldscan/live_repair.py`)

El coordinador `LiveRepairCoordinator` une Cámara + Gemelo 3D + Voz + Bus RS-485 en 4 etapas:

1. **Etapa 1 (`inspect_open` / `🔧 1. Inspeccionar Falla`)**:
   - Captura evidencia fotográfica **ANTES**, detecta carcasa abierta + DIP-8 en `10110000` (`Slave 176`) y bus RS-485 `SIN SEÑAL`, explota el modelo 3D en `Three.js` y responde con voz en español.
2. **Etapa 2 (`guide_dip` / `🎛️ 2. Guiar DIP-8`)**:
   - Captura evidencia **DURANTE**, calcula los pines exactos según el manual (`1..7 OFF`, **Pin 8 ON** = `Slave 001` @ `9600 8N1`), conmuta en vivo las palancas 3D del bloque DIP-8 y pide al operador enchufar el sensor al bus RS-485.
3. **Etapa 3 (Transición Reactiva Cero-Clic al enchufar el sensor RS-485)**:
   - Un hilo vigía consulta `ModbusRTUReader.get_telemetry()` cada `350 ms`.
   - En el instante en que el sensor físico responde tramas válidas por el `FT2232HL` (o pulsas `⚡ Enchufar Sensor` en banco), captura la foto **DESPUÉS**, cierra el ensamblaje 3D y **habla sola sin tocar ningún botón**: *"¡Conectado y funcionando correctamente! Ya detecto señal Modbus RTU válida en el esclavo 1..."*
4. **Etapa 4 (`signoff` / `📐 4. Dossier 4-Vistas Fabricante`)**:
   - Captura automáticamente **4 vistas 3D WebGL** (`Isométrica`, `Frontal Acotada 140×Ø16 mm`, `Explotada DIP-8`, `Lateral Prensaestopas IP65`), arma la lámina técnica `1280×800`, la tira fotográfica **Antes / Durante / Después**, los planos `.DXF` + `.STL` y encola el correo `.EML` (`X-FieldScan-SignOff-Request: TRUE`) solicitando validación de garantía y buenas prácticas al fabricante.
