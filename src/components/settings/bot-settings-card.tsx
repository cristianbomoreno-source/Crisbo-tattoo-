'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

import { updateBotSettings } from '@/actions/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

type Props = { slug: string; whatsappPhone: string | null; instagram: string | null; botAskAvailability: boolean }

// El origen no cambia durante la vida de la página: store sin suscripción real.
const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

export function BotSettingsCard({ slug: initialSlug, whatsappPhone, instagram, botAskAvailability: initialAskAvailability }: Props) {
  const [slug, setSlug] = useState(initialSlug)
  const [phone, setPhone] = useState(whatsappPhone ?? '')
  const [ig, setIg] = useState(instagram ?? '')
  const [askAvailability, setAskAvailability] = useState(initialAskAvailability)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  // Hidratación segura: el server y el primer paint del cliente usan el
  // snapshot de servidor (''); React actualiza al origen real sin mismatch.
  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const url = `${origin}/t/${slug}`

  function copy() {
    // En el click window siempre existe: copiar la URL absoluta.
    navigator.clipboard.writeText(`${window.location.origin}/t/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    startTransition(async () => {
      const result = await updateBotSettings({ slug, whatsapp_phone: phone, instagram: ig, bot_ask_availability: askAvailability })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Bot de solicitudes actualizado')
    })
  }

  return (
    <section className="max-w-lg space-y-4 rounded-2xl bg-card p-4">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
          Bot de solicitudes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comparte este link (por ejemplo en tu bio de Instagram) y las solicitudes te llegan
          por WhatsApp y como cotización nueva en el panel.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bot-slug">Tu link</Label>
        <div className="flex gap-2">
          <Input id="bot-slug" value={slug} onChange={e => setSlug(e.target.value)} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copy}
            aria-label="Copiar link del bot"
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{url}</p>
        {slug !== initialSlug && (
          <p className="text-xs text-warning">
            Ojo: al cambiar el link, el anterior deja de funcionar.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bot-phone">WhatsApp del estudio</Label>
        <Input
          id="bot-phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Ej. 350 204 6957"
        />
        <p className="text-xs text-muted-foreground">
          Sin este número, la página del bot se muestra como no disponible.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bot-instagram">Instagram del estudio</Label>
        <Input
          id="bot-instagram"
          type="text"
          value={ig}
          onChange={e => setIg(e.target.value)}
          placeholder="Ej. @mi.estudio"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Se muestra como botón al cliente después de enviar su solicitud.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border p-3">
        <Checkbox
          id="bot-ask-availability"
          checked={askAvailability}
          onCheckedChange={v => setAskAvailability(Boolean(v))}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="bot-ask-availability" className="cursor-pointer">
            Preguntar «¿Qué día se acomoda mejor a tu tiempo?»
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Si lo apagas, el bot se salta esa pregunta y va directo al resumen. Cuando está
            prendido, solo ofrece los días que tienes habilitados en tu horario (Ajustes → Horario).
          </p>
        </div>
      </div>

      <Button type="button" onClick={save} disabled={pending} className="h-10">
        {pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </section>
  )
}
