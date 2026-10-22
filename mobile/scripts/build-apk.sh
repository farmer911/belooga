#!/usr/bin/env bash
# ==============================================================================
# Belooga Mobile Clean-First Android APK Builder (React Native 0.88.0 / SDK 36)
#
# Invariant:
#   1. ALWAYS deletes all previous *.apk and *.idsig files before building.
#   2. Bundles React Native 0.88.0 JS entry into assets/index.android.bundle.
#   3. Compiles, DEXes, zipaligns, and signs the APK via Android SDK 36.1.0.
#   4. Verifies signature integrity with apksigner verify and asserts single APK.
# ==============================================================================
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

ANDROID_SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BUILD_TOOLS="$ANDROID_SDK/build-tools/36.1.0"
PLATFORM_JAR="$ANDROID_SDK/platforms/android-36/android.jar"

if [ ! -d "$BUILD_TOOLS" ] || [ ! -f "$PLATFORM_JAR" ]; then
    echo "ERROR: Android SDK 36 / Build-Tools 36.1.0 not found at $ANDROID_SDK"
    exit 1
fi

APP_VERSION="$(bun -e 'console.log(require("./package.json").version)')"
RN_VERSION="$(bun -e 'console.log(require("./package.json").dependencies["react-native"])')"
DIST_DIR="$MOBILE_DIR/dist"
OUT_APK_DIR="$MOBILE_DIR/android/app/build/outputs/apk/debug"
BUILD_WORK="$MOBILE_DIR/android/app/build/intermediaries"
FINAL_APK="$DIST_DIR/belooga-mobile-v${APP_VERSION}.apk"
DEBUG_APK="$OUT_APK_DIR/app-debug.apk"

echo "=============================================================================="
echo "  BELOOGA MOBILE APK BUILDER (React Native ${RN_VERSION} | App v${APP_VERSION})"
echo "=============================================================================="

# 1. MANDATORY OLD APK PURGE
echo "[1/5] Purging old APK versions from dist/ and android/app/build/outputs/apk/..."
mkdir -p "$DIST_DIR" "$OUT_APK_DIR" "$BUILD_WORK"
OLD_APK_COUNT=$(find "$DIST_DIR" "$MOBILE_DIR/android/app/build" -name "*.apk" 2>/dev/null | wc -l | tr -d ' ')
find "$DIST_DIR" "$MOBILE_DIR/android/app/build" \( -name "*.apk" -o -name "*.idsig" \) -type f -delete 2>/dev/null || true
rm -rf "$BUILD_WORK" && mkdir -p "$BUILD_WORK/gen" "$BUILD_WORK/obj" "$BUILD_WORK/dex" "$MOBILE_DIR/android/app/src/main/assets"
echo "  ✓ Cleared ${OLD_APK_COUNT} previous APK artifact(s). Zero stale APKs remain."

# 2. BUNDLE REACT NATIVE 0.88.0 JS APPLICATION
echo "[2/5] Bundling React Native ${RN_VERSION} TypeScript application..."
bun build "$MOBILE_DIR/index.tsx" \
    --outfile "$MOBILE_DIR/android/app/src/main/assets/index.android.bundle" \
    --target browser >/dev/null
BUNDLE_SIZE=$(wc -c < "$MOBILE_DIR/android/app/src/main/assets/index.android.bundle" | tr -d ' ')
echo "  ✓ Bundled index.android.bundle (${BUNDLE_SIZE} bytes)."

# 3. COMPILE ANDROID RESOURCES & JAVA BYTECODE -> DEX
echo "[3/5] Compiling Android SDK 36 resources (aapt2) & DEX bytecode (d8)..."
"$BUILD_TOOLS/aapt2" compile \
    --dir "$MOBILE_DIR/android/app/src/main/res" \
    -o "$BUILD_WORK/compiled_res.zip"

"$BUILD_TOOLS/aapt2" link \
    -o "$BUILD_WORK/unaligned.apk" \
    -I "$PLATFORM_JAR" \
    --manifest "$MOBILE_DIR/android/app/src/main/AndroidManifest.xml" \
    --java "$BUILD_WORK/gen" \
    -A "$MOBILE_DIR/android/app/src/main/assets" \
    "$BUILD_WORK/compiled_res.zip"

javac --release 11 \
    -cp "$PLATFORM_JAR" \
    -d "$BUILD_WORK/obj" \
    "$BUILD_WORK/gen/com/belooga/mobile/R.java" \
    "$MOBILE_DIR"/android/app/src/main/java/com/belooga/mobile/*.java

CLASS_FILES=$(find "$BUILD_WORK/obj" -name "*.class")
"$BUILD_TOOLS/d8" $CLASS_FILES \
    --lib "$PLATFORM_JAR" \
    --output "$BUILD_WORK/dex"

(cd "$BUILD_WORK/dex" && zip -q "$BUILD_WORK/unaligned.apk" classes.dex)
echo "  ✓ Packaged classes.dex + assets/index.android.bundle into APK container."

# 4. ZIPALIGN & SIGN APK
echo "[4/5] Aligning (zipalign) and signing (apksigner) APK..."
"$BUILD_TOOLS/zipalign" -f -p 4 "$BUILD_WORK/unaligned.apk" "$BUILD_WORK/aligned.apk"

KEYSTORE="$MOBILE_DIR/android/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Belooga Mobile Debug,O=Belooga,C=US" >/dev/null 2>&1
fi

"$BUILD_TOOLS/apksigner" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "$FINAL_APK" \
    "$BUILD_WORK/aligned.apk"

cp "$FINAL_APK" "$DEBUG_APK"

# 5. VERIFY SIGNATURE & SINGLE-APK INVARIANT
echo "[5/5] Verifying APK cryptographic signature and single-version invariant..."
"$BUILD_TOOLS/apksigner" verify --verbose "$FINAL_APK" | grep -E "Verified using"
DIST_APK_COUNT=$(find "$DIST_DIR" -maxdepth 1 -name "*.apk" | wc -l | tr -d ' ')
if [ "$DIST_APK_COUNT" -ne 1 ]; then
    echo "ERROR: Expected exactly 1 APK in dist/, found ${DIST_APK_COUNT}"
    exit 1
fi

APK_BYTES=$(wc -c < "$FINAL_APK" | tr -d ' ')
echo "=============================================================================="
echo "  ✓ APK BUILD SUCCESSFUL: ${FINAL_APK} (${APK_BYTES} bytes)"
echo "=============================================================================="
