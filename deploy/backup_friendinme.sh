#!/usr/bin/env bash
# Backup FriendInMe: PostgreSQL + uploads + registro de cambios (+ copia opcional .env sin secretos en manifest).
#
# Uso:
#   PGPASSWORD=... /opt/apps/friendinme/deploy/backup_friendinme.sh
#
# Variables:
#   PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
#   BACKUP_DIR (default /var/backups/friendinme)
#   PROJECT_ROOT (default /opt/apps/friendinme)
#   UPLOAD_DIR (default desde backend/.env UPLOAD_DIR o /var/lib/friendinme/uploads)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${PROJECT_ROOT:=/opt/apps/friendinme}"
: "${PGDATABASE:=friendinme}"
: "${BACKUP_DIR:=/var/backups/friendinme}"
: "${UPLOAD_DIR:=}"

if [[ -z "$UPLOAD_DIR" && -f "$PROJECT_ROOT/backend/.env" ]]; then
  UPLOAD_DIR="$(grep -E '^UPLOAD_DIR=' "$PROJECT_ROOT/backend/.env" | cut -d= -f2- | tr -d '"' || true)"
fi
: "${UPLOAD_DIR:=/var/lib/friendinme/uploads}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
MANIFEST_DIR="$BACKUP_DIR/run_${STAMP}"
mkdir -p "$MANIFEST_DIR"

echo "==> Backup PostgreSQL"
export PGPASSWORD="${PGPASSWORD:?set PGPASSWORD}"
DB_OUT="$MANIFEST_DIR/${PGDATABASE}_${STAMP}.sql.gz"
pg_dump -h "${PGHOST:-127.0.0.1}" -p "${PGPORT:-5432}" -U "${PGUSER:-friendinme}" "$PGDATABASE" | gzip > "$DB_OUT"
echo "    $DB_OUT"

REGISTRO_SRC="$SCRIPT_DIR/REGISTRO_CAMBIOS.md"
if [[ -f "$REGISTRO_SRC" ]]; then
  cp "$REGISTRO_SRC" "$MANIFEST_DIR/REGISTRO_CAMBIOS.md"
  cp "$REGISTRO_SRC" "$BACKUP_DIR/REGISTRO_CAMBIOS_LATEST.md"
  echo "==> Registro de cambios copiado"
fi

DOCS_DIR="$MANIFEST_DIR/deploy_docs"
mkdir -p "$DOCS_DIR"
for f in "$SCRIPT_DIR"/*.md; do
  [[ -f "$f" ]] && cp "$f" "$DOCS_DIR/"
done
if [[ -f "$PROJECT_ROOT/README.md" ]]; then
  cp "$PROJECT_ROOT/README.md" "$DOCS_DIR/PROJECT_README.md"
fi
echo "==> Documentación deploy/ + README copiada"

if [[ -d "$UPLOAD_DIR" ]]; then
  UP_OUT="$MANIFEST_DIR/uploads_${STAMP}.tar.gz"
  tar -czf "$UP_OUT" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
  echo "==> Uploads: $UP_OUT"
else
  echo "==> Uploads: omitido (no existe $UPLOAD_DIR)"
fi

# Manifest ligero (versiones, sin contraseñas)
{
  echo "timestamp=$STAMP"
  echo "hostname=$(hostname -f 2>/dev/null || hostname)"
  echo "project_root=$PROJECT_ROOT"
  if command -v git >/dev/null 2>&1 && [[ -d "$PROJECT_ROOT/.git" ]]; then
    echo "git_commit=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo n/a)"
    echo "git_branch=$(git -C "$PROJECT_ROOT" describe --all --exact-match 2>/dev/null || git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo n/a)"
  fi
  systemctl is-active friendinme-api 2>/dev/null | sed 's/^/friendinme-api=/' || true
  systemctl is-active friendinme-web 2>/dev/null | sed 's/^/friendinme-web=/' || true
} > "$MANIFEST_DIR/manifest.txt"

ARCHIVE="$BACKUP_DIR/friendinme_backup_${STAMP}.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "run_${STAMP}"
cp "$MANIFEST_DIR/${PGDATABASE}_${STAMP}.sql.gz" "$BACKUP_DIR/${PGDATABASE}_${STAMP}.sql.gz"
ln -sfn "$(basename "$ARCHIVE")" "$BACKUP_DIR/latest_full_backup.tar.gz"
rm -rf "$MANIFEST_DIR"

echo ""
echo "Backup completo: $ARCHIVE"
echo "Registro (última copia): $BACKUP_DIR/REGISTRO_CAMBIOS_LATEST.md"
