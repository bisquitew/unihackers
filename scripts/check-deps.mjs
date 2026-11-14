// Fails (or, with --warn, warns) when more than one version of the native app stack is installed.
//
// Why: the phone app must bundle exactly one copy of React, React Native and the Expo packages. When two copies exist
// (for example an old Expo hoisted to the repo root next to the app's own), the app bundles two engines and crashes on a
// phone with errors like "PlatformConstants could not be found" or "undefined is not a function" in expo-asset.
// The root package.json pins these versions so npm installs a single copy; this check notices if that ever breaks.
//
//   npm run check:deps        fails with a non-zero exit code
//   postinstall (--warn)      prints the problem but does not fail the install
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CORE = ['react', 'react-dom', 'react-native', 'expo', 'expo-modules-core', 'expo-asset', 'expo-constants', 'expo-font', '@react-native-async-storage/async-storage'];
const warnOnly = process.argv.includes('--warn');

const nodeModulesDirs = ['node_modules'];
for (const group of ['apps', 'packages', 'services']) {
  if (!existsSync(group)) continue;
  for (const name of readdirSync(group)) nodeModulesDirs.push(join(group, name, 'node_modules'));
}
// packages can also carry their own nested copy (expo ships expo-modules-core inside itself, which is expected)
nodeModulesDirs.push(join('node_modules', 'expo', 'node_modules'));

const found = new Map(); // name -> Map(version -> [locations])
for (const dir of nodeModulesDirs) {
  for (const name of CORE) {
    const manifest = join(dir, name, 'package.json');
    if (!existsSync(manifest)) continue;
    let version;
    try {
      version = JSON.parse(readFileSync(manifest, 'utf8')).version;
    } catch {
      continue;
    }
    const byVersion = found.get(name) ?? new Map();
    byVersion.set(version, [...(byVersion.get(version) ?? []), dir]);
    found.set(name, byVersion);
  }
}

// expo-modules-core is allowed to appear inside expo's own node_modules (and only there, next to a root-level different one is not)
const problems = [];
for (const [name, byVersion] of found) {
  if (byVersion.size > 1) problems.push({ name, byVersion });
}

if (problems.length === 0) {
  console.log('check:deps ok: one copy of each core package (react, react-native, expo, ...).');
  process.exit(0);
}

console.warn('\ncheck:deps: more than one version of a core package is installed. The phone app would bundle two copies and crash.\n');
for (const { name, byVersion } of problems) {
  console.warn(`  ${name}`);
  for (const [version, where] of byVersion) console.warn(`    ${version}  in  ${where.join(', ')}`);
}
console.warn('\nFix: make sure the root package.json lists these packages with the same version range as apps/app/package.json,');
console.warn('then run `npm install` again. If a stale copy keeps coming back, delete its entry from package-lock.json first.\n');
process.exit(warnOnly ? 0 : 1);
