#!/usr/bin/env node
/**
 * After altool upload: wait for App Store Connect processing, then assign the build
 * to a TestFlight beta group and enable tester notifications.
 *
 * Required env:
 *   APPSTORE_ISSUER_ID
 *   APPSTORE_API_KEY_ID
 *   APPSTORE_API_PRIVATE_KEY
 *   IOS_BUNDLE_ID
 *   VERSION_CODE          CFBundleVersion / build number uploaded in this CI run
 *
 * Optional env:
 *   TESTFLIGHT_BETA_GROUP_NAME   default: "Internal Testers"
 *   TESTFLIGHT_POLL_MINUTES      default: 45
 *   TESTFLIGHT_POLL_INTERVAL_SEC default: 60
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API_BASE = "https://api.appstoreconnect.apple.com/v1";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function writeKeyFile() {
  const keyId = required("APPSTORE_API_KEY_ID");
  const raw = required("APPSTORE_API_PRIVATE_KEY");
  const keyDir = path.join(os.homedir(), ".appstoreconnect", "private_keys");
  fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
  const keyPath = path.join(keyDir, `AuthKey_${keyId}.p8`);
  const pem =
    !raw.includes("\n") && raw.includes("\\n")
      ? raw.replace(/\\n/g, "\n")
      : raw.endsWith("\n")
        ? raw
        : `${raw}\n`;
  fs.writeFileSync(keyPath, pem, { mode: 0o600 });
  return keyPath;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeJwt(keyPath, issuerId, keyId) {
  const privateKey = fs.readFileSync(keyPath, "utf8");
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      iss: issuerId,
      exp: now + 1200,
      aud: "appstoreconnect-v1",
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign("sha256", Buffer.from(unsigned), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${unsigned}.${base64Url(signature)}`;
}

async function asc(token, method, route, body) {
  const response = await fetch(`${API_BASE}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const detail = json?.errors?.map((e) => e.detail || e.title).join("; ") || text;
    throw new Error(`ASC ${method} ${route} failed (${response.status}): ${detail}`);
  }
  return json;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAppId(token, bundleId) {
  const res = await asc(
    token,
    "GET",
    `/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=1`
  );
  const app = res?.data?.[0];
  if (!app?.id) {
    throw new Error(`No App Store Connect app found for bundle id ${bundleId}`);
  }
  return app.id;
}

async function findBuild(token, appId, versionCode) {
  const res = await asc(
    token,
    "GET",
    `/builds?filter[app]=${appId}&sort=-uploadedDate&limit=20&include=buildBetaDetail`
  );
  const builds = res?.data || [];
  const match = builds.find((b) => String(b.attributes?.version) === String(versionCode));
  return match || null;
}

async function getBetaGroupId(token, appId, groupName) {
  const res = await asc(
    token,
    "GET",
    `/betaGroups?filter[app]=${appId}&limit=200`
  );
  const groups = res?.data || [];
  const exact = groups.find(
    (g) => String(g.attributes?.name || "").toLowerCase() === groupName.toLowerCase()
  );
  if (exact) return exact.id;
  const partial = groups.find((g) =>
    String(g.attributes?.name || "")
      .toLowerCase()
      .includes(groupName.toLowerCase())
  );
  if (partial) return partial.id;
  const names = groups.map((g) => g.attributes?.name).filter(Boolean).join(", ");
  throw new Error(
    `TestFlight group "${groupName}" not found. Available groups: ${names || "(none)"}`
  );
}

async function assignBuildToGroup(token, groupId, buildId) {
  await asc(token, "POST", `/betaGroups/${groupId}/relationships/builds`, {
    data: [{ type: "builds", id: buildId }],
  });
}

async function enableAutoNotify(token, buildId) {
  const res = await asc(
    token,
    "GET",
    `/builds/${buildId}/buildBetaDetail`
  );
  const detail = res?.data;
  if (!detail?.id) {
    console.log("No buildBetaDetail found; skipping auto-notify patch.");
    return;
  }
  await asc(token, "PATCH", `/buildBetaDetails/${detail.id}`, {
    data: {
      type: "buildBetaDetails",
      id: detail.id,
      attributes: {
        autoNotifyEnabled: true,
      },
    },
  });
}

async function main() {
  const issuerId = required("APPSTORE_ISSUER_ID");
  const keyId = required("APPSTORE_API_KEY_ID");
  const bundleId = required("IOS_BUNDLE_ID");
  const versionCode = required("VERSION_CODE");
  const groupName = process.env.TESTFLIGHT_BETA_GROUP_NAME || "Internal Testers";
  const pollMinutes = Number(process.env.TESTFLIGHT_POLL_MINUTES || 45);
  const pollIntervalSec = Number(process.env.TESTFLIGHT_POLL_INTERVAL_SEC || 60);
  const maxAttempts = Math.max(1, Math.ceil((pollMinutes * 60) / pollIntervalSec));

  const keyPath = writeKeyFile();
  const token = makeJwt(keyPath, issuerId, keyId);
  const appId = await getAppId(token, bundleId);

  console.log(
    `Waiting for build ${versionCode} to finish processing (up to ${pollMinutes} min)...`
  );

  let build = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    build = await findBuild(token, appId, versionCode);
    if (!build) {
      console.log(`Attempt ${attempt}/${maxAttempts}: build not visible yet.`);
    } else {
      const state = build.attributes?.processingState || "UNKNOWN";
      console.log(`Attempt ${attempt}/${maxAttempts}: processingState=${state}`);
      if (state === "VALID") break;
      if (state === "FAILED" || state === "INVALID") {
        throw new Error(`Build processing failed with state ${state}`);
      }
    }
    if (attempt < maxAttempts) {
      await sleep(pollIntervalSec * 1000);
    }
  }

  if (!build || build.attributes?.processingState !== "VALID") {
    throw new Error(
      `Build ${versionCode} did not reach VALID within ${pollMinutes} minutes. ` +
        "Check App Store Connect → TestFlight → Builds. Upload succeeded; Apple may still be processing."
    );
  }

  console.log(`Assigning build ${build.id} to TestFlight group "${groupName}"...`);
  const groupId = await getBetaGroupId(token, appId, groupName);
  await assignBuildToGroup(token, groupId, build.id);
  await enableAutoNotify(token, build.id);

  console.log(
    `TestFlight distribution complete. Apple will email testers in group "${groupName}" ` +
      "(if they have TestFlight notifications enabled)."
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
