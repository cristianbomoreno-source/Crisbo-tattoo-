/** Marca de Crisbo Tattoo al pie de la página pública tipo Linktree. SIEMPRE
 * fija, centrada — no forma parte de `LinkPageTheme`,
 * no tiene ninguna prop de color/posición, y el customizer no la toca. */
export function OfinkFixedFooter() {
  return (
    <div className="pointer-events-none relative z-10 mt-auto flex select-none flex-col items-center pb-8 pt-12 opacity-95">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/cb-logo.png"
        alt="Crisbo Tattoo"
        className="h-10 w-auto rounded-lg"
      />
    </div>
  )
}
