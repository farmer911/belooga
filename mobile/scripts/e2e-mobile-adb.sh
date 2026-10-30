#!/usr/bin/env bash
# Android E2E: build a release APK, install it on the connected emulator/device, run the
# Maestro flow, and fail on any native crash in logcat.
#
# Requires: adb with one device attached, Maestro CLI (https://maestro.mobile.dev),
# E2E_EMAIL / E2E_PASSWORD for a seeded test account,
# everything build-apk.sh needs, and a backend reachable at EXPO_PUBLIC_API_URL
# (e.g. http://10.0.2.2:8080 for the emulator).
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

adb get-state >/dev/null 2>&1 || { echo "ERROR: no Android device/emulator attached" >&2; exit 1; }
command -v maestro >/dev/null 2>&1 || { echo "ERROR: maestro CLI not installed" >&2; exit 1; }
: "${E2E_EMAIL:?E2E_EMAIL (seeded test account) is required}"
: "${E2E_PASSWORD:?E2E_PASSWORD is required}"

bash "$MOBILE_DIR/scripts/build-apk.sh"
APK_PATH="$(ls "$MOBILE_DIR"/dist/belooga-mobile-v*.apk)"

adb uninstall com.belooga.mobile >/dev/null 2>&1 || true
adb install -r "$APK_PATH" >/dev/null
adb logcat -c

mkdir -p "$MOBILE_DIR/artifacts"
maestro test --debug-output "$MOBILE_DIR/artifacts" \
    -e E2E_EMAIL="$E2E_EMAIL" -e E2E_PASSWORD="$E2E_PASSWORD" \
    "$MOBILE_DIR/e2e/maestro-flow.yaml"

if adb logcat -d | grep -F "AndroidRuntime: FATAL EXCEPTION" | grep -q "com.belooga.mobile"; then
    echo "ERROR: crash detected in com.belooga.mobile" >&2
    exit 1
fi
echo "Mobile E2E passed."
