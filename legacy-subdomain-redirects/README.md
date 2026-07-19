# Legacy subdomain redirects

evemiss.com used to be deployed as ~19 separate Cloudflare Pages projects,
one per language subdomain (the "每一個子網域都單獨建置" strategy documented
in `D:\Ai\網站群\總企業網站\EveMiss ALO-SEO 多子網域擴張策略.txt`). Now that
the site is a single-URL multi-language build, those old projects are
retired but **not deleted** — Neo's call (2026-07-19): write redirects first
since translating all ~40 languages into the new site will take a while;
decide on actually deleting the old projects later.

`_worker.js` here is a minimal permanent redirect (301, path + query
preserved) to `https://evemiss.com`. It was deployed as-is to each of these
18 existing Pages projects (their custom domains were left untouched —
only the deployed content changed):

| Project      | Domain           |
|--------------|------------------|
| heevemiss    | he.evemiss.com   |
| elevemiss    | el.evemiss.com   |
| vievemiss    | vi.evemiss.com   |
| idevemiss    | id.evemiss.com   |
| hievemiss    | hi.evemiss.com   |
| bnevemiss    | bn.evemiss.com   |
| faevemiss    | fa.evemiss.com   |
| trevemiss    | tr.evemiss.com   |
| arevemiss    | ar.evemiss.com   |
| ruevemiss    | ru.evemiss.com   |
| ptevemiss    | pt.evemiss.com   |
| esevemiss    | es.evemiss.com   |
| deevemiss    | de.evemiss.com   |
| frevemiss    | fr.evemiss.com   |
| koevemiss    | ko.evemiss.com   |
| jpevemiss    | jp.evemiss.com   |
| cnevemiss    | cn.evemiss.com   |
| zhtwevemiss  | zh.evemiss.com   |

(The root `evemiss` project is the actual new site — see the rest of this
repo — and is not part of this list. `burningjosspaper` also showed up in
`wrangler pages project list` but has no evemiss.com domain and is
unrelated.)

No `lang` cookie is set by the redirect — the new site only supports en/zh
so far (2026-07-19), and setting a cookie for an unsupported language code
would just be ignored by the new site's own worker anyway. It falls back to
IP-country / Accept-Language negotiation, which is the correct behavior
until each language is actually rebuilt.

## Redeploying (if this script ever changes)

```bash
for p in heevemiss elevemiss vievemiss idevemiss hievemiss bnevemiss faevemiss \
         trevemiss arevemiss ruevemiss ptevemiss esevemiss deevemiss frevemiss \
         koevemiss jpevemiss cnevemiss zhtwevemiss; do
  npx wrangler pages deploy legacy-subdomain-redirects --project-name "$p" --branch main
done
```

Each of these projects' production branch is `main` (confirmed individually
for `heevemiss` and `evemiss`; assumed consistent for the rest since they
were all created via the same bulk process — verify with `wrangler pages
deployment list --project-name <name>` if a redeploy ever behaves
unexpectedly, same gotcha as the main site's own deploy).
