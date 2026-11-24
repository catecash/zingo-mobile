#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pin = JSON.parse(readFileSync(join(root, 'binding-layer.json'), 'utf8')).catecash.ios;
const source = resolve(root, pin.source);
const staged = join(root, 'ios', 'binding-layer', 'ZingoBindings');

for (const file of [
  'Package.swift',
  join('build', 'Zingolib.xcframework', 'Info.plist'),
  join('build', 'Sources', 'ZingoBindings', 'zingo.swift'),
]) {
  if (!existsSync(join(source, file))) {
    throw new Error(`Catecash iOS binding is missing ${file}`);
  }
}

mkdirSync(dirname(staged), { recursive: true });
rmSync(staged, { recursive: true, force: true });
symlinkSync(source, staged, 'dir');
console.log(staged);
