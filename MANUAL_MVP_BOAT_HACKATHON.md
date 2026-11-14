# Industrial Datasheet para Boat Hackathon
## Manual de implementación del verificador de repuestos a bordo

**14 de noviembre de 2026 · Hora del evento: San Francisco**

**Demo inmediata:** ejecutar un verificador local de repuestos que usa modelos de interfaz basados en fichas oficiales, reproduce una falla y sigue funcionando en modo avión. El apéndice trae el programa completo para extraerlo con un comando. Usa Python 3.9 o posterior y un navegador. La ruta rápida genera un HTML que abres como archivo local. El motor calcula las doce combinaciones de la demo y las incorpora al HTML.

**Entrega de competencia:** completar las integraciones previstas de Boat.dev, Context.dev, NY Token Exchange y Teamily AI. La demo local usa datos precargados y simula una revisión de configuración. En la presentación, reporta cada integración como **planificada**, **probada con credenciales del evento** o **integrada en el flujo** según su estado real.

## 1. Arranque para presentar en minutos

### 1.1 Ejecutar el apéndice directamente

Guarda este Markdown en Descargas con el nombre `MANUAL_MVP_BOAT_HACKATHON.md`. Si está en otra carpeta, ajusta la primera ruta. En Terminal de macOS pega el bloque:

```bash
mvp_manual="$HOME/Downloads/MANUAL_MVP_BOAT_HACKATHON.md"
mvp_dir="$(mktemp -d "${TMPDIR:-/tmp}/boat-mvp.XXXXXX")"
awk '
  /^# BEGIN MVP_PY$/ { capture = 1; next }
  /^# END MVP_PY$/ { capture = 0; exit }
  capture { print }
' "$mvp_manual" > "$mvp_dir/mvp.py"
if test -s "$mvp_dir/mvp.py" && python3 "$mvp_dir/mvp.py" --self-test; then
  printf 'Carpeta del MVP: %s\n' "$mvp_dir"
  python3 "$mvp_dir/mvp.py" --html "$mvp_dir/demo.html" --open
fi
```

Si el navegador no se abre, abre a mano el `demo.html` de la ruta impresa. Puedes copiar ese único HTML a otra computadora y abrirlo directamente. Guarda también `mvp.py` si vas a convertirlo en un repositorio. En Linux o Windows con Python, copia el bloque del apéndice a `mvp.py` y ejecuta `python3 mvp.py --self-test` y `python3 mvp.py --html demo.html --open`. En Windows suele estar disponible `py -3`.

### 1.2 Guion de 60 a 90 segundos

| Acción | Resultado en pantalla | Qué decir |
|---|---|---|
| Abre **24 V · Config. v1 · 50 % de nivel** | Límite de **727,3 Ω**, carga conservadora de **320 Ω**, margen de **407,3 Ω**, señal nominal de **12 mA** y cuenta ideal de **13 824**. | “Este repuesto pasa la prueba de carga. Su equivalencia completa todavía requiere confirmar otros parámetros”. |
| Cambia a **12 V** | Límite de **181,8 Ω**, margen de **−138,2 Ω**. La lectura simulada se suprime porque el lazo está fuera de la envolvente validada. | “Coincide el tipo de señal. La fuente y la entrada instalada hacen fallar esta configuración”. |
| Regresa a **24 V**. Cambia entre **Tanque vacío** y **Cable abierto** | El tanque vacío entrega **4 mA** y cuenta ideal **0**. El cable abierto entrega corriente de lazo idealizada de **0 mA** y un estado de diagnóstico distinto. | “La aplicación distingue nivel cero de una rotura del circuito”. |
| Selecciona **24 V · Config. v2 sintética · 50 %** | La resistencia adicional simulada sube de **30 Ω a 475 Ω**. La carga conservadora sube a **765 Ω**, supera el límite y el margen pasa a **−37,7 Ω**. | “Podemos volver a probar un activo cada vez que cambia un dato de instalación. Este cambio es una simulación local”. |
| Activa modo avión, recarga y vuelve a **24 V · Config. v1** | El informe, los cálculos y las referencias guardadas siguen disponibles. Abrir la página OEM requiere Internet. | “La demo navega resultados calculados localmente. En la versión de a bordo el mismo motor aceptará nuevas configuraciones directamente”. |

Si solo tienes 30 segundos, muestra **24 V → 12 V → desconectar Wi‑Fi → 24 V**. Deja las fuentes visibles en pantalla. Usa la app como demostración de ingeniería en banco simulado. La aplicación expresa **compatibilidad del lazo evaluado** y **equivalencia del repuesto** como dos resultados distintos.

### 1.3 Añadir IA si ya tienes acceso

**Con tu suscripción:** abre ChatGPT o tu asistente habitual en otra ventana. En el MVP pulsa **Exportar resultado JSON** y pega su contenido cuando tengas conexión. Usa este prompt:

> Resume en tres frases el informe JSON para un ingeniero naval. Usa únicamente el informe. Conserva el dictamen eléctrico, el margen calculado y las comprobaciones pendientes. Identifica qué datos son del fabricante y cuáles son sintéticos. Responde en inglés si te lo solicito.

La salida es una explicación del cálculo local. El JSON es el resultado original. La suscripción de ChatGPT y la facturación de la API se gestionan por separado. [Ayuda oficial de ChatGPT Plus](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus)

**Con tu propia clave de API:** puedes usar temporalmente un proveedor que ya tengas autorizado. Añade un adaptador separado con el contrato `explain(report) -> text`, variables `AI_BASE_URL`, `AI_MODEL` y `AI_API_KEY` leídas desde un proceso de servidor o CLI, tiempo límite de 8 segundos y un retorno local si falla. Envía solo el JSON de la demo. Para NYTE crea el adaptador confidencial indicado en la sección 4. El apéndice implementa la exportación y el motor. La conexión API y la explicación dentro de la app quedan como integración posterior.

## 2. Qué calcula este MVP

- **Equipo de referencia:** WIKA LS‑10. La ficha oficial identifica una salida 4–20 mA. Su variante instalada es un dato simulado que todavía requiere confirmar el código de pedido y el rango. [WIKA LS‑10](https://www.wika.com/en-en/ls_10.WIKA)
- **Repuesto candidato:** Endress+Hauser Waterpilot FMX11, salida 4–20 mA de dos hilos. La información técnica documenta la carga máxima en función de la fuente y del consumo de diseño de hasta 22 mA. Usa la sección **Maximum load**, página 7 del documento consultado. Registra esa edición como evidencia del prototipo y comprueba su vigencia contra la página de producto antes de una publicación. [Producto oficial](https://www.us.endress.com/en/field-instruments-overview/pressure/Waterpilot-FMX11) · [Documento TI01524P consultado](https://bdih-download.endress.com/file/5cd7eb8d07ab2acb1a9c262c0519741d/TI01524PEN_0120.pdf#page=7)
- **Entrada evaluada:** Siemens SM 1231 AI **6ES7231-4HD32-0XB0**. Usa únicamente la columna del número de artículo indicado, el modo 4–20 mA y la cota conservadora de **290 Ω** para una impedancia especificada como **≥270 Ω y <290 Ω**. La cuenta ideal de la demo usa el intervalo nominal **0–27 648**. El estado de cable abierto se representa cualitativamente. [Especificaciones Siemens](https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/analog-signal-modules-sms/sm-1231-analog-input-module-specifications)

```text
Carga disponible total [Ω] = (V_fuente − 8 V) / 0,022 A
Carga evaluada [Ω] = 290 Ω + carga adicional sintética [Ω]
Margen [Ω] = carga disponible total − carga evaluada
Señal nominal [mA] = 4 + 16 × fracción de nivel
Cuenta ideal = redondear((señal nominal − 4) / 16 × 27648)
```

La carga adicional sintética agrupa cable y accesorios. Se descuenta una sola vez por comparación con la carga total admisible. La simulación incorpora una transferencia lineal, un punto nominal, un tanque vacío y una apertura idealizada. El comportamiento modelado cubre esos casos. Un ensayo real necesitaría la configuración exportada del PLC, la identificación de variante, la fuente bajo carga y la resistencia medida del ramal. Para dictaminar sustitución también se requieren rango y escala, geometría o montaje, materiales, condiciones ambientales y las aprobaciones que apliquen. La demo se abre como archivo local o mediante un servidor en loopback. Opera exclusivamente sobre configuraciones simuladas.

### Contratos del apéndice

| Entrada | Contrato | Resultado |
|---|---|---|
| `python3 mvp.py --html demo.html` | Precalcula las doce combinaciones con el mismo motor y exporta un archivo autónomo. | Resultado en la página, fuentes y exportación JSON. |
| Abrir `/` con `python3 mvp.py --port 8765 --open` | Modalidad opcional HTTP. El mismo motor recalcula cada consulta. | Interfaz local y acceso a la API. |
| `GET /api/check?voltage=24&revision=v1&scenario=nominal` | `voltage`: `12`, `24`. `revision`: `v1`, `v2`. `scenario`: `nominal`, `empty`, `open`. Cualquier valor desconocido devuelve 400. | Resultado eléctrico, margen, estado del circuito, simulación y evidencia. |
| `GET /health` | Proceso local. | `{"ok":true}` |
| `python3 mvp.py --self-test` | Pruebas internas con resultados esperados. | Seis escenarios y comprobación de entrada inválida. |

Si levantas la modalidad HTTP, prueba desde otra terminal:

```bash
curl -fsS 'http://127.0.0.1:8765/api/check?voltage=12&revision=v1&scenario=nominal' |
  python3 -m json.tool
```

## 3. Migración desde esta demo a la arquitectura completa

### 3.1 Contratos de datos y código

```text
industrial-datasheet/
  core/compatibility.py          # funciones puras del apéndice
  core/simulation.py             # curvas y fallas representadas
  schemas/device.schema.json     # perfil de producto y campos con evidencia
  schemas/installation.schema.json
  schemas/release.schema.json
  catalog/devices/               # JSON público normalizado
  fixtures/                      # configuración sintética y cambios de referencia
  worker/                        # monitoreo, ingesta, extracción, diff, publicación
  adapters/                      # Context, NYTE, revisión en Teamily
  edge/                          # SQLite, interfaz local, servidor MCP
  tests/                         # entradas, casos de oro y regresiones
```

- **Identidad del producto:** fabricante, número exacto de pedido, variante, revisión de hardware, firmware cuando aplique. Identificador estable del documento, revisión declarada, fecha oficial si existe y fecha de observación.
- **Evidencia por campo:** `value`, `unit`, `document_id`, `sha256`, `page` o `section`, `extraction_status`. Para un valor desconocido usa `null` y conserva el motivo. Mantén una estructura propia de entrada en JSON Schema y mapea las propiedades a AAS cuando agregues exportación interoperable. [Plantillas AAS de IDTA](https://github.com/admin-shell-io/submodel-templates)
- **Instalación privada:** `asset_id`, canal del PLC, variante instalada, fuente bajo carga, resistencia de cada elemento, escala, modo del canal y alarmas. Conserva esta información en el barco. El catálogo público contiene perfiles y referencias OEM. Publica copias de documentos completos cuando su redistribución esté autorizada.
- **Revisión reproducible:** cada veredicto incluye `catalog_version`, `rules_version`, `installation_version`, entradas, fórmula, comprobaciones, evidencias y estado de cobertura. Las notas de campo llevan procedencia de campo y se conservan como observaciones.
- **MCP como adaptador del motor:** expón `get_device`, `get_document`, `check_replacement` y `simulate_fault` con entradas y salidas estructuradas. Cada herramienta llama al mismo núcleo que la interfaz. Prueba con el cliente que llevarás al barco. [Especificación MCP](https://modelcontextprotocol.io/specification/) · [SDK oficial de Python](https://github.com/modelcontextprotocol/python-sdk)

### 3.2 Flujo de la fábrica documental

1. **Detectar:** registra páginas OEM permitidas y un job de reconciliación que vuelva a descargar los PDF enlazados. El monitor detecta cambios en la página. La descarga periódica y el SHA‑256 detectan un PDF reemplazado en la misma URL aunque la página permanezca igual.
2. **Persistir:** guarda el evento validado y deduplica por `(document_id, sha256)`. Responde al webhook tras persistir el evento. Un worker retoma jobs pendientes desde SQLite en la primera versión. Conserva tiempos, errores y número de intentos.
3. **Extraer:** Docling obtiene el contenido y los localizadores de página. NYTE propone valores y sus fuentes bajo el esquema. Trata el texto de entrada como datos. El proceso de extracción recibe permiso de lectura y devuelve propuestas sin permisos de publicación.
4. **Validar:** verifica esquema, unidades, identidad exacta, valores fuera de rango y referencia de cada dato crítico. Corre pruebas sobre las reglas y recalcula los escenarios afectados. Envía a revisión los conflictos y cambios de dictamen. Mantén el último paquete aprobado disponible mientras se revisa un candidato.
5. **Publicar:** genera un SQLite y un manifiesto con versión, fecha, tamaño y hash por archivo. Firma el manifiesto en la fase de distribución. En el barco valida la firma con la clave pública instalada y reemplaza el paquete de forma atómica. Conserva la versión anterior para recuperación. La interfaz muestra la última verificación de la copia local.

El agente puede proponer nuevos casos de prueba y correcciones de extracción ante fallas repetidas. Guarda las propuestas como diffs versionados, haz que CI ejecute casos esperados previamente fijados y exige revisión de los cambios que alteren una decisión de ingeniería. [Docling](https://github.com/docling-project/docling/releases) · [Patrón de mejora con trazas y evaluaciones](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop)

## 4. Integrar a los auspiciadores durante la semana

| Orden | Integración | Pasos concretos | Evidencia de aceptación |
|---|---|---|---|
| **1** | **Boat.dev** | Usa la VM del evento. Desde una sesión autorizada, sube el repositorio con el mecanismo habilitado y prueba el acceso con `boat exec` o `boat ssh`. Ejecuta `python3 mvp.py --self-test` en la VM. Agrega el worker y el directorio persistente de jobs y paquetes. El servidor del apéndice sigue siendo local. Para una demo remota, agrega un despliegue propio autenticado. | ID de VM, commit, log de pruebas y paquete generado en Boat.dev. [Quickstart oficial](https://docs.boat.dev/quickstart) |
| **2** | **Context.dev** | Usa una búsqueda real para resolver la página OEM y crea un monitor sobre una URL verificada. Empieza con un disparo manual o polling, y después recibe webhooks firmados mediante un endpoint autenticado por firma. En el worker valida el dominio de descarga y registra el hash del PDF. | ID de búsqueda o monitor, resultado OEM y traza de un job repetible. [Monitors](https://docs.context.dev/monitors/overview) · [Context.dev Docs](https://docs.context.dev/introduction) |
| **3** | **NY Token Exchange / Let’s Encrypt AI** | Configura el adaptador en el worker con endpoint `https://api.confidential.nytokenexchange.com/v1`, modelo habilitado para el evento y política `provider.min_privacy: "confidential"`. Usa el mecanismo documentado por el SDK para verificar la evidencia de atestación que corresponda. Haz primero una extracción real con un fragmento de un fabricante público y valida el JSON localmente. Si la ruta confidencial rechaza la llamada, conserva el error y deja el job pendiente de revisión. | Identificador de ejecución, política aplicada, ruta realmente usada, evidencia disponible y campo extraído con página. [API confidencial](https://nytokenexchange.com/confidential) · [SDK de verificación](https://github.com/Lore-Hex/trusted-router-py) · [Let’s Encrypt AI](https://letsencrypt.ai/?utm_source=luma) |
| **4** | **Teamily AI** | Crea un espacio privado con el agente nativo. Adjunta un diff técnico de datos públicos o sintéticos y pide evaluar el impacto en qué escenarios pasan o fallan. Conserva el artefacto de revisión. Si el evento habilita una API apropiada, conecta la cola de revisiones. El flujo manual con el agente nativo permite demostrar uso funcional mientras confirmas los permisos. | Informe del agente, datos de prueba revisados y decisión del revisor vinculada al job. [Teamily AI](https://teamily.ai/) |

**Prioridad para la tarde:** demo local, grabación, acceso a las credenciales, primera ejecución en Boat.dev y primera búsqueda en Context.dev. Continúa con extracción confidencial y revisión Teamily. Después integra la descarga del paquete y repite la demo con Internet desactivado. Registra las pruebas por servicio en el README.

**Entrega del evento:** conserva evidencia de código enviado desde un barco, la foto pública etiquetada y el enlace al video. La web oficial indicaba apertura de envíos el **14 a las 3:30 p. m.** y cierre el **20 a las 5:00 p. m.** o al llenar el cupo. El criterio de integración de la entrega final debe comprobarse en el portal del evento. [Sitio oficial](https://boathackathon.com/) · [Code Aboard en Luma](https://luma.com/boathackathon) · [Builder Harbor](https://boathackathon.com/builders)

## 5. Criterios para una demo lista

- [ ] Las pruebas locales cubren 24 V, 12 V, tanque vacío, cable abierto y cambio de configuración.
- [ ] Al cortar Internet y recargar, la pantalla sigue calculando y exportando evidencia.
- [ ] El video muestra el número de artículo del PLC, la fuente OEM, el cálculo y el estado de equivalencia pendiente.
- [ ] Los valores sintéticos están marcados y la explicación generada por IA conserva el estado técnico del JSON.
- [ ] La entrega enumera el estado real y la evidencia disponible de cada auspiciador.

## Apéndice ejecutable

```python
# BEGIN MVP_PY
import argparse
import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

SOURCES = [
    {
        "id": "WIKA-LS10",
        "title": "WIKA LS-10 · ficha de producto",
        "section": "Descripción: salida 4–20 mA.",
        "url": "https://www.wika.com/en-en/ls_10.WIKA",
    },
    {
        "id": "EH-TI01524P",
        "title": "Endress+Hauser FMX11 · TI01524P",
        "section": "Pág. 7, Maximum load: 8 V mínimos y 22 mA de diseño.",
        "url": "https://bdih-download.endress.com/file/5cd7eb8d07ab2acb1a9c262c0519741d/TI01524PEN_0120.pdf#page=7",
    },
    {
        "id": "SIEMENS-SM1231",
        "title": "Siemens SM 1231 AI · 6ES7231-4HD32-0XB0",
        "section": "Columna del artículo: modo 4–20 mA, impedancia 270–<290 Ω, rango nominal y diagnóstico.",
        "url": "https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/analog-signal-modules-sms/sm-1231-analog-input-module-specifications",
    },
]

ADDITIONAL_OHMS = {"v1": 30, "v2": 475}
LEVELS = {"nominal": 0.5, "empty": 0.0, "open": None}
INPUT_OHMS_BOUND = 290
TRANSMITTER_MIN_V = 8
DESIGN_CURRENT_A = 0.022
PLC_NOMINAL_MAX = 27648


def evaluate(voltage, revision, scenario):
    if voltage not in (12, 24) or revision not in ADDITIONAL_OHMS or scenario not in LEVELS:
        raise ValueError("Usa voltage=12|24, revision=v1|v2, scenario=nominal|empty|open.")

    additional = ADDITIONAL_OHMS[revision]
    load = INPUT_OHMS_BOUND + additional
    limit = (voltage - TRANSMITTER_MIN_V) / DESIGN_CURRENT_A
    passes = load <= limit
    level = LEVELS[scenario]

    if scenario == "open":
        circuit, signal, count = "open_circuit", 0.0, None
    elif not passes:
        circuit, signal, count = "outside_load_envelope", None, None
    else:
        signal = 4 + 16 * level
        count = round(level * PLC_NOMINAL_MAX)
        circuit = "empty_tank" if scenario == "empty" else "nominal"

    return {
        "schema_version": 1,
        "rules_version": "loop-load/1",
        "evidence_version": "demo-oem-snapshot/1",
        "demo_mode": "synthetic_installation",
        "reference_device": "WIKA LS-10 (variante instalada sin confirmar)",
        "candidate": "Endress+Hauser Waterpilot FMX11",
        "plc_module": "Siemens SM 1231 AI 6ES7231-4HD32-0XB0",
        "inputs": {
            "supply_v": voltage,
            "synthetic_installation_revision": revision,
            "plc_input_upper_bound_ohm": INPUT_OHMS_BOUND,
            "synthetic_additional_series_ohm": additional,
            "scenario": scenario,
        },
        "load_check": {
            "status": "pass" if passes else "fail",
            "formula": "(supply_v - 8 V) / 0.022 A",
            "available_ohm": round(limit, 3),
            "evaluated_ohm": load,
            "margin_ohm": round(limit - load, 3),
            "source_ids": ["EH-TI01524P", "SIEMENS-SM1231"],
        },
        "replacement_status": "insufficient_evidence" if passes else "incompatible_with_profile",
        "simulation": {
            "state": circuit,
            "level_fraction": level,
            "loop_signal_ma": signal,
            "plc_ideal_count": count,
        },
        "pending": [
            "Confirmar variantes y códigos de pedido, rango y escala.",
            "Confirmar materiales, montaje, cable real y aprobaciones aplicables.",
        ],
        "sources": SOURCES,
    }


def self_test():
    cases = [
        (24, "v1", "nominal", "pass", "nominal", 12.0, 13824, 407.273),
        (12, "v1", "nominal", "fail", "outside_load_envelope", None, None, -138.182),
        (24, "v1", "empty", "pass", "empty_tank", 4.0, 0, 407.273),
        (24, "v1", "open", "pass", "open_circuit", 0.0, None, 407.273),
        (24, "v2", "nominal", "fail", "outside_load_envelope", None, None, -37.727),
        (12, "v1", "open", "fail", "open_circuit", 0.0, None, -138.182),
    ]
    for voltage, revision, scenario, status, state, signal, count, margin in cases:
        report = evaluate(voltage, revision, scenario)
        load = report["load_check"]
        simulation = report["simulation"]
        actual = (load["status"], simulation["state"], simulation["loop_signal_ma"],
                  simulation["plc_ideal_count"], load["margin_ohm"])
        expected = (status, state, signal, count, margin)
        if actual != expected:
            raise AssertionError((voltage, revision, scenario, actual, expected))
        replacement = "insufficient_evidence" if status == "pass" else "incompatible_with_profile"
        if report["replacement_status"] != replacement or len(report["sources"]) != 3:
            raise AssertionError("Estado de sustitución o fuentes incorrectos.")
    try:
        evaluate(48, "v1", "nominal")
    except ValueError:
        print("OK: 6 escenarios y rechazo de entrada inválida")
    else:
        raise AssertionError("Se aceptó una tensión ajena a la demo.")


HTML = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verificador de repuestos a bordo</title>
<style>
:root { color-scheme: dark; background: #11181d; color: #eff4f4;
  font-family: Geist, Inter, system-ui, sans-serif; }
body { margin: 0; }
main { width: min(920px, calc(100% - 36px)); margin: 4vh auto; }
h1 { font-size: clamp(1.8rem, 5vw, 3rem); line-height: 1.1; margin: .3rem 0 .8rem; }
h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
p, li { line-height: 1.55; }
small, .secondary { color: #b4c4c9; }
section, form { border: 1px solid #33454d; background: #1b282f;
  border-radius: 12px; padding: 16px; margin: 14px 0; }
form { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
label { display: grid; gap: 6px; }
select, button { font: inherit; padding: 9px 12px; border: 1px solid #54717c;
  background: #152127; color: inherit; border-radius: 7px; }
button { cursor: pointer; }
button:disabled { opacity: .5; cursor: default; }
a { color: #94e4e2; }
.ok { color: #aaf0c2; }
.fail { color: #ffc09c; }
dl { display: grid; grid-template-columns: minmax(115px, 1fr) 1fr; gap: 7px 12px; }
dt, dd { margin: 0; }
dd { font-variant-numeric: tabular-nums; }
#sources li { margin-bottom: .6rem; }
</style>
</head>
<body>
<main>
  <small>Demo local · Instalación simulada</small>
  <h1>Verificador de repuestos a bordo</h1>
  <p class="secondary">Tanque de agua dulce · WIKA LS-10 → Waterpilot FMX11 · Siemens SM 1231 AI</p>
  <form id="controls">
    <label>Fuente del lazo <select id="voltage"><option value="24">24 V DC</option><option value="12">12 V DC</option></select></label>
    <label>Instalación <select id="revision"><option value="v1">Config. v1 · 30 Ω adicionales</option><option value="v2">Config. v2 sintética · 475 Ω</option></select></label>
    <label>Escenario <select id="scenario"><option value="nominal">Nivel al 50 %</option><option value="empty">Tanque vacío</option><option value="open">Cable abierto</option></select></label>
  </form>
  <section aria-live="polite">
    <h2 id="status">Calculando…</h2>
    <dl>
      <dt>Límite de carga</dt><dd id="limit">—</dd>
      <dt>Carga evaluada</dt><dd id="load">—</dd>
      <dt>Margen</dt><dd id="margin">—</dd>
      <dt>Estado del lazo</dt><dd id="circuit">—</dd>
      <dt>Señal simulada</dt><dd id="signal">—</dd>
      <dt>Cuenta ideal PLC</dt><dd id="count">—</dd>
    </dl>
    <p id="replacement"></p>
    <p id="pending" class="secondary"></p>
    <button id="export" disabled>Exportar resultado JSON</button>
  </section>
  <section>
    <h2>Documentación de fabricante</h2>
    <ul id="sources"></ul>
    <small>Las referencias están precargadas. Abrir los documentos OEM requiere Internet.</small>
  </section>
</main>
<script id="embedded-reports" type="application/json">null</script>
<script>
const el = id => document.getElementById(id);
const embedded = JSON.parse(el('embedded-reports').textContent);
const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
const states = {
  nominal: 'Nivel nominal',
  empty_tank: 'Tanque vacío',
  open_circuit: 'Cable abierto · diagnóstico de lazo',
  outside_load_envelope: 'Carga fuera del límite'
};
let report = null;
let updateId = 0;

function render(data) {
  const check = data.load_check;
  const simulation = data.simulation;
  const pass = check.status === 'pass';
  el('status').textContent = pass ? 'Pasa la comprobación de carga' : 'Incompatible por carga';
  el('status').className = pass ? 'ok' : 'fail';
  el('limit').textContent = number.format(check.available_ohm) + ' Ω';
  el('load').textContent = number.format(check.evaluated_ohm) + ' Ω';
  el('margin').textContent = number.format(check.margin_ohm) + ' Ω';
  el('circuit').textContent = states[simulation.state];
  el('signal').textContent = simulation.loop_signal_ma === null
    ? 'Indeterminada' : number.format(simulation.loop_signal_ma) + ' mA';
  el('count').textContent = simulation.plc_ideal_count === null
    ? 'Sin lectura válida' : number.format(simulation.plc_ideal_count);
  el('replacement').textContent = pass
    ? 'Equivalencia del repuesto: evidencia insuficiente.'
    : 'Equivalencia del repuesto: incompatible con el perfil evaluado.';
  el('pending').textContent = data.pending.join(' ');
  const sources = data.sources.map(source => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.title;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link, document.createTextNode(' · ' + source.section));
    return item;
  });
  el('sources').replaceChildren(...sources);
}

async function update() {
  const currentId = ++updateId;
  el('export').disabled = true;
  const params = new URLSearchParams(
    Object.fromEntries(['voltage', 'revision', 'scenario'].map(id => [id, el(id).value]))
  );
  try {
    let data;
    if (embedded) {
      const key = ['voltage', 'revision', 'scenario'].map(id => params.get(id)).join(':');
      data = embedded[key];
    } else {
      const response = await fetch('/api/check?' + params);
      if (!response.ok) throw new Error('Falló la consulta local.');
      data = await response.json();
    }
    if (currentId !== updateId) return;
    report = data;
    render(report);
    el('export').disabled = false;
  } catch (error) {
    if (currentId !== updateId) return;
    report = null;
    el('status').className = 'fail';
    el('status').textContent = 'Resultado local no disponible';
    for (const id of ['limit', 'load', 'margin', 'circuit', 'signal', 'count']) el(id).textContent = '—';
    el('replacement').textContent = 'Vuelve a cargar o genera nuevamente el archivo.';
    el('pending').textContent = '';
  }
}

el('controls').addEventListener('submit', event => event.preventDefault());
el('controls').addEventListener('change', update);
el('export').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'boat-mvp-result.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
update();
</script>
</body>
</html>
"""


def portable_html():
    reports = {
        f"{voltage}:{revision}:{scenario}": evaluate(voltage, revision, scenario)
        for voltage in (12, 24)
        for revision in ADDITIONAL_OHMS
        for scenario in LEVELS
    }
    encoded = json.dumps(reports, ensure_ascii=False).replace("<", r"\u003c")
    marker = '<script id="embedded-reports" type="application/json">'
    return HTML.replace(marker + "null", marker + encoded, 1)


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, payload, content_type):
        data = payload.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; "
            "connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        )
        self.end_headers()
        self.wfile.write(data)

    def respond_json(self, status, payload):
        self.respond(status, json.dumps(payload, ensure_ascii=False), "application/json; charset=utf-8")

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path == "/":
            self.respond(200, HTML, "text/html; charset=utf-8")
            return
        if url.path == "/health":
            self.respond_json(200, {"ok": True})
            return
        if url.path != "/api/check":
            self.respond_json(404, {"error": "Ruta desconocida."})
            return
        try:
            args = parse_qs(url.query, keep_blank_values=True, max_num_fields=3)
            allowed = {"voltage", "revision", "scenario"}
            if any(key not in allowed or len(values) != 1 for key, values in args.items()):
                raise ValueError("Parámetro desconocido o duplicado.")
            report = evaluate(
                int(args.get("voltage", ["24"])[0]),
                args.get("revision", ["v1"])[0],
                args.get("scenario", ["nominal"])[0],
            )
        except ValueError as error:
            self.respond_json(400, {"error": str(error)})
            return
        self.respond_json(200, report)


def main():
    parser = argparse.ArgumentParser(description="Demo local de compatibilidad de un repuesto.")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--html", type=Path, help="Genera un HTML autónomo.")
    parser.add_argument("--open", action="store_true", help="Abre el navegador local.")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if args.html:
        output = args.html.resolve()
        output.write_text(portable_html(), encoding="utf-8")
        print("Demo portátil: " + str(output))
        if args.open:
            webbrowser.open(output.as_uri())
        return
    with ThreadingHTTPServer(("127.0.0.1", args.port), Handler) as server:
        url = "http://127.0.0.1:" + str(server.server_port)
        print("Demo local: " + url, flush=True)
        if args.open:
            browser = threading.Thread(target=webbrowser.open, args=(url,), daemon=True)
            browser.start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
# END MVP_PY
```
