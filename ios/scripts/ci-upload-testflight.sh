#!/usr/bin/env bash
# Upload an App Store IPA to TestFlight via App Store Connect API key (xcrun altool).
#
# Required env:
#   APPSTORE_ISSUER_ID
#   APPSTORE_API_KEY_ID
#   APPSTORE_API_PRIVATE_KEY   full .p8 contents (PEM); may use literal \n in GitHub secrets
#
# Optional env:
#   IPA_PATH   default: first argument or ${RUNNER_TEMP}/ipa/Serveaso.ipa
#
set -euo pipefail

IPA_PATH="${1:-${IPA_PATH:-}}"
if [[ -z "${IPA_PATH}" ]]; then
  IPA_PATH="${RUNNER_TEMP:-/tmp}/ipa/Serveaso.ipa"
fi

: "${APPSTORE_ISSUER_ID:?APPSTORE_ISSUER_ID is required}"
: "${APPSTORE_API_KEY_ID:?APPSTORE_API_KEY_ID is required}"
: "${APPSTORE_API_PRIVATE_KEY:?APPSTORE_API_PRIVATE_KEY is required}"

if [[ ! -f "${IPA_PATH}" ]]; then
  echo "IPA not found: ${IPA_PATH}"
  ls -la "$(dirname "${IPA_PATH}")" 2>/dev/null || true
  exit 1
fi

# iTMSTransporter can crash or fail fetching Defaults.properties when TZ contains "/".
export TZ=UTC

KEY_DIR="${HOME}/.appstoreconnect/private_keys"
KEY_PATH="${KEY_DIR}/AuthKey_${APPSTORE_API_KEY_ID}.p8"
mkdir -p "${KEY_DIR}"
chmod 700 "${KEY_DIR}"

# Write PEM; restore newlines if the secret was stored as a single line with \n.
if [[ "${APPSTORE_API_PRIVATE_KEY}" != *$'\n'* ]] && [[ "${APPSTORE_API_PRIVATE_KEY}" == *'\\n'* ]]; then
  printf '%b\n' "${APPSTORE_API_PRIVATE_KEY}" > "${KEY_PATH}"
else
  printf '%s\n' "${APPSTORE_API_PRIVATE_KEY}" > "${KEY_PATH}"
fi
chmod 600 "${KEY_PATH}"

if ! grep -q 'BEGIN PRIVATE KEY' "${KEY_PATH}"; then
  echo "APPSTORE_API_PRIVATE_KEY does not look like a PKCS#8 .p8 file."
  echo "Paste the full AuthKey_<id>.p8 from App Store Connect (including BEGIN/END lines)."
  exit 1
fi

if ! openssl pkey -in "${KEY_PATH}" -noout 2>/dev/null; then
  echo "AuthKey .p8 failed openssl validation — check APPSTORE_API_PRIVATE_KEY formatting."
  exit 1
fi

echo "Uploading ${IPA_PATH} to TestFlight (issuer ${APPSTORE_ISSUER_ID}, key ${APPSTORE_API_KEY_ID})"

echo "--- Transporter connectivity (Defaults.properties) ---"
if ! curl -fsS --max-time 45 -o /dev/null \
  "https://contentdelivery.itunes.apple.com/transporter/Defaults.properties"; then
  echo "Warning: could not download Defaults.properties from Apple CDN (may still succeed on retry)."
fi

preflight_list_apps() {
  xcrun altool --list-apps \
    --apiKey "${APPSTORE_API_KEY_ID}" \
    --apiIssuer "${APPSTORE_ISSUER_ID}" \
    --apiKeyPath "${KEY_PATH}" \
    --output-format xml 2>&1 | head -20 || true
}

upload_once() {
  xcrun altool --upload-app \
    --type ios \
    --file "${IPA_PATH}" \
    --apiKey "${APPSTORE_API_KEY_ID}" \
    --apiIssuer "${APPSTORE_ISSUER_ID}" \
    --apiKeyPath "${KEY_PATH}" \
    --output-format xml
}

echo "--- API key preflight (list-apps) ---"
if ! preflight_list_apps | grep -qi 'application\|bundle\|success\|app'; then
  echo "Warning: list-apps did not return apps — API key, issuer id, or key role may be wrong."
  echo "Ensure the key has App Manager (or Admin) access in App Store Connect."
fi

MAX_ATTEMPTS=5
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  echo "--- Upload attempt ${attempt}/${MAX_ATTEMPTS} ---"
  set +e
  LOG="$(upload_once 2>&1)"
  STATUS=$?
  set -e
  echo "${LOG}"

  if [[ "${STATUS}" -eq 0 ]]; then
    echo "TestFlight upload succeeded."
    exit 0
  fi

  if echo "${LOG}" | grep -qi 'Defaults\.properties'; then
    echo "Transporter could not fetch Defaults.properties (network or Apple CDN). Retrying..."
    sleep $((attempt * 20))
    continue
  fi

  echo "Upload failed (exit ${STATUS})."
  exit "${STATUS}"
done

echo "Upload failed after ${MAX_ATTEMPTS} attempts (Defaults.properties / transporter)."
exit 1
