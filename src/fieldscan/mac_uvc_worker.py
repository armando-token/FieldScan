"""Dedicated macOS AVFoundation UVC camera capture subprocess.

Runs `cv2.VideoCapture(..., cv2.CAP_AVFOUNDATION)` on its own process main thread
while actively pumping `CFRunLoopGetMain()` via CoreFoundation so macOS CoreMediaIO
and Continuity Camera device-graph notifications never stall frame delivery inside
an async `uvloop` server process.
"""

from __future__ import annotations

import ctypes
import ctypes.util
import json
import os
import re
import shutil
import signal
import struct
import subprocess
import sys
import time
from pathlib import Path

FRAME_MAGIC = b"FSCN"
HEADER_STRUCT = struct.Struct("<4sHHHI")

_SKIP_DEVICE_TOKENS = (
    "iphone",
    "ipad",
    "continuity",
    "capture screen",
    "desk view",
    "virtual",
)
_USB_PRIORITY_TOKENS = (
    "wbc",
    "uvc",
    "usb",
    "webcam",
    "logitech",
    "hd",
)


def _init_cf_runloop_pump():
    """Return a callable that pumps the macOS main CFRunLoop for `seconds`."""
    if sys.platform != "darwin":
        return lambda _s=0.002: None
    try:
        cf_path = ctypes.util.find_library("CoreFoundation")
        if not cf_path:
            return lambda _s=0.002: None
        cf = ctypes.CDLL(cf_path)
        cf.CFRunLoopRunInMode.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_bool]
        cf.CFRunLoopRunInMode.restype = ctypes.c_int32
        default_mode = ctypes.c_void_p.in_dll(cf, "kCFRunLoopDefaultMode")

        def _pump(seconds: float = 0.002) -> None:
            try:
                cf.CFRunLoopRunInMode(default_mode, float(seconds), False)
            except Exception:
                pass

        return _pump
    except Exception:
        return lambda _s=0.002: None


def _has_physical_macos_camera() -> bool:
    """Fast passive IOKit/CoreMedia metadata check via `system_profiler`."""
    try:
        proc = subprocess.run(
            ["/usr/sbin/system_profiler", "SPCameraDataType", "-json"],
            capture_output=True,
            text=True,
            timeout=2.0,
            check=False,
        )
        data = json.loads(proc.stdout or "{}")
        cams = data.get("SPCameraDataType") or []
        for cam in cams:
            name_low = str(cam.get("_name") or "").lower()
            model_low = str(cam.get("spcamera_model-id") or "").lower()
            combined = f"{name_low} {model_low}"
            if any(skip in combined for skip in _SKIP_DEVICE_TOKENS):
                continue
            return True
        return False
    except Exception:
        return True


def discover_macos_uvc_indices() -> list[int]:
    """Enumerate AVFoundation video indices and exclude Continuity/virtual cameras."""
    root_dir = Path(__file__).resolve().parents[2]
    local_ff = root_dir / "vendor" / "bin" / "ffmpeg"
    ffmpeg_bin = str(local_ff) if local_ff.exists() else shutil.which("ffmpeg")
    if ffmpeg_bin:
        try:
            proc = subprocess.run(
                [ffmpeg_bin, "-hide_banner", "-f", "avfoundation", "-list_devices", "true", "-i", ""],
                capture_output=True,
                text=True,
                timeout=1.5,
                check=False,
            )
            out = (proc.stderr or "") + "\n" + (proc.stdout or "")
            in_video = False
            usb_first: list[int] = []
            other_real: list[int] = []
            saw_header = False
            for line in out.splitlines():
                low = line.lower()
                if "avfoundation video devices" in low:
                    in_video = True
                    saw_header = True
                    continue
                if "avfoundation audio devices" in low:
                    break
                if not in_video:
                    continue
                m = re.search(r"\[(\d+)\]\s+(.+)$", line.strip())
                if not m:
                    continue
                idx = int(m.group(1))
                name_low = m.group(2).strip().lower()
                if any(skip in name_low for skip in _SKIP_DEVICE_TOKENS):
                    continue
                if any(tok in name_low for tok in _USB_PRIORITY_TOKENS):
                    usb_first.append(idx)
                else:
                    other_real.append(idx)
            if saw_header:
                return usb_first + other_real
        except Exception:
            pass
    if not _has_physical_macos_camera():
        return []
    return [0]


def main() -> int:
    # Isolate binary frame pipe on a private descriptor and redirect stdout -> stderr
    # so C++/Objective-C library logs can never corrupt binary frame packets.
    frame_fd = os.dup(1)
    os.dup2(2, 1)
    frame_pipe = os.fdopen(frame_fd, "wb", buffering=0)

    stop_requested = False

    def _handle_sigterm(_signum: int, _frame: object) -> None:
        nonlocal stop_requested
        stop_requested = True

    signal.signal(signal.SIGTERM, _handle_sigterm)
    signal.signal(signal.SIGINT, _handle_sigterm)

    parent_pid = os.getppid()
    pump_runloop = _init_cf_runloop_pump()
    pump_runloop(0.01)

    preferred_arg = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    indices = discover_macos_uvc_indices()
    if preferred_arg.isdigit():
        p_idx = int(preferred_arg)
        indices = [p_idx] + [i for i in indices if i != p_idx]

    if not indices:
        frame_pipe.close()
        return 2

    import cv2
    import numpy as np

    cap = None
    active_idx = -1
    first_frame = None

    for idx in indices:
        if os.getppid() != parent_pid:
            frame_pipe.close()
            return 0
        try:
            pump_runloop(0.01)
            candidate = cv2.VideoCapture(idx, cv2.CAP_AVFOUNDATION)
            pump_runloop(0.02)
            if not candidate.isOpened():
                candidate.release()
                continue
            # Request Full-HD 1920x1080 optical capture (falls back automatically on 720p UVC cameras);
            # never force CAP_PROP_FPS=30.000000 on UVC descriptors using 30.000030 or 20-25 FPS.
            candidate.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            candidate.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            try:
                candidate.set(cv2.CAP_PROP_AUTOFOCUS, 1)
            except Exception:
                pass
            pump_runloop(0.02)

            for _ in range(12):
                if os.getppid() != parent_pid:
                    candidate.release()
                    frame_pipe.close()
                    return 0
                pump_runloop(0.015)
                ok, test_bgr = candidate.read()
                if ok and test_bgr is not None and test_bgr.size > 0 and int(test_bgr.max()) > 3:
                    cap = candidate
                    active_idx = idx
                    first_frame = test_bgr
                    break
                time.sleep(0.03)
            if cap is not None:
                break
            candidate.release()
        except Exception:
            try:
                candidate.release()  # type: ignore[union-attr]
            except Exception:
                pass

    if cap is None or first_frame is None:
        frame_pipe.close()
        return 3

    src_bytes = f"uvc:avfoundation:{active_idx}".encode("utf-8")

    def _send_frame(bgr: "np.ndarray") -> None:
        if bgr.ndim != 3 or bgr.shape[2] != 3:
            return
        h, w = bgr.shape[:2]
        if w > 1920:
            nh = max(64, int(round(h * (1920.0 / w))))
            bgr = cv2.resize(bgr, (1920, nh), interpolation=cv2.INTER_AREA)
            h, w = bgr.shape[:2]
        contig = np.ascontiguousarray(bgr, dtype=np.uint8)
        payload = contig.tobytes()
        pkt_hdr = HEADER_STRUCT.pack(FRAME_MAGIC, w, h, len(src_bytes), len(payload))
        frame_pipe.write(pkt_hdr)
        frame_pipe.write(src_bytes)
        frame_pipe.write(payload)

    try:
        _send_frame(first_frame)
        last_ok_ts = time.perf_counter()

        while not stop_requested:
            if os.getppid() != parent_pid:
                break
            pump_runloop(0.003)
            ok, frame = cap.read()
            now = time.perf_counter()
            if ok and frame is not None and frame.size > 0 and int(frame.max()) > 2:
                last_ok_ts = now
                _send_frame(frame)
            else:
                # Yield smoothly and tolerate transient CoreMediaIO device-list notifications
                pump_runloop(0.025)
                time.sleep(0.015)
                if (now - last_ok_ts) > 5.5:
                    break
    except (BrokenPipeError, OSError):
        pass
    finally:
        try:
            cap.release()
        except Exception:
            pass
        try:
            frame_pipe.close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
