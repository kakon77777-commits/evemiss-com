#!/usr/bin/env bash
# Build + deploy + verify + notify evemiss.com in one gated step.
#   1. npm run build
#   2. npx wrangler pages deploy dist --project-name evemiss --branch main
#      -- MUST include --branch main. Without it, this lands as a *Preview*
#      deployment (builds/uploads fine but never actually goes live at
#      evemiss.com) - see README "Deployment" for the incident this was
#      first discovered from.
#   3. smoke test          -> confirms the live domain is actually
#      responding before telling anyone it worked
#   4. scripts/notify-beacon.mjs -> tells the Continuous Discovery Beacon
#      (beacon.evemiss.com) this build is real and live. Non-fatal if it
#      fails or BEACON_SUBMIT_TOKEN_EVEMISS isn't set: this site's own
#      deploy must never depend on the Beacon being reachable.
set -euo pipefail

npm run build
npx wrangler pages deploy dist --project-name evemiss --branch main

echo "== smoke test =="
for path in / /sitemap-index.xml; do
  code=$(curl -sL -o /dev/null -w '%{http_code}' "https://evemiss.com$path")
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    echo "FATAL: $path returned HTTP $code"
    exit 1
  fi
  echo "$path -> $code"
done

node scripts/notify-beacon.mjs || echo "[warn] Beacon notification failed - deploy itself succeeded, this is non-fatal"
