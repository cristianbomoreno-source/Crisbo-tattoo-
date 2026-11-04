'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { tryAdAgent, updateAdAgent } from '@/actions/ad-agent'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/** Enciende el agente que contesta los chats de la pauta y deja editar lo que
 * sabe. Los valores que no estén en este texto el agente no los puede decir. */
export function AdAgentForm({ enabled, knowledge }: { enabled: boolean; knowledge: string }) {
  const [text, setText] = useState(knowledge)
  const [pending, start] = useTransition()

  function save(nextEnabled: boolean) {
    start(async () => {
      const result = await updateAdAgent({ enabled: nextEnabled, knowledge: text })
      if (result.success) toast.success(nextEnabled === enabled ? 'Información guardada' : nextEnabled ? 'Agente encendido' : 'Agente apagado')
      else toast.error(result.error.message)
    })
  }

  return (
    <SettingsSubpage title="Agente de pauta" description="Contesta como tú en WhatsApp y ofrece los espacios libres de tu agenda.">
      <div className="space-y-5">
        <div className="rounded-2xl bg-card p-4">
          <p className="text-[15px] font-semibold">{enabled ? 'Encendido' : 'Apagado'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Atiende la pauta y los chats nuevos. En Mensajes escoges con el botón IA / Yo quién contesta cada chat. Si escribes en un chat, se aparta. Te avisa con comprobantes y precios fuera de la oferta.
          </p>
          <Button className="mt-3" variant={enabled ? 'secondary' : 'default'} disabled={pending} onClick={() => save(!enabled)}>
            {enabled ? 'Apagar agente' : 'Encender agente'}
          </Button>
        </div>

        <div>
          <label htmlFor="ad-agent-knowledge" className="text-sm font-medium">
            Lo que sabe el agente
          </label>
          <p className="mt-0.5 mb-2 text-xs text-muted-foreground">Oferta, precios, abono y dirección. Cámbialo cuando cambie la promo.</p>
          <Textarea id="ad-agent-knowledge" rows={18} value={text} onChange={(e) => setText(e.target.value)} />
          <Button className="mt-3" variant="secondary" disabled={pending || text === knowledge} onClick={() => save(enabled)}>
            Guardar información
          </Button>
        </div>

        <AdAgentTrial knowledge={text} />
      </div>
    </SettingsSubpage>
  )
}

type TrialMessage = { direction: 'in' | 'out'; body: string }

/** Conversa con el agente como si fueras un cliente. No envía nada a nadie. */
function AdAgentTrial({ knowledge }: { knowledge: string }) {
  const [messages, setMessages] = useState<TrialMessage[]>([])
  const [draft, setDraft] = useState('Hola Crisbo, quiero un CUPO de noviembre')
  const [handoff, setHandoff] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function send() {
    const next = [...messages, { direction: 'in' as const, body: draft.trim() }]
    setMessages(next)
    setDraft('')
    start(async () => {
      const result = await tryAdAgent({ knowledge, messages: next })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setMessages([...next, ...result.data.bubbles.map((body) => ({ direction: 'out' as const, body }))])
      if (result.data.handoff) setHandoff(result.data.reason)
    })
  }

  function reset() {
    setMessages([])
    setHandoff(null)
  }

  return (
    <div>
      <p className="text-sm font-medium">Probar el agente</p>
      <p className="mt-0.5 mb-2 text-xs text-muted-foreground">Escríbele como un cliente. Esto no envía nada a nadie.</p>
      <div className="space-y-1.5 rounded-2xl bg-card p-3">
        {messages.map((m, i) => (
          <p
            key={i}
            className={
              m.direction === 'in'
                ? 'ml-auto w-fit max-w-[85%] rounded-xl bg-secondary px-3 py-1.5 text-sm whitespace-pre-wrap'
                : 'w-fit max-w-[85%] rounded-xl bg-primary px-3 py-1.5 text-sm whitespace-pre-wrap text-primary-foreground'
            }
          >
            {m.body}
          </p>
        ))}
        {pending && <p className="text-xs text-muted-foreground">Escribiendo…</p>}
        {handoff && <p className="pt-1 text-xs text-muted-foreground">Te pasaría el chat: {handoff}</p>}
        <form
          className="flex gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim() && !pending && !handoff) send()
          }}
        >
          <Input aria-label="Mensaje de prueba" value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!!handoff} />
          <Button type="submit" disabled={pending || !draft.trim() || !!handoff}>
            Enviar
          </Button>
        </form>
        {messages.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Empezar de nuevo
          </Button>
        )}
      </div>
    </div>
  )
}
