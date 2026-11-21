# Contributing to FieldScan

Thank you for contributing to FieldScan. Because this repository targets both **air-gapped industrial field hardware** (iPad Air M4 + PUSR/RS-485 Modbus) and a **cryptographically signed Cloud CAD v2 pipeline**, every pull request must pass our automated parity, English-only, and anti-regression gates.

---

## 1. Local Development Setup

### Edge / Workstation (Python 3.10–3.12 + `uv`)
```bash
uv sync
uv run python scripts/sync_manifest.py --sync-bundle --verify
```

### Native iPad Air M4 App (macOS + Xcode 16+)
```bash
# Syncs BundleResources, runs audit_no_regressions.py, typechecks all 18 Swift files & builds arm64-apple-ios
./scripts/build_ipad_m4_app.sh --unsigned
```

### FieldScan Cloud Backend (`cloud/`, Python 3.12 + `uv`)
```bash
# System dependencies for PDF rasterization & OCR:
# macOS: brew install poppler tesseract
# Ubuntu/Debian: sudo apt-get install -y poppler-utils tesseract-ocr
cd cloud
uv sync
uv run pytest -q
```

---

## 2. Mandatory Pre-PR Verification Gates

Before opening or updating a pull request, run:

```bash
# 1. Verify BundleResources SHA-256 parity
uv run python scripts/sync_manifest.py --sync-bundle --verify

# 2. Verify frontend JS syntax
node --check static/app.js

# 3. Run the permanent anti-regression, DAG, safety & English-only audit gate
uv run python scripts/audit_no_regressions.py

# 4. Run Edge + Swift contract test suite
uv run pytest -q

# 5. Run Cloud pipeline tests
(cd cloud && uv run pytest -q)

# 6. Verify iPad arm64 build (macOS)
./scripts/build_ipad_m4_app.sh --unsigned
```

---

## 3. Core Engineering Standards

1. **100% English Code, UI, Prompts & Docs:** All source files, UI copy, voice prompts, comments, and docs must remain strictly English (enforced automatically by `scripts/audit_no_regressions.py` and `tests/test_fieldscan_glue.py`). The only scoped exception is `knowledge/localization/copilot_voice_es.json`, audited separately.
2. **Python ↔ Swift 1:1 Contract Parity:** Any change to the copilot action registry, 3D twin controller, manual navigator, session state machine, or Modbus parser must keep `src/fieldscan/*` and `ios/FieldScanM4/*` in strict behavioral parity.
3. **Acyclic Module Graph:** `src/fieldscan/` must remain a strict DAG with zero circular imports.
4. **Zero-CDN Air-Gapped Frontend:** All UI libraries (`Three.js`, `uPlot`, `Lucide`, `Open Props`) must be vendored locally under `static/vendor/`. Never introduce external CDN `<script>` or `<link>` URLs.
5. **Read-Only Pilot Safety:** Never enable live Modbus write function codes or couple visual DIP-8 previews to authorized `targetSlaveId`.
6. **Secret Hygiene:** Never commit `.env` files, private signing keys (`.key`/`.pem`), local SQLite databases (`data/`), model weights (`vendor/`), or local scratch directories.
