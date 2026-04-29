import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const staticDirs = ['apps'];
for (const dirName of staticDirs) {
  const src = resolve(projectRoot, dirName);
  const dest = resolve(distDir, dirName);
  if (!existsSync(src)) continue;
  cpSync(src, dest, { recursive: true, force: true });
}
