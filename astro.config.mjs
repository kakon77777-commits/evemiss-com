import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { LANGS } from './src/data/site.ts';

// Single-URL i18n: the localized trees (/zh, /ja, /ar, …) exist in the build so
// the edge worker can serve them, but every one of them 301s to the bare URL,
// so none of them belongs in a sitemap.
//
// This used to be the literal regex /evemiss\.com\/zh(\/|$)/ — it named one
// language out of forty, so the sitemap shipped 78 URLs of which 77 were
// redirects. The rule is derived from LANGS now: add a 41st language and it is
// excluded without anyone having to remember this file exists.
const LOCALIZED = new RegExp(`^https?://[^/]+/(${LANGS.join('|')})(/|$)`);

export default defineConfig({
  site: 'https://evemiss.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !LOCALIZED.test(page),
    }),
  ],
  build: {
    format: 'file',
  },
});
