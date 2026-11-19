#!/usr/bin/env bash
# ==============================================================================
# FieldScan CAD v2.1 — Native iPad Air M4 (12 GB RAM) Build & Deployment Script
# Target Bundle ID: com.fieldscan.tht02.ipadm4
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IOS_DIR="${PROJECT_ROOT}/ios"
APP_SOURCE_DIR="${IOS_DIR}/FieldScanM4"
BUNDLE_RES_DIR="${APP_SOURCE_DIR}/BundleResources"
XCODEPROJ_PATH="${IOS_DIR}/FieldScanM4.xcodeproj"
DERIVED_DATA_DIR="${IOS_DIR}/build"

INSTALL_TO_DEVICE=0
VERIFY_ONLY=0
SIGNED_BUILD=0

for arg in "$@"; do
    case "${arg}" in
        --install)
            INSTALL_TO_DEVICE=1
            SIGNED_BUILD=1
            ;;
        --signed)
            SIGNED_BUILD=1
            ;;
        --unsigned)
            SIGNED_BUILD=0
            ;;
        --verify-only)
            VERIFY_ONLY=1
            ;;
    esac
done

echo "======================================================================"
echo " FieldScan CAD v2.1 — iPad Air M4 (12 GB Unified Memory) Build System"
echo "======================================================================"
echo "[1/5] Generating SHA-256 resource manifest & syncing BundleResources..."

if command -v uv >/dev/null 2>&1; then
    (cd "${PROJECT_ROOT}" && uv run python scripts/sync_manifest.py --sync-bundle --verify)
else
    python3 "${PROJECT_ROOT}/scripts/sync_manifest.py" --sync-bundle --verify
fi

echo "[2/5] Validating Info.plist, Entitlements (12 GB M4 RAM), and Xcode project..."
plutil -lint "${APP_SOURCE_DIR}/Info.plist"
plutil -lint "${APP_SOURCE_DIR}/FieldScanM4.entitlements"
plutil -lint "${XCODEPROJ_PATH}/project.pbxproj"

echo "[3/5] Typechecking & validating Swift bridge & engine sources..."
SWIFT_FILES=(
    "${APP_SOURCE_DIR}/FieldScanRuntimeConfig.swift"
    "${APP_SOURCE_DIR}/ModbusTCPClient.swift"
    "${APP_SOURCE_DIR}/FieldScanSessionEngine.swift"
    "${APP_SOURCE_DIR}/LlamaServerBridge.swift"
    "${APP_SOURCE_DIR}/PythonRuntimeBridge.swift"
    "${APP_SOURCE_DIR}/NativeCameraBridge.swift"
    "${APP_SOURCE_DIR}/StandaloneFieldScanServer.swift"
    "${APP_SOURCE_DIR}/FieldScanWebViewController.swift"
    "${APP_SOURCE_DIR}/SceneDelegate.swift"
    "${APP_SOURCE_DIR}/AppDelegate.swift"
)

if [[ -d "/Applications/Xcode.app/Contents/Developer" ]]; then
    DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer" xcrun --sdk iphoneos swiftc -typecheck -target arm64-apple-ios17.0 "${SWIFT_FILES[@]}"
else
    xcrun swiftc -typecheck "${SWIFT_FILES[@]}"
fi
echo "  + Swift typecheck & AST verification passed for all ${#SWIFT_FILES[@]} files."

echo "[4/5] Probing connected iPad Air M4 over USB-C..."
if ioreg -p IOUSB -w0 -l 2>/dev/null | grep -qi "iPad"; then
    echo "  + Physical iPad detected on USB bus via ioreg."
fi
if arp -a 2>/dev/null | grep -q "169.254."; then
    echo "  + Active USB-C link-local peer detected in ARP table:"
    arp -a | grep "169.254." || true
fi

DEV_DIR="$(xcode-select -p 2>/dev/null || true)"
echo "[5/5] Active Developer Toolchain: ${DEV_DIR}"

if [[ -d "/Applications/Xcode.app/Contents/Developer" ]] && xcodebuild -version >/dev/null 2>&1; then
    echo "  + Full Xcode.app detected. Building FieldScanM4.app for arm64-apple-ios..."
    if [[ "${VERIFY_ONLY}" -eq 0 ]]; then
        if [[ "${SIGNED_BUILD}" -eq 1 ]]; then
            DEST_UDID="$(xcodebuild -project "${XCODEPROJ_PATH}" -scheme FieldScanM4 -showdestinations 2>/dev/null | awk -F'id:' '/platform:iOS,/ && !/placeholder/ {split($2,a,","); gsub(/^[ \t]+|[ \t]+$/,"",a[1]); print a[1]; exit}')"
            DEST_ARG="generic/platform=iOS"
            if [[ -n "${DEST_UDID}" ]]; then
                DEST_ARG="id=${DEST_UDID}"
            fi
            xcodebuild \
                -project "${XCODEPROJ_PATH}" \
                -scheme "FieldScanM4" \
                -destination "${DEST_ARG}" \
                -configuration Release \
                -derivedDataPath "${DERIVED_DATA_DIR}" \
                -allowProvisioningUpdates \
                build
        else
            xcodebuild \
                -project "${XCODEPROJ_PATH}" \
                -scheme "FieldScanM4" \
                -sdk iphoneos \
                -configuration Release \
                -derivedDataPath "${DERIVED_DATA_DIR}" \
                CODE_SIGNING_ALLOWED=NO \
                build
        fi

        BUILT_APP="${DERIVED_DATA_DIR}/Build/Products/Release-iphoneos/FieldScanM4.app"
        echo "  + Built native bundle: ${BUILT_APP}"

        if [[ "${INSTALL_TO_DEVICE}" -eq 1 ]]; then
            echo "  + Installing FieldScanM4.app onto connected iPad Air M4 via devicectl..."
            DEVICE_ID="$(xcrun devicectl list devices 2>/dev/null | awk '/physical/ && /connected|available/ {for(i=1;i<=NF;i++) if ($i ~ /^[0-9A-Fa-f-]{20,40}$/) {print $i; exit}}')"
            if [[ -n "${DEVICE_ID}" ]]; then
                xcrun devicectl device install app --device "${DEVICE_ID}" "${BUILT_APP}"
                echo "  + Installed FieldScanM4.app onto device ${DEVICE_ID}."
                xcrun devicectl device process launch --device "${DEVICE_ID}" com.fieldscan.tht02.ipadm4 || true
            else
                echo "  ! Note: Pair iPad in Xcode Devices window to enable signed devicectl install."
            fi
        fi
    fi
else
    echo "  + CommandLineTools active on Mac Mini (/Applications/Xcode.app not currently mounted)."
    echo "  + All Swift sources, 12 GB Entitlements, Info.plist, and BundleResources are verified and ready."
fi

echo "======================================================================"
echo " FieldScanM4 iPad Air M4 (12 GB) Build & Verification Complete"
echo "======================================================================"
