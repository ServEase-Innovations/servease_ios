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

decode_base64_secret() {
  local secret="$1"
  local out="$2"
  local decode_err
  decode_err="$(mktemp)"

  if printf '%s' "${secret}" | tr -d '[:space:]' | base64 -D > "${out}" 2>"${decode_err}"; then
    rm -f "${decode_err}"
    return 0
  fi

  if printf '%s' "${secret}" | tr -d '[:space:]' | base64 -d > "${out}" 2>"${decode_err}"; then
    rm -f "${decode_err}"
    return 0
  fi

  echo "Failed to base64-decode secret ($(wc -c < "${decode_err}" | tr -d ' ') bytes of decoder output)."
  rm -f "${decode_err}"
  exit 1
}

looks_like_pem_cert() {
  local path="$1"
  head -1 "${path}" | grep -q "BEGIN CERTIFICATE"
}

looks_like_pkcs12_der() {
  local path="$1"
  local magic
  magic="$(od -An -tx1 -N1 "${path}" 2>/dev/null | tr -d ' ')"
  [ "${magic}" = "30" ]
}

validate_p12() {
  local path="$1"
  local size
  local openssl_err=""

  size="$(wc -c < "${path}" | tr -d ' ')"
  if [ "${size}" -lt 256 ]; then
    echo "Decoded certificate is too small (${size} bytes). IOS_DIST_CERTIFICATE_BASE64 is likely truncated or invalid."
    echo "Re-encode with: base64 -i YourCert.p12 | tr -d '\\n' | pbcopy  (macOS) and update the GitHub secret."
    exit 1
  fi

  if looks_like_pem_cert "${path}"; then
    echo "Decoded file looks like a PEM .cer, not a PKCS#12 (.p12) bundle."
    echo "In Keychain Access, expand Apple Distribution, select cert + private key, then Export as .p12."
    exit 1
  fi

  if ! looks_like_pkcs12_der "${path}"; then
    echo "Decoded file does not look like a PKCS#12 container (expected DER starting with 0x30)."
    echo "Re-export Apple Distribution as .p12 and re-encode IOS_DIST_CERTIFICATE_BASE64."
    exit 1
  fi

  # Avoid pass:... — passwords with $, ", or \ break in shell and openssl pass: syntax.
  export IOS_DIST_CERTIFICATE_PASSWORD
  if ! openssl_err="$(openssl pkcs12 -in "${path}" -noout -passin env:IOS_DIST_CERTIFICATE_PASSWORD 2>&1)"; then
    echo "PKCS#12 validation failed (openssl could not read the .p12)."
    echo "OpenSSL: ${openssl_err}"
    echo ""
    echo "Fix GitHub secrets:"
    echo "  1. Keychain Access → My Certificates → Apple Distribution (with private key) → Export → .p12"
    echo "  2. Use a simple export password (letters/numbers only) for IOS_DIST_CERTIFICATE_PASSWORD"
    echo "  3. base64 -i YourCert.p12 | tr -d '\\n' | pbcopy  → paste into IOS_DIST_CERTIFICATE_BASE64"
    echo "  4. Verify locally: openssl pkcs12 -in /tmp/test.p12 -noout -passin env:IOS_DIST_CERTIFICATE_PASSWORD"
    exit 1
  fi
}

security create-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"
security set-keychain-settings -lut 21600 "${KEYCHAIN_PATH}"
security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"

decode_base64_secret "${IOS_DIST_CERTIFICATE_BASE64}" "${CERT_PATH}"
validate_p12 "${CERT_PATH}"

security import "${CERT_PATH}" \
  -P "${IOS_DIST_CERTIFICATE_PASSWORD}" \
  -A \
  -f pkcs12 \
  -k "${KEYCHAIN_PATH}" \
  -T /usr/bin/codesign \
  -T /usr/bin/security
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

decode_base64_secret "${IOS_DIST_PROVISIONING_PROFILE_BASE64}" "${PROFILE_PATH}"
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
