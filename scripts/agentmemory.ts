import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const runtime = join(root, '.agentmemory');
const profile = join(runtime, 'profile');
const data = join(runtime, 'data', 'instance-1');
const baseUrl = 'http://127.0.0.1:3211';
const project = 'ZeroCloud';
const [action = 'help', ...args] = process.argv.slice(2);
const cliActions = new Set(['start', 'stop', 'status', 'doctor', 'version']);

if (!cliActions.has(action) && !['mcp', 'recall', 'remember'].includes(action)) {
  console.log('Usage: bun run memory <start|stop|status|doctor|version|mcp|recall|remember>');
  console.log('Recall: bun run memory recall "search terms"');
  console.log('Save:   bun run memory remember "decision and reason"');
  process.exit(action === 'help' ? 0 : 1);
}
if (['recall', 'remember'].includes(action) && args.length === 0) {
  console.error(`${action} requires text.`);
  process.exit(1);
}

mkdirSync(data, { recursive: true, mode: 0o700 });
mkdirSync(profile, { recursive: true, mode: 0o700 });
const secretPath = join(data, 'secret');
if (!existsSync(secretPath)) {
  try {
    writeFileSync(secretPath, `${randomBytes(32).toString('hex')}\n`, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
}
const secret = readFileSync(secretPath, 'utf8').trim();
if (!secret) throw new Error(`The project memory secret is empty: ${secretPath}`);

const envFile = join(runtime, '.env');
if (!existsSync(envFile)) {
  writeFileSync(
    envFile,
    '# ZeroCloud-only AgentMemory settings. No provider or API key is required.\n' +
      'AGENTMEMORY_AUTO_COMPRESS=false\n' +
      'AGENTMEMORY_INJECT_CONTEXT=false\n' +
      'AGENTMEMORY_ALLOW_AGENT_SDK=false\n' +
      'CLAUDE_MEMORY_BRIDGE=false\n',
    { flag: 'wx', mode: 0o600 },
  );
}

// Forward operating-system settings, never another project's memory/provider configuration.
const inherited = new Set([
  'PATH',
  'SYSTEMROOT',
  'WINDIR',
  'SYSTEMDRIVE',
  'COMSPEC',
  'PATHEXT',
  'TEMP',
  'TMP',
  'PROCESSOR_ARCHITECTURE',
  'NUMBER_OF_PROCESSORS',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'NODE_EXTRA_CA_CERTS',
  'SSL_CERT_FILE',
]);
const env: NodeJS.ProcessEnv = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => inherited.has(key.toUpperCase())),
  ),
  USERPROFILE: profile,
  APPDATA: join(profile, 'AppData', 'Roaming'),
  LOCALAPPDATA: join(profile, 'AppData', 'Local'),
  CI: '1',
  AGENTMEMORY_URL: baseUrl,
  AGENTMEMORY_SECRET: secret,
  AGENTMEMORY_CREDENTIAL_MODE: 'explicit',
  AGENTMEMORY_FORCE_PROXY: 'true',
  AGENTMEMORY_DATA_DIR: data,
  AGENTMEMORY_RUNTIME_DIR: data,
  AGENTMEMORY_ENV_FILE: envFile,
  AGENTMEMORY_IMPORT_ROOT: root,
  AGENTMEMORY_EXPORT_ROOT: runtime,
  AGENTMEMORY_VIEWER_HOST: '127.0.0.1',
  AGENTMEMORY_STATE_SAVE_INTERVAL_MS: '1000',
  AGENTMEMORY_TOOLS: 'all',
  AGENTMEMORY_SLOTS: 'true',
  III_REST_PORT: '3211',
  III_VIEWER_PORT: '3213',
  III_ENGINE_PORT: '49234',
  III_TELEMETRY_ENABLED: 'false',
};

const require = createRequire(import.meta.url);
const manifestPath = require.resolve('@agentmemory/agentmemory/package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { bin: { agentmemory: string } };
const cli = resolve(dirname(manifestPath), manifest.bin.agentmemory);
const node = Bun.which('node');
if (!node) throw new Error('Node.js 24 or newer is required.');

async function run(entry: string, arguments_: string[], startup = false): Promise<number> {
  const child = spawn(node as string, [entry, ...arguments_], {
    cwd: root,
    env,
    windowsHide: true,
    stdio: startup ? ['ignore', 2, 2] : 'inherit',
  });
  return await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolveExit(code ?? 1));
  });
}

function cliArgs(command: string): string[] {
  return [
    ...(command === 'start' ? [] : [command === 'version' ? '--version' : command]),
    '--instance',
    '1',
    '--data-dir',
    join(runtime, 'data'),
  ];
}

async function request(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${baseUrl}/agentmemory/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Project memory ${path} returned HTTP ${response.status}.`);
  return await response.json();
}

async function ensureStarted(): Promise<void> {
  // Authentication prevents adopting a different project's daemon on this port.
  const response = await fetch(`${baseUrl}/agentmemory/health`, {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: 'error',
    signal: AbortSignal.timeout(1500),
  }).catch(() => null);
  if (response) {
    if (!response.ok) throw new Error(`Project memory health returned HTTP ${response.status}.`);
    const health = (await response.json()) as { service?: string };
    if (health.service !== 'agentmemory') throw new Error('Port 3211 belongs to another service.');
    return;
  }
  const exitCode = await run(cli, cliArgs('start'), true);
  if (exitCode !== 0) throw new Error(`Project memory startup exited with ${exitCode}.`);
  await request('health');
}

try {
  if (cliActions.has(action)) {
    process.exit(await run(cli, cliArgs(action)));
  }
  await ensureStarted();
  if (action === 'mcp') {
    process.exit(await run(require.resolve('@agentmemory/agentmemory/dist/standalone.mjs'), []));
  }
  const text = args.join(' ');
  let result: unknown;
  if (action === 'recall') {
    const matches = (await request('smart-search', { query: text, project, limit: 5 })) as {
      results: { obsId: string }[];
    };
    result = matches;
    if (matches.results.length > 0) {
      const expanded = (await request('smart-search', {
        expandIds: matches.results.map((match) => match.obsId),
        project,
      })) as Record<string, unknown>;
      result = { ...matches, ...expanded };
    }
  } else {
    result = await request('remember', { content: text, project, concepts: ['zerocloud'] });
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
