import { cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

const root = resolve(import.meta.dir, '..');
const desktop = join(root, 'products/share/apps/desktop');
const target = resolve(desktop, '.prepared/ui');
if (!target.startsWith(`${desktop}${sep}`)) throw new Error('Invalid desktop asset destination.');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(join(root, 'products/share/apps/web/dist'), target, { recursive: true });
console.log('Shared interface prepared for Electrobun.');
