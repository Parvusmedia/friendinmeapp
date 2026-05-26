# Secrets de GitHub Actions (referencia rápida)

Documentación completa: **[GITHUB.md](./GITHUB.md)**

**Repo:** https://github.com/Parvusmedia/friendinmeapp/settings/secrets/actions

| Secret | Valor |
|--------|--------|
| `DEPLOY_HOST` | `87.106.194.137` |
| `DEPLOY_USER` | `cursorbot` |
| `DEPLOY_SSH_KEY` | `cat ~/.ssh/gh_actions_friendinme_ed25519` en el VPS (clave **privada** completa) |

**No** confundir con `~/.ssh/github_friendinme_ed25519` (solo para `git push`).

Tras cambiar secrets: **Actions → Deploy FriendInMe → Run workflow** (no “Re-run failed jobs” en runs antiguos).
