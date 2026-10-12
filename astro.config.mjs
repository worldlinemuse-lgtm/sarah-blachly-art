import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://worldlinemuse-lgtm.github.io',
  base: '/sarah-blachly-art',
  integrations: [sitemap()],
  image: {
    remotePatterns: [],
  },
});
