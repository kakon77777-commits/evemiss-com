/**
 * evemiss.com edge worker.
 *
 * 1. Host canonicalization — serves evemiss.com; 301s www.evemiss.com to it.
 * 2. Single-URL multilingual — one public URL per page. The language is
 *    negotiated per request: `lang` cookie (manual choice) > IP country >
 *    Accept-Language > English. Localized trees (e.g. /zh/...) exist only
 *    as internal build artifacts; requests are rewritten to them here.
 *
 * Adding a language later: add its code to LANGS (and country/accept rules),
 * build the tree under /<code>/ — no other worker change needed. Pattern
 * adapted from agiright.org's worker/index.js (see that repo for the
 * 50-language version of this same file).
 */
const CANONICAL_HOST = 'evemiss.com';
const DEFAULT_LANG = 'en';
/** language codes with a built tree under /<code>/ */
const LANGS = [
  'zh', 'zh-cn', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru', 'ar', 'tr',
  'fa', 'bn', 'hi', 'id', 'vi', 'el', 'it', 'nl', 'he', 'pl',
  'sv', 'ur', 'th', 'ta', 'cs', 'uk', 'ms', 'fi', 'ro', 'hu',
  'da', 'no', 'sk', 'fil', 'kk', 'sw', 'bs', 'eo',
];
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
  IR: 'fa',
  AF: 'fa',
  BD: 'bn',
  // IN intentionally unmapped: India is multilingual (22 official
  // languages) — Accept-Language is a better per-user signal than country
  ID: 'id',
  VN: 'vi',
  GR: 'el',
  CY: 'el', // Greek Cypriots are the island's majority
  IT: 'it',
  SM: 'it',
  VA: 'it',
  // BE: Dutch-speaking Flemish are the majority (~60%) over French-speaking
  // Walloons (~40%)
  NL: 'nl',
  BE: 'nl',
  IL: 'he',
  PL: 'pl',
  SE: 'sv',
  PK: 'ur',
  TH: 'th',
  // ta intentionally has no country mapping: Tamil's largest populations
  // (India, Sri Lanka) are both majority-other-language countries — same
  // reasoning as IN above. Accept-Language is the accurate per-user signal.
  CZ: 'cs',
  UA: 'uk',
  MY: 'ms',
  BN: 'ms', // Brunei: Malay is the sole official language
  FI: 'fi',
  RO: 'ro',
  HU: 'hu',
  DK: 'da',
  NO: 'no',
  SK: 'sk',
  PH: 'fil',
  KZ: 'kk',
  KE: 'sw',
  TZ: 'sw',
  UG: 'sw', // Swahili is an official language in Kenya, Tanzania, and Uganda
  BA: 'bs',
  // eo intentionally has no country mapping: Esperanto is a constructed
  // international auxiliary language with no native-speaker country —
  // Accept-Language is the only meaningful per-user signal.
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
  fa: 'fa',
  bn: 'bn',
  hi: 'hi',
  id: 'id',
  vi: 'vi',
  el: 'el',
  it: 'it',
  nl: 'nl',
  he: 'he',
  pl: 'pl',
  sv: 'sv',
  ur: 'ur',
  th: 'th',
  ta: 'ta',
  cs: 'cs',
  uk: 'uk',
  ms: 'ms',
  fi: 'fi',
  ro: 'ro',
  hu: 'hu',
  da: 'da',
  no: 'no',
  sk: 'sk',
  fil: 'fil',
  kk: 'kk',
  sw: 'sw',
  bs: 'bs',
  eo: 'eo',
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
  if (first.startsWith('fa')) return 'fa';
  if (first.startsWith('bn')) return 'bn';
  if (first.startsWith('hi')) return 'hi';
  if (first.startsWith('id')) return 'id';
  if (first.startsWith('vi')) return 'vi';
  if (first.startsWith('el')) return 'el';
  if (first.startsWith('it')) return 'it';
  if (first.startsWith('nl')) return 'nl';
  if (first.startsWith('he') || first.startsWith('iw')) return 'he'; // 'iw' = old ISO 639-1 code for Hebrew, still sent by some browsers
  if (first.startsWith('pl')) return 'pl';
  if (first.startsWith('sv')) return 'sv';
  if (first.startsWith('ur')) return 'ur';
  if (first.startsWith('th')) return 'th';
  if (first.startsWith('ta')) return 'ta';
  if (first.startsWith('cs')) return 'cs';
  if (first.startsWith('uk')) return 'uk';
  if (first.startsWith('ms')) return 'ms';
  if (first.startsWith('fi')) return 'fi';
  if (first.startsWith('ro')) return 'ro';
  if (first.startsWith('hu')) return 'hu';
  if (first.startsWith('da')) return 'da';
  if (first.startsWith('no') || first.startsWith('nb') || first.startsWith('nn')) return 'no';
  if (first.startsWith('sk')) return 'sk';
  if (first.startsWith('fil')) return 'fil';
  if (first.startsWith('kk')) return 'kk';
  if (first.startsWith('sw')) return 'sw';
  if (first.startsWith('bs')) return 'bs';
  if (first.startsWith('eo')) return 'eo';
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
