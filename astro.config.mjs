import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://evemiss.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      // single-URL i18n: localized build trees (/zh/...) are internal —
      // only bare URLs are public, so exclude them from the sitemap
      filter: (page) => !/evemiss\.com\/zh(\/|$)/.test(page),
    }),
  ],
  build: {
    format: 'file',
  },
});
