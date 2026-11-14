// Preload for the Expo dev server: keeps it running when the *tunnel* hits a network hiccup.
//
// Expo's tunnel client sometimes throws a one-off network error (DNS lookup fails, the tunnel service answers 409 because
// the previous session has not expired yet, the connection resets). Expo's CLI does not catch those, so a single hiccup
// ends the whole dev server, the QR code stops working, and the phone shows "couldn't connect".
// This script swallows exactly those network errors (and logs them) so Metro, the web build and any already connected
// device keep working. Every other error still stops the process, as it would normally.
//
// Use it through `npm run dev:app:tunnel:stable`, or manually: NODE_OPTIONS="--require ./scripts/keep-alive-on-network-errors.cjs".
const NETWORK_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE']);

function isTunnelNoise(err) {
  const code = err && err.code;
  const message = String((err && err.message) || err);
  if (NETWORK_CODES.has(code)) return true;
  return /Unexpected server response: 409|ngrok|tunnel|on\.expo\.(app|dev)/i.test(message);
}

function handle(err, origin) {
  if (isTunnelNoise(err)) {
    console.warn(`[keep-alive] ignored a tunnel/network error that would have stopped the dev server (${origin}): ${(err && err.code) || ''} ${String((err && err.message) || err).slice(0, 140)}`);
    return;
  }
  // not ours: behave exactly as Node does without a handler
  process.removeListener('uncaughtException', onUncaught);
  throw err;
}
function onUncaught(err) {
  handle(err, 'uncaughtException');
}
process.on('uncaughtException', onUncaught);
process.on('unhandledRejection', (reason) => handle(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection'));
