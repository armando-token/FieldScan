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
echo "=================================================================="
echo " FIELDSCAN CAD v2.0 — TZ THT-02 Closed-Loop Repair & SCADA Twin"
echo " Host Platform     : ${OS_NAME} (${ARCH})"
echo " Vendor Root       : ${VENDOR_ROOT}"
echo " Airplane Policy   : 127.0.0.1 Loopback Only (Wi-Fi Safe)"
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

if [[ -z "${LLAMA_SERVER_BIN}" ]]; then
  echo "[ERROR] llama-server binary not found in ${VENDOR_ROOT}/llama_cpp."
  echo "        Run ./scripts/download_assets.sh while online first."
  exit 1
fi

chmod +x "${LLAMA_SERVER_BIN}" || true
LLAMA_LIB_DIR="$(dirname "${LLAMA_SERVER_BIN}")"
export LD_LIBRARY_PATH="${LLAMA_LIB_DIR}:${LD_LIBRARY_PATH:-}"
export DYLD_LIBRARY_PATH="${LLAMA_LIB_DIR}:${DYLD_LIBRARY_PATH:-}"
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

mkdir -p "${PROJECT_ROOT}/logs"

# 1. Start LiquidAI LFM3-VL-2B (Vision + 2D Blueprint + Live Repair) on 127.0.0.1:8091
if ! curl --noproxy '*' -sf http://127.0.0.1:8091/health >/dev/null 2>&1; then
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
  echo "[1/3] LiquidAI/LFM3-VL-2B already active on 127.0.0.1:8091"
fi

# 2. Start LiquidAI LFM3-Audio-2B (Offline English Speech ASR) on 127.0.0.1:8092
if [[ -f "${AUDIO_MODEL}" ]] && ! curl --noproxy '*' -sf http://127.0.0.1:8092/health >/dev/null 2>&1; then
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
  echo "[2/3] LiquidAI/LFM3-Audio-2B already active on 127.0.0.1:8092"
fi

# Wait for VLM health
for _ in $(seq 1 40); do
  if curl --noproxy '*' -sf http://127.0.0.1:8091/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# 3. Start FieldScan FastAPI + OpenCV + Modbus SCADA + Three.js Studio on 127.0.0.1:8088
echo "[3/3] Starting FieldScan CAD v2.0 Studio on 127.0.0.1:8088 ..."
cd "${PROJECT_ROOT}"
exec uv run uvicorn fieldscan.server:app --host 127.0.0.1 --port 8088
