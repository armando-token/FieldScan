#!/usr/bin/env bash
# Start the on-device Liquid AI models so the boat keeps working without Internet.
#   scripts/start_local_ai.sh          chat model  LFM3-1.7B     -> http://127.0.0.1:8080/v1
#   scripts/start_local_ai.sh omni     voice+vision LFM3-Omni-2B -> http://127.0.0.1:8081/v1
# Run both (two terminals) for offline chat, hands-free Live voice and "What do you see?".
# The FieldScan server detects them automatically.
set -euo pipefail

MODEL_DIR="${MODEL_DIR:-$HOME/models/liquid}"
command -v llama-server >/dev/null || { echo "llama-server not found. Install it with: brew install llama.cpp" >&2; exit 1; }

fetch() { # repo file
  if [ ! -f "$MODEL_DIR/$2" ]; then
    mkdir -p "$MODEL_DIR"
    echo "Downloading $1/$2 (one time, needs Internet)…"
    curl -fL -C - -o "$MODEL_DIR/$2" "https://huggingface.co/$1/resolve/main/$2"
  fi
}

if [ "${1:-chat}" = "omni" ]; then
  REPO="${OMNI_REPO:-LiquidAI/LFM3-Omni-2B-GGUF}"
  fetch "$REPO" LFM3-Omni-2B-Q4_K_M.gguf
  fetch "$REPO" mmproj-LFM3-Omni-2B-Q8_0.gguf
  exec llama-server -m "$MODEL_DIR/LFM3-Omni-2B-Q4_K_M.gguf" --mmproj "$MODEL_DIR/mmproj-LFM3-Omni-2B-Q8_0.gguf" \
    --host 127.0.0.1 --port "${PORT:-8081}" -c 8192 -ngl 99 --alias lfm3-omni-2b --reasoning off --temp 0 --jinja
fi

MODEL_FILE="${MODEL_FILE:-LFM3-1.7B-Q4_K_M.gguf}"
fetch "${MODEL_REPO:-LiquidAI/LFM3-1.7B-GGUF}" "$MODEL_FILE"
exec llama-server -m "$MODEL_DIR/$MODEL_FILE" --host 127.0.0.1 --port "${PORT:-8080}" \
  -c 8192 -ngl 99 --alias "${MODEL_ALIAS:-lfm3-1.7b}" --jinja
