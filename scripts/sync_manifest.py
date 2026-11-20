#!/usr/bin/env python3
"""Offline Manual Indexer & Deterministic Resource Manifest Builder for FieldScan CAD.

Generates:
1. `knowledge/manual_index.json` — Verified page-by-page index of `THT02_Users_Manual_v1.1.pdf`
   with SHA-256 hashes, extracted PDF text snippets, reviewed technical excerpts, and image URLs.
2. `knowledge/resource_manifest.json` — SHA-256 manifest of HMI static files, assets, profiles,
   and manual artifacts so Python and iPadOS Swift servers verify exact parity (`OFF-08`, `VIS-10`).
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
from typing import Any

import pymupdf

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
KNOWLEDGE_DIR = PROJECT_ROOT / "knowledge"
ASSETS_DIR = PROJECT_ROOT / "assets"
STATIC_DIR = PROJECT_ROOT / "static"
BUNDLE_RES_DIR = PROJECT_ROOT / "ios" / "FieldScanM4" / "BundleResources"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def build_manual_index() -> dict[str, Any]:
    pdf_path = ASSETS_DIR / "THT02_Users_Manual_v1.1.pdf"
    spec_path = KNOWLEDGE_DIR / "THT02_spec.json"
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    spec_pages = {int(p["page"]): p for p in spec.get("manual_pages", [])}

    pdf_sha = sha256_file(pdf_path)
    pages_out: list[dict[str, Any]] = []

    section_map: dict[int, list[dict[str, str]]] = {
        1: [
            {
                "section_id": "1.1",
                "heading": "Physical Callouts & Probe Anatomy",
                "verified_excerpt": "TZ THT-02 Temperature and humidity Sensor User's Manual V1.1: Stainless steel strainer, Quality probe, Wiring, Mounting holes, Standard 1m lead, Waterproof terminal.",
            }
        ],
        2: [
            {
                "section_id": "2.1",
                "heading": "Product Overview & Features",
                "verified_excerpt": "RS-485 bus Modbus-RTU protocol transmitter integrating SHT30 temperature and SHT3X capacitive humidity sensing with on-board 8-bit DIP address switch.",
            }
        ],
        3: [
            {
                "section_id": "3.1",
                "heading": "Electrical & Sensing Specifications",
                "verified_excerpt": "Supply DC 5~24V (5 mA); RS-485 4800/9600/19200 bps up to 1200 m; Temperature SHT30 -40~125 degC (res 0.1 degC, +/-0.3 degC at 0~60 degC); Humidity SHT3X 5~95 %RH (res 0.1 %RH, +/-2 %RH).",
            }
        ],
        4: [
            {
                "section_id": "4.1",
                "heading": "4-Lead Wiring & RS-485 Common-Mode Grounding",
                "verified_excerpt": "Red = Power V+ (DC 5~24V), Black = Public GND, Yellow = RS-485 A+, Green = RS-485 B-. Bond sensor Black GND and cable shield to RS-232/RS-485 transverter ground.",
            }
        ],
        5: [
            {
                "section_id": "5.1",
                "heading": "8-Bit DIP Switch Address & 2-Step Housing Opening",
                "verified_excerpt": "First Step: unscrew rear waterproof terminal nut. Second Step: unscrew middle barrel seam to access SW1 8-position DIP switch (weights 128, 64, 32, 16, 8, 4, 2, 1; e.g. Pins 1,3,4 ON = 176; Pin 8 ON = 1). Serial frame 8N1.",
            }
        ],
        6: [
            {
                "section_id": "5.2",
                "heading": "RTU Timing & Holding Register Map (0x0000..0x0007)",
                "verified_excerpt": "0x0000 Temperature (0.1 degC signed, 7FFFH = abnormal), 0x0001 Relative Humidity (0.1 %RH, 7FFFH = abnormal), 0x0004 Address Code (R), 0x0005 Baud Rate (R/W), 0x0006 HW Version, 0x0007 SW Version.",
            }
        ],
        7: [
            {
                "section_id": "5.3",
                "heading": "Function Code 0x03 Poll Request & 21-Byte Response",
                "verified_excerpt": "Master read request for Slave 1 registers 0x0000..0x0007: 01 03 00 00 00 08 44 0C. Sensor replies with 21-byte RTU frame including 16 data bytes and trailing little-endian CRC-16.",
            }
        ],
        8: [
            {
                "section_id": "5.4",
                "heading": "Register Decoding Example, Function 0x06 Baud Write & Exceptions",
                "verified_excerpt": "Example: 00FAH = 25.0 degC, 0258H = 60.0 %RH, 2580H = 9600 bps, 000AH = V1.0. Function 0x06 baud write applies only to register 0x0005; abnormal replies set function MSB to 1 (0x83/0x86).",
            }
        ],
        9: [
            {
                "section_id": "6.1",
                "heading": "Exception Codes, CRC-16 (0xA001) & 140x16 mm Dimensions",
                "verified_excerpt": "Exception codes: 01 Illegal Function, 02 Illegal Data Address, 03 Illegal Data Value. CRC-16 init 0xFFFF, right-shift XOR 0xA001. Envelope: 140.0 mm total length x 16.0 mm outer diameter.",
            }
        ],
    }

    with pymupdf.open(pdf_path) as doc:
        page_count = len(doc)
        for idx in range(page_count):
            pnum = idx + 1
            raw_text = " ".join(doc[idx].get_text("text").split())
            png_rel = f"assets/manual_pages/page_{pnum}.png"
            png_path = PROJECT_ROOT / png_rel
            sp_entry = spec_pages.get(pnum, {})
            pages_out.append(
                {
                    "page": pnum,
                    "title": sp_entry.get("title_en") or sp_entry.get("title") or f"Page {pnum}",
                    "image_url": f"/{png_rel}",
                    "image_sha256": sha256_file(png_path) if png_path.is_file() else None,
                    "pdf_embedded_text": raw_text[:400],
                    "highlights": sp_entry.get("highlights", []),
                    "sections": section_map.get(pnum, []),
                }
            )

    manual_index = {
        "schema_version": 1,
        "profile_id": "tzone_tht02",
        "manual_id": "tht02_manual_v1_1",
        "manual_title": spec.get("manual_title", "TZ THT-02 User's Manual V1.1"),
        "visible_revision": "V1.1",
        "header_date_raw": spec.get("manual_header_date", "Mach 18th, 2021"),
        "pdf_url": "/assets/THT02_Users_Manual_v1.1.pdf",
        "pdf_sha256": pdf_sha,
        "page_count": len(pages_out),
        "pages": pages_out,
    }
    out_path = KNOWLEDGE_DIR / "manual_index.json"
    out_path.write_text(json.dumps(manual_index, indent=2) + "\n", encoding="utf-8")
    return manual_index


def build_resource_manifest() -> dict[str, Any]:
    tracked_roots = [
        STATIC_DIR,
        ASSETS_DIR,
        KNOWLEDGE_DIR,
    ]
    files_map: dict[str, dict[str, Any]] = {}
    for root in tracked_roots:
        for fpath in sorted(root.rglob("*")):
            if not fpath.is_file():
                continue
            if fpath.name.startswith("."):
                continue
            rel = fpath.relative_to(PROJECT_ROOT).as_posix()
            if rel == "knowledge/resource_manifest.json":
                continue
            files_map[rel] = {
                "sha256": sha256_file(fpath),
                "size_bytes": fpath.stat().st_size,
            }

    manifest_hash_input = json.dumps(files_map, sort_keys=True).encode("utf-8")
    tree_sha256 = hashlib.sha256(manifest_hash_input).hexdigest()

    manifest = {
        "schema_version": 1,
        "contract_version": "2.1.0",
        "tree_sha256": tree_sha256,
        "file_count": len(files_map),
        "files": files_map,
    }
    out_path = KNOWLEDGE_DIR / "resource_manifest.json"
    out_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return manifest


def sync_bundle_resources() -> None:
    BUNDLE_RES_DIR.mkdir(parents=True, exist_ok=True)
    for folder in ("static", "assets", "knowledge", "src"):
        src_dir = PROJECT_ROOT / folder
        dst_dir = BUNDLE_RES_DIR / folder
        if dst_dir.exists():
            shutil.rmtree(dst_dir)
        shutil.copytree(
            src_dir,
            dst_dir,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store"),
        )


def verify_bundle_parity(manifest: dict[str, Any]) -> list[str]:
    mismatches: list[str] = []
    for rel, meta in manifest.get("files", {}).items():
        cand = BUNDLE_RES_DIR / rel
        if not cand.is_file():
            mismatches.append(f"Missing in BundleResources: {rel}")
            continue
        actual_sha = sha256_file(cand)
        if actual_sha != meta["sha256"]:
            mismatches.append(f"SHA-256 mismatch for {rel}: {actual_sha} != {meta['sha256']}")
    return mismatches


def main() -> int:
    parser = argparse.ArgumentParser(description="Build manual index & resource manifest")
    parser.add_argument("--sync-bundle", action="store_true", help="Sync into ios/FieldScanM4/BundleResources and verify parity")
    parser.add_argument("--verify", action="store_true", help="Verify BundleResources SHA-256 parity against resource_manifest.json")
    args = parser.parse_args()

    idx = build_manual_index()
    manifest = build_resource_manifest()
    print(f"[sync_manifest] Indexed {idx['page_count']} manual pages (PDF sha256={idx['pdf_sha256'][:12]}...)")
    print(f"[sync_manifest] Generated resource_manifest.json ({manifest['file_count']} files, tree_sha256={manifest['tree_sha256'][:12]}...)")

    if args.sync_bundle:
        sync_bundle_resources()
    if args.sync_bundle or args.verify:
        mismatches = verify_bundle_parity(manifest)
        if mismatches:
            for m in mismatches:
                print(f"[ERROR] {m}")
            return 1
        print("[sync_manifest] Verified 100% SHA-256 parity in ios/FieldScanM4/BundleResources.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
