'use client'

import { useState, useSyncExternalStore } from 'react'
import { Copy, Check } from 'lucide-react'

const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

/** Copiar el link del bot de un tap, sin entrar a Ajustes → Bot. Mismo link
 * que `BotSettingsCard` (`/t/{slug}`) — vive acá también porque el pedido
 * era poder copiarlo "de manera fácil" desde el Centro de control. */
export function CopyBotLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const url = `${origin}/t/${slug}`

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/t/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-left transition-colors hover:border-primary/40"
    >
      <span className="min-w-0 truncate text-xs text-muted-foreground">{url}</span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        {copied ? (
          <>
            <Check className="size-3.5" aria-hidden="true" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="size-3.5" aria-hidden="true" />
            Copiar
          </>
        )}
      </span>
    </button>
  )
}
