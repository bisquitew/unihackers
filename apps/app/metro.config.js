const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (contracts, solana packages)
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. One copy of React, React Native and the Expo packages, always the app's.
// The repo root still holds old copies hoisted by other workspaces (react 18, react-native 0.74, expo 51, expo-asset 10,
// expo-modules-core 1.x). Anything that lives outside apps/app (packages/ui, map, solana, or an Expo package hoisted to the
// root such as expo-glass-effect) would find those old copies first, and the phone would bundle two engines. Symptoms:
// "Invariant Violation: PlatformConstants could not be found" and "undefined is not a function" in expo-asset/Asset.fx.js.
// For these families, resolve as if the import came from inside the app first; fall back to the normal lookup only if the
// app does not have the package (some Expo packages are nested inside expo itself, so try there too).
const isPinned = (name) =>
  name === 'react' ||
  name === 'react-dom' ||
  name === 'react-native' ||
  name === 'expo' ||
  name.startsWith('expo-') ||
  name.startsWith('react-native-') ||
  name.startsWith('@expo/') ||
  name.startsWith('@react-native/') ||
  name.startsWith('@react-native-');
const appOrigins = [path.join(projectRoot, 'index.js'), path.join(projectRoot, 'node_modules', 'expo', 'index.js')];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest || context.resolveRequest;
  const isBare = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
  const packageName = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
  if (isBare && isPinned(packageName)) {
    for (const originModulePath of appOrigins) {
      try {
        return resolve({ ...context, originModulePath }, moduleName, platform);
      } catch {
        // not found from this location; try the next one, then the normal lookup
      }
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
