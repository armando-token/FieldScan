# Industrial Datasheet + FieldScan
## Megaplan técnico de implementación · Boat Hackathon

**14 de noviembre de 2026 · San Francisco**

El escenario de hoy corre con un sensor simulado. La entrega incluye `FIELD_SCAN_DEMO.html`, un prototipo autónomo que abre en el navegador y sirve en modo avión, y este plan para integrar los auspiciadores durante la semana. El [manual técnico anterior](https://chatgpt.com/library?file_id=libfile_73ecfc97e5e88191acb8604c90a18e70&account_id=personal) conserva el motor de compatibilidad y su apéndice Python.

## 1. Cómo presentar hoy

1. Descarga **FIELD_SCAN_DEMO.html** y ábrelo desde Finder con un navegador. Desde Terminal en macOS puedes ejecutar `open "$HOME/Downloads/FIELD_SCAN_DEMO.html"` si lo guardaste allí. La demo funciona como archivo local.
2. En **Ver en vivo**, pulsa **Mostrar placa**. La representación ilustrada enfoca una placa sintética del **Tzone TZ THT‑02** y abre la consulta sobre ese modelo.
3. Pulsa **¿Por qué falla?**. El escenario muestra una consulta Modbus a la dirección 1 y un sensor configurado en 2. Abre **Ver manual** para ver la edición y la sección que documenta el DIP. Puedes hacer la pregunta por texto. El botón de micrófono comprueba si el navegador tiene reconocimiento en español instalado y disponible en el dispositivo.
4. Selecciona **Simular ajuste DIP** y luego **¿Ya funciona?**. El simulador genera una respuesta RTU, el decodificador comprueba dirección, función, tamaño y CRC, y aparecen **23,4 °C** y **57,8 %RH**. En **Tramas RTU de la simulación** puedes enseñar los bytes y en **Exportar informe** dejar la evidencia.
5. En **Compatibilidad 4–20 mA** cambia de **24 V** a **12 V**. El mismo candidato pasa la prueba de carga en el primer escenario y falla en el segundo. Es un caso separado con **WIKA LS‑10, Waterpilot FMX11 y Siemens SM 1231 AI**.
6. Si tienes tiempo, apaga el Wi‑Fi y repite la primera prueba. Los extractos, las tramas y el cálculo siguen disponibles. Los enlaces externos a los documentos se abren cuando hay Internet.

**Guion corto.** «El técnico ve un sensor que dejó de responder. Abre su manual aplicable y prueba la causa en un entorno simulado. El sistema valida el retorno con una trama. Si el problema exige otro equipo, el mismo producto presenta un dictamen para la configuración instalada».

### Qué está implementado

| Capacidad | En el prototipo de hoy | Paso para la versión integrada |
|---|---|---|
| Cámara de FieldScan | Vista ilustrada y placa sintética. El control cambia el foco y fija la identidad desde el escenario. | Integrar el adaptador UVC de FieldScan y reconocimiento de placa con confirmación del técnico si hay dudas. |
| Micrófono y respuesta | Consultas de prueba y texto siempre disponibles. Micrófono y síntesis reales solo donde el navegador ofrece procesamiento local en español. La respuesta usa reglas del escenario. | Integrar el flujo push-to-talk existente en FieldScan y pasar al agente herramientas de catálogo, verificación y simulación. |
| Gemelo del THT‑02 | Perfil de comportamiento, escena 2D, 8 interruptores visibles y un simulador RTU. | Incorporar el visor Three.js de FieldScan como vista del perfil. La identidad, los registros y el veredicto vienen del modelo de datos. |
| Compatibilidad industrial | Las doce combinaciones precalculadas con el motor Python del manual anterior están dentro del HTML. | Llamar al mismo motor a través de un servicio local para aceptar perfiles e instalaciones nuevas. |
| Evidencia | Extractos preincluidos, edición conocida, procedencia, estado de vigencia por confirmar y exportación JSON. | Validar SKU y revisión en el catálogo, descargar fuentes permitidas y sincronizar paquetes versionados. |

El prototipo ejecuta únicamente escenarios sintéticos. La voz integrada es opcional y requiere permisos y soporte de voz local del navegador. Usa las preguntas de ejemplo si faltan. La respuesta por defecto funciona aun sin micrófono, sin hardware, sin Internet y sin modelo generativo. [FieldScan CAD](https://github.com/armando-token/beta_2) · [Flujo de voz existente](https://github.com/armando-token/beta_2/blob/main/docs/04_VOICE_AND_OFFLINE_OUTBOX_GLUE.md) · [Reconocimiento local](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally) · [Voces de síntesis locales](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)

## 2. Implementación y límites de la simulación

### 2.1 Diagnóstico THT‑02

- Estado inicial `identified=false`, dirección del escenario `2` y maestro configurado en dirección `1`. El DIP visual usa los pesos de mayor a menor. Mostrar la placa abre el contexto de ese dispositivo.
- La solicitud simulada usa la función `0x03`, registro inicial 0 y cantidad 2. El equipo emulado decide si responde a partir de la dirección. La trama agrega CRC‑16 Modbus con polinomio reflejado `0xA001` y orden bajo/alto.
- La respuesta incluye temperatura entera con signo en décimas y humedad en décimas. El decodificador verifica longitud, dirección, función, cantidad de bytes, CRC y marcadores de lectura inválida. La pantalla solo muestra valores cuando la decodificación produce una lectura válida.
- **Simular ajuste DIP** cambia la dirección en memoria y ejecuta la misma secuencia de consulta. **Reiniciar caso** restaura el incidente. El ajuste ocurre exclusivamente dentro del escenario.
- El manual V1.0 de 2021 está identificado como un documento del fabricante alojado en un tercero. La escena no comprueba su vigencia actual, ni la correspondencia con una unidad física. [Copia del manual THT‑02, secciones 5, 6.4 y 6.7](https://p.globalsources.com/IMAGES/PDT/SPEC/387/K1195613387.pdf)

### 2.2 Compatibilidad analógica

Se reutiliza el cálculo del plan anterior. Para el caso base hay 320 Ω de carga evaluada, compuesta por una cota conservadora de 290 Ω de la entrada más 30 Ω sintéticos. El FMX11 dispone de aproximadamente **727,3 Ω** a 24 V y **181,8 Ω** a 12 V antes de descontar cargas. La interfaz presenta el margen y mantiene abierta la equivalencia completa cuando solo pasa la comprobación de carga. Los casos de tanque vacío, cable abierto y configuración v2 se conservan. [Documento FMX11](https://bdih-download.endress.com/file/5cd7eb8d07ab2acb1a9c262c0519741d/TI01524PEN_0120.pdf#page=7) · [Módulo Siemens](https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/technical-specifications/analog-signal-modules-sms/sm-1231-analog-input-module-specifications)

## 3. Arquitectura para reutilizar FieldScan

La integración conserva una sola sesión por activo y una fuente de verdad por dato. La vista en vivo conoce el activo seleccionado. Un cambio de cámara, voz o conectividad conserva el contexto del equipo y la edición documental utilizada.

| Interfaz propuesta | Entrada mínima | Salida |
|---|---|---|
| `capture_frame()` | Fuente `simulated` o `uvc`. | Fotograma o identificador local, origen y hora. La versión actual usa una escena en HTML. |
| `confirm_asset()` | Modelo, variante, origen de la identificación y confirmación cuando aplique. | Identidad de sesión y campos pendientes. |
| `get_document()` | Identidad, tipo de documento y versión de catálogo. | Documento, edición, fecha, URL, sección y estado de vigencia. |
| `get_asset_status()` | Identidad y transporte de lectura seleccionado. | Lectura medida, simulada o sin evidencia y su origen. |
| `simulate_fault()` | Modelo de comportamiento, configuración y escenario. | Estado previo, acción simulada y evidencia resultante. |
| `check_replacement()` | SKU candidato, configuración de instalación y versión de reglas. | Dictamen por criterio, margen cuando aplique, fuentes y datos faltantes. |

**Adaptar FieldScan.** Mantén el capturador UVC y la ruta `POST /api/voice` como entradas. La sesión entrega al adaptador de voz el identificador del activo. El agente usa herramientas sobre esa identidad y devuelve texto más referencias estructuradas. El visor 3D consume el estado de inspección. El lector Modbus real puede implementar el mismo contrato que el simulador en una fase de banco. Para el modo local, una interfaz o un cliente MCP invocan el mismo núcleo. El campo `source` distingue observado, simulado y documentado. [Repositorio FieldScan](https://github.com/armando-token/beta_2) · [SDK MCP para Python](https://github.com/modelcontextprotocol/python-sdk)

**Fijar versión antes de contestar.** Guarda `asset_id`, `product_id`, `catalog_version`, `rules_version`, `event_id` y el estado de cada fuente. Si el manual está ausente o la variante no coincide, el asistente devuelve evidencia insuficiente y pide el dato específico. Las experiencias de otros técnicos se guardan como observaciones con procedencia, fecha y variante. Pueden sugerir comprobaciones. Los criterios de compatibilidad siguen respaldados por fuentes y resultados de pruebas.

**A bordo.** Paquete local con perfiles, citas y reglas, publicado con un manifiesto firmado. App, voz local y simulador pueden trabajar contra la misma copia de SQLite. La UI muestra la última verificación. El adaptador de Internet se encarga de encontrar revisiones al recuperar señal. La instalación privada y los fotogramas brutos se procesan localmente por defecto.

## 4. De la demo local a la entrega con auspiciadores

| Prioridad | Trabajo | Evidencia verificable |
|---|---|---|
| **1. Boat.dev** | Corre el worker y las pruebas del repositorio en una VM persistente del evento. Empaqueta allí una revisión de catálogo con manifiesto y checksums. | VM, commit y artefacto de revisión. [Boat.dev Quickstart](https://docs.boat.dev/quickstart) |
| **2. Context.dev** | Haz una búsqueda real de fuentes y un monitor en una página OEM verificada. El worker registra la URL, fecha y SHA‑256. Revisa cambios del PDF aunque conserve URL. Usa la copia de terceros del THT‑02 como fuente identificada hasta resolver el origen OEM. | ID de ejecución, fuente real, hash y trazabilidad del evento. [Context.dev Monitors](https://docs.context.dev/monitors/overview) |
| **3. NY Token Exchange** | Envía un fragmento de documentación pública al adaptador confidencial, con la política de privacidad documentada. El modelo propone campos y citas. Valida el resultado por esquema y contra la fuente antes de pasar a revisión. | Petición real, política verificada, campo estructurado y referencia. [API confidencial](https://nytokenexchange.com/confidential) · [Let’s Encrypt AI](https://letsencrypt.ai/?utm_source=luma) |
| **4. Teamily AI** | En un espacio privado de trabajo, el agente nativo revisa un diff público o sintético y redacta qué cambia en el diagnóstico o la prueba de compatibilidad. Enlaza la decisión al job. | Informe real de revisión y decisión trazable. [Teamily AI](https://teamily.ai/) |

Publica la revisión de catálogo después de verificar la identidad, páginas, unidades y regresiones. El equipo local valida el manifiesto e instala el paquete de forma atómica. Conserva la versión anterior para recuperación. Cada cambio de regla que altere un dictamen requiere reproducir el caso antes y después con el mismo perfil de instalación.

**Para competir.** Declara qué funcionalidades vienen de FieldScan y dónde empieza la integración nueva. El sitio oficial contempla demos fuera de competencia de proyectos preexistentes que usan Boat.dev. Verifica con el criterio publicado para builders cómo se evalúa la reutilización. Registra el uso real de los cuatro auspiciadores conforme se complete. [Boat Hackathon](https://boathackathon.com/) · [Builder Harbor](https://boathackathon.com/builders)

## 5. Criterios de aceptación

- **Demo de hoy.** Abre el HTML en modo avión. Hay timeout antes del ajuste y una lectura decodificada después. Cambiar a 12 V altera el resultado de compatibilidad. Los exportes JSON indican simulación y conservan las fuentes.
- **Verificador.** Una trama con CRC incorrecto, dirección distinta de la esperada o marcador de falla produce estado sin lectura válida. Una pregunta por un repuesto dirige al caso de compatibilidad y conserva el contexto.
- **Modo local integrado.** Las consultas reciben identificación exacta, versión de catálogo y evidencia. Con el micrófono indisponible se conserva la entrada por texto. Los casos simulados y las lecturas reales se distinguen en la UI y en el JSON.
- **Entrega.** Trazas verificables por auspiciador, ejemplo de actualización aprobada y captura del caso completo a bordo. El paso de banco físico requiere el dispositivo y una prueba propia.
