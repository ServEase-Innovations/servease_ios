#!/usr/bin/env bash
# Wait for ASC processing and distribute the uploaded build to a TestFlight group.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT_DIR}"

: "${APPSTORE_ISSUER_ID:?APPSTORE_ISSUER_ID is required}"
: "${APPSTORE_API_KEY_ID:?APPSTORE_API_KEY_ID is required}"
: "${APPSTORE_API_PRIVATE_KEY:?APPSTORE_API_PRIVATE_KEY is required}"
: "${IOS_BUNDLE_ID:?IOS_BUNDLE_ID is required}"
: "${VERSION_CODE:?VERSION_CODE is required}"

node ios/scripts/ci-distribute-testflight.mjs
