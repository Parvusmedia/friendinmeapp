# Backup, registro de cambios e instrucciones operativas

**Producción:** https://friendinme.pmediaplus.com  
**VPS Ubuntu:** `87.106.194.137` — usuario `cursorbot`  
**Código:** `/opt/apps/friendinme`  
**GitHub:** https://github.com/Parvusmedia/friendinmeapp (rama `main`)

---

## Despliegue de cambios

### Automático (recomendado)

```bash
cd /opt/apps/friendinme
git add … && git commit -m "…" && git push origin main
```

GitHub Actions ejecuta **Deploy FriendInMe** (~40 s): pull, pytest, migraciones, `npm run build`, restart `friendinme-api` y `friendinme-web`.

- Actions: https://github.com/Parvusmedia/friendinmeapp/actions  
- Configuración secrets/SSH: [GITHUB.md](./GITHUB.md)

### Manual (si Actions falla)

```bash
/opt/apps/friendinme/scripts/deploy.sh
```

O solo frontend/API en caliente:

```bash
cd /opt/apps/friendinme/frontend && npm run build
sudo systemctl restart friendinme-api friendinme-web
```

### Solo secretos en servidor (`.env`, SMTP)

Editar **sin** push:

```bash
nano /opt/apps/friendinme/backend/.env
sudo systemctl restart friendinme-api
```

Variables SMTP: ver `backend/.env.example` y [GITHUB.md](./GITHUB.md#smtp-emails).

---

## Registro de cambios (`REGISTRO_CAMBIOS.md`)

Fichero para soporte e incidencias. Historial de lo desplegado y tabla de diagnóstico.

**Incluido en cada backup completo.**

### Añadir entrada tras un cambio

```bash
/opt/apps/friendinme/deploy/registrar_cambio.sh \
  "Título del cambio" \
  "Detalle: qué archivos/API. Despliegue: push a main / manual / solo .env."
```

---

## Backup completo

```bash
export PGPASSWORD='tu_password_postgres'
/opt/apps/friendinme/deploy/backup_friendinme.sh
```

Genera en `BACKUP_DIR` (por defecto `/var/backups/friendinme`):

| Artefacto | Contenido |
|-----------|-----------|
| `friendinme_backup_YYYYMMDD_HHMMSS.tar.gz` | Dump SQL + uploads + `REGISTRO_CAMBIOS.md` + `manifest.txt` |
| `REGISTRO_CAMBIOS_LATEST.md` | Última copia del registro |
| `friendinme_YYYYMMDD_HHMMSS.sql.gz` | Solo BD |
| `latest_full_backup.tar.gz` | Enlace al último tarball |

`backup_pg.sh` redirige al script completo.

Cada tarball incluye `manifest.txt` con rutas y fecha; el registro operativo va en `REGISTRO_CAMBIOS.md` dentro del backup.

---

## Cron ejemplo

```cron
0 3 * * * cursorbot PGPASSWORD=xxx /opt/apps/friendinme/deploy/backup_friendinme.sh >> /var/log/friendinme-backup.log 2>&1
```

---

## Servicios y logs

| Servicio | Puerto | Comando útil |
|----------|--------|----------------|
| `friendinme-api` | 8000 | `curl -s http://127.0.0.1:8000/health` |
| `friendinme-web` | 3010 | `systemctl status friendinme-web` |

```bash
journalctl -u friendinme-api -n 80 --no-pager
journalctl -u friendinme-web -n 80 --no-pager
```

---

## Documentación relacionada

| Fichero | Contenido |
|---------|-----------|
| [REGISTRO_CAMBIOS.md](./REGISTRO_CAMBIOS.md) | Historial y diagnóstico rápido |
| [GITHUB.md](./GITHUB.md) | Repo, Actions, claves SSH, secrets, SMTP |
| [DESPLIEGUE_PMDIAPLUS.md](./DESPLIEGUE_PMDIAPLUS.md) | DNS, Nginx, SSL |
| [NGINX_SSL_Y_PUERTO.md](./NGINX_SSL_Y_PUERTO.md) | Certificados y proxy |
