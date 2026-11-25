import { existsSync, globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const app = process.env.ZEROCLOUD_APP;
const hasGuides =
  globSync('src/content/guides/**/*.md', {
    cwd: fileURLToPath(new URL('./', import.meta.url)),
  }).length > 0;
if (
  app &&
  (!/^[a-z][a-z0-9-]*$/.test(app) ||
    !existsSync(new URL(`./src/content/apps/${app}/app.json`, import.meta.url)))
) {
  throw new Error(`Unknown app site: ${app}. Use a folder name from src/content/apps.`);
}
const address = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
if (
  address &&
  (!['https:', 'http:'].includes(address.protocol) ||
    address.search ||
    address.hash ||
    address.username ||
    address.password)
) {
  throw new Error('SITE_URL must be an HTTP(S) origin with an optional base path.');
}

const routes = app
  ? [['/[chapter]', 'AppChapter']]
  : [
      ['/project', 'Project'],
      ['/apps', 'Directory'],
      ['/apps/[product]', 'AppIndex'],
      ['/apps/[product]/[chapter]', 'AppChapter'],
    ];
const editions = {
  name: 'zerocloud-editions',
  hooks: {
    'astro:config:setup': ({ injectRoute, command }) => {
      const pages =
        command === 'dev' && !app ? [...routes, ['/dev/design-system', 'DesignPreview']] : routes;
      for (const [pattern, page] of pages) {
        injectRoute({
          pattern,
          entrypoint: fileURLToPath(new URL(`./src/routes/${page}.astro`, import.meta.url)),
          prerender: true,
        });
      }
    },
  },
};

export default defineConfig({
  output: 'static',
  ...(app && { outDir: `./build/sites/${app}/`, cacheDir: `./.astro/cache/${app}/` }),
  ...(address && { site: address.origin, base: address.pathname }),
  integrations: [
    editions,
    ...(address
      ? [
          sitemap({
            filter: (page) =>
              hasGuides || !/\/(?:docs|technologies)(?:\/|$)/u.test(new URL(page).pathname),
          }),
        ]
      : []),
  ],
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  server: { host: '127.0.0.1', port: app ? 14374 : 14372 },
  vite: { server: { strictPort: true }, preview: { strictPort: true } },
});
