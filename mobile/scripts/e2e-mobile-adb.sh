#!/usr/bin/env bash
# ==============================================================================
# Belooga Mobile E2E Automation & Live Android Emulator Verification Suite
#
# Executes:
#   1. Starts RN 0.88.0 Metro/Bundle Server & verifies packager-status:running
#   2. Runs build-apk.sh (purging old APKs -> building signed v1.0.0 APK)
#   3. Installs APK onto running Android Emulator via adb install -r
#   4. Launches com.belooga.mobile/.MainActivity and runs UIAutomator2 E2E taps
#      across Discover -> Pitch Studio -> Job Tracker -> Workspace tabs
#   5. Captures PNG visual evidence & asserts 0 FATAL EXCEPTION crashes in logcat
# ==============================================================================
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

ARTIFACTS_DIR="$MOBILE_DIR/artifacts"
mkdir -p "$ARTIFACTS_DIR"

# 1. Start RN 0.88.0 Dev Server and verify /status
echo "[Mobile E2E 1/6] Starting React Native 0.88.0 Bundle Server on port 8081..."
bun run scripts/start-mobile.ts >/tmp/belooga_mobile_server.log 2>&1 &
MOBILE_SERVER_PID=$!
cleanup() {
    kill "$MOBILE_SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1
PACKAGER_STATUS="$(curl -sf http://localhost:8081/status || true)"
if [ "$PACKAGER_STATUS" != "packager-status:running" ]; then
    echo "ERROR: Mobile dev server failed to report packager-status:running (got: '$PACKAGER_STATUS')"
    exit 1
fi
echo "  ✓ Mobile Dev Server active ($PACKAGER_STATUS)."

# 2. Clean old APKs and build fresh signed APK
echo "[Mobile E2E 2/6] Building clean APK (purging old APK versions first)..."
bash "$MOBILE_DIR/scripts/build-apk.sh"
APK_PATH="$MOBILE_DIR/dist/belooga-mobile-v1.0.0.apk"

# 3. Verify Android Emulator connection & install APK
echo "[Mobile E2E 3/6] Installing APK onto Android Emulator..."
if ! adb get-state >/dev/null 2>&1; then
    echo "ERROR: No running Android Emulator detected via adb!"
    exit 1
fi
adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
adb reverse tcp:8000 tcp:8000 >/dev/null 2>&1 || true
adb install -r "$APK_PATH" >/dev/null
echo "  ✓ Installed $APK_PATH on $(adb devices | awk 'NR==2{print $1}')."

# 4. Launch MainActivity & helper for UIAutomator2 hierarchy inspection
echo "[Mobile E2E 4/6] Launching com.belooga.mobile/.MainActivity..."
adb logcat -c
adb shell am force-stop com.belooga.mobile
adb shell am start -W -n com.belooga.mobile/.MainActivity >/dev/null
sleep 1

dump_and_assert() {
    local expected_desc="$1"
    adb shell uiautomator dump /sdcard/belooga_ui.xml >/dev/null
    adb pull /sdcard/belooga_ui.xml "$ARTIFACTS_DIR/belooga_ui.xml" >/dev/null
    if ! grep -Fq "$expected_desc" "$ARTIFACTS_DIR/belooga_ui.xml"; then
        echo "ERROR: Expected UI node '$expected_desc' not found in live Android hierarchy!"
        exit 1
    fi
    echo "  ✓ Verified live Android View node: '$expected_desc'"
}

tap_by_content_desc() {
    local target_desc="$1"
    local coords
    coords=$(python3 - "$ARTIFACTS_DIR/belooga_ui.xml" "$target_desc" << 'EOF'
import re, sys, xml.etree.ElementTree as ET
tree = ET.parse(sys.argv[1])
target = sys.argv[2]
for node in tree.iter("node"):
    if node.attrib.get("content-desc") == target or node.attrib.get("text") == target:
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.attrib.get("bounds", ""))
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            print(f"{(x1 + x2) // 2} {(y1 + y2) // 2}")
            sys.exit(0)
sys.exit(1)
EOF
)
    echo "  → Tapping '$target_desc' at ($coords)..."
    adb shell input tap $coords
    sleep 1
}

# 5. Execute E2E Interactive Flow across all 4 Mobile Tabs
echo "[Mobile E2E 5/6] Executing UIAutomator2 E2E assertions across all 4 tabs..."

# Tab 1: Discover Feed
dump_and_assert "mobile-discovery-heading"
dump_and_assert "mobile-candidate-card-alexnguyen"
adb exec-out screencap -p > "$ARTIFACTS_DIR/e2e-01-discover.png"

# Tab 2: Pitch Studio & Chunk Upload
tap_by_content_desc "mobile-tab-studio"
dump_and_assert "mobile-studio-title"
tap_by_content_desc "mobile-studio-upload-chunks"
dump_and_assert "100% (3/3 Chunks Assembled)"
adb exec-out screencap -p > "$ARTIFACTS_DIR/e2e-02-studio.png"

# Tab 3: Job Kanban Tracker & Status Mutation
tap_by_content_desc "mobile-tab-tracker"
dump_and_assert "mobile-tracker-title"
tap_by_content_desc "mobile-tracker-move-job_101-INTERVIEW"
dump_and_assert "[INTERVIEW] (Synced)"
adb exec-out screencap -p > "$ARTIFACTS_DIR/e2e-03-tracker.png"

# Tab 4: Candidate Workspace
tap_by_content_desc "mobile-tab-profile"
dump_and_assert "mobile-workspace-heading"
dump_and_assert "@alexnguyen"
adb exec-out screencap -p > "$ARTIFACTS_DIR/e2e-04-workspace.png"

# 6. Verify Zero Native Crashes in Logcat
echo "[Mobile E2E 6/6] Auditing Android logcat for runtime exceptions..."
if adb logcat -d | grep -F "AndroidRuntime: FATAL EXCEPTION" | grep -q "com.belooga.mobile"; then
    echo "ERROR: Crash detected in com.belooga.mobile!"
    exit 1
fi
echo "  ✓ Zero runtime crashes in logcat. Screenshots saved to mobile/artifacts/."
echo "=============================================================================="
echo "  ✓ MOBILE ANDROID E2E AUTOMATION SUITE PASSED (4 Tabs + Chunk Upload + Kanban)"
echo "=============================================================================="
