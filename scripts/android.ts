import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const tasks = new Set([
  'test',
  'assembleDebug',
  'lint',
  'connectedDebugAndroidTest',
  'compileDebugAndroidTestJavaWithJavac',
]);
const task = process.argv[2] ?? 'test';
if (!tasks.has(task)) throw new Error('Unsupported Android build task.');
const root = resolve(import.meta.dir, '..');
const javaCandidates = [
  process.env.JAVA_HOME,
  process.platform === 'win32' ? 'C:/Program Files/Android/Android Studio/jbr' : undefined,
  process.platform === 'darwin'
    ? '/Applications/Android Studio.app/Contents/jbr/Contents/Home'
    : undefined,
].filter((value): value is string => Boolean(value));
const javaHome = javaCandidates.find((value) =>
  existsSync(join(value, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')),
);
const sdk =
  process.env.ANDROID_HOME ??
  process.env.ANDROID_SDK_ROOT ??
  (process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android/Sdk') : undefined);
const cwd = join(root, 'products/share/apps/android/android');
if (!existsSync(cwd))
  throw new Error('Generate the Android project with bun run android:sync first.');
const args = [task, '--no-daemon', '--console=plain'];
const child = Bun.spawn(
  process.platform === 'win32'
    ? ['cmd.exe', '/d', '/c', 'gradlew.bat', ...args]
    : ['sh', './gradlew', ...args],
  {
    cwd,
    env: {
      ...process.env,
      ...(javaHome ? { JAVA_HOME: javaHome } : {}),
      ...(sdk ? { ANDROID_HOME: sdk } : {}),
      GRADLE_USER_HOME: process.env.GRADLE_USER_HOME ?? join(root, '.cache/gradle'),
    },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
);
process.exit(await child.exited);
