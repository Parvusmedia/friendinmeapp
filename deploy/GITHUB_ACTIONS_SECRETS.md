# Secrets para GitHub Actions (deploy)

Repo: **https://github.com/Parvusmedia/friendinmeapp**

Ruta exacta: **Settings → Secrets and variables → Actions → Repository secrets** (pestaña *Secrets*, no *Variables*).

Crea **tres** secrets con estos nombres **exactos** (mayúsculas):

| Secret | Valor |
|--------|--------|
| `DEPLOY_HOST` | `87.106.194.137` |
| `DEPLOY_USER` | `cursorbot` |
| `DEPLOY_SSH_KEY` | Salida de `cat ~/.ssh/gh_actions_friendinme_ed25519` en el VPS |

## Errores habituales

- **missing server host** → no existe `DEPLOY_HOST` o el nombre está mal escrito (`Deploy_Host`, `DEPLOYHOST`, etc.).
- Secret creado en **Environment** en lugar de **Repository secrets**.
- Secret creado en otro repositorio.
- `DEPLOY_SSH_KEY` incompleta (debe incluir cabecera y pie OPENSSH).

## Probar de nuevo

Actions → **Deploy FriendInMe** → **Run workflow**.
