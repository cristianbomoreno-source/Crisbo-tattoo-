'use client'

import { X } from 'lucide-react'

export function QrCodeDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(url)}`

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-[1.75rem] bg-card p-5 text-center shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Código QR
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt={`Código QR de ${url}`} width={220} height={220} />
        </div>
        <p className="mt-3 truncate text-xs text-muted-foreground">{url}</p>
      </div>
    </div>
  )
}
