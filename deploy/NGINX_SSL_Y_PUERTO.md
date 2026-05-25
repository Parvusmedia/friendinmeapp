# Nginx: SSL + conflicto con otro proyecto (linkedinreport)

## Qué pasó

1. **Certbot** obtuvo el certificado pero no pudo instalarlo porque no había un `server { ... server_name friendinme.pmediaplus.com; ... }` que reconociera.
2. En **HTTPS** veías **linkedinreport** porque otro `server` (default o mismo nombre) recibía el tráfico, o porque **FriendInMe y linkedinreport compartían el puerto 3000** en localhost.

## Cambio en FriendInMe: Next en el puerto **3010**

- `friendinme-web.service` usa `next start -p **3010**`.
- Nginx debe hacer `proxy_pass` a `127.0.0.1:3010` (archivo `deploy/nginx-friendinme.conf`).

En el VPS:

```bash
sudo cp /opt/apps/friendinme/deploy/friendinme-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart friendinme-web
sudo ss -tlnp | grep 3010
```

## Sitio Nginx dedicado con SSL

Usa el archivo del repo **`deploy/nginx-friendinme.conf`** (incluye `server_name`, certificados Let’s Encrypt y redirección 80→443).

```bash
sudo cp /opt/apps/friendinme/deploy/nginx-friendinme.conf /etc/nginx/sites-available/friendinme
sudo ln -sf /etc/nginx/sites-available/friendinme /etc/nginx/sites-enabled/friendinme
```

Si `nginx -t` falla por `options-ssl-nginx.conf` o `ssl-dhparams.pem`, comenta esas líneas en el fichero o ejecuta `sudo certbot certificates` y sigue las rutas que Certbot haya creado.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Instalar el certificado en ese bloque (si aún no está enlazado):

```bash
sudo certbot install --cert-name friendinme.pmediaplus.com
```

## Revisar que linkedinreport no “robe” el host

Lista nombres de servidor:

```bash
grep -r server_name /etc/nginx/sites-enabled/
```

- Si **linkedinreport** tiene `server_name friendinme.pmediaplus.com`, quítalo de ahí (solo debe estar en `friendinme`).
- Si usa `default_server` en `443` y por eso cae todo lo no listado en otro sitio, el bloque **friendinme** con `server_name friendinme.pmediaplus.com` debe cargarse (sites-enabled) y **no** debe haber otro bloque con el mismo `server_name`.

## Comprobar

```bash
curl -sI https://friendinme.pmediaplus.com | head -5
curl -s https://friendinme.pmediaplus.com/api/health
```

Deberías ver cabeceras `200`/`301` de FriendInMe y el JSON `{"status":"ok"}` en el health.

### Si `/api/health` devuelve `{"detail":"Not Found"}`

1. Comprueba el backend en local:

   ```bash
   curl -s http://127.0.0.1:8000/api/health
   ```

   Si aquí falla: `sudo systemctl status friendinme-api` y que el **8000** no lo use otra app.

2. En Nginx usa `location ^~ /api/` con `proxy_pass http://friendinme_api;` **sin** sufijo de ruta (reenvía `/api/...` tal cual al FastAPI). Copia de nuevo `deploy/nginx-friendinme.conf` y `sudo nginx -t && sudo systemctl reload nginx`.
