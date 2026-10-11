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

type Draft = { id?: string; title: string; body: string }

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
        Mensajes que usas seguido. En cualquier chat de Mensajes toca el botón <Zap className="inline size-3.5" /> y
        se escriben solos en el cuadro de texto. Son gratis, pero solo se pueden enviar dentro de las 24 h desde el
        último mensaje del cliente.
      </p>

      <ul className="space-y-2">
        {replies.map((r) => (
          <li key={r.id} className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{r.body}</p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Editar"
              disabled={pending}
              onClick={() => setEditing({ id: r.id, title: r.title, body: r.body })}
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
            placeholder="Mensaje que se escribirá en el chat"
          />
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
        <Button variant="outline" onClick={() => setEditing({ title: '', body: '' })}>
          <Plus />
          Nueva respuesta rápida
        </Button>
      )}
    </section>
  )
}
