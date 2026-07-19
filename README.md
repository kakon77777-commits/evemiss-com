# evemiss.com

EveMiss Technology's corporate hub — rebuilt 2026-07-19 as a single-URL,
multi-language site, replacing the old per-language-subdomain approach
(每一個子網域都單獨建置, documented in
`D:\Ai\網站群\總企業網站\EveMiss ALO-SEO 多子網域擴張策略.txt`).

## Architecture

The i18n mechanism is adapted from [agiright.org](https://agiright.org)
(`D:\Ai\網站群\AGIRight\site`) — Neo's own assessment: "這個網站的多國語言版
設計不錯" — but the visual design stays evemiss.com's own (dark/neon
"Trinity" look), ported from the live site rather than AGIRight's "paper/ink
navy" research-institute look.

- **Single public URL per page.** `worker/index.js` negotiates the language
  per request — `lang` cookie (manual choice) > IP country > Accept-Language
  > English — and internally rewrites to a localized build tree
  (`/zh/...`). Visitors never see a language-prefixed URL.
- **Starts with `en` + `zh`** (Neo's priority — 中文/英文先). Adding a
  language later: add the code to `src/data/site.ts` (`LANGS`/`LANG_META`)
  and the worker's `LANGS` array (+ optional `COUNTRY_LANG` entry), then
  build the tree under `/<code>/`. No other structural change — same pattern
  AGIRight used to scale from 2 to 50 languages.
- **Language switcher** is [matrix-select](https://github.com/kakon77777-commits/matrix-select)
  (copied into `public/`, not yet on npm), themed to the site's own dark/cyan
  palette — Neo's explicit ask, replacing the inline component AGIRight still
  uses internally.
- Astro 5, `build.format: 'file'`. **Deployed as Cloudflare Pages** (project
  `evemiss`, which already owned the `evemiss.com` custom domain from the old
  per-language-subdomain setup) — NOT Workers, despite `wrangler.jsonc`
  looking like AGIRight's Workers config. See "Deployment" below for why.

## Content changes from the live site

- Kept the existing "Trinity" hero (Mind/Body/Language) verbatim, EN + 繁中,
  ported from `總企業網站/英文 (en)/index.html` and `總企業網站/繁體中文 (zh-TW)/index.html`.
- **Fixed a bug**: both language versions of the live site linked "The
  Language" card to `httpefficientnewlanguage.org` — a defensive typo-mirror
  domain, not the real site.
- Per Neo (2026-07-19 revision): "The Body" card now links to
  `evemisstechnology.com`; "The Language" card now links to
  `一言諾科技有限公司.tw` (`xn--4gq46f5vcd8x4kfgs5auxxcxbkz9b.tw`); contact
  email unified to `kakon77777@evemisslab.com` (mailto + display text, was a
  mismatched contact@evemiss.com / neokpolaris@gmail.com pair).
- **Added** a "EveMiss Universe" section linking every other real, live
  property: AGIRight.org, CTCL (commoninstant.org), PHOSPHOR, EveGlyph
  Editor, EveMiss Technology (B2B), Neo.K's personal site
  (thisoneisneok.com), the TW legal entity site, and the AI Tools Directory
  ([[project-universal-directory]], planned at `directory.evemiss.com`).
  Excluded on purpose: `asiright.org` and `httpefficientnewlanguage.org` —
  both pre-bought mirror/typo domains, not real properties, per Neo.

## Local dev

```bash
npm install
npm run build
npx wrangler pages dev dist --port 8798   # runs the real _worker.js, matching production
```

`npm run dev` / `npm run preview` (plain Astro) skip the worker entirely.
`wrangler pages dev` simulates Cloudflare Pages Advanced Mode, but uses the
literal request Host header (`localhost`) rather than the configured custom
domain, so the host-canonicalization redirect fires on every request unless
you override it: `curl -H "Host: evemiss.com" http://localhost:8798/`.
There's also a from-scratch Workers dev path (`npx wrangler dev --config
wrangler.jsonc`) that simulates the configured custom-domain route directly,
useful for testing `worker/index.js` in isolation.

## Deployment

**Live at evemiss.com**, deployed 2026-07-19. Important gotcha discovered
during that first deploy:

- `evemiss.com`'s custom domain was already bound to an **existing Cloudflare
  Pages project named `evemiss`** (from the old per-language-subdomain setup
  — each language had its own Pages project, e.g. `zhtwevemiss` →
  `zh.evemiss.com`). Deploying this repo as a **standalone Worker**
  (`wrangler deploy`, using `wrangler.jsonc`'s `custom_domain` routes, same
  as AGIRight) 409-conflicts against that existing binding.
- Fix: kept the Worker logic as `public/_worker.js` (Cloudflare Pages
  "Advanced Mode" — Pages runs whatever's at the build output's `_worker.js`
  for every request, with the same `env.ASSETS` binding a standalone Worker
  gets) and deployed via `wrangler pages deploy`, targeting the *existing*
  `evemiss` project instead of fighting it for the domain. `worker/index.js`
  + `wrangler.jsonc`'s Workers-style config are kept as-is (matching
  AGIRight's architecture) in case the domain is ever migrated off Pages
  onto a standalone Worker — **the two worker files must be kept in sync by
  hand** if either changes; there's no build step deduplicating them.
- **Also a gotcha**: the Pages project's production branch is `main`, not
  `master` (this repo's actual default branch). `wrangler pages deploy`
  without `--branch main` lands as a *Preview* deployment, not Production —
  it will build and upload fine but **won't actually go live** at
  evemiss.com. Always deploy with:

  ```bash
  npx wrangler pages deploy dist --project-name evemiss --branch main
  ```

Verified live post-deploy: homepage content, both Trinity card link changes,
the Universe grid, `Content-Language` header + cookie-based language
override (`curl -H "Cookie: lang=en" https://evemiss.com/`), all via direct
`curl` against production.
