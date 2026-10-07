'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

import { createClientAction } from '@/actions/clients'
import type { Client } from '@/queries/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Crea un cliente sin salir del modal (cotización / proyecto) y lo devuelve
 * vía onCreated para seleccionarlo de una. */
export function InlineCreateClient({ onCreated }: { onCreated: (c: Client) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setLoading(true)
    const result = await createClientAction({
      name: name.trim(),
      phone: phone.trim() || undefined,
    })
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cliente creado')
    onCreated(result.data)
    setOpen(false)
    setName('')
    setPhone('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <UserPlus className="size-3.5" />
        Nuevo cliente
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Input
        placeholder="Nombre del cliente"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Teléfono (opcional)"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={create} disabled={loading}>
          {loading ? 'Creando…' : 'Crear cliente'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
