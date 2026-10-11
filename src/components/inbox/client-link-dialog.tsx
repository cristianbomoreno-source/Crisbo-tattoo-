'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClientFromConversation, linkConversationClient } from '@/actions/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ClientOption = { id: string; name: string; phone: string | null }

/** Guarda el contacto del chat como cliente nuevo, o lo vincula a uno que
 * ya existe (p. ej. el cliente escribió desde otro número). */
export function ClientLinkDialog({
  open,
  onOpenChange,
  conversationId,
  suggestedName,
  currentClientId,
  clients,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  suggestedName: string
  currentClientId: string | null
  clients: ClientOption[]
  onDone: () => void
}) {
  const [name, setName] = useState(suggestedName)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '∅'))
      : clients
    return list.slice(0, 50)
  }, [clients, query])

  function run(fn: () => Promise<{ success: boolean; error?: { message: string } }>, msg: string) {
    startTransition(async () => {
      const result = await fn()
      if (!result.success) {
        toast.error(result.error?.message ?? 'No se pudo guardar')
        return
      }
      toast.success(msg)
      onOpenChange(false)
      onDone()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cliente del chat</DialogTitle>
          <DialogDescription>Guarda este contacto como cliente o vincúlalo a uno existente.</DialogDescription>
        </DialogHeader>

        {!currentClientId && (
          <div className="space-y-2 rounded-xl bg-muted/50 p-3">
            <Label htmlFor="wa-client-name">Crear cliente nuevo</Label>
            <div className="flex gap-2">
              <Input
                id="wa-client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
              />
              <Button
                disabled={pending || !name.trim()}
                onClick={() => run(() => createClientFromConversation(conversationId, name), 'Cliente guardado')}
              >
                <UserPlus />
                Crear
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>{currentClientId ? 'Cambiar a otro cliente' : 'O vincular a un cliente existente'}</Label>
          <label className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <ul className="max-h-60 overflow-y-auto rounded-lg border border-border/60">
            {matches.length === 0 ? (
              <li className="p-3 text-center text-xs text-muted-foreground">Sin resultados</li>
            ) : (
              matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={pending || c.id === currentClientId}
                    onClick={() => run(() => linkConversationClient(conversationId, c.id), `Chat vinculado a ${c.name}`)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 border-b border-border/40 px-3 py-2 text-left text-sm last:border-0 hover:bg-accent/60 disabled:opacity-60',
                      c.id === currentClientId && 'bg-primary/10'
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.id === currentClientId ? 'Actual' : c.phone}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {currentClientId && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => run(() => linkConversationClient(conversationId, null), 'Cliente desvinculado')}
            >
              Desvincular cliente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
