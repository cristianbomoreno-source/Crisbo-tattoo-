'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { subscribeToPush } from '@/lib/push/client'

/**
 * Registra el service worker de OFINK y detecta actualizaciones lo más
 * rápido posible (spec §3 + pedido explícito de Crisbo):
 *
 * - `updateViaCache: 'none'`: el navegador nunca sirve sw.js desde su caché
 *   HTTP, siempre lo pide a la red. Sin esto, algunos navegadores pueden
 *   tardar hasta 24h en notar que sw.js cambió (ver también next.config.ts,
 *   que además fuerza Cache-Control: no-cache en el propio archivo).
 * - Revisa updates apenas carga, cada 60s mientras la pestaña está abierta,
 *   y cada vez que la pestaña vuelve a primer plano (volver de otra app).
 * - Apenas encuentra una versión nueva, la activa sola (sin esperar a que
 *   cierres todas las pestañas) y recarga — no hace falta ir a Ajustes.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    let reloaded = false
    let reg: ServiceWorkerRegistration | null = null

    function applyUpdate(worker: ServiceWorker) {
      toast.success('Nueva versión de OFINK disponible, actualizando…')
      worker.postMessage({ type: 'SKIP_WAITING' })
    }

    function watchForUpdate(registration: ServiceWorkerRegistration) {
      // Ya hay un worker esperando de una revisión anterior.
      if (registration.waiting && navigator.serviceWorker.controller) {
        applyUpdate(registration.waiting)
      }
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            applyUpdate(worker)
          }
        })
      })
    }

    const onLoad = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        watchForUpdate(reg)
        reg.update()
        // Re-suscripción silenciosa: si ya se concedió permiso antes (en
        // este u otro dispositivo con el mismo navegador), no hace falta
        // volver a pedirlo — solo sincroniza la suscripción con el
        // servidor por si cambió (upsert por endpoint, no duplica nada).
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          subscribeToPush(reg).catch((e) => console.error('[push] re-suscripción falló', e))
        }
      } catch {
        // Registro best-effort: un fallo no debe romper la app.
      }
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad)
    }

    // El SW nuevo tomó el control: recargar UNA vez para servir la versión fresca.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    })

    // Revisiones activas: al volver a la pestaña y cada 60s con la app abierta.
    const interval = window.setInterval(() => reg?.update(), 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') reg?.update()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('load', onLoad)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(interval)
    }
  }, [])

  return null
}
