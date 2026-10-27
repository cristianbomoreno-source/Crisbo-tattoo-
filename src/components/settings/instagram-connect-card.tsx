'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { disconnectInstagramAccount, saveInstagramAccount } from '@/actions/instagram'
import type { InstagramAccountStatus } from '@/queries/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InstagramIcon } from '@/components/shared/instagram-icon'

const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

export function InstagramConnectCard({
  account,
  webhookConfigured,
}: {
  account: InstagramAccountStatus | null
  webhookConfigured: boolean
}) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const webhookUrl = `${origin}/api/instagram/webhook`

  function copyWebhook() {
    navigator.clipboard.writeText(`${window.location.origin}/api/instagram/webhook`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    startTransition(async () => {
      const result = await saveInstagramAccount(token)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setToken('')
      toast.success(`Instagram conectado${result.data.username ? `: @${result.data.username}` : ''}`)
      if (result.data.webhookWarning) toast.warning(result.data.webhookWarning, { duration: 10000 })
      router.refresh()
    })
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectInstagramAccount()
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Instagram desconectado')
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg space-y-4">
      {account && (
        <section className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4">
          <span className="grid size-9 place-items-center rounded-full bg-primary/20 text-primary">
            <InstagramIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{account.username ? `@${account.username}` : 'Cuenta conectada'}</p>
            <p className="text-xs text-muted-foreground">Los mensajes directos llegan a Mensajes</p>
          </div>
          <Button variant="destructive" size="sm" onClick={disconnect} disabled={pending}>
            Desconectar
          </Button>
        </section>
      )}

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <h2 className="text-[1.0625rem] font-semibold">{account ? 'Actualizar token' : 'Conectar cuenta'}</h2>
        <div className="space-y-1.5">
          <Label htmlFor="ig-token">Token de acceso de Instagram</Label>
          <Input
            id="ig-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="IGAA…"
          />
          <p className="text-xs text-muted-foreground">
            Se genera en developers.facebook.com → tu app → Instagram → Configuración de la API con inicio de sesión
            de Instagram → Generar token. Solo lo usa el servidor y se renueva solo cada semana.
          </p>
        </div>
        <Button onClick={save} disabled={pending || !token.trim()}>
          {pending ? 'Comprobando con Instagram…' : account ? 'Guardar token' : 'Conectar y probar'}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 text-sm">
        <h2 className="text-[1.0625rem] font-semibold">Webhook</h2>
        <p className="text-muted-foreground">
          En la app de Meta, en Instagram → Webhooks, pega esta URL de devolución de llamada y suscríbete al campo{' '}
          <code>messages</code>:
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-2 text-xs">{webhookUrl}</code>
          <Button size="icon-sm" variant="outline" onClick={copyWebhook} aria-label="Copiar URL">
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          El token de verificación es el mismo de WhatsApp (<code>WHATSAPP_VERIFY_TOKEN</code>), salvo que configures{' '}
          <code>INSTAGRAM_VERIFY_TOKEN</code>. Si la app de Meta es distinta a la de WhatsApp, agrega su clave secreta
          en Vercel como <code>INSTAGRAM_APP_SECRET</code>.
        </p>
        {!webhookConfigured && (
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Faltan el token de verificación y la clave secreta de la app en Vercel: sin ellos Meta no puede entregar
            los mensajes.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Recuerda: solo puedes responder dentro de las 24 h siguientes al último mensaje del cliente, y en Instagram
          activa Configuración → Mensajes → Herramientas conectadas → Permitir acceso a los mensajes.
        </p>
        <a
          href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api"
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
