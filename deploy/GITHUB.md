# Despliegue automático con GitHub

Objetivo: **hacer `git push` a `main` y que el VPS actualice código y reinicie servicios**, sin entrar en SSH para cada cambio.

El archivo **`.env` con secretos no va al repositorio** (está en `.gitignore`). En el servidor se crea **una sola vez** a mano o con los valores que ya tengas; los despliegues posteriores solo hacen `git pull` + build + restart.

## 1. Repositorio en GitHub

```bash
cd /opt/apps/friendinme
git init
git remote add origin git@github.com:TU_ORG/friendinme.git
git add -A
git status   # comprueba que NO aparece backend/.env
git commit -m "FriendInMe MVP"
git branch -M main
git push -u origin main
```

Si `backend/.env` aparece en `git status`, **no lo subas**: debe seguir ignorado.

## 2. Clave SSH para GitHub → VPS

En el **VPS** (como `cursorbot`):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_friendinme_deploy -N ""
cat ~/.ssh/github_friendinme_deploy.pub >> ~/.ssh/authorized_keys
```

En GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Contenido |
|--------|-------------|
| `DEPLOY_HOST` | `87.106.194.137` |
| `DEPLOY_USER` | `cursorbot` |
| `DEPLOY_SSH_KEY` | Contenido **privado** de `~/.ssh/github_friendinme_deploy` (el que **no** termina en `.pub`) |

Añade en **`~/.ssh/config`** del VPS (opcional) o usa la clave por defecto para `git pull` desde el mismo usuario.

Mejor: en el VPS, clave **solo para git** hacia GitHub (read access al repo), y otra clave en **GitHub Actions** para SSH al VPS — son dos pares distintos.

**Flujo habitual:**

- **Git clone/pull en el VPS** usa una deploy key con acceso *read/write* o *read* al repo (añadida en GitHub → Deploy keys).
- **GitHub Actions** usa `DEPLOY_SSH_KEY` = clave privada cuya pública está en `authorized_keys` del VPS para que el runner pueda entrar por SSH.

Genera en tu máquina local (o en el VPS) un par solo para CI:

```bash
ssh-keygen -t ed25519 -f gh_actions_friendinme -N ""
```

- Pega `gh_actions_friendinme.pub` en el VPS: `~/.ssh/authorized_keys` (una línea).
- Pega el contenido de `gh_actions_friendinme` en el secret `DEPLOY_SSH_KEY`.

## 3. Sudo sin contraseña solo para reiniciar servicios (recomendado)

En el VPS:

```bash
sudo visudo -f /etc/sudoers.d/friendinme-deploy
```

Contenido (ajusta usuario si no es `cursorbot`):

```
cursorbot ALL=(ALL) NOPASSWD: /bin/systemctl restart friendinme-api, /bin/systemctl restart friendinme-web, /bin/systemctl daemon-reload, /bin/cp /opt/apps/friendinme/deploy/friendinme-api.service /etc/systemd/system/friendinme-api.service, /bin/cp /opt/apps/friendinme/deploy/friendinme-web.service /etc/systemd/system/friendinme-web.service
```

(El `cp` de los units permite que cada despliegue aplique cambios en `ExecStartPre` u opciones de systemd sin SSH manual.)

## 4. Primer despliegue en el VPS

Una vez el código está en GitHub:

```bash
sudo mkdir -p /opt/apps
cd /opt/apps
git clone git@github.com:TU_ORG/friendinme.git
cd friendinme/backend
cp .env.example .env
nano .env   # una sola vez: DATABASE_URL, JWT, CORS, PUBLIC_BASE_URL, UPLOAD_DIR
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && deactivate
alembic upgrade head && source .venv/bin/activate && python -m app.seed && deactivate
cd ../frontend && npm ci && npm run build
sudo cp deploy/friendinme-*.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now friendinme-api friendinme-web
```

## 5. A partir de ahí

Cada merge/push a `main` ejecuta el workflow `.github/workflows/deploy.yml`: `git pull`, dependencias si hace falta, `npm run build`, `sudo systemctl restart …`.

Si cambias **solo secretos** en `.env`, hazlo en el VPS (o automatiza con Ansible/Vault; eso ya es otro nivel).

## ¿Cambia algo si usas GitHub?

- **Código y workflow** viven en el repo.
- **Secretos** siguen fuera del repo: `.env` en servidor y/o GitHub Secrets para generar archivos en CI (si más adelante lo automatizas).
- El dominio y Nginx **no dependen** de GitHub: solo del DNS y del servidor.
