import { readFile, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const child = Bun.spawn(
  [
    process.execPath,
    join(root, 'node_modules/electrobun/bin/electrobun.cjs'),
    ...process.argv.slice(2),
  ],
  {
    cwd: join(root, 'products/share/apps/desktop'),
    env: {
      ...process.env,
      PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}`,
      HUTCH_HOME: process.env.HUTCH_HOME ?? join(root, '.cache/hutch'),
    },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
);
const status = await child.exited;
if (status === 0 && process.argv[2] === 'prepare') {
  // Electrobun 2.0.7 generates a baseUrl option removed by TypeScript 7.
  // Generate an adapter beside the SDK; never modify the vendor projection.
  const sdk = join(root, 'products/share/apps/desktop/.hutch');
  const original = JSON.parse(await readFile(join(sdk, 'devkit/tsconfig.json'), 'utf8')) as {
    compilerOptions: { paths: Record<string, string[]> };
  };
  // The umbrella entry exports an anonymous private class that cannot emit declarations.
  // The shell uses the supported narrow entry instead; emit its referenced dependencies.
  const entries = ['./api/sdks/main/entries/browser-window.ts', './api/config/ElectrobunConfig.ts'];
  await writeFile(
    join(sdk, 'tsconfig.vendor.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ESNext',
          module: 'Preserve',
          moduleResolution: 'Bundler',
          lib: ['ESNext', 'DOM'],
          types: ['bun'],
          jsx: 'react-jsx',
          noCheck: true,
          declaration: true,
          emitDeclarationOnly: true,
          rootDir: './devkit/api',
          outDir: './types',
          skipLibCheck: true,
        },
        files: entries.map((target) => `./devkit/${target.replace(/^\.\//u, '')}`),
      },
      null,
      2,
    ),
  );
  const declarations = Bun.spawn(
    [
      'node',
      join(root, 'node_modules/typescript/bin/tsc'),
      '-p',
      join(sdk, 'tsconfig.vendor.json'),
    ],
    {
      cwd: root,
      stdout: 'inherit',
      stderr: 'inherit',
    },
  );
  if ((await declarations.exited) !== 0)
    throw new Error('Could not generate desktop SDK declarations.');
  const paths = Object.fromEntries(
    Object.entries(original.compilerOptions.paths).map(([name, targets]) => [
      name,
      targets.map((target) =>
        target.replace(/^\.\/api\//u, './types/').replace(/\.tsx?$/u, '.d.ts'),
      ),
    ]),
  );
  await writeFile(
    join(sdk, 'tsconfig.compat.json'),
    JSON.stringify({ compilerOptions: { paths } }, null, 2),
  );
}
process.exit(status);
