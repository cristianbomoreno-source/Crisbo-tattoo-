# Crisbo Tattoo — cómo construir con este sistema

App de gestión de un estudio de tatuajes, usada sobre todo en el iPhone del
dueño (PWA), con una mano. Tema oscuro cálido; el **dorado** es el único
acento. Textos de la interfaz en español de Colombia; montos en pesos con
punto de miles (`$2.675.000`) o abreviados (`$8,4M`, `$620K`).

## Raíz obligatoria

Envuelve toda pantalla en `CrisboRoot`. Pone el tema en `<html>` (así
`Dialog`, `Select` y `DropdownMenu`, que se abren en un portal, salen
oscuros) y pinta fondo, color y letra. Sin ella todo sale en tema claro.

```jsx
<CrisboRoot className="min-h-screen p-4">{/* pantalla */}</CrisboRoot>
```

`theme`: `"dark"` (por defecto), `"light"` o `"minimal"`.

## Estilo: clases de Tailwind 4 con tokens del tema

No inventes colores sueltos (`bg-zinc-900`, `text-emerald-500`, hex). Usa
los tokens; todas estas clases existen en `styles.css`:

| Uso | Clases |
|---|---|
| Superficies | `bg-background` (fondo), `bg-card` (tarjetas), `bg-muted` / `bg-secondary` (chips, filas) |
| Texto | `text-foreground`, `text-muted-foreground` |
| Acento (acción principal, activo, dato clave) | `bg-primary text-primary-foreground`, `text-primary`, `bg-primary/12` (fondo de ícono) |
| Plata que entra / sale / traslado | `text-income` `bg-income/15` · `text-destructive` `bg-destructive/15` · `text-transfer` `bg-transfer` |
| Aviso | `text-warning` |
| Gráficas | `var(--chart-1)`…`var(--chart-5)`, o `CHART_COLORS` |
| Bordes | `border-border`, divisores `divide-border/60` |

Medidas de la casa: tarjetas `rounded-[1.5rem] bg-card p-4`, tarjetas chicas
`rounded-[1.25rem] p-3.5`, filas tocables `min-h-14`, texto secundario
`text-[13px]`, mínimo `text-[12px]`. Números: `font-title font-bold
tabular-nums`. Solo la familia Inter (`font-sans`); jerarquía por tamaño y
peso. Nada de bordes de color a un lado de una tarjeta.

## Íconos

Íconos Phosphor exportados por el paquete: `House`, `PenNib`, `ChatsCircle`,
`SquaresFour`, `ClipboardText`, `ChartLineUp`, `UsersThree`, `Signature`,
`ImagesSquare`, `Wallet`, `Coins`, `CalendarCheck`, `CalendarDots`,
`Hourglass`, `Target`, `TrendUp`, `TrendDown`, `Warning`, `Lightbulb`,
`GearSix`, `CaretLeft`, `CaretRight`. Prop `weight`: `"regular"` en reposo,
`"fill"` para la pestaña activa, `"duotone"` dentro de un cuadro
`grid size-10 place-items-center rounded-xl bg-primary/12 text-primary`, y
`"bold"` para flechas.

## Estadísticas: gráfica primero, poco texto

Usa `CumulativeChart`, `DailyBars`, `Donut`, `Ring`, `Columns` y `DeltaChip`,
o las tarjetas armadas (`StatsKpiGrid`, `StatsFunnel`, `StatsHoursCard`,
`StatsStylesRanking`, `StatsClientsCard`, `StatsAudienceCard`,
`StatsObjectives`, `StatsRecommendations`, `StatsOccupancyCalendar`,
`StatsZonesMap`). Cada componente documenta sus props en su `.d.ts` y trae
ejemplos en su `.prompt.md`.

## Dónde mirar

`styles.css` (importa `_ds_bundle.css`: tokens y todas las clases) y
`guidelines/design-system.md` (reglas de color, toque, navegación e Inicio).

## Ejemplo

```jsx
<CrisboRoot className="min-h-screen space-y-3 p-4">
  <section className="rounded-[1.5rem] bg-card p-4">
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm font-semibold">Entró este mes</h2>
      <DeltaChip pct={27} />
    </div>
    <p className="font-title text-4xl font-bold tabular-nums">$2.675.000</p>
    <Button className="mt-3 w-full">
      <Wallet weight="duotone" /> Registrar cobro
    </Button>
  </section>
</CrisboRoot>
```
