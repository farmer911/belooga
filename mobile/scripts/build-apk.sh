#!/usr/bin/env bash
# Local release APK build: expo prebuild -> gradle assembleRelease -> apksigner verify.
# For store builds use EAS instead:  bunx eas build -p android --profile production
#
# Requires: ANDROID_HOME (SDK + build-tools), JDK 17+, EXPO_PUBLIC_API_URL (the app refuses
# to start without it in release builds).
# Note: Expo's generated android/ project signs release builds with the debug keystore. That
# APK is fine for QA / E2E, not for distribution.
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

: "${ANDROID_HOME:?ANDROID_HOME must point at the Android SDK}"
: "${EXPO_PUBLIC_API_URL:?EXPO_PUBLIC_API_URL must be set for release builds}"

BUILD_TOOLS="$(ls -d "$ANDROID_HOME"/build-tools/* 2>/dev/null | sort -V | tail -1)"
if [ -z "$BUILD_TOOLS" ] || [ ! -x "$BUILD_TOOLS/apksigner" ]; then
    echo "ERROR: apksigner not found under $ANDROID_HOME/build-tools" >&2
    exit 1
fi

APP_VERSION="$(node -p 'require("./app.json").expo.version')"
DIST_DIR="$MOBILE_DIR/dist"
FINAL_APK="$DIST_DIR/belooga-mobile-v${APP_VERSION}.apk"

echo "[1/4] Purging previous APKs..."
mkdir -p "$DIST_DIR"
find "$DIST_DIR" -maxdepth 1 \( -name "*.apk" -o -name "*.idsig" \) -type f -delete

echo "[2/4] Generating native Android project (expo prebuild)..."
bunx expo prebuild --platform android --clean --no-install

echo "[3/4] Building release APK with Gradle..."
(cd android && ./gradlew --no-daemon assembleRelease)
cp android/app/build/outputs/apk/release/app-release.apk "$FINAL_APK"

echo "[4/4] Verifying APK signature..."
"$BUILD_TOOLS/apksigner" verify --verbose "$FINAL_APK" | grep -E "Verified using"

echo "APK ready: $FINAL_APK ($(wc -c < "$FINAL_APK" | tr -d ' ') bytes)"
