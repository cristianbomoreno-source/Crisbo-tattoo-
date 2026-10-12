'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { disconnectWhatsAppAccount, saveWhatsAppAccount } from '@/actions/whatsapp'
import type { WhatsAppAccountStatus } from '@/queries/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

export function WhatsAppConnectCard({
  account,
  verifyTokenConfigured,
}: {
  account: WhatsAppAccountStatus | null
  verifyTokenConfigured: boolean
}) {
  const router = useRouter()
  const [phoneNumberId, setPhoneNumberId] = useState(account?.phoneNumberId ?? '')
  const [wabaId, setWabaId] = useState(account?.wabaId ?? '')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const webhookUrl = `${origin}/api/whatsapp/webhook`

  function copyWebhook() {
    navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    startTransition(async () => {
      const result = await saveWhatsAppAccount({
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        access_token: token || undefined,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setToken('')
      toast.success(`Conectado: ${result.data.verifiedName ?? ''} ${result.data.displayPhone ?? ''}`.trim())
      if (result.data.webhookWarning) toast.warning(result.data.webhookWarning, { duration: 10000 })
      router.refresh()
    })
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectWhatsAppAccount()
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setPhoneNumberId('')
      setWabaId('')
      toast.success('WhatsApp desconectado')
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg space-y-4">
      {account && (
        <section className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4">
          <span className="grid size-9 place-items-center rounded-full bg-primary/20 text-primary">
            <Check className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{account.verifiedName || 'Número conectado'}</p>
            <p className="text-xs text-muted-foreground">{account.displayPhone || account.phoneNumberId}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={disconnect} disabled={pending}>
            Desconectar
          </Button>
        </section>
      )}

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <h2 className="font-display text-sm font-semibold">
          {account ? 'Actualizar conexión' : 'Conectar número'}
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="wa-phone-id">Phone Number ID</Label>
          <Input
            id="wa-phone-id"
            inputMode="numeric"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="Ej. 123456789012345"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-waba-id">WhatsApp Business Account ID (WABA)</Label>
          <Input
            id="wa-waba-id"
            inputMode="numeric"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="Ej. 109876543210987"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-token">Token de acceso permanente</Label>
          <Input
            id="wa-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={account ? '•••••••• (déjalo vacío para conservar el actual)' : 'EAAG…'}
          />
          <p className="text-xs text-muted-foreground">
            Solo lo usa el servidor: nunca llega al navegador ni se vuelve a mostrar.
          </p>
        </div>

        <Button onClick={save} disabled={pending || !phoneNumberId || !wabaId || (!account && !token)}>
          {pending ? 'Comprobando con Meta…' : account ? 'Guardar cambios' : 'Conectar y probar'}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 text-sm">
        <h2 className="font-display text-sm font-semibold">Webhook</h2>
        <p className="text-muted-foreground">
          Al conectar, Crisbo Tattoo le pide a Meta que mande los mensajes de <strong>este número</strong> a:
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-2 text-xs">{webhookUrl}</code>
          <Button size="icon-sm" variant="outline" onClick={copyWebhook} aria-label="Copiar URL">
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          La app de Meta es compartida con otros proyectos: <strong>no cambies</strong> la Callback URL general de la
          app en developers.facebook.com. El desvío se hace solo para este número.
        </p>
        {!verifyTokenConfigured && (
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Falta configurar <code>WHATSAPP_VERIFY_TOKEN</code> y <code>WHATSAPP_APP_SECRET</code> en Vercel: sin
            ellas Meta no puede verificar el webhook.
          </p>
        )}
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Guía oficial de Meta <ExternalLink className="size-3" />
        </a>
      </section>
    </div>
  )
}
