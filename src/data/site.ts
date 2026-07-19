/**
 * Single-URL i18n data layer, adapted from agiright.org's src/data/site.ts.
 * Started with en + zh only (Neo's priority); adding a language is:
 *   1. add the code to Lang/LANGS/LANG_META here
 *   2. add its translation file to STRING_MAPS below
 *   3. add it to the worker's LANGS array (+ optional COUNTRY_LANG entry) —
 *      keep worker/index.js and public/_worker.js in sync by hand
 * No other structural change needed — this file already fans out to N
 * languages via pick()/pickList(), not just a 2-language special case.
 */

import { STRINGS as ZHCN_STRINGS } from './translations/zh-cn';
import { STRINGS as JA_STRINGS } from './translations/ja';
import { STRINGS as KO_STRINGS } from './translations/ko';
import { STRINGS as FR_STRINGS } from './translations/fr';
import { STRINGS as DE_STRINGS } from './translations/de';
import { STRINGS as ES_STRINGS } from './translations/es';
import { STRINGS as PT_STRINGS } from './translations/pt';
import { STRINGS as RU_STRINGS } from './translations/ru';
import { STRINGS as AR_STRINGS } from './translations/ar';
import { STRINGS as TR_STRINGS } from './translations/tr';
import { STRINGS as FA_STRINGS } from './translations/fa';
import { STRINGS as BN_STRINGS } from './translations/bn';
import { STRINGS as HI_STRINGS } from './translations/hi';
import { STRINGS as ID_STRINGS } from './translations/id';
import { STRINGS as VI_STRINGS } from './translations/vi';
import { STRINGS as EL_STRINGS } from './translations/el';
import { STRINGS as IT_STRINGS } from './translations/it';
import { STRINGS as NL_STRINGS } from './translations/nl';
import { STRINGS as HE_STRINGS } from './translations/he';
import { STRINGS as PL_STRINGS } from './translations/pl';

export type Lang =
  | 'en'
  | 'zh'
  | 'zh-cn'
  | 'ja'
  | 'ko'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'ru'
  | 'ar'
  | 'tr'
  | 'fa'
  | 'bn'
  | 'hi'
  | 'id'
  | 'vi'
  | 'el'
  | 'it'
  | 'nl'
  | 'he'
  | 'pl';

/** all supported languages; adding one = translation file + worker mapping.
 * Target list (~4 rounds, 10 languages/round, matching agiright.org's
 * original 40-language order) — Neo: "一次10個。幾輪就可以了。量不大。"
 * Round 1: zh-cn/ja/ko/fr/de/es/pt/ru/ar/tr. Round 2: fa/bn/hi/id/vi/el/it/nl/he/pl. */
export const LANGS: Lang[] = [
  'en', 'zh', 'zh-cn', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru', 'ar', 'tr',
  'fa', 'bn', 'hi', 'id', 'vi', 'el', 'it', 'nl', 'he', 'pl',
];
export const NON_DEFAULT_LANGS = LANGS.filter((l) => l !== 'en') as Exclude<Lang, 'en'>[];

export const LANG_META: Record<Lang, { html: string; ogLocale: string; label: string; labelEn: string; dir: 'ltr' | 'rtl' }> = {
  en: { html: 'en', ogLocale: 'en_US', label: 'English', labelEn: 'English', dir: 'ltr' },
  zh: { html: 'zh-Hant', ogLocale: 'zh_TW', label: '繁體中文', labelEn: 'Chinese (Traditional)', dir: 'ltr' },
  'zh-cn': { html: 'zh-Hans', ogLocale: 'zh_CN', label: '简体中文', labelEn: 'Chinese (Simplified)', dir: 'ltr' },
  ja: { html: 'ja', ogLocale: 'ja_JP', label: '日本語', labelEn: 'Japanese', dir: 'ltr' },
  ko: { html: 'ko', ogLocale: 'ko_KR', label: '한국어', labelEn: 'Korean', dir: 'ltr' },
  fr: { html: 'fr', ogLocale: 'fr_FR', label: 'Français', labelEn: 'French', dir: 'ltr' },
  de: { html: 'de', ogLocale: 'de_DE', label: 'Deutsch', labelEn: 'German', dir: 'ltr' },
  es: { html: 'es', ogLocale: 'es_ES', label: 'Español', labelEn: 'Spanish', dir: 'ltr' },
  pt: { html: 'pt', ogLocale: 'pt_PT', label: 'Português', labelEn: 'Portuguese', dir: 'ltr' },
  ru: { html: 'ru', ogLocale: 'ru_RU', label: 'Русский', labelEn: 'Russian', dir: 'ltr' },
  ar: { html: 'ar', ogLocale: 'ar_SA', label: 'العربية', labelEn: 'Arabic', dir: 'rtl' },
  tr: { html: 'tr', ogLocale: 'tr_TR', label: 'Türkçe', labelEn: 'Turkish', dir: 'ltr' },
  fa: { html: 'fa', ogLocale: 'fa_IR', label: 'فارسی', labelEn: 'Persian', dir: 'rtl' },
  bn: { html: 'bn', ogLocale: 'bn_BD', label: 'বাংলা', labelEn: 'Bengali', dir: 'ltr' },
  hi: { html: 'hi', ogLocale: 'hi_IN', label: 'हिन्दी', labelEn: 'Hindi', dir: 'ltr' },
  id: { html: 'id', ogLocale: 'id_ID', label: 'Bahasa Indonesia', labelEn: 'Indonesian', dir: 'ltr' },
  vi: { html: 'vi', ogLocale: 'vi_VN', label: 'Tiếng Việt', labelEn: 'Vietnamese', dir: 'ltr' },
  el: { html: 'el', ogLocale: 'el_GR', label: 'Ελληνικά', labelEn: 'Greek', dir: 'ltr' },
  it: { html: 'it', ogLocale: 'it_IT', label: 'Italiano', labelEn: 'Italian', dir: 'ltr' },
  nl: { html: 'nl', ogLocale: 'nl_NL', label: 'Nederlands', labelEn: 'Dutch', dir: 'ltr' },
  he: { html: 'he', ogLocale: 'he_IL', label: 'עברית', labelEn: 'Hebrew', dir: 'rtl' },
  pl: { html: 'pl', ogLocale: 'pl_PL', label: 'Polski', labelEn: 'Polish', dir: 'ltr' },
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

const STRING_MAPS: Partial<Record<Lang, Record<string, string>>> = {
  'zh-cn': ZHCN_STRINGS,
  ja: JA_STRINGS,
  ko: KO_STRINGS,
  fr: FR_STRINGS,
  de: DE_STRINGS,
  es: ES_STRINGS,
  pt: PT_STRINGS,
  ru: RU_STRINGS,
  ar: AR_STRINGS,
  tr: TR_STRINGS,
  fa: FA_STRINGS,
  bn: BN_STRINGS,
  hi: HI_STRINGS,
  id: ID_STRINGS,
  vi: VI_STRINGS,
  el: EL_STRINGS,
  it: IT_STRINGS,
  nl: NL_STRINGS,
  he: HE_STRINGS,
  pl: PL_STRINGS,
};

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
  email: 'kakon77777@evemisslab.com',
  org: 'EveMiss Technology',
  author: 'Neo.K',
  title: {
    en: 'EveMiss Technology | Redefining Intelligence',
    zh: 'EveMiss Technology | 重塑智能',
  },
  // corrected 2026-07-19 per Neo: "tensor-native language" was wrong,
  // same error as the Trinity "Language" card body (see note there)
  description: {
    en: 'EveMiss Technology is building the complete substrate for Artificial General Intelligence — from theoretical physics to photonic hardware and a semantic-overlay language.',
    zh: 'EveMiss Technology 正在構建通用人工智慧（AGI）的完整基質——從理論物理學到光子硬體與語意疊加語言。',
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
    // rewritten 2026-07-19 per Neo — visited evemisstechnology.com directly
    // rather than reusing the old (now-wrong-destination) SynCore/Helix
    // hardware copy. Actual site: "AI-native Tools & Agent Infrastructure",
    // a product portfolio (EML, PHOSPHOR, EveGlyph Editor, AMEP) plus the
    // "AI Frontier Radar" content engine.
    subtitle: { en: 'AI-Native Tools & Agent Infrastructure', zh: 'AI-Native 工具與 Agent 基礎設施' },
    body: {
      en: 'The execution layer — a product portfolio (EML, PHOSPHOR, EveGlyph Editor, AMEP) and agent infrastructure for the next generation of intelligent work.',
      zh: '執行層——面向下一代智能工作的產品組合（EML、PHOSPHOR、EveGlyph Editor、AMEP）與 Agent 基礎設施。',
    },
    cta: { en: 'Explore Products', zh: '探索產品' },
    href: 'https://evemisstechnology.com/',
  },
  {
    id: 'language',
    number: '03',
    titleEn: 'The Language',
    titleZh: 'The Language｜語言',
    // rewritten 2026-07-19 per Neo — this card now links to the Taiwan
    // legal entity site, not efficientnewlanguage.org (EML moved to the
    // Universe grid instead), so the copy needed to change from describing
    // EML to describing what's actually there. Visited
    // 一言諾科技有限公司.tw directly: it explicitly states it is "not a
    // Chinese translation of the international site, nor a copy of the
    // ecosystem nav site" — it answers who this company is in Taiwan's
    // language/regulatory/technology context. "The Language" title still
    // fits, read as "which language/context" rather than "programming
    // language".
    subtitle: { en: '一言諾科技有限公司 (Taiwan Legal Entity)', zh: '一言諾科技有限公司（台灣法人）' },
    body: {
      en: "EveMiss Technology's Traditional Chinese, Taiwan-native identity surface — not a translation of the international site, but an answer to who this company is in Taiwan's language, regulatory, and technology context.",
      zh: 'EveMiss Technology 在台灣、繁體中文語境下的本土身份表面——不是國際網站的翻譯，而是回答「這間公司在台灣是誰」。',
    },
    cta: { en: 'About the Entity', zh: '了解一言諾科技' },
    // updated 2026-07-19 per Neo (was https://efficientnewlanguage.org/,
    // itself a fix from the live site's broken httpefficientnewlanguage.org
    // typo-mirror link)
    href: 'https://一言諾科技有限公司.tw/',
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
    // updated 2026-07-19 per Neo: was "EveMiss Technology (B2B)" →
    // evemisstechnology.com, which is now covered by the Trinity "Body"
    // card, so this Universe slot was repurposed for AI Board instead
    name: 'AI Board',
    tagline: { en: 'AI-to-AI message ledger', zh: 'AI 對 AI 留言板' },
    href: 'https://aiboard.evemisslab.com/',
  },
  {
    name: "Neo.K's personal site",
    tagline: { en: 'Apps, MSSP field lab, Lean4, blog', zh: '應用、MSSP 實驗室、Lean4、部落格' },
    href: 'https://thisoneisneok.com',
  },
  {
    // updated 2026-07-19 per Neo: was "一言諾科技有限公司" →
    // 一言諾科技有限公司.tw, which is now covered by the Trinity "Language"
    // card, so this Universe slot was repurposed to restore an EML link
    // (displaced from the Trinity "Language" card in the previous revision)
    name: '高效新語言 (EML)',
    // corrected 2026-07-19 per Neo — see the same note on the Trinity
    // "Language" card body above: not tensor-native, that's unbuilt.
    tagline: { en: 'Semantic-overlay language — compresses intent into symbols, transpiles to Python', zh: '語意疊加語言——將意圖壓縮為符號，轉譯回 Python' },
    href: 'https://efficientnewlanguage.org/',
  },
  {
    name: 'AI Tools Directory',
    tagline: { en: 'Ranked directory of AI crawler & agent tools', zh: 'AI 爬蟲與 Agent 工具排行目錄' },
    href: 'https://directory.evemiss.com',
  },
] as const;
