# FriendInMe

Plataforma de adopción responsable: cuestionario de compatibilidad, match orientativo e integración con refugios.

## Estructura

- `backend/` — FastAPI + PostgreSQL + Alembic
- `frontend/` — Next.js 14
- `deploy/` — systemd, nginx, documentación de despliegue
- `scripts/deploy.sh` — despliegue manual en el VPS

## Desarrollo local

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # editar DATABASE_URL, JWT, etc.
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm ci && npm run dev
```

Tests: `cd backend && .venv/bin/python -m pytest tests -q`

## Git y CI

- **CI** (`.github/workflows/ci.yml`): pytest + `npm run build` en cada push/PR a `main`.
- **Deploy** (`.github/workflows/deploy.yml`): SSH al VPS tras push a `main` (requiere secrets en GitHub).

Configuración paso a paso: [deploy/GITHUB.md](deploy/GITHUB.md)

## Producción

Dominio: https://friendinme.pmediaplus.com

Servicios: `friendinme-api` (8000), `friendinme-web` (3010).
