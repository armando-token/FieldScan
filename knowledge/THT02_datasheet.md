# TZ THT-02 — Ficha Técnica y Manual de Ingeniería / Technical Reference & Field Service Datasheet

- **Modelo / Model**: `TZ THT-02` (`TZ-THT-02`) — Industrial RS-485 Temperature & Humidity Sensor
- **Documento Fuente / Source Manual**: *TZ THT-02 Temperature and humidity Sensor User's Manual V1.1* (Header rev: `V1.0`, Date: `Mach 18th, 2021`)
- **Elementos Sensores / Sensing Elements**: Sensirion **SHT30** (Temperatura) / **SHT3X** (Humedad Relativa) — Tecnología **CMOSens®**
- **Interfaz y Protocolo / Interface & Protocol**: Bus industrial **RS-485** half-duplex, protocolo estándar **Modbus-RTU**
- **Dimensiones Físicas / Mechanical Envelope**: **`140 mm` de longitud axial × `Ø16 mm` de diámetro exterior** (cable apantallado estándar de `1.0 m` / `1000 mm`)

---

## 1. Descripción General, Chip CMOSens y Áreas de Aplicación (Manual Pages 1–2)

### 1.1 Anatomía Externa (Page 1 Callouts)
De extremo superior (cabezal sensor, `z = 0 mm`) a extremo inferior (salida de cable, `z = 140 mm`):
1. **`Stainless steel strainer` (Cabezal filtrante ranurado)**: Capuchón protector con ranuras longitudinales que resguarda el transductor SHT30/SHT3X frente a partículas sólidas permitiendo flujo laminar de aire.
2. **`Quality probe` (Sonda de calidad / anillo de sellado superior)**: Junta tórica negra de aislamiento entre la cámara de muestreo y el cuerpo tubular.
3. **`Wiring` (Cableado de 4 hilos)**: Puntas estañadas codificadas por color (`Green = B-`, `Yellow = A+`, `Black = GND`, `Red = V+`).
4. **`Mounting holes` (Brida con orificios de montaje)**: Abrazadera lateral desmontable con dos orejetas simétricas para fijación mural o en bastidor.
5. **`Standard one meter lead` (Línea apantallada estándar de 1 metro)**: Manguera negra de 4 conductores con malla de blindaje para puesta a tierra RS-485.
6. **`Waterproof terminal` (Terminal / prensaestopas impermeable)**: Tuerca cónica estriada de compresión en la base del cilindro.

### 1.2 Arquitectura SHT30 / SHT3X CMOSens® (Page 2)
- El elemento sensible emplea el circuito integrado **SHT30 / SHT3X CMOSens®** de nueva generación, que integra en un mismo sustrato un **elemento capacitivo mejorado de humedad relativa** y un **sensor de temperatura por banda prohibida de energía (*standard energy gap temperature sensor element*)**.
- Supera ampliamente a las generaciones previas (`SHT1x` y `SHT7x`), ofreciendo compensación térmica en todo el rango de humedad, baja latencia, calibración de fábrica completa, mínima deriva anual y alta resistencia a contaminación química ligera y entornos de alta humedad.
- Incorpora un **interruptor DIP de 8 posiciones (`DIP switch`)** interno para fijar la dirección esclava Modbus directamente en campo sin requerir configuración previa mediante computadora maestra (*upper computer*).

### 1.3 Características Clave y Aplicaciones (`Features & Application Areas`, Page 2)
- **Características**: Bajo consumo (`5 mA`), totalmente calibrado de fábrica, alta precisión y repetibilidad, compensación de temperatura en rango completo de humedad, protocolo estándar `Modbus-RTU`, robusta protección eléctrica en interfaz RS-485.
- **Aplicaciones típicas** (*indoor clean environments*):
  - Climatización industrial y comercial (**HVAC**) y automatización de edificios (*Building automation*).
  - Laboratorios, hospitales, salas limpias y bibliotecas (*Laboratory, hospital, library*).
  - Salas de equipos de telecomunicaciones, almacenes e instalaciones de producción farmacéutica, papelera, alimentaria y electrónica.

---

## 2. Especificaciones Técnicas de Alimentación, Bus y Sensado (Manual Pages 3–4)

### 2.1 Alimentación Eléctrica (`4.1 Power supply`, Page 3)
| Parámetro (ES / EN) | Valor Oficial Manual | Notas de Ingeniería en Campo |
| :--- | :--- | :--- |
| Tensión de alimentación (`Supply voltage`) | **`DC 5~24V`** | Admite rieles de `5V`, `12V` o `24V DC` nominales. |
| Corriente nominal (`Current`) | **`5mA`** | Consumo ultra bajo (`~25 mW @ 5V`, `~120 mW @ 24V`). |

### 2.2 Interfaz RS-485 y Distancia de Transmisión (`4.2 & 4.3`, Page 3)
| Parámetro (ES / EN) | Valor Oficial Manual | Notas de Ingeniería en Campo |
| :--- | :--- | :--- |
| Velocidad de transmisión (`Transmission rate`) | **`Optional 4800bps / 9600bps / 19200bps`** | Valor predeterminado típico: **`9600 bps`**. Configurable vía registro `0x0005`. |
| Distancia máxima (`Maximum transmission distance`) | **`About 1200 meters` (`1200m`)** | Depende del entorno electromagnético, par trenzado apantallado y velocidad en baudios. |
| Nodos teóricos en bus (`Number of theoretical nodes`) | **`32` nodos** | Hasta 32 sensores sin repetidor en un segmento RS-485 estándar. |

### 2.3 Parámetros de Temperatura (`4.4 Temperature parameter`, Page 3)
| Parámetro (ES / EN) | Especificación Exacta |
| :--- | :--- |
| Elemento sensor (`Sensing element`) | **`SHT30`** |
| Rango de medición (`Measuring range`) | **`-40~125°C`** *(Nota: ver límite ambiental de carcasa `-40~85°C` en §2.5)* |
| Resolución (`Resolution`) | **`0.1°C`** |
| Precisión (`Measurement accuracy`) | **`±0.3°C` (`0~60°C`)**; **`±0.5°C`** en el resto del rango (`for other range`) |

### 2.4 Parámetros de Humedad Relativa (`4.5 Humidity parameters`, Page 3)
| Parámetro (ES / EN) | Especificación Exacta |
| :--- | :--- |
| Elemento sensor (`Sensing element`) | **`SHT3X`** |
| Rango de trabajo (`Working range`) | **`5~95%RH`** |
| Resolución (`Resolution`) | **`0.1%RH`** |
| Precisión (`Measurement Accuracy`) | **`±2%RH` (`10%~90%RH`)**; **`±5%RH`** en el resto del rango (`for other range`) |
| Histéresis (`Hysteresis`) | **`< ±0.8%RH`** |
| Tiempo de respuesta (`Response time`) | **`About 8s`** (de `33%RH` a `75%RH` en aire en movimiento / *in flowing air*) |
| Estabilidad a largo plazo / Deriva (`Long-term stability`) | **`< ±0.25%RH/year`** (sin contaminación química / *under no pollution*) |

### 2.5 Condiciones Ambientales de Operación y Almacenamiento (`4.6 Environmental conditions`, Page 4)
- **Entorno de trabajo (`Working environment`)**: **`-40~85°C / 5~95%RH (Non-condensing / Sin condensación)`**
- **Entorno de almacenamiento (`Storage environment`)**: **`-40~85°C / 5~95%RH (Non-condensing / Sin condensación)`**
- *Advertencia operativa*: Aunque el chip SHT30 soporta lecturas hasta `125°C`, la electrónica interna RS-485, el polímero del cuerpo y el prensaestopas están certificados hasta **`85°C` sin condensación**. La condensación líquida directa provoca saturación temporal y corrosión galvánica.

---

## 3. Código de Colores de 4 Hilos y Puesta a Tierra RS-485 (Manual Page 4)

### 3.1 Tabla de Conductores (`4.7 Lead description`, Page 4)
| Color del Hilo (`Lead`) | Etiqueta (`Label`) | Función Eléctrica (`Function description`) |
| :--- | :---: | :--- |
| **Verde (`Green`)** | **`B-`** | Línea diferencial inversora **RS485 interface B-** |
| **Amarillo (`Yellow`)** | **`A+`** | Línea diferencial no inversora **RS485 interface A+** |
| **Negro (`Black`)** | **`GND`** | Tierra común (**Public ground**: conectar al polo negativo `-` de la fuente DC) |
| **Rojo (`Red`)** | **`V+`** | Alimentación positiva (**Power supply positive**: conectar al polo positivo `+` de `DC 5~24V`) |

### 3.2 Advertencia Crítica de Tensión en Modo Común RS-485 (`4.8 Schematic diagram Note`, Page 4)
> **ADVERTENCIA DE PUESTA A TIERRA (RS-485 Common-Mode Voltage):**
> Al instalar una red multipunto RS-485, preste especial atención al tratamiento de puesta a tierra para **eliminar la tensión en modo común (*common mode voltage*)**. Se recomienda interconectar la tierra común (`GND` / hilo negro) de todos los sensores entre sí y unirla al terminal `Gnd` del conversor `RS-232/RS-485 transverter`. Utilice la **malla de blindaje (*shielding layer*)** del cable apantallado como conductor de referencia equipotencial.

---

## 4. Interruptor DIP de 8 Posiciones y Procedimiento de Apertura en 2 Pasos (Manual Page 5)

### 4.1 Pesos Binarios del Interruptor DIP (`5 DIP switch and address code`, Page 5)
El interruptor DIP interno cuenta con **8 posiciones numeradas del `1` al `8`**, ordenadas de **MSB a LSB** (¡Atención!: la posición `1` vale `128`, NO `1`):

| Posición DIP (`Switch #`) | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Peso Decimal (`Bit Weight`)** | **`128`** | **`64`** | **`32`** | **`16`** | **`8`** | **`4`** | **`2`** | **`1`** |

- **Cálculo de Dirección Esclava (`Address Code`)**: Se suman los pesos de todos los interruptores colocados en posición **`ON`**.
- **Ejemplo Oficial del Manual (Page 5)**:
  - Posiciones en `ON`: **`1, 3, 4`** (resto en `OFF`).
  - Dirección resultante: `128 + 32 + 16 =` **`176`** (`0xB0`).
- **Direcciones Comunes Rápidas**:
  - Esclavo `1` (`0x01`): solo interruptor **`8 = ON`**.
  - Esclavo `2` (`0x02`): solo interruptor **`7 = ON`**.
  - Esclavo `10` (`0x0A`): interruptores **`5` (`8`) + `7` (`2`) = `ON`**.

### 4.2 Procedimiento Mecánico Obligatorio de Apertura en 2 Pasos (`First Step / Second Step`, Page 5)
Para acceder a la tarjeta PCB del interruptor DIP **sin arrancar las soldaduras internas de los 4 hilos**:
1. **`First Step` (Primer Paso — Aflojar prensaestopas)**: Desenrosque primero la tuerca terminal impermeable trasera (`Waterproof terminal`) y deslícela hacia atrás sobre el cable para liberar la fricción torsional sobre la manguera.
2. **`Second Step` (Segundo Paso — Desenroscar cuerpo)**: Sujete la mitad superior y desenrosque el cilindro inferior en la unión roscada central para descubrir la tarjeta PCB azul con el bloque **`DIP switch`** de 8 vías.
- *Al reensamblar*: Enrosque primero el cuerpo central verificando el asiento del anillo tórico negro (`O-ring`), y apriete al final la tuerca del prensaestopas impermeable.

---

## 5. Protocolo Modbus-RTU, Temporización y Mapa de Registros (Manual Pages 5–9)

### 5.1 Formato Serie y Temporización RTU (`6.1 – 6.3`, Pages 5–6)
- **Formato de byte (`6.1 Data frame format`)**: `1 Start bit`, `8 Data bits`, `0 Parity bit` (`None`), `1 Stop bit` (**`8N1`** predeterminado de fábrica).
- **Delimitación de trama (`6.2 RTU message frame format`)**: Pausa silenciosa mínima de **`>= 3.5 caracteres`** (`T1-T2-T3-T4`) al inicio y final de cada trama.
- **Continuidad entre bytes (Descarte Silencioso)**: Todos los bytes de una trama deben transmitirse de forma continua. Si ocurre una pausa entre caracteres **`> 1.5 caracteres`**, el sensor considera la trama inválida y **la descarta en silencio sin emitir respuesta (`will not respond`)**.
- **Estructura de trama (`6.3 Information frame format`)**:
  `[Inicio >=3.5 char] + [Address: 1 byte] + [Function Code: 1 byte] + [Data Area: N bytes] + [CRC-16: 2 bytes (Low, High)] + [Fin >=3.5 char]`

### 5.2 Mapa Completo de Registros Holding (`6.4 Register definition`, Page 6)
| Dir. Hex (`Dec`) | Significado (`Meaning`) | Formato, Escala y Valor Centinela (`Description`) | Acceso (`R/W`) |
| :---: | :--- | :--- | :---: |
| **`0x0000`** (`0`) | **Temperatura (`Temperature`)** | Unidad **`0.1°C`**, `MSB First`, complemento a 2 (`complement format`). **`7FFF H` (`32767`) significa sensor anormal (`sensor is abnormal`)**. | Solo lectura (`Read only`) |
| **`0x0001`** (`1`) | **Humedad Relativa (`Relative humidity`)** | Unidad **`0.1%RH`**, `MSB First`, `complement format`. **`7FFF H` (`32767`) significa sensor anormal (`sensor is abnormal`)**. | Solo lectura (`Read only`) |
| **`0x0002`** (`2`) | **Reservado 1 (`Reserved 1`)** | Uso interno de fábrica (`0000H` nominal). | Solo lectura (`Read only`) |
| **`0x0003`** (`3`) | **Reservado 2 (`Reserved 2`)** | Uso interno de fábrica (`0000H` nominal). | Solo lectura (`Read only`) |
| **`0x0004`** (`4`) | **Código de dirección (`Address code`)** | Refleja la dirección configurada por el interruptor DIP (`Set by DIP switch`). | Solo lectura (`Read only`) |
| **`0x0005`** (`5`) | **Velocidad en baudios (`Baud rate`)** | Soporta **`4800`** (`0x12C0`), **`9600`** (`0x2580`), **`19200`** (`0x4B00`). | **Lectura y escritura (`Can read and write`)** |
| **`0x0006`** (`6`) | **Versión de hardware (`Hardware version`)** | Ej.: `0600H`. | Solo lectura (`Read only`) |
| **`0x0007`** (`7`) | **Versión de software (`Software version`)** | Ej.: `000AH` = `10` decimal = `V1.0`. | Solo lectura (`Read only`) |

### 5.3 Códigos de Función Soportados (`6.7 & 6.8`, Pages 7–8)
1. **Función `0x03` — Lectura de Registros (`Host reads sensor information`)**:
   - **Trama de consulta ejemplo** (Esclavo `0x01`, leer `8` registros desde `0x0000`):
     `01 03 00 00 00 08 44 0C` *(CRC Low=`44`, High=`0C`)*
   - **Trama de respuesta ejemplo**:
     `01 03 10 00 FA 02 58 00 00 00 00 00 01 25 80 06 00 00 0A D4 64`
     - Temperatura = `00FA H` = `250 / 10` = **`25.0°C`** *(Para temperaturas negativas en complemento a 2: `valor_signed = raw - 65536` si `raw >= 0x8000`, luego `/ 10.0`)*.
     - Humedad = `0258 H` = `600 / 10` = **`60.0%RH`**.
     - Dirección DIP = `0001 H` = `1`; Baudios = `2580 H` = `9600`; HW = `0600 H`; SW = `000A H` (`V1.0`).
2. **Función `0x06` — Escritura de Registro Individual (`Host setting sensor information`)**:
   - Actualmente habilitada únicamente sobre el registro **`0x0005` (Baud rate)**.
   - **Ejemplo fijar `9600 bps` (`0x2580`) en Esclavo `0x01`**:
     - Petición Host: `01 06 00 05 25 80 82 FB`
     - Respuesta Sensor (eco idéntico): `01 06 00 05 25 80 82 FB`

### 5.4 Respuestas de Excepción y Cálculo CRC-16 (`6.9 & 6.10`, Pages 8–9)
- **Respuesta Anormal (`6.9 Abnormal response`)**: Cuando ocurre un error de protocolo válido en CRC, el sensor activa el bit más significativo (**MSB = `1`**) del código de función (`0x03 -> 0x83`, `0x06 -> 0x86`) y devuelve `[Slave (1B)] [Func|0x80 (1B)] [Error Code (1B)] [CRC (2B)]`:
  - **`01`**: `Illegal function code` (Código de función no soportado; distinto de `0x03`/`0x06`).
  - **`02`**: `Illegal data address` (Dirección de registro fuera de `0x0000..0x0007` o intento de escritura fuera de `0x0005`).
  - **`03`**: `Illegal data value` (Valor de escritura inválido, p. ej., baudios distintos de `4800`, `9600` o `19200`).
- **Algoritmo CRC-16/MODBUS (`6.10 CRC check code`, Page 9)**:
  - Registro inicial de 16 bits cargado en **`0xFFFF`**.
  - Por cada byte de la trama: XOR con los 8 bits bajos del registro CRC; desplazar 8 veces un bit a la derecha (`LSB first` rellenando `0` en MSB) y, cada vez que el bit desplazado hacia afuera sea `1`, aplicar XOR con el polinomio reflejado **`0xA001`** (`1010 0000 0000 0001`).
  - Se transmite primero el **byte bajo (`CRC Low`)** y luego el **byte alto (`CRC High`)**. Si el CRC recibido es incorrecto, el sensor **ignora la petición y no responde**.

---

## 6. Dimensiones Mecánicas (`7 Dimensions`, Page 9)

- **Longitud total del cuerpo rígido (`Total axial length`)**: **`140 mm`** (medidos desde la corona del cabezal filtrante ranurado hasta la base del prensaestopas impermeable, sin contar el cable).
- **Diámetro exterior del tubo (`Outer barrel diameter`)**: **`16 mm` (`Ø16 mm`, radio `8.0 mm`)**.
- **Brida de fijación (`Mounting flange`)**: Ancho total `42.0 mm`, altura axial `20.0 mm`, dos taladros pasantes de `Ø4.2 mm` con distancia entre centros de `32.0 mm`.
- **Cable de salida**: Diámetro exterior nominal `Ø5.0 mm`, longitud estándar `1000 mm` (`1 m`).

---

## 7. Matriz Diagnóstica de Fallos por Zona Física (6 Canonical Zones)

Esta matriz vincula las **6 zonas axiales canónicas** del gemelo digital 3D (`z = 0..140 mm`) con anomalías visuales detectadas por cámara UVC, síntomas eléctricos/Modbus y acciones correctivas de mantenimiento:

| Zona ID (`z_start..z_end`) | Componente Físico (ES / EN) | Anomalías Físicas / Visuales | Síntomas Eléctricos y Modbus RTU | Acción Correctiva Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **`strainer_head`**<br>(`0.0 – 32.0 mm`) | Cabezal filtrante ranurado y chip SHT30/SHT3X<br>*(`Stainless steel strainer`)* | Obstrucción por polvo industrial/grasa en ranuras, fractura por impacto, condensación o ataque químico en membrana SHT30. | Registros `0x0000` (Temp) y/o `0x0001` (RH) devuelven **`7FFF H` (`32767`, sensor abnormal)**; tiempo de respuesta `>> 8s`; deriva `> ±2%RH` o lectura congelada. | Desenergizar, limpiar ranuras con aire seco comprimido a baja presión (`< 1 bar`) o alcohol isopropílico sin tocar el chip SHT30; si persiste `7FFF H`, reemplazar cabezal/sonda. |
| **`upper_seal_ring`**<br>(`32.0 – 38.0 mm`) | Anillo de sellado superior de sonda<br>*(`Quality probe` O-ring)* | Junta tórica reseca, agrietada, pellizcada, desplazada fuera de su canal o ausente. | Migración de humedad interna desde el cabezal hacia la PCB; deriva progresiva de RH, lecturas erráticas intermitentes o `7FFF H` tras lavados/alta humedad (`>85%RH`). | Inspeccionar asiento perimetral, secar cámara interna con sílica gel, sustituir O-ring de nitrilo/vitón `Ø16 mm` y verificar estanqueidad sin condensación. |
| **`upper_barrel_dip`**<br>(`38.0 – 68.0 mm`) | Cuerpo superior y PCB de interruptor DIP-8<br>*(`Upper barrel & DIP switch`)* | Grieta en cilindro, rosca central mal cerrada, pines DIP a medio recorrido o sulfatados, error de cálculo MSB/LSB (`1=128..8=1`). | **Timeout total sin respuesta Modbus** en la dirección esperada (p. ej. configurar switch `1=ON` esperando ID `1` cuando en realidad es ID `128`), colisión de IDs en bus o registro `0x0004` inesperado. | Abrir siguiendo estrictamente los **2 Pasos** (1º aflojar prensaestopas, 2º desenroscar cuerpo), verificar pesos `[128,64,32,16,8,4,2,1]`, asentar switches firmemente en `ON`/`OFF` y comprobar `0x0004`. |
| **`mounting_flange`**<br>(`68.0 – 88.0 mm`) | Brida de montaje lateral y junta roscada central<br>*(`Mounting holes` & mid-seam)* | Orejeta de brida partida, tornillos flojos o sobreapretados deformando el tubo `Ø16 mm`, holgura en unión roscada central. | Vibración mecánica transmitida a soldaduras internas; cortes micro-intermitentes en tramas RTU (`pausa > 1.5 char` -> descarte silencioso) o apertura de la rosca central. | Reemplazar abrazadera `42 mm` fisurada, fijar con tornillería M4 en centros de `32.0 mm` con par moderado sin ovalizar el tubo y asegurar cierre completo de rosca central. |
| **`lower_barrel_rs485`**<br>(`88.0 – 122.0 mm`) | Cuerpo inferior: transceptor RS-485 y regulador DC<br>*(`Lower barrel RS-485 PCB`)* | Decoloración térmica por sobretensión (`>24V DC`) o inversión de polaridad, daño por modo común RS-485 sin tierra equipotencial. | Consumo anormal (`!= 5 mA`, `0 mA` o cortocircuito), calentamientos en carcasa, tramas corruptas con errores de `CRC-16` (`0xA001`), bloqueo del bus diferencial `A+/B-` o excepciones `0x83`/`0x86`. | Verificar riel `DC 5~24V` entre `Red (V+)` y `Black (GND)`, unir tierras `GND` y malla al conversor `RS-232/RS-485` para suprimir tensión de modo común; sustituir unidad si el transceptor está en corto. |
| **`waterproof_gland_leads`**<br>(`122.0 – 140.0 mm`) | Prensaestopas impermeable y latiguillo 4 hilos<br>*(`Waterproof terminal & 1m lead`)* | Tuerca floja, cable retorcido por abrir el cuerpo sin aflojar antes el prensaestopas (*violación del First Step*), inversión `Yellow (A+)` / `Green (B-)`, blindaje desconectado. | Sin comunicación RS-485 (polaridad `A+/B-` invertida o hilo roto internamente), pérdida de alimentación (`Red V+` / `Black GND` desoldados por torsión), ruido EMI en tramos largos (`hasta 1200 m`). | Verificar continuidad y colores (`Green=B-`, `Yellow=A+`, `Black=GND`, `Red=V+`), reparar/resoldar tirones por torsión, conectar malla a tierra del transverter y apretar prensaestopas estriado. |
