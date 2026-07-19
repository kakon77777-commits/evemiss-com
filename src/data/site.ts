/**
 * Single-URL i18n data layer, adapted from agiright.org's src/data/site.ts.
 * Starts with en + zh only (Neo's priority); adding a language later is:
 *   1. add the code to Lang/LANGS/LANG_META here
 *   2. add its translations to STRING_MAPS (or leave English fallback)
 *   3. add it to the worker's LANGS array (+ optional COUNTRY_LANG entry)
 * No other structural change needed — this file already fans out to N
 * languages via pick()/pickList(), not just a 2-language special case.
 */

export type Lang = 'en' | 'zh';

/** all supported languages; adding one = translation file + worker mapping */
export const LANGS: Lang[] = ['en', 'zh'];
export const NON_DEFAULT_LANGS = LANGS.filter((l) => l !== 'en') as Exclude<Lang, 'en'>[];

export const LANG_META: Record<Lang, { html: string; ogLocale: string; label: string; labelEn: string; dir: 'ltr' | 'rtl' }> = {
  en: { html: 'en', ogLocale: 'en_US', label: 'English', labelEn: 'English', dir: 'ltr' },
  zh: { html: 'zh-Hant', ogLocale: 'zh_TW', label: '繁體中文', labelEn: 'Chinese (Traditional)', dir: 'ltr' },
};

/** bilingual source string; languages beyond en/zh would resolve via STRING_MAPS */
export interface Bi {
  en: string;
  zh: string;
}
export interface BiList {
  en: string[];
  zh: string[];
}

const STRING_MAPS: Partial<Record<Lang, Record<string, string>>> = {};

/** resolve a bilingual string for any language, falling back to English */
export function pick(obj: Bi, lang: Lang): string {
  if (lang === 'zh') return obj.zh;
  if (lang === 'en') return obj.en;
  return STRING_MAPS[lang]?.[obj.en] ?? obj.en;
}

/** resolve a bilingual string list for any language, item-wise en fallback */
export function pickList(obj: BiList, lang: Lang): string[] {
  if (lang === 'zh') return obj.zh;
  if (lang === 'en') return obj.en;
  const tr = STRING_MAPS[lang];
  return obj.en.map((s) => tr?.[s] ?? s);
}

export const SITE = {
  name: 'EveMiss Technology',
  url: 'https://evemiss.com',
  email: 'contact@evemiss.com',
  org: 'EveMiss Technology',
  author: 'Neo.K',
  title: {
    en: 'EveMiss Technology | Redefining Intelligence',
    zh: 'EveMiss Technology | 重塑智能',
  },
  description: {
    en: 'EveMiss Technology is building the complete substrate for Artificial General Intelligence — from theoretical physics to photonic hardware and a tensor-native language.',
    zh: 'EveMiss Technology 正在構建通用人工智慧（AGI）的完整基質——從理論物理學到光子硬體與張量原生語言。',
  },
} as const;

/**
 * Single-URL i18n: one public URL serves every language; the edge worker
 * negotiates the variant (lang cookie > IP country > Accept-Language).
 * Localized build trees (/zh/...) are internal, so links never carry a
 * language prefix.
 */
export function langPrefix(_lang: Lang): string {
  return '';
}

const LANG_PREFIX_RE = new RegExp(`^/(${NON_DEFAULT_LANGS.join('|')})(?=/|$)`);

/** strip an internal language prefix from a build-time pathname */
export function publicPath(pathname: string): string {
  return pathname.replace(LANG_PREFIX_RE, '') || '/';
}

/** the "Trinity" — EveMiss's own three conceptual pillars */
export const TRINITY = [
  {
    id: 'mind',
    number: '01',
    titleEn: 'The Mind',
    titleZh: 'The Mind｜靈魂',
    subtitle: { en: 'Observer Engine & UDAE 3.0', zh: 'Observer Engine & UDAE 3.0' },
    body: {
      en: 'A unified field theory of knowledge. Moving beyond static models to dynamic, self-correcting cognitive architectures.',
      zh: '知識的統一場論。超越靜態模型，邁向動態、自我修正的認知架構。',
    },
    cta: { en: 'Visit Research Lab', zh: '造訪研究實驗室 (Lab)' },
    href: 'https://evemisslab.com',
  },
  {
    id: 'body',
    number: '02',
    titleEn: 'The Body',
    titleZh: 'The Body｜軀體',
    subtitle: { en: 'SynCore & Helix Architecture', zh: 'SynCore & Helix Architecture' },
    body: {
      en: 'Hardware designed for AGI. 3D Staircase Processors and Photonic Computing that break the physical limits of silicon.',
      zh: '為 AGI 而生的硬體。3D 階梯式處理器與光子計算，徹底突破矽基物理極限。',
    },
    cta: { en: 'View Hardware Concepts', zh: '查看硬體概念' },
    href: 'https://en.thisoneisneok.com/',
  },
  {
    id: 'language',
    number: '03',
    titleEn: 'The Language',
    titleZh: 'The Language｜語言',
    subtitle: { en: 'EML (Efficient New Language)', zh: 'EML (Efficient New Language)' },
    body: {
      en: 'The native tongue of AGI. A tensor-logic programming language designed for semantic compression and zero-loss efficiency.',
      zh: 'AGI 的原生母語。一種專為語義壓縮與零損耗效率設計的張量邏輯程式語言。',
    },
    cta: { en: 'Get the Language', zh: '獲取語言 (Get EML)' },
    // fixed 2026-07-19: the live site linked to httpefficientnewlanguage.org,
    // a defensive typo-mirror domain, not the real site
    href: 'https://efficientnewlanguage.org/',
  },
] as const;

/** the wider EveMiss universe — every other real, live property */
export const UNIVERSE = [
  {
    name: 'AGIRight.org',
    tagline: { en: 'AI rights & machine-readable governance protocols', zh: 'AI 權利與機器可讀治理協議研究站' },
    href: 'https://agiright.org',
  },
  {
    name: 'CTCL',
    tagline: { en: 'Common Time Coordinate Layer — a shared temporal substrate', zh: '共同時間座標層——共享的時間基礎設施' },
    href: 'https://commoninstant.org',
  },
  {
    name: 'PHOSPHOR',
    tagline: { en: 'VM execution visualizer', zh: 'VM 執行視覺化工具' },
    href: 'https://emlphosphor.com',
  },
  {
    name: 'EveGlyph Editor',
    tagline: { en: 'AI-native computable document editor', zh: 'AI 原生可計算文件編輯器' },
    href: 'https://eveglypheditor.com',
  },
  {
    name: 'EveMiss Technology (B2B)',
    tagline: { en: 'Enterprise services & partnerships', zh: '企業服務與合作' },
    href: 'https://evemisstechnology.com',
  },
  {
    name: "Neo.K's personal site",
    tagline: { en: 'Apps, MSSP field lab, Lean4, blog', zh: '應用、MSSP 實驗室、Lean4、部落格' },
    href: 'https://thisoneisneok.com',
  },
  {
    name: '一言諾科技有限公司',
    tagline: { en: 'Taiwan legal entity', zh: '台灣法人登記' },
    href: 'https://一言諾科技有限公司.tw',
  },
] as const;
