// Starts the Expo dev server with a tunnel (works from any network, for testing on a phone) and keeps it alive when the
// tunnel has a network hiccup. See keep-alive-on-network-errors.cjs for why.
//
//   npm run dev:app:tunnel:stable             start with the tunnel
//   npm run dev:app:tunnel:stable -- --web    extra flags are passed to `expo start`
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'apps', 'app');
const expoCli = createRequire(join(appDir, 'package.json')).resolve('expo/bin/cli');
// NODE_OPTIONS treats a backslash as an escape character, so the path must use forward slashes (works on Windows too).
const guard = join(root, 'scripts', 'keep-alive-on-network-errors.cjs').replace(/\\/g, '/');

const child = spawn(process.execPath, [expoCli, 'start', '--tunnel', ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require "${guard}"`.trim() },
});
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
