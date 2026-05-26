# Variantes de la homepage

## Home1 (respaldo)

Diseño original: hero grande → 3 cajas → grid de perros y filtros.

- Código: `home-variants/home1/HomePage.tsx` + `home1.module.css`
- Vista previa en producción: **/home1**

### Restaurar Home1 como página principal

```bash
cp frontend/app/home-variants/home1/HomePage.tsx frontend/app/page.tsx
cp frontend/app/home-variants/home1/home1.module.css frontend/app/page.module.css
# En HomePage.tsx cambiar import styles from "./home1.module.css" → "./page.module.css"
# O copiar y ajustar el import a: import styles from "./page.module.css"
```

En `home-variants/home1/HomePage.tsx` el import debe ser `./home1.module.css`.  
Al copiar a `app/page.tsx`, usar `import styles from "./page.module.css"`.

## Home2 (activa en `/`)

Hero compacto → **perros y filtros primero** → cajas informativas al final.
