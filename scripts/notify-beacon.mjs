// Notify the Continuous Discovery Beacon after a verified deploy.
//
// Run AFTER deploy.sh's own smoke test confirms the live site is actually
// responding — never notify about a deploy that isn't confirmed live.
//
// Missing BEACON_SUBMIT_TOKEN_EVEMISS is not an error — it means the
// integration isn't configured locally yet, matching the Beacon's own
// IndexNow adapter, which reports 'skipped' rather than failing when it has
// nothing to work with.
//
// Usage: node scripts/notify-beacon.mjs
import { execSync } from "node:child_process";

const BEACON_URL = "https://beacon.evemiss.com/api/v1/events";
const SITE_ID = "evemiss_com";
const SITE_URL = "https://evemiss.com/";

async function main() {
  const token = process.env.BEACON_SUBMIT_TOKEN_EVEMISS;
  if (!token) {
    console.log("[skipped] BEACON_SUBMIT_TOKEN_EVEMISS not set - not notifying the Beacon.");
    return 0;
  }

  const commit = execSync("git rev-parse HEAD").toString().trim();
  const payload = {
    site_id: SITE_ID,
    url: SITE_URL,
    event_type: "updated",
    content_hash: `git-${commit}`,
    title: "EveMiss Technology",
    summary: `Verified deploy at commit ${commit}`,
    auto_dispatch: true,
  };

  let response;
  try {
    response = await fetch(BEACON_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Explicit User-Agent required: Cloudflare's bot protection in front
        // of beacon.evemiss.com blocks generic/default fetch signatures with
        // a 403 (Cloudflare error 1010) before the request reaches the app.
        "User-Agent": "evemiss-com-deploy-notify/1.0",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[FAILED] Could not reach Beacon: ${err.message}`);
    return 1;
  }

  const body = await response.text();
  if (response.ok) {
    console.log(`[ok] Beacon notified: ${response.status} ${body.slice(0, 200)}`);
    return 0;
  }
  console.error(`[FAILED] Beacon returned ${response.status}: ${body}`);
  return 1;
}

main().then((code) => process.exit(code));
