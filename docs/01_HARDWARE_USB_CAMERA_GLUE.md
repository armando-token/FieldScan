# 01 — Hardware Glue: Acer 4K UVC USB Camera ↔ Qualcomm Dragonwing IQ-9075 (`IQ9`)

This document captures the **exact physical port mappings and low-latency V4L2/AVFoundation software settings** connecting the **Acer 4K USB Camera (Sony 1/2" CMOS, PDAF, Dual Microphones)** to the **Qualcomm Dragonwing IQ-9075 EVK (Ubuntu ARM64)** so zero minutes are lost during the 2-hour hackathon build window.

---

## 1. Physical USB Topology (Critical on the Dragonwing IQ-9075 EVK)

Per the official **Qualcomm Dragonwing IQ-9075 EVK Hardware Manual (`80-90441-253`)**:
- The main carrier board **does NOT expose full-size rectangular USB-A ports**; instead it provides:
  - **`JUSB0` (USB Type-C)**: USB 3.1 Gen 2 (Dual-Role Host / Device).
  - **`JUSB1` (USB Type-C)**: USB 3.1 Gen 2 (**Dedicated Host Mode — USE THIS PORT PREFERENTIALLY**).
  - **`JUSB2` (Micro-USB)**: USB 2.0 Host.
- **Mandatory Hardware Backpack Checklist**:
  1. A **USB-C Male to Multi-Port USB-A 3.0 Hub** plugged into **`JUSB1`** so both the **Acer 4K UVC Camera** and the **`FT2232HL` Dual-Channel Isolated USB-to-RS485 Converter** run simultaneously at full bandwidth (plus a direct **USB-C to USB-C** spare cable).
  2. Slide open the physical **Privacy Shutter** on top of the Acer 4K camera lens before launching the stack.

---

## 2. 10-Second Kernel Verification on Ubuntu ARM64 Linux

When the Acer 4K camera is plugged into `JUSB1`, the Linux kernel automatically loads `uvcvideo` (video stream) and `snd-usb-audio` (integrated dual noise-canceling microphones) **offline with zero external drivers or internet access**:

```bash
# 1. Verify UVC video device node (/dev/video0)
ls -l /dev/video*

# 2. Ensure current user belongs to the video group (avoids Permission Denied)
id | grep -q video || sudo usermod -aG video $USER

# 3. Confirm the Acer dual digital microphones enumerate in ALSA
arecord -l
```

*(On **macOS / Mac Mini**, `src/fieldscan/vision_scanner.py` automatically detects `Darwin` and opens the camera via Apple's native `cv2.CAP_AVFOUNDATION` backend with zero configuration).*

---

## 3. Exact OpenCV Pipeline Glue (Eliminating 4K USB Uncompressed Lag)

**Classic V4L2 Pitfall**: Opening a 4K UVC camera (`3840×2160`) in Linux OpenCV without explicitly negotiating a compressed four-character code defaults to raw uncompressed `YUYV`, collapsing throughput to **`5 FPS` with `800 ms` of buffered latency**.

**Verified Fix in `src/fieldscan/vision_scanner.py`**:
1. Open the capture handle explicitly with `cv2.CAP_V4L2` on Linux.
2. Force **`FOURCC = 'MJPG'`** **BEFORE** setting width and height.
3. Lock **`1280 × 720` @ `30 FPS`** (`MJPEG`) and **`CAP_PROP_BUFFERSIZE = 1`** (drops stale frames so real-time tracking stays sub-frame responsive):

```python
cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
```

---

## 4. Longitudinal Bench Calibration for the `TZ THT-02` Transmitter

- The physical `Tzone TZ THT-02` probe measures **`140.0 mm` total length × `16.0 mm` outer diameter** (`8.75 : 1` aspect ratio).
- Place the transmitter on a **matte dark surface** (black desk mat, dark gray cardstock, or anodized plate) so the light-gray polycarbonate body achieves clean contour segmentation under venue lighting.
- **Live Fault Demonstrations in Front of Judges**:
  - Apply a **small red or orange tape marker** onto the slotted sintered stainless tip (`strainer_head`) or rear cable gland (`waterproof_gland_leads`), **or unscrew the middle housing barrel** (Manual Page 5, Step 2) to expose the internal **blue `DIP-8` switch PCB**.
- `OpenCV` projects the fault stain or housing separation onto the unified longitudinal coordinate axis `[-70.0 mm, +70.0 mm]` in `< 4 ms/frame`, driving live **red fault stain comparison** on the `60 FPS` `Three.js v0.170` digital twin and triggering the **3-Tier Andon Stack Light (`Red / Amber / Green`)**.
