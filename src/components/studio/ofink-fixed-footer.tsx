/** Marca de OFINK al pie de la página pública tipo Linktree. SIEMPRE
 * fija, centrada y blanca (#FFFFFF) — no forma parte de `LinkPageTheme`,
 * no tiene ninguna prop de color/posición, y el customizer no la toca.
 * `filter: brightness(0) invert(1)` fuerza blanco puro en el wordmark sin
 * depender de que el PNG ya venga así. */
export function OfinkFixedFooter() {
  return (
    <div className="pointer-events-none relative z-10 mt-auto flex select-none flex-col items-center pb-8 pt-12 opacity-95">
      <span
        aria-hidden="true"
        className="h-7 w-7"
        style={{
          backgroundColor: '#FFFFFF',
          WebkitMaskImage: 'url(/brand/pulpo-negro.png)',
          maskImage: 'url(/brand/pulpo-negro.png)',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/ofink-wordmark.png"
        alt="OFINK"
        className="mt-1 h-3 w-auto"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </div>
  )
}
