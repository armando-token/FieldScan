"""FieldScan Cloud backend package."""

from __future__ import annotations

import os

__version__ = "0.1.0"


def get_release_revision() -> str:
    """Return deployed release SHA or local dev marker."""
    rev = os.environ.get("FS_RELEASE_SHA", "").strip()
    if rev:
        return rev
    cwd = os.getcwd()
    marker = "/releases/"
    if marker in cwd:
        tail = cwd.split(marker, 1)[1].split("/", 1)[0]
        if tail:
            return tail
    return f"dev-{__version__}"
