#!/usr/bin/env bash
# Wrapper para cron: carga credenciales desde backend/.env y ejecuta backup completo.
set -euo pipefail

PROJECT_ROOT="/opt/apps/friendinme"
LOG_DIR="${PROJECT_ROOT}/backups/logs"
mkdir -p "$LOG_DIR"

export BACKUP_DIR="${BACKUP_DIR:-/opt/apps/friendinme/backups}"
export PROJECT_ROOT

ENV_FILE="$PROJECT_ROOT/backend/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${PGPASSWORD:-}" && -n "${DATABASE_URL:-}" ]]; then
  PGPASSWORD="$(python3 -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.password or '')")"
  export PGPASSWORD
fi

if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "$(date -Is) ERROR: PGPASSWORD no disponible (backend/.env)" >&2
  exit 1
fi

exec "$PROJECT_ROOT/deploy/backup_friendinme.sh" >>"$LOG_DIR/backup.log" 2>&1
