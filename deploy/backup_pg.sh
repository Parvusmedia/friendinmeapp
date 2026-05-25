#!/usr/bin/env bash
# Alias retrocompatible: ejecuta el backup completo (BD + uploads + registro).
# Uso: PGPASSWORD=... ./backup_pg.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/backup_friendinme.sh" "$@"
