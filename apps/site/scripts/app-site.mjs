import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [command, slug] = process.argv.slice(2);
if (!['build', 'preview', 'dev'].includes(command) || !slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Pass the app directory name, for example: bun run build:app-site share');
  process.exit(1);
}
const require = createRequire(import.meta.url);
const manifest = require.resolve('astro/package.json');
const cli = join(dirname(manifest), require(manifest).bin.astro);
const flags = command === 'build' ? [] : ['--ignore-lock'];
const child = spawn(process.execPath, [cli, command, ...flags], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, ZEROCLOUD_APP: slug },
  stdio: 'inherit',
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
