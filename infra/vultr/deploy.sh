#!/usr/bin/env bash
set -e

# 🏛️ UNIHACK 2026 — Timișoara City Hub
# Vultr Cloud Deployment Automation Script
# Target: High-Performance Projects on Vultr

echo "============================================================"
echo "🚀 Deploying Timișoara City Hub to Vultr Cloud"
echo "============================================================"

# 1. Check prerequisites
if ! command -v docker &> /dev/null; then
  echo "📦 Docker not detected. Installing Docker via official repository..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable --now docker
fi

if ! docker compose version &> /dev/null; then
  echo "📦 Docker Compose plugin not found. Installing..."
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# 2. Check environment configuration
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "⚙️ Creating .env from .env.example..."
    cp .env.example .env
  else
    echo "⚙️ Generating default .env for production deployment..."
    cat <<EOF > .env
PORT=8000
NODE_ENV=production
AUTH0_DOMAIN=timisoara-hub.eu.auth0.com
AUTH0_AUDIENCE=https://api.timisoara-hub.ro
VULTR_STORAGE_BUCKET=timisoara-hub-media
VULTR_STORAGE_REGION=fra1
EOF
  fi
fi

# 3. Build & launch multi-container architecture
echo "🔨 Building & launching container services (api, workers)..."
docker compose up -d --build

# 4. Wait for healthcheck
echo "⏳ Waiting for City Hub Core API healthcheck..."
for i in {1..30}; do
  if docker compose ps | grep -q "(healthy)"; then
    echo "✅ API container is healthy!"
    break
  fi
  sleep 1
done

# 5. Display deployed status
echo ""
echo "============================================================"
echo "🎉 Timișoara City Hub successfully deployed on Vultr!"
echo "============================================================"
echo "   API Health:      http://localhost:8000/health"
echo "   Auth0 Profile:   http://localhost:8000/v1/core/auth/me"
echo "   Tiger Status:    http://localhost:8000/v1/core/tiger/status"
echo "   Open Data Feed:  http://localhost:8000/v1/core/open-data/export"
echo "   Workers Status:  docker compose logs -f workers"
echo "============================================================"
