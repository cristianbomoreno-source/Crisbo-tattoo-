'use client'

import { useEffect, useState } from 'react'

const SESSION_KEY = 'ofink-splash-shown'
/** Duración total del splash (animación del pulpo + fade de salida). */
const TOTAL_MS = 1400

/**
 * Splash de apertura de la app: isotipo del pulpo en verde de marca sobre
 * fondo negro, con un giro de entrada (rotación + escala con leve rebote) y
 * un pulso de brillo — todo en CSS puro sobre `transform`/`opacity`/`filter`
 * (propiedades que el navegador compone en GPU, sin relayout), cero
 * JavaScript de animación, cero librerías, cero assets nuevos: el pulpo es
 * la misma silueta `pulpo-negro.png` pintada de verde con máscara CSS, el
 * mismo truco que ya usa `Logo`.
 *
 * Se muestra UNA vez por sesión de navegador (sessionStorage): cada apertura
 * en frío de la PWA es una sesión nueva → el splash sale; navegar dentro de
 * la app o recargar en la misma pestaña no lo repite. `prefers-reduced-motion`
 * lo reduce a un fade simple (ver globals.css).
 */
export function SplashScreen() {
  // Arranca visible en el server render para cubrir la carga inicial sin
  // parpadeo; el efecto decide si se queda (primera vez) o se quita ya.
  const [phase, setPhase] = useState<'showing' | 'leaving' | 'gone'>('showing')

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setPhase('gone')
        return
      }
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // sessionStorage bloqueado (modo privado raro): mostrarlo igual una vez.
    }
    const leaveTimer = setTimeout(() => setPhase('leaving'), TOTAL_MS - 350)
    const goneTimer = setTimeout(() => setPhase('gone'), TOTAL_MS)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(goneTimer)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-350 ease-out"
      style={{ opacity: phase === 'leaving' ? 0 : 1, pointerEvents: 'none' }}
    >
      <span
        className="ofink-splash-mark block size-24 bg-primary"
        style={{
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
      {/* Versión del build corriendo AHORA MISMO — verificación instantánea de
          que un deploy llegó al dispositivo (clave con PWA + service worker,
          donde el teléfono puede quedarse sirviendo un build viejo). */}
      <span className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] font-mono text-[11px] tracking-widest text-muted-foreground/70">
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </span>
    </div>
  )
}
