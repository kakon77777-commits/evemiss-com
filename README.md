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
- Astro 5, `build.format: 'file'`, deployed as Cloudflare Workers Static
  Assets (`wrangler.jsonc`) — same deployment shape as AGIRight.

## Content changes from the live site

- Kept the existing "Trinity" hero (Mind/Body/Language) verbatim, EN + 繁中,
  ported from `總企業網站/英文 (en)/index.html` and `總企業網站/繁體中文 (zh-TW)/index.html`.
- **Fixed a bug**: both language versions of the live site linked "The
  Language" card to `httpefficientnewlanguage.org` — a defensive typo-mirror
  domain, not the real site. Now correctly points to `efficientnewlanguage.org`.
- **Added** a "EveMiss Universe" section linking every other real, live
  property: AGIRight.org, CTCL (commoninstant.org), PHOSPHOR, EveGlyph
  Editor, EveMiss Technology (B2B), Neo.K's personal site
  (thisoneisneok.com), and the TW legal entity site. Excluded on purpose:
  `asiright.org` and `httpefficientnewlanguage.org` — both pre-bought
  mirror/typo domains, not real properties, per Neo.

## Local dev

```bash
npm install
npm run build
npx wrangler dev --config wrangler.jsonc   # runs the real edge worker, not just static preview
```

`npm run dev` / `npm run preview` (plain Astro) skip the worker entirely —
use `wrangler dev` to test language negotiation, cookie handling, and host
canonicalization for real.

## Deployment

**Not yet deployed.** `evemiss.com` is a live, real-traffic production
domain — this repo is built and locally verified (`wrangler dev`, both
languages, desktop + mobile), but `wrangler deploy` needs a separate explicit
go-ahead before pointing the real domain at it.
