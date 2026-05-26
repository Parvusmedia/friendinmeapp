# FriendInMe

Plataforma de adopción responsable: cuestionario de compatibilidad, match orientativo e integración con refugios.

**Producción:** https://friendinme.pmediaplus.com  
**Repositorio:** https://github.com/Parvusmedia/friendinmeapp

## Estructura

- `backend/` — FastAPI + PostgreSQL + Alembic
- `frontend/` — Next.js 14
- `deploy/` — systemd, nginx, backup, GitHub/Actions
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

## Git, CI y despliegue

| Workflow | Cuándo |
|----------|--------|
| **CI** (`.github/workflows/ci.yml`) | Push/PR a `main` — pytest + build |
| **Deploy** (`.github/workflows/deploy.yml`) | Push a `main` — despliega en VPS |

```bash
git push origin main   # despliega automáticamente (~40 s)
```

Documentación operativa:

- [deploy/GITHUB.md](deploy/GITHUB.md) — repo, secrets, claves SSH, SMTP
- [deploy/BACKUP.md](deploy/BACKUP.md) — backup, registro de cambios, despliegue manual
- [deploy/REGISTRO_CAMBIOS.md](deploy/REGISTRO_CAMBIOS.md) — historial e incidencias

## Producción (VPS)

- **Ruta:** `/opt/apps/friendinme`
- **Servicios:** `friendinme-api` (8000), `friendinme-web` (3010)
- **Secretos:** `backend/.env` (no en git); GitHub Actions: `DEPLOY_*` en el repo
