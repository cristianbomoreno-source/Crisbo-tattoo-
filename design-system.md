# Crisbo Tattoo — Design System

App de gestión de un estudio de tatuajes, usada sobre todo en el iPhone
del dueño (PWA instalada), con una mano y entre clientes. Modo **Operate**:
manda que se lea rápido y que no haya toques equivocados; la marca vive en
detalles precisos, no en decoración.

La paleta sale del estudio real: negro de techo y piso, el **dorado de las
tiras LED** como único acento, el blanco cálido del muro de concreto para
el texto y el **rojo del maletín** para lo destructivo.

Todo vive en **`src/app/globals.css`** como variables CSS (`.dark` por
defecto, `:root` claro y `.minimal`) expuestas en `@theme inline`. Los
componentes usan clases semánticas (`bg-card`, `text-muted-foreground`,
`text-income`…), nunca colores sueltos de Tailwind.

## 1. Color

| Token | Oscuro (por defecto) | Uso |
|---|---|---|
| `--background` | `#0a0a09` | Fondo de la app. |
| `--card` | `#151412` | Tarjetas, nivel 1. |
| `--popover` / `--secondary` / `--accent` | `#1d1b18` | Hojas, menús, chips inactivos, nivel 2. |
| `--foreground` | `#f2ece3` | Texto principal (blanco cálido del concreto). |
| `--muted-foreground` | `#9a9289` | Texto secundario. |
| `--primary` (= `--success`) | `#d9a54a` | **Único acento de marca**: botones primarios, ítem activo, indicadores. Texto negro encima. Nunca pinta superficies grandes. |
| `--destructive` | `#c2332b` | Borrar, errores, plata que sale. |
| `--income` | `#4cc08a` | Plata que **entra** (cobros, ingresos, ingresos fijos). |
| `--transfer` | `#5aa7e0` | **Traslados** entre cuentas propias. |
| `--warning` | ámbar | Vencimientos y pendientes urgentes. |
| `--info` | azul grisáceo | Avisos informativos puntuales. |

Cada color semántico tiene su `-foreground` para texto encima
(`bg-income text-income-foreground`). El trío entra / sale / traslado
(verde, rojo, azul) es el del libro de caja y solo se usa para dinero.

**Regla:** si algo no es acción principal, estado activo, dinero o un
estado semántico, va en los grises cálidos. No hay un segundo acento.

## 2. Tipografía

Una sola familia: **Inter** (`--font-sans`) para títulos y texto, en
mayúscula inicial (sentence case). `--font-display`, `--font-title` y
`--font-heading` apuntan a Inter a propósito; la jerarquía sale de tamaño
y peso. `--font-wordmark` (Orbitron) es solo para el logotipo.

- Escala: `--text-base` 17px, `lg` 19px, `xl` 21px, `2xl` 25px.
- Números en columnas o montos: `tabular-nums`.
- **Piso de 12px** para cualquier texto que haya que leer (incluidas las
  tarjetas de proyecto); 11px solo para unidades mínimas ("día", "cada uno").
- Contraste mínimo 4.5:1 para texto normal.

## 3. Toque y tamaños

- En pantallas táctiles (`pointer-coarse`) los botones miden ~44px:
  `default` h-11, `sm` h-10, `icon` 44px (ver `components/ui/button.tsx`).
  Los `xs` conservan su tamaño visual y amplían el área táctil con un
  `::after` invisible. En escritorio no cambia nada.
- Filas tocables de listas: `min-h-14`. Chips de selección: `min-h-10`.
- Acciones peligrosas lejos de las frecuentes (p. ej. borrar a la derecha,
  pagar a la izquierda) y con confirmación dentro de la app, nunca
  `window.confirm`.
- Acciones de plata (marcar pagado/recibido) dicen monto y cuenta en el
  aviso y ofrecen **Deshacer**.

## 4. Espaciado, radios y superficies

- Escala de Tailwind (4px). Tarjetas `p-4` en móvil; secciones `space-y-3.5`
  a `space-y-6`. Safe areas ya integradas en barra inferior y hojas.
- Radios: `rounded-2xl` para tarjetas y filas agrupadas, `rounded-full` solo
  para controles pequeños (chips, píldoras, barra inferior).
- Profundidad con una sola cosa: sombra suave y difusa **o** borde hairline
  (`border-border`, blanco translúcido), no las dos.
- Sin bordes de color a un lado de tarjetas o filas.

## 5. Navegación

- Móvil: barra flotante con **Inicio, Proyectos, Mensajes, Estudio**.
  La pestaña Estudio abre con **"Tu estudio"** (Cotizaciones, Caja y
  cuentas, Clientes, Consentimientos, Galería, Estadísticas) encima de los
  ajustes (`components/settings/studio-modules.tsx`).
- Escritorio: sidebar con todos los módulos (`components/shared/nav-items.tsx`).
- El Resumen de caja se abre desde la fila "Caja y cuentas" de Inicio,
  deslizando ← o con `/dashboard?caja=1`.

## 6. Inicio (móvil)

Orden: saludo → **ventas del mes** → **calendario** (lo primero que se
mira, a pedido del dueño) → próxima cita (con foto) → **Hoy** (lista con
resumen de citas y horas) → "Caja y cuentas" → alertas de gastos. Cada dato
aparece una vez.

## 7. Movimiento

Utilidades `.animate-fade-in`, `.animate-scale-in`, `.animate-spring-in`
en `globals.css`; hojas y diálogos usan `tw-animate-css`. Todo respeta
`prefers-reduced-motion`. Nada rebota en transiciones de interfaz.
