# Backup y registro de cambios

## Registro de cambios (`REGISTRO_CAMBIOS.md`)

Fichero para soporte e incidencias. Incluye historial de lo desplegado en producción y tabla de diagnóstico rápido.

**Añadir entrada** (tras cada cambio confirmado):

```bash
/opt/apps/friendinme/deploy/registrar_cambio.sh \
  "Título del cambio" \
  "Detalle: qué archivos/API, comandos de build/restart."
```

## Backup completo

```bash
export PGPASSWORD='tu_password_postgres'
/opt/apps/friendinme/deploy/backup_friendinme.sh
```

Genera en `BACKUP_DIR` (por defecto `/var/backups/friendinme`):

| Artefacto | Contenido |
|-----------|-----------|
| `friendinme_backup_YYYYMMDD_HHMMSS.tar.gz` | Dump SQL + uploads + `REGISTRO_CAMBIOS.md` + `manifest.txt` |
| `REGISTRO_CAMBIOS_LATEST.md` | Última copia del registro (fácil de enviar por email) |
| `friendinme_YYYYMMDD_HHMMSS.sql.gz` | Solo BD (compatibilidad con cron antiguo) |
| `latest_full_backup.tar.gz` | Enlace al último tarball completo |

`backup_pg.sh` redirige al script completo.

## Cron ejemplo

```cron
0 3 * * * cursorbot PGPASSWORD=xxx /opt/apps/friendinme/deploy/backup_friendinme.sh >> /var/log/friendinme-backup.log 2>&1
```
