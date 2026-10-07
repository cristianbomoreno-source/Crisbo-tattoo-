# OFINK — Design System

Identidad visual premium, minimalista y neutra, inspirada en Apple / Linear /
Arc / Stripe / Revolut, adaptada para tatuadores. El rojo de marca se reserva
para acciones principales y estados activos; el resto de la interfaz vive en
grises muy oscuros y parejos (`#141414` / `#1C1C1E`) sobre negro puro (`#000000`).

Todo lo de este documento vive en **`src/app/globals.css`** como variables
CSS (tema `.dark`, tokens `@theme inline`). No se tocó ningún componente,
ruta, acción de servidor ni lógica — el rediseño es 100% a nivel de tokens,
así que se propaga solo a toda la app (todo el código ya usa clases
semánticas como `bg-card`, `border-border`, `rounded-xl`, nunca colores
sueltos).

## 1. Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#000000` | Fondo de toda la app — negro puro. |
| `--card` | `#141414` | Tarjetas, superficies elevadas nivel 1. |
| `--popover` | `#1C1C1E` | Menús, diálogos, hojas — nivel 2 (más elevado que `card`). |
| `--secondary` / `--accent` | `#1C1C1E` | Superficies interactivas (botones secundarios, chips inactivos). |
| `--muted-foreground` | `#8E8E93` | Texto secundario, subtítulos, metadatos. |
| `--foreground` | `#FFFFFF` | Texto principal. |
| `--border` / `--input` | blanco al 6% / 12% opacidad | Bordes "hairline" (translúcidos, no grises sólidos) — técnica Linear/Arc. |
| `--primary` / `--destructive` / `--success` | `#B8F400` (hover `#C7FF2E`, pressed `#9FDC00`, glow `rgba(184,244,0,.18)`) | **Único acento de color.** Transmite calma y control, no "gamer". Texto **negro** sobre fondos de este color. |
| `--warning` / `--info` | ámbar / azul | Solo para estado semántico puntual (pendiente, informativo) — no decorativos. |

**Regla de oro:** si un elemento no es una acción principal, un estado activo
o un indicador semántico, va en gris. El rojo no se usa como color decorativo.

## 2. Tipografía

Ya cargada en `layout.tsx` (no se tocó):

| Variable | Fuente | Uso |
|---|---|---|
| `--font-sans` | Inter | Texto de UI general (cuerpo, labels, inputs). |
| `--font-display` | Oswald | Encabezados de sección, títulos de tarjetas (condensada, mayúsculas). |
| `--font-title` | Anton | Títulos grandes / hero (Inicio, splash). |
| `--font-wordmark` | Orbitron | Solo el logotipo "OFINK". |
| `--font-mono` | Geist Mono | Cifras tabulares en contextos técnicos (opcional). |

Reglas globales nuevas (`@layer base`):
- `h1–h4`: `tracking-tight` + `line-height: 1.15` (encabezados compactos, sensación premium).
- `p`: `line-height: 1.55` (cuerpo cómodo de leer).
- Tamaños los sigue definiendo cada componente (`text-sm`, `text-lg`, etc.) — esto no cambió.

## 3. Espaciado

Se mantiene la escala estándar de Tailwind (4px base). Guía de uso ya presente en el código:
- `gap-1.5` / `gap-2` — entre ícono y texto, chips.
- `p-4` / `p-5` — padding interno de tarjetas en móvil.
- `space-y-4` / `space-y-6` — separación entre secciones de una pantalla.
- Safe-area (`env(safe-area-inset-*)`) ya integrada en topbar/tabbar/hojas — no tocar.

## 4. Bordes (radios)

Escala redefinida para caer en el rango premium de **16–24px** en los tamaños más usados:

| Token | Valor | Uso típico |
|---|---|---|
| `rounded-sm` | 12px | Chips pequeños. |
| `rounded-md` | 14px | Inputs, botones. |
| `rounded-lg` | 16px | Tarjetas compactas. |
| `rounded-xl` | **20px** | Tarjetas estándar — el más usado en la app. |
| `rounded-2xl` | **24px** | Tarjetas destacadas, hojas inferiores, diálogos. |
| `rounded-3xl` / `rounded-4xl` | 28px / 32px | Superficies grandes, splash. |

## 5. Sombras y superficies flotantes

Dos capas de profundidad, siempre suaves y difusas (nunca duras ni con spread grande):

```css
/* Tarjeta (.bg-card) — luz de canto sutil + sombra ancha y difusa */
box-shadow:
  inset 0 1px 0 0 oklch(1 0 0 / 0.06),   /* filo superior con luz */
  0 1px 2px 0 rgb(0 0 0 / 0.4),          /* contacto */
  0 16px 40px -24px rgb(0 0 0 / 0.85);   /* halo flotante */

/* Acento rojo (.glow-primary) — SOLO en FAB y CTAs principales */
box-shadow:
  0 0 20px -6px rgba(184, 244, 0, 0.18),  /* var(--primary-glow) — muy sutil, nunca "gaming" */
  0 10px 24px -10px rgb(0 0 0 / 0.55);
```

## 6. Componentes reutilizables (ya existentes, ahora con los tokens nuevos)

Ningún componente cambió de código — todos heredan el estilo nuevo automáticamente:

- **Tarjeta** (`bg-card` + `rounded-xl`/`2xl` + `border-border`): base de toda la UI (resumen del día, cotizaciones, proyectos).
- **Botón primario** (`bg-primary` + `glow-primary`): única superficie donde el rojo "brilla".
- **Botón secundario** (`border-border` + `bg-transparent`): acciones no destacadas.
- **Chip / badge** (`rounded-full`, borde hairline, texto `muted-foreground` o `primary` si está activo).
- **Input** (`border-input`, `rounded-md`, fondo semitransparente `bg-input/30`).
- **Hoja inferior / diálogo** (`bg-popover` + `rounded-2xl` arriba + safe-area).
- **Selector de fecha/hora, dial de duración**: usan los mismos tokens de color (rojo = seleccionado, rojo tenue = ocupado/bloqueado).

## 7. Animaciones

Utilidades nuevas en `globals.css`, opcionales (ningún componente las fuerza):

| Clase | Efecto | Duración |
|---|---|---|
| `.animate-fade-in` | Aparece con fade | 250ms ease-out |
| `.animate-scale-in` | Aparece con fade + escala 0.96→1 | 200ms spring |
| `.animate-spring-in` | Entra con rebote sutil (listas, tarjetas) | 420ms spring |

Respetan `prefers-reduced-motion`. Los diálogos/hojas ya traían sus propias
animaciones vía `tw-animate-css` (`data-open:animate-in`, etc.) — no se tocaron.

## 8. Reglas de diseño

1. **Negro puro de fondo (`#000000`)**, con profundidad dada por las tarjetas (`#141414`/`#1C1C1E`), no por el fondo.
2. **El verde lima es escaso.** Un solo acento de color en toda la interfaz — para lo demás, escala de grises. Nunca se usa para pintar superficies completas (tarjetas, fondos grandes), solo títulos, íconos, botones e indicadores puntuales.
3. **Bordes hairline, no grises sólidos.** `border-border` es blanco translúcido al 8%, no un gris plano — así las tarjetas "flotan" en vez de verse recortadas.
4. **Sombras anchas y difusas**, nunca duras ni con offset grande — sensación de elementos suspendidos, no de recortes con contorno.
5. **Jerarquía antes que decoración.** Un dato importante se distingue por tamaño/peso/color, no por más adornos.
6. **El calendario es protagonista.** Mantiene la mayor superficie de tarjeta y el primer lugar en Inicio.
7. **Cualquier componente nuevo debe usar los tokens semánticos** (`bg-card`, `text-muted-foreground`, `border-border`, `rounded-xl`) — nunca colores o radios hardcodeados, para que seguir cambiando el sistema de diseño siga siendo tan simple como editar `globals.css`.
