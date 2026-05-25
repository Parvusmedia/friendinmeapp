#!/usr/bin/env bash
# Despliegue manual en el VPS (misma secuencia que GitHub Actions).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -d .git ]; then
  git fetch origin main 2>/dev/null && git reset --hard origin/main || true
fi

echo "==> Backend"
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  echo "Crea .venv primero: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -m pytest tests -q
.venv/bin/alembic upgrade head

echo "==> Frontend"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Systemd"
sudo cp "$ROOT/deploy/friendinme-api.service" /etc/systemd/system/
sudo cp "$ROOT/deploy/friendinme-web.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart friendinme-api friendinme-web
sudo systemctl is-active friendinme-api friendinme-web

echo "Deploy OK."
