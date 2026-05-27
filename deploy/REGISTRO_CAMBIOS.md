# Registro de cambios aplicados — FriendInMe

Documento operativo para soporte, incidencias y despliegues. **Incluido en cada backup** (`deploy/backup_friendinme.sh`).

**Producción:** https://friendinme.pmediaplus.com  
**Ruta proyecto:** `/opt/apps/friendinme`  
**GitHub:** https://github.com/Parvusmedia/friendinmeapp (`main`)  
**Servicios:** `friendinme-api` (puerto 8000), `friendinme-web` (puerto 3010)

---

## Cómo registrar un cambio nuevo

Tras confirmar y aplicar cambios en el servidor:

```bash
/opt/apps/friendinme/deploy/registrar_cambio.sh \
  "Título breve del cambio" \
  "Qué se hizo, archivos o rutas API afectadas. Comandos de despliegue ejecutados."
```

Luego ejecutar backup (o esperar al cron):

```bash
PGPASSWORD=... /opt/apps/friendinme/deploy/backup_friendinme.sh
```

**Despliegue típico (automático):**

```bash
cd /opt/apps/friendinme
git add … && git commit -m "…" && git push origin main
# → GitHub Actions "Deploy FriendInMe" (~40 s)
```

**Despliegue manual** (emergencia o solo en VPS):

```bash
/opt/apps/friendinme/scripts/deploy.sh
# o: cd frontend && npm run build && sudo systemctl restart friendinme-api friendinme-web
```

Instrucciones: `deploy/GITHUB.md`, `deploy/BACKUP.md`.

---

## Historial

<!-- Las entradas nuevas se insertan debajo de esta línea (más reciente primero) -->
### 2026-05-27 — Cron backup diario + deploy adaf662

- **Qué:** Wrapper run-backup-cron.sh (03:30), retención 14 días domingos 04:00, logs en backups/logs/. Deploy manual OK: pytest 18, build Next, systemd active.
- **Despliegue:** (completar si aplica)



### 2026-05-26 — Campañas partner en admin, solicitudes y UX compatibilidad

- **Qué:** Tabla `partner_campaigns` (migración 0007). Panel admin `/panel/partner-campaigns`: activar/desactivar, fechas inicio/fin, textos, segmentación por perro. API pública `GET /api/partner-campaigns/resolve`. Bloques en ficha, resultados, contacto y mis solicitudes. Solicitudes: sin duplicar por perro (`409`), `/mis-solicitudes`, cancelación adoptante (`cancelled`). Match: avisos «no consta» en advertencias y tope de puntuación; resumen rápido estructurado (sin columnas duplicadas). Panel perros: selector de estado (disponible/adoptado/etc.). Contacto: perro visible en formulario.
- **Despliegue:** `git push origin main` → Actions + `alembic upgrade head`. Backup: `deploy/backup_friendinme.sh` (incluye docs).

### 2026-05-25 — GitHub, CI/CD y mejoras de producto

- **Qué:** Repo `Parvusmedia/friendinmeapp`. Deploy automático con GitHub Actions (secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`). CI: pytest + build. Claves SSH: `github_friendinme_ed25519` (git) y `gh_actions_friendinme_ed25519` (Actions). Mejoras: rate limit, magic link resultados, match breakdown, WhatsApp contacto, export CSV adoptantes, stats panel, SEO sitemap, `next/image` en fotos.
- **Despliegue:** `git push origin main` → workflow Deploy OK (~36 s). Docs: `deploy/GITHUB.md`, `deploy/BACKUP.md`.

### 2026-05-21 — Registro de cambios y backup ampliado

- **Qué:** Fichero `deploy/REGISTRO_CAMBIOS.md`, script `registrar_cambio.sh` y backup unificado `backup_friendinme.sh` (BD + uploads + este registro).
- **Despliegue:** Documentación; ejecutar backup manual o vía cron.

### 2026-05-21 — Edición de fichas de perros en panel

- **Qué:** Página `/panel/perros/{id}` — editar datos, subir fotos, portada, eliminar imágenes. Botón **Editar** en listado. API: `PUT /api/dogs/{id}`, `POST /api/dogs/{id}/images`, `POST /api/dogs/{id}/main-image`, `DELETE /api/dogs/{id}/images`.
- **Permisos:** Refugio (sus perros) y admin (todos).
- **Despliegue:** `npm run build` + `systemctl restart friendinme-api friendinme-web`.

### 2026-05-21 — Normalización de razas en importación y filtros

- **Qué:** `normalize_breed()` — variantes (galga, mestiza, labrador mestizo…) → razas canónicas. Aplica en import ZIP, alta/edición, filtros y match. Avisos en vista previa del import.
- **Script opcional BD:** `python -m app.normalize_breeds_db`
- **API:** `GET /api/dogs/breed-options`

### 2026-05-21 — Cuestionario: email primero y perfil reutilizable

- **Qué:** Flujo `/cuestionario` pide email → si existe, revisar/editar respuestas sin repetir todo → match. Desde ficha perro: `/cuestionario?dog={id}` (match solo ese perro).
- **API:** `POST /api/adopters/lookup`, `PUT /api/adopters/{id}`, `POST /api/matches` con `dog_id` opcional.

### 2026-05-21 — Importación masiva ZIP (un ZIP de fotos por perro)

- **Qué:** Panel **Importar ZIP** — `perros.csv` + `fotos/{nombre}.zip` por perro. Vista previa, confirmar, job en background.
- **API:** `GET /api/dogs/import/template`, `POST /api/dogs/import/preview`, `POST /api/dogs/import/{job_id}/confirm`, `GET /api/dogs/import/{job_id}`
- **Env:** `IMPORT_STAGING_DIR`, `MAX_IMPORT_ZIP_MB`, `MAX_PHOTOS_PER_DOG`

### 2026-05-21 — Filtros, razas, solicitudes de refugio (migración 0002)

- **Qué:** Campos `breed`, `breed_preference`, tabla `shelter_applications`. Filtros públicos provincia/raza. Panel solicitudes refugio. Match con preferencia de raza.
- **Migración:** `alembic upgrade head` (0002)
- **Credenciales demo:** `@friendinme.app` (fix EmailStr)

### 2026-05-21 — Home móvil y despliegue inicial MVP

- **Qué:** Landing mobile-first (`page.module.css`), panel admin/refugio, match engine, leads, nginx/systemd en VPS.
- **BD:** `deploy/setup_postgres.sh`, seed demo.

---

## Referencia rápida (incidencias)

| Síntoma | Comprobar |
|--------|-----------|
| Deploy Actions falla | Secrets en repo correcto; `DEPLOY_SSH_KEY` = privada `gh_actions_*`; ver `deploy/GITHUB.md`. No usar "Re-run" en runs previos a secrets. |
| Application error en web | ¿Último Actions verde? ¿`npm run build` + restart `friendinme-web`? Consola F12. |
| 404 en `/panel/perros/123` | Build antiguo sin ruta dinámica — rebuild + restart. |
| API 502 / health | `systemctl status friendinme-api`, `curl 127.0.0.1:8000/health` |
| Fotos no se ven | `UPLOAD_DIR`, nginx `location /media/`, permisos `cursorbot` |
| Import falla permisos | `chown cursorbot:cursorbot /var/lib/friendinme/import_staging` |
| Login rechazado | Emails demo `@friendinme.app`, migraciones al día |
| Bloque partner no sale | Campaña activa y en fechas; `GET /api/partner-campaigns/resolve?placement=…`; panel admin |
| Solicitud duplicada | Normal: `409` — ver `/mis-solicitudes` |
| Perro no en listado público | Estado debe ser **disponible** en panel perros |
| Score compatibilidad alto con huecos | Recalcular en `/resultados`; reglas en `match_engine.py` |

**Logs:**

```bash
journalctl -u friendinme-api -n 80 --no-pager
journalctl -u friendinme-web -n 80 --no-pager
```
