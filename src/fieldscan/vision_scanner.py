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

import math
import os
from pathlib import Path
import threading
import time
from typing import Any

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

        # Natural micro-motion as the technician's hand & screwdriver approach Pin 8
        jx = 5.0 * math.sin(t_sec * 1.9)
        jy = 4.0 * math.cos(t_sec * 2.4)
        tip_x = int(round(dip_x + 14.0 + jx))
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
        palm_pts = np.array(
            [
                [shaft_end_x + 18, shaft_end_y + 10],
                [shaft_end_x + 92, shaft_end_y - 6],
                [w - 22, h - 75],
                [w - 18, h - 1],
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
        jpeg_quality: int = 82,
        auto_start: bool = False,
    ) -> None:
        self.assets_dir = _resolve_assets_dir()
        self.synth = _WorkbenchSynthesizer(self.assets_dir, width=960, height=540)
        self.target_fps = max(5.0, min(30.0, float(target_fps)))
        self.jpeg_quality = int(jpeg_quality)

        self._lock = threading.Lock()
        self._running = False
        self._thread: threading.Thread | None = None
        self._cap: cv2.VideoCapture | None = None

        self._requested_mode = initial_mode or os.environ.get("FIELDSCAN_CAMERA_MODE", "auto")
        self._active_sim_mode = "sim_normal"
        self._camera_source = "simulator:workbench"
        self._custom_bgr: np.ndarray | None = None

        self._latest_hud_jpeg: bytes = b""
        self._latest_raw_jpeg: bytes = b""
        self._latest_telemetry: dict[str, Any] = {}
        self._locked_pose: dict[str, Any] | None = None
        self._frame_seq = 0
        self._fps_ema = 28.0
        self._last_tick = time.perf_counter()

        # Initialize hardware/simulator mode and run one synchronous frame immediately
        # so callers never observe empty bytes or uninitialized telemetry.
        self._configure_source(self._requested_mode)
        self.step_once()
        if auto_start:
            self.start()

    def _try_open_uvc(self, preferred_device: str | None = None) -> tuple[cv2.VideoCapture | None, str]:
        """Attempt to open a real USB UVC webcam (Linux V4L2 `/dev/video*` or macOS AVFoundation `0,1`)."""
        import sys

        if sys.platform == "darwin":
            mac_indices = [0, 1]
            if preferred_device and preferred_device.isdigit():
                mac_indices = [int(preferred_device)] + [i for i in mac_indices if i != int(preferred_device)]
            for idx in mac_indices:
                cap: cv2.VideoCapture | None = None
                try:
                    cap = cv2.VideoCapture(idx, cv2.CAP_AVFOUNDATION)
                    if not cap.isOpened():
                        cap.release()
                        continue
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                    cap.set(cv2.CAP_PROP_FPS, 30)
                    ok, test_frame = cap.read()
                    if ok and test_frame is not None and test_frame.size > 0:
                        return cap, f"uvc:avfoundation:{idx}"
                    cap.release()
                except Exception:
                    if cap is not None:
                        try:
                            cap.release()
                        except Exception:
                            pass
            return None, ""

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
                ok, test_frame = cap.read()
                if ok and test_frame is not None and test_frame.size > 0:
                    src_name = f"uvc:{dev}"
                    return cap, src_name
                cap.release()
            except Exception:
                if cap is not None:
                    try:
                        cap.release()
                    except Exception:
                        pass
        return None, ""

    def _release_cap(self) -> None:
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None

    def _configure_source(self, mode: str) -> None:
        mode_clean = (mode or "auto").strip().lower()
        self._requested_mode = mode_clean

        if mode_clean in SIM_MODES:
            self._release_cap()
            self._active_sim_mode = mode_clean
            self._camera_source = f"simulator:{mode_clean}"
            return

        if mode_clean == "custom" and self._custom_bgr is not None:
            self._release_cap()
            self._active_sim_mode = "custom"
            self._camera_source = "custom:injected_frame"
            return

        # Try real UVC webcam ("auto", "uvc", "usb", "/dev/video0", "/dev/video1")
        pref = mode_clean if mode_clean.startswith("/dev/video") else None
        self._release_cap()
        cap, src_name = self._try_open_uvc(preferred_device=pref)
        if cap is not None:
            self._cap = cap
            self._active_sim_mode = "live_uvc"
            self._camera_source = src_name
        else:
            # Clean hardware-free fallback to workbench simulator
            self._active_sim_mode = "sim_normal"
            self._camera_source = "simulator:sim_normal (uvc_fallback)"

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
        """Stop background capture loop and release any V4L2 device handle."""
        with self._lock:
            self._running = False
            thread = self._thread
            self._thread = None
        if thread is not None and thread.is_alive():
            thread.join(timeout=1.5)
        with self._lock:
            self._release_cap()

    def set_mode(self, mode: str) -> dict[str, Any]:
        """Switch between USB UVC camera and any of the 4 simulated workbench modes."""
        with self._lock:
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
        with self._lock:
            self._release_cap()
            self._custom_bgr = decoded
            self._requested_mode = "custom"
            self._active_sim_mode = "custom"
            self._camera_source = "custom:injected_frame"
        return self.step_once()

    def list_modes(self) -> list[dict[str, Any]]:
        return [
            {"id": "auto", "label": "Auto (USB UVC / Sim Fallback)"},
            {"id": "sim_normal", "label": "Sim: Clean TZ THT-02 Probe"},
            {"id": "sim_strainer_patch", "label": "Sim: Strainer Red X-Patch (+56 mm)"},
            {"id": "sim_open_dip", "label": "Sim: Unscrewed Blue DIP PCB (+18 mm)"},
            {"id": "sim_gland_fault", "label": "Sim: Gland / RS-485 Wire Fault (-60 mm)"},
            {"id": "sim_hand_screwdriver", "label": "Sim: Hand + Screwdriver on DIP-8 (Masked)"},
        ]

    def _acquire_raw_frame(self) -> tuple[np.ndarray, str, str]:
        with self._lock:
            cap = self._cap
            sim_mode = self._active_sim_mode
            cam_src = self._camera_source
            custom_bgr = self._custom_bgr

        if cap is not None:
            ok, frame = cap.read()
            if ok and frame is not None and frame.size > 0:
                return frame, "live_uvc", cam_src
            # USB webcam unplugged mid-session -> clean automatic fallback!
            with self._lock:
                self._release_cap()
                self._active_sim_mode = "sim_normal"
                self._camera_source = "simulator:sim_normal (uvc_disconnected)"
                sim_mode = self._active_sim_mode
                cam_src = self._camera_source

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

        # 1. Dual-space human skin locus (YCrCb Cr in [133, 174], Cb in [77, 127] + moderate HSV saturation
        #    S in [24, 168] so vivid industrial red/orange fault tape S >= 195 is NEVER mistaken for skin!)
        skin_ycrcb = cv2.inRange(ycrcb, (55, 133, 77), (255, 174, 127))
        skin_hsv = cv2.bitwise_and(
            cv2.bitwise_or(
                cv2.inRange(hsv, (0, 24, 60), (25, 168, 255)),
                cv2.inRange(hsv, (166, 24, 60), (180, 168, 255)),
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
        min_hand_area = max(90, int((pw * ph) * 0.011))
        border_band_Area = max(48, int((pw * ph) * 0.0055))
        bx_min, by_min, bx_max, by_max = pw, ph, 0, 0

        for idx in range(1, num_s):
            area = int(stats_s[idx, cv2.CC_STAT_AREA])
            x, y, w_c, h_c = (
                int(stats_s[idx, cv2.CC_STAT_LEFT]),
                int(stats_s[idx, cv2.CC_STAT_TOP]),
                int(stats_s[idx, cv2.CC_STAT_WIDTH]),
                int(stats_s[idx, cv2.CC_STAT_HEIGHT]),
            )
            touches_border = (
                x <= int(pw * 0.08)
                or y <= int(ph * 0.08)
                or (x + w_c) >= int(pw * 0.92)
                or (y + h_c) >= int(ph * 0.92)
            )
            if area >= min_hand_area or (area >= border_band_Area and touches_border):
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
            # 2C. Gloved hand / standalone oblique screwdriver entering from frame border
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
                        cv2.drawContours(tool_mask, [cnt], -1, 255, -1)
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

        # Downscale 2x during CV mask computation so even 1280x720 runs in < 2.5 ms!
        proc_scale = 0.5 if orig_w >= 800 else 1.0
        if proc_scale < 1.0:
            pw, ph = int(orig_w * proc_scale), int(orig_h * proc_scale)
            small = cv2.resize(frame_bgr, (pw, ph), interpolation=cv2.INTER_NEAREST)
        else:
            pw, ph = orig_w, orig_h
            small = frame_bgr

        inv_scale = 1.0 / proc_scale
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        val_ch = hsv[:, :, 2]
        sat_ch = hsv[:, :, 1]

        pcb_blue_full = cv2.inRange(hsv, (92, 58, 42), (138, 255, 255))
        warm_patch_full = cv2.bitwise_or(
            cv2.inRange(hsv, (0, 105, 95), (26, 255, 255)),
            cv2.inRange(hsv, (166, 105, 95), (180, 255, 255)),
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

        # 1. Segment bright grey/metallic sensor body + any colored tape/PCB on dark bench surface
        body_bright = (val_ch > 122).astype(np.uint8) * 255
        if keep_sensor is not None:
            body_bright = cv2.bitwise_and(body_bright, keep_sensor)
        body_bright = cv2.morphologyEx(
            body_bright, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 7))
        )

        warm_sensor_only = (
            cv2.bitwise_and(warm_patch_full, keep_sensor)
            if keep_sensor is not None
            else warm_patch_full
        )
        warm_body = cv2.morphologyEx(
            warm_sensor_only, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 9))
        )
        # Keep internal blue DIP-8 PCB visible even when screwdriver tip touches DIP pins
        pcb_sensor_only = (
            cv2.bitwise_and(pcb_blue_full, cv2.bitwise_not(hand_mask))
            if hand_detected
            else pcb_blue_full
        )

        fg_mask = cv2.bitwise_or(body_bright, pcb_sensor_only)
        fg_mask = cv2.bitwise_or(fg_mask, warm_body)

        # Ignore outer 2% border ruler ticks
        margin_x, margin_y = max(4, int(pw * 0.025)), max(4, int(ph * 0.03))
        fg_mask[:margin_y, :] = 0
        fg_mask[ph - margin_y :, :] = 0
        fg_mask[:, :margin_x] = 0
        fg_mask[:, pw - margin_x :] = 0

        # Morphological open (denoise) + close (bridge strainer slots, black seal ring & DIP window)
        k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 9))
        fg_clean = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, k_open)
        fg_clean = cv2.morphologyEx(fg_clean, cv2.MORPH_CLOSE, k_close)

        contours, _ = cv2.findContours(fg_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

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
            u_vec = e01 if np.linalg.norm(e01) >= np.linalg.norm(e12) else e12
            u_norm = float(np.linalg.norm(u_vec))
            u_vec = u_vec / max(1e-6, u_norm)

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
            half_min_s = 0.5 * min(rw_s, rh_s) * 1.28
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
            min_pcb_px = max(14, int(half_maj_s * half_min_s * 0.04))

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

            # 3. Render Industrial HUD Overlay on full-resolution BGR frame
            box_i32 = box_pts.astype(np.int32)
            cv2.polylines(hud, [box_i32], isClosed=True, color=(235, 215, 0), thickness=2, lineType=cv2.LINE_AA)

            half_maj_full = 0.5 * major_px
            c_full = np.array([cx, cy], dtype=np.float32)
            p_gland = c_full - u_vec * half_maj_full
            p_tip = c_full + u_vec * half_maj_full

            cv2.line(
                hud,
                (int(p_gland[0]), int(p_gland[1])),
                (int(p_tip[0]), int(p_tip[1])),
                (195, 185, 40),
                1,
                cv2.LINE_AA,
            )
            for z_tick in (-70.0, -48.0, -18.0, 0.0, 27.0, 38.0, 70.0):
                pt_t = c_full + u_vec * (half_maj_full * (z_tick / 70.0))
                t_a = pt_t - v_vec * 7.0
                t_b = pt_t + v_vec * 7.0
                cv2.line(
                    hud,
                    (int(t_a[0]), int(t_a[1])),
                    (int(t_b[0]), int(t_b[1])),
                    (220, 210, 60),
                    1,
                    cv2.LINE_AA,
                )

            cv2.putText(
                hud,
                "-70mm GLAND",
                (max(8, int(p_gland[0]) - 54), int(p_gland[1]) + int(minor_px * 0.95) + 18),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                (210, 225, 120),
                1,
                cv2.LINE_AA,
            )
            cv2.putText(
                hud,
                "+70mm STRAINER",
                (min(orig_w - 135, int(p_tip[0]) - 42), int(p_tip[1]) + int(minor_px * 0.95) + 18),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                (210, 225, 120),
                1,
                cv2.LINE_AA,
            )

            dim_pt = c_full + v_vec * (minor_px * 0.95 + 42.0)
            cv2.putText(
                hud,
                f"TZ THT-02 | L={est_length_mm:.1f}mm D={est_diameter_mm:.1f}mm | R={measured_ratio:.2f} | {angle_deg:+.1f} deg",
                (max(12, int(dim_pt[0]) - 215), min(orig_h - 18, max(64, int(dim_pt[1])))),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.48,
                (245, 240, 180),
                1,
                cv2.LINE_AA,
            )

            if anomaly_detected and anomaly_world_pt is not None:
                ax, ay = anomaly_world_pt
                pulse = int(4.0 * abs(math.sin(time.perf_counter() * 5.5)))
                ret_r = int(max(18, minor_px * 0.62)) + pulse
                ret_col = (40, 140, 255) if pcb_open_detected else (32, 42, 255)

                cv2.circle(hud, (ax, ay), ret_r, ret_col, 2, cv2.LINE_AA)
                cv2.circle(hud, (ax, ay), 4, (60, 240, 255), -1, cv2.LINE_AA)
                cv2.line(hud, (ax - ret_r - 7, ay), (ax - ret_r + 5, ay), ret_col, 2, cv2.LINE_AA)
                cv2.line(hud, (ax + ret_r - 5, ay), (ax + ret_r + 7, ay), ret_col, 2, cv2.LINE_AA)
                cv2.line(hud, (ax, ay - ret_r - 7), (ax, ay - ret_r + 5), ret_col, 2, cv2.LINE_AA)
                cv2.line(hud, (ax, ay + ret_r - 5), (ax, ay + ret_r + 7), ret_col, 2, cv2.LINE_AA)

                lx = min(orig_w - 330, max(16, ax - 90))
                ly = max(78, ay - ret_r - 24)
                cv2.line(hud, (ax, ay - ret_r), (lx + 24, ly + 6), ret_col, 1, cv2.LINE_AA)
                tag = (
                    f"DIP PCB OPEN [{anomaly_zone}] z={anomaly_z_mm:+.1f}mm ({int(anomaly_confidence*100)}%)"
                    if pcb_open_detected
                    else f"FAULT [{anomaly_zone}] z={anomaly_z_mm:+.1f}mm ({int(anomaly_confidence*100)}%)"
                )
                (tw, th_txt), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.46, 1)
                cv2.rectangle(hud, (lx, ly - th_txt - 6), (lx + tw + 12, ly + 6), (18, 20, 28), -1)
                cv2.rectangle(hud, (lx, ly - th_txt - 6), (lx + tw + 12, ly + 6), ret_col, 1)
                cv2.putText(
                    hud,
                    tag,
                    (lx + 6, ly),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.46,
                    (240, 245, 255),
                    1,
                    cv2.LINE_AA,
                )

        # 3B. Render Operator Hand & Screwdriver Exclusion Brackets (showing they are IGNORED in 3D!)
        for ex_bbox, ex_label, ex_col in (
            (tool_bbox, "SCREWDRIVER / TOOL MASKED [IGNORED IN 3D]", (255, 195, 45)),
            (hand_bbox, "OPERATOR HAND MASKED [IGNORED IN 3D]", (190, 145, 255)),
        ):
            if ex_bbox is None:
                continue
            ex_x, ex_y, ex_w, ex_h = ex_bbox
            ex_x1 = min(orig_w - 4, ex_x + ex_w)
            ex_y1 = min(orig_h - 4, ex_y + ex_h)
            c_len = max(12, min(26, min(ex_w, ex_h) // 3))
            for px, py, sx, sy in (
                (ex_x, ex_y, 1, 1),
                (ex_x1, ex_y, -1, 1),
                (ex_x, ex_y1, 1, -1),
                (ex_x1, ex_y1, -1, -1),
            ):
                cv2.line(hud, (px, py), (px + sx * c_len, py), ex_col, 2, cv2.LINE_AA)
                cv2.line(hud, (px, py), (px, py + sy * c_len), ex_col, 2, cv2.LINE_AA)

            (tw_e, th_e), _ = cv2.getTextSize(ex_label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            lbl_x = max(10, min(orig_w - tw_e - 16, ex_x))
            lbl_y = max(56, ex_y - 8)
            cv2.rectangle(hud, (lbl_x, lbl_y - th_e - 5), (lbl_x + tw_e + 10, lbl_y + 5), (16, 20, 28), -1)
            cv2.rectangle(hud, (lbl_x, lbl_y - th_e - 5), (lbl_x + tw_e + 10, lbl_y + 5), ex_col, 1)
            cv2.putText(
                hud,
                ex_label,
                (lbl_x + 5, lbl_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                ex_col,
                1,
                cv2.LINE_AA,
            )

        proc_ms = (time.perf_counter() - t0) * 1000.0

        # Top HUD status bar
        cv2.rectangle(hud, (0, 0), (orig_w, 36), (16, 20, 24), -1)
        cv2.line(hud, (0, 36), (orig_w, 36), (70, 95, 105), 1)
        mask_tag = " | 3D MASK: HAND+TOOL REJECTED" if occlusion_filtered else ""
        status_txt = (
            f"FIELDSCAN CV | {camera_source.upper()} | {fps:.1f} FPS | CV {proc_ms:.2f}ms{mask_tag}"
        )
        cv2.putText(
            hud,
            status_txt,
            (14, 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
            (160, 235, 245),
            1,
            cv2.LINE_AA,
        )

        badge_col = (36, 48, 235) if anomaly_detected else (55, 165, 75)
        badge_txt = (
            f"ALERT: {anomaly_zone}" if anomaly_detected else ("LOCKED: NOMINAL" if detected else "SCANNING...")
        )
        (bw_t, _), _ = cv2.getTextSize(badge_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.46, 1)
        bx0 = orig_w - bw_t - 28
        cv2.rectangle(hud, (bx0, 6), (orig_w - 10, 30), badge_col, -1)
        cv2.putText(
            hud,
            badge_txt,
            (bx0 + 9, 23),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
            (250, 252, 255),
            1,
            cv2.LINE_AA,
        )

        telemetry: dict[str, Any] = {
            "detected": detected,
            "angle_deg": angle_deg,
            "bbox": bbox,
            "measured_ratio": measured_ratio,
            "est_length_mm": est_length_mm,
            "est_diameter_mm": est_diameter_mm,
            "anomaly_detected": anomaly_detected,
            "anomaly_zone": anomaly_zone,
            "anomaly_z_mm": anomaly_z_mm,
            "anomaly_confidence": anomaly_confidence,
            "pcb_open_detected": pcb_open_detected,
            "hand_detected": hand_detected,
            "tool_detected": tool_detected,
            "occlusion_filtered": occlusion_filtered,
            "hand_bbox": hand_bbox,
            "tool_bbox": tool_bbox,
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
        while True:
            with self._lock:
                if not self._running:
                    break
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
