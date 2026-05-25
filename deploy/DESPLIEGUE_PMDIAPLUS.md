# Despliegue: friendinme.pmediaplus.com

## Tus dos VPS (referencia)

| Rol | IP | Uso |
|-----|-----|-----|
| **Plesk** (dominios / hosting web gestionado) | `82.223.3.205` | Suele ser donde apunta hoy el DNS del subdominio. |
| **Ubuntu** (proyectos / FriendInMe) | `87.106.194.137` | Aquí debes instalar Nginx, FastAPI, Next, PostgreSQL y Certbot **si el tráfico del dominio llega directo a este servidor**. |

FriendInMe se despliega **solo en el VPS Ubuntu** (`87.106.194.137`). El Plesk no necesita el código del proyecto; solo entra en juego si quieres que el visitante siga resolviendo contra Plesk (ver opción B).

---

## Elige una arquitectura

### Opción A — Recomendada (DNS directo a Ubuntu)

1. En el DNS de **pmediaplus.com** (donde gestiones los registros, con o sin Plesk), pon el registro **A** de `friendinme` hacia **`87.106.194.137`** (no hacia `82.223.3.205`).
2. Todo el tráfico de `https://friendinme.pmediaplus.com` llega a tu Ubuntu. Instalas Nginx + app + **Certbot en Ubuntu** (pasos de más abajo).
3. Comprueba:

```bash
dig +short friendinme.pmediaplus.com A
# Debe devolver: 87.106.194.137
```

En el propio Ubuntu:

```bash
curl -4 ifconfig.me
# Debe coincidir con 87.106.194.137
```

**Ventaja:** simple, un solo Nginx, un solo certificado SSL.

---

### Opción B — DNS sigue en Plesk (`82.223.3.205`) y proxy hacia Ubuntu

Si **no** puedes o no quieres cambiar el A a Ubuntu:

1. Mantienes el **A** de `friendinme` en **`82.223.3.205`** (Plesk).
2. En **Plesk**, para el subdominio `friendinme.pmediaplus.com`, configura un **reverse proxy** (Apache como proxy, o “Proxy mode” / directivas Nginx adicionales) que envíe todo el tráfico a tu Ubuntu, por ejemplo:

   - `http://87.106.194.137:80` (si en Ubuntu Nginx escucha en 80), **o**
   - `https://87.106.194.137:443` si terminas SSL en Ubuntu y Plesk reenvía HTTPS (más laborioso; suele usarse HTTP interno entre Plesk y Ubuntu en red privada o con firewall restringido).

3. En Ubuntu abre el firewall al proxy de Plesk si hace falta, por ejemplo:

```bash
sudo ufw allow from 82.223.3.205 to any port 80 proto tcp comment 'Plesk proxy to FriendInMe'
# Ajusta puerto/protocolo según cómo configures el proxy en Plesk
```

4. **SSL:** lo normal es emitir el certificado **en Plesk** (Let’s Encrypt del propio Plesk) para `friendinme.pmediaplus.com`, y la conexión Plesk → Ubuntu puede ir por HTTP en red confiable o por HTTPS si montas certificado en Ubuntu también.

**Inconveniente:** dos capas (Plesk + Ubuntu); más puntos de fallo y cabeceras `X-Forwarded-Proto` / `Host` bien configuradas.

---

## 1. DNS (resumen)

| Objetivo | Registro **A** `friendinme` → |
|----------|-------------------------------|
| Opción A (recomendada) | **`87.106.194.137`** |
| Opción B (proxy Plesk) | **`82.223.3.205`** + proxy en Plesk hacia Ubuntu |

No uses CNAME salvo que apunte a un nombre que ya resuelva al servidor correcto.

## 2. En el VPS Ubuntu (`87.106.194.137`): código y servicios

Los units de systemd están pensados para el usuario **`cursorbot`** (propietario habitual del código bajo `/opt/apps/`). Si en tu máquina no existe, créalo o cambia `User=`/`Group=` en los ficheros `.service`.

```bash
sudo chown -R cursorbot:cursorbot /opt/apps/friendinme
```

### Backend `.env` (producción)

Crea **`/opt/apps/friendinme/backend/.env`** (puedes partir de `.env.example`). Sin este archivo la API puede arrancar con valores por defecto, pero **PostgreSQL y JWT deben configurarse aquí** antes de producción:

```bash
cp /opt/apps/friendinme/backend/.env.example /opt/apps/friendinme/backend/.env
nano /opt/apps/friendinme/backend/.env
```

El unit **`friendinme-api.service` no usa `EnvironmentFile`** para evitar el error de systemd *"Failed to load environment files"* si el fichero falta o la ruta falla; uvicorn carga `.env` desde el directorio `backend/`.

```env
ENVIRONMENT=production
DEBUG=false
JWT_SECRET=<genera una cadena larga aleatoria>
DATABASE_URL=postgresql://USER:PASS@127.0.0.1:5432/friendinme
CORS_ORIGINS=https://friendinme.pmediaplus.com
PUBLIC_BASE_URL=https://friendinme.pmediaplus.com
UPLOAD_DIR=/var/lib/friendinme/uploads
```

Crea carpeta de subidas y permisos para el usuario que ejecutará los servicios (**`cursorbot`** en tu entorno):

```bash
sudo mkdir -p /var/lib/friendinme/uploads
sudo chown -R cursorbot:cursorbot /var/lib/friendinme/uploads
```

Asegúrate de que **`cursorbot`** puede leer todo `/opt/apps/friendinme` y escribir en `UPLOAD_DIR`. Los units de systemd usan `User=cursorbot` y `Group=cursorbot`.

### Frontend (build)

En `frontend/.env.production` (o variables del unit `friendinme-web`):

```env
INTERNAL_API_URL=http://127.0.0.1:8000
```

`NEXT_PUBLIC_*` no es obligatorio si el navegador llama a `/api` en el mismo dominio (Nginx enruta a FastAPI).

```bash
cd /opt/apps/friendinme/frontend
npm ci && npm run build
```

### systemd

```bash
sudo cp /opt/apps/friendinme/deploy/friendinme-api.service /etc/systemd/system/
sudo cp /opt/apps/friendinme/deploy/friendinme-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now friendinme-api friendinme-web
sudo systemctl status friendinme-api friendinme-web
```

Asegúrate de que `User=` en los units coincide con quien debe leer `frontend/.next` y escribir uploads.

### Nginx

```bash
sudo cp /opt/apps/friendinme/deploy/nginx.conf.example /etc/nginx/sites-available/friendinme
sudo ln -sf /etc/nginx/sites-available/friendinme /etc/nginx/sites-enabled/friendinme
sudo nginx -t && sudo systemctl reload nginx
```

Abre `http://friendinme.pmediaplus.com` (HTTP) y comprueba que carga la web y que `/api/health` responde. Si usas **opción A**, hazlo cuando el DNS ya apunte a **87.106.194.137**.

Abre en el firewall de Ubuntu los puertos necesarios si usas `ufw`:

```bash
sudo ufw allow 80,443/tcp
sudo ufw status
```

## 3. HTTPS (Let’s Encrypt en Ubuntu)

Con **opción A**, cuando el **A** ya resuelve a **`87.106.194.137`**, en el **VPS Ubuntu** ejecuta:

```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d friendinme.pmediaplus.com
```

Con **opción B**, el certificado para el visitante suele gestionarlo **Plesk**; en Ubuntu puedes usar HTTP entre Plesk y el origen o montar TLS según tu diseño.

## 4. Post-despliegue

- Migraciones: `cd /opt/apps/friendinme/backend && source .venv/bin/activate && alembic upgrade head`
- Seed (solo primera vez): `python -m app.seed`
- Revisa logs: `journalctl -u friendinme-api -f` y `journalctl -u friendinme-web -f`

Si algo falla (502, CORS, 503 base de datos), revisa en orden: DNS → `nginx -t` → estado de los dos systemd → `DATABASE_URL` y logs del API.

### Si `systemctl restart` dice “unavailable resources” o el job falla

1. Ver el error real (no basta con `status`):

```bash
sudo systemctl reset-failed friendinme-api friendinme-web
sudo journalctl -u friendinme-api -n 80 --no-pager
sudo journalctl -u friendinme-web -n 80 --no-pager
```

2. **API:** comprobar que existen el venv y uvicorn:

```bash
test -x /opt/apps/friendinme/backend/.venv/bin/uvicorn && echo OK uvicorn
ls -la /opt/apps/friendinme/backend/.env
```

Si no hay `.venv`, en `backend/`: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

3. **Web:** hace falta `npm run build` antes; debe existir `next`:

```bash
test -x /opt/apps/friendinme/frontend/node_modules/.bin/next && echo OK next
```

4. Puerto ocupado: `sudo ss -tlnp | grep -E ':8000|:3000'`

5. Vuelve a copiar los `.service` actualizados del repo y `daemon-reload` + `restart`.
