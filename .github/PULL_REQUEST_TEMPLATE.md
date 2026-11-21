## Summary

- Concise summary of changes and affected subsystems (`ios/`, `src/`, `static/`, `cloud/`, `docs/`).

## Verification Checklist

- [ ] `uv run python scripts/sync_manifest.py --sync-bundle --verify` passes (`100%` SHA-256 parity)
- [ ] `node --check static/app.js` passes
- [ ] `uv run python scripts/audit_no_regressions.py` passes (`0` errors, acyclic DAG, English-only)
- [ ] `uv run pytest -q` (Edge + contract tests) passes
- [ ] `(cd cloud && uv run pytest -q)` (Cloud CAD v2 PBR + auth + worker tests) passes
- [ ] `./scripts/build_ipad_m4_app.sh --unsigned` succeeds (`arm64-apple-ios`) when touching `ios/` or `static/`
- [ ] Read-Only Modbus pilot safety (`FC03` only, bus-target isolation) and zero secret leakage verified
