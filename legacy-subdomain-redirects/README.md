# Legacy subdomain redirects

evemiss.com used to be deployed as one Cloudflare Pages project per language
subdomain (the 每一個子網域都單獨建置 strategy in
`D:\Ai\網站群\總企業網站\EveMiss ALO-SEO 多子網域擴張策略.txt`). The site is now
a single-URL multi-language build, so those projects are retired — redirected,
but deliberately **not deleted**. That was Neo's call on 2026-07-19: write the
redirects first, decide about deleting the projects and their custom domains
later.

`_worker.js` is a minimal permanent redirect (301, path + query preserved) to
`https://evemiss.com`. It is deployed as the content of each retired project;
their custom domains are left attached and untouched.

## Do not maintain a list here. Run the script.

```bash
python legacy-subdomain-redirects/sync_redirects.py            # report
python legacy-subdomain-redirects/sync_redirects.py --deploy   # fix what is stale
```

`sync_redirects.py` reads the project list from Cloudflare on every run,
classifies each language subdomain by what it actually returns, deploys the
redirect to any that are still serving the old site, and then re-probes until
each one confirms. A subdomain created next month is picked up without anyone
remembering to add it here.

## Why the script exists

This file used to carry a hand-typed table. It said "~19 separate Cloudflare
Pages projects" and named 18 of them, and those 18 were redirected correctly on
2026-07-19.

There were **38**.

The other 20 kept serving the retired standalone per-language site for the next
four months. Nothing was wrong with `_worker.js`, and nothing was wrong with the
18 that were listed. The enumeration was wrong, and a wrong enumeration is
invisible: every project in the list worked, so every check passed.

Eleven of the missed twenty were worse than merely missed — their custom domains
had been attached to the **evemisslab.com** zone rather than evemiss.com, so
EveMiss Technology's per-language content was being served from EveMissLab's
domain:

```
bs. da. ek. eo. hu. kk. nl. no. ro. sw. tl.evemisslab.com
```

None of the 20 declared a `canonical` or an `hreflang`, so for four months they
were 20 near-duplicate standalone sites competing with evemiss.com — the exact
outcome the consolidation existed to prevent.

All 38 were confirmed redirecting on 2026-08-02.

## Two things this does not fix

- **`ek` is not a language code.** `ek.evemisslab.com` served
  `<html lang="sk">` — Slovak. No `sk.*` project exists, so Slovak only ever
  existed under a code that means nothing. The subdomain now redirects like the
  rest, but the typo also reached the current site: `evemiss.com/ek/` returns
  200 and renders the English page, while `/nl/`, `/da/`, `/sk/` and `/zh/` all
  301 to `/`. That belongs to the main build, not to this directory.
- **`evemiss.com/sitemap.xml` is not a sitemap.** It returns the site's HTML.
  (evemisslab.com's is a real sitemap.)

## Notes

The redirect sets no `lang` cookie. The current site negotiates by
IP-country / `Accept-Language`, which is the correct fallback for a language it
does not serve yet.

Each retired project's production branch is `main`; `sync_redirects.py` passes
`--branch main` and then verifies against the live hostname, so if that ever
stops being true the script reports the specific project rather than silently
deploying to a preview.

Cloudflare's edge can take a minute to pick up a new deployment. Two of the
twenty still served the old site on the first re-probe and were redirecting
shortly after — which is why the script retries before declaring a failure.
