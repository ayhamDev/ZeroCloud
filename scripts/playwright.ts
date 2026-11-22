import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const child = Bun.spawn(
  ['node', join(root, 'node_modules/@playwright/test/cli.js'), ...process.argv.slice(2)],
  {
    cwd: root,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH:
        process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(root, '.cache/playwright'),
    },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
);
process.exit(await child.exited);
