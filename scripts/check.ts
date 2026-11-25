import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const mode = process.argv[2];
if (mode !== 'external' && mode !== 'serve') {
  console.error('Use bun run check:external or bun run dev:check-servers.');
  process.exit(1);
}
if (mode === 'external') {
  const child = Bun.spawn([process.execPath, 'run', 'check'], {
    cwd: root,
    env: { ...process.env, ZEROCLOUD_EXTERNAL_SERVERS: '1' },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  process.exit(await child.exited);
}

// Dedicated test servers, separate from the user's app development server.
const node = Bun.which('node');
if (!node) throw new Error('Node.js 24 or newer is required.');
const servers = [
  Bun.spawn(
    [process.execPath, 'run', '--filter', '@zerocloud/share-web', 'dev', '--port', '14371'],
    {
      cwd: root,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    },
  ),
  ...[
    { SITE_URL: 'http://127.0.0.1:14373/publication/', ZEROCLOUD_APP: '' },
    { SITE_URL: 'http://127.0.0.1:14375/share-preview/', ZEROCLOUD_APP: 'share' },
  ].map((settings) =>
    Bun.spawn([node, 'apps/site/scripts/test-server.mjs'], {
      cwd: root,
      env: { ...process.env, ...settings, ASTRO_TELEMETRY_DISABLED: '1' },
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    }),
  ),
];
console.log('Check servers: app 14371, family 14373/publication/, Share 14375/share-preview/.');
console.log(
  'Keep this terminal running while bun run check:external runs. Ctrl+C stops the servers.',
);
function stop() {
  for (const server of servers) server.kill();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
const first = await Promise.race(servers.map((server) => server.exited));
stop();
process.exit(first);
