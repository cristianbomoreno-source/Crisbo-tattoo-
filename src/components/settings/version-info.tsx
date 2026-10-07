'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'
const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local'

/**
 * Tarjeta "Acerca de OFINK" (Ajustes): muestra la versión desplegada y un
 * botón para forzar la actualización.
 *
 * BUG REAL corregido: la versión anterior llamaba `reg.update()` y, en el
 * mismísimo tick siguiente (síncrono), leía `reg.waiting` para mandarle
 * SKIP_WAITING — pero `update()` es asíncrono: instalar el Service Worker
 * nuevo (descargar, parsear, precachear) tarda, así que `reg.waiting`
 * todavía era `undefined` en ese momento. El postMessage no llegaba a
 * nadie, y el `setTimeout(reload, 400)` de todos modos recargaba la
 * página — con el Service Worker VIEJO todavía en control. Resultado:
 * el botón decía "Actualizando…" pero la app quedaba en la misma versión,
 * siempre (por eso hacía falta cerrar la app del todo para ver algo nuevo).
 *
 * Arreglo: esperar de verdad a que el worker nuevo (si existe) termine de
 * instalar (`statechange` → 'installed') antes de mandar SKIP_WAITING, y
 * dejar que sea el listener global de `controllerchange` (`register-sw.tsx`,
 * montado en el layout raíz) el que dispare el reload real cuando el
 * worker nuevo toma el control — no un `setTimeout` a ciegas.
 */
export function VersionInfo() {
  const [checking, setChecking] = useState(false)

  async function checkForUpdates() {
    setChecking(true)
    try {
      if (!('serviceWorker' in navigator)) {
        window.location.reload()
        return
      }

      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        window.location.reload()
        return
      }

      // Ya había una versión nueva esperando de una revisión anterior.
      if (reg.waiting) {
        toast.success('Actualizando OFINK…')
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }

      await reg.update()

      const worker = reg.installing
      if (!worker) {
        toast.success('Ya tienes la última versión de OFINK')
        return
      }

      toast.success('Descargando la nueva versión…')
      await new Promise<void>((resolve) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' || worker.state === 'redundant') resolve()
        })
      })

      // TS estrecha `reg.waiting` a `null` por el `if (reg.waiting)` de arriba
      // (que retorna) y no invalida esa marca tras los `await` — pero en
      // tiempo de ejecución SÍ puede haber cambiado (por eso `reg.update()` y
      // la espera de arriba). Se re-lee con el tipo real del DOM.
      const waitingWorker = reg.waiting as ServiceWorker | null
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      } else {
        // El worker terminó de instalar pero no quedó "waiting" (primera
        // instalación, sin controller previo) — no hay nada que activar.
        toast.success('OFINK ya está actualizado')
      }
    } catch {
      // best-effort: si algo falla, al menos recargamos.
      window.location.reload()
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold uppercase tracking-wide">Acerca de OFINK</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Versión {APP_VERSION} · build {BUILD_SHA}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={checkForUpdates}
        disabled={checking}
        className="shrink-0"
      >
        <RefreshCw className={checking ? 'size-4 animate-spin' : 'size-4'} strokeWidth={1.8} aria-hidden="true" />
        {checking ? 'Buscando…' : 'Buscar actualizaciones'}
      </Button>
    </div>
  )
}
