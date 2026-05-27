# FriendInMe

Plataforma de adopción responsable: cuestionario de compatibilidad, match orientativo, solicitudes a refugios y espacios publicitarios configurables.

**Producción:** https://friendinme.pmediaplus.com  
**Repositorio:** https://github.com/Parvusmedia/friendinmeapp

## Funcionalidades principales

### Público (adoptantes)

| Área | Rutas | Notas |
|------|-------|--------|
| Home y listado | `/`, `/perros` | Filtros provincia, tamaño, energía, edad, raza; compatibilidad tras cuestionario |
| Ficha perro | `/perros/[id]` | Galería, bloques informativos, match en sesión |
| Cuestionario | `/cuestionario` | Preferencias al inicio; `?dog=` omite preferencias y enfoca un perro |
| Resultados | `/resultados` | Vista detallada de compatibilidad; resumen por bloques |
| Contacto | `/contacto` | Solicitud al refugio; sin duplicados por perro |
| Mis solicitudes | `/mis-solicitudes` | Estado, cancelación por el adoptante |
| Partners (UI) | Varias | Bloques patrocinados según campaña activa en BD |

### Panel refugio / admin

| Área | Rutas | Notas |
|------|-------|--------|
| Perros | `/panel/perros` | Estado disponible/reservado/adoptado/oculto; solo **disponible** es público |
| Edición ficha | `/panel/perros/[id]` | Datos, fotos, IA resumen |
| Import ZIP | `/panel/perros/importar` | CSV + ZIP por perro |
| Leads | `/panel/leads` | Solicitudes de contacto |
| Campañas partner | `/panel/partner-campaigns` | **Solo admin** — activación, fechas, contenido, segmentación |

### API destacada

- `POST /api/matches` — match con breakdown y opcional IA
- `GET /api/partner-campaigns/resolve` — bloque publicitario resuelto por ubicación y perro
- `GET/POST /api/partner-campaigns` — CRUD admin (JWT admin)
- `GET /api/leads/check`, `GET /api/leads/adopter/{id}`, `POST /api/leads/{id}/cancel`
- `PATCH /api/dogs/{id}/status` — publicación según `DogStatus`

Migraciones Alembic: `backend/migrations/versions/` (última: `0007_partner_campaigns`).

## Estructura del proyecto

- `backend/` — FastAPI + PostgreSQL + Alembic
- `frontend/` — Next.js 14
- `deploy/` — systemd, nginx, backup, documentación operativa
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

Variables útiles: ver `backend/.env.example` (`OPENAI_API_KEY`, rate limits, SMTP, `UPLOAD_DIR`).

## Git, CI y despliegue

| Workflow | Cuándo |
|----------|--------|
| **CI** (`.github/workflows/ci.yml`) | Push/PR a `main` — pytest + build |
| **Deploy** (`.github/workflows/deploy.yml`) | Push a `main` — despliega en VPS |

```bash
git push origin main   # despliega automáticamente (~40 s)
```

## Documentación operativa

| Documento | Contenido |
|-----------|-----------|
| [deploy/BACKUP.md](deploy/BACKUP.md) | Backup completo, cron, despliegue manual |
| [deploy/REGISTRO_CAMBIOS.md](deploy/REGISTRO_CAMBIOS.md) | Historial de cambios en producción |
| [deploy/GITHUB.md](deploy/GITHUB.md) | Repo, secrets, SSH, SMTP |
| [deploy/DESPLIEGUE_PMDIAPLUS.md](deploy/DESPLIEGUE_PMDIAPLUS.md) | DNS, Nginx, SSL |

### Backup rápido

```bash
export PGPASSWORD='…'   # usuario PostgreSQL
/opt/apps/friendinme/deploy/backup_friendinme.sh
```

Incluye: dump SQL, uploads, `REGISTRO_CAMBIOS.md`, documentación `deploy/*.md`, `manifest.txt` (commit git, servicios).

## Producción (VPS)

- **Ruta:** `/opt/apps/friendinme`
- **Servicios:** `friendinme-api` (8000), `friendinme-web` (3010)
- **Secretos:** `backend/.env` (no en git); GitHub Actions: `DEPLOY_*` en el repo
- **Backups:** `/var/backups/friendinme` (por defecto)
