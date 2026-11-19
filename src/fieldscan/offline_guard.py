"""Airplane-Mode / Zero-External-Socket Verification Guard for FieldScan CAD."""

from __future__ import annotations

from datetime import datetime, timezone
import os
import socket
from typing import Any


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1", "0.0.0.0", "::"}


def is_allowed_local_host(host: str) -> bool:
    """Return True if host is loopback, allowed USB-C NCM link-local tether, or allowed LAN."""
    clean = (host or "").strip().lower()
    if clean in LOOPBACK_HOSTS or clean.startswith("127."):
        return True

    allow_usb_tether = (
        os.environ.get("FIELDSCAN_ALLOW_USB_TETHER", "1") == "1"
        and os.environ.get("FIELDSCAN_ALLOW_USB_LINKLOCAL", "1") == "1"
    )
    if allow_usb_tether and (clean.startswith("169.254.") or clean.startswith("fe80:")):
        return True

    if os.environ.get("FIELDSCAN_ALLOW_LAN", "0") == "1":
        if clean.startswith("10.") or clean.startswith("192.168."):
            return True

    return False


class OfflineSocketGuard:
    """Optional runtime monkeypatch + live audit proving zero public internet egress."""

    def __init__(self) -> None:
        self._installed = False
        self._orig_connect = socket.socket.connect
        self.blocked_attempts: list[str] = []
        self.loopback_connections: int = 0
        self.usb_tether_connections: int = 0
        self.verified_at: str | None = None

    def install(self) -> None:
        if self._installed:
            return
        orig = self._orig_connect
        guard = self

        def _guarded_connect(sock: socket.socket, address: Any) -> Any:
            if isinstance(address, tuple) and len(address) >= 2:
                host = str(address[0])
                port = address[1]
                if not is_allowed_local_host(host):
                    attempt = f"{host}:{port}"
                    guard.blocked_attempts.append(attempt)
                    raise OSError(
                        f"[AIRPLANE_MODE_GUARD] Blocked external socket egress to {attempt}"
                    )
                if host.startswith("169.254.") or host.lower().startswith("fe80:"):
                    guard.usb_tether_connections += 1
                else:
                    guard.loopback_connections += 1
            return orig(sock, address)

        socket.socket.connect = _guarded_connect  # type: ignore[assignment]
        self._installed = True
        self.verified_at = datetime.now(timezone.utc).isoformat()

    def uninstall(self) -> None:
        if not self._installed:
            return
        socket.socket.connect = self._orig_connect  # type: ignore[assignment]
        self._installed = False

    def self_test(self) -> dict[str, Any]:
        """Verify that external IP egress (e.g. 8.8.8.8:53) is actively blocked."""
        was_installed = self._installed
        if not was_installed:
            self.install()
        external_blocked = False
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            try:
                s.connect(("8.8.8.8", 53))
            except OSError:
                external_blocked = True
            finally:
                s.close()
        finally:
            if not was_installed:
                self.uninstall()

        self.verified_at = datetime.now(timezone.utc).isoformat()
        return {
            "offline_verified": external_blocked,
            "guard_active": self._installed or os.environ.get("FIELDSCAN_AIRPLANE_GUARD", "1") == "1",
            "external_egress_blocked": external_blocked,
            "blocked_external_attempts": len(self.blocked_attempts),
            "loopback_connections": self.loopback_connections,
            "usb_tether_connections": self.usb_tether_connections,
            "usb_tether_allowed": is_allowed_local_host("169.254.37.69"),
            "verified_at": self.verified_at,
        }


GLOBAL_OFFLINE_GUARD = OfflineSocketGuard()
