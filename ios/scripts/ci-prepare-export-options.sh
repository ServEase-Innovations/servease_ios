#!/usr/bin/env bash
set -euo pipefail

IOS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IOS_BUNDLE_ID="${IOS_BUNDLE_ID:-in.serveaseinnovation.serveaso}"

PROFILE_UUID=""
PROFILE_TEAM=""
PROFILE_NAME=""

if [ -f "${IOS_DIR}/.ci-provisioning-profile-uuid" ]; then
  PROFILE_UUID="$(tr -d '[:space:]' < "${IOS_DIR}/.ci-provisioning-profile-uuid")"
fi
if [ -f "${IOS_DIR}/.ci-provisioning-profile-team" ]; then
  PROFILE_TEAM="$(tr -d '[:space:]' < "${IOS_DIR}/.ci-provisioning-profile-team")"
fi
if [ -f "${IOS_DIR}/.ci-provisioning-profile-name" ]; then
  PROFILE_NAME="$(tr -d '\n' < "${IOS_DIR}/.ci-provisioning-profile-name")"
fi

TEAM="${IOS_DEVELOPMENT_TEAM:-${PROFILE_TEAM}}"

if [ -z "${TEAM}" ] || [ -z "${PROFILE_UUID}" ]; then
  echo "Missing team or profile UUID. Run ci-install-signing.sh first."
  exit 1
fi

sed \
  -e "s/__IOS_DEVELOPMENT_TEAM__/${TEAM}/g" \
  -e "s/__IOS_BUNDLE_ID__/${IOS_BUNDLE_ID}/g" \
  -e "s/__IOS_APPSTORE_PROVISIONING_PROFILE_SPECIFIER__/${PROFILE_UUID}/g" \
  "${IOS_DIR}/exportOptions.appstore.plist" > "${IOS_DIR}/exportOptions.ci.plist"

echo "Prepared exportOptions.ci.plist:"
echo "  Team: ${TEAM}"
echo "  Bundle ID: ${IOS_BUNDLE_ID}"
echo "  Profile UUID: ${PROFILE_UUID}"
echo "  Profile name: ${PROFILE_NAME:-unknown}"
