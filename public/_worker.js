/**
 * evemiss.com edge worker — Cloudflare Pages Advanced Mode entry point.
 *
 * IDENTICAL logic to ../worker/index.js. Duplicated (not imported) because
 * evemiss.com's custom domain is already bound to the existing Cloudflare
 * Pages project "evemiss" (deploying as a standalone Worker with a
 * custom_domain route 409-conflicts with that binding). Pages' "Advanced
 * Mode" runs whatever is at the build output's _worker.js for every
 * request — this file must be kept in sync with worker/index.js if either
 * changes. worker/index.js + wrangler.jsonc's routes are kept as the
 * from-scratch Workers-deploy path (matching agiright.org's architecture)
 * in case the domain ever gets migrated off Pages.
 *
 * 1. Host canonicalization — serves evemiss.com; 301s www.evemiss.com to it.
 * 2. Single-URL multilingual — one public URL per page. The language is
 *    negotiated per request: `lang` cookie (manual choice) > IP country >
 *    Accept-Language > English. Localized trees (e.g. /zh/...) exist only
 *    as internal build artifacts; requests are rewritten to them here.
 *
 * Adding a language later: add its code to LANGS (and country/accept rules),
 * build the tree under /<code>/ — no other worker change needed.
 */
const CANONICAL_HOST = 'evemiss.com';
const DEFAULT_LANG = 'en';
/** language codes with a built tree under /<code>/ */
const LANGS = ['zh', 'zh-cn', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru', 'ar', 'tr'];
/** IP countries mapped to a non-default language */
const COUNTRY_LANG = {
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  CN: 'zh-cn',
  JP: 'ja',
  KR: 'ko',
  FR: 'fr',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  PT: 'pt',
  BR: 'pt',
  RU: 'ru',
  BY: 'ru',
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  IQ: 'ar',
  JO: 'ar',
  KW: 'ar',
  QA: 'ar',
  BH: 'ar',
  OM: 'ar',
  MA: 'ar',
  DZ: 'ar',
  TN: 'ar',
  LB: 'ar',
  SY: 'ar',
  TR: 'tr',
};
/** Content-Language per lang code */
const CONTENT_LANG = {
  en: 'en',
  zh: 'zh-Hant',
  'zh-cn': 'zh-Hans',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  de: 'de',
  es: 'es',
  pt: 'pt',
  ru: 'ru',
  ar: 'ar',
  tr: 'tr',
};
const LANG_COOKIE = 'lang';
const COOKIE_ATTRS = 'Path=/; Max-Age=31536000; SameSite=Lax';

/** paths that are language-neutral: build assets, well-known files */
const NEUTRAL_PREFIXES = ['/_astro/', '/.well-known/'];

function cookieLang(request) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)lang=([A-Za-z-]+)/);
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (v === DEFAULT_LANG || LANGS.includes(v)) return v;
  return null;
}

function pickLang(request) {
  const fromCookie = cookieLang(request);
  if (fromCookie) return fromCookie;

  const country = request.cf && request.cf.country;
  if (country && COUNTRY_LANG[country]) return COUNTRY_LANG[country];

  const accept = (request.headers.get('Accept-Language') || '').toLowerCase();
  const first = accept.split(',')[0].trim().split(';')[0];
  if (first.startsWith('zh')) {
    if (/hans|cn|sg/.test(first)) return 'zh-cn';
    return 'zh'; // zh-tw / zh-hant / zh-hk / bare zh → Traditional
  }
  if (first.startsWith('ja')) return 'ja';
  if (first.startsWith('ko')) return 'ko';
  if (first.startsWith('fr')) return 'fr';
  if (first.startsWith('de')) return 'de';
  if (first.startsWith('es')) return 'es';
  if (first.startsWith('pt')) return 'pt';
  if (first.startsWith('ru')) return 'ru';
  if (first.startsWith('ar')) return 'ar';
  if (first.startsWith('tr')) return 'tr';
  return DEFAULT_LANG;
}

/** true for HTML page routes; false for files and language-neutral paths */
function isPagePath(pathname) {
  if (NEUTRAL_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  const ext = pathname.match(/\.([a-z0-9]+)$/i);
  if (ext && ext[1].toLowerCase() !== 'html') return false;
  return true;
}

function withLangHeaders(res, lang) {
  const out = new Response(res.body, res);
  out.headers.append('Vary', 'Cookie');
  out.headers.set('Content-Language', CONTENT_LANG[lang] || lang);
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- host canonicalization ------------------------------------------
    if (url.hostname !== CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // --- legacy localized URLs: /zh/foo → /foo + remembered preference ---
    for (const lang of LANGS) {
      const m = url.pathname.match(new RegExp(`^/${lang}(/.*)?$`));
      if (m) {
        const target = m[1] && m[1] !== '/' ? m[1] : '/';
        return new Response(null, {
          status: 301,
          headers: {
            Location: url.origin + target + url.search,
            'Set-Cookie': `${LANG_COOKIE}=${lang}; ${COOKIE_ATTRS}`,
          },
        });
      }
    }

    // --- language negotiation for page routes ----------------------------
    if ((request.method === 'GET' || request.method === 'HEAD') && isPagePath(url.pathname)) {
      const lang = pickLang(request);
      if (lang !== DEFAULT_LANG) {
        const localized = new URL(url);
        localized.pathname = `/${lang}${url.pathname === '/' ? '' : url.pathname}`;
        let res = await env.ASSETS.fetch(new Request(localized, request));
        if (res.status === 404) {
          // page not translated yet — fall back to the default language
          res = await env.ASSETS.fetch(request);
          return withLangHeaders(res, DEFAULT_LANG);
        }
        return withLangHeaders(res, lang);
      }
      return withLangHeaders(await env.ASSETS.fetch(request), DEFAULT_LANG);
    }

    return env.ASSETS.fetch(request);
  },
};
