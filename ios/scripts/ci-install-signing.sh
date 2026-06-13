#!/usr/bin/env bash
set -euo pipefail

: "${IOS_DIST_CERTIFICATE_BASE64:?IOS_DIST_CERTIFICATE_BASE64 is required}"
: "${IOS_DIST_CERTIFICATE_PASSWORD:?IOS_DIST_CERTIFICATE_PASSWORD is required}"
: "${IOS_DIST_PROVISIONING_PROFILE_BASE64:?IOS_DIST_PROVISIONING_PROFILE_BASE64 is required}"

IOS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

CERT_SHA1="$(security find-identity -v -p codesigning "${KEYCHAIN_PATH}" \
  | grep -E 'Apple Distribution|iPhone Distribution' \
  | head -1 \
  | awk '{print $2}')"
if [ -z "${CERT_SHA1}" ]; then
  echo "No Apple/iPhone Distribution identity found in CI keychain after import."
  security find-identity -v -p codesigning "${KEYCHAIN_PATH}" || true
  exit 1
fi
printf '%s\n' "${CERT_SHA1}" > "${IOS_DIR}/.ci-code-sign-identity-sha1"

if [ -n "${GITHUB_ENV:-}" ]; then
  {
    echo "IOS_KEYCHAIN_PATH=${KEYCHAIN_PATH}"
    echo "IOS_KEYCHAIN_PASSWORD=${KEYCHAIN_PASSWORD}"
    echo "IOS_CODE_SIGN_IDENTITY_SHA1=${CERT_SHA1}"
  } >> "${GITHUB_ENV}"
fi

echo -n "${IOS_DIST_PROVISIONING_PROFILE_BASE64}" | base64 -D > "${PROFILE_PATH}"
PROFILE_PLIST="$(security cms -D -i "${PROFILE_PATH}")"
PROFILE_UUID="$(/usr/libexec/PlistBuddy -c "Print UUID" /dev/stdin <<< "${PROFILE_PLIST}")"
PROFILE_NAME="$(/usr/libexec/PlistBuddy -c "Print Name" /dev/stdin <<< "${PROFILE_PLIST}")"
PROFILE_TEAM="$(/usr/libexec/PlistBuddy -c "Print TeamIdentifier:0" /dev/stdin <<< "${PROFILE_PLIST}")"
PROFILE_APP_ID="$(/usr/libexec/PlistBuddy -c "Print Entitlements:application-identifier" /dev/stdin <<< "${PROFILE_PLIST}")"
EXPECTED_APP_ID="${IOS_BUNDLE_ID:-in.serveaseinnovation.serveaso}"
EXPECTED_APP_ID_PREFIX=".*\\.${EXPECTED_APP_ID}"

if ! [[ "${PROFILE_APP_ID}" =~ ${EXPECTED_APP_ID_PREFIX} ]]; then
  echo "Provisioning profile App ID '${PROFILE_APP_ID}' does not match bundle ID '${EXPECTED_APP_ID}'."
  exit 1
fi

if /usr/libexec/PlistBuddy -c "Print ProvisionedDevices" /dev/stdin <<< "${PROFILE_PLIST}" >/dev/null 2>&1; then
  echo "Expected an App Store Connect profile, but this profile contains ProvisionedDevices (Ad Hoc/Development)."
  exit 1
fi

mkdir -p "${HOME}/Library/MobileDevice/Provisioning Profiles"
cp "${PROFILE_PATH}" "${HOME}/Library/MobileDevice/Provisioning Profiles/${PROFILE_UUID}.mobileprovision"

printf '%s\n' "${PROFILE_UUID}" > "${IOS_DIR}/.ci-provisioning-profile-uuid"
printf '%s\n' "${PROFILE_NAME}" > "${IOS_DIR}/.ci-provisioning-profile-name"
printf '%s\n' "${PROFILE_TEAM}" > "${IOS_DIR}/.ci-provisioning-profile-team"

echo "Installed distribution certificate and provisioning profile:"
echo "  UUID: ${PROFILE_UUID}"
echo "  Name: ${PROFILE_NAME}"
echo "  Team: ${PROFILE_TEAM}"
echo "  App ID: ${PROFILE_APP_ID}"
