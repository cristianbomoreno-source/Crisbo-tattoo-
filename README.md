# Mi Restaurante — App de ventas e inventario

Este es tu proyecto convertido en una app web real (React + Vite), lista para
subir a GitHub y publicar.

## Qué cambié respecto a la versión de Claude

- Antes los datos se guardaban con `window.storage` (solo funciona dentro de
  Claude). Ahora se guardan con `localStorage`, que es una función normal del
  navegador. Esto ya funciona en cualquier sitio publicado, **pero los datos
  quedan solo en ese celular/computador** — si abres la app desde otro
  dispositivo, no vas a ver las mismas ventas. Más abajo explico cómo
  resolver esto con Supabase (paso opcional, recomendado más adelante).

## 1. Probarlo en tu computador

Necesitas tener [Node.js](https://nodejs.org) instalado (versión 18 o más
nueva). Luego, en una terminal, dentro de esta carpeta:

```bash
npm install
npm run dev
```

Esto te da un link como `http://localhost:5173` para probar la app en tu
navegador antes de publicarla.

## 2. Subir el proyecto a GitHub

Como ya tienes cuenta en GitHub:

1. Entra a github.com y crea un **repositorio nuevo** (botón verde "New").
   Ponle un nombre como `mi-restaurante-app`. Déjalo público o privado, como
   prefieras. No marques ninguna casilla de "agregar README" (ya tienes uno).

2. En tu terminal, dentro de esta carpeta del proyecto:

```bash
git init
git add .
git commit -m "Primera versión de mi app"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/mi-restaurante-app.git
git push -u origin main
```

Reemplaza `TU-USUARIO` por tu nombre de usuario de GitHub. GitHub te va a
pedir iniciar sesión la primera vez (puede pedirte un "token" en vez de
contraseña — GitHub te guía para crearlo si hace falta).

## 3. Publicarlo con Vercel (gratis)

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta usando tu
   cuenta de GitHub (botón "Continue with GitHub").
2. Toca **"Add New Project"**.
3. Selecciona el repositorio `mi-restaurante-app` que acabas de subir.
4. Vercel detecta automáticamente que es un proyecto Vite. No necesitas
   cambiar nada — solo toca **"Deploy"**.
5. En un minuto te da una URL real, algo como
   `mi-restaurante-app.vercel.app`, que ya puedes abrir desde cualquier
   celular o computador.

Cada vez que quieras actualizar la app: haz tus cambios, y luego:

```bash
git add .
git commit -m "Describe qué cambiaste"
git push
```

Vercel actualiza la app publicada automáticamente en cuanto detecta el nuevo
`push`.

## 4. Siguiente paso recomendado: base de datos real (Supabase)

Ahora mismo cada celular/computador guarda sus propios datos por separado
(con `localStorage`). Para que **todos los dispositivos vean las mismas
ventas, el mismo inventario, etc.**, el siguiente paso es conectar una base
de datos real:

1. Crea una cuenta gratis en [supabase.com](https://supabase.com).
2. Crea un proyecto nuevo ahí (te da una base de datos Postgres lista para
   usar, y también autenticación de usuarios).
3. Cuando quieras, puedo ayudarte a adaptar las funciones `safeGet` y
   `safeSet` de `src/App.jsx` para que en vez de usar `localStorage` hablen
   con Supabase. La estructura del resto de la app no cambia.

## Estructura del proyecto

```
mi-restaurante-app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx      ← punto de entrada de React
│   └── App.jsx       ← toda tu app (lo que ya conoces)
```
