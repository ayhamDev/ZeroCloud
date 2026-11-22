import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

const root = resolve(import.meta.dir, '..');
const ignored = new Set([
  'node_modules',
  '.git',
  '.cache',
  '.hutch',
  '.turbo',
  '.prepared',
  'dist',
  'build',
  'coverage',
  'test-results',
  'playwright-report',
]);
const allowed: Record<string, string[]> = {
  '@zerocloud/brand': [],
  '@zerocloud/share-contracts': [],
  '@zerocloud/share-core': ['@zerocloud/share-contracts'],
  '@zerocloud/share-web': ['@zerocloud/brand', '@zerocloud/share-core'],
  '@zerocloud/share-desktop': ['@zerocloud/share-core'],
  '@zerocloud/share-android': [],
};

async function* walk(directory: string): AsyncGenerator<string> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const violations: string[] = [];
let packages = 0;
for await (const path of walk(root)) {
  if (
    /[/\\](bun\.lock|hutch\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/u.test(path) &&
    dirname(path) !== root
  ) {
    violations.push(`Nested lockfile: ${path}`);
  }
  if (!path.endsWith('package.json')) continue;
  const manifest = JSON.parse(await readFile(path, 'utf8')) as {
    name: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    workspaces?: unknown;
  };
  if (dirname(path) === root) continue;
  packages++;
  const permitted = allowed[manifest.name];
  if (!permitted) {
    violations.push(`Declare boundaries for ${manifest.name}.`);
    continue;
  }
  if (!manifest.private) violations.push(`${manifest.name} must be private.`);
  if (manifest.workspaces) violations.push(`${manifest.name} must not define a nested workspace.`);
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  for (const [dependency, version] of Object.entries(dependencies)) {
    if (dependency.startsWith('@zerocloud/')) {
      if (version !== 'workspace:*' || !permitted.includes(dependency))
        violations.push(`${manifest.name} cannot depend on ${dependency} (${version}).`);
    } else if (!/^\d+\.\d+\.\d+$/u.test(version))
      violations.push(`Pin a stable exact version for ${manifest.name}: ${dependency}.`);
  }
  for await (const source of walk(dirname(path))) {
    if (!source.endsWith('.ts') && !source.endsWith('.tsx')) continue;
    if (source.includes('.test.') || source.endsWith('.d.ts')) continue;
    const content = await readFile(source, 'utf8');
    for (const match of content.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/gu)) {
      const specifier = match[1] ?? '';
      if (specifier.startsWith('@zerocloud/')) {
        const name = specifier.split('/').slice(0, 2).join('/');
        if (!permitted.includes(name))
          violations.push(`Forbidden import ${specifier} in ${source}.`);
      }
      if (
        ['@zerocloud/share-core', '@zerocloud/share-contracts'].includes(manifest.name) &&
        /^(node:|bun:|electrobun|@capacitor|react)/u.test(specifier)
      ) {
        violations.push(`Platform API in portable code: ${source}.`);
      }
      if (
        specifier.startsWith('.') &&
        !(
          resolve(dirname(source), specifier) === dirname(path) ||
          resolve(dirname(source), specifier).startsWith(dirname(path) + sep)
        )
      )
        violations.push(`Import escapes its package: ${source}.`);
    }
  }
}
if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(
  `Architecture boundaries passed for ${packages} workspaces. One root workspace and lockfile.`,
);
