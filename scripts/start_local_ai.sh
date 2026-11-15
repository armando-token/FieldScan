#!/usr/bin/env bash
# Start the on-device Liquid AI model so the assistant can chat without Internet.
# The FieldScan server detects it automatically at http://127.0.0.1:8080/v1.
set -euo pipefail

MODEL_DIR="${MODEL_DIR:-$HOME/models/liquid}"
MODEL_FILE="${MODEL_FILE:-LFM3-1.7B-Q4_K_M.gguf}"
MODEL_REPO="${MODEL_REPO:-LiquidAI/LFM3-1.7B-GGUF}"
PORT="${PORT:-8080}"

command -v llama-server >/dev/null || { echo "llama-server not found. Install it with: brew install llama.cpp" >&2; exit 1; }

if [ ! -f "$MODEL_DIR/$MODEL_FILE" ]; then
  mkdir -p "$MODEL_DIR"
  echo "Downloading $MODEL_REPO/$MODEL_FILE (one time, needs Internet)…"
  curl -fL -C - -o "$MODEL_DIR/$MODEL_FILE" "https://huggingface.co/$MODEL_REPO/resolve/main/$MODEL_FILE"
fi

exec llama-server -m "$MODEL_DIR/$MODEL_FILE" --host 127.0.0.1 --port "$PORT" \
  -c 8192 -ngl 99 --alias "${MODEL_ALIAS:-lfm3-1.7b}" --jinja
