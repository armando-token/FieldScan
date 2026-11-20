# Megaplan de implementación · FieldScan Cloud

## Infraestructura, backend, generación de gemelos y despliegue en Boat.dev

**Fecha de referencia:** 19 de noviembre de 2026, hora de San Francisco.  
**Repositorio de referencia:** `armando-token/FieldScan`, `main` en `8e6a06504f916cc40e0e7c85177efb7cffa16d04`.  
**Entrada al trabajo:** este documento especifica código por implementar y un procedimiento para instalarlo. El repositorio revisado contiene el iPad y la estación local. La carpeta `cloud/`, sus servicios y los comandos `fieldscan_cloud` se crean durante las fases de este plan.  
**Documentos coordinados:** [Plan cloud vigente][C01] · [Megaplan del iPad M4][C02] · [Commit examinado][G01].

## 0. Qué se va a montar y cuál es la primera entrega

**Una VM Ubuntu en Boat.dev aloja la API de FieldScan, un worker, SQLite y los archivos.** Context.dev funciona como servicio externo de búsqueda cuando FieldScan desconoce la fuente de un equipo. El worker descarga documentos permitidos, clasifica la variante, convierte el manual, construye o importa el gemelo compatible, valida el resultado y publica automáticamente lo que tiene evidencia suficiente. Si falta información, publica documentación o geometría parcial, según corresponda. El iPad descarga la publicación firmada y realiza la inspección local.

### Entregables por orden

| Entrega | Resultado demostrable | Prueba de salida |
|---|---|---|
| E0 · Infraestructura | Una VM seleccionada, acceso por SSH, software del sistema, datos persistentes y puerto HTTPS de Boat. | Respuesta por HTTPS desde una red externa durante el ensayo. |
| E1 · Publicación de referencia | API, worker, SQLite, paquete firmado y validador. Una entrada THT‑02 basada en evidencia documentada o un fixture claramente marcado. | Un cliente descarga manifiesto y objetos, verifica firma y hashes. El mismo paquete se ofrece tras reiniciar API y worker. |
| E2 · Búsqueda automática | Context.dev, deduplicación de trabajos, identidad y resultados parciales. | Una búsqueda real registrada, una variante completa soportada y otro caso que entrega la parte válida automáticamente. |
| E3 · Documentos y gemelo desde fuentes | Convertidor y exportador 3D reproducibles. Monitoreo periódico de fuentes que ya conocemos y comparación de revisiones. | Un cambio exclusivamente documental conserva el GLB cuando sigue siendo compatible. Un cambio físico soportado genera otra escena y mantiene su identidad de hardware. |
| E4 · Integración y operación | Cliente del iPad conectado, fallos de red recuperables, backups probados y procedimiento de rollback. | Descargar en el iPad, cortar WAN y abrir el documento y la escena de la revisión instalada. |

**Ruta de demostración más corta:** E0 → E1 → E2. Comenzar con un dispositivo y una fuente. La consulta remota a una IA, el archivo de inspecciones en la nube, la wiki y la reconstrucción desde fotos pertenecen a extensiones separadas. Teamily puede servir para coordinar el evento. El catálogo, el worker y la publicación siguen su flujo automático.

> **En el iPad.** El entregable es conocimiento descargable. El gemelo aparece en Three.js local y el técnico conserva voz, cámara, sesión y lectura autorizada del banco aun cuando se corte Internet.

## 1. Qué instancias existen y dónde corre cada cosa

### 1.1 Inventario inicial de infraestructura

| Elemento | Cantidad | Dónde | Características y ajuste inicial |
|---|---:|---|---|
| VM de FieldScan | **1** | Boat.dev, organización o cuenta del evento habilitada | Tipo `default`, Ubuntu **24.04 LTS x86_64**, **4 vCPU, 8 GB de RAM y 51 GB de disco** según documentación. La plataforma documenta CPU sin GPU. Verificar la imagen y el tamaño asignados al entrar. |
| API HTTP | **1 proceso** | Dentro de la VM | FastAPI + Uvicorn, `0.0.0.0:8080` para el proxy de Boat. Un proceso ASGI inicial, sin recarga de desarrollo, administrado con systemd. |
| Worker | **1 proceso** | Dentro de la misma VM | Python, un trabajo de construcción concurrente. Gestiona red OEM, PDF/OCR, CAD CPU, validación y publicación. Sin puerto de entrada. |
| SQLite | **1 base** | Disco local de la VM | Migraciones numeradas y transacciones cortas. Empezar con `DELETE` y habilitar WAL cuando esté verificada la corrección de SQLite indicada en §7.1. La API y el worker usan conexiones independientes. |
| Almacén de archivos | **1 directorio raíz** | Disco local de la VM | Originales y objetos por hash; temporales y entregas inmutables. Copia fuera de la VM. Token de publicación separado de las credenciales de Boat y de Context. |
| HTTPS | **1 puerto publicado** | Ingreso gestionado por Boat | `boat host <id> 8080`. URL `on.boat.dev` protegida por defecto. Autorización de FieldScan en los endpoints de aplicación. |
| Context.dev | **1 cuenta y una credencial dedicada** | Servicio SaaS externo | El worker invoca búsqueda por HTTPS. FieldScan valida el origen y conserva la evidencia de la fuente. |
| Copia de recuperación | **1 destino operativo** | Equipo de administración o almacenamiento autorizado independiente | Copia consistente de SQLite, objetos/manifiestos y registro del código desplegado. Custodiar la llave privada por un canal separado. |

Boat documenta capacidad en Alemania, Finlandia y Francia y señala que las copias de snapshots pueden vivir fuera de la UE. Para la demo, usar documentos públicos autorizados y fixtures. Registrar la ubicación que exponga la cuenta y revisar residencia antes de mover información privada del cliente. El iPad llega por HTTPS desde donde se use. La máquina se aprovisiona en Boat.dev y cumple el papel de instancia de cómputo para esta arquitectura. Amazon EC2 es otro proveedor posible para trasladar la misma topología si luego existe un requisito de región o disponibilidad. [Boat Machines][B01] · [Ubicaciones y límites][B02] · [Hosting][B03].

**Referencia de costo, no cotización.** Boat publica USD 0.036 por hora para `default`, aproximadamente USD 26.28 de cómputo para 730 horas antes de aplicar créditos y condiciones del plan. La cuenta del evento puede operar con condiciones distintas. Revisar wallet, cuota y auto-stop antes de crear capacidad. El consumo de búsqueda se controla en el adaptador a Context.dev. [Boat Pricing][B04].

### 1.2 Cuándo cambiar de tamaño

Empezar con una cola de un solo worker y PDF/CAD en CPU. Registrar tiempo por etapa, uso máximo de memoria, CPU, crecimiento del disco y tiempo de espera. Un atraso sostenido de la cola con CPU saturada justifica medir una VM mayor o un worker separado. Un proceso CAD que alcance los límites debe marcar la geometría como pendiente y conservar los documentos válidos. Si el volumen obliga a separar API y worker en máquinas distintas, primero migrar a PostgreSQL y almacenamiento privado de objetos. SQLite y el disco de este plan se usan desde la misma VM.

### 1.3 Topología propuesta

~~~mermaid
flowchart TB
    I["iPad o cliente de prueba"] -->|"HTTPS en Boat"| A["API FastAPI"]
    A <--> D["SQLite y archivos de la VM"]
    W["Worker CPU en la misma VM"] <--> D
    W -->|"Búsqueda"| C["Context.dev"]
    W -->|"Descarga autorizada"| O["Fuentes del fabricante"]
~~~

> **En el iPad.** La URL externa sirve al cliente Swift de catálogo. La pantalla HMI sigue en su origen nativo local. La dirección LAN del PUSR y el puerto Modbus pertenecen al equipo de campo, no a la VM.

## 2. Preparar cuentas, accesos y valores concretos

Completar esta tabla antes de desplegar. Elegir de forma explícita la cuenta del evento y la ruta de despliegue. Los valores de ejemplo son nombres de configuración, no credenciales.

| Dato | Quién lo obtiene | Dónde vive |
|---|---|---|
| Acceso a la organización Boat.dev o a una VM ya concedida | Operador, desde el enlace oficial del evento o su cuenta Boat | Sesión del CLI local del operador. |
| ID del sandbox, por ejemplo un ID que empieza por `bx_` | CLI `boat new` o sandbox que ya figure en el dashboard | Registro de despliegue. |
| Cuenta y clave de Context.dev | Operador, desde la página de API keys de Context.dev | Configuración privada en la VM. Solo se entrega al worker. |
| URL Git y commit del backend | Equipo que implementa `cloud/` | Registro de release y checkout de la VM. |
| Credencial Bearer de FieldScan | Operador, generada para el piloto | Configuración privada de API. La copia del iPad se guarda en su configuración segura. |
| URL HTTPS y puerta de acceso de Boat | `boat host` para el sandbox y puerto elegidos | URL base en configuración del cliente. El token de la puerta se maneja como secreto y se puede pasar como cookie. |
| Llave Ed25519 de publicación y `key_id` | Operador de despliegue | Privada en VM y custodia autorizada. Pública en fixture, configuración de confianza del iPad y prueba de compatibilidad. |
| Fuente semilla THT‑02 y alcance de acceso | Equipo de FieldScan | Registro de fuentes con revisión, URL, evidencia y permiso. |
| Destino de backup | Operador | Fuera del ciclo de vida del sandbox. Documentar acceso y restauración. |

**Orden de altas.** Primero abrir o reclamar Boat.dev y confirmar que el sandbox esté disponible. Después entrar a Context.dev y generar una clave para FieldScan. Por último, preparar la configuración de aplicación y la llave de firma. Estas credenciales pertenecen a tres sistemas distintos. La clave de gestión de Boat ni la de Context llegan al iPad. [Boat Quickstart][B05] · [Context Quickstart][X01].

## 3. Aprovisionar Boat.dev, paso por paso

Los bloques de terminal usan **Bash**. En la Mac, abrir `/bin/bash` antes de usar `read -p`, los arrays o los ejemplos de verificación. En cada sesión de prueba, activar `set -o pipefail` para que un fallo de `curl` no quede oculto por `jq`. Leer los valores indicados antes de ejecutar cada bloque. Los comandos de una terminal no heredan variables de otra.

### 3.1 En la Mac del operador

Instalar el CLI desde la fuente publicada por Boat. El ejemplo descarga el instalador a un directorio temporal antes de ejecutarlo. Abrir una terminal nueva si el instalador actualiza PATH. En `boat login`, usar la cuenta u organización donde están los créditos o la VM del evento. [Boat Quickstart][B05] · [Índice del CLI][B06].

~~~bash
fieldscan_boat_setup_dir="$(mktemp -d)"
curl --fail --show-error --silent --location \
  https://boat.dev/install -o "$fieldscan_boat_setup_dir/install-boat.sh"
sh "$fieldscan_boat_setup_dir/install-boat.sh"
command -v boat
boat login
boat limits
~~~

Si el evento ya entregó una VM, anotar su ID. Si vas a crear una dentro del plan autorizado, usar `boat new --type default` y copiar el ID que devuelve. Comprobar el sandbox y entrar por SSH:

~~~bash
# Ejecutar solo si necesitas aprovisionar una VM nueva.
boat new --type default

# Pegar el ID de la VM nueva o ya asignada.
read -r -p 'Boat sandbox ID: ' FS_BOAT_ID
boat info "$FS_BOAT_ID"
boat ssh "$FS_BOAT_ID"
~~~

### 3.2 Ya dentro de la VM

Verificar primero el sistema de archivos y la imagen. La guía de instalación siguiente usa Ubuntu 24.04 y Python 3.12 de la distribución. Si la cuenta entrega otra imagen, resolver la diferencia antes de aplicar los comandos que dependen del nombre de los paquetes. La sesión del sandbox puede entrar como root. En ese caso ejecutar las operaciones administrativas directamente si `sudo` no está en la imagen.

~~~bash
cat /etc/os-release
uname -m
nproc
free -h
df -h /
python3 --version
systemctl --version
~~~

Resultado esperado según el tamaño contratado: `x86_64`, Ubuntu 24.04, 4 vCPU y 8 GB nominales. `df` y `free` muestran valores utilizables que pueden diferir de la capacidad comercial.

**Disponibilidad.** Revisar con `boat info` la hora de auto-stop. Boat documenta una hora por defecto y límites adicionales en prueba gratuita. En un plan que lo permita, usar `boat extend "$FS_BOAT_ID" --hours 8` para una ventana de ensayo definida o `boat extend "$FS_BOAT_ID" --no-auto-stop` cuando se autorice dejarlo permanente. Una VM detenida no puede servir la API. `systemd` reanuda los servicios cuando el sandbox vuelve a arrancar, pero no mantiene la VM encendida. [Auto-stop][B07] · [Persistencia][B06].

### 3.3 Instalar herramientas del sistema

Ejecutar en la VM. Los comandos documentan una instalación apt para Ubuntu 24.04. Cualquier instalación aprobada por la cuenta del evento puede requerir acceso a los repositorios de paquetes desde esa VM.

~~~bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl git jq openssl sqlite3 \
  python3 python3.12 python3.12-venv \
  poppler-utils tesseract-ocr tesseract-ocr-eng xz-utils

python3.12 --version
sqlite3 --version
pdfinfo -v
pdftotext -v
pdftoppm -v
tesseract --version
tesseract --list-langs
~~~

`poppler-utils` aporta extracción de texto, conteo de páginas y rasterización. `tesseract-ocr-eng` cubre el manual inglés inicial. Instalar el paquete de idioma adicional solo al agregar fuentes que lo requieran. Anotar versiones de paquetes Ubuntu y Python en el registro de release. Usar el mismo conjunto para los fixtures de regresión.

### 3.4 Usuario de servicio, estructura de disco y permisos

Los ejemplos usan `sudo` con el usuario administrador de la VM. El usuario `fieldscan` ejecuta API y worker sin sesión interactiva. El operador escribe releases y configuración. Los procesos escriben exclusivamente en el directorio de datos.

~~~bash
if ! id fieldscan >/dev/null 2>&1; then
  sudo useradd --system --user-group --home-dir /var/lib/fieldscan \
    --shell /usr/sbin/nologin fieldscan
fi

sudo install -d -o root -g root -m 0755 /opt/fieldscan/releases
sudo install -d -o root -g fieldscan -m 0750 /etc/fieldscan
sudo install -d -o fieldscan -g fieldscan -m 0750 \
  /var/lib/fieldscan /var/lib/fieldscan/objects \
  /var/lib/fieldscan/staging /var/lib/fieldscan/reports
~~~

~~~text
/opt/fieldscan/
  current -> releases/<commit>/
  releases/<commit>/cloud/
  bin/gltf_validator
/etc/fieldscan/
  api.env
  worker.env
  signer-ed25519.pem
  signer-ed25519.pub.pem
/var/lib/fieldscan/
  catalog.sqlite3
  objects/sha256/<primeros-2>/<sha256-completo>
  staging/<job-id>/<intento>/
  reports/
~~~

La mayor parte del software queda en una carpeta de release inmutable. El código consulta `/var/lib/fieldscan` para los datos. La separación permite cambiar el código sin tocar el catálogo. Los objetos publicados se almacenan en el mismo filesystem que staging para poder moverlos de forma atómica.

> **En el iPad.** Esas rutas Linux son internas al servidor. El cliente recibe IDs, tamaños y hashes, y administra sus propias rutas dentro del contenedor de la app.

## 4. Software del backend y repositorio a instalar

### 4.1 Dependencias y comando que las usa

| Software | Instalación | Uso inicial |
|---|---|---|
| Python 3.12 | Ubuntu apt | API, worker, CLI y validadores. |
| `uv` | Instalador oficial en la máquina de desarrollo y en la VM de build | Generar `uv.lock` en desarrollo y reproducirlo con `uv sync --locked`. |
| `fastapi`, `uvicorn`, `pydantic` | Proyecto Python `cloud/` con lock | API JSON, validación y servidor ASGI. |
| `httpx` | Lock de Python | Clientes HTTPS para Context.dev y fuentes OEM. Límites, timeouts y pruebas. |
| `sqlite3` de Python / CLI sqlite3 | Biblioteca estándar / apt | Persistencia. El CLI sirve para inspección y backup consistente. |
| `cryptography` | Lock de Python | Firma Ed25519 y pruebas de verificación de manifiesto. |
| Poppler + Tesseract | Ubuntu apt | Extraer texto, rasterizar y ejecutar OCR solo si hace falta. |
| `numpy` y `trimesh` | Lock de Python | Construir y exportar una escena GLB CPU, con mallas y nodos por pieza. |
| Khronos glTF Validator | Ejecutable Linux x86_64 de release fijada | Prueba de conformidad glTF. FieldScan agrega su validación de referencias, unidades y affordances del iPad. |
| `pytest` | Grupo `dev` de uv | Suite API, firma, persistencia y generación. |
| CadQuery | Grupo opcional `step`, con lock y prueba de instalación | Importación STEP en E3. Mantener el wrapper opcional hasta validar módulos de Ubuntu/Python y preservación de identidad de piezas. |

Una fase que aún sirve un GLB ya exportado necesita verificarlo. La fase que importa CAD OEM necesita además el conversor y los fixtures de producción correspondientes. La publicación de documentación parcial puede avanzar aunque el conversor no cubra un modelo nuevo. [FastAPI Deploy][S01] · [uv][S02] · [Trimesh GLB][S03] · [Khronos Validator][S04] · [CadQuery STEP][S05].

### 4.2 Dónde crear el nuevo código

Usar `cloud/` dentro del repositorio FieldScan en una rama de implementación. El commit revisado proporciona contexto y formatos locales. El backend de la estación Mac en `src/fieldscan/server.py` atiende cámara y diagnóstico de banco. El nuevo servicio se construye como módulo propio. Puede reutilizar datos y algoritmos de geometría después de revisar su procedencia, unidades y dependencias, evitando arrastrar la estación local a la VM.

~~~text
cloud/
  pyproject.toml
  uv.lock
  fieldscan_cloud/
    __init__.py
    api.py
    config.py
    db.py
    worker.py
    cli.py
    sources/
    documents/
    twin/
    publication/
  migrations/
    001_initial.sql
  tests/
  fixtures/
  deploy/
    fieldscan-api.service
    fieldscan-worker.service
    api.env.example
    worker.env.example
~~~

| Componente | Qué implementar en el primer commit que lo use |
|---|---|
| `api.py` | App `app`, salud, resolve, estado, manifiesto, blob y errores tipados. Consultas pequeñas y trabajos asíncronos respecto del cliente. |
| `db.py` | Inicialización, configuración SQLite, transacciones y acceso por dominio. Cerrar conexiones y aplicar migraciones mediante comando explícito. |
| `worker.py` | Arranque como módulo. Reclamar, ejecutar, reintentar y registrar. Manejar SIGTERM sin publicar una revisión incompleta. |
| `cli.py` | `migrate --db PATH`, `seed-fixture`, `verify-release` y comandos de recuperación controlados. Crear cada CLI antes de usar su nombre en despliegue. |
| `sources/` | Adaptador Context, registro de origen, normalización, coincidencia de variantes y adquisición de originales. |
| `documents/` | Inventario de fuentes, extracción por página y derivados con coordenadas, hashes y citas. |
| `twin/` | Generador determinista, normalización y pruebas de GLB, API interna para validación de páginas/nodos/acciones. |
| `publication/` | Staging, contenido dirigido por hash, generación de manifiesto, firma, selección de revisión y consistencia de dependencias. |

### 4.3 Configurar Python y el lock en desarrollo

Plantilla de arranque para `cloud/pyproject.toml`. Las versiones resueltas se guardan en `cloud/uv.lock` y se validan en Linux x86_64 antes de instalar en la VM. `package = false` ejecuta el módulo desde `cloud/` y evita crear un paquete distribuible para este piloto. `pydantic` se usa de forma explícita en modelos de contrato.

~~~toml
[project]
name = "fieldscan-cloud"
version = "0.1.0"
requires-python = ">=3.12,<3.13"
dependencies = [
  "fastapi",
  "uvicorn",
  "pydantic>=2,<3",
  "httpx",
  "cryptography",
  "numpy",
  "trimesh",
]

[project.optional-dependencies]
step = ["cadquery"]

[dependency-groups]
dev = ["pytest"]

[tool.uv]
package = false
~~~

Desde `cloud/` en la máquina de desarrollo:

~~~bash
uv lock --python 3.12
uv sync --locked --python 3.12
uv run --locked --python 3.12 pytest -q
~~~

El último comando se ejecuta después de agregar pruebas. Mantener el lock en el commit publicado con el backend. En la VM se usa el lock del subdirectorio cloud, independiente del lock histórico de la estación local. [uv Installation][S02] · [uv Lock/Sync][S06].

### 4.4 Instalar uv y el validador en la VM

Para instalar uv desde la fuente oficial, descargar el script antes de ejecutarlo. Anotar la versión resultante en el registro de despliegue. En futuras releases fijar y reproducir esa versión con el instalador versionado documentado por Astral. Usar el ejecutable desde la cuenta de despliegue. Los servicios ejecutan directamente el Python de la release.

~~~bash
fieldscan_uv_setup_dir="$(mktemp -d)"
curl --fail --show-error --silent --location \
  https://astral.sh/uv/install.sh -o "$fieldscan_uv_setup_dir/install-uv.sh"
sh "$fieldscan_uv_setup_dir/install-uv.sh"
# Abrir una terminal nueva si el instalador modifica PATH.
uv --version
~~~

Khronos publica el binario Linux64 `2.0.0-dev.3.10`. El ejemplo fija ese release preliminar para tener el mismo análisis entre ejecuciones. Registrar el SHA‑256 observado del archivo y revisarlo contra la huella aprobada por el equipo antes de usarlo en sucesivos despliegues. [Release del validador][S07].

~~~bash
fieldscan_gltf_dir="$(mktemp -d)"
curl --fail --show-error --silent --location \
  https://github.com/KhronosGroup/glTF-Validator/releases/download/2.0.0-dev.3.10/gltf_validator-2.0.0-dev.3.10-linux64.tar.xz \
  -o "$fieldscan_gltf_dir/validator.tar.xz"
sha256sum "$fieldscan_gltf_dir/validator.tar.xz"
tar -xJf "$fieldscan_gltf_dir/validator.tar.xz" -C "$fieldscan_gltf_dir"
fieldscan_validator_bin="$(find "$fieldscan_gltf_dir" -type f -name gltf_validator -print -quit)"
test -f "$fieldscan_validator_bin"
sudo install -D -o root -g root -m 0755 \
  "$fieldscan_validator_bin" /opt/fieldscan/bin/gltf_validator
/opt/fieldscan/bin/gltf_validator --help
~~~

> **En el iPad.** La comprobación de glTF detecta problemas de formato antes de descargar. FieldScan agrega otra prueba para garantizar que «mostrar el bloque DIP» apunte a un nodo presente y a una cita que corresponda a esa variante.

## 5. Instalar el backend implementado y configurarlo en la VM

**Momento de ejecutar esta sección.** Cuando el commit de implementación ya incluya `cloud/pyproject.toml`, `cloud/uv.lock`, un endpoint de salud, el comando de migración y las entradas de API/worker. En una VM recién aprovisionada se puede completar toda la sección 3 mientras el equipo implementa estos módulos. El SHA de referencia del iPad sirve para iniciar la rama, pero el despliegue debe apuntar al SHA que ya contenga el backend.

### 5.1 Clonar y preparar una release inmutable

Ejecutar como operador dentro de la VM. El repositorio actual está en GitHub y se puede clonar por HTTPS según sus permisos vigentes. Una rama aún privada requiere una credencial de lectura autorizada. No poner la credencial en la URL del remoto ni usarla en el iPad. Copiar del PR/commit el SHA completo de la release a desplegar.

~~~bash
read -r -p 'Commit completo del backend cloud: ' FS_RELEASE_SHA
if ! [[ "$FS_RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  printf '%s\n' 'Se necesita un SHA Git de 40 caracteres.' >&2
  exit 1
fi
FS_GIT_URL='https://github.com/armando-token/FieldScan.git'
FS_STAGE="$(mktemp -d)"
git clone --no-checkout "$FS_GIT_URL" "$FS_STAGE/repo"
git -C "$FS_STAGE/repo" checkout --detach "$FS_RELEASE_SHA"
test "$(git -C "$FS_STAGE/repo" rev-parse HEAD)" = "$FS_RELEASE_SHA"
test -f "$FS_STAGE/repo/cloud/pyproject.toml"
test -f "$FS_STAGE/repo/cloud/uv.lock"

FS_RELEASE="/opt/fieldscan/releases/$FS_RELEASE_SHA"
FS_DEPLOY_USER="$(id -un)"
sudo install -d -o "$FS_DEPLOY_USER" -g "$(id -gn)" -m 0755 "$FS_RELEASE"
git -C "$FS_STAGE/repo" archive "$FS_RELEASE_SHA" -- cloud | tar -x -C "$FS_RELEASE"
cd "$FS_RELEASE/cloud"
uv sync --locked --no-dev --python /usr/bin/python3.12
.venv/bin/python -c 'import fastapi, uvicorn, httpx, cryptography, trimesh'
sudo chown -R root:root "$FS_RELEASE"
~~~

Este ejemplo supone una ruta de release nueva. Si el mismo SHA ya existe, verificar su integridad y reutilizarlo, o preparar una copia en otra ruta de staging antes de promoverla. Si el CI productor empaqueta el directorio con lock, la VM puede instalar desde ese artefacto manteniendo el mismo SHA de procedencia. Para habilitar STEP durante E3, generar y probar el lock opcional y sincronizar con `--extra step` en una release nueva. Probar que `.venv/bin/python` funcione con `sudo -u fieldscan` y que no apunte a un interprete ubicado en un directorio privado del operador.

### 5.2 Preparar credenciales y llave de firma

1. Guardar una credencial aleatoria para el cliente de la demo en la bóveda o entrega aprobada. La API puede guardar el SHA‑256 del token y comparar con `hmac.compare_digest`. Usar tokens de alta entropía; el hash de un texto predecible no reemplaza esa entropía. El dispositivo usará el token original. El servidor guarda el digest. En un piloto multiusuario sustituir esa configuración por identidades y scopes.
2. Entrar en [Context.dev API keys][X05], crear una clave dedicada para el worker y confirmar que el proyecto dispone de acceso a búsqueda. En la configuración del worker poner la clave y el límite de resultados y reintentos. Probar desde la VM con el ejemplo de la sección 8.
3. Crear una llave Ed25519 para el emisor de demo. Mantener la privada solo en la custodia y en la unidad de publicación. Extraer su llave pública en Base64 de **32 bytes crudos** para el contrato de Swift. La representación PEM se conserva para herramientas de servidor.

Para generar el primer token FieldScan desde una sesión privada de Bash, crear el archivo con permiso restringido y transferirlo a la bóveda autorizada. Copiar a `FS_API_TOKEN_SHA256` solamente los 64 caracteres del digest. La clave de Context y el token de Boat se obtienen de esos servicios.

~~~bash
umask 077
FS_TOKEN_DIR="$(mktemp -d)"
openssl rand -hex 32 | tr -d '\n' > "$FS_TOKEN_DIR/fieldscan-api-token"
sha256sum "$FS_TOKEN_DIR/fieldscan-api-token"
~~~

Ejecutar la generación solo al iniciar un emisor nuevo. Si ya existe, usar el proceso de custodia y rotación, no regenerarla sobre una publicación activa.

~~~bash
if sudo test -e /etc/fieldscan/signer-ed25519.pem; then
  printf '%s\n' 'La llave ya existe. Usar la llave custodiada o la rotación.' >&2
  exit 1
fi
sudo install -o root -g root -m 0600 /dev/null /etc/fieldscan/signer-ed25519.pem
sudo openssl genpkey -algorithm ED25519 -out /etc/fieldscan/signer-ed25519.pem
sudo openssl pkey -in /etc/fieldscan/signer-ed25519.pem -pubout \
  -out /etc/fieldscan/signer-ed25519.pub.pem
sudo chmod 0644 /etc/fieldscan/signer-ed25519.pub.pem

"$FS_RELEASE/cloud/.venv/bin/python" - <<'PY'
import base64
from pathlib import Path
from cryptography.hazmat.primitives import serialization
public = serialization.load_pem_public_key(
    Path("/etc/fieldscan/signer-ed25519.pub.pem").read_bytes()
)
raw = public.public_bytes(
    serialization.Encoding.Raw, serialization.PublicFormat.Raw
)
print(base64.b64encode(raw).decode("ascii"))
PY
~~~

El valor impreso es público. Etiquetarlo con `key_id`, entorno y emisor. La configuración de confianza del iPad usa ese valor por un canal autenticado de distribución. El cliente no aprende una llave de confianza desde el mismo manifiesto que intenta verificar.

### 5.3 Archivos de configuración de cada proceso

Crear los archivos con permisos de root y editarlos localmente. Los valores `REEMPLAZAR_...` son placeholders que el servicio debe rechazar si siguen presentes al iniciar. Usar comillas compatibles con `EnvironmentFile` si un valor contiene espacios. Cuidar que la configuración de desarrollo con claves de fixture nunca se habilite en la VM que entrega al iPad.

~~~bash
sudo touch /etc/fieldscan/api.env /etc/fieldscan/worker.env
sudo chown root:root /etc/fieldscan/api.env /etc/fieldscan/worker.env
sudo chmod 0600 /etc/fieldscan/api.env /etc/fieldscan/worker.env
sudoedit /etc/fieldscan/api.env /etc/fieldscan/worker.env
~~~

Contenido de `/etc/fieldscan/api.env`:

~~~dotenv
FS_ENV=pilot
FS_CHANNEL=pilot
FS_DB_PATH=/var/lib/fieldscan/catalog.sqlite3
FS_DATA_DIR=/var/lib/fieldscan
FS_SQLITE_JOURNAL_MODE=DELETE
FS_API_TOKEN_SHA256=REEMPLAZAR_DIGEST_HEX_DE_64
FS_LOG_LEVEL=INFO
~~~

Contenido de `/etc/fieldscan/worker.env`:

~~~dotenv
FS_ENV=pilot
FS_CHANNEL=pilot
FS_DB_PATH=/var/lib/fieldscan/catalog.sqlite3
FS_DATA_DIR=/var/lib/fieldscan
FS_SQLITE_JOURNAL_MODE=DELETE
FS_SIGNING_KEY_ID=pilot-1
FS_ISSUER=fieldscan-pilot
FS_GLTF_VALIDATOR=/opt/fieldscan/bin/gltf_validator
FS_CONTEXT_SEARCH_URL=https://api.context.dev/v1/web/search
CONTEXT_DEV_API_KEY=REEMPLAZAR_CLAVE_CONTEXT
FS_CONTEXT_MAX_RESULTS=10
FS_MAX_JOB_ATTEMPTS=3
FS_JOB_LEASE_SEC=180
FS_LOG_LEVEL=INFO
~~~

Todos los nombres `FS_` son parte de la implementación propuesta. Validar en `config.py` que el archivo de acceso a SQLite, datos y binarios apunten al árbol autorizado. El worker debe leer la llave privada desde `CREDENTIALS_DIRECTORY/signer.pem`; systemd se la entrega a esa unidad. Configurar credenciales, límite de solicitudes y logs desde el proceso correspondiente. Mantener la clave de Context en el worker.

### 5.4 Unidades systemd y puesta en marcha

Versionar estos contenidos en `cloud/deploy/`. La VM usa `systemd` y el enlace `current`. El directorio de código es de lectura y el state dir es de escritura. La política presupone que dependencias e intérprete ya están instalados antes del arranque. `PrivateTmp` es por servicio. Los artefactos que necesiten persistir se escriben en staging de FieldScan.

`cloud/deploy/fieldscan-api.service`:

~~~ini
[Unit]
Description=FieldScan Cloud API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=fieldscan
Group=fieldscan
WorkingDirectory=/opt/fieldscan/current/cloud
EnvironmentFile=/etc/fieldscan/api.env
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PYTHONUNBUFFERED=1
ExecStart=/opt/fieldscan/current/cloud/.venv/bin/python -m uvicorn fieldscan_cloud.api:app --host 0.0.0.0 --port 8080 --workers 1 --no-proxy-headers --no-access-log
Restart=on-failure
RestartSec=3
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/fieldscan
UMask=0077

[Install]
WantedBy=multi-user.target
~~~

`cloud/deploy/fieldscan-worker.service`:

~~~ini
[Unit]
Description=FieldScan Cloud package worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=fieldscan
Group=fieldscan
WorkingDirectory=/opt/fieldscan/current/cloud
EnvironmentFile=/etc/fieldscan/worker.env
LoadCredential=signer.pem:/etc/fieldscan/signer-ed25519.pem
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=PYTHONUNBUFFERED=1
Environment=OMP_NUM_THREADS=2
ExecStart=/opt/fieldscan/current/cloud/.venv/bin/python -m fieldscan_cloud.worker
Restart=on-failure
RestartSec=3
TimeoutStopSec=45
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/fieldscan
UMask=0077

[Install]
WantedBy=multi-user.target
~~~

Campos de proxy. La API usa rutas relativas y devuelve IDs/URLs relativas. El ejemplo desactiva el uso de cabeceras reenviadas para identidad y evita publicar enlaces absolutos basados en `Host`. Si luego una integración exige URLs absolutas, usar la URL canónica configurada. No registrar URLs con credenciales. [Uvicorn Settings][S08] · [systemd.exec][S09].

**Arranque inicial.** Crear primero la base y luego las unidades. El ejemplo supone que el nuevo módulo implementa `migrate --db`. En una VM ya operativa, realizar backup y detener escritor/es antes de una migración que afecte los datos. Ambas unidades hacen comprobaciones de esquema compatibles con su release.

~~~bash
cd "$FS_RELEASE/cloud"
sudo -u fieldscan "$FS_RELEASE/cloud/.venv/bin/python" \
  -m fieldscan_cloud.cli migrate --db /var/lib/fieldscan/catalog.sqlite3

sudo ln -s "$FS_RELEASE" /opt/fieldscan/current.new
sudo mv -Tf /opt/fieldscan/current.new /opt/fieldscan/current

sudo install -m 0644 deploy/fieldscan-api.service /etc/systemd/system/
sudo install -m 0644 deploy/fieldscan-worker.service /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/fieldscan-api.service \
  /etc/systemd/system/fieldscan-worker.service
sudo systemctl daemon-reload
sudo systemctl enable --now fieldscan-api.service fieldscan-worker.service
sudo systemctl is-active fieldscan-api.service fieldscan-worker.service
curl --fail --show-error --silent http://127.0.0.1:8080/healthz
sudo journalctl -u fieldscan-api.service -u fieldscan-worker.service -n 80 --no-pager
~~~

En arranques posteriores `enable --now` no reinicia servicios ya activos. Una nueva release requiere `restart` tras mover `current`. Si `current.new` ya existe, identificar y resolver la promoción anterior antes de continuar. Si `curl` local falla, revisar `ss -lntp`, logs, permisos y esquema antes de publicar el puerto.

### 5.5 Publicar HTTPS desde la Mac y probar desde otra red

Salir de SSH o abrir otra terminal en la Mac. Seleccionar la misma VM y publicar solo el puerto de API. Boat devuelve la URL base bajo `on.boat.dev` y puede adjuntar una credencial `_token` para su puerta de acceso. Anotar la base HTTPS sin query y guardar el token de Boat por separado. En el cliente nativo se puede usar la cookie `_port_auth` documentada. La API de FieldScan conserva su propia autorización. [Hosting de Boat][B03].

~~~bash
boat host "$FS_BOAT_ID" 8080
~~~

Prueba de la puerta y del estado. Las variables se ingresan de forma local en Bash. Para el archivo de credenciales definitivo usar la bóveda aprobada. No incluir los valores en capturas ni en el historial.

~~~bash
read -r -p 'URL base HTTPS, sin query: ' FS_PUBLIC_URL
read -r -s -p 'Token de acceso al puerto Boat: ' FS_BOAT_PORT_TOKEN
printf '\n'
curl --fail --show-error --silent \
  -H "Cookie: _port_auth=$FS_BOAT_PORT_TOKEN" \
  "$FS_PUBLIC_URL/healthz" | jq .
~~~

`/healthz` confirma la API y el esquema sin exponer secretos. Que responda **no demuestra por sí solo** que el worker realice trabajos ni que Context esté autorizado. El siguiente ensayo debe resolver un fixture y leer su estado. Para acceso iPad, provisionar URL base, token de la puerta de Boat cuando aplique y token de FieldScan por separado. La clave de administración del sandbox, el token del puerto y el token de acceso a la API son credenciales distintas.

> **En el iPad.** Este es el primer momento en que el cliente nativo puede probar el endpoint de verdad. Su `GET /healthz` solo verifica sincronización. El fallo de WAN no cambia su backend local y no cancela una inspección.

## 6. Qué API hay que programar y qué devuelve

### 6.1 Endpoints y errores de aplicación

| Método y ruta | Resultado |
|---|---|
| `GET /healthz` | 200 con estado y revisión de servicio si esquema utilizable. 503 si no puede atender. Cuerpo mínimo. |
| `POST /v1/catalog/resolve` | Consigue una publicación disponible para identidad exacta o crea/reutiliza un trabajo. 200 con resultado disponible o necesidad de identificar. 202 con `job_id` y disponibilidad anterior opcional. |
| `GET /v1/jobs/{job_id}` | Devuelve la fase de procesamiento y qué se puede usar. Si no existe para ese ámbito, 404. Incluye códigos de razón, candidatos y publicación cuando se conozcan. |
| `GET /v1/catalog/products/{product_id}/variants/{variant_id}/manifest` | Devuelve el sobre firmado de la publicación vigente y `ETag`. Comprobar autorización antes de retornar también un 304. |
| `GET /v1/catalog/blobs/{sha256}` | Devuelve bytes del objeto referenciado por una publicación autorizada. Respuesta por archivo, `Content-Length`, tipo y ETag. Soporte de `Range` cuando se concluya la prueba de 206, 416 y 200 completa. |
| `HEAD /v1/catalog/blobs/{sha256}` | Opcional y coherente con GET. Documentar si el primer cliente lo requiere. |

Usar esquemas Pydantic para longitud, campos admitidos y normalización explícita. Autorización Bearer en rutas de catálogo y trabajo. No aceptar una URL OEM enviada por el iPad como destino directo de red. Dar 400/422 a un cuerpo inválido, 401/403 a autenticación o ámbito incorrectos, 429 por cuota, 503 por indisponibilidad transitoria. Se recomienda error estable con `error.code`, `error.message` sin secretos y `request_id`. Consultas a publicaciones y objetos comprueban el ámbito en cada acceso. Saber el hash de un blob no concede autorización.

Configuración inicial para un piloto privado. Limitar resolución a una lista de credenciales verificadas, número de trabajos por cliente y tamaño de cuerpo. Aplicar límites temprano y registrar intentos por código y correlación. Los endpoints de cliente no reciben archivos privados ni ofrecen administración de firmas. La semilla y el control de releases pertenecen a la CLI de operador.

### 6.2 Separar trabajo, identidad y capacidades

Solicitud compatible con el plan iPad. Un `null` expresa un atributo que el cliente aún no conoce.

~~~json
{
  "manufacturer": "TZONE",
  "model": "TZ THT-02",
  "variant": null,
  "hardware_revision": null
}
~~~

Respuesta 202 para búsqueda nueva:

~~~json
{
  "job_id": "job_demo_001",
  "job_state": "queued",
  "availability": null,
  "retry_after_seconds": 2
}
~~~

Respuesta 200 del endpoint de trabajo cuando ya está publicada una ficha, con geometría interna pendiente:

~~~json
{
  "job_id": "job_demo_001",
  "job_state": "completed",
  "availability": "partial",
  "identity": {
    "product_id": "tzone_tht02",
    "variant_id": "demo_variant",
    "resolution": "exact"
  },
  "capabilities": {
    "documentation": "available",
    "interactive_twin": "unavailable",
    "procedures": "unavailable"
  },
  "reason_codes": ["INTERNAL_GEOMETRY_UNCONFIRMED"],
  "publication_seq": 7
}
~~~

Los IDs de ejemplo corresponden a un fixture. `job_state` toma `queued`, `running`, `completed` o `failed`. `availability` toma `ready`, `partial`, `needs_identification` o `null` mientras aún no existe resultado. El de búsqueda puede responder con un trabajo activo y una publicación en caché. En `needs_identification` devolver candidatos con el discriminante mínimo. El motivo de capacidad parcial pertenece a la respuesta y al rastro de publicación. Ante falta de fuentes utilizables, devolver el código específico en el resultado de trabajo y cualquier candidato permitido, manteniendo el estado de la última publicación aplicable. Estos ejemplos congelan las formas del prototipo junto al [plan del iPad][C02]. Acordar nombres adicionales mediante pruebas compartidas antes de desplegar.

> **En el iPad.** Con 202, la pantalla consulta el ID de trabajo. Con `partial`, puede abrir el manual y presentar qué falta. Con `needs_identification`, pide el sufijo o revisión del equipo que tiene el técnico enfrente.

## 7. Persistencia, cola de trabajos y publicación atómica

### 7.1 Modelo de almacenamiento

| Grupo de tablas | Campos y restricciones mínimas |
|---|---|
| `tenants`, `api_credentials` | Identidad de ámbito y estado de credencial. Un único ámbito en demo. Identificar tokens por digest o ID público sin exponer el secreto. |
| `products`, `variants`, `aliases` | IDs canónicos, fabricante, modelo, sufijo y revisión aplicable. Alias normalizados y mapeo que soporte más de un candidato. El estado de soporte de banco pertenece al catálogo homologado. |
| `sources`, `source_revisions` | Origen, URL final y canónica, clasificación, revisión impresa, fecha de consulta, ETag/Last-Modified, permiso, hash de bytes y evidencia de la decisión. Identidad por fuente y contenido. |
| `jobs` | ID, ámbito, `request_key`, estado, intentos, `available_at`, `lease_until`, token de reclamo, razón, fase y referencias de resultado. Índice parcial único para trabajos activos equivalentes. |
| `objects` | SHA‑256, bytes, formato, ruta derivada y fecha de registro. Los archivos originales y derivados pueden compartir el almacén, con permisos asignados por referencia. |
| `publications`, `publication_objects` | Ámbito, variante, canal, secuencia por línea de publicación, huella de entrada, hash de manifiesto, estado/capacidades y relación a roles de artefactos. Publicaciones inmutables. |
| `current_publications` | Un puntero por ámbito, variante y canal. Se actualiza en la misma transacción que publica la nueva revisión. |
| `source_events`, `publication_events` | Correlación, decisión automática, actor de CLI para operaciones de mantenimiento y motivos de cambios/retiradas. |

Aplicar `PRAGMA foreign_keys=ON` en cada conexión, `busy_timeout` inicial de 5 s y `synchronous=FULL`. Mantener transacciones cortas y hacer red/CAD fuera de ellas. La migración configura el journal persistente. Los procesos comprueban el modo configurado al iniciar, con los mismos valores en ambos servicios. Empezar con rollback journal `DELETE` para la única VM y la carga inicial. SQLite documenta una corrección de concurrencia para WAL en 3.51.3 y backports específicos. Antes de activar WAL, verificar el runtime Python y que el paquete de Ubuntu tenga esa corrección o usar un runtime que la incluya. La versión informada por Python y la revisión del paquete de la distribución se anotan por separado. Conservar la base en disco local. [SQLite WAL][S10].

~~~bash
python3.12 -c 'import sqlite3; print(sqlite3.sqlite_version)'
dpkg-query -W sqlite3 libsqlite3-0
~~~

### 7.2 Deduplicación, reclamo y recuperación

Normalizar la solicitud antes de persistir. `request_key` deriva de ámbito, canal, fabricante, modelo, variante/revisión o su ausencia y modo de resolución. Usar JSON determinista o campos ordenados con delimitación inequívoca. Si una solicitud nueva tiene la misma clave activa, devolver ese trabajo. Un proceso para actualizar un equipo conocido puede reusar esa misma clave de identidad si sus objetivos coinciden. Guardar las diferencias relevantes de propósito para no confundir una revisión que requiere reevaluación con una consulta caché.

Patrón de operación para `BEGIN IMMEDIATE`:

1. Elegir un trabajo `queued` disponible o un `running` con lease vencido. Actualizar estado, intento y token de reclamo en la misma transacción. Persistir el nuevo vencimiento.
2. Liberar la transacción y ejecutar etapas con timeouts. Renovar lease durante trabajos largos desde una conexión independiente y cerrar archivos temporales al cancelar.
3. Escribir avance y resultado condicionado a que coincidan estado y token. Una continuación anterior que perdió el lease no puede finalizar ni mover `current`.
4. En error transitorio, volver a `queued` con espera progresiva y máximo de intentos. En variante ambigua, terminar con el resultado correspondiente. En crash, permitir retomarlo al vencer el lease y limpiar staging asociado a intentos antiguos solo cuando sea seguro.
5. Calcular una huella de entrada de publicación con las revisiones fuente, política, generador y dependencias. Una repetición exacta retorna la publicación existente. Una corrección/reemisión autorizada usa una intención de publicación propia y se registra.

Fragmento de la migración que fija las restricciones de la cola. La implementación añade claves foráneas del modelo y validaciones de ámbito. Las transiciones se encapsulan en el módulo de datos.

~~~sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  request_key TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued','running','completed','failed')),
  phase TEXT NOT NULL DEFAULT 'enqueued',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at INTEGER NOT NULL,
  lease_until INTEGER,
  lease_token TEXT,
  result_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX jobs_active_request
  ON jobs(tenant_id, request_key)
  WHERE state IN ('queued','running');

CREATE INDEX jobs_schedule
  ON jobs(state, available_at, created_at);
~~~

### 7.3 Objetos, commit y comparación de revisiones

- Guardar archivos como objeto dirigido por SHA‑256 bajo `objects/sha256/xx/<hash>`. El usuario no suministra rutas de servidor. Comprobar hashes de bytes finales y evitar servir directorios temporales.
- Cada publicación lleva secuencia monotónica por emisor/canal/variante. Reservar la secuencia al validar la disponibilidad anterior dentro de la transacción de publicación. Si se construye el manifiesto antes del commit, guardar la expectativa de versión anterior y abortar o rearmar cuando haya sido superada. No dejar una revisión incompleta visible al cliente.
- Escribir archivos temporales, verificar byte count, mover en el mismo filesystem y persistir de acuerdo con las exigencias de recuperación. Después, crear la publicación y el puntero en una transacción breve. Un cierre antes del commit puede dejar objetos huérfanos pero el catálogo sigue sirviendo el paquete anterior. Registrar y reconciliar tras arranque. No eliminar objetos que alguna revisión conservada pueda necesitar.
- Conociendo un hash anterior idéntico, reutilizar el objeto. Las URLs de fuentes pueden cambiar y un PDF puede cambiar manteniendo URL. Actualizar ambos historiales por separado. `ETag` y `Last-Modified` ayudan a evitar transferencias, y usar SHA‑256 cuando el servidor devuelve el archivo completo. Programar verificaciones completas apropiadas cuando la fuente pueda cambiar sin actualizar metadatos.
- La restauración de una publicación anterior válida se emite con secuencia superior. Si una fuente nueva invalida una instrucción antigua, registrar la retirada explícita y propagarla a clientes al sincronizar. Mantener el expediente histórico referenciado y etiquetado. Firmar avisos que cambien la disponibilidad de procedimientos y acordar el campo de extensión con Swift. Los clientes desconectados consumen su última política sincronizada.

> **En el iPad.** Una descarga interrumpida nunca significa que desapareció el paquete anterior. Los enlaces por hash permiten que dos revisiones coexistan. La app fija su propio contexto de inspección y usa el manifiesto que instaló.

## 8. Configurar y probar Context.dev; implementar búsqueda de fuentes

### 8.1 Prueba directa desde la VM

Configurar `CONTEXT_DEV_API_KEY` mediante método privado. Para un ensayo breve en Bash, ingresarla sin eco y limpiar la variable al finalizar. El servidor usa la configuración del worker. Esta es la API oficial de búsqueda, distinta de la API que consume el iPad. [Context Search][X02] · [Campos y autenticación][X03].

~~~bash
read -r -s -p 'Context.dev API key: ' CONTEXT_DEV_API_KEY
printf '\n'
curl --fail-with-body --show-error --silent \
  --connect-timeout 8 --max-time 25 \
  -X POST 'https://api.context.dev/v1/web/search' \
  -H "Authorization: Bearer $CONTEXT_DEV_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"TZONE TZ THT-02 RS485 datasheet manual","numResults":10}' \
  | jq '{count: (.results | length), urls: [.results[].url]}'
unset CONTEXT_DEV_API_KEY
~~~

Verificar que el resultado trae `results` y URLs legibles. No interpretar el orden del buscador como certificación de modelo. Si devuelve 401, revisar la clave y el ámbito. Para 402 o un error de créditos, comprobar la cuenta. Para 429, registrar el límite y respetar la espera reportada. Al automatizar, separar HTTP y JSON. Guardar ID de solicitud del vendor si existe, consulta normalizada, URLs y tiempos en los logs permitidos. El acceso real depende de la cuota y credenciales del operador.

### 8.2 Selección de fuentes y variante

1. **Consultar el catálogo local.** Si fabricante y modelo resuelven a una publicación vigente, devolverla y comprobar novedades en segundo plano cuando corresponda. Para un equipo desconocido, programar descubrimiento.
2. **Consultar Context.dev de forma acotada.** Construir consulta solo con fabricante, modelo y palabras de tipo documental. Empezar con una búsqueda de máximo diez resultados. Usar el filtro `includeDomains` si el fabricante ya tiene orígenes autorizados, comprobando los campos con la versión del endpoint. Una variante puede justificar una segunda consulta exacta; establecer presupuesto de búsquedas por trabajo.
3. **Clasificar hallazgos.** Priorizar sitio oficial del fabricante y su portal de descargas. Un dominio confiable debe estar en el registro de fuentes. La presencia de un nombre en un snippet solo genera una pista. La aplicación comprueba URL final, contenido y relación con la variante antes de publicar.
4. **Encontrar identificadores técnicos.** Comparar código de documento, título, tabla de modelos, etiqueta/revisión de hardware cuando esté disponible y notas de variante. Distinguir página, catálogo, manual, plano y CAD con reglas propias. Un PDF de catálogo que menciona varias variantes no sustituye el manual específico.
5. **Aceptar o devolver evidencia parcial.** Si hay documento exacto y permitido, instalar el catálogo de documentación. Si hay dos sufijos plausibles, retornar ambos y qué dato los diferencia. Si el único resultado es una copia sin procedencia suficiente, conservarla como candidata de registro y mostrar la limitación. El trabajo termina y el iPad recibe respuesta.
6. **Seguir fuentes conocidas.** En la primera entrega usar un comando de reconsulta o temporizador simple de la VM, sin depender de un monitor externo. Cuando sea útil, añadir Monitors de Context.dev para páginas/sitemaps. Un webhook se valida con el mecanismo documentado de firma, deduplica evento e inicia trabajo. La descarga y comprobación de bytes siguen en FieldScan. [Monitors][X04].

Para la primera semilla, registrar como referencias distintas la [página OEM de TZONE][T01], el [catálogo OEM publicado en su portal][T02], la [copia pública V1.0][T03] y el [V1.1 incorporado en el commit][G02]. Verificar antes de declarar cuál aplica al sensor concreto, modelo de placa y revisión. Una prueba de ingestión puede procesar material de referencia claramente etiquetado. Los procedimientos activos requieren su evidencia aplicable.

### 8.3 Descarga defensiva, permisos y trazabilidad

- Separar adaptador de Context y adquisición OEM. El adaptador recibe URLs candidatas. El descargador acepta solo HTTPS a orígenes autorizados y tipos previstos. Validar todos los saltos de redirección, usar resolución que rechace direcciones no públicas y verificar el destino de conexión. Para el MVP limitar descargas a orígenes OEM previamente consignados en el registro. Un dominio nuevo se conserva como información de búsqueda hasta que se pueda establecer su relación y permiso.
- Acotar longitud de respuesta, número de redirecciones, máximo de páginas/objetos y tiempo. Procesar en streaming y resolver el tipo desde contenido y cabeceras. Un HTML de login con extensión PDF vuelve como error de fuente y jamás entra al pipeline de publicación. Evitar credenciales incrustadas y redactar query sensible de los logs.
- Ejecutar parsers y herramientas CAD con argumentos construidos por el programa, tiempos/recursos acotados y sin heredar credenciales. Mantener herramientas actualizadas. Para la demo usar fuentes registradas y fixtures. Ampliar a documentos arbitrarios solo con un aislamiento probado de herramientas de parsing y permisos de publicación.
- Guardar original, fecha y huella, URL descubierta y final, revisión impresa, metadatos del proveedor y licencia o alcance. Retener los documentos restringidos dentro del ámbito permitido. El sistema puede publicar un enlace oficial y los datos autorizados aunque el original tenga restricciones de redistribución.
- Diferenciar una consulta no disponible de «sin fuente comprobada». Un 429 o error temporal no debe borrar el catálogo anterior. Registrar `source_unreachable` o el motivo adecuado y permitir reintento. Un caso al OEM es seguimiento separado, de modo que el resultado parcial se entregue mientras se resuelve.

> **En el iPad.** Escribir «THT‑02» puede devolver dos variantes y pedir el sufijo visible en la pieza. Eso previene que un equipo con otra placa reciba instrucciones de DIP o un conector que no corresponde.

## 9. Procesar PDF, OCR, citas y revisiones

### 9.1 Cadena de procesamiento

1. **Crear un snapshot de entrada.** Guardar los bytes originales y el contexto de fuente. El worker registra producto, variante o estado ambiguo, revisión impresa, idioma, permiso y roles esperados.
2. **Validar el contenedor.** Abrir con `pdfinfo` en staging y extraer número de páginas. Tratar PDFs cifrados, truncados, demasiado grandes o con permiso insuficiente como casos explícitos. Limitar recursos por proceso. Los valores iniciales propuestos para la demo son 40 MiB por PDF y 100 páginas. Ajustarlos con archivos representativos y el presupuesto local del iPad.
3. **Extraer por página.** Ejecutar `pdftotext` por página. Conservar el texto y, cuando sea necesario, coordenadas o líneas. Revisar si el texto resultante es legible y si cubre la página requerida. Una tabla larga o imagen rasterizada puede necesitar OCR específico aunque el resto del PDF ya tenga texto.
4. **Rasterizar selectivamente.** Usar `pdftoppm` para páginas necesarias para cita, vista y OCR. Guardar PNG seleccionados por una política de tamaño y resolución. Como referencia inicial, 150 DPI para vista y 250–300 DPI para la región de OCR cuando haga falta. Mantener límites de píxeles y bytes.
5. **OCR por necesidad.** Ejecutar Tesseract en las páginas o recortes escaneados. Seleccionar un idioma instalado. Marcar método de extracción, región y confianza donde esté disponible. Si una celda de número o símbolo no es clara, devolver evidencia parcial. Nunca convertir ausencia de texto en valor cero ni mezclar columnas por similitud.
6. **Generar derivados.** Mantener PDF original, Markdown por documento/página e índice de citas. Guardar documento, revisión, página física basada en 1, etiqueta impresa si existe y región o sección. Usar texto seguro en la interfaz. Un artefacto que corresponda a otra variante se queda en la fuente candidata.
7. **Registrar cambios.** Comparar bytes y contenido semántico. Distinguir corrección editorial, cambio de citas, cambio de instrucciones y cambio de geometría. Una reimpresión con mismo contenido puede no requerir nuevo GLB. Un cambio eléctrico puede afectar procedimientos aunque la malla permanezca igual.

Prueba manual del conjunto de utilidades. Ejecutar en la VM sobre una copia permitida y ajustar el número de página según el PDF. El worker usa llamadas por argumentos y directorios propios, no pega texto del usuario en shell.

~~~bash
FS_PDF_WORK="$(mktemp -d)"
read -r -p 'Ruta al PDF autorizado de prueba: ' FS_PDF_INPUT
test -r "$FS_PDF_INPUT"
pdfinfo "$FS_PDF_INPUT"
pdftotext -f 1 -l 1 -layout "$FS_PDF_INPUT" "$FS_PDF_WORK/page-1.txt"
pdftoppm -f 1 -l 1 -r 150 -png -singlefile \
  "$FS_PDF_INPUT" "$FS_PDF_WORK/page-1"
tesseract "$FS_PDF_WORK/page-1.png" "$FS_PDF_WORK/page-1-ocr" -l eng
sha256sum "$FS_PDF_INPUT" "$FS_PDF_WORK/page-1.png"
~~~

Si el resultado de OCR puede influir en un procedimiento técnico, conservar evidencia de la célula y aplicar reglas por fabricante/plantilla. Empezar con los campos verificables del THT‑02 y expandir por familia. La inferencia opcional con NY Token Exchange puede extraer una propuesta estructurada con cita, con presupuesto y timeout definidos. El worker verifica antes de habilitar cualquier capacidad dependiente. Una falla de NYTE deja ese campo pendiente y el catálogo sigue publicando el material validado.

### 9.2 Artefactos documentales

| Rol | Ejemplo de ruta | Regla |
|---|---|---|
| `manual_pdf` | `docs/tht02/manual.pdf` | Binario autorizado, hash exacto, documento identificado. |
| `manual_markdown` | `docs/tht02/pages/page_005.md` | Derivado con método y referencia. |
| `manual_page_image` | `docs/tht02/pages/page_005.png` | Opcional si el visor puede abrir el PDF directamente. |
| `document_index` | `docs/index.json` | Enlaza título, documento, revisión, página, objetos y regiones. Congelar nombre de rol con Swift. |

> **En el iPad.** La voz consulta el índice instalado y el visor abre la página que corresponde al documento y a la revisión de la sesión. Una imagen ausente puede abrirse desde el PDF instalado, según el visor local.

## 10. Construir o importar el gemelo en CPU

### 10.1 Entradas y nivel de respaldo

| Entrada disponible | Qué construye el servidor | Estado que ofrece |
|---|---|---|
| Escena GLB ya generada para una variante conocida | Valida, indexa nodos y añade metadatos de interacción. | `interactive_twin` cuando todas sus dependencias son válidas. |
| CAD autorizado con identidad de piezas o piezas STEP identificadas | Convierte a mallas, normaliza la escena y conserva o añade identificadores según el mapa validado. | Gemelo interactivo para partes que tengan correspondencia. |
| Planos acotados con dimensiones verificables | Genera componentes paramétricos reproducibles, registra las cotas y límites de la representación. | Completo donde hay evidencia. Modelo exterior o visual parcial donde no la hay. |
| Fotos o PDF sin suficiente dimensión interna | Vista de referencia exterior si se puede respaldar y ficha disponible cuando aplique. | Geometría parcial rotulada. Procedimientos internos no habilitados. |
| Evidencia de otro hardware o fuentes contradictorias | Conserva candidatos, solicita discriminante y emite resultado parcial. | Sin gemelo accionable para la identidad no confirmada. |

**Primera construcción.** Usar THT‑02 como perfil de referencia y preparar un GLB con carcasa, tapa o tramo de vista explotada y el bloque DIP, según la evidencia disponible. El commit examinado tiene escena Three.js paramétrica y exportadores del entorno local. Para E1 el equipo puede producir un GLB reproducible desde esa geometría o crear un fixture equivalente y etiquetado en `cloud/fixtures/`. No confundir el exportador STL actual, que puede perder jerarquía y materiales, con una entrega GLB por partes. Para E3 extraer los parámetros autorizados a un generador CPU explícito. [Escena base][G03] · [Trimesh][S03].

### 10.2 Receta de geometría por variante

Guardar en repositorio una receta versionada por variante. Debe declarar:

- ID de producto, variante y revisiones de hardware que cubre.
- Fuente de cada medida, pieza o aproximación. Unidades de entrada y transformación de ejes de salida. glTF usa metros como unidad lineal. Convertir en un solo punto. Mantener un par de medidas de control tomadas de la fuente y comprobar su tolerancia.
- IDs estables de pieza, relación padre/hijo, transformación, pivote, materiales simples y etiqueta. Seleccionar como ID una identidad dentro de nuestra variante y conservarla al renombrar la malla.
- Vistas, poses y elementos manipulables. Si se usan animaciones en GLB, registrar nombres/IDs de clips y comprobar que existan. Si se usan poses de datos, validar límites y transformaciones. No generar ni servir JS dentro del paquete.
- Acciones respaldadas y citas. Las acciones son datos tipados que el iPad interpreta. El trabajo puede preparar `focus_part`, `show_view`, `highlight_part`, `simulate_state`, `show_reference` y `reset_view` según el contrato. Usar orientación y nomenclatura de la variante validada. 
- Presupuesto propuesto para E1: GLB autocontenido, materiales simples, sin decodificadores remotos, y pruebas en el iPad si supera 20 MiB o el perfil de memoria acordado. Ese número es un punto de partida para medir. Registrar tamaño, número de nodos y triángulos para detectar regresiones.

### 10.3 Implementar y probar el exportador

1. Generar o cargar cada componente en CPU. Con Trimesh construir una `Scene` con nodos independientes. Si se conserva metadata en `extras` o se usa un mapa externo de nombres, elegir un mecanismo, congelarlo con el iPad y asegurarse de que sobrevive a exportación y carga. La función de exportación documenta `tree_postprocessor` para adecuar el árbol JSON cuando se necesite. [Trimesh GLB][S03].
2. Exportar un GLB autocontenido y guardarlo en staging. Verificar que no haya URI externa, referencia a red o extensión que requiera un decodificador no empaquetado. Usar la versión de escena acordada con el equipo del visor. [glTF 2.0][S11].
3. Ejecutar el validador Khronos, leer su reporte JSON y rechazar errores. Definir política explícita para warnings por código. Medir los warnings soportados en desarrollo. Hacer que el worker conserve el reporte interno para reproducir fallos. [Validador][S04].
4. Ejecutar validaciones propias de FieldScan. IDs únicos, nodos existentes, delimitación de capacidades, referencias de página dentro de rango, cotas/ejes del fixture y poses accionables. Un GLB sintácticamente válido puede seguir siendo el del modelo equivocado.
5. Cuando E3 necesite STEP, usar `cadquery.importers.importStep` sobre archivos autorizados y tessellar shapes de manera reproducible. Validar estructura y unidades. Si el flujo de importación pierde organización de ensamblaje, partir el CAD en componentes conocidos o usar un mapeo trazable. Probar una pieza representativa y la preservación de identidad antes de anunciar cobertura de un fabricante. [CadQuery STEP][S05].

~~~bash
read -r -p 'Ruta al GLB preparado para comprobar: ' FS_GLB_PATH
test -f "$FS_GLB_PATH"
/opt/fieldscan/bin/gltf_validator -o "$FS_GLB_PATH" > "$FS_GLB_PATH.validator.json"
jq '.issues | {numErrors, numWarnings}' "$FS_GLB_PATH.validator.json"
jq -e '.issues.numErrors == 0' "$FS_GLB_PATH.validator.json"
~~~

En automatización, capturar por separado el código de salida y el reporte, incluso cuando haya errores. El validador puede retornar un código distinto de cero al encontrar problemas. Mantener la transacción de publicación fuera de la ejecución del conversor.

### 10.4 Qué lleva la semántica de una escena

Ejemplo reducido para un fixture. La cita y los nombres en el árbol se verifican cruzadamente. Este JSON muestra el contrato de intención de escena. Acordar la forma exacta de `twin.parts.json` y `twin.actions.json` con Swift y la HMI antes de cerrar E1.

~~~json
{
  "parts": [
    {
      "part_id": "dip.bank",
      "node_id": "DIPBank",
      "aliases": ["DIP bank", "switch block"],
      "citation_id": "fixture_manual:p5:section1"
    }
  ],
  "actions": [
    {
      "kind": "focus_part",
      "part_id": "dip.bank",
      "view_id": "open_dip",
      "citation_id": "fixture_manual:p5:section1"
    }
  ]
}
~~~

> **En el iPad.** El servidor publica una escena y referencias declarativas. El usuario dice «Show me the DIP bank». El cliente local identifica `dip.bank`, activa la vista, muestra el nodo y abre la fuente instalada. La VM nunca opera el gateway ni registra una maniobra física.

## 11. Armar, firmar y servir una publicación

### 11.1 Reglas de construcción por capacidad

| Capacidad | Requisitos mínimos |
|---|---|
| Documentación | Una fuente aplicable con permiso de distribución para el documento o derivado publicado, identidad y revisión. Si se anuncia navegación estructurada, adjuntar índice y citas resolubles. Un PDF autorizado por sí solo puede formar una publicación parcial. |
| Gemelo interactivo | GLB válido, correspondencia variante/partes, mapa de piezas y acciones compatibles. Si hay citas obligatorias, sus documentos existen. El paquete puede distinguir una vista aproximada de una acción técnica verificada. |
| Procedimientos | Reglas documentadas para la variante, dependencias de documentos o piezas completas y evidencia de cada instrucción publicada. La app conserva el perfil de banco local para la lectura física. |

Una publicación puede entregar solo documentación. Si una regla pierde evidencia, quitar o declarar inválida esa capacidad en la nueva publicación. La versión anterior se conserva como historial y solo permanece operativa si sigue aplicando. Los clientes ven estados y razones legibles como `INTERNAL_GEOMETRY_UNCONFIRMED`, `DOCUMENT_VARIANT_AMBIGUOUS`, `SOURCE_RIGHTS_RESTRICTED`, `GLB_VALIDATION_FAILED` o `PROCEDURE_REFERENCE_MISSING`. Estos códigos son propuestas y deben congelarse con la app.

### 11.2 Formato de manifiesto coordinado con el iPad M4

El sobre público contiene `key_id`, `payload_b64` y `signature_b64`. Firmar Ed25519 sobre **los bytes exactos UTF‑8 del payload interno**. Swift verifica esos bytes, no una versión reserializada. Key ID exterior e interior deben coincidir. La llave pública fijada en el cliente tiene 32 bytes crudos. La firma Ed25519 tiene 64 bytes. Usar Base64 estándar y acordar padding, longitud y rechazo de claves JSON duplicadas. Los componentes de campo estructurados se construyen con serialización controlada. [Plan iPad, sección 3][C02] · [Ed25519][S12].

El cuerpo siguiente conserva los campos del ejemplo iPad. La huella sintética demuestra formato. La versión de producción se arma con bytes reales. Para E1 se puede usar índice, fecha, riesgos y otros metadatos extra solo cuando Swift los trate como campos opcionales compatibles.

~~~json
{
  "schema_version": 1,
  "interaction_version": 1,
  "issuer": "fieldscan-pilot",
  "key_id": "pilot-1",
  "product_id": "tzone_tht02",
  "variant_id": "demo_variant",
  "publication_seq": 7,
  "minimum_app_build": 1,
  "sources": [
    {
      "source_id": "fixture_manual",
      "origin": "test_fixture",
      "revision_label": "demo-rev-1"
    }
  ],
  "capabilities": {
    "documentation": true,
    "interactive_twin": false,
    "procedures": false
  },
  "artifacts": [
    {
      "role": "manual_pdf",
      "path": "docs/manual.pdf",
      "document_id": "fixture_manual",
      "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "byte_count": 1295659
    }
  ]
}
~~~

La forma deliberadamente usa los mismos booleans de capacidades que el manifiesto del iPad. El endpoint de progreso usa estados textuales `available` o `unavailable`. Los campos `path` representan destinos relativos dentro del paquete y los interpreta su instalador. El objeto se descarga por SHA‑256 y nunca por petición de ruta del servidor.

### 11.3 Algoritmo para publicar y devolver ETag

1. Tomar un resultado válido de procesamiento, clave de versión y señal de lease. Formar una lista de capacidades y sus dependencias. Comprobar integridad de archivos y vigencia de las fuentes.
2. Materializar objetos dirigidos por hash y verificar que están disponibles. Añadirlos al almacén y registrar si se reutilizó un objeto.
3. Crear payload con secuencia, versión, fuentes, hashes, tamaños y capacidades. Firmar con la llave suministrada al worker. Validar también la firma localmente con la pública. Guardar el sobre inmutable como bytes estables. Calcular ETag sobre los bytes concretos de su representación HTTP.
4. Dentro de una transacción corta, registrar publicación, relaciones a objetos y nuevo puntero. Exigir que coincidan lease y versión anterior esperada. Si otro publicador avanzó, resolver de nuevo sin publicar una versión fuera de orden. Cuando una revisión exacta ya existe, regresar su ID.
5. Al leer el manifiesto, comprobar ámbito, resolver puntero coherente y enviar ETag. Un cliente envía `If-None-Match` y puede recibir 304. En blob, usar el objeto exacto y la autorización por publicación. En el primer corte permitir GET completa con reintento y hash. Habilitar `Range` solo tras superar sus pruebas. 

**Rotación.** Distribuir al iPad la llave pública nueva por configuración firmemente autorizada antes de producir publicaciones dependientes. Mantener compatibilidad durante la transición y registrar emisor/canal/versión. Recuperar un paquete anterior con nueva secuencia usando el firmante activo. Un operador no corrige bytes de una publicación ya firmada.

> **En el iPad.** El mismo procedimiento de verificación sirve para HTTPS y para un paquete importado offline. El servidor debe enviar un manifiesto que Swift pueda verificar sin pedir una reconstrucción del JSON.

## 12. Operación, backups, mantenimiento y recuperación

### 12.1 Qué mirar en la VM

~~~bash
sudo systemctl is-active fieldscan-api.service fieldscan-worker.service
sudo journalctl -u fieldscan-api.service -u fieldscan-worker.service -n 150 --no-pager
sudo ss -lntp
df -h /var/lib/fieldscan
free -h
sudo du -sh /var/lib/fieldscan/objects /var/lib/fieldscan/staging
~~~

Rastrear `request_id`, `job_id`, proveedor, fase, duración, código de razón, bytes y publicación sin redactar datos técnicos necesarios. Los tokens, cookies, fuentes privadas y credenciales no se imprimen. La salida del validador y resúmenes de OCR se guardan dentro de `reports/` con retención y ámbitos claros. En el piloto reportar salud de API y edad de último trabajo del worker por vías internas. Una API responde aunque el parser de un documento esté terminando.

| Síntoma | Comprobación inmediata | Recuperación |
|---|---|---|
| HTTPS inaccesible y local correcto | Estado de VM, auto-stop, puerto, URL base y cookie | Reanudar o ampliar la ventana autorizada. Volver a comprobar local y externo. |
| API funciona pero consulta sigue procesando | Worker activo, jobs reclamados, lease y fecha de última transición | Reiniciar o dejar vencer el lease según el supervisor. Confirmar recuperación sin doble publicación. |
| Context responde con cuota o credenciales | Estado HTTP, planes y disponibilidad de la llave dedicada | Dar contexto al job, conservar caché y reintentar con política de espera. |
| Archivo no abre en iPad | Hash, tipo, capacidades, tamaño y compatibilidad declarados | Marcar fallo, conservar publicación anterior válida y probar el mismo GLB con verificador y visor de prueba. |
| Poco disco | Tamaño por recurso y staging huérfano | Limpiar temporales verificando referencias. Pausar construcciones grandes hasta disponer de espacio. |
| Error tras deploy | Commit, esquema/migración y salida de systemd | Volver al release compatible o restaurar datos en un entorno separado. El rollback de código y el de datos se registran por separado. |

### 12.2 Backup consistente inicial

Crear backup antes de una migración y después de la primera publicación validada. Para la primera VM es más simple hacer una ventana breve que suspenda publicaciones y nuevas solicitudes. Acordar la ventana operativa. Guardar una copia de DB, los objetos y metadatos de release fuera de la VM. SQLite `.backup` escribe una copia consistente y evita depender de copiar por separado DB y WAL. [SQLite Backup][S13].

Ejemplo dentro de la VM. La carpeta temporal es del operador. El bloque instala un trap para volver a iniciar los servicios al salir si ambos estaban activos al comenzar y se interrumpe la copia. En mantenimiento automatizado llevar el estado inicial por unidad y registrar la recuperación.

~~~bash
set -euo pipefail
sudo -v
FS_BACKUP_DIR="$(mktemp -d)"
sudo systemctl is-active --quiet fieldscan-api.service
sudo systemctl is-active --quiet fieldscan-worker.service
trap 'sudo systemctl start fieldscan-api.service fieldscan-worker.service || true' EXIT
sudo systemctl stop fieldscan-api.service fieldscan-worker.service

sudo sqlite3 /var/lib/fieldscan/catalog.sqlite3 \
  ".backup '$FS_BACKUP_DIR/catalog.sqlite3'"
sudo tar -C /var/lib/fieldscan -czf "$FS_BACKUP_DIR/objects.tar.gz" objects
readlink -f /opt/fieldscan/current > "$FS_BACKUP_DIR/release-path.txt"
sudo chown "$(id -u):$(id -g)" "$FS_BACKUP_DIR/catalog.sqlite3" \
  "$FS_BACKUP_DIR/objects.tar.gz"
sqlite3 "$FS_BACKUP_DIR/catalog.sqlite3" 'PRAGMA integrity_check;'
(
  cd "$FS_BACKUP_DIR"
  sha256sum catalog.sqlite3 objects.tar.gz release-path.txt > SHA256SUMS
)

sudo systemctl start fieldscan-api.service fieldscan-worker.service
trap - EXIT
printf 'Backup local preparado en %s\n' "$FS_BACKUP_DIR"
~~~

Copiar desde la Mac mediante `boat scp`. Usar el ID de sandbox y la ruta exacta que imprimió el comando de backup. El archivo que queda dentro del sandbox todavía no es un backup externo. [CLI y snapshots][B06].

~~~bash
read -r -p 'ID de la VM que preparó el backup: ' FS_BOAT_ID
read -r -p 'Ruta absoluta que imprimió la VM: ' FS_VM_BACKUP_DIR
FS_MAC_BACKUP_DIR="$(mktemp -d)"
for fs_backup_file in catalog.sqlite3 objects.tar.gz release-path.txt SHA256SUMS; do
  boat scp "${FS_BOAT_ID}:${FS_VM_BACKUP_DIR}/${fs_backup_file}" \
    "$FS_MAC_BACKUP_DIR/$fs_backup_file"
done
(
  cd "$FS_MAC_BACKUP_DIR"
  shasum -a 256 -c SHA256SUMS
)
~~~

Mover esa copia verificada al destino autorizado. Probar restauración en una copia aislada, comprobar `integrity_check`, volver a calcular los blobs de una publicación y consultar por HTTPS antes de considerar la recuperación suficiente. Guardar la llave privada cifrada en el sistema de custodia en un flujo separado del archivo de datos. Los snapshots de Boat complementan la copia externa.

### 12.3 Publicar una actualización de código y revertir

1. Preparar release nueva con su lock fuera de `current`. Ejecutar importación de módulos, pruebas y verificación de migraciones con una copia.
2. Hacer backup y drenar los jobs o esperar a que puedan retomarse por lease. Detener los procesos si la migración modifica catálogo. Aplicar la migración compatible.
3. Actualizar `current` con enlace atómico. Instalar unidades nuevas si cambiaron, ejecutar `daemon-reload` cuando corresponda y reiniciar. Probar salud, job y lectura de la publicación anterior.
4. Si falla, restaurar `current` a una release compatible con el esquema real. Si la migración es incompatible, ensayar la restauración de la copia en paralelo y recuperar de forma controlada. Una versión del código anterior no debe interpretar estructuras nuevas sin pruebas.
5. Gestionar las publicaciones inválidas mediante una secuencia nueva o retiro firmado. La reparación de código y la de evidencias son procesos distintos.

## 13. Fases de programación y criterios de salida

| Fase | Orden de cambios | Bloque de verificación que la cierra |
|---|---|---|
| P0 · VM y conectividad | Alta, login, VM, SSH, apt, usuario, rutas, validador y registro de capacidades reales. | Provider CLI y VM disponibles. Cuando esté implementada salud, probar HTTPS desde otra red. |
| P1 · API y almacenamiento | Crear módulo, lock, migración, autenticación, health, objetos, resolve, estado y semilla. Implementar logs y comprobaciones pequeñas. | El mock de iPad y el cliente HTTP leen respuesta de referencia y fallos básicos. Reiniciar API conserva datos. |
| P2 · Worker y publicación | Reclamo, lease, staging, validador, firma, ETag, publi atómica, recuperación y fixture THT‑02. | Publicación completa firmada que un verificador independiente puede consumir. Divergencia o corte conserva la anterior. |
| P3 · Context y fuentes | Integrar llamada real, resolver variantes, permitir fuentes registradas y producir permisos/códigos claros. | Una ejecución real con búsqueda OEM y otra que llega a parcial o a identificación ambigua. |
| P4 · Documentos y GLB reproducible | Extracción, OCR, indexado, publicación parcial, generador CPU empaquetado y regresiones por revisión. | Dos modos de cambio, editorial y físico. Los fixtures generan salidas rastreables y la escena que se activa corresponde al activo. |
| P5 · Cliente real y operación | Entregar base HTTPS y credenciales, ejecutar contrato y prueba sin WAN, probar backups y operación tras reinicio. | Evidencia de descarga en iPad, retención de revisión y seguimiento documentado de los aspectos no disponibles por hardware. |

La integración de Teamily o la inferencia remota no está en la secuencia de aceptación. Si se evalúa NYTE posteriormente, medir mejora de extracción con fuentes de referencia y dejar la publicación automática libre de esa dependencia.

## 14. Matriz de pruebas de aceptación cloud

Hacer que cada caso deje evidencia con fecha, commit, ID de job o publicación, fuente y resultado observado. Separar fixture local, llamada real de proveedor, sandbox real e iPad físico.

| ID | Experimento | Salida exigida |
|---|---|---|
| CL-HOST-01 | Verificar SO, CPU, RAM, filesystem y Python en la VM | Inventario registrado, entorno compatible con el lock. |
| CL-HOST-02 | Arrancar API y worker con systemd | Unidades activas, cada proceso con su rol y sin errores de esquema. |
| CL-HOST-03 | Consultar `/healthz` local y desde otra red | HTTPS real de Boat responde por la puerta configurada. |
| CL-HOST-04 | Reiniciar VM durante trabajo de fixture | Servicios vuelven, lease se recupera y no hay publicaciones dobles. |
| CL-API-01 | Consultar un equipo ya publicado | 200, variante correcta y publicación en caché. |
| CL-API-02 | Consultar modelo nuevo dos veces | 202 con un solo ID activo por ámbito y solicitud equivalente. |
| CL-API-03 | Consultar progreso, trabajo perdido y credenciales inválidas | Estado previsto, 404/401 según corresponda y ningún detalle privado. |
| CL-API-04 | Solicitar manifiesto y repetir con ETag | 200 seguido de 304 debidamente autorizado. |
| CL-API-05 | Descargar blob con otra credencial o sin ámbito | Bloqueo de acceso aun si el cliente conoce el hash. |
| CL-API-06 | Descargar blob completo y, si se habilita, por rango | SHA‑256 final exacto y respuestas completas/206/416 verificadas. |
| CL-SRC-01 | Buscar TZONE por Context real | Evidencia de ejecución y detección de candidatos OEM sin inferir aplicabilidad. |
| CL-SRC-02 | Presentar revisión de otra variante | Resultado ambiguo o parcial con discriminante. No se activa su procedimiento. |
| CL-SRC-03 | Usar la misma URL con PDF cambiado | Nuevo hash, revisión distinta y decisión semántica registrada. |
| CL-SRC-04 | Buscar fuente sin cuota o con timeout | Reintento acotado y catálogo anterior accesible. |
| CL-SRC-05 | Obtener HTML de portal, respuesta demasiado grande o redirección fuera del origen permitido | Rechazo controlado, sin pasar esos bytes al publicador. |
| CL-SRC-06 | Presentar documento con restricciones | Solo se muestran referencias y derivados que la política permite distribuir. |
| CL-DOC-01 | PDF con texto, página escaneada y tabla incompleta | Texto y OCR separados, cita correcta y celda dudosa con estado pendiente. |
| CL-DOC-02 | Referencia a página fuera de rango | El procedimiento dependiente no se habilita. Documento válido sigue disponible. |
| CL-DOC-03 | Cambiar solo un texto y una cita | Publicación nueva reutiliza el GLB si sigue siendo compatible. |
| CL-CAD-01 | Generar GLB del fixture documentado | Conformidad glTF, unidades medidas e IDs de piezas trazables. |
| CL-CAD-02 | Quitar un nodo que usa una acción | El validador FieldScan detecta la referencia y no publica esa capacidad. |
| CL-CAD-03 | Recibir plano exterior sin detalle interno | Vista exterior o PDF rotulado, sin operación interior no sustentada. |
| CL-CAD-04 | Correlacionar revisión física nueva respaldada | Otra escena para la variante/revisión correspondiente. |
| CL-PUB-01 | Modificar payload, firma o hash de objeto por separado | El verificador del contrato rechaza cada cambio. |
| CL-PUB-02 | Cortar la publicación después de mover objetos | La anterior sigue accesible; inicio recupera el estado y reporta huérfanos. |
| CL-PUB-03 | Intento retransmitido con inputs idénticos | Una única revisión publicada. |
| CL-PUB-04 | Restaurar contenido anterior correcto | Se sirve bajo secuencia superior, conservando la procedencia. |
| CL-PUB-05 | Retirar instrucción antes válida | Se firma el estado nuevo. Clientes sincronizados identifican la retirada. |
| CL-OPS-01 | Restaurar backup en entorno aislado | SQLite íntegro, blobs y manifiestos coinciden y API sirve la revisión elegida. |
| CL-OPS-02 | Cambiar release con migración de prueba | Registro y recuperación de código y datos demostrables. |
| CL-IPAD-01 | Descargar desde la VM y verificar firma y objetos en iPad | La app instala la variante correcta y abre la revisión informada. |
| CL-IPAD-02 | Cortar WAN tras descargar e iniciar una sesión | Manual y GLB quedan disponibles localmente. Evidencia narrada corresponde a esa revisión. |
| CL-IPAD-03 | Descargar otra revisión mientras existe una inspección abierta | El servidor sirve ambas versiones autorizadas y el iPad conserva el contexto fijado. |

### 14.1 Comprobar un trabajo por HTTPS desde la Mac

Usar una Mac u otra conexión externa al sandbox. Las credenciales van en un cliente de pruebas o se leen sin eco. Comprobar que salud, resolución, trabajo, manifiesto y blob funcionan individualmente. El script asume que las rutas ya existen y que el operador tiene acceso al ámbito de demo.

~~~bash
set -o pipefail
read -r -p 'URL base HTTPS, sin query: ' FS_PUBLIC_URL
read -r -s -p 'Token del puerto Boat: ' FS_BOAT_PORT_TOKEN
printf '\n'
read -r -s -p 'Token de acceso FieldScan: ' FS_API_TOKEN
printf '\n'
FS_FIELD_HEADERS=(
  -H "Cookie: _port_auth=$FS_BOAT_PORT_TOKEN"
  -H "Authorization: Bearer $FS_API_TOKEN"
)
FS_VERIFY_DIR="$(mktemp -d)"

curl --fail-with-body --show-error --silent \
  "${FS_FIELD_HEADERS[@]}" \
  -H 'Content-Type: application/json' \
  --data '{"manufacturer":"TZONE","model":"TZ THT-02","variant":null,"hardware_revision":null}' \
  "$FS_PUBLIC_URL/v1/catalog/resolve" -o "$FS_VERIFY_DIR/resolve.json"
jq . "$FS_VERIFY_DIR/resolve.json"
~~~

Si devuelve `job_id`, consultar hasta que el estado sea terminal, respetando tiempos de espera. Si informa ambigüedad, probar la variante del fixture o la evidencia disponible. Para la publicación resuelta, usar los IDs de la respuesta. Estos ejemplos pueden seguir en la misma sesión de Bash.

~~~bash
read -r -p 'Job ID que devolvió el servidor: ' FS_JOB_ID
curl --fail-with-body --show-error --silent "${FS_FIELD_HEADERS[@]}" \
  "$FS_PUBLIC_URL/v1/jobs/$FS_JOB_ID" | jq .

read -r -p 'Product ID publicado: ' FS_PRODUCT_ID
read -r -p 'Variant ID publicada: ' FS_VARIANT_ID
curl --fail-with-body --show-error --silent "${FS_FIELD_HEADERS[@]}" \
  "$FS_PUBLIC_URL/v1/catalog/products/$FS_PRODUCT_ID/variants/$FS_VARIANT_ID/manifest" \
  -o "$FS_VERIFY_DIR/manifest-envelope.json"

jq -er '.payload_b64' "$FS_VERIFY_DIR/manifest-envelope.json" \
  | openssl base64 -d -A > "$FS_VERIFY_DIR/manifest-payload.json"
jq '{product_id, variant_id, publication_seq, capabilities}' \
  "$FS_VERIFY_DIR/manifest-payload.json"
~~~

Decodificar el payload sirve para inspeccionar. La verificación de firma es independiente. En la Mac, usar el entorno de Python de `cloud/` preparado con uv, o ejecutar el mismo bloque en un entorno de verificación autorizado. La llave pública y su ID se obtienen de la configuración confiable de la sección 5.2. Actualizar `FS_VERIFY_DIR` si se copia el sobre a otro lugar.

~~~bash
read -r -p 'Llave pública Ed25519 cruda en Base64: ' FS_PUBLIC_KEY_B64
read -r -p 'Key ID autorizado: ' FS_EXPECTED_KEY_ID
uv run --locked python - "$FS_VERIFY_DIR/manifest-envelope.json" \
  "$FS_PUBLIC_KEY_B64" "$FS_EXPECTED_KEY_ID" <<'PY'
import base64
import json
from pathlib import Path
import sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result

path, public_key_b64, expected_key_id = sys.argv[1:]
envelope = json.loads(Path(path).read_bytes(), object_pairs_hook=unique_keys)
if envelope["key_id"] != expected_key_id:
    raise SystemExit("Unexpected envelope key ID")
public_key = Ed25519PublicKey.from_public_bytes(
    base64.b64decode(public_key_b64, validate=True)
)
payload_bytes = base64.b64decode(envelope["payload_b64"], validate=True)
signature = base64.b64decode(envelope["signature_b64"], validate=True)
public_key.verify(signature, payload_bytes)
payload = json.loads(payload_bytes, object_pairs_hook=unique_keys)
if payload["key_id"] != expected_key_id:
    raise SystemExit("Unexpected signed key ID")
print("Signature verified for publication", payload["publication_seq"])
PY
~~~

La prueba del cliente incluye además identidad, ámbito, esquema y hashes. Para inspeccionar objetos, listar las huellas del payload verificado y comparar una descarga, como en el ejemplo siguiente de Mac con `shasum`.

~~~bash
read -r -p 'SHA-256 indicado en un artefacto del manifiesto: ' FS_BLOB_SHA
if ! [[ "$FS_BLOB_SHA" =~ ^[0-9a-f]{64}$ ]]; then
  printf '%s\n' 'Se necesita un SHA-256 hexadecimal de 64 caracteres.' >&2
  exit 1
fi
curl --fail-with-body --show-error --silent "${FS_FIELD_HEADERS[@]}" \
  "$FS_PUBLIC_URL/v1/catalog/blobs/$FS_BLOB_SHA" \
  -o "$FS_VERIFY_DIR/$FS_BLOB_SHA"
(
  cd "$FS_VERIFY_DIR"
  printf '%s  %s\n' "$FS_BLOB_SHA" "$FS_BLOB_SHA" | shasum -a 256 -c -
)
unset FS_API_TOKEN FS_BOAT_PORT_TOKEN FS_FIELD_HEADERS
~~~

## 15. Cierre y punto exacto de inicio

### Esta es la primera acción concreta

1. En la Mac, instalar y autenticar `boat` en la cuenta que ya tenga acceso.
2. Elegir o crear la VM `default`, anotar su ID y verificar el sistema. Instalar los paquetes apt y preparar directorios.
3. Crear la rama de backend y empezar por **`cloud/pyproject.toml`, la migración inicial, `api.py` con `/healthz`, y el worker que publica un fixture firmado**. Preparar los dos archivos de systemd.
4. Cuando ese primer commit exista, seguir la sección 5 de instalación. Probar HTTPS, publicar THT‑02 y verificar el manifiesto y un blob. Agregar búsqueda real en Context.dev a continuación.
5. Entregar al equipo del iPad el endpoint, el contrato de firma, los IDs del fixture y un caso parcial reproducible.

### Lo que debes poder mostrar al cerrar

- VM seleccionada, release Git y dos servicios recuperables.
- Consulta real a Context.dev que deja evidencia de la fuente obtenida.
- Publicación automática completa y parcial, con integridad y firma comprobadas.
- Repetición del trabajo y del reinicio, con persistencia.
- Descarga e instalación en el iPad cuando la versión del cliente esté disponible. Diferenciar ese ensayo de los que se ejecuten únicamente por HTTP.
- Registro de costo observado, auto-stop, versión de dependencias y destino de backups.
- Lista exacta de cobertura. Un fixture rotulado demuestra el pipeline. El CAD o procedimiento OEM de una variante exige la fuente aplicable.

## 16. Referencias

[C01]: https://chatgpt.com/library?file_id=libfile_417e77e8e03481919476fdb41a1eb410&account_id=personal
[C02]: https://chatgpt.com/library?file_id=libfile_f9f5031b42d48191bffd6322ccc881ec&account_id=personal
[G01]: https://github.com/armando-token/FieldScan/commit/8e6a06504f916cc40e0e7c85177efb7cffa16d04
[G02]: https://github.com/armando-token/FieldScan/blob/8e6a06504f916cc40e0e7c85177efb7cffa16d04/README.md
[G03]: https://github.com/armando-token/FieldScan/blob/8e6a06504f916cc40e0e7c85177efb7cffa16d04/static/app.js
[B01]: https://docs.boat.dev/machines
[B02]: https://boat.dev/
[B03]: https://docs.boat.dev/hosting
[B04]: https://docs.boat.dev/pricing
[B05]: https://docs.boat.dev/quickstart
[B06]: https://docs.boat.dev/llms.txt
[B07]: https://docs.boat.dev/long-running-tasks/auto-stop
[X01]: https://docs.context.dev/quickstart
[X02]: https://docs.context.dev/search/overview
[X03]: https://docs.context.dev/api-reference/web-scraping/search
[X04]: https://docs.context.dev/monitors/overview
[X05]: https://context.dev/dashboard/api-keys
[S01]: https://fastapi.tiangolo.com/deployment/manually/
[S02]: https://docs.astral.sh/uv/getting-started/installation/
[S03]: https://trimesh.org/trimesh.exchange.gltf.html
[S04]: https://github.com/KhronosGroup/glTF-Validator
[S05]: https://cadquery.readthedocs.io/en/stable/importexport.html
[S06]: https://docs.astral.sh/uv/concepts/projects/sync/
[S07]: https://github.com/KhronosGroup/glTF-Validator/releases/tag/2.0.0-dev.3.10
[S08]: https://uvicorn.dev/settings/
[S09]: https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html
[S10]: https://www.sqlite.org/wal.html
[S11]: https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc
[S12]: https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/
[S13]: https://www.sqlite.org/backup.html
[T01]: https://www.tzonedigital.com/en/product/details/31.aspx
[T02]: https://tzonedigital.com/en/download.aspx
[T03]: https://p.globalsources.com/IMAGES/PDT/SPEC/387/K1195613387.pdf



