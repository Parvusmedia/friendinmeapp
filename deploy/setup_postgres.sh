#!/usr/bin/env bash
# Crea/ajusta usuario y BD PostgreSQL para FriendInMe y aplica migraciones + seed.
# Uso: bash /opt/apps/friendinme/deploy/setup_postgres.sh
set -euo pipefail

ROOT="/opt/apps/friendinme"
DB_USER="friendinme"
DB_NAME="friendinme"
DB_PASS="friendinme"

echo "==> PostgreSQL: usuario y base de datos"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Usuario ${DB_USER} creado';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Contraseña de ${DB_USER} actualizada';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | tr -d ' ' | grep -qx "${DB_NAME}"; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
  echo "Base de datos ${DB_NAME} creada"
else
  echo "Base de datos ${DB_NAME} ya existía"
fi

sudo -u postgres psql -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c \
  "GRANT ALL ON SCHEMA public TO ${DB_USER}; ALTER SCHEMA public OWNER TO ${DB_USER};"

echo "==> Alembic + seed"
cd "${ROOT}/backend"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seed

echo "==> Reiniciar API"
sudo systemctl restart friendinme-api
sleep 2

echo "==> Comprobación"
curl -sf "http://127.0.0.1:8000/api/dogs?limit=1" | head -c 200
echo ""
echo "Listo. DATABASE_URL en .env debe ser:"
echo "postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
