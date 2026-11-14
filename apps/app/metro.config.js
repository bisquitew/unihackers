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
// app does not have the package. Two details matter:
//  - Look from inside `expo` first: some packages the app needs (expo-modules-core 58) are nested in expo's own node_modules,
//    and the root node_modules (listed above for resolution) would otherwise win with its old copy.
//  - Leave imports made from inside apps/app/node_modules alone: that tree already resolves correctly on its own.
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
const appNodeModules = path.join(projectRoot, 'node_modules') + path.sep;
const appOrigins = [path.join(appNodeModules, 'expo', 'index.js'), path.join(projectRoot, 'index.js')];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest || context.resolveRequest;
  const isBare = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
  const packageName = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
  const fromInsideApp = (context.originModulePath || '').startsWith(appNodeModules);
  if (isBare && isPinned(packageName) && !fromInsideApp) {
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

// 4. The phone reaches the API through the dev server. Requests to `/api/...` on the Metro address are forwarded to the
// API (default http://localhost:8000, change with API_PORT), so the same tunnel or Wi-Fi address that loads the app also
// carries its data, and nothing else has to be exposed. The app builds its API address from this (src/core/api.ts).
const http = require('http');
const apiPort = process.env.API_PORT || '8000';
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) return middleware(req, res, next);
    const proxy = http.request(
      { host: '127.0.0.1', port: apiPort, method: req.method, path: req.url.slice(4), headers: { ...req.headers, host: `127.0.0.1:${apiPort}` } },
      (apiRes) => {
        res.writeHead(apiRes.statusCode || 502, apiRes.headers);
        apiRes.pipe(res);
      },
    );
    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'api_unreachable', error_description: `The API is not running on port ${apiPort}.` }));
    });
    req.pipe(proxy);
  },
};

module.exports = config;
