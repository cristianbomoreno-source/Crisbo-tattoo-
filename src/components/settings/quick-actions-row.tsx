'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Link2, QrCode, Share2, Check } from 'lucide-react'
import { QrCodeDialog } from '@/components/settings/qr-code-dialog'

export function QuickActionsRow({ slug, whatsappConnected }: { slug: string; whatsappConnected: boolean }) {
  const [qrOpen, setQrOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function publicUrl() {
    return `${window.location.origin}/t/${slug}`
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function share() {
    const url = publicUrl()
    if (navigator.share) {
      navigator.share({ title: 'Mi link de OFINK', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <>
      <div className="grid grid-cols-4 divide-x divide-border/60 rounded-[1.75rem] border border-border/60 bg-card">
        <Link
          href="/dashboard/settings/bot"
          className="flex flex-col items-center gap-1.5 px-1 py-4 text-center transition-colors hover:bg-accent/40"
        >
          <MessageCircle className="size-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[11px] font-medium text-foreground">WhatsApp</span>
          <span className="text-[10px] text-muted-foreground">{whatsappConnected ? 'Conectado' : 'Conectar'}</span>
        </Link>

        <button
          type="button"
          onClick={copyLink}
          className="flex flex-col items-center gap-1.5 px-1 py-4 text-center transition-colors hover:bg-accent/40"
        >
          {copied ? (
            <Check className="size-5 text-primary" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Link2 className="size-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          )}
          <span className="text-[11px] font-medium text-foreground">Link público</span>
          <span className="text-[10px] text-muted-foreground">{copied ? '¡Copiado!' : 'Copiar link'}</span>
        </button>

        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="flex flex-col items-center gap-1.5 px-1 py-4 text-center transition-colors hover:bg-accent/40"
        >
          <QrCode className="size-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[11px] font-medium text-foreground">Código QR</span>
          <span className="text-[10px] text-muted-foreground">Ver código</span>
        </button>

        <button
          type="button"
          onClick={share}
          className="flex flex-col items-center gap-1.5 px-1 py-4 text-center transition-colors hover:bg-accent/40"
        >
          <Share2 className="size-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[11px] font-medium text-foreground">Compartir</span>
          <span className="text-[10px] text-muted-foreground">Enviar link</span>
        </button>
      </div>

      {qrOpen && <QrCodeDialog url={publicUrl()} onClose={() => setQrOpen(false)} />}
    </>
  )
}
