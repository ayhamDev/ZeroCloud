import { fileURLToPath } from 'node:url';
import { build, preview } from 'astro';

const root = new URL('../', import.meta.url);
const address = new URL(process.env.SITE_URL);
const edition = process.env.ZEROCLOUD_APP || 'family';
const scratch = new URL(`./build/browser-tests/${edition}/`, root);
const options = {
  root: fileURLToPath(root),
  outDir: fileURLToPath(new URL('dist/', scratch)),
  cacheDir: fileURLToPath(new URL('astro/', scratch)),
  vite: { cacheDir: fileURLToPath(new URL('vite/', scratch)) },
  server: { host: address.hostname, port: Number(address.port) },
  logLevel: 'warn',
};

await build(options);
const server = await preview(options);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await server.stop();
    process.exit(0);
  });
}
