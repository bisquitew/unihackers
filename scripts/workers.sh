#!/usr/bin/env bash
# UNIHACK 2026 - Netrom Glue Ingestion Engine Launcher

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$HOME/.nvm/versions/node/v26.13.1/bin:$PATH"

echo "⚡ Starting Netrom Glue Ingestion Workers..."
echo "   Directory: $ROOT_DIR"
node --experimental-strip-types services/workers/src/index.ts
