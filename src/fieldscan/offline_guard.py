"""Airplane-Mode & Isolated Bench Network Guard for FieldScan CAD.

Implements Phase 6.2 (`OFF-01..07`) of the FieldScan specification:
- Permits loopback (`127.0.0.1`, `::1`), configured USB-C NCM link-local tether (`169.254.*`),
  and the single explicitly authorized bench gateway IP (`FIELDSCAN_PUSR_HOST` / `authorized_gateway_host`).
- Blocks all public Internet / WAN egress and logs operational vs blocked socket attempts separately.
"""

from __future__ import annotations

from datetime import datetime, timezone
import ipaddress
import os
import socket
from typing import Any

LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1", "0.0.0.0", "::"}
_AUTHORIZED_BENCH_GATEWAYS: set[str] = set()
_AUTHORIZED_CLOUD_CATALOG_HOSTS: set[str] = set()


def set_authorized_cloud_catalog_host(host: str | None) -> None:
    """Permit ONLY the configured HTTPS Cloud Catalog host while `catalog_sync_enabled=True` (`Section 5.8`)."""
    _AUTHORIZED_CLOUD_CATALOG_HOSTS.clear()
    if not host:
        return
    clean = host.strip().lower()
    if clean:
        _AUTHORIZED_CLOUD_CATALOG_HOSTS.add(clean)


def get_authorized_cloud_catalog_hosts() -> list[str]:
    return sorted(_AUTHORIZED_CLOUD_CATALOG_HOSTS)


def set_authorized_bench_gateway(host: str | None) -> None:
    """Authorize a single private RFC1918 / link-local PUSR gateway IP for bench Modbus TCP."""
    _AUTHORIZED_BENCH_GATEWAYS.clear()
    if not host:
        return
    clean = host.strip().lower()
    if clean in LOOPBACK_HOSTS or clean.startswith("127."):
        _AUTHORIZED_BENCH_GATEWAYS.add(clean)
        return
    try:
        ip_obj = ipaddress.ip_address(clean)
        if ip_obj.is_private or ip_obj.is_link_local or ip_obj.is_loopback:
            _AUTHORIZED_BENCH_GATEWAYS.add(clean)
    except ValueError:
        if clean.endswith(".local"):
            _AUTHORIZED_BENCH_GATEWAYS.add(clean)


def get_authorized_bench_gateways() -> list[str]:
    env_gw = os.environ.get("FIELDSCAN_PUSR_HOST", "").strip().lower()
    out = set(_AUTHORIZED_BENCH_GATEWAYS)
    if env_gw:
        try:
            ip_obj = ipaddress.ip_address(env_gw)
            if ip_obj.is_private or ip_obj.is_link_local or ip_obj.is_loopback:
                out.add(env_gw)
        except ValueError:
            if env_gw.endswith(".local"):
                out.add(env_gw)
    return sorted(out)


def is_allowed_local_host(host: str) -> bool:
    """Return True if host is loopback, allowed USB-C link-local tether, or explicitly authorized bench gateway."""
    clean = (host or "").strip().lower()
    if clean in LOOPBACK_HOSTS or clean.startswith("127."):
        return True

    allow_usb_tether = (
        os.environ.get("FIELDSCAN_ALLOW_USB_TETHER", "1") == "1"
        and os.environ.get("FIELDSCAN_ALLOW_USB_LINKLOCAL", "1") == "1"
    )
    if allow_usb_tether and (clean.startswith("169.254.") or clean.startswith("fe80:")):
        return True

    if clean in get_authorized_bench_gateways():
        return True

    if clean in _AUTHORIZED_CLOUD_CATALOG_HOSTS:
        return True

    if os.environ.get("FIELDSCAN_ALLOW_LAN", "0") == "1":
        if clean.startswith("10.") or clean.startswith("192.168.") or clean.startswith("172."):
            return True

    return False


class OfflineSocketGuard:
    """Runtime socket guard + connection audit distinguishing operational bench traffic vs blocked WAN egress."""

    def __init__(self) -> None:
        self._installed = False
        self._orig_connect = socket.socket.connect
        self.blocked_attempts: list[str] = []
        self.operational_log: list[dict[str, Any]] = []
        self.loopback_connections: int = 0
        self.usb_tether_connections: int = 0
        self.bench_gateway_connections: int = 0
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
                clean = host.strip().lower()
                if not is_allowed_local_host(host):
                    attempt = f"{host}:{port}"
                    guard.blocked_attempts.append(attempt)
                    raise OSError(f"[AIRPLANE_MODE_GUARD] Blocked external socket egress to {attempt}")
                if clean.startswith("169.254.") or clean.startswith("fe80:"):
                    guard.usb_tether_connections += 1
                    cls_name = "usb_tether"
                elif clean in LOOPBACK_HOSTS or clean.startswith("127."):
                    guard.loopback_connections += 1
                    cls_name = "loopback"
                else:
                    guard.bench_gateway_connections += 1
                    cls_name = "bench_gateway"
                if len(guard.operational_log) < 200:
                    guard.operational_log.append(
                        {"target": f"{host}:{port}", "category": cls_name, "ts_utc": datetime.now(timezone.utc).isoformat()}
                    )
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
        """Verify that external WAN IP egress (`8.8.8.8:53`) is actively blocked."""
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
            "blocked_targets": list(self.blocked_attempts[-20:]),
            "loopback_connections": self.loopback_connections,
            "usb_tether_connections": self.usb_tether_connections,
            "bench_gateway_connections": self.bench_gateway_connections,
            "authorized_bench_gateways": get_authorized_bench_gateways(),
            "authorized_cloud_catalog_hosts": get_authorized_cloud_catalog_hosts(),
            "egress_policy": "catalog_https_authorized" if _AUTHORIZED_CLOUD_CATALOG_HOSTS else "strict_local_only",
            "usb_tether_allowed": is_allowed_local_host("169.254.37.69"),
            "verified_at": self.verified_at,
        }


GLOBAL_OFFLINE_GUARD = OfflineSocketGuard()
