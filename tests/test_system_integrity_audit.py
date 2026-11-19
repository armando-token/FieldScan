"""Automated Pytest Gate Running the System-Wide Anti-Regression & Dependency Audit."""

from __future__ import annotations

import importlib.util
from pathlib import Path


def test_system_wide_dependency_and_anti_regression_audit_gate() -> None:
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "audit_no_regressions.py"
    spec = importlib.util.spec_from_file_location("audit_no_regressions", script_path)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    ok, report = mod.run_full_audit()
    assert ok is True, f"System-wide anti-regression audit failed: {report['errors']}"
    assert report["status"] == "PASS"
    assert report["python_modules_audited"] >= 10
