#!/usr/bin/env bash
# UNIHACK 2026 - Person 2 API Launcher
# Starts the Timișoara City Hub API server using Node 26 native TypeScript execution

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$HOME/.nvm/versions/node/v26.13.1/bin:$PATH"

echo "🚀 Starting Timișoara City Hub API (P2 Platform)..."
echo "   Directory: $ROOT_DIR"
node --experimental-strip-types services/api/src/server.ts
