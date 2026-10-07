/**
 * Silueta humana NEUTRA (SVG propio) para el paso 2 del wizard — ilustra la
 * selección de zona sin figuras realistas ni rasgos (DESIGN.md: placeholders
 * honestos, nada de renders detallados). `currentColor`: el padre controla el
 * tono con una clase de texto (ej. `text-muted-foreground/30`). 'back' añade
 * una línea de columna sutil (misma opacidad relativa, sin color nuevo).
 */
export function BodySilhouette({
  view,
  className,
}: {
  view: 'front' | 'back'
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 160 380"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* Cabeza + torso: forma rellena */}
      <circle cx="80" cy="28" r="24" fill="currentColor" />
      <path d="M56 54 Q80 46 104 54 L114 178 Q80 196 46 178 Z" fill="currentColor" />

      {/* Brazos y piernas: cápsulas de trazo grueso con extremos redondeados */}
      <g stroke="currentColor" strokeWidth={20} strokeLinecap="round" fill="none">
        <path d="M58 66 L34 150 L28 218" />
        <path d="M102 66 L126 150 L132 218" />
        <path d="M64 182 L58 290 L54 360" />
        <path d="M96 182 L102 290 L106 360" />
      </g>

      {/* Vista trasera: línea de columna (mismo color, opacidad reducida) */}
      {view === 'back' && (
        <path
          d="M80 58 L80 178"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="opacity-60"
        />
      )}
    </svg>
  )
}
