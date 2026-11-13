#!/usr/bin/env bash
# Pre-Flight Asset Downloader (Run BEFORE Wi-Fi is turned off!)
# Supports:
#   - macOS Apple Silicon / Intel (Mac Mini local hardware rehearsal tonight)
#   - Qualcomm Dragonwing IQ-9075 (Linux ARM64 / Snapdragon tomorrow at Hackathon)
#   - Linux x86_64 (Workstation / Cloud VM)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VENDOR_ROOT="${VENDOR_ROOT:-$HOME/vendor}"
mkdir -p "${VENDOR_ROOT}/llama_cpp" "${VENDOR_ROOT}/models" "${VENDOR_ROOT}/piper"

OS_NAME="$(uname -s)"
ARCH="$(uname -m)"
LLAMA_TAG="b12328"

if [[ "${OS_NAME}" == "Darwin" ]]; then
  if [[ "${ARCH}" == "arm64" ]]; then
    TARBALL="llama-${LLAMA_TAG}-bin-macos-arm64.tar.gz"
  else
    TARBALL="llama-${LLAMA_TAG}-bin-macos-x64.tar.gz"
  fi
  FALLBACK_TARBALL="${TARBALL}"
elif [[ "${ARCH}" == "aarch64" || "${ARCH}" == "arm64" ]]; then
  # Qualcomm Dragonwing IQ-9075 (Ubuntu ARM64 / Snapdragon)
  TARBALL="llama-${LLAMA_TAG}-bin-linux-arm64-snapdragon.tar.gz"
  FALLBACK_TARBALL="llama-${LLAMA_TAG}-bin-ubuntu-arm64.tar.gz"
else
  TARBALL="llama-${LLAMA_TAG}-bin-ubuntu-x64.tar.gz"
  FALLBACK_TARBALL="${TARBALL}"
fi

echo "[1/3] Downloading prebuilt llama.cpp (${TARBALL}) for ${OS_NAME}/${ARCH}..."
cd "${VENDOR_ROOT}/llama_cpp"
if ! curl -fL -o llama.tar.gz "https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_TAG}/${TARBALL}"; then
  curl -fL -o llama.tar.gz "https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_TAG}/${FALLBACK_TARBALL}"
fi
tar -xzf llama.tar.gz
rm -f llama.tar.gz

echo "[2/3] Syncing Python dependencies (pyserial, opencv, pymupdf, ezdxf, piper-tts)..."
cd "${PROJECT_ROOT}"
if ! command -v uv >/dev/null 2>&1; then
  echo "Installing Astral uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
uv sync --extra dev

echo "[3/3] Downloading LiquidAI LFM3-VL-2B, LFM3-Audio-2B & Piper Spanish Voice..."
VENDOR_ROOT="${VENDOR_ROOT}" uv run python -c "
from huggingface_hub import hf_hub_download
import os, pathlib

vendor = pathlib.Path(os.environ.get('VENDOR_ROOT', os.path.expanduser('~/vendor')))
models_dir = vendor / 'models'
piper_dir = vendor / 'piper'

for repo, fname in [
    ('LiquidAI/LFM3-VL-2B-GGUF', 'LFM3-VL-2B-QAD-Q4_0.gguf'),
    ('LiquidAI/LFM3-VL-2B-GGUF', 'mmproj-LFM3-VL-2B-Q8_0.gguf'),
    ('LiquidAI/LFM3-Audio-2B-GGUF', 'LFM3-Audio-2B-Q4_0.gguf'),
    ('LiquidAI/LFM3-Audio-2B-GGUF', 'mmproj-LFM3-Audio-2B-Q4_0.gguf'),
]:
    print(' ->', repo, fname)
    hf_hub_download(repo_id=repo, filename=fname, local_dir=str(models_dir))

for fname in [
    'es/es_ES/davefx/medium/es_ES-davefx-medium.onnx',
    'es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json',
]:
    print(' -> rhasspy/piper-voices', fname)
    hf_hub_download(repo_id='rhasspy/piper-voices', filename=fname, local_dir=str(piper_dir))
"

echo "=================================================================="
echo " Pre-flight offline cache complete in ${VENDOR_ROOT}!"
echo " Ready for Airplane Mode (Wi-Fi OFF) on ${OS_NAME}/${ARCH}."
echo " Launch stack with: ./scripts/start_all.sh"
echo "=================================================================="
