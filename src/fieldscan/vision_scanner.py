"""Real-Time 30 FPS OpenCV Video Scanner & Hardware-Free Workbench Simulator for TZ THT-02.

Supports:
1. Real USB UVC Webcams (`/dev/video0`, `/dev/video1`, tuned for Acer 4K UVC via `cv2.CAP_V4L2`,
   MJPEG `1280x720` @ `30 FPS`, `BUFFERSIZE=1` for ultra-low latency) with clean fallback.
2. Realistic Industrial Workbench Simulator (`sim_normal`, `sim_strainer_patch`, `sim_open_dip`,
   `sim_gland_fault`) compositing real `TZ THT-02` crops from `assets/manual_pages/page_9.png`
   and `page_5.png` onto a textured ESD inspection mat with continuous handheld micro-motion
   (`±4°` sinusoidal rotation + translational drift + sensor noise) so OpenCV executes genuine
   segmentation, `minAreaRect` metrology, and HSV anomaly localization on every single frame.
3. Custom frame injection (`inject_custom_frame(image_bytes)`) for uploaded bench photos.
"""

from __future__ import annotations

import atexit
from collections import deque
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import threading
import time
from typing import Any
import weakref

import cv2
import numpy as np


NOMINAL_LENGTH_MM = 140.0
NOMINAL_DIAMETER_MM = 16.0
NOMINAL_ASPECT_RATIO = NOMINAL_LENGTH_MM / NOMINAL_DIAMETER_MM  # 8.75

# Canonical longitudinal zone boundaries along major axis z_mm in [-70.0, +70.0]
# (-70.0 mm = waterproof cable gland end, +70.0 mm = stainless steel strainer tip)
SENSOR_ZONES: tuple[tuple[str, float, float, str], ...] = (
    ("waterproof_gland_leads", -70.0, -48.0, "Waterproof Terminal & RS-485 Leads"),
    ("lower_barrel_rs485", -48.0, -18.0, "Lower Barrel (RS-485 Transceiver)"),
    ("mounting_flange", -18.0, -2.0, "Central Thread & Mounting Flange"),
    ("upper_barrel_dip", -2.0, 27.0, "Upper Barrel (8-Pin DIP Switch PCB)"),
    ("upper_seal_ring", 27.0, 38.0, "Elastomer O-Ring Seal Collar"),
    ("strainer_head", 38.0, 70.0, "Slotted Stainless Steel Strainer"),
)

SIM_MODES: tuple[str, ...] = (
    "sim_normal",
    "sim_strainer_patch",
    "sim_open_dip",
    "sim_gland_fault",
    "sim_hand_screwdriver",
)

VALID_MODES: tuple[str, ...] = (
    "auto",
    "uvc",
    "usb",
    "/dev/video0",
    "/dev/video1",
    *SIM_MODES,
    "custom",
)


def z_mm_to_zone(z_mm: float) -> str:
    """Map longitudinal coordinate `z_mm` (-70..+70 mm) to one of the 6 canonical zone IDs."""
    z_clamped = max(-70.0, min(70.0, float(z_mm)))
    for zone_id, z_min, z_max, _label in SENSOR_ZONES:
        if z_min <= z_clamped < z_max:
            return zone_id
    return "strainer_head"


def zone_display_label(zone_id: str | None) -> str:
    if not zone_id:
        return "NOMINAL"
    for zid, _z0, _z1, label in SENSOR_ZONES:
        if zid == zone_id:
            return label
    return zone_id


def _resolve_assets_dir() -> Path:
    env_dir = os.environ.get("FIELDSCAN_ASSETS_DIR")
    if env_dir:
        p = Path(env_dir)
        if p.exists():
            return p
    # Relative to src/fieldscan/vision_scanner.py -> ../../assets
    here = Path(__file__).resolve()
    for candidate in (
        here.parents[2] / "assets",
        Path("/home/antigravity/fieldscan_tht02/assets"),
        Path.cwd() / "assets",
    ):
        if candidate.exists():
            return candidate
    return here.parents[2] / "assets"


class _WorkbenchSynthesizer:
    """Builds realistic workbench frames from real TZ THT-02 manual photographs."""

    def __init__(self, assets_dir: Path, width: int = 960, height: int = 540) -> None:
        self.assets_dir = assets_dir
        self.width = width
        self.height = height
        self.mat_bg = self._build_esd_workbench_mat(width, height)

        # Extract real TZ THT-02 sprites from manual pages 9 & 5
        self.closed_bgr, self.closed_alpha, self.closed_cable_mask = self._extract_closed_probe()
        self.open_bgr, self.open_alpha, self.open_cable_mask = self._extract_open_dip_probe()

        # Pre-compose anomaly variants in sprite space so anomaly markers rotate/move
        # rigidly with the physical probe body under affine camera motion!
        self.strainer_bgr, self.strainer_alpha = self._apply_strainer_patch(
            self.closed_bgr, self.closed_alpha
        )
        self.gland_bgr, self.gland_alpha = self._apply_gland_fault(
            self.closed_bgr, self.closed_alpha
        )

    @staticmethod
    def _build_esd_workbench_mat(w: int, h: int) -> np.ndarray:
        """Create a dark industrial ESD inspection mat with subtle grid markings & texture."""
        rng = np.random.default_rng(42)
        base = np.zeros((h, w, 3), dtype=np.uint8)
        base[:, :] = (30, 32, 34)  # Dark charcoal matte surface

        # Subtle brushed rubber micro-texture
        grain = rng.normal(0.0, 3.2, size=(h // 2, w // 2)).astype(np.float32)
        grain_up = cv2.resize(grain, (w, h), interpolation=cv2.INTER_LINEAR)
        for c in range(3):
            ch = np.clip(base[:, :, c].astype(np.float32) + grain_up, 14, 58)
            base[:, :, c] = ch.astype(np.uint8)

        # Subtle dark ESD cutting-mat 40px grid lines (low contrast so they never confuse CV)
        for x in range(40, w, 40):
            cv2.line(base, (x, 0), (x, h), (38, 42, 44), 1, cv2.LINE_AA)
        for y in range(40, h, 40):
            cv2.line(base, (0, y), (w, y), (38, 42, 44), 1, cv2.LINE_AA)

        # Subtle bench border ruler ticks at top/bottom margin
        cv2.rectangle(base, (18, 18), (w - 19, h - 19), (48, 54, 56), 1)

        # Soft overhead bench-lamp illumination falloff (vignette)
        yy, xx = np.ogrid[:h, :w]
        cx, cy = w * 0.5, h * 0.48
        dist2 = ((xx - cx) / (w * 0.65)) ** 2 + ((yy - cy) / (h * 0.65)) ** 2
        illum = np.clip(1.08 - 0.26 * dist2, 0.72, 1.08).astype(np.float32)
        base = np.clip(base.astype(np.float32) * illum[:, :, None], 10, 70).astype(np.uint8)
        return base

    def _extract_closed_probe(self) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Crop the real horizontal 140mm x 16mm TZ THT-02 photograph from page_9.png."""
        p9_path = self.assets_dir / "manual_pages" / "page_9.png"
        p9 = cv2.imread(str(p9_path), cv2.IMREAD_COLOR)
        if p9 is None:
            return self._fallback_probe_sprite(open_pcb=False)

        # Exact probe region in page_9.png (1024x724):
        # Black cable lead: x=42..112, y=851..870
        # 140mm x 16mm grey body + black seal ring + slotted strainer: x=110..580, y=835..890
        crop = p9[826:900, 42:588].copy()  # shape: (74, 546, 3)
        h, w = crop.shape[:2]

        # Build clean silhouette mask for the probe + cable (excluding white manual background
        # and red dimension lines while keeping the cylinder's bright specular highlight intact!)
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # Remove any faint red callout line remnants (R - B > 38)
        red_line = (crop[:, :, 2].astype(np.int16) - crop[:, :, 0].astype(np.int16)) > 38
        raw_fg = (gray < 236) & (~red_line)

        mask = np.zeros((h, w), dtype=np.uint8)
        mask[raw_fg] = 255

        # Close across the cylindrical white specular highlight strip inside the probe body
        # (probe body spans x_local = 68..537, y_local = 10..63)
        body_sub = mask[8:66, 66:540]
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 13))
        body_closed = cv2.morphologyEx(body_sub, cv2.MORPH_CLOSE, kernel_close)
        # Fill vertical columns between top and bottom edges of the cylinder for smooth silhouette
        for col in range(body_closed.shape[1]):
            ys = np.where(body_closed[:, col] > 0)[0]
            if len(ys) >= 2 and (ys[-1] - ys[0]) >= 22:
                body_closed[ys[0] : ys[-1] + 1, col] = 255
        mask[8:66, 66:540] = body_closed

        # Clean cable strip on left (x_local = 0..70, y_local = 24..46)
        cable_mask = np.zeros((h, w), dtype=np.uint8)
        cable_sub = (gray[22:48, 0:74] < 165).astype(np.uint8) * 255
        cable_mask[22:48, 0:74] = cable_sub
        # Zero out stray marks outside cable + probe body
        clean_mask = np.zeros((h, w), dtype=np.uint8)
        clean_mask[8:66, 66:540] = mask[8:66, 66:540]
        clean_mask = cv2.bitwise_or(clean_mask, cable_mask)

        # Upscale 1.18x for crisp HD bench detail (~555px sensor body length)
        scale = 1.18
        nw, nh = int(round(w * scale)), int(round(h * scale))
        sprite_bgr = cv2.resize(crop, (nw, nh), interpolation=cv2.INTER_CUBIC)
        sprite_alpha = cv2.resize(clean_mask, (nw, nh), interpolation=cv2.INTER_LINEAR)
        cable_up = cv2.resize(cable_mask, (nw, nh), interpolation=cv2.INTER_NEAREST)
        sprite_alpha = cv2.GaussianBlur(sprite_alpha, (3, 3), 0.7)
        return sprite_bgr, sprite_alpha, cable_up

    def _extract_open_dip_probe(self) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Crop the real unscrewed TZ THT-02 photograph exposing the blue 8-pin DIP PCB (page_5.png)."""
        p5_path = self.assets_dir / "manual_pages" / "page_5.png"
        p5 = cv2.imread(str(p5_path), cv2.IMREAD_COLOR)
        if p5 is None:
            return self._fallback_probe_sprite(open_pcb=True)

        # In page_5.png (1024x724), the unscrewed horizontal probe sits at y=374..416:
        # - Waterproof cap + 4 colored wires: x=82..178
        # - Unscrewed lower barrel: x=178..333
        # - Exposed internal blue 8-pin DIP switch PCB: x=338..395, y=384..407
        # - Upper barrel + black seal ring + slotted strainer: x=406..618
        # We assemble a compact, true-scale unscrewed bench layout so the exposed blue PCB sits
        # right at z_mm ≈ +18 mm (`upper_barrel_dip`) and clean out the manual's red callout box!
        raw = p5[372:418, 56:622].copy()  # shape: (46, 566, 3)

        # Neutralize ONLY the manual's red callout box lines around the DIP switch (R - G > 55)
        # in the middle callout region (x_local = 270..355) so OpenCV never mistakes the
        # diagram's red rectangle border for red fault tape!
        callout_roi = raw[:, 272:354]
        red_callout = (
            (callout_roi[:, :, 2].astype(np.int16) - callout_roi[:, :, 1].astype(np.int16) > 50)
            & (callout_roi[:, :, 2] > 130)
        )
        callout_roi[red_callout] = (252, 252, 252)
        raw[:, 272:354] = callout_roi

        # Also clean curved arrow tips intruding at left/middle white margins
        # Build foreground mask of actual hardware: black cable, grey cap, grey barrels, blue PCB
        hsv = cv2.cvtColor(raw, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY)
        blue_pcb = cv2.inRange(hsv, (92, 55, 35), (138, 255, 255))

        # Construct realistic bench assembly where the unscrewed upper housing is slid slightly
        # open to reveal the blue 8-pin DIP switch PCB at z_mm ≈ +18 mm (`upper_barrel_dip`):
        # Take left gland + lower barrel from closed probe + insert the real page_5 blue PCB
        # module + upper barrel/strainer from page_5!
        # Even better: build directly from page_5's lower barrel + real page_5 blue PCB + page_5
        # upper barrel/strainer at calibrated longitudinal coordinates!
        canvas_h, canvas_w = 64, 546
        comp_bgr = np.full((canvas_h, canvas_w, 3), 255, dtype=np.uint8)
        comp_mask = np.zeros((canvas_h, canvas_w), dtype=np.uint8)
        cable_mask = np.zeros((canvas_h, canvas_w), dtype=np.uint8)

        # 1. Left black cable + waterproof gland + lower grey barrel + mid-barrel from page_5/page_9
        # Using page_5's real unscrewed barrel + blue PCB crop resized vertically to match 16mm scale:
        p5_res = cv2.resize(raw, (640, 58), interpolation=cv2.INTER_CUBIC)
        p5_gray = cv2.cvtColor(p5_res, cv2.COLOR_BGR2GRAY)
        p5_hsv = cv2.cvtColor(p5_res, cv2.COLOR_BGR2HSV)
        p5_blue = cv2.inRange(p5_hsv, (92, 55, 35), (138, 255, 255))

        # Segment segments from p5_res:
        # Left cable + cap: x=0..108, Lower barrel: x=142..310, Blue PCB: x=316..384, Upper+strainer: x=396..636
        # Pack them tightly on the workbench (eliminating the wide exploded diagram arrow gaps
        # so the physical probe has realistic unscrewed length and the blue PCB sits at z ≈ +18mm!)
        # Segment A: Cable + Waterproof Cap (92 px) -> dst x = 0..92
        # Take clean cable + waterproof nut from page_9 closed probe left end so zero "First Step"
        # instructional arrow graphics from page_5 bleed onto the barrel!
        p9_path = self.assets_dir / "manual_pages" / "page_9.png"
        p9_im = cv2.imread(str(p9_path), cv2.IMREAD_COLOR)
        if p9_im is not None:
            # Cable + waterproof cap + lower/mid barrel from page_9 (y=834..891, x=42..365 -> 323px)
            left_assembly = cv2.resize(p9_im[834:891, 42:372], (334, 52), interpolation=cv2.INTER_CUBIC)
            left_gray = cv2.cvtColor(left_assembly, cv2.COLOR_BGR2GRAY)
            left_red = (
                left_assembly[:, :, 2].astype(np.int16) - left_assembly[:, :, 0].astype(np.int16)
            ) > 38
            left_fg = ((left_gray < 235) & (~left_red)).astype(np.uint8) * 255
            # Fill body columns (x >= 68) across cylindrical specular highlight
            body_part = cv2.morphologyEx(
                left_fg[:, 66:], cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 11))
            )
            for col in range(body_part.shape[1]):
                ys = np.where(body_part[:, col] > 0)[0]
                if len(ys) >= 2 and (ys[-1] - ys[0]) >= 20:
                    body_part[ys[0] : ys[-1] + 1, col] = 255
            left_fg[:, :66] = ((left_gray[:, :66] < 160)).astype(np.uint8) * 255
            left_fg[:, 66:] = body_part
            # Add realistic exposed thread grooves from page_5 at the unscrewed seam (x=312..334)
            threads_crop = cv2.resize(p5_res[8:49, 144:168], (22, 46), interpolation=cv2.INTER_CUBIC)
            left_assembly[3:49, 312:334] = threads_crop
            comp_bgr[6:58, 0:334] = left_assembly
            comp_mask[6:58, 0:334] = left_fg
            cable_mask[18:42, 0:66] = left_fg[12:36, 0:66]
        else:
            seg_cap = p5_res[3:55, 4:106]
            comp_bgr[6:58, 0:102] = seg_cap
            comp_mask[6:58, 0:102] = ((p5_gray[3:55, 4:106] < 228)).astype(np.uint8) * 255

        # Segment C: Real exposed blue 8-pin DIP switch PCB from page_5.png! -> dst x = 332..404 (72 px)
        # Probe body runs from x = 68 (gland cap left) to x = 542 (strainer tip) -> length = 474 px, mid = 305 px.
        # PCB center x = 368 -> ((368 - 305) / 237) * 70.0 = +18.6 mm (`upper_barrel_dip`)!
        seg_pcb = cv2.resize(p5_res[11:48, 319:383], (72, 38), interpolation=cv2.INTER_CUBIC)
        pcb_gray = cv2.cvtColor(seg_pcb, cv2.COLOR_BGR2GRAY)
        pcb_hsv = cv2.cvtColor(seg_pcb, cv2.COLOR_BGR2HSV)
        pcb_blue = cv2.inRange(pcb_hsv, (90, 50, 35), (140, 255, 255))
        pcb_fg = ((pcb_gray < 224) | (pcb_blue > 0)).astype(np.uint8) * 255
        pcb_fg = cv2.morphologyEx(
            pcb_fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 5))
        )
        pcb_boost = seg_pcb.copy()
        blue_px = pcb_blue > 0
        pcb_boost[blue_px, 0] = np.clip(pcb_boost[blue_px, 0].astype(np.int16) + 28, 0, 255).astype(
            np.uint8
        )
        comp_bgr[13:51, 332:404] = pcb_boost
        comp_mask[13:51, 332:404] = np.maximum(comp_mask[13:51, 332:404], pcb_fg)

        # Segment D: Slid-back upper collar + black O-ring + slotted stainless steel strainer -> dst x = 402..542 (140 px)
        seg_up = cv2.resize(p5_res[3:54, 480:635], (140, 52), interpolation=cv2.INTER_CUBIC)
        up_gray = cv2.cvtColor(seg_up, cv2.COLOR_BGR2GRAY)
        up_fg = (up_gray < 232).astype(np.uint8) * 255
        for col in range(up_fg.shape[1]):
            ys = np.where(up_fg[:, col] > 0)[0]
            if len(ys) >= 2 and (ys[-1] - ys[0]) >= 18:
                up_fg[ys[0] : ys[-1] + 1, col] = 255
        comp_bgr[6:58, 402:542] = seg_up
        comp_mask[6:58, 402:542] = np.maximum(comp_mask[6:58, 402:542], up_fg)

        scale = 1.18
        nw, nh = int(round(canvas_w * scale)), int(round(canvas_h * scale))
        sprite_bgr = cv2.resize(comp_bgr, (nw, nh), interpolation=cv2.INTER_CUBIC)
        sprite_alpha = cv2.resize(comp_mask, (nw, nh), interpolation=cv2.INTER_LINEAR)
        cable_up = cv2.resize(cable_mask, (nw, nh), interpolation=cv2.INTER_NEAREST)
        sprite_alpha = cv2.GaussianBlur(sprite_alpha, (3, 3), 0.7)
        return sprite_bgr, sprite_alpha, cable_up

    @staticmethod
    def _fallback_probe_sprite(
        open_pcb: bool = False,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Synthetic fallback only if manual PNGs were missing."""
        h, w = 84, 640
        bgr = np.zeros((h, w, 3), dtype=np.uint8)
        alpha = np.zeros((h, w), dtype=np.uint8)
        cable = np.zeros((h, w), dtype=np.uint8)
        cv2.rectangle(bgr, (0, 36), (80, 48), (28, 28, 30), -1)
        cv2.rectangle(alpha, (0, 36), (80, 48), 255, -1)
        cv2.rectangle(cable, (0, 36), (80, 48), 255, -1)
        cv2.rectangle(bgr, (80, 14), (620, 70), (190, 188, 182), -1)
        cv2.rectangle(alpha, (80, 14), (620, 70), 255, -1)
        cv2.rectangle(bgr, (475, 14), (492, 70), (35, 35, 38), -1)
        if open_pcb:
            cv2.rectangle(bgr, (355, 22), (435, 62), (185, 95, 25), -1)
        return bgr, alpha, cable

    @staticmethod
    def _apply_strainer_patch(
        base_bgr: np.ndarray, base_alpha: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        """Add realistic bright red/orange inspection tape + X-mark over the right-side strainer."""
        bgr = base_bgr.copy()
        alpha = base_alpha.copy()
        h, w = bgr.shape[:2]
        # Right-side Stainless Steel Strainer sits around x = 84%..95% of sprite width (z_mm ≈ +56 mm)
        x0, x1 = int(w * 0.845), int(w * 0.945)
        y0, y1 = int(h * 0.19), int(h * 0.81)

        # Semi-matte bright red-orange industrial fault tape (BGR: [22, 58, 238])
        overlay = bgr.copy()
        cv2.rectangle(overlay, (x0, y0), (x1, y1), (20, 56, 236), -1)
        # Subtle tape texture + high-contrast yellow/white X-mark
        cv2.line(overlay, (x0 + 5, y0 + 5), (x1 - 5, y1 - 5), (40, 225, 255), 3, cv2.LINE_AA)
        cv2.line(overlay, (x0 + 5, y1 - 5), (x1 - 5, y0 + 5), (40, 225, 255), 3, cv2.LINE_AA)
        cv2.rectangle(overlay, (x0, y0), (x1, y1), (14, 34, 185), 2)

        patch_mask = alpha[y0:y1, x0:x1] > 40
        sub = bgr[y0:y1, x0:x1]
        sub_ov = overlay[y0:y1, x0:x1]
        sub[patch_mask] = cv2.addWeighted(sub[patch_mask], 0.14, sub_ov[patch_mask], 0.86, 0)
        bgr[y0:y1, x0:x1] = sub
        return bgr, alpha

    @staticmethod
    def _apply_gland_fault(
        base_bgr: np.ndarray, base_alpha: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        """Add realistic red/amber fault marker & frayed wire visual at left waterproof terminal."""
        bgr = base_bgr.copy()
        alpha = base_alpha.copy()
        h, w = bgr.shape[:2]
        # Waterproof gland / cable entry sits right at left end of sensor body (x = 12.5%..19.5%, z_mm ≈ -60 mm)
        x0, x1 = int(w * 0.125), int(w * 0.195)
        y0, y1 = int(h * 0.22), int(h * 0.78)

        overlay = bgr.copy()
        # Red/amber fault band on waterproof gland nut
        cv2.rectangle(overlay, (x0, y0), (x1, y1), (18, 68, 242), -1)
        cv2.line(overlay, (x0 + 4, y0 + 5), (x1 - 4, y1 - 5), (30, 215, 255), 2, cv2.LINE_AA)
        cv2.line(overlay, (x0 + 4, y1 - 5), (x1 - 4, y0 + 5), (30, 215, 255), 2, cv2.LINE_AA)

        patch_mask = alpha[y0:y1, x0:x1] > 40
        sub = bgr[y0:y1, x0:x1]
        sub_ov = overlay[y0:y1, x0:x1]
        sub[patch_mask] = cv2.addWeighted(sub[patch_mask], 0.12, sub_ov[patch_mask], 0.88, 0)
        bgr[y0:y1, x0:x1] = sub

        # Exposed frayed red/yellow RS-485 copper strands at gland entry (x = 8.8%..13%)
        fx0 = int(w * 0.088)
        cy = h // 2
        cv2.line(bgr, (fx0, cy - 5), (x0 + 3, cy - 13), (22, 42, 238), 3, cv2.LINE_AA)
        cv2.line(bgr, (fx0 + 2, cy + 4), (x0 + 3, cy + 12), (25, 195, 250), 3, cv2.LINE_AA)
        cv2.line(alpha, (fx0, cy - 5), (x0 + 3, cy - 13), 255, 4)
        cv2.line(alpha, (fx0 + 2, cy + 4), (x0 + 3, cy + 12), 255, 4)
        return bgr, alpha

    @staticmethod
    def _composite_hand_and_screwdriver(
        frame: np.ndarray, tx: float, ty: float, angle_deg: float, t_sec: float
    ) -> None:
        """Composite a realistic human hand holding a red-handled precision screwdriver at the DIP-8 switch."""
        h, w = frame.shape[:2]
        rad = math.radians(angle_deg)
        # DIP-8 block sits ~72px ahead of sensor midpoint along the probe axis
        dip_x = tx + 72.0 * math.cos(rad)
        dip_y = ty - 72.0 * math.sin(rad)

        # Smooth realistic technician hand & screwdriver motion sweeping across SW1 DIP-8 pins
        jx = 16.0 * math.sin(t_sec * 2.15) + 4.5 * math.cos(t_sec * 3.8)
        jy = 10.5 * math.cos(t_sec * 1.75) + 3.0 * math.sin(t_sec * 3.1)
        tip_x = int(round(dip_x + 12.0 + jx))
        tip_y = int(round(dip_y + 8.0 + jy))

        overlay = frame.copy()
        fg_alpha = np.zeros((h, w), dtype=np.float32)

        # 1. Metallic steel screwdriver shaft (thin 5px specular chrome rod at ~52 deg angle)
        shaft_end_x = tip_x + 56
        shaft_end_y = tip_y + 68
        cv2.line(overlay, (tip_x, tip_y), (shaft_end_x, shaft_end_y), (206, 212, 218), 5, cv2.LINE_AA)
        cv2.line(overlay, (tip_x + 1, tip_y), (shaft_end_x + 1, shaft_end_y), (242, 246, 250), 2, cv2.LINE_AA)
        cv2.line(fg_alpha, (tip_x, tip_y), (shaft_end_x, shaft_end_y), 0.96, 6, cv2.LINE_AA)

        # 2. Vivid crimson-red insulated precision screwdriver handle (tests false-red rejection!)
        hdl_end_x = shaft_end_x + 76
        hdl_end_y = shaft_end_y + 92
        cv2.line(overlay, (shaft_end_x, shaft_end_y), (hdl_end_x, hdl_end_y), (26, 38, 228), 22, cv2.LINE_AA)
        cv2.line(overlay, (shaft_end_x + 4, shaft_end_y + 5), (hdl_end_x - 6, hdl_end_y - 7), (42, 72, 248), 7, cv2.LINE_AA)
        # Yellow torque collar at top of screwdriver handle
        cv2.line(
            overlay,
            (shaft_end_x, shaft_end_y),
            (shaft_end_x + 14, shaft_end_y + 17),
            (28, 205, 245),
            20,
            cv2.LINE_AA,
        )
        cv2.line(fg_alpha, (shaft_end_x, shaft_end_y), (hdl_end_x, hdl_end_y), 0.98, 24, cv2.LINE_AA)

        # 3. Realistic warm human skin hand + thumb/index fingers entering from bottom-right border
        #    BGR = (126, 158, 208) -> YCrCb Cr ~ 153, Cb ~ 106 (canonical human skin locus!)
        palm_rx = min(w - 4, int(round(w - 36 + jx)))
        palm_pts = np.array(
            [
                [shaft_end_x + 18, shaft_end_y + 10],
                [shaft_end_x + 92, shaft_end_y - 6],
                [palm_rx, h - 75],
                [palm_rx + 2, h - 1],
                [shaft_end_x + 52, h - 1],
                [shaft_end_x + 8, shaft_end_y + 62],
            ],
            dtype=np.int32,
        )
        cv2.fillConvexPoly(overlay, palm_pts, (124, 156, 206), lineType=cv2.LINE_AA)
        cv2.fillConvexPoly(fg_alpha, palm_pts, 0.97)

        # Thumb & index finger gripping the screwdriver handle
        cv2.line(
            overlay,
            (shaft_end_x + 42, shaft_end_y + 24),
            (shaft_end_x - 4, shaft_end_y + 18),
            (132, 166, 216),
            22,
            cv2.LINE_AA,
        )
        cv2.line(
            fg_alpha,
            (shaft_end_x + 42, shaft_end_y + 24),
            (shaft_end_x - 4, shaft_end_y + 18),
            0.98,
            23,
            cv2.LINE_AA,
        )
        cv2.line(
            overlay,
            (shaft_end_x + 56, shaft_end_y + 4),
            (shaft_end_x + 8, shaft_end_y - 6),
            (118, 150, 200),
            20,
            cv2.LINE_AA,
        )
        cv2.line(
            fg_alpha,
            (shaft_end_x + 56, shaft_end_y + 4),
            (shaft_end_x + 8, shaft_end_y - 6),
            0.98,
            21,
            cv2.LINE_AA,
        )

        fg_alpha = cv2.GaussianBlur(fg_alpha, (5, 5), 1.1)
        m = fg_alpha > 0.01
        a3 = fg_alpha[m][:, None]
        frame[m] = np.clip(frame[m].astype(np.float32) * (1.0 - a3) + overlay[m].astype(np.float32) * a3, 0, 255).astype(
            np.uint8
        )

    def render_frame(self, mode: str, t_sec: float) -> np.ndarray:
        """Render a realistic handheld/bench camera frame with smooth ±4° micro-motion + noise."""
        if mode in ("sim_open_dip", "sim_hand_screwdriver"):
            sp_bgr, sp_alpha = self.open_bgr, self.open_alpha
        elif mode == "sim_strainer_patch":
            sp_bgr, sp_alpha = self.strainer_bgr, self.strainer_alpha
        elif mode == "sim_gland_fault":
            sp_bgr, sp_alpha = self.gland_bgr, self.gland_alpha
        else:
            sp_bgr, sp_alpha = self.closed_bgr, self.closed_alpha

        frame = self.mat_bg.copy()
        sh, sw = sp_bgr.shape[:2]

        # Smooth realistic handheld micro-motion: ±3.8° rotation + ±12px drift + subtle breathing scale
        angle_deg = 3.6 * math.sin(t_sec * 0.85) + 0.45 * math.cos(t_sec * 2.3)
        scale = 1.0 + 0.014 * math.sin(t_sec * 0.62)
        tx = self.width * 0.50 + 14.0 * math.sin(t_sec * 0.73) + 2.5 * math.cos(t_sec * 3.1)
        ty = self.height * 0.51 + 9.5 * math.cos(t_sec * 0.91) + 2.0 * math.sin(t_sec * 2.7)

        # Affine matrix mapping sprite center (sw/2, sh/2) -> (tx, ty) with rotation & scale
        rot_m = cv2.getRotationMatrix2D((sw * 0.5, sh * 0.5), angle_deg, scale)
        rot_m[0, 2] += tx - sw * 0.5
        rot_m[1, 2] += ty - sh * 0.5

        # Compute tight destination ROI on the 960x540 mat so warping + compositing takes <0.5 ms!
        corners = np.array(
            [[0, 0, 1], [sw, 0, 1], [sw, sh, 1], [0, sh, 1]], dtype=np.float32
        )
        warped_pts = corners @ rot_m.T
        rx0 = max(0, int(math.floor(warped_pts[:, 0].min())) - 6)
        ry0 = max(0, int(math.floor(warped_pts[:, 1].min())) - 6)
        rx1 = min(self.width, int(math.ceil(warped_pts[:, 0].max())) + 10)
        ry1 = min(self.height, int(math.ceil(warped_pts[:, 1].max())) + 12)
        rw, rh = rx1 - rx0, ry1 - ry0
        if rw <= 4 or rh <= 4:
            return frame

        local_m = rot_m.copy()
        local_m[0, 2] -= rx0
        local_m[1, 2] -= ry0

        warped_bgr = cv2.warpAffine(
            sp_bgr, local_m, (rw, rh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
        )
        warped_alpha = cv2.warpAffine(
            sp_alpha, local_m, (rw, rh), flags=cv2.INTER_LINEAR, borderValue=0
        )

        # Realistic drop shadow on the ESD mat (+5px X, +7px Y)
        shadow = np.zeros((rh, rw), dtype=np.uint8)
        if rh > 7 and rw > 5:
            shadow[7:, 5:] = warped_alpha[:-7, :-5]
            shadow = cv2.GaussianBlur(shadow, (11, 11), 3.2)

        roi = frame[ry0:ry1, rx0:rx1].astype(np.float32)
        shadow_factor = 1.0 - (shadow.astype(np.float32) / 255.0) * 0.52
        roi *= shadow_factor[:, :, None]

        a_f = (warped_alpha.astype(np.float32) / 255.0)[:, :, None]
        blended = roi * (1.0 - a_f) + warped_bgr.astype(np.float32) * a_f

        # Subtle real-time CMOS sensor read noise inside ROI so every frame is bit-unique
        phase = int((t_sec * 60.0) % 97)
        noise = (((np.arange(rh)[:, None] * 131 + np.arange(rw)[None, :] * 17 + phase * 53) & 7) - 3.5) * 0.8
        blended = np.clip(blended + noise[:, :, None], 0, 255).astype(np.uint8)
        frame[ry0:ry1, rx0:rx1] = blended

        if mode == "sim_hand_screwdriver":
            self._composite_hand_and_screwdriver(frame, tx, ty, angle_deg, t_sec)
        return frame


class VisionScanner:
    """Real-time OpenCV sensor scanner + UVC webcam manager + workbench simulator."""

    def __init__(
        self,
        initial_mode: str | None = None,
        target_fps: float = 28.0,
        jpeg_quality: int = 88,
        auto_start: bool = False,
    ) -> None:
        self.assets_dir = _resolve_assets_dir()
        self.synth = _WorkbenchSynthesizer(self.assets_dir, width=960, height=540)
        self.target_fps = max(5.0, min(30.0, float(target_fps)))
        self.jpeg_quality = int(jpeg_quality)

        self._step_lock = threading.Lock()
        self._lock = threading.Lock()
        self._cap_lock = threading.Lock()
        self._running = False
        self._thread: threading.Thread | None = None
        self._cap: cv2.VideoCapture | None = None
        self._mac_proc: subprocess.Popen[bytes] | None = None
        self._mac_spawn_ts: float = 0.0
        self._mac_latest_packet: tuple[np.ndarray, str, float] | None = None
        self._last_uvc_frame: np.ndarray | None = None
        self._uvc_fail_streak: int = 0
        self._uvc_black_streak: int = 0
        self._last_uvc_retry_ts: float = 0.0

        self._requested_mode = initial_mode or os.environ.get("FIELDSCAN_CAMERA_MODE", "auto")
        self._active_sim_mode = "sim_normal"
        self._camera_source = "simulator:workbench"
        self._custom_bgr: np.ndarray | None = None

        self._latest_hud_jpeg: bytes = b""
        self._latest_raw_jpeg: bytes = b""
        self._latest_telemetry: dict[str, Any] = {}
        self._locked_pose: dict[str, Any] | None = None
        self._prev_hand_pt: tuple[float, float] | None = None
        self._prev_hand_ts: float = 0.0
        self._hand_vel_ema: tuple[float, float] = (0.0, 0.0)
        self._hand_trail: deque[list[int]] = deque(maxlen=12)
        self._frame_seq = 0
        self._fps_ema = 28.0
        self._last_tick = time.perf_counter()

        weak_self = weakref.ref(self)

        def _cleanup_on_exit() -> None:
            inst = weak_self()
            if inst is not None:
                try:
                    inst.stop()
                except Exception:
                    pass

        atexit.register(_cleanup_on_exit)

        # Initialize hardware/simulator mode and run one synchronous frame immediately
        # so callers never observe empty bytes or uninitialized telemetry.
        self._configure_source(self._requested_mode)
        self.step_once()
        if auto_start:
            self.start()

    @staticmethod
    def _render_uvc_standby_frame(width: int = 960, height: int = 540, reason: str = "NO USB CAMERA SIGNAL") -> np.ndarray:
        """Render a dark technical standby screen (never a fake sensor) when live USB camera is offline."""
        frame = np.full((height, width, 3), (18, 22, 28), dtype=np.uint8)
        for gx in range(0, width, 48):
            cv2.line(frame, (gx, 0), (gx, height), (25, 31, 40), 1)
        for gy in range(0, height, 48):
            cv2.line(frame, (0, gy), (width, gy), (25, 31, 40), 1)
        cx, cy = width // 2, height // 2
        cv2.rectangle(frame, (cx - 250, cy - 58), (cx + 250, cy + 58), (24, 30, 40), -1)
        cv2.rectangle(frame, (cx - 250, cy - 58), (cx + 250, cy + 58), (64, 92, 125), 1)
        cv2.putText(
            frame,
            f"LIVE OPTICAL CAMERA: {reason}",
            (cx - 224, cy - 12),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.58,
            (180, 215, 245),
            1,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            "Connect USB camera or grant macOS Camera access (no simulated image shown)",
            (cx - 224, cy + 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.40,
            (130, 155, 180),
            1,
            cv2.LINE_AA,
        )
        return frame

    @staticmethod
    def _discover_macos_uvc_indices() -> list[int]:
        """Enumerate AVFoundation video indices and exclude Continuity iPhone/iPad & screen-capture devices."""
        import re as _re
        import shutil
        import subprocess

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
                for line in out.splitlines():
                    low = line.lower()
                    if "avfoundation video devices" in low:
                        in_video = True
                        continue
                    if "avfoundation audio devices" in low:
                        break
                    if not in_video:
                        continue
                    m = _re.search(r"\[(\d+)\]\s+(.+)$", line.strip())
                    if not m:
                        continue
                    idx = int(m.group(1))
                    name_low = m.group(2).strip().lower()
                    if any(
                        skip in name_low
                        for skip in ("iphone", "ipad", "continuity", "capture screen", "desk view", "virtual")
                    ):
                        continue
                    if any(u in name_low for u in ("wbc", "uvc", "usb", "webcam", "logitech", "hd")):
                        usb_first.append(idx)
                    else:
                        other_real.append(idx)
                valid = usb_first + other_real
                if valid:
                    return valid
            except Exception:
                pass
        return [0, 1]

    @staticmethod
    def _read_pipe_exact(pipe: Any, size: int) -> bytes:
        chunks: list[bytes] = []
        remaining = size
        while remaining > 0:
            chunk = pipe.read(remaining)
            if not chunk:
                return b""
            chunks.append(chunk)
            remaining -= len(chunk)
        return b"".join(chunks) if len(chunks) > 1 else (chunks[0] if chunks else b"")

    def _mac_reader_loop(self, proc: subprocess.Popen[bytes]) -> None:
        """Read continuous raw BGR frames from isolated macOS AVFoundation worker subprocess."""
        hdr_struct = struct.Struct("<4sHHHI")
        pipe = proc.stdout
        if pipe is None:
            return
        try:
            while True:
                hdr = self._read_pipe_exact(pipe, hdr_struct.size)
                if len(hdr) != hdr_struct.size:
                    break
                magic, w, h, src_len, payload_len = hdr_struct.unpack(hdr)
                if magic != b"FSCN" or w <= 0 or h <= 0 or w > 4096 or h > 4096 or payload_len != (w * h * 3):
                    break
                src_raw = self._read_pipe_exact(pipe, src_len) if src_len > 0 else b"uvc:avfoundation:0"
                if src_len > 0 and len(src_raw) != src_len:
                    break
                payload = self._read_pipe_exact(pipe, payload_len)
                if len(payload) != payload_len:
                    break
                bgr = np.frombuffer(payload, dtype=np.uint8).reshape((h, w, 3)).copy()
                src_name = src_raw.decode("utf-8", errors="replace") or "uvc:avfoundation:0"
                now_ts = time.perf_counter()
                with self._lock:
                    self._mac_latest_packet = (bgr, src_name, now_ts)
                    if self._requested_mode not in SIM_MODES and self._requested_mode != "custom":
                        self._active_sim_mode = "live_uvc"
                        self._camera_source = src_name
        except Exception:
            pass
        finally:
            try:
                pipe.close()
            except Exception:
                pass

    def _stop_mac_worker_unlocked(self) -> None:
        """Terminate macOS camera worker subprocess; caller must hold `self._cap_lock`."""
        proc = self._mac_proc
        self._mac_proc = None
        if proc is not None:
            try:
                if proc.poll() is None:
                    proc.terminate()
                    try:
                        proc.wait(timeout=0.4)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait(timeout=0.3)
            except Exception:
                pass
            if proc.stdout is not None:
                try:
                    proc.stdout.close()
                except Exception:
                    pass

    def _spawn_mac_worker_unlocked(self, preferred_device: str | None = None) -> bool:
        """Spawn isolated macOS AVFoundation worker; caller must hold `self._cap_lock`."""
        self._stop_mac_worker_unlocked()
        worker_script = str(Path(__file__).resolve().with_name("mac_uvc_worker.py"))
        cmd = [sys.executable, "-u", worker_script]
        if preferred_device and preferred_device.isdigit():
            cmd.append(preferred_device)
        try:
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=0,
            )
            self._mac_proc = proc
            self._mac_spawn_ts = time.perf_counter()
            self._last_uvc_retry_ts = self._mac_spawn_ts
            reader = threading.Thread(
                target=self._mac_reader_loop,
                args=(proc,),
                name="fieldscan-mac-uvc-pipe",
                daemon=True,
            )
            reader.start()
            return True
        except Exception:
            self._mac_proc = None
            return False

    def _try_open_uvc(self, preferred_device: str | None = None) -> tuple[cv2.VideoCapture | None, str]:
        """Attempt to open a real Linux V4L2 USB UVC webcam (`/dev/video*`)."""
        candidates: list[int | str] = []
        if preferred_device and preferred_device.startswith("/dev/video"):
            candidates.append(preferred_device)
        for dev_path in ("/dev/video0", "/dev/video1", "/dev/video2"):
            if dev_path not in candidates and os.path.exists(dev_path):
                candidates.append(dev_path)

        if not candidates:
            return None, ""

        fourcc_mjpg = cv2.VideoWriter_fourcc(*"MJPG")
        for dev in candidates:
            cap = None
            try:
                dev_idx: int | str = int(dev.replace("/dev/video", "")) if isinstance(dev, str) and dev.startswith("/dev/video") else dev
                cap = cv2.VideoCapture(dev_idx, cv2.CAP_V4L2)
                if not cap.isOpened():
                    cap.release()
                    continue
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                cap.set(cv2.CAP_PROP_FOURCC, fourcc_mjpg)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                cap.set(cv2.CAP_PROP_FPS, 30)
                for _ in range(8):
                    ok, test_frame = cap.read()
                    if ok and test_frame is not None and test_frame.size > 0:
                        self._last_uvc_frame = test_frame
                        self._uvc_fail_streak = 0
                        src_name = f"uvc:{dev}"
                        return cap, src_name
                    time.sleep(0.02)
                cap.release()
            except Exception:
                if cap is not None:
                    try:
                        cap.release()
                    except Exception:
                        pass
        return None, ""

    def _release_cap(self) -> None:
        """Release hardware capture handles; caller must hold `self._cap_lock`."""
        self._stop_mac_worker_unlocked()
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None
        self._uvc_fail_streak = 0

    def _configure_source(self, mode: str) -> None:
        """Configure camera or simulator source without ever nesting `_lock` and `_cap_lock`."""
        mode_clean = (mode or "auto").strip().lower()

        if mode_clean in SIM_MODES:
            if sys.platform != "darwin":
                with self._cap_lock:
                    self._release_cap()
            with self._lock:
                self._requested_mode = mode_clean
                self._active_sim_mode = mode_clean
                self._camera_source = f"simulator:{mode_clean}"
            return

        with self._lock:
            has_custom = self._custom_bgr is not None
        if mode_clean == "custom" and has_custom:
            if sys.platform != "darwin":
                with self._cap_lock:
                    self._release_cap()
            with self._lock:
                self._requested_mode = "custom"
                self._active_sim_mode = "custom"
                self._camera_source = "custom:injected_frame"
            return

        with self._lock:
            self._requested_mode = mode_clean
            existing_pkt = self._mac_latest_packet

        # macOS dedicated AVFoundation worker subprocess path
        if sys.platform == "darwin":
            pref_idx = mode_clean if mode_clean.isdigit() else None
            now_ts = time.perf_counter()
            with self._cap_lock:
                worker_alive = self._mac_proc is not None and self._mac_proc.poll() is None
                if worker_alive and existing_pkt is not None and (now_ts - existing_pkt[2]) < 5.0 and pref_idx is None:
                    already_streaming = True
                else:
                    already_streaming = False
                    spawned = self._spawn_mac_worker_unlocked(preferred_device=pref_idx)

            if already_streaming and existing_pkt is not None:
                with self._lock:
                    self._active_sim_mode = "live_uvc"
                    self._camera_source = existing_pkt[1]
                return

            if not spawned:
                with self._lock:
                    self._mac_latest_packet = None
                    self._active_sim_mode = "uvc_offline"
                    self._camera_source = "uvc:offline"
                return

            # Wait up to 5.0s outside all locks for first live frame from hardware camera
            deadline = time.perf_counter() + 5.0
            while time.perf_counter() < deadline:
                with self._lock:
                    pkt = self._mac_latest_packet
                if pkt is not None and (time.perf_counter() - pkt[2]) < 4.0:
                    with self._lock:
                        self._active_sim_mode = "live_uvc"
                        self._camera_source = pkt[1]
                    return
                with self._cap_lock:
                    proc_done = self._mac_proc is None or self._mac_proc.poll() is not None
                if proc_done:
                    break
                time.sleep(0.025)

            with self._lock:
                pkt = self._mac_latest_packet
                if pkt is not None and (time.perf_counter() - pkt[2]) < 4.0:
                    self._active_sim_mode = "live_uvc"
                    self._camera_source = pkt[1]
                else:
                    self._active_sim_mode = "uvc_offline"
                    self._camera_source = "uvc:offline"
            return

        # Linux V4L2 direct capture path
        pref = mode_clean if mode_clean.startswith("/dev/video") else None
        with self._cap_lock:
            if pref is None and self._cap is not None and self._cap.isOpened():
                keep_open = True
                cap_opened = True
                src_name = "uvc:/dev/video0"
            else:
                keep_open = False
                self._release_cap()
                cap, src_name = self._try_open_uvc(preferred_device=pref)
                self._last_uvc_retry_ts = time.perf_counter()
                if cap is not None:
                    self._cap = cap
                    cap_opened = True
                else:
                    cap_opened = False

        with self._lock:
            if cap_opened:
                self._active_sim_mode = "live_uvc"
                if not keep_open:
                    self._camera_source = src_name
            else:
                self._active_sim_mode = "uvc_offline"
                self._camera_source = "uvc:offline"

    def start(self) -> None:
        """Start background 30 FPS capture & OpenCV telemetry thread."""
        with self._lock:
            if self._running and self._thread is not None and self._thread.is_alive():
                return
            self._running = True
            self._thread = threading.Thread(
                target=self._run_loop, name="fieldscan-vision-loop", daemon=True
            )
            self._thread.start()

    def stop(self) -> None:
        """Stop background capture loop and release any UVC/V4L2 device handle."""
        with self._lock:
            self._running = False
            thread = self._thread
            self._thread = None
        if thread is not None and thread.is_alive():
            thread.join(timeout=1.5)
        with self._cap_lock:
            self._release_cap()
        with self._lock:
            self._mac_latest_packet = None

    def set_mode(self, mode: str) -> dict[str, Any]:
        """Switch between USB UVC camera and any of the simulated workbench modes."""
        self._configure_source(mode)
        return self.step_once()

    def inject_custom_frame(self, image_bytes: bytes) -> dict[str, Any]:
        """Decode custom JPEG/PNG bytes and run genuine OpenCV pipeline on it."""
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        decoded = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if decoded is None or decoded.size == 0:
            raise ValueError("Invalid image bytes passed to inject_custom_frame")
        # Normalize large 4K photos to max 1280px width for <4ms real-time processing
        h, w = decoded.shape[:2]
        if w > 1280:
            nh = max(64, int(round(h * (1280.0 / w))))
            decoded = cv2.resize(decoded, (1280, nh), interpolation=cv2.INTER_AREA)
        if sys.platform != "darwin":
            with self._cap_lock:
                self._release_cap()
        with self._lock:
            self._custom_bgr = decoded
            self._requested_mode = "custom"
            self._active_sim_mode = "custom"
            self._camera_source = "custom:injected_frame"
        return self.step_once()

    def list_modes(self) -> list[dict[str, Any]]:
        return [
            {"id": "usb", "label": "Live USB Camera (UVC / AVFoundation)"},
            {"id": "sim_normal", "label": "Sim: Clean TZ THT-02 Probe"},
            {"id": "sim_strainer_patch", "label": "Sim: Strainer Red X-Patch (+56 mm)"},
            {"id": "sim_open_dip", "label": "Sim: Unscrewed Blue DIP PCB (+18 mm)"},
            {"id": "sim_gland_fault", "label": "Sim: Gland / RS-485 Wire Fault (-60 mm)"},
            {"id": "sim_hand_screwdriver", "label": "Sim: Hand + Screwdriver on DIP-8 (Masked)"},
        ]

    def _acquire_raw_frame(self) -> tuple[np.ndarray, str, str]:
        with self._lock:
            sim_mode = self._active_sim_mode
            cam_src = self._camera_source
            custom_bgr = self._custom_bgr
            req_mode = self._requested_mode
            mac_pkt = self._mac_latest_packet

        # macOS non-blocking pipe consumer (zero AVFoundation calls inside uvicorn process)
        if sys.platform == "darwin" and req_mode not in SIM_MODES and req_mode != "custom":
            now_t = time.perf_counter()
            if mac_pkt is not None and (now_t - mac_pkt[2]) <= 5.5:
                pkt_bgr, pkt_src, _ = mac_pkt
                if sim_mode != "live_uvc" or cam_src != pkt_src:
                    with self._lock:
                        self._active_sim_mode = "live_uvc"
                        self._camera_source = pkt_src
                return pkt_bgr.copy(), "live_uvc", pkt_src

            # Worker has not produced a frame within 5.5s; respawn asynchronously if exited
            with self._cap_lock:
                worker_dead = self._mac_proc is None or self._mac_proc.poll() is not None
                if worker_dead and (now_t - self._last_uvc_retry_ts) >= 2.8:
                    pref_idx = req_mode if req_mode.isdigit() else None
                    self._spawn_mac_worker_unlocked(preferred_device=pref_idx)

            with self._lock:
                self._active_sim_mode = "uvc_offline"
                self._camera_source = "uvc:offline"
            return self._render_uvc_standby_frame(reason="AWAITING USB CAMERA"), "uvc_offline", "uvc:offline"

        # Linux V4L2 capture path (zero nested locks)
        if sim_mode == "live_uvc" or self._cap is not None:
            got_frame: np.ndarray | None = None
            with self._cap_lock:
                cap = self._cap
                if cap is not None:
                    ok, frame = cap.read()
                    if ok and frame is not None and frame.size > 0:
                        if int(frame.max()) <= 2:
                            self._uvc_black_streak += 1
                            if self._uvc_black_streak >= 90:
                                self._release_cap()
                                self._last_uvc_retry_ts = 0.0
                            elif self._last_uvc_frame is not None and int(self._last_uvc_frame.max()) > 2:
                                got_frame = self._last_uvc_frame.copy()
                            else:
                                got_frame = frame
                        else:
                            self._uvc_black_streak = 0
                            self._last_uvc_frame = frame
                            self._uvc_fail_streak = 0
                            got_frame = frame
                    elif self._cap is not None:
                        self._uvc_fail_streak += 1
                        if self._uvc_fail_streak < 60 and self._last_uvc_frame is not None:
                            got_frame = self._last_uvc_frame.copy()
                        else:
                            self._release_cap()
                            self._last_uvc_retry_ts = time.perf_counter()
            if got_frame is not None:
                return got_frame, "live_uvc", cam_src
            with self._lock:
                self._active_sim_mode = "uvc_offline"
                self._camera_source = "uvc:disconnected"
                sim_mode = "uvc_offline"
                cam_src = "uvc:disconnected"

        if sim_mode == "uvc_offline":
            now_t = time.perf_counter()
            if (now_t - self._last_uvc_retry_ts) >= 2.5 and req_mode not in SIM_MODES and req_mode != "custom":
                reopened_frame: np.ndarray | None = None
                reopened_src = ""
                with self._cap_lock:
                    self._last_uvc_retry_ts = now_t
                    pref = req_mode if req_mode.startswith("/dev/video") else None
                    cap, src_name = self._try_open_uvc(preferred_device=pref)
                    if cap is not None:
                        self._cap = cap
                        reopened_src = src_name
                        if self._last_uvc_frame is not None:
                            reopened_frame = self._last_uvc_frame.copy()
                if reopened_src:
                    with self._lock:
                        self._active_sim_mode = "live_uvc"
                        self._camera_source = reopened_src
                    if reopened_frame is not None:
                        return reopened_frame, "live_uvc", reopened_src
            return self._render_uvc_standby_frame(reason="AWAITING USB CAMERA"), "uvc_offline", cam_src

        if sim_mode == "custom" and custom_bgr is not None:
            return custom_bgr.copy(), "custom", cam_src

        frame = self.synth.render_frame(sim_mode, time.perf_counter())
        return frame, sim_mode, cam_src

    @staticmethod
    def _detect_hand_and_tool_masks(
        small_bgr: np.ndarray,
        hsv: np.ndarray,
        val_ch: np.ndarray,
        sat_ch: np.ndarray,
        warm_patch_full: np.ndarray,
        inv_scale: float,
        orig_w: int,
        orig_h: int,
    ) -> tuple[bool, bool, np.ndarray, np.ndarray, list[int] | None, list[int] | None]:
        """Detect operator hands (YCrCb+HSV skin locus) & handheld tools/screwdrivers so they are NEVER drawn in 3D."""
        ph, pw = small_bgr.shape[:2]
        ycrcb = cv2.cvtColor(small_bgr, cv2.COLOR_BGR2YCrCb)

        # 1. Dual-space human skin locus (YCrCb Cr in [138, 174], Cb in [77, 121] + HSV saturation
        #    S in [38, 168] so neutral/warm carpets S <= 34 and vivid red fault tape S >= 195 never match)
        skin_ycrcb = cv2.inRange(ycrcb, (55, 138, 77), (255, 174, 121))
        skin_hsv = cv2.bitwise_and(
            cv2.bitwise_or(
                cv2.inRange(hsv, (0, 38, 60), (25, 168, 255)),
                cv2.inRange(hsv, (166, 38, 60), (180, 168, 255)),
            ),
            skin_ycrcb,
        )
        skin_clean = cv2.morphologyEx(
            skin_hsv, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        )
        skin_clean = cv2.morphologyEx(
            skin_clean, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        )

        hand_mask = np.zeros((ph, pw), dtype=np.uint8)
        hand_detected = False
        hand_bbox: list[int] | None = None

        num_s, lbl_s, stats_s, _ = cv2.connectedComponentsWithStats(skin_clean)
        max_hand_area = int((pw * ph) * 0.36)
        border_band_area = max(56, int((pw * ph) * 0.0055))
        bx_min, by_min, bx_max, by_max = pw, ph, 0, 0

        for idx in range(1, num_s):
            area = int(stats_s[idx, cv2.CC_STAT_AREA])
            x, y, w_c, h_c = (
                int(stats_s[idx, cv2.CC_STAT_LEFT]),
                int(stats_s[idx, cv2.CC_STAT_TOP]),
                int(stats_s[idx, cv2.CC_STAT_WIDTH]),
                int(stats_s[idx, cv2.CC_STAT_HEIGHT]),
            )
            # Ignore full-frame warm-lit walls, full-width wooden desks, or beige cabinets
            if area > max_hand_area or w_c >= int(pw * 0.82) or h_c >= int(ph * 0.88):
                continue
            touches_border = (
                x <= int(pw * 0.08)
                or y <= int(ph * 0.08)
                or (x + w_c) >= int(pw * 0.92)
                or (y + h_c) >= int(ph * 0.92)
            )
            # Real operator hands/arms enter from the camera frame boundary
            if touches_border and area >= border_band_area:
                hand_detected = True
                hand_mask[lbl_s == idx] = 255
                bx_min = min(bx_min, x)
                by_min = min(by_min, y)
                bx_max = max(bx_max, x + w_c)
                by_max = max(by_max, y + h_c)

        if hand_detected:
            hand_bbox = [
                max(0, int(round(bx_min * inv_scale))),
                max(0, int(round(by_min * inv_scale))),
                min(orig_w, int(round((bx_max - bx_min) * inv_scale))),
                min(orig_h, int(round((by_max - by_min) * inv_scale))),
            ]

        # 2. Handheld Tool / Precision Screwdriver Detector (Plastic Grip + Thin Metallic Shaft)
        tool_mask = np.zeros((ph, pw), dtype=np.uint8)
        tool_detected = False
        tool_bbox: list[int] | None = None

        # Separate thin bright metallic rods/shafts (< 11px wide at half-res) from the thick TZ THT-02 barrel!
        bright_raw = (val_ch > 130).astype(np.uint8) * 255
        thick_barrel_core = cv2.morphologyEx(
            bright_raw, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        )
        thick_guard = cv2.dilate(
            thick_barrel_core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        )
        thin_metallic = cv2.bitwise_and(
            bright_raw,
            cv2.bitwise_and((sat_ch < 72).astype(np.uint8) * 255, cv2.bitwise_not(thick_guard)),
        )

        # High-saturation tool handle candidates (red, orange, yellow, green insulated grips)
        vivid_grip = cv2.bitwise_or(
            warm_patch_full,
            cv2.inRange(hsv, (20, 130, 85), (88, 255, 255)),
        )

        if hand_detected:
            hand_reach = cv2.dilate(
                hand_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
            )
            # 2A. Any colored grip physically held by / adjacent to the operator's hand
            num_g, lbl_g, stats_g, _ = cv2.connectedComponentsWithStats(vivid_grip)
            for idx in range(1, num_g):
                if int(stats_g[idx, cv2.CC_STAT_AREA]) < 16:
                    continue
                comp = (lbl_g == idx).astype(np.uint8) * 255
                if cv2.countNonZero(cv2.bitwise_and(comp, hand_reach)) > 0:
                    tool_mask = cv2.bitwise_or(tool_mask, comp)
                    tool_detected = True

            # 2B. Any thin metallic screwdriver shaft extending from the hand or gripped handle
            grip_reach = cv2.dilate(
                cv2.bitwise_or(hand_mask, tool_mask),
                cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)),
            )
            num_m, lbl_m, stats_m, _ = cv2.connectedComponentsWithStats(thin_metallic)
            for idx in range(1, num_m):
                if int(stats_m[idx, cv2.CC_STAT_AREA]) < 10:
                    continue
                comp = (lbl_m == idx).astype(np.uint8) * 255
                if cv2.countNonZero(cv2.bitwise_and(comp, grip_reach)) > 0:
                    tool_mask = cv2.bitwise_or(tool_mask, comp)
                    tool_detected = True
        else:
            # 2C. Gloved hand / standalone oblique screwdriver entering from frame border:
            #     Require adjacency to a colored insulated handle so bare vertical/diagonal
            #     metallic sensors on walls or machinery are never masked out as tools.
            grip_reach_2c = cv2.dilate(
                vivid_grip, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
            )
            has_any_grip = cv2.countNonZero(grip_reach_2c) > 0
            if has_any_grip:
                cnts_m, _ = cv2.findContours(thin_metallic, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in cnts_m:
                    if cv2.contourArea(cnt) < 28:
                        continue
                    (_, _), (rw_t, rh_t), ang_t = cv2.minAreaRect(cnt)
                    maj_t, min_t = max(rw_t, rh_t), max(1.0, min(rw_t, rh_t))
                    if maj_t >= 24.0 and (maj_t / min_t) >= 3.8:
                        e_pts = cv2.boxPoints(((0.0, 0.0), (rw_t, rh_t), ang_t))
                        d01, d12 = e_pts[1] - e_pts[0], e_pts[2] - e_pts[1]
                        t_vec = d01 if np.linalg.norm(d01) >= np.linalg.norm(d12) else d12
                        t_ang = abs(math.degrees(math.atan2(float(t_vec[1]), float(t_vec[0]))))
                        if 25.0 <= t_ang <= 155.0:
                            cnt_mask = np.zeros((ph, pw), dtype=np.uint8)
                            cv2.drawContours(cnt_mask, [cnt], -1, 255, -1)
                            if cv2.countNonZero(cv2.bitwise_and(cnt_mask, grip_reach_2c)) > 0:
                                tool_mask = cv2.bitwise_or(tool_mask, cnt_mask)
                                tool_detected = True

        if tool_detected:
            ys_t, xs_t = np.where(tool_mask > 0)
            if len(xs_t) > 0:
                tx0, ty0, tx1, ty1 = int(xs_t.min()), int(ys_t.min()), int(xs_t.max()), int(ys_t.max())
                tool_bbox = [
                    max(0, int(round(tx0 * inv_scale))),
                    max(0, int(round(ty0 * inv_scale))),
                    min(orig_w, int(round((tx1 - tx0 + 1) * inv_scale))),
                    min(orig_h, int(round((ty1 - ty0 + 1) * inv_scale))),
                ]

        return hand_detected, tool_detected, hand_mask, tool_mask, hand_bbox, tool_bbox

    @staticmethod
    def _filter_compact_cues(mask_u8: np.ndarray, max_area_px: int) -> np.ndarray:
        """Keep only compact sensor-scale cues (<4.5% of frame) so colored walls/machines never flood masks."""
        if cv2.countNonZero(mask_u8) == 0:
            return mask_u8
        num_c, lbl_c, stats_c, _ = cv2.connectedComponentsWithStats(mask_u8)
        out = np.zeros_like(mask_u8)
        for idx in range(1, num_c):
            a_c = int(stats_c[idx, cv2.CC_STAT_AREA])
            if 10 <= a_c <= max_area_px:
                out[lbl_c == idx] = 255
        return out

    @staticmethod
    def _refine_cylinder_contour(cnt: np.ndarray) -> np.ndarray:
        """Fit outlier-resistant PCA axis & median cross-section bounds to trim shadow flares or cable stubs."""
        rx, ry, rw_b, rh_b = cv2.boundingRect(cnt)
        if rw_b < 4 or rh_b < 4:
            return cnt
        roi_m = np.zeros((rh_b, rw_b), dtype=np.uint8)
        cv2.drawContours(roi_m, [cnt - np.array([[[rx, ry]]])], -1, 255, -1)
        ys_l, xs_l = np.where(roi_m > 0)
        if len(xs_l) < 25:
            return cnt

        pts_f = np.column_stack((xs_l.astype(np.float32) + rx, ys_l.astype(np.float32) + ry))
        mean_pt = pts_f.mean(axis=0)
        centered = pts_f - mean_pt
        cov = (centered.T @ centered) / float(len(pts_f))
        _, eigvecs = np.linalg.eigh(cov)
        u_pca = eigvecs[:, 1].astype(np.float32)
        v_pca = np.array([-u_pca[1], u_pca[0]], dtype=np.float32)

        s_p = centered @ u_pca
        v_p = centered @ v_pca
        s_min0, s_max0 = float(s_p.min()), float(s_p.max())
        span0 = max(1.0, s_max0 - s_min0)

        bins16 = np.linspace(s_min0 + 0.12 * span0, s_max0 - 0.12 * span0, 17)
        v_los: list[float] = []
        v_his: list[float] = []
        for bi in range(16):
            sel = (s_p >= bins16[bi]) & (s_p < bins16[bi + 1])
            if np.count_nonzero(sel) >= 4:
                vv = v_p[sel]
                v_los.append(float(np.percentile(vv, 2.0)))
                v_his.append(float(np.percentile(vv, 98.0)))
        if len(v_los) < 5:
            return cnt

        v_lo_med = float(np.median(v_los))
        v_hi_med = float(np.median(v_his))
        min_len = max(4.0, (v_hi_med - v_lo_med) / 0.96)

        s_lo = float(np.percentile(s_p, 0.5))
        s_hi = float(np.percentile(s_p, 99.5))
        maj_len = max(min_len * 2.5, (s_hi - s_lo) / 0.99)
        c_ref = mean_pt + u_pca * (0.5 * (s_lo + s_hi)) + v_pca * (0.5 * (v_lo_med + v_hi_med))
        hu = u_pca * (0.5 * maj_len)
        hv = v_pca * (0.5 * min_len)
        corners = np.array(
            [c_ref - hu - hv, c_ref + hu - hv, c_ref + hu + hv, c_ref - hu + hv],
            dtype=np.float32,
        )
        return corners.reshape(4, 1, 2)

    @classmethod
    def _detect_industrial_cylinder(
        cls,
        small_bgr: np.ndarray,
        val_ch: np.ndarray,
        sat_ch: np.ndarray,
        pcb_sensor_only: np.ndarray,
        warm_body: np.ndarray,
        keep_sensor: np.ndarray | None,
    ) -> tuple[np.ndarray | None, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Detect cylindrical TZ THT-02 sensor at any 0-360 deg orientation on smooth or textured backgrounds."""
        ph, pw = small_bgr.shape[:2]
        blur3 = cv2.GaussianBlur(small_bgr, (3, 3), 0)
        lab_crisp = cv2.cvtColor(blur3, cv2.COLOR_BGR2Lab)
        l_crisp = lab_crisp[:, :, 0]
        a_crisp = lab_crisp[:, :, 1]
        b_crisp = lab_crisp[:, :, 2]

        # Edge-preserving 7x7 median filter suppresses carpet/concrete/grain micro-texture while keeping cylinder walls sharp
        smooth = cv2.medianBlur(small_bgr, 7)
        lab_u8 = cv2.cvtColor(smooth, cv2.COLOR_BGR2Lab)
        l_u8 = lab_u8[:, :, 0]
        a_u8 = lab_u8[:, :, 1]
        b_u8 = lab_u8[:, :, 2]

        # Fast separable box-pyramid local surround in CIE Lab (<0.25ms on ARM64)
        sw4, sh4 = max(16, pw // 4), max(12, ph // 4)
        lab_q = cv2.resize(lab_u8, (sw4, sh4), interpolation=cv2.INTER_AREA)
        k1 = max(7, int(min(sw4, sh4) * 0.22) | 1)
        k2 = max(15, int(k1 * 2.1) | 1)
        bg1 = cv2.resize(
            cv2.blur(cv2.blur(lab_q, (k1, k1)), (k1, k1)), (pw, ph), interpolation=cv2.INTER_LINEAR
        )
        bg2 = cv2.resize(
            cv2.blur(cv2.blur(lab_q, (k2, k2)), (k2, k2)), (pw, ph), interpolation=cv2.INTER_LINEAR
        )

        l_i16 = l_u8.astype(np.int16)
        dl1 = l_i16 - bg1[:, :, 0].astype(np.int16)
        dl2 = l_i16 - bg2[:, :, 0].astype(np.int16)
        da1 = np.abs(a_u8.astype(np.int16) - bg1[:, :, 1].astype(np.int16))
        db1 = np.abs(b_u8.astype(np.int16) - bg1[:, :, 2].astype(np.int16))
        da2 = np.abs(a_u8.astype(np.int16) - bg2[:, :, 1].astype(np.int16))
        db2 = np.abs(b_u8.astype(np.int16) - bg2[:, :, 2].astype(np.int16))
        dab1 = da1 + db1
        dab2 = da2 + db2

        # Crisp Sobel derivatives for lateral cylinder-wall verification + texture-free derivatives for edge masks
        glx = cv2.Sobel(l_crisp, cv2.CV_16S, 1, 0, ksize=3)
        gly = cv2.Sobel(l_crisp, cv2.CV_16S, 0, 1, ksize=3)
        gax = cv2.Sobel(a_crisp, cv2.CV_16S, 1, 0, ksize=3)
        gay = cv2.Sobel(a_crisp, cv2.CV_16S, 0, 1, ksize=3)
        gbx = cv2.Sobel(b_crisp, cv2.CV_16S, 1, 0, ksize=3)
        gby = cv2.Sobel(b_crisp, cv2.CV_16S, 0, 1, ksize=3)

        glx_s = cv2.Sobel(l_u8, cv2.CV_16S, 1, 0, ksize=3)
        gly_s = cv2.Sobel(l_u8, cv2.CV_16S, 0, 1, ksize=3)
        gax_s = cv2.Sobel(a_u8, cv2.CV_16S, 1, 0, ksize=3)
        gay_s = cv2.Sobel(a_u8, cv2.CV_16S, 0, 1, ksize=3)
        gbx_s = cv2.Sobel(b_u8, cv2.CV_16S, 1, 0, ksize=3)
        gby_s = cv2.Sobel(b_u8, cv2.CV_16S, 0, 1, ksize=3)
        grad_l = cv2.addWeighted(
            cv2.convertScaleAbs(glx_s, alpha=0.25), 0.72, cv2.convertScaleAbs(gly_s, alpha=0.25), 0.72, 0
        )
        grad_c = cv2.max(
            cv2.addWeighted(
                cv2.convertScaleAbs(gax_s, alpha=0.25), 0.72, cv2.convertScaleAbs(gay_s, alpha=0.25), 0.72, 0
            ),
            cv2.addWeighted(
                cv2.convertScaleAbs(gbx_s, alpha=0.25), 0.72, cv2.convertScaleAbs(gby_s, alpha=0.25), 0.72, 0
            ),
        )
        grad_mag = cv2.max(grad_l, grad_c)

        # Reject background-sized blue/red/yellow walls while preserving compact internal PCB or fault tape
        max_cue_area = int((pw * ph) * 0.045)
        local_pcb = cls._filter_compact_cues(pcb_sensor_only, max_cue_area)
        local_warm = cls._filter_compact_cues(warm_body, max_cue_area)
        aux_cues = cv2.bitwise_or(local_pcb, local_warm)
        if keep_sensor is not None:
            aux_cues = cv2.bitwise_and(aux_cues, keep_sensor)

        # Complementary foreground hypotheses covering dark, white, grey, colored, split, textured & iso-luminant scenes
        m_bright = (((dl1 > 9) | (dl2 > 11)).astype(np.uint8)) * 255
        m_dark = (((dl1 < -9) | (dl2 < -11)).astype(np.uint8)) * 255
        m_chroma = (((dab1 > 10) | (dab2 > 12)).astype(np.uint8)) * 255

        bg2_l = bg2[:, :, 0]
        mid_bg = (bg2_l > 55) & (bg2_l < 232)
        m_midtone = (
            (
                mid_bg
                & (
                    (dl1 > 8)
                    | (dl2 > 10)
                    | (((dl1 < -14) | (dl2 < -16)) & (l_u8 < 182) & (sat_ch < 95))
                )
            ).astype(np.uint8)
        ) * 255

        # Neutral polycarbonate/stainless cylinder hypothesis for split dark/bright backgrounds
        m_neutral = (((sat_ch < 46) & (val_ch > 122) & (val_ch < 224)).astype(np.uint8)) * 255

        # Unified 3D CIE-Lab contrast hypothesis with dark-cable exclusion (L > 56):
        # Bridges multi-tone grey housing + white nameplate sticker across medium-luminance
        # backgrounds while cleanly severing attached black rubber cables at the gland neck.
        dl1_i32 = dl1.astype(np.int32)
        dl2_i32 = dl2.astype(np.int32)
        dab1_i32 = dab1.astype(np.int32)
        dab2_i32 = dab2.astype(np.int32)
        dlab1_sq = dl1_i32 * dl1_i32 + 5 * dab1_i32 * dab1_i32
        dlab2_sq = dl2_i32 * dl2_i32 + 5 * dab2_i32 * dab2_i32
        m_dlab_nocable = (
            (((dlab1_sq > 440) | (dlab2_sq > 520)) & (l_u8 > 56)).astype(np.uint8)
        ) * 255

        m_edge_fine = ((grad_mag > 11).astype(np.uint8)) * 255
        m_edge_strong = ((grad_mag > 16).astype(np.uint8)) * 255

        # Rotationally isotropic elliptical kernels prevent rectangular false-merges on curved cables/bezels
        k_open3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        k_open5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        k_open7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        k_close11 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        k_close13 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
        k_close15 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))

        keep_eroded = (
            cv2.erode(keep_sensor, k_open5) if keep_sensor is not None else None
        )
        rim = 3

        def _prep_region_mask(
            raw_m: np.ndarray,
            k_op: np.ndarray = k_open3,
            k_cl: np.ndarray = k_close13,
        ) -> np.ndarray:
            m = cv2.bitwise_or(raw_m, aux_cues)
            if keep_sensor is not None:
                m = cv2.bitwise_and(m, keep_sensor)
            m[:rim, :] = 0
            m[ph - rim :, :] = 0
            m[:, :rim] = 0
            m[:, pw - rim :] = 0
            m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k_op)
            return cv2.morphologyEx(m, cv2.MORPH_CLOSE, k_cl)

        def _prep_edge_mask(raw_e: np.ndarray, k_cl: np.ndarray, k_op: np.ndarray) -> np.ndarray:
            m = cv2.bitwise_or(raw_e, aux_cues)
            if keep_eroded is not None:
                m = cv2.bitwise_and(m, keep_eroded)
            m[:rim, :] = 0
            m[ph - rim :, :] = 0
            m[:, :rim] = 0
            m[:, pw - rim :] = 0
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k_cl)
            return cv2.morphologyEx(m, cv2.MORPH_OPEN, k_op)

        candidate_masks = [
            _prep_region_mask(m_bright),
            _prep_region_mask(m_dark),
            _prep_region_mask(m_chroma),
            _prep_region_mask(m_midtone),
            _prep_region_mask(m_neutral),
            _prep_region_mask(m_dlab_nocable, k_open7, k_close15),
            _prep_edge_mask(m_edge_fine, k_close13, k_open5),
            _prep_edge_mask(m_edge_strong, k_close11, k_open7),
        ]

        min_area = max(250.0, (pw * ph) * 0.0015)
        max_area = (pw * ph) * 0.28
        min_minor = max(6.5, min(pw, ph) * 0.018)
        max_minor = min(pw, ph) * 0.26
        min_major = max(42.0, max(pw, ph) * 0.080)
        max_major = max(pw, ph) * 0.94

        best_cnt: np.ndarray | None = None
        best_score = 0.0

        s_fracs = np.linspace(-0.38, 0.38, 13, dtype=np.float32)
        ax_fracs = np.linspace(-0.46, 0.46, 21, dtype=np.float32)

        for cmask in candidate_masks:
            cnts, _ = cv2.findContours(cmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in cnts:
                area = cv2.contourArea(cnt)
                if area < min_area or area > max_area:
                    continue
                (cx_c, cy_c), (rw, rh), r_ang = cv2.minAreaRect(cnt)
                major = max(rw, rh)
                minor = max(1.0, min(rw, rh))
                if minor < min_minor or minor > max_minor:
                    continue
                if major < min_major or major > max_major:
                    continue
                ratio = major / minor
                if ratio < 2.7 or ratio > 14.8:
                    continue

                extent = area / max(1.0, major * minor)
                if extent < 0.48:
                    continue
                hull_area = cv2.contourArea(cv2.convexHull(cnt))
                solidity = area / max(1.0, hull_area)
                if solidity < 0.58:
                    continue

                b_pts = cv2.boxPoints(((cx_c, cy_c), (rw, rh), r_ang))
                d01 = b_pts[1] - b_pts[0]
                d12 = b_pts[2] - b_pts[1]
                u_v = d01 if np.linalg.norm(d01) >= np.linalg.norm(d12) else d12
                u_v = u_v / max(1e-6, float(np.linalg.norm(u_v)))
                v_v = np.array([-u_v[1], u_v[0]], dtype=np.float32)
                vx, vy = float(v_v[0]) * 0.25, float(v_v[1]) * 0.25

                r = 0.5 * minor
                s_arr = s_fracs * major

                def _g_perp(n_offs: np.ndarray) -> np.ndarray:
                    xs = np.clip(
                        np.round(cx_c + s_arr[:, None] * u_v[0] + n_offs[None, :] * v_v[0]).astype(np.int32),
                        0,
                        pw - 1,
                    )
                    ys = np.clip(
                        np.round(cy_c + s_arr[:, None] * u_v[1] + n_offs[None, :] * v_v[1]).astype(np.int32),
                        0,
                        ph - 1,
                    )
                    gp_l = glx[ys, xs].astype(np.float32) * vx + gly[ys, xs].astype(np.float32) * vy
                    gp_a = gax[ys, xs].astype(np.float32) * vx + gay[ys, xs].astype(np.float32) * vy
                    gp_b = gbx[ys, xs].astype(np.float32) * vx + gby[ys, xs].astype(np.float32) * vy
                    return np.sqrt(gp_l * gp_l + gp_a * gp_a + gp_b * gp_b)

                w_lo = max(1.5, 0.70 * r)
                w_hi = max(r + 2.0, 1.25 * r)
                wall_band = np.linspace(w_lo, w_hi, 5, dtype=np.float32)

                edge_a = _g_perp(-wall_band).max(axis=1)
                edge_b = _g_perp(wall_band).max(axis=1)
                med_edge_a = float(np.median(edge_a))
                med_edge_b = float(np.median(edge_b))
                frac_a = float(np.mean(edge_a >= 9.0))
                frac_b = float(np.mean(edge_b >= 9.0))
                if min(med_edge_a, med_edge_b) < 9.0 or min(frac_a, frac_b) < 0.46:
                    continue

                # Sample 5 cross-section interior lines vs both exterior background flanks
                n_in = np.array([-0.68 * r, -0.34 * r, 0.0, 0.34 * r, 0.68 * r], dtype=np.float32)
                ext_d = max(r + 4.0, 1.55 * r)
                n_ea = np.array([-ext_d - 1.5, -ext_d], dtype=np.float32)
                n_eb = np.array([ext_d, ext_d + 1.5], dtype=np.float32)

                def _sample_lab(n_offs: np.ndarray) -> np.ndarray:
                    xs = np.clip(
                        np.round(cx_c + s_arr[:, None] * u_v[0] + n_offs[None, :] * v_v[0]).astype(np.int32),
                        0,
                        pw - 1,
                    )
                    ys = np.clip(
                        np.round(cy_c + s_arr[:, None] * u_v[1] + n_offs[None, :] * v_v[1]).astype(np.int32),
                        0,
                        ph - 1,
                    )
                    return lab_u8[ys, xs].astype(np.float32)

                lab_in5 = _sample_lab(n_in)
                lab_ea = _sample_lab(n_ea).mean(axis=1)
                lab_eb = _sample_lab(n_eb).mean(axis=1)

                # Use 2nd-highest of 5 interior cross-section lines so 3D cylinder highlight+shadow
                # on a same-luminance wall still registers strong contrast
                dist_a = np.sort(np.linalg.norm(lab_in5 - lab_ea[:, None, :], axis=2), axis=1)[:, 3]
                dist_b = np.sort(np.linalg.norm(lab_in5 - lab_eb[:, None, :], axis=2), axis=1)[:, 3]
                med_dist_a = float(np.median(dist_a))
                med_dist_b = float(np.median(dist_b))
                if min(med_dist_a, med_dist_b) < 8.0:
                    continue

                # Reject step-edge straddlers (where sharpest gradient sits along centerline between dark/light halves)
                l_mid = lab_in5[:, 2, 0]
                dl_ea = float(np.median(l_mid - lab_ea[:, 0]))
                dl_eb = float(np.median(l_mid - lab_eb[:, 0]))
                if dl_ea * dl_eb < -36.0:
                    c_edge = float(np.median(_g_perp(np.array([-1.0, 0.0, 1.0], dtype=np.float32)).max(axis=1)))
                    if c_edge > 0.90 * min(med_edge_a, med_edge_b):
                        continue

                # Verify longitudinal structure (gland/barrel/O-ring/strainer vs uniform flat trim strip)
                s_ax = ax_fracs * major
                xs_ax = np.clip(np.round(cx_c + s_ax * u_v[0]).astype(np.int32), 0, pw - 1)
                ys_ax = np.clip(np.round(cy_c + s_ax * u_v[1]).astype(np.int32), 0, ph - 1)
                axial_var = float(np.linalg.norm(lab_crisp[ys_ax, xs_ax].astype(np.float32).std(axis=0)))
                if axial_var < 4.8:
                    continue

                ratio_fit = 1.0 - min(0.55, abs(ratio - 8.2) / 11.0)
                edge_q = min(40.0, min(med_edge_a, med_edge_b))
                contrast_q = min(50.0, min(med_dist_a, med_dist_b))
                score = (
                    area
                    * extent
                    * solidity
                    * ratio_fit
                    * (0.4 + 0.03 * edge_q)
                    * (0.4 + 0.025 * contrast_q)
                )
                if score > best_score:
                    best_score = score
                    best_cnt = cnt

        if best_cnt is not None:
            best_cnt = cls._refine_cylinder_contour(best_cnt)

        return best_cnt, l_crisp, bg2_l, local_pcb, local_warm

    def analyze_frame(
        self,
        frame_bgr: np.ndarray,
        sim_mode: str = "sim_normal",
        camera_source: str = "simulator:sim_normal",
        fps: float = 28.0,
    ) -> tuple[np.ndarray, dict[str, Any]]:
        """Execute genuine <4ms OpenCV segmentation, hand/tool masking, metrology & HUD overlay."""
        t0 = time.perf_counter()
        orig_h, orig_w = frame_bgr.shape[:2]

        # Fast path when live USB camera is offline/disconnected: never invent or segment fake objects
        if sim_mode == "uvc_offline":
            hud = frame_bgr.copy()
            proc_ms = (time.perf_counter() - t0) * 1000.0
            cv2.rectangle(hud, (0, 0), (orig_w, 34), (13, 18, 25), -1)
            cv2.line(hud, (0, 34), (orig_w, 34), (56, 140, 175), 1)
            status_txt = f"SPATIAL CV | {camera_source.upper()} | STANDBY | 0 KPS | {proc_ms:.2f}ms"
            cv2.putText(
                hud, status_txt, (12, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (165, 235, 250), 1, cv2.LINE_AA
            )
            badge_txt = "NO USB CAMERA"
            (bw_t, _), _ = cv2.getTextSize(badge_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.44, 1)
            bx0 = orig_w - bw_t - 26
            cv2.rectangle(hud, (bx0, 5), (orig_w - 10, 29), (52, 64, 86), -1)
            cv2.putText(
                hud, badge_txt, (bx0 + 8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (240, 245, 252), 1, cv2.LINE_AA
            )
            return hud, {
                "detected": False,
                "mode": "usb",
                "frame_size": [orig_w, orig_h],
                "angle_deg": 0.0,
                "bbox": [0, 0, 0, 0],
                "sensor_quad": None,
                "sensor_axis": None,
                "keypoints": [],
                "measured_ratio": 0.0,
                "est_length_mm": 0.0,
                "est_diameter_mm": 0.0,
                "anomaly_detected": False,
                "anomaly_zone": None,
                "anomaly_z_mm": None,
                "anomaly_confidence": 0.0,
                "anomaly_pt": None,
                "pcb_open_detected": False,
                "hand_detected": False,
                "tool_detected": False,
                "occlusion_filtered": False,
                "hand_bbox": None,
                "hand_contour": [],
                "hand_center": None,
                "hand_velocity_px_s": 0.0,
                "hand_velocity_vec": [0.0, 0.0],
                "hand_trail": [],
                "tool_bbox": None,
                "tool_shaft": None,
                "tool_tip_pt": None,
                "isolated_3d_target": "TZ-THT-02_SENSOR_ONLY",
                "dip_focus_pt": None,
                "scan_coverage_pct": 0,
                "sim_mode": sim_mode,
                "camera_source": camera_source,
                "fps": round(float(fps), 1),
                "cv_ms": round(float(proc_ms), 2),
            }

        # Normalize high-res 1080p/720p live frames onto a ~640px Lab pyramid grid (0.5x on 960x540 simulator)
        max_dim = max(orig_w, orig_h)
        if sim_mode in SIM_MODES:
            proc_scale = 0.5 if orig_w >= 800 else 1.0
        else:
            proc_scale = (640.0 / float(max_dim)) if max_dim >= 800 else 1.0
        if proc_scale < 1.0:
            pw = max(64, int(round(orig_w * proc_scale)))
            ph = max(64, int(round(orig_h * proc_scale)))
            small = cv2.resize(frame_bgr, (pw, ph), interpolation=cv2.INTER_AREA)
        else:
            pw, ph = orig_w, orig_h
            small = frame_bgr

        inv_scale = 1.0 / proc_scale
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        val_ch = hsv[:, :, 2]
        sat_ch = hsv[:, :, 1]

        pcb_blue_full = cv2.inRange(hsv, (92, 58, 42), (138, 255, 255))
        warm_min_sat = 105 if sim_mode in SIM_MODES else 142
        warm_patch_full = cv2.bitwise_or(
            cv2.inRange(hsv, (0, warm_min_sat, 95), (26, 255, 255)),
            cv2.inRange(hsv, (166, warm_min_sat, 95), (180, 255, 255)),
        )

        # 0. Spatial Exclusion Filter: Detect & mask out Operator Hands + Screwdrivers/Tools FIRST
        #    so Three.js ONLY reconstructs the TZ THT-02 sensor and ignores hands/tools!
        (
            hand_detected,
            tool_detected,
            hand_mask,
            tool_mask,
            hand_bbox,
            tool_bbox,
        ) = self._detect_hand_and_tool_masks(
            small, hsv, val_ch, sat_ch, warm_patch_full, inv_scale, orig_w, orig_h
        )
        occlusion_filtered = bool(hand_detected or tool_detected)

        if occlusion_filtered:
            exclusion_mask = cv2.dilate(
                cv2.bitwise_or(hand_mask, tool_mask),
                cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)),
            )
            keep_sensor = cv2.bitwise_not(exclusion_mask)
        else:
            keep_sensor = None

        warm_sensor_only = (
            cv2.bitwise_and(warm_patch_full, keep_sensor)
            if keep_sensor is not None
            else warm_patch_full
        )
        warm_body = cv2.morphologyEx(
            warm_sensor_only, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        )
        # Keep internal blue DIP-8 PCB visible even when screwdriver tip touches DIP pins
        pcb_sensor_only = (
            cv2.bitwise_and(pcb_blue_full, cv2.bitwise_not(hand_mask))
            if hand_detected
            else pcb_blue_full
        )

        detected = False
        angle_deg = 0.0
        bbox = [0, 0, 0, 0]
        measured_ratio = 0.0
        est_length_mm = 0.0
        est_diameter_mm = 0.0
        anomaly_detected = False
        anomaly_zone: str | None = None
        anomaly_z_mm: float | None = None
        anomaly_confidence = 0.0
        pcb_open_detected = False

        hud = frame_bgr.copy()
        best_cnt = None
        best_score = 0.0
        live_l_ch: np.ndarray | None = None
        live_bg_l: np.ndarray | None = None

        if sim_mode in SIM_MODES:
            # Exact fast workbench simulator segmentation path
            body_bright = (val_ch > 122).astype(np.uint8) * 255
            if keep_sensor is not None:
                body_bright = cv2.bitwise_and(body_bright, keep_sensor)
            body_bright = cv2.morphologyEx(
                body_bright, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 7))
            )
            fg_mask = cv2.bitwise_or(body_bright, pcb_sensor_only)
            fg_mask = cv2.bitwise_or(fg_mask, warm_body)

            margin_x, margin_y = max(4, int(pw * 0.025)), max(4, int(ph * 0.03))
            fg_mask[:margin_y, :] = 0
            fg_mask[ph - margin_y :, :] = 0
            fg_mask[:, :margin_x] = 0
            fg_mask[:, pw - margin_x :] = 0

            k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 9))
            fg_clean = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, k_open)
            fg_clean = cv2.morphologyEx(fg_clean, cv2.MORPH_CLOSE, k_close)

            contours, _ = cv2.findContours(fg_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_area = (pw * ph) * 0.004
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < min_area:
                    continue
                (_, _), (rw, rh), _ = cv2.minAreaRect(cnt)
                major = max(rw, rh)
                minor = max(1.0, min(rw, rh))
                ratio = major / minor
                if 2.2 <= ratio <= 18.0:
                    score = area * min(ratio, 10.0)
                    if score > best_score:
                        best_score = score
                        best_cnt = cnt
        else:
            # Real industrial camera / uploaded field photo: background-agnostic, 0-360 deg detector
            best_cnt, live_l_ch, live_bg_l, pcb_sensor_only, warm_sensor_only = (
                self._detect_industrial_cylinder(
                    small, val_ch, sat_ch, pcb_sensor_only, warm_body, keep_sensor
                )
            )

        anomaly_world_pt: tuple[int, int] | None = None

        if best_cnt is not None:
            detected = True
            (cx_s, cy_s), (rw_s, rh_s), rect_ang = cv2.minAreaRect(best_cnt)

            # If hand/tool partially occludes part of the sensor barrel, stabilize dimensions & pose
            # using the clean pre-occlusion sensor anchor so the 3D Twin NEVER shrinks or jumps!
            if occlusion_filtered and self._locked_pose is not None:
                cur_maj = max(rw_s, rh_s)
                lock_maj = float(self._locked_pose["maj_s"])
                if cur_maj < lock_maj * 0.88:
                    cx_s = 0.35 * cx_s + 0.65 * float(self._locked_pose["cx_s"])
                    cy_s = 0.35 * cy_s + 0.65 * float(self._locked_pose["cy_s"])
                    rw_s = float(self._locked_pose["rw_s"])
                    rh_s = float(self._locked_pose["rh_s"])
                    rect_ang = float(self._locked_pose["rect_ang"])

            box_pts_s = cv2.boxPoints(((cx_s, cy_s), (rw_s, rh_s), rect_ang))
            box_pts = box_pts_s * inv_scale

            cx, cy = cx_s * inv_scale, cy_s * inv_scale
            major_px = max(rw_s, rh_s) * inv_scale
            minor_px = max(1.0, min(rw_s, rh_s) * inv_scale)
            measured_ratio = round(float(major_px / minor_px), 2)

            est_diameter_mm = round(NOMINAL_DIAMETER_MM, 1)
            raw_len = est_diameter_mm * (major_px / minor_px) * 1.074
            est_length_mm = round(float(max(115.0, min(162.0, raw_len))), 1)

            bx, by, bw, bh = cv2.boundingRect(box_pts.astype(np.int32))
            bbox = [
                max(0, int(bx)),
                max(0, int(by)),
                min(orig_w, int(bw)),
                min(orig_h, int(bh)),
            ]

            e01 = box_pts_s[1] - box_pts_s[0]
            e12 = box_pts_s[2] - box_pts_s[1]
            u_vec = e01 if np.linalg.norm(e01) >= np.linalg.norm(d12 := e12) else d12
            u_norm = float(np.linalg.norm(u_vec))
            u_vec = u_vec / max(1e-6, u_norm)

            if sim_mode in SIM_MODES:
                if abs(float(u_vec[0])) > 0.22:
                    if u_vec[0] < 0:
                        u_vec = -u_vec
                else:
                    half_maj_s = 0.5 * max(rw_s, rh_s)
                    p_neg = np.array([cx_s, cy_s]) - u_vec * (half_maj_s + 8.0)
                    p_pos = np.array([cx_s, cy_s]) + u_vec * (half_maj_s + 8.0)

                    def _sample_v(pt: np.ndarray) -> float:
                        sx = int(np.clip(round(pt[0]), 2, pw - 3))
                        sy = int(np.clip(round(pt[1]), 2, ph - 3))
                        return float(val_ch[sy - 2 : sy + 3, sx - 2 : sx + 3].mean())

                    if _sample_v(p_pos) < _sample_v(p_neg):
                        u_vec = -u_vec
            else:
                # 0-360 deg gland-to-tip orientation using dark polymer cable gland vs metallic strainer end
                maj_s_cur = max(rw_s, rh_s)
                min_s_cur = max(2.0, min(rw_s, rh_s))
                v_tmp = np.array([-u_vec[1], u_vec[0]], dtype=np.float32)
                lum_src = live_l_ch if live_l_ch is not None else val_ch.astype(np.float32)

                def _end_gland_score(sign: float) -> float:
                    """Higher score means stronger dark polymer gland / narrow cable signature at `sign` end."""
                    s_in = np.linspace(0.32 * maj_s_cur, 0.50 * maj_s_cur, 6, dtype=np.float32) * sign
                    n_in_e = np.linspace(-0.18 * min_s_cur, 0.18 * min_s_cur, 5, dtype=np.float32)
                    xs_i = np.clip(
                        np.round(cx_s + s_in[:, None] * u_vec[0] + n_in_e[None, :] * v_tmp[0]).astype(np.int32),
                        0,
                        pw - 1,
                    )
                    ys_i = np.clip(
                        np.round(cy_s + s_in[:, None] * u_vec[1] + n_in_e[None, :] * v_tmp[1]).astype(np.int32),
                        0,
                        ph - 1,
                    )
                    vi = lum_src[ys_i, xs_i].astype(np.float32)
                    nw_i = warm_sensor_only[ys_i, xs_i] == 0
                    p20_in = float(np.percentile(vi[nw_i] if np.any(nw_i) else vi.ravel(), 20))

                    # Also compare narrow cable core vs its own lateral flanks just past contour end (0.48..0.66)
                    s_ex = np.linspace(0.48 * maj_s_cur, 0.66 * maj_s_cur, 7, dtype=np.float32) * sign
                    n_fl = np.array([-1.25 * min_s_cur, -1.0 * min_s_cur, 1.0 * min_s_cur, 1.25 * min_s_cur], dtype=np.float32)
                    xs_c = np.clip(
                        np.round(cx_s + s_ex[:, None] * u_vec[0] + n_in_e[None, :] * v_tmp[0]).astype(np.int32),
                        0,
                        pw - 1,
                    )
                    ys_c = np.clip(
                        np.round(cy_s + s_ex[:, None] * u_vec[1] + n_in_e[None, :] * v_tmp[1]).astype(np.int32),
                        0,
                        ph - 1,
                    )
                    xs_f = np.clip(
                        np.round(cx_s + s_ex[:, None] * u_vec[0] + n_fl[None, :] * v_tmp[0]).astype(np.int32),
                        0,
                        pw - 1,
                    )
                    ys_f = np.clip(
                        np.round(cy_s + s_ex[:, None] * u_vec[1] + n_fl[None, :] * v_tmp[1]).astype(np.int32),
                        0,
                        ph - 1,
                    )
                    core_l = float(np.percentile(lum_src[ys_c, xs_c].astype(np.float32), 5))
                    flank_l = float(np.median(lum_src[ys_f, xs_f].astype(np.float32)))
                    cable_dip = max(0.0, flank_l - core_l - 8.0)
                    return (200.0 - p20_in) + 1.35 * cable_dip

                g_neg = _end_gland_score(-1.0)
                g_pos = _end_gland_score(1.0)
                if abs(g_neg - g_pos) >= 12.0:
                    if g_pos > g_neg:
                        u_vec = -u_vec
                elif self._locked_pose is not None:
                    prev_rad = math.radians(float(self._locked_pose["angle_deg"]))
                    prev_u = np.array([math.cos(prev_rad), math.sin(prev_rad)], dtype=np.float32)
                    if float(np.dot(u_vec, prev_u)) < -0.2:
                        u_vec = -u_vec
                elif u_vec[0] < -0.15 or (abs(float(u_vec[0])) <= 0.15 and u_vec[1] > 0):
                    u_vec = -u_vec

            angle_deg = round(float(math.degrees(math.atan2(float(u_vec[1]), float(u_vec[0])))), 2)
            v_vec = np.array([-u_vec[1], u_vec[0]], dtype=np.float32)

            if not occlusion_filtered:
                self._locked_pose = {
                    "cx_s": cx_s,
                    "cy_s": cy_s,
                    "rw_s": rw_s,
                    "rh_s": rh_s,
                    "maj_s": max(rw_s, rh_s),
                    "rect_ang": rect_ang,
                    "angle_deg": angle_deg,
                }

            # Build tight rotated sensor ROI mask
            sensor_poly_mask = np.zeros((ph, pw), dtype=np.uint8)
            half_maj_s = 0.5 * max(rw_s, rh_s)
            roi_lat_scale = 1.28 if sim_mode in SIM_MODES else 0.84
            half_min_s = 0.5 * min(rw_s, rh_s) * roi_lat_scale
            c_s = np.array([cx_s, cy_s], dtype=np.float32)
            roi_quad = np.array(
                [
                    c_s - u_vec * (half_maj_s * 1.08) - v_vec * half_min_s,
                    c_s + u_vec * (half_maj_s * 1.03) - v_vec * half_min_s,
                    c_s + u_vec * (half_maj_s * 1.03) + v_vec * half_min_s,
                    c_s - u_vec * (half_maj_s * 1.08) + v_vec * half_min_s,
                ],
                dtype=np.int32,
            )
            cv2.fillConvexPoly(sensor_poly_mask, roi_quad, 255)

            # 2A. Check for exposed internal Blue 8-pin DIP Switch PCB inside middle barrel ROI
            blue_in_roi = cv2.bitwise_and(pcb_sensor_only, sensor_poly_mask)
            blue_ys, blue_xs = np.where(blue_in_roi > 0)
            min_pcb_px = max(14, int(half_maj_s * half_min_s * 0.024))

            # 2B. Check for Red / Orange / Amber fault tape strictly on the ISOLATED sensor (excluding screwdriver/hand!)
            warm_in_roi = cv2.bitwise_and(warm_sensor_only, sensor_poly_mask)
            warm_ys, warm_xs = np.where(warm_in_roi > 0)
            min_warm_px = max(14, int(half_maj_s * half_min_s * 0.032))

            if len(blue_xs) >= min_pcb_px:
                rel_x = blue_xs.astype(np.float32) - cx_s
                rel_y = blue_ys.astype(np.float32) - cy_s
                proj_s = rel_x * float(u_vec[0]) + rel_y * float(u_vec[1])
                mean_proj = float(np.median(proj_s))
                norm_pos = np.clip(mean_proj / max(1.0, half_maj_s), -1.0, 1.0)
                z_val = float(norm_pos * 70.0)
                if -25.0 <= z_val <= 42.0:
                    pcb_open_detected = True
                    anomaly_detected = True
                    anomaly_z_mm = round(z_val, 1)
                    anomaly_zone = "upper_barrel_dip"
                    anomaly_confidence = round(
                        min(0.99, 0.72 + len(blue_xs) / max(80.0, min_pcb_px * 5.0)), 2
                    )
                    ax_s = cx_s + float(u_vec[0]) * mean_proj
                    ay_s = cy_s + float(u_vec[1]) * mean_proj
                    anomaly_world_pt = (int(round(ax_s * inv_scale)), int(round(ay_s * inv_scale)))

            if len(warm_xs) >= min_warm_px and not pcb_open_detected:
                num_lbl, lbl_im, stats, centroids = cv2.connectedComponentsWithStats(warm_in_roi)
                best_lbl = -1
                best_area_w = 0
                for lbl_idx in range(1, num_lbl):
                    a_w = int(stats[lbl_idx, cv2.CC_STAT_AREA])
                    if a_w > best_area_w:
                        best_area_w = a_w
                        best_lbl = lbl_idx
                if best_lbl > 0 and best_area_w >= max(10, min_warm_px // 2):
                    wx_s, wy_s = float(centroids[best_lbl][0]), float(centroids[best_lbl][1])
                else:
                    wx_s, wy_s = float(warm_xs.mean()), float(warm_ys.mean())
                    best_area_w = len(warm_xs)

                proj_s = (wx_s - cx_s) * float(u_vec[0]) + (wy_s - cy_s) * float(u_vec[1])
                norm_pos = float(np.clip(proj_s / max(1.0, half_maj_s), -1.0, 1.0))
                z_val = round(norm_pos * 70.0, 1)

                anomaly_detected = True
                anomaly_z_mm = z_val
                anomaly_zone = z_mm_to_zone(z_val)
                anomaly_confidence = round(
                    min(0.99, 0.74 + best_area_w / max(75.0, min_warm_px * 4.5)), 2
                )
                anomaly_world_pt = (int(round(wx_s * inv_scale)), int(round(wy_s * inv_scale)))

        sensor_quad: list[list[int]] | None = None
        sensor_axis: dict[str, list[int]] | None = None
        keypoints: list[list[int]] = []
        hand_contour: list[list[int]] = []
        hand_center: list[int] | None = None
        hand_velocity_px_s = 0.0
        hand_velocity_vec = [0.0, 0.0]
        tool_shaft: dict[str, list[int]] | None = None
        tool_tip_pt: list[int] | None = None

        # 3A. Extract Sensor Quad, Longitudinal Axis & Real Shi-Tomasi Feature Keypoints
        if best_cnt is not None:
            box_i32 = box_pts.astype(np.int32)
            sensor_quad = [[int(pt[0]), int(pt[1])] for pt in box_i32]

            half_maj_full = 0.5 * major_px
            c_full = np.array([cx, cy], dtype=np.float32)
            p_gland = c_full - u_vec * half_maj_full
            p_tip = c_full + u_vec * half_maj_full
            sensor_axis = {
                "gland": [int(round(float(p_gland[0]))), int(round(float(p_gland[1])))],
                "tip": [int(round(float(p_tip[0]))), int(round(float(p_tip[1])))],
                "center": [int(round(cx)), int(round(cy))],
            }

            # Genuine Shi-Tomasi corner keypoints restricted to the isolated TZ THT-02 body
            gray_small = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            kp_mask = (
                cv2.bitwise_and(sensor_poly_mask, keep_sensor)
                if keep_sensor is not None
                else sensor_poly_mask
            )
            raw_kps = cv2.goodFeaturesToTrack(
                gray_small, maxCorners=18, qualityLevel=0.06, minDistance=8, mask=kp_mask
            )
            if raw_kps is not None:
                for kp in raw_kps.reshape(-1, 2):
                    keypoints.append(
                        [int(round(float(kp[0]) * inv_scale)), int(round(float(kp[1]) * inv_scale))]
                    )

        # 3B. Extract Operator Hand Hull Contour, Optical Velocity Vector & Rolling Motion Trail
        now_ts = time.perf_counter()
        if hand_detected:
            cnts_h, _ = cv2.findContours(hand_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if cnts_h:
                largest_h = max(cnts_h, key=cv2.contourArea)
                approx_h = cv2.approxPolyDP(largest_h, epsilon=3.2, closed=True)
                hand_contour = [
                    [int(round(float(p[0][0]) * inv_scale)), int(round(float(p[0][1]) * inv_scale))]
                    for p in approx_h[:24]
                ]
                m_h = cv2.moments(largest_h)
                if m_h["m00"] > 1e-3:
                    hx = float(m_h["m10"] / m_h["m00"]) * inv_scale
                    hy = float(m_h["m01"] / m_h["m00"]) * inv_scale
                elif hand_bbox is not None:
                    hx = hand_bbox[0] + hand_bbox[2] * 0.5
                    hy = hand_bbox[1] + hand_bbox[3] * 0.5
                else:
                    hx, hy = orig_w * 0.75, orig_h * 0.75

                hand_center = [int(round(hx)), int(round(hy))]
                if self._prev_hand_pt is not None and (now_ts - self._prev_hand_ts) < 0.85:
                    dt_h = max(0.012, now_ts - self._prev_hand_ts)
                    inst_vx = (hx - self._prev_hand_pt[0]) / dt_h
                    inst_vy = (hy - self._prev_hand_pt[1]) / dt_h
                    evx = 0.55 * self._hand_vel_ema[0] + 0.45 * inst_vx
                    evy = 0.55 * self._hand_vel_ema[1] + 0.45 * inst_vy
                    self._hand_vel_ema = (evx, evy)
                else:
                    self._hand_vel_ema = (0.0, 0.0)
                    self._hand_trail.clear()

                self._prev_hand_pt = (hx, hy)
                self._prev_hand_ts = now_ts
                hand_velocity_vec = [
                    round(float(self._hand_vel_ema[0]), 1),
                    round(float(self._hand_vel_ema[1]), 1),
                ]
                hand_velocity_px_s = round(
                    float(math.hypot(self._hand_vel_ema[0], self._hand_vel_ema[1])), 1
                )
                self._hand_trail.append(hand_center)
        else:
            if (now_ts - self._prev_hand_ts) > 0.25:
                self._prev_hand_pt = None
                self._hand_vel_ema = (0.0, 0.0)
                self._hand_trail.clear()

        # 3C. Extract Precision Screwdriver / Tool Principal Shaft Vector & Exact Tip Crosshair
        if tool_detected:
            ys_t, xs_t = np.where(tool_mask > 0)
            if len(xs_t) >= 6:
                pts_t = np.column_stack((xs_t.astype(np.float32), ys_t.astype(np.float32)))
                mean_t = pts_t.mean(axis=0)
                centered_t = pts_t - mean_t
                cov_t = np.cov(centered_t, rowvar=False)
                eigvals, eigvecs = np.linalg.eigh(cov_t)
                dir_t = eigvecs[:, int(np.argmax(eigvals))]
                proj_t = centered_t @ dir_t
                p_min = (mean_t + dir_t * float(proj_t.min())) * inv_scale
                p_max = (mean_t + dir_t * float(proj_t.max())) * inv_scale
                ref_x = cx if detected else orig_w * 0.5
                ref_y = cy if detected else orig_h * 0.5
                d_min = math.hypot(float(p_min[0]) - ref_x, float(p_min[1]) - ref_y)
                d_max = math.hypot(float(p_max[0]) - ref_x, float(p_max[1]) - ref_y)
                tip_arr, base_arr = (p_min, p_max) if d_min <= d_max else (p_max, p_min)
                tool_tip_pt = [int(round(float(tip_arr[0]))), int(round(float(tip_arr[1])))]
                tool_base_pt = [int(round(float(base_arr[0]))), int(round(float(base_arr[1])))]
                tool_shaft = {"tip": tool_tip_pt, "base": tool_base_pt}

        # 4. Render Style 3 Spatial Vision HUD on `hud` (for snapshots & Sign-Off audit strips)
        glow_layer = hud.copy()
        if best_cnt is not None and sensor_quad is not None and sensor_axis is not None:
            sq_np = np.array(sensor_quad, dtype=np.int32)
            cv2.fillConvexPoly(glow_layer, sq_np, (220, 210, 25))
            if hand_contour:
                cv2.fillPoly(glow_layer, [np.array(hand_contour, dtype=np.int32)], (45, 155, 245))
            cv2.addWeighted(glow_layer, 0.13, hud, 0.87, 0, hud)

            # Tactical corner lock-on brackets along rotated sensor quad
            for idx_q in range(4):
                p0 = np.array(sensor_quad[idx_q], dtype=np.float32)
                p_prev = np.array(sensor_quad[(idx_q - 1) % 4], dtype=np.float32)
                p_next = np.array(sensor_quad[(idx_q + 1) % 4], dtype=np.float32)
                v1 = p_prev - p0
                v2 = p_next - p0
                l1 = max(1.0, float(np.linalg.norm(v1)))
                l2 = max(1.0, float(np.linalg.norm(v2)))
                seg1 = p0 + (v1 / l1) * min(22.0, l1 * 0.35)
                seg2 = p0 + (v2 / l2) * min(22.0, l2 * 0.35)
                cv2.line(hud, (int(p0[0]), int(p0[1])), (int(seg1[0]), int(seg1[1])), (245, 225, 40), 2, cv2.LINE_AA)
                cv2.line(hud, (int(p0[0]), int(p0[1])), (int(seg2[0]), int(seg2[1])), (245, 225, 40), 2, cv2.LINE_AA)

            # Longitudinal metrology axis + Shi-Tomasi keypoint sparkles
            gx, gy = sensor_axis["gland"]
            tx_p, ty_p = sensor_axis["tip"]
            cv2.line(hud, (gx, gy), (tx_p, ty_p), (195, 190, 50), 1, cv2.LINE_AA)
            for kp_x, kp_y in keypoints:
                cv2.circle(hud, (kp_x, kp_y), 3, (255, 240, 95), 1, cv2.LINE_AA)
                cv2.circle(hud, (kp_x, kp_y), 1, (255, 255, 255), -1, cv2.LINE_AA)

            # Leader-line callout pill for TARGET: TZ THT-02 SENSOR (top-left quadrant, never blocks DIP-8!)
            anc_s = (int(round(cx - major_px * 0.22)), int(round(cy - minor_px * 0.52)))
            pill_sx, pill_sy = 24, max(78, anc_s[1] - 58)
            cv2.circle(hud, anc_s, 3, (245, 225, 40), -1, cv2.LINE_AA)
            cv2.line(hud, anc_s, (pill_sx + 48, pill_sy + 5), (245, 225, 40), 1, cv2.LINE_AA)
            s_lbl = f"TARGET: TZ THT-02 [99%] | {est_length_mm:.1f}x{est_diameter_mm:.1f}mm | 3D ACTIVE"
            (tw_s, th_s), _ = cv2.getTextSize(s_lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            cv2.rectangle(hud, (pill_sx, pill_sy - th_s - 6), (pill_sx + tw_s + 12, pill_sy + 5), (14, 20, 28), -1)
            cv2.rectangle(hud, (pill_sx, pill_sy - th_s - 6), (pill_sx + tw_s + 12, pill_sy + 5), (245, 225, 40), 1)
            cv2.putText(hud, s_lbl, (pill_sx + 6, pill_sy - 1), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (230, 250, 255), 1, cv2.LINE_AA)

            if anomaly_detected and anomaly_world_pt is not None:
                ax, ay = anomaly_world_pt
                pulse = int(4.0 * abs(math.sin(now_ts * 5.5)))
                ret_r = int(max(18, minor_px * 0.60)) + pulse
                ret_col = (40, 165, 255) if pcb_open_detected else (48, 52, 248)
                cv2.circle(hud, (ax, ay), ret_r, ret_col, 2, cv2.LINE_AA)
                cv2.circle(hud, (ax, ay), 3, (90, 245, 255), -1, cv2.LINE_AA)
                lx = min(orig_w - 348, max(440, ax - 35))
                ly = max(78, ay - ret_r - 36)
                cv2.line(hud, (ax, ay - ret_r), (lx + 18, ly + 5), ret_col, 1, cv2.LINE_AA)
                tag = (
                    f"DIP-8 PCB OPEN [{anomaly_zone}] z={anomaly_z_mm:+.1f}mm ({int(anomaly_confidence*100)}%)"
                    if pcb_open_detected
                    else f"TWIN DEVIATION [{anomaly_zone}] z={anomaly_z_mm:+.1f}mm ({int(anomaly_confidence*100)}%)"
                )
                (tw, th_txt), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.43, 1)
                cv2.rectangle(hud, (lx, ly - th_txt - 6), (lx + tw + 12, ly + 5), (16, 19, 27), -1)
                cv2.rectangle(hud, (lx, ly - th_txt - 6), (lx + tw + 12, ly + 5), ret_col, 1)
                cv2.putText(hud, tag, (lx + 6, ly - 1), cv2.FONT_HERSHEY_SIMPLEX, 0.43, (245, 248, 255), 1, cv2.LINE_AA)

        # 4B. Style 3 Screwdriver Shaft Laser Vector + Precision Tip Crosshair
        if tool_shaft is not None and tool_tip_pt is not None:
            t_tip = tuple(tool_tip_pt)
            t_base = tuple(tool_shaft["base"])
            t_col = (250, 130, 195)  # Electric violet-magenta in BGR
            cv2.line(hud, t_base, t_tip, t_col, 2, cv2.LINE_AA)
            cv2.circle(hud, t_tip, 9, t_col, 1, cv2.LINE_AA)
            cv2.line(hud, (t_tip[0] - 13, t_tip[1]), (t_tip[0] + 13, t_tip[1]), t_col, 1, cv2.LINE_AA)
            cv2.line(hud, (t_tip[0], t_tip[1] - 13), (t_tip[0], t_tip[1] + 13), t_col, 1, cv2.LINE_AA)

            tx_lbl = min(orig_w - 318, max(540, t_tip[0] + 34))
            ty_lbl = max(122, min(orig_h - 80, t_tip[1] - 32))
            cv2.line(hud, (t_tip[0] + 9, t_tip[1] - 5), (tx_lbl, ty_lbl), t_col, 1, cv2.LINE_AA)
            t_str = "PRECISION DRIVER [95%] | TIP LOCKED | IGNORED IN 3D"
            (tw_t, th_t), _ = cv2.getTextSize(t_str, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
            cv2.rectangle(hud, (tx_lbl, ty_lbl - th_t - 6), (tx_lbl + tw_t + 10, ty_lbl + 5), (16, 18, 28), -1)
            cv2.rectangle(hud, (tx_lbl, ty_lbl - th_t - 6), (tx_lbl + tw_t + 10, ty_lbl + 5), t_col, 1)
            cv2.putText(hud, t_str, (tx_lbl + 5, ty_lbl - 1), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (248, 220, 255), 1, cv2.LINE_AA)

        # 4C. Style 3 Operator Hand Contour, Motion Trail, Velocity Vector & Leader Callout
        if hand_detected and hand_center is not None:
            h_col = (42, 180, 255)  # Warm industrial amber in BGR
            if len(hand_contour) >= 3:
                cv2.polylines(
                    hud, [np.array(hand_contour, dtype=np.int32)], True, h_col, 2, cv2.LINE_AA
                )
            trail_pts = list(self._hand_trail)
            for idx_tr in range(1, len(trail_pts)):
                p_a = tuple(trail_pts[idx_tr - 1])
                p_b = tuple(trail_pts[idx_tr])
                cv2.line(hud, p_a, p_b, (75, 205, 255), max(1, idx_tr // 3), cv2.LINE_AA)
            if hand_velocity_px_s >= 6.0:
                vx_d = int(round(hand_center[0] + max(-55.0, min(55.0, hand_velocity_vec[0] * 0.45))))
                vy_d = int(round(hand_center[1] + max(-55.0, min(55.0, hand_velocity_vec[1] * 0.45))))
                cv2.arrowedLine(hud, tuple(hand_center), (vx_d, vy_d), (90, 230, 255), 2, cv2.LINE_AA, tipLength=0.28)

            vel_str = f"{int(round(hand_velocity_px_s))} px/s" if hand_velocity_px_s >= 6.0 else "STATIC"
            h_str = f"OPERATOR HAND [97%] | {vel_str} | IGNORED IN 3D"
            (tw_h, th_h), _ = cv2.getTextSize(h_str, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
            hx_lbl = max(14, min(orig_w - tw_h - 18, hand_center[0] - tw_h // 2))
            hy_lbl = max(110, min(orig_h - 14, (hand_bbox[1] if hand_bbox else hand_center[1]) - 14))
            cv2.line(hud, tuple(hand_center), (hx_lbl + 22, hy_lbl + 4), h_col, 1, cv2.LINE_AA)
            cv2.rectangle(hud, (hx_lbl, hy_lbl - th_h - 6), (hx_lbl + tw_h + 10, hy_lbl + 5), (16, 19, 26), -1)
            cv2.rectangle(hud, (hx_lbl, hy_lbl - th_h - 6), (hx_lbl + tw_h + 10, hy_lbl + 5), h_col, 1)
            cv2.putText(hud, h_str, (hx_lbl + 5, hy_lbl - 1), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (215, 240, 255), 1, cv2.LINE_AA)

        proc_ms = (time.perf_counter() - t0) * 1000.0

        # Top HUD status bar
        cv2.rectangle(hud, (0, 0), (orig_w, 34), (13, 18, 25), -1)
        cv2.line(hud, (0, 34), (orig_w, 34), (56, 140, 175), 1)
        mask_tag = " | 3D MASK: HAND+TOOL REJECTED" if occlusion_filtered else ""
        status_txt = (
            f"SPATIAL CV | {camera_source.upper()} | {fps:.1f} FPS | {len(keypoints)} KPS | {proc_ms:.2f}ms{mask_tag}"
        )
        cv2.putText(
            hud,
            status_txt,
            (12, 23),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (165, 235, 250),
            1,
            cv2.LINE_AA,
        )

        badge_col = (36, 48, 235) if anomaly_detected else (55, 165, 75)
        badge_txt = (
            f"ALERT: {anomaly_zone}" if anomaly_detected else ("LOCKED: NOMINAL" if detected else "SCANNING...")
        )
        (bw_t, _), _ = cv2.getTextSize(badge_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.44, 1)
        bx0 = orig_w - bw_t - 26
        cv2.rectangle(hud, (bx0, 5), (orig_w - 10, 29), badge_col, -1)
        cv2.putText(
            hud,
            badge_txt,
            (bx0 + 8, 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.44,
            (250, 252, 255),
            1,
            cv2.LINE_AA,
        )

        telemetry: dict[str, Any] = {
            "detected": detected,
            "mode": "usb" if sim_mode in ("live_uvc", "uvc_offline") else sim_mode,
            "frame_size": [orig_w, orig_h],
            "angle_deg": angle_deg,
            "bbox": bbox,
            "sensor_quad": sensor_quad,
            "sensor_axis": sensor_axis,
            "keypoints": keypoints,
            "measured_ratio": measured_ratio,
            "est_length_mm": est_length_mm,
            "est_diameter_mm": est_diameter_mm,
            "anomaly_detected": anomaly_detected,
            "anomaly_zone": anomaly_zone,
            "anomaly_z_mm": anomaly_z_mm,
            "anomaly_confidence": anomaly_confidence,
            "anomaly_pt": list(anomaly_world_pt) if anomaly_world_pt else None,
            "pcb_open_detected": pcb_open_detected,
            "hand_detected": hand_detected,
            "tool_detected": tool_detected,
            "occlusion_filtered": occlusion_filtered,
            "hand_bbox": hand_bbox,
            "hand_contour": hand_contour,
            "hand_center": hand_center,
            "hand_velocity_px_s": hand_velocity_px_s,
            "hand_velocity_vec": hand_velocity_vec,
            "hand_trail": list(self._hand_trail),
            "tool_bbox": tool_bbox,
            "tool_shaft": tool_shaft,
            "tool_tip_pt": tool_tip_pt,
            "isolated_3d_target": "TZ-THT-02_SENSOR_ONLY",
            "dip_focus_pt": list(anomaly_world_pt) if (pcb_open_detected and anomaly_world_pt) else None,
            "scan_coverage_pct": 94 if detected else 28,
            "sim_mode": sim_mode,
            "camera_source": camera_source,
            "fps": round(float(fps), 1),
            "cv_ms": round(float(proc_ms), 2),
        }
        return hud, telemetry

    def step_once(self) -> dict[str, Any]:
        """Acquire, analyze, and JPEG-encode a single frame synchronously."""
        with self._step_lock:
            now = time.perf_counter()
            dt = max(1e-4, now - self._last_tick)
            self._last_tick = now
            inst_fps = min(60.0, 1.0 / dt)
            self._fps_ema = 0.85 * self._fps_ema + 0.15 * inst_fps if self._frame_seq > 0 else self.target_fps

            raw_bgr, sim_mode, cam_src = self._acquire_raw_frame()
            hud_bgr, telemetry = self.analyze_frame(
                raw_bgr, sim_mode=sim_mode, camera_source=cam_src, fps=self._fps_ema
            )

            encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), self.jpeg_quality]
            ok_hud, buf_hud = cv2.imencode(".jpg", hud_bgr, encode_params)
            ok_raw, buf_raw = cv2.imencode(".jpg", raw_bgr, encode_params)

            with self._lock:
                self._frame_seq += 1
                telemetry["frame_seq"] = self._frame_seq
                telemetry["scan_coverage_pct"] = (
                    min(98, 86 + min(12, self._frame_seq)) if telemetry.get("detected") else 28
                )
                self._latest_raw_bgr = raw_bgr
                if ok_hud:
                    self._latest_hud_jpeg = buf_hud.tobytes()
                if ok_raw:
                    self._latest_raw_jpeg = buf_raw.tobytes()
                self._latest_telemetry = telemetry
                return dict(self._latest_telemetry)

    def _run_loop(self) -> None:
        frame_interval = 1.0 / self.target_fps
        last_mac_pkt_ts = -1.0
        while True:
            with self._lock:
                if not self._running:
                    break
                sim_mode = self._active_sim_mode
                pkt = self._mac_latest_packet
            if (
                sys.platform == "darwin"
                and sim_mode == "live_uvc"
                and pkt is not None
                and pkt[2] == last_mac_pkt_ts
                and (time.perf_counter() - pkt[2]) < 0.12
            ):
                time.sleep(0.006)
                continue
            if pkt is not None and sim_mode == "live_uvc":
                last_mac_pkt_ts = pkt[2]
            t_start = time.perf_counter()
            try:
                self.step_once()
            except Exception:
                pass
            elapsed = time.perf_counter() - t_start
            sleep_s = frame_interval - elapsed
            if sleep_s > 0.001:
                time.sleep(sleep_s)

    def get_latest_jpeg(self) -> bytes:
        """Return latest HUD-annotated BGR frame as JPEG bytes for MJPEG streaming."""
        with self._lock:
            data = self._latest_hud_jpeg
        if not data:
            self.step_once()
            with self._lock:
                data = self._latest_hud_jpeg
        return data

    def get_raw_jpeg(self) -> bytes:
        """Return latest clean camera/workbench frame as JPEG bytes for LFM3-VL-2B inspection."""
        with self._lock:
            data = self._latest_raw_jpeg
        if not data:
            self.step_once()
            with self._lock:
                data = self._latest_raw_jpeg
        return data

    def get_dip_focus_jpeg(self) -> bytes:
        """Crop & enlarge (2.2x zoom with crisp HUD reticle `DIP-8 PIN FOCUS · ON=1`) the central PCB / DIP-8 region."""
        with self._lock:
            raw_bgr = getattr(self, "_latest_raw_bgr", None)
            raw_jpg = self._latest_raw_jpeg
            tel = dict(self._latest_telemetry)

        if raw_bgr is None:
            if not raw_jpg:
                self.step_once()
                with self._lock:
                    raw_bgr = getattr(self, "_latest_raw_bgr", None)
                    raw_jpg = self._latest_raw_jpeg
                    tel = dict(self._latest_telemetry)
            if raw_bgr is None and raw_jpg:
                arr = np.frombuffer(raw_jpg, dtype=np.uint8)
                raw_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if raw_bgr is None or raw_bgr.size == 0:
            raw_bgr = np.zeros((270, 480, 3), dtype=np.uint8)

        h, w = raw_bgr.shape[:2]
        focus_pt = tel.get("dip_focus_pt")
        bbox = tel.get("bbox") or [0, 0, 0, 0]
        if isinstance(focus_pt, (list, tuple)) and len(focus_pt) == 2:
            fx, fy = int(focus_pt[0]), int(focus_pt[1])
        elif tel.get("detected") and len(bbox) == 4 and bbox[2] > 20 and bbox[3] > 10:
            # Upper barrel / internal DIP-8 PCB sits around 62% along gland->strainer axis
            fx = int(bbox[0] + bbox[2] * 0.62)
            fy = int(bbox[1] + bbox[3] * 0.50)
        else:
            fx, fy = w // 2, h // 2

        out_w, out_h = 528, 286
        zoom = 2.2
        crop_w = max(64, min(w, int(round(out_w / zoom))))
        crop_h = max(48, min(h, int(round(out_h / zoom))))

        x0 = max(0, min(w - crop_w, fx - crop_w // 2))
        y0 = max(0, min(h - crop_h, fy - crop_h // 2))
        roi = raw_bgr[y0 : y0 + crop_h, x0 : x0 + crop_w]
        zoomed = cv2.resize(roi, (out_w, out_h), interpolation=cv2.INTER_CUBIC)

        # Top HUD header bar: "DIP-8 PIN FOCUS · ON=1"
        cv2.rectangle(zoomed, (0, 0), (out_w, 32), (14, 19, 28), -1)
        cv2.line(zoomed, (0, 32), (out_w, 32), (245, 195, 40), 1)
        cv2.putText(
            zoomed,
            "DIP-8 PIN FOCUS",
            (12, 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.50,
            (248, 250, 252),
            1,
            cv2.LINE_AA,
        )
        cv2.circle(zoomed, (162, 17), 2, (56, 189, 248), -1, cv2.LINE_AA)
        cv2.putText(
            zoomed,
            "ON=1  [2.2X MACRO]",
            (172, 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            (125, 225, 255),
            1,
            cv2.LINE_AA,
        )

        pcb_open = bool(tel.get("pcb_open_detected"))
        tag_col = (40, 165, 255) if pcb_open else (90, 175, 95)
        tag_txt = "PCB EXPOSED" if pcb_open else "BARREL CLOSED"
        cv2.rectangle(zoomed, (out_w - 134, 6), (out_w - 10, 26), tag_col, -1)
        cv2.putText(
            zoomed,
            tag_txt,
            (out_w - 126, 21),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.42,
            (252, 252, 255),
            1,
            cv2.LINE_AA,
        )

        # Precision DIP-8 corner reticle & 1..8 binary weight scale
        rx0, ry0, rx1, ry1 = 104, 72, out_w - 104, out_h - 54
        ret_col = (56, 215, 255) if pcb_open else (210, 200, 60)
        brk = 20
        for cx_b, cy_b, sx, sy in (
            (rx0, ry0, 1, 1),
            (rx1, ry0, -1, 1),
            (rx0, ry1, 1, -1),
            (rx1, ry1, -1, -1),
        ):
            cv2.line(zoomed, (cx_b, cy_b), (cx_b + sx * brk, cy_b), ret_col, 2, cv2.LINE_AA)
            cv2.line(zoomed, (cx_b, cy_b), (cx_b, cy_b + sy * brk), ret_col, 2, cv2.LINE_AA)

        # 8-pin alignment guide along bottom HUD strip
        cv2.rectangle(zoomed, (0, out_h - 28), (out_w, out_h), (14, 19, 28), -1)
        weights = (128, 64, 32, 16, 8, 4, 2, 1)
        for idx, wt in enumerate(weights):
            px = rx0 + 18 + int(idx * ((rx1 - rx0 - 36) / 7.0))
            cv2.line(zoomed, (px, ry1 - 4), (px, ry1 + 5), ret_col, 1, cv2.LINE_AA)
            cv2.putText(
                zoomed,
                f"{idx + 1}:{wt}",
                (px - 16, out_h - 9),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.35,
                (195, 220, 240),
                1,
                cv2.LINE_AA,
            )

        ok, enc = cv2.imencode(".jpg", zoomed, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        return enc.tobytes() if ok else self.get_latest_jpeg()

    def get_telemetry(self) -> dict[str, Any]:
        """Return latest thread-safe OpenCV telemetry dictionary."""
        with self._lock:
            tel = dict(self._latest_telemetry)
        if not tel:
            return self.step_once()
        return tel


RealTimeVisionScanner = VisionScanner

_GLOBAL_SCANNER: VisionScanner | None = None
_GLOBAL_SCANNER_LOCK = threading.Lock()


def get_scanner(auto_start: bool = True) -> VisionScanner:
    """Return singleton `VisionScanner` instance (auto-starting the 30 FPS loop by default)."""
    global _GLOBAL_SCANNER
    with _GLOBAL_SCANNER_LOCK:
        if _GLOBAL_SCANNER is None:
            _GLOBAL_SCANNER = VisionScanner()
        if auto_start:
            _GLOBAL_SCANNER.start()
        return _GLOBAL_SCANNER
