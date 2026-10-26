# design-sync — notas de Crisbo Tattoo

Proyecto: https://claude.ai/design/p/ff301128-fb07-435c-84b4-7f3d7bb37da9

## Cómo está armado (la app no es una librería)

- No hay `dist/` ni Storybook. El "paquete" es `.design-sync/entry/`:
  `index.ts` reexporta componentes reales de `src/` que no tocan datos ni
  acciones del servidor, `package.json` le da nombre (`crisbo-tattoo`) y
  apunta `types` a `entry/types/index.d.ts`.
- Antes de cada build: `node .design-sync/prepare.mjs` (es el `buildCmd`).
  1. `tsc -p .design-sync/tsconfig.dts.json` emite los `.d.ts` en
     `entry/types/` y reescribe los alias `@/` a rutas relativas (el lector
     de tipos no conoce los paths del tsconfig). Tienen que quedar DENTRO de
     `entry/`: el sincronizador solo toma como propias las props declaradas
     bajo la carpeta del paquete; con los tipos en `.cache/` las props
     salían vacías.
  2. Tailwind 4 compila `entry/crisbo.css` (globals.css de la app + Inter y
     Orbitron de Google Fonts) a `entry/dist/crisbo.css` (= `cssEntry`; un
     `cssEntry` fuera del paquete se ignora). `@source` incluye `src/`,
     `entry/` y `previews/`: una clase que solo aparece en una vista previa
     no existe si no se escanea esa carpeta.
- Comando del build:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/entry/index.ts --out ./ds-bundle`
- `entry/next-shim.ts` define `process.env` antes de cargar `next/link`
  (Next lo reemplaza al compilar; sin esto todas las vistas fallan con
  `process is not defined`).
- `CrisboRoot` (`entry/crisbo-root.tsx`) pone la clase del tema y
  `bg-background` en `<html>` además del div: Dialog/Select/DropdownMenu se
  abren en un portal fuera del div y salían en tema claro.
- Íconos Phosphor y subpiezas (Card*, Dialog*, DropdownMenu*, Select*)
  están exportados pero excluidos de las tarjetas con `componentSrcMap: null`.
- `Logo` quedó fuera: usa `/brand/*.png` del servidor de la app.
- `DropdownMenuLabel` debe ir dentro de `DropdownMenuGroup` (base-ui lanza
  error y el menú no aparece). El contenido toma el ancho del disparador:
  darle `className="w-56"` (la app usa `w-80`).
- Grupo "Base": `docsMap` apunta a `docs/base.md` (solo `category: Base`).
  `CrisboRoot` igual queda en el grupo `entry` (su archivo vive en la raíz
  del paquete).
- Playwright + Chromium instalados en `.ds-sync/` (gitignored) para la
  revisión visual.

## Known render warns

- Ninguna en la última sincronización (33/33 limpias).

## Re-sync risks

- Versión fija `1.29.0` en `entry/package.json`; no sigue a la de la app.
- Nuevos componentes de la app no entran solos: hay que reexportarlos en
  `entry/index.ts` y agregarlos a `componentSrcMap` con su vista previa.
- Si un componente reexportado empieza a importar `@/actions`, `@/queries`
  o supabase, el paquete arrastra código de servidor: sacarlo de la entrada.
- Las letras vienen de Google Fonts en tiempo de ejecución ([FONT_REMOTE]);
  no se empaquetan.
- `StatsClientsCard` y `StatsOccupancyCalendar` reciben tipos de la app
  (Client, DayCell); las vistas previas pasan objetos parciales con `as never`.
