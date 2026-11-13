# 03 — Pegamento Geométrico: Manual PDF 2D (`TZ THT-02`) ↔ `Three.js` 60 FPS ↔ AutoCAD `.DXF`/`.STL`

Este documento detalla cómo se conectan el **plano esquemático 2D del PDF**, el **escáner `OpenCV`** y el **gemelo paramétrico `Three.js` + exportador CAD** usando un único sistema de coordenadas compartido en milímetros reales.

---

## 1. Sistema de Coordenadas Unificado (`1 unidad = 1.0 mm`)

El error más frecuente al unir visión por computadora con `Three.js` y `AutoCAD DXF` es que cada módulo use escalas o centros distintos. Aquí todos comparten **exactamente el mismo eje longitudinal `Z` centrado en `0.0 mm`** (`[-70.0 mm, +70.0 mm] = 140.0 mm` totales, diámetro exterior `Ø16.0 mm` de la página 9 del manual):

| ID de Zona Canónico | Rango `Z (mm)` | Parte Física Real (`TZ THT-02`) | Página Manual | Falla Típica Detectada |
| :--- | :---: | :--- | :---: | :--- |
| `strainer_head` | `+42` a `+70` | Jaula ranurada + filtro sinterizado inox + chip `SHT30` | Pág. 1, 3, 6 | Obstrucción/condensación → Registro `0x0000`/`0x0001` devuelve **`7FFF H` (`Abnormal`)** |
| `upper_seal_ring` | `+38` a `+42` | Anillo O-ring negro superior | Pág. 1 | Pérdida de sello ambiental |
| `upper_barrel_dip` | `0` a `+38` | Cilindro medio desenroscable + **PCB azul con DIP-8 (`128..1`)** | Pág. 5, 6 | Carcasa abierta / dirección Modbus DIP mal configurada (ej. `1,3,4 ON = 176`) |
| `mounting_flange` | `+8` a `+28` | Abrazadera mural (`42 mm` ancho, 2 agujeros `Ø4.2 mm`) | Pág. 1 | Fractura mecánica de oreja de sujeción |
| `lower_barrel_rs485` | `-50` a `0` | Cuerpo inferior (transceptor RS-485 `5~24V DC`, `5 mA`) | Pág. 3, 4, 8 | Sin respuesta Modbus / CRC-16 (`0xA001`) |
| `waterproof_gland_leads` | `-70` a `-50` | Prensaestopas impermeable + cable `1 m` (`Rojo V+`, `Negro GND`, `Amarillo A+`, `Verde B-`) | Pág. 1, 4, 5 | Prensaestopas flojo o falta de tierra común `GND` (voltaje en modo común RS-485) |

---

## 2. Cómo `Three.js` Funciona 100% Sin Internet (Cero CDNs)

**Trampa mortal cuando apagan el Wi-Fi**: Si cargas `three.js` desde `unpkg.com` o `cdn.jsdelivr.net`, al cortar el Wi-Fi la pantalla queda en blanco.

**Pegamento probado**:
1. Extraer localmente `three.module.min.js` → `static/vendor/three.module.js`, `OrbitControls.js` y `STLExporter.js`.
2. Reemplazar el import interno bare specifier `from 'three'` por ruta relativa local:
   ```bash
   sed -i "s|from 'three'|from './three.module.js'|g" static/vendor/OrbitControls.js static/vendor/STLExporter.js
   ```
3. Importar en `static/app.js` directamente desde `/static/vendor/...` — **cero peticiones externas**.

---

## 3. Exportación Instantánea AutoCAD `.DXF` + `.STL` (`< 60 ms`)

Como el usuario solo dispone del PDF 2D (sin CAD previo del fabricante), `src/fieldscan/cad_exporter.py` construye desde `THT02_spec.json`:
- **`.DXF` R2010 (`ezdxf`)**: Vista lateral acotada (`140.0 MM × 16.0 MM`) + sección frontal con brida de montaje (`42.0 MM`) + capa roja `FAULT_CALLOUT` señalando exactamente el tramo `z_start_mm..z_end_mm` dañado. Abre directo en **AutoCAD, LibreCAD, FreeCAD o DWG TrueView**.
- **`.STL` Binario 3D**: Sólido mallado a escala real `1:1` en milímetros para revisión 3D o impresión de repuesto en planta.
