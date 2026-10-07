'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Link2, MessageCircle, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createConsentLinkAction } from '@/actions/consent-links'

/**
 * Popup "Enviar consentimiento": genera el link tokenizado del proyecto y lo
 * manda por WhatsApp al teléfono del cliente (o lo copia, si no hay teléfono).
 * Reutiliza createConsentLinkAction (mismo que la ficha del proyecto).
 */
export function ConsentSendDialog({
  projectId,
  clientId,
  clientName,
  phone,
  open,
  onOpenChange,
}: {
  projectId: string
  clientId: string
  clientName: string
  phone?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const result = await createConsentLinkAction({ project_id: projectId, client_id: clientId })
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    setUrl(`${window.location.origin}/c/${result.data.token}`)
    router.refresh()
  }

  function copy() {
    if (!url) return
    navigator.clipboard.writeText(url)
    toast.success('Link copiado')
  }

  const message = url
    ? `Hola ${clientName}, por favor firma tu consentimiento aquí: ${url}`
    : ''
  const digits = (phone ?? '').replace(/\D/g, '')
  const waHref = url
    ? `https://wa.me/${digits.length === 10 ? `57${digits}` : digits}?text=${encodeURIComponent(message)}`
    : ''

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setUrl(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar consentimiento</DialogTitle>
        </DialogHeader>

        {!url ? (
          <Button type="button" onClick={generate} disabled={loading} className="w-full">
            <Link2 className="size-4" />
            {loading ? 'Generando…' : 'Generar link de consentimiento'}
          </Button>
        ) : (
          <div className="min-w-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Link para <span className="font-medium text-foreground">{clientName}</span> (expira en 48 h):
            </p>
            <p className="min-w-0 truncate rounded-xl bg-background px-3 py-2.5 text-sm">{url}</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <MessageCircle className="size-4" />
                Enviar por WhatsApp
              </a>
              <button
                type="button"
                onClick={copy}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-foreground"
              >
                <Copy className="size-4" />
                Copiar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
