# -*- coding: utf-8 -*-
"""Point every retired per-language subdomain at the current evemiss.com.

    python legacy-subdomain-redirects/sync_redirects.py            # report only
    python legacy-subdomain-redirects/sync_redirects.py --deploy   # fix what is stale

Why this is a script and not a list
-----------------------------------
The 2026-07-19 pass worked from a list typed into README.md. The list said
"~19 projects" and named 18. There were actually 38 language subdomains, so 20
of them — including all 11 that had been attached to the evemisslab.com zone
rather than evemiss.com — kept serving the retired standalone site for months.
Nothing was wrong with the redirect worker; the enumeration was wrong.

So this reads the project list from Cloudflare every run. A subdomain created
next month is picked up without anyone remembering to add it here.

It also never trusts a deploy's own success message. Cloudflare reports success
for a deploy that lands somewhere the public URL does not serve from, so the
only evidence that counts is what the hostname returns afterwards.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
TARGET = "https://evemiss.com"

# `│ project │ a.pages.dev, xx.evemiss.com │ ... │`
ROW = re.compile(r"^\s*│\s*([a-z0-9-]+)\s*│\s*([^│]+)│", re.M)
# Two-letter label only: excludes directory.evemiss.com, www., and the apexes.
HOST = re.compile(r"\b([a-z]{2})\.(evemiss|evemisslab)\.com\b")


def resolve(program):
    """Windows ships npx as npx.cmd, which CreateProcess will not find by bare
    name. shutil.which knows about PATHEXT, so ask it rather than assuming."""
    found = shutil.which(program)
    if not found:
        raise SystemExit(f"{program} is not on PATH")
    return found


def run(args, **kw):
    # encoding must be explicit. text=True decodes with the locale codec, which
    # on a zh-TW Windows host is cp950, and wrangler's table is drawn with UTF-8
    # box characters — the reader thread dies and stdout comes back None.
    return subprocess.run([resolve(args[0]), *args[1:]], capture_output=True,
                          text=True, encoding="utf-8", errors="replace",
                          cwd=str(REPO), **kw)


def scan():
    out = run(["npx", "wrangler", "pages", "project", "list"], timeout=180).stdout
    seen, found = set(), []
    for project, domains in ROW.findall(out):
        for lang, apex in HOST.findall(domains):
            host = f"{lang}.{apex}.com"
            if host not in seen:
                seen.add(host)
                found.append({"project": project, "lang": lang,
                              "host": host, "apex": f"{apex}.com"})
    if not found:
        raise SystemExit("scanned zero language subdomains; refusing to continue "
                         "(wrangler output shape may have changed)")
    return sorted(found, key=lambda f: (f["apex"], f["lang"]))


def probe(host):
    """REDIRECT if the hostname 301s to evemiss.com; otherwise what it does."""
    out = run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}|%{redirect_url}",
               "--max-time", "20", f"https://{host}/"], timeout=40).stdout
    code, _, dest = out.partition("|")
    if code == "301" and dest.rstrip("/") == TARGET:
        return "REDIRECT"
    return f"SERVING({code})" if code == "200" else f"OTHER({code})"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--deploy", action="store_true",
                    help="deploy the redirect to every stale project")
    args = ap.parse_args()

    sites = scan()
    for s in sites:
        s["state"] = probe(s["host"])
    stale = [s for s in sites if s["state"] != "REDIRECT"]

    print(f"{len(sites)} language subdomains across "
          f"{len(set(s['apex'] for s in sites))} apex domains; "
          f"{len(sites) - len(stale)} already redirecting")
    for s in stale:
        print(f"  stale  {s['host']:<24} {s['state']:<12} project={s['project']}")

    if not stale:
        print("nothing to do")
        return 0
    if not args.deploy:
        print("\nre-run with --deploy to fix")
        return 1

    for s in stale:
        r = run(["npx", "wrangler", "pages", "deploy", str(HERE),
                 "--project-name", s["project"], "--branch", "main"], timeout=300)
        ok = "Deployment complete" in r.stdout or "Success" in r.stdout
        print(f"  deploy {s['host']:<24} {'sent' if ok else 'FAILED'}")

    # Cloudflare needs a moment to propagate, and a deploy that reports success
    # can still leave the public hostname unchanged. Re-probe until it settles.
    print("\nverifying")
    remaining = list(stale)
    for attempt in range(1, 6):
        remaining = [s for s in remaining if probe(s["host"]) != "REDIRECT"]
        if not remaining:
            print(f"  all {len(stale)} confirmed redirecting")
            return 0
        print(f"  attempt {attempt}: {len(remaining)} not yet redirecting")
    for s in remaining:
        print(f"  STILL NOT REDIRECTING  {s['host']}  project={s['project']}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
