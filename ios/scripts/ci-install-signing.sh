#!/usr/bin/env bash
set -euo pipefail

: "${IOS_DIST_CERTIFICATE_BASE64:?IOS_DIST_CERTIFICATE_BASE64 is required}"
: "${IOS_DIST_CERTIFICATE_PASSWORD:?IOS_DIST_CERTIFICATE_PASSWORD is required}"
: "${IOS_DIST_PROVISIONING_PROFILE_BASE64:?IOS_DIST_PROVISIONING_PROFILE_BASE64 is required}"

KEYCHAIN_PATH="${RUNNER_TEMP}/app-signing.keychain-db"
KEYCHAIN_PASSWORD="$(openssl rand -base64 32)"
CERT_PATH="${RUNNER_TEMP}/distribution.p12"
PROFILE_PATH="${RUNNER_TEMP}/distribution.mobileprovision"

security create-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"
security set-keychain-settings -lut 21600 "${KEYCHAIN_PATH}"
security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"

echo -n "${IOS_DIST_CERTIFICATE_BASE64}" | base64 -D > "${CERT_PATH}"
security import "${CERT_PATH}" \
  -P "${IOS_DIST_CERTIFICATE_PASSWORD}" \
  -A \
  -t cert \
  -f pkcs12 \
  -k "${KEYCHAIN_PATH}"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"
security list-keychain -d user -s "${KEYCHAIN_PATH}"

echo -n "${IOS_DIST_PROVISIONING_PROFILE_BASE64}" | base64 -D > "${PROFILE_PATH}"
PROFILE_UUID="$(
  /usr/libexec/PlistBuddy -c "Print UUID" /dev/stdin <<< "$(security cms -D -i "${PROFILE_PATH}")"
)"
mkdir -p "${HOME}/Library/MobileDevice/Provisioning Profiles"
cp "${PROFILE_PATH}" "${HOME}/Library/MobileDevice/Provisioning Profiles/${PROFILE_UUID}.mobileprovision"

echo "Installed distribution certificate and provisioning profile ${PROFILE_UUID}"
