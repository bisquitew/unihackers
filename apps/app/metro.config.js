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

// 3. One copy of React and React Native, always the app's.
// The repo root still holds an old react 18 / react-native 0.74 (hoisted by another workspace). Shared packages
// (packages/ui, map, solana) live outside apps/app, so Metro would find that root copy first and bundle two React
// Native engines, which crashes the phone with "Invariant Violation: PlatformConstants could not be found".
const pinned = new Set(['react', 'react-dom', 'react-native']);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const packageName = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
  const resolve = defaultResolveRequest || context.resolveRequest;
  if (pinned.has(packageName)) {
    // Resolve as if the import came from inside the app, so the app's node_modules wins.
    return resolve({ ...context, originModulePath: path.join(projectRoot, 'index.js') }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
