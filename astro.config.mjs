import { defineConfig } from 'astro/config';
import settings from './src/data/settings.json' with { type: 'json' };

// Адрес сайта берётся из админки (Настройки → Адрес сайта).
export default defineConfig({
  site: settings.siteUrl,
  trailingSlash: 'always',
  build: { format: 'directory' },
});
