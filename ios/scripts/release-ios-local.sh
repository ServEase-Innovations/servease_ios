#!/usr/bin/env bash
# Run the iOS release pipeline locally before GitHub Actions.
#
# Usage:
#   ./ios/scripts/release-ios-local.sh validate
#     Compile Release for iOS Simulator (no certs/secrets). Catches fmt, Auth0, etc.
#
#   ./ios/scripts/release-ios-local.sh archive
#     Same as CI: archive + export IPA. Requires signing (see below).
#
#   ./ios/scripts/release-ios-local.sh upload
#     archive + export + upload to TestFlight (needs App Store Connect API key env vars).
#
# Signing for archive/upload (pick one):
#   1. Copy ios/Signing.local.xcconfig.example → ios/Signing.local.xcconfig and set DEVELOPMENT_TEAM.
#      Use automatic signing in Xcode with a Distribution profile installed locally.
#   2. Or export the same secrets CI uses:
#        IOS_DIST_CERTIFICATE_BASE64, IOS_DIST_CERTIFICATE_PASSWORD,
#        IOS_DIST_PROVISIONING_PROFILE_BASE64, IOS_DEVELOPMENT_TEAM,
#        IOS_APPSTORE_PROVISIONING_PROFILE_NAME
#
# Optional env:
#   VERSION_CODE, VERSION_NAME  (defaults: 999 / 1.0.999-local)
#   SKIP_NPM=1, SKIP_PODS=1     (skip dependency install for faster reruns)
#   IOS_SCHEME, IOS_WORKSPACE, IOS_BUNDLE_ID, BUILD_DIR

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
IOS_DIR="${ROOT_DIR}/ios"
IOS_SCHEME="${IOS_SCHEME:-Serveaso}"
IOS_WORKSPACE="${IOS_WORKSPACE:-ios/Serveaso.xcworkspace}"
IOS_BUNDLE_ID="${IOS_BUNDLE_ID:-in.serveaseinnovation.serveaso}"
BUILD_DIR="${BUILD_DIR:-${ROOT_DIR}/build/local-ios-release}"
ARCHIVE_PATH="${BUILD_DIR}/Serveaso.xcarchive"
EXPORT_PATH="${BUILD_DIR}/ipa"
LOG_PATH="${BUILD_DIR}/xcodebuild.log"

MODE="${1:-validate}"
VERSION_CODE="${VERSION_CODE:-999}"
VERSION_NAME="${VERSION_NAME:-1.0.999-local}"

usage() {
  sed -n '3,22p' "$0" | sed 's/^# \?//'
  exit "${2:-0}"
}

if [[ "${MODE}" == "-h" || "${MODE}" == "--help" ]]; then
  usage
fi

if [[ "${MODE}" != "validate" && "${MODE}" != "archive" && "${MODE}" != "upload" ]]; then
  echo "Unknown mode: ${MODE}"
  usage "" 1
fi

cd "${ROOT_DIR}"

echo "=== Mode: ${MODE} ==="
echo "=== Xcode: $(xcodebuild -version | head -1) ==="
xcodebuild -showsdks | grep -E 'iphoneos|iphonesimulator' || true

if [[ "${SKIP_NPM:-0}" != "1" ]]; then
  echo "=== npm ci ==="
  npm ci
else
  echo "=== skipping npm ci (SKIP_NPM=1) ==="
fi

echo "=== NODE_BINARY → ios/.xcode.env.local ==="
echo "export NODE_BINARY=$(command -v node)" > "${IOS_DIR}/.xcode.env.local"

if [[ "${SKIP_PODS:-0}" != "1" ]]; then
  echo "=== pod install ==="
  (
    export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
    cd "${IOS_DIR}"
    pod install --repo-update
  )
else
  echo "=== skipping pod install (SKIP_PODS=1) ==="
fi

verify_fmt_patch() {
  local fmt_base="${IOS_DIR}/Pods/fmt/include/fmt/base.h"
  if [[ ! -f "${fmt_base}" ]]; then
    echo "fmt/base.h not found — run pod install first."
    exit 1
  fi
  grep -q "Xcode 26 workaround" "${fmt_base}" || {
    echo "fmt/base.h missing Xcode 26 patch (check Podfile post_install)."
    exit 1
  }
  grep -q "#define FMT_USE_CONSTEVAL 0" "${fmt_base}" || {
    echo "fmt/base.h does not force FMT_USE_CONSTEVAL=0."
    exit 1
  }
  echo "fmt Xcode 26 patch verified."
}

verify_fmt_patch

mkdir -p "${BUILD_DIR}"

if [[ "${MODE}" == "validate" ]]; then
  echo "=== Release build (Simulator) — compile check, no archive ==="
  set +e
  xcodebuild build \
    -workspace "${IOS_WORKSPACE}" \
    -scheme "${IOS_SCHEME}" \
    -configuration Release \
    -sdk iphonesimulator \
    -destination 'generic/platform=iOS Simulator' \
    2>&1 | tee "${LOG_PATH}"
  status=${PIPESTATUS[0]}
  set -e
  if [[ "${status}" -ne 0 ]]; then
    echo "Build failed (exit ${status}). Log: ${LOG_PATH}"
    grep -En ": error:|: fatal error:" "${LOG_PATH}" | tail -30 || true
    exit "${status}"
  fi
  echo "Validate succeeded — native code compiles. Run 'archive' to test signing/export."
  exit 0
fi

export VERSION_CODE VERSION_NAME IOS_BUNDLE_ID
"${IOS_DIR}/scripts/ci-set-version.sh"

prepare_signing() {
  if [[ -f "${IOS_DIR}/Signing.local.xcconfig" ]]; then
    echo "Using ios/Signing.local.xcconfig for signing."
    return 0
  fi

  if [[ -n "${IOS_DIST_CERTIFICATE_BASE64:-}" ]]; then
    export RUNNER_TEMP="${BUILD_DIR}/signing-temp"
    mkdir -p "${RUNNER_TEMP}"
    echo "Using CI-style signing from environment variables."
    "${IOS_DIR}/scripts/ci-install-signing.sh"
    IOS_DEVELOPMENT_TEAM="${IOS_DEVELOPMENT_TEAM:-}" \
      IOS_APPSTORE_PROVISIONING_PROFILE_NAME="${IOS_APPSTORE_PROVISIONING_PROFILE_NAME:-}" \
      "${IOS_DIR}/scripts/ci-set-signing.sh"
    return 0
  fi

  cat <<EOF
No signing configuration found.

For local archive/upload, either:
  cp ios/Signing.local.xcconfig.example ios/Signing.local.xcconfig
  # edit DEVELOPMENT_TEAM, install Distribution cert + App Store profile in Keychain

Or export CI secrets (IOS_DIST_CERTIFICATE_BASE64, etc.) and re-run.

To only verify compilation, run: $0 validate
EOF
  exit 1
}

prepare_signing

prepare_export_plist() {
  local team="${IOS_DEVELOPMENT_TEAM:-}"
  local profile_spec=""

  if [[ -f "${IOS_DIR}/.ci-provisioning-profile-uuid" ]]; then
    profile_spec="$(tr -d '[:space:]' < "${IOS_DIR}/.ci-provisioning-profile-uuid")"
  fi
  if [[ -z "${profile_spec}" ]]; then
    profile_spec="${IOS_APPSTORE_PROVISIONING_PROFILE_NAME:-}"
  fi
  if [[ -z "${profile_spec}" && -f "${IOS_DIR}/.ci-provisioning-profile-name" ]]; then
    profile_spec="$(tr -d '\n' < "${IOS_DIR}/.ci-provisioning-profile-name")"
  fi

  if [[ -z "${team}" && -f "${IOS_DIR}/Signing.local.xcconfig" ]]; then
    team="$(grep DEVELOPMENT_TEAM "${IOS_DIR}/Signing.local.xcconfig" | sed 's/.*= *//')"
  fi
  if [[ -z "${team}" && -f "${IOS_DIR}/.ci-provisioning-profile-team" ]]; then
    team="$(tr -d '[:space:]' < "${IOS_DIR}/.ci-provisioning-profile-team")"
  fi

  if [[ -z "${team}" || -z "${profile_spec}" ]]; then
    echo "Set IOS_DEVELOPMENT_TEAM and install signing assets (or IOS_APPSTORE_PROVISIONING_PROFILE_NAME) for export."
    exit 1
  fi

  sed \
    -e "s/__IOS_DEVELOPMENT_TEAM__/${team}/g" \
    -e "s/__IOS_BUNDLE_ID__/${IOS_BUNDLE_ID}/g" \
    -e "s/__IOS_APPSTORE_PROVISIONING_PROFILE_SPECIFIER__/${profile_spec}/g" \
    "${IOS_DIR}/exportOptions.appstore.plist" > "${BUILD_DIR}/exportOptions.plist"
}

unlock_ci_keychain() {
  if [[ -n "${IOS_KEYCHAIN_PATH:-}" && -n "${IOS_KEYCHAIN_PASSWORD:-}" ]]; then
    security unlock-keychain -p "${IOS_KEYCHAIN_PASSWORD}" "${IOS_KEYCHAIN_PATH}"
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${IOS_KEYCHAIN_PASSWORD}" "${IOS_KEYCHAIN_PATH}" || true
    export OTHER_CODE_SIGN_FLAGS="--keychain ${IOS_KEYCHAIN_PATH}"
  fi
}

echo "=== xcodebuild archive ==="
unlock_ci_keychain
set +e
xcodebuild archive \
  -workspace "${IOS_WORKSPACE}" \
  -scheme "${IOS_SCHEME}" \
  -configuration Release \
  -sdk iphoneos \
  -archivePath "${ARCHIVE_PATH}" \
  2>&1 | tee "${LOG_PATH}"
status=${PIPESTATUS[0]}
set -e

if [[ "${status}" -ne 0 ]]; then
  echo "Archive failed (exit ${status}). Log: ${LOG_PATH}"
  grep -En ": error:|: fatal error:" "${LOG_PATH}" | tail -40 || true
  exit "${status}"
fi

echo "=== xcodebuild -exportArchive ==="
prepare_export_plist
mkdir -p "${EXPORT_PATH}"
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${BUILD_DIR}/exportOptions.plist"

echo "IPA: ${EXPORT_PATH}/Serveaso.ipa"
ls -la "${EXPORT_PATH}"

if [[ "${MODE}" == "archive" ]]; then
  echo "Archive + export succeeded."
  exit 0
fi

: "${APPSTORE_ISSUER_ID:?APPSTORE_ISSUER_ID is required for upload}"
: "${APPSTORE_API_KEY_ID:?APPSTORE_API_KEY_ID is required for upload}"
: "${APPSTORE_API_PRIVATE_KEY:?APPSTORE_API_PRIVATE_KEY is required for upload}"

API_KEY_PATH="${BUILD_DIR}/AuthKey.p8"
printf '%s\n' "${APPSTORE_API_PRIVATE_KEY}" > "${API_KEY_PATH}"

echo "=== Upload to TestFlight (xcrun altool) ==="
xcrun altool --upload-app \
  --type ios \
  --file "${EXPORT_PATH}/Serveaso.ipa" \
  --apiKey "${APPSTORE_API_KEY_ID}" \
  --apiIssuer "${APPSTORE_ISSUER_ID}" \
  --apiKeyPath "${API_KEY_PATH}"

echo "Upload submitted."
