import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
console.log(`ZeroCloud developer environment\nBun: ${Bun.version}\nRuntime: ${process.execPath}`);
const checks = [
  ['Node.js 24+', Boolean(Bun.which('node'))],
  [
    'Electrobun SDK',
    existsSync(join(root, 'products/share/apps/desktop/.hutch/devkit/tsconfig.json')),
  ],
  ['Android project', existsSync(join(root, 'products/share/apps/android/android/gradlew'))],
  [
    'Android SDK',
    Boolean(
      process.env.ANDROID_HOME ||
        process.env.ANDROID_SDK_ROOT ||
        (process.env.LOCALAPPDATA && existsSync(join(process.env.LOCALAPPDATA, 'Android/Sdk'))),
    ),
  ],
  [
    'JDK configured or Android Studio bundled JDK',
    Boolean(
      process.env.JAVA_HOME ||
        existsSync('C:/Program Files/Android/Android Studio/jbr/bin/java.exe'),
    ),
  ],
] as const;
for (const [name, ready] of checks) console.log(`${ready ? 'READY' : 'SETUP'}  ${name}`);
console.log('\nAndroid only. No iOS project or dependencies are included.');
