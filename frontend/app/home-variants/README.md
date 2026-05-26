# Variantes de la homepage

## Home1 (respaldo original)

Diseño original: hero grande → **3 cajas** → grid de perros y filtros.

- Código: `home-variants/home1/`
- Vista previa: **/home1**

## Home2 (respaldo compacto)

Hero corto → perros arriba → valores compactos al final.

- Código: `home-variants/home2/`
- Vista previa: **/home2**

## Home activa (`/`)

Estilo visual de **Home1** (titular completo, cajas con iconos), pero **perros y filtros justo debajo del hero**, antes de las 3 cajas.

### Restaurar Home1 como página principal (orden antiguo)

```bash
cp frontend/app/home-variants/home1/HomePage.tsx frontend/app/page.tsx
cp frontend/app/home-variants/home1/home1.module.css frontend/app/page.module.css
# En page.tsx: import styles from "./page.module.css"
```
