#!/usr/bin/env bash
# FieldScan THT-02 v2.0 — Turnkey Offline Stack Launcher
# Supports: Mac Mini (Darwin arm64/x86_64), Qualcomm IQ-9075 (Linux aarch64), Linux x86_64
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -z "${VENDOR_ROOT:-}" ]]; then
  if [[ -d "${PROJECT_ROOT}/vendor/models" ]]; then
    VENDOR_ROOT="${PROJECT_ROOT}/vendor"
  elif [[ -d "$HOME/vendor/models" ]]; then
    VENDOR_ROOT="$HOME/vendor"
  else
    VENDOR_ROOT="/home/antigravity/vendor"
  fi
fi

OS_NAME="$(uname -s)"
ARCH="$(uname -m)"
BIND_HOST="${FIELDSCAN_BIND_HOST:-0.0.0.0}"
BIND_PORT="${FIELDSCAN_BIND_PORT:-8088}"
HTTPS_PORT="${FIELDSCAN_HTTPS_PORT:-8443}"
FORCE_HTTPS=0
NO_LLM=0

for arg in "$@"; do
  case "${arg}" in
    --https)
      FORCE_HTTPS=1
      ;;
    --usb-ipad)
      BIND_HOST="0.0.0.0"
      export FIELDSCAN_ALLOW_USB_TETHER=1
      ;;
    --no-llm)
      NO_LLM=1
      ;;
  esac
done

DETECTED_USB_IP="$(ifconfig 2>/dev/null | awk '/inet 169\.254\./ {print $2; exit}' || true)"
TETHER_HOST="${DETECTED_USB_IP:-armandos-mac-mini.local}"

echo "=================================================================="
echo " FIELDSCAN CAD v2.1 — TZ THT-02 Bench Inspection & Read-Only Twin"
echo " Host Platform     : ${OS_NAME} (${ARCH})"
echo " Vendor Root       : ${VENDOR_ROOT}"
echo " Airplane Policy   : 127.0.0.1 Loopback + USB-C Tether (${TETHER_HOST})"
echo " HTTP Studio URL   : http://127.0.0.1:${BIND_PORT} | http://${TETHER_HOST}:${BIND_PORT}"
echo " HTTPS iPad M4 URL : https://${TETHER_HOST}:${HTTPS_PORT}"
echo "=================================================================="

# Hardware pre-check (RS-485 FT2232HL + USB Camera)
if [[ "${OS_NAME}" == "Darwin" ]]; then
  RS485_DEVS="$(ls /dev/cu.usbserial* 2>/dev/null | tr '\n' ' ' || true)"
else
  RS485_DEVS="$(ls /dev/ttyUSB* 2>/dev/null | tr '\n' ' ' || true)"
fi
if [[ -n "${RS485_DEVS}" ]]; then
  echo " [HW] USB-RS485 Detected : ${RS485_DEVS}"
else
  echo " [HW] USB-RS485 Bus      : Standby (auto-hotplug ready + SCADA simulator active)"
fi

# Auto-locate llama-server binary
LLAMA_SERVER_BIN="${LLAMA_SERVER_BIN:-}"
if [[ -z "${LLAMA_SERVER_BIN}" ]]; then
  LLAMA_SERVER_BIN="$(find "${VENDOR_ROOT}/llama_cpp" -type f -name "llama-server" 2>/dev/null | head -n 1 || true)"
fi
if [[ -z "${LLAMA_SERVER_BIN}" ]] && command -v llama-server >/dev/null 2>&1; then
  LLAMA_SERVER_BIN="$(command -v llama-server)"
fi

if [[ "${NO_LLM}" == "1" ]]; then
  echo "[LLM] --no-llm specified: running in deterministic Local Rules v2.1 mode (OFF-03)."
  LLAMA_SERVER_BIN=""
elif [[ -z "${LLAMA_SERVER_BIN}" ]]; then
  echo "[WARN] llama-server binary not found in ${VENDOR_ROOT}/llama_cpp — degrading cleanly to Local Rules v2.1 mode."
fi

if [[ -n "${LLAMA_SERVER_BIN}" ]]; then
  chmod +x "${LLAMA_SERVER_BIN}" || true
  LLAMA_LIB_DIR="$(dirname "${LLAMA_SERVER_BIN}")"
  export LD_LIBRARY_PATH="${LLAMA_LIB_DIR}:${LD_LIBRARY_PATH:-}"
  export DYLD_LIBRARY_PATH="${LLAMA_LIB_DIR}:${DYLD_LIBRARY_PATH:-}"
fi
export NO_PROXY="127.0.0.1,localhost,::1"
export no_proxy="127.0.0.1,localhost,::1"

if command -v nproc >/dev/null 2>&1; then
  THREADS="$(nproc)"
elif [[ "${OS_NAME}" == "Darwin" ]]; then
  THREADS="$(sysctl -n hw.ncpu)"
else
  THREADS=4
fi
if (( THREADS > 6 )); then
  THREADS=6
fi

GPU_ARGS=()
if [[ "${OS_NAME}" == "Darwin" ]]; then
  # Enable Metal GPU offload automatically on Mac Mini!
  GPU_ARGS=(-ngl 99)
fi

MODELS_DIR="${MODELS_DIR:-${VENDOR_ROOT}/models}"
VL_MODEL="${MODELS_DIR}/LFM3-VL-2B-QAD-Q4_0.gguf"
VL_MMPROJ="${MODELS_DIR}/mmproj-LFM3-VL-2B-Q8_0.gguf"
AUDIO_MODEL="${MODELS_DIR}/LFM3-Audio-2B-Q4_0.gguf"
AUDIO_MMPROJ="${MODELS_DIR}/mmproj-LFM3-Audio-2B-Q4_0.gguf"
export PIPER_VOICE_MODEL="${PIPER_VOICE_MODEL:-${VENDOR_ROOT}/piper/en/en_US/lessac/medium/en_US-lessac-medium.onnx}"
export FIELDSCAN_PIPER_ONNX="${FIELDSCAN_PIPER_ONNX:-${PIPER_VOICE_MODEL}}"
export FIELDSCAN_CAMERA_MODE="${FIELDSCAN_CAMERA_MODE:-usb}"

mkdir -p "${PROJECT_ROOT}/logs"

# 1. Start LiquidAI LFM3-VL-2B (Vision + 2D Blueprint + Live Repair) on 127.0.0.1:8091
if [[ -n "${LLAMA_SERVER_BIN}" && -f "${VL_MODEL}" ]] && ! curl --noproxy '*' -sf http://127.0.0.1:8091/health >/dev/null 2>&1; then
  echo "[1/3] Starting LiquidAI/LFM3-VL-2B on 127.0.0.1:8091 (${THREADS} threads)..."
  nohup "${LLAMA_SERVER_BIN}" \
    -m "${VL_MODEL}" \
    --mmproj "${VL_MMPROJ}" \
    --host 127.0.0.1 \
    --port 8091 \
    -c 2048 \
    -t "${THREADS}" \
    "${GPU_ARGS[@]}" \
    --image-max-tokens 128 \
    --reasoning off \
    --reasoning-budget 0 \
    --top-p 1.0 \
    --min-p 0.0 \
    --no-reasoning-preserve \
    > "${PROJECT_ROOT}/logs/lfm3_vl_8091.log" 2>&1 &
else
  echo "[1/3] VLM :8091 skipped or already active"
fi

# 2. Start LiquidAI LFM3-Audio-2B (Offline Speech ASR) on 127.0.0.1:8092
if [[ -n "${LLAMA_SERVER_BIN}" && -f "${AUDIO_MODEL}" ]] && ! curl --noproxy '*' -sf http://127.0.0.1:8092/health >/dev/null 2>&1; then
  echo "[2/3] Starting LiquidAI/LFM3-Audio-2B on 127.0.0.1:8092 (${THREADS} threads)..."
  nohup "${LLAMA_SERVER_BIN}" \
    -m "${AUDIO_MODEL}" \
    --mmproj "${AUDIO_MMPROJ}" \
    --host 127.0.0.1 \
    --port 8092 \
    -c 2048 \
    -t "${THREADS}" \
    "${GPU_ARGS[@]}" \
    --reasoning off \
    --reasoning-budget 0 \
    --top-p 1.0 \
    --min-p 0.0 \
    --no-reasoning-preserve \
    > "${PROJECT_ROOT}/logs/lfm3_audio_8092.log" 2>&1 &
else
  echo "[2/3] Audio ASR :8092 skipped or already active"
fi

# Wait for VLM health only if launched
if [[ -n "${LLAMA_SERVER_BIN}" && -f "${VL_MODEL}" ]]; then
  for _ in $(seq 1 40); do
    if curl --noproxy '*' -sf http://127.0.0.1:8091/health >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

# Auto-generate self-signed TLS certificate for iPad Air M4 WebKit Secure Context (getUserMedia camera + mic)
TLS_CRT="${PROJECT_ROOT}/logs/ipad_tls.crt"
TLS_KEY="${PROJECT_ROOT}/logs/ipad_tls.key"
SAN_LIST="IP:127.0.0.1,DNS:localhost,DNS:armandos-mac-mini.local"
if [[ -n "${DETECTED_USB_IP}" ]]; then
  SAN_LIST="${SAN_LIST},IP:${DETECTED_USB_IP}"
fi
if [[ ! -f "${TLS_CRT}" || ! -f "${TLS_KEY}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    echo "[TLS] Generating local self-signed certificate (${SAN_LIST})..."
    openssl req -x509 -newkey rsa:2048 -nodes \
      -keyout "${TLS_KEY}" \
      -out "${TLS_CRT}" \
      -days 825 \
      -subj "/CN=FieldScan-M4-Local/O=FieldScan CAD v2.1" \
      -addext "subjectAltName=${SAN_LIST}" \
      >/dev/null 2>&1 || true
  fi
fi

# 3. Start FieldScan FastAPI + OpenCV + Modbus SCADA + Three.js Studio
cd "${PROJECT_ROOT}"
if [[ "${FORCE_HTTPS}" == "1" && -f "${TLS_CRT}" && -f "${TLS_KEY}" ]]; then
  echo "[3/3] Starting FieldScan CAD v2.0 Studio (HTTPS) on https://${BIND_HOST}:${BIND_PORT} ..."
  exec uv run uvicorn fieldscan.server:app \
    --host "${BIND_HOST}" \
    --port "${BIND_PORT}" \
    --ssl-keyfile "${TLS_KEY}" \
    --ssl-certfile "${TLS_CRT}"
else
  if [[ -f "${TLS_CRT}" && -f "${TLS_KEY}" ]]; then
    if ! lsof -iTCP:"${HTTPS_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[TLS] Starting companion HTTPS endpoint for iPad Air M4 camera/mic on https://${BIND_HOST}:${HTTPS_PORT} ..."
      nohup uv run uvicorn fieldscan.server:app \
        --host "${BIND_HOST}" \
        --port "${HTTPS_PORT}" \
        --ssl-keyfile "${TLS_KEY}" \
        --ssl-certfile "${TLS_CRT}" \
        > "${PROJECT_ROOT}/logs/fieldscan_https_${HTTPS_PORT}.log" 2>&1 &
    fi
  fi
  echo "[3/3] Starting FieldScan CAD v2.0 Studio on http://${BIND_HOST}:${BIND_PORT} ..."
  exec uv run uvicorn fieldscan.server:app --host "${BIND_HOST}" --port "${BIND_PORT}"
fi
