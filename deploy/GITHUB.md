# GitHub y despliegue automático

**Repositorio:** https://github.com/Parvusmedia/friendinmeapp  
**Rama de producción:** `main`  
**Producción:** https://friendinme.pmediaplus.com  
**Código en VPS:** `/opt/apps/friendinme`

Objetivo: **`git push` a `main` → GitHub Actions despliega en el VPS** (~40 s): pull, tests, migraciones, build Next.js, restart de servicios.

El **`.env` del backend no va al repo** (`.gitignore`). Los cambios de secretos en servidor se hacen solo en `/opt/apps/friendinme/backend/.env` (SMTP, JWT, BD, etc.).

---

## Flujo habitual (ya configurado)

```text
Editar código → commit → git push origin main
    → Workflow "Deploy FriendInMe" (Actions)
    → SSH al VPS → git reset --hard origin/main → pytest → alembic → npm build → systemctl restart
```

- **CI** (`.github/workflows/ci.yml`): pytest + `npm run build` en push/PR (no despliega).
- **Deploy** (`.github/workflows/deploy.yml`): solo en push a `main` (y manual *Run workflow*).

Comprobar despliegues: https://github.com/Parvusmedia/friendinmeapp/actions

**No uses** “Re-run failed jobs” en runs que fallaron antes de configurar secrets; usa **Run workflow** en el workflow más reciente.

---

## Dos claves SSH (no mezclar)

| Dirección | Archivo en VPS | Dónde se registra |
|-----------|----------------|-------------------|
| **VPS → GitHub** (`git push` / `git pull`) | `~/.ssh/github_friendinme_ed25519` | Repo → **Settings → Deploy keys** (clave `.pub`, con *Allow write access*) |
| **GitHub Actions → VPS** (deploy SSH) | `~/.ssh/gh_actions_friendinme_ed25519` | Secret `DEPLOY_SSH_KEY` + línea en `~/.ssh/authorized_keys` |

`~/.ssh/config` del usuario `cursorbot` (para GitHub):

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_friendinme_ed25519
  IdentitiesOnly yes
```

Remote del proyecto:

```bash
git remote -v
# origin  git@github.com:Parvusmedia/friendinmeapp.git
```

---

## Secrets de GitHub Actions

**Ruta:** https://github.com/Parvusmedia/friendinmeapp/settings/secrets/actions  
Pestaña **Repository secrets** (no *Variables*, no *Environment* salvo que los vincules al repo).

| Secret | Valor |
|--------|--------|
| `DEPLOY_HOST` | `87.106.194.137` |
| `DEPLOY_USER` | `cursorbot` |
| `DEPLOY_SSH_KEY` | Salida completa de `cat ~/.ssh/gh_actions_friendinme_ed25519` (incluye `-----BEGIN OPENSSH PRIVATE KEY-----` … `-----END …`) |

Comprobar huella de la clave pública de Actions:

```bash
ssh-keygen -lf ~/.ssh/gh_actions_friendinme_ed25519.pub
# SHA256:/WIEkOJESpv2yg7ny4tVf32iPP8hD6XMFr36gAgtUu0
```

Errores habituales:

- **missing server host** → falta `DEPLOY_HOST` o nombre mal escrito.
- **Permission denied (publickey)** → `DEPLOY_SSH_KEY` incorrecta (p. ej. pegaste la de `github_friendinme_*` o solo la `.pub`).
- Pegaste la clave **pública** en el secret → debe ser la **privada**.

Más detalle: [GITHUB_ACTIONS_SECRETS.md](./GITHUB_ACTIONS_SECRETS.md)

---

## Sudo sin contraseña (reinicios en deploy)

Archivo `/etc/sudoers.d/friendinme-deploy`:

```
cursorbot ALL=(ALL) NOPASSWD: /bin/systemctl restart friendinme-api, /bin/systemctl restart friendinme-web, /bin/systemctl daemon-reload, /bin/cp /opt/apps/friendinme/deploy/friendinme-api.service /etc/systemd/system/friendinme-api.service, /bin/cp /opt/apps/friendinme/deploy/friendinme-web.service /etc/systemd/system/friendinme-web.service
```

```bash
sudo visudo -c -f /etc/sudoers.d/friendinme-deploy
```

---

## Clonar el proyecto en un VPS nuevo

```bash
sudo mkdir -p /opt/apps
cd /opt/apps
git clone git@github.com:Parvusmedia/friendinmeapp.git friendinme
cd friendinme/backend
cp .env.example .env
nano .env   # DATABASE_URL, JWT, CORS, PUBLIC_BASE_URL, UPLOAD_DIR, SMTP (opcional)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seed   # opcional demo
cd ../frontend && npm ci && npm run build
sudo cp deploy/friendinme-*.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now friendinme-api friendinme-web
```

Configura deploy key + secrets de Actions como arriba.

---

## Despliegue manual (emergencia)

Si Actions no está disponible:

```bash
/opt/apps/friendinme/scripts/deploy.sh
```

Equivalente a: pull, `pytest`, `alembic upgrade head`, `npm ci && npm run build`, restart servicios.

---

## SMTP (emails)

No va en GitHub Secrets (por ahora). Variables en `backend/.env`:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`
- `PUBLIC_BASE_URL=https://friendinme.pmediaplus.com` (enlaces en emails de resultados)

Sin SMTP configurado, la API sigue funcionando; los emails se registran en log.

---

## Documentación relacionada

- [DESPLIEGUE_PMDIAPLUS.md](./DESPLIEGUE_PMDIAPLUS.md) — DNS, Nginx, SSL
- [BACKUP.md](./BACKUP.md) — backups y registro de cambios
- [REGISTRO_CAMBIOS.md](./REGISTRO_CAMBIOS.md) — historial operativo
