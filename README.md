# OFINK 

Esta es una **maqueta** de la app OFINK: tiene todas las pantallas y el diseño real,
pero **sin base de datos ni backend**. Todo lo que ves en pantalla son datos de ejemplo.
Sirve para **ver el diseño y editarlo** con libertad, sin miedo a dañar nada.

> No hay login, no hay internet, no se guarda nada. Los botones "funcionan" (se ven las
> pantallas y los mensajes) pero no guardan información, porque es solo una maqueta visual.

## Cómo abrirla

Necesitas tener **Node.js** instalado (descárgalo gratis en https://nodejs.org — la versión LTS).

Luego, en una terminal, dentro de esta carpeta:

```bash
npm install      # instala todo (solo la primera vez, tarda unos minutos)
npm run dev      # arranca la maqueta
```

Cuando termine, abre en tu navegador: **http://localhost:3000**

Para detenerla, vuelve a la terminal y presiona `Ctrl + C`.

## Cómo editar el diseño

Todo el código está en la carpeta `src/`. Al guardar un archivo, la página se actualiza
sola en el navegador. Los lugares más útiles para tocar el diseño:

- **Colores, fondos, tipografías generales** → `src/app/globals.css`
  (ahí están los colores del tema oscuro y claro).
- **Pantallas** → `src/app/(dashboard)/dashboard/…` (Inicio, Calendario, Proyectos, etc.).
- **Componentes reutilizables** (tarjetas, botones, barra de navegación, etc.) →
  `src/components/…`.
- **Datos de ejemplo** (nombres, proyectos, citas, precios que se muestran) →
  `src/lib/mock/data.ts`. Cámbialos para ver la interfaz con otra información.

Los estilos usan **Tailwind CSS** (clases como `bg-primary`, `text-lg`, `rounded-xl`
directamente en el código de cada pantalla).

## Nota

Como es una maqueta, no hay que configurar nada (ni claves, ni cuentas, ni `.env`).
Si algo no guarda o "no hace nada" al enviar, es normal: es el comportamiento esperado
de la maqueta. La app real sí tiene backend; esto es solo para trabajar el diseño.
