'use client'

import { useEffect, useRef } from 'react'

/**
 * Realtime no avisa lo que pasó mientras el socket estuvo caído (celular
 * bloqueado, pestaña dormida, sin señal). Con la pantalla visible revisa cada
 * tanto y al volver a la app, para ponerse al día sin recargar.
 */
export function useCatchUp(check: () => void, everyMs = 15_000) {
  const latest = useRef(check)
  useEffect(() => {
    latest.current = check
  })

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === 'visible') latest.current()
    }
    const timer = setInterval(run, everyMs)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    window.addEventListener('online', run)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
      window.removeEventListener('online', run)
    }
  }, [everyMs])
}
