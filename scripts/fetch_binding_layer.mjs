#!/usr/bin/env node
// Runs the Bundle Pin fetch under the Node permission model, with reads
// limited to the pin, the package and the bundle stores, and writes
// limited to the bundle stores. Gradle and the fetch:binding-layer script
// both enter here.
//
// Usage: node scripts/fetch_binding_layer.mjs --platform <android|ios> [--check-tag]

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';

const PACKAGE = join('node_modules', 'zingolib-bundle-pin');
export const PIN = 'binding-layer.json';
export const IOS_STORE = join('ios', 'binding-layer');
export const STORES = [
  join('android', 'build', 'binding-layer'),
  join('ios', 'build', 'binding-layer'),
  IOS_STORE,
];

export function localCatecashBinding(root) {
  const staged = join(root, IOS_STORE, 'ZingoBindings');
  const pin = JSON.parse(readFileSync(join(root, PIN), 'utf8')).catecash.ios;
  const local = resolve(root, pin.source);
  if (
    !existsSync(staged) ||
    realpathSync(staged) !== realpathSync(local) ||
    !existsSync(join(staged, 'build', 'Zingolib.xcframework', 'Info.plist'))
  ) {
    throw new Error('Stage the local Catecash iOS binding before building');
  }
  for (const [path, expected] of Object.entries(pin.files)) {
    const file = join(staged, path);
    if (!existsSync(file)) {
      throw new Error(`Catecash iOS binding is missing ${path}`);
    }
    const actual = `sha256:${createHash('sha256').update(readFileSync(file)).digest('hex')}`;
    if (actual !== expected) {
      throw new Error(`Catecash iOS binding differs from ${PIN}: ${path}`);
    }
  }
  return staged;
}

export function fetchArgv(root, args) {
  const under = path => join(root, path);
  return [
    '--permission',
    ...[PACKAGE, PIN, ...STORES].map(path => `--allow-fs-read=${under(path)}`),
    ...STORES.map(path => `--allow-fs-write=${under(path)}`),
    under(join(PACKAGE, 'bin', 'fetch_binding_layer.mjs')),
    '--root',
    root,
    ...args,
  ];
}

if (basename(process.argv[1] ?? '') === 'fetch_binding_layer.mjs') {
  const root = resolve(dirname(process.argv[1]), '..');
  if (
    process.env.CATECASH_LOCAL_BINDINGS === '1' &&
    process.argv.slice(2).join(' ') === '--platform ios'
  ) {
    const { status } = spawnSync(
      process.execPath,
      [join(root, 'scripts', 'stage_catecash_ios_bindings.mjs')],
      { cwd: root, stdio: 'inherit' },
    );
    if (status !== 0) process.exit(status ?? 1);
    console.log(localCatecashBinding(root));
    process.exit(0);
  }
  for (const store of STORES) {
    mkdirSync(join(root, store), { recursive: true });
  }
  const { status } = spawnSync(
    process.execPath,
    fetchArgv(root, process.argv.slice(2)),
    {
      cwd: root,
      stdio: 'inherit',
    },
  );
  process.exit(status ?? 1);
}
