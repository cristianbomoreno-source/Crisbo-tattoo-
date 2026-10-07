'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Prompt chulo de "Instalar OFINK" (DESIGN.md §1, carbón + rojo).
 * Captura `beforeinstallprompt` (Chrome/Edge/Android), muestra una tarjeta
 * dismissible y dispara la instalación nativa. Respeta un flag de descarte en
 * localStorage para no insistir. En navegadores sin soporte simplemente no aparece.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'ofink:install-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
      window.localStorage.setItem(DISMISS_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    window.localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
    window.localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(106px+env(safe-area-inset-bottom))] z-40 flex justify-center p-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in lg:bottom-0 lg:left-64">
      <div className="relative flex w-full max-w-md items-center gap-3 rounded-2xl bg-card p-3 pr-10 shadow-xl">
        <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-primary" aria-hidden="true" />

        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-lg"
        />

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-foreground">
            Instalá OFINK
          </p>
          <p className="truncate text-[13px] text-muted-foreground">
            De la idea a la piel, desde tu pantalla de inicio.
          </p>
        </div>

        <Button onClick={install} size="sm" className="h-9 shrink-0 gap-1.5 px-3">
          <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Instalar
        </Button>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
