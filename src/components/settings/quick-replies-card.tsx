'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { deleteQuickReply, saveQuickReply } from '@/actions/whatsapp'
import type { WaQuickReply } from '@/queries/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { QUICK_REPLY_ICONS } from '@/components/inbox/quick-reply-icons'

type Draft = { id?: string; title: string; body: string; icon: string | null }

export function QuickRepliesCard({ replies }: { replies: WaQuickReply[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    if (!editing) return
    startTransition(async () => {
      const result = await saveQuickReply(editing)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(editing.id ? 'Respuesta actualizada' : 'Respuesta guardada')
      setEditing(null)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteQuickReply(id)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Respuesta eliminada')
      router.refresh()
    })
  }

  return (
    <section id="respuestas-rapidas" className="max-w-lg scroll-mt-20 space-y-4 rounded-2xl bg-card p-4 text-sm">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-primary" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em]">Respuestas rápidas</h2>
      </div>
      <p className="text-muted-foreground">
        Mensajes que usas seguido: se envían con un toque desde el botón <Zap className="inline size-3.5" /> del chat.
        Si les pones ícono, aparecen además como botón junto a &quot;Enviar formulario&quot;. Son gratis, pero solo se
        pueden enviar dentro de las 24 h desde el último mensaje del cliente.
      </p>

      <ul className="space-y-2">
        {replies.map((r) => (
          <li key={r.id} className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium">
                {r.icon && QUICK_REPLY_ICONS[r.icon] && (() => {
                  const Icon = QUICK_REPLY_ICONS[r.icon]!.icon
                  return <Icon className="size-3.5 text-primary" />
                })()}
                {r.title}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{r.body}</p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Editar"
              disabled={pending}
              onClick={() => setEditing({ id: r.id, title: r.title, body: r.body, icon: r.icon })}
            >
              <Pencil />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Eliminar" disabled={pending} onClick={() => remove(r.id)}>
              <Trash2 />
            </Button>
          </li>
        ))}
        {replies.length === 0 && !editing && (
          <li className="rounded-xl bg-muted/60 p-3 text-center text-xs text-muted-foreground">
            Todavía no tienes respuestas rápidas.
          </li>
        )}
      </ul>

      {editing ? (
        <div className="space-y-2 rounded-xl border border-foreground/10 p-3">
          <Input
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            placeholder="Nombre corto (ej. Enviar comprobante)"
            maxLength={60}
          />
          <Textarea
            rows={4}
            value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            placeholder="Mensaje que se enviará al cliente"
          />
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Botón en el chat</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setEditing({ ...editing, icon: null })}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs',
                  editing.icon === null ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-muted text-muted-foreground'
                )}
              >
                Solo en el menú
              </button>
              {Object.entries(QUICK_REPLY_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEditing({ ...editing, icon: key })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
                    editing.icon === key ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={pending || !editing.title.trim() || !editing.body.trim()}>
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setEditing({ title: '', body: '', icon: null })}>
          <Plus />
          Nueva respuesta rápida
        </Button>
      )}
    </section>
  )
}
