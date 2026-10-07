'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Contact } from 'lucide-react'
import { toast } from 'sonner'

import { bulkCreateClientsAction } from '@/actions/clients'
import { Button } from '@/components/ui/button'

/** API experimental del navegador (Contact Picker), no tipada por TS todavía. */
type ContactsManager = {
  select: (
    properties: string[],
    options?: { multiple?: boolean }
  ) => Promise<{ name?: string[]; tel?: string[] }[]>
}

function getContactsManager(): ContactsManager | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as Navigator & { contacts?: ContactsManager }
  return nav.contacts ?? null
}

/**
 * Botón "Importar contactos": usa la Contact Picker API del navegador
 * (soportada en Chrome/Android; no disponible en Safari/iOS ni desktop) para
 * elegir contactos y crearlos como clientes de una. Si el navegador no la
 * soporta, avisa en vez de romper — no hay forma de leer la agenda del
 * teléfono desde una web en esos casos.
 */
export function PhoneContactsImport() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleImport() {
    const manager = getContactsManager()
    if (!manager) {
      toast.error(
        'Tu navegador no permite importar contactos del teléfono. Funciona en Chrome para Android.'
      )
      return
    }

    try {
      const picked = await manager.select(['name', 'tel'], { multiple: true })
      if (picked.length === 0) return

      setLoading(true)
      const contacts = picked.map((c) => ({
        name: c.name?.[0]?.trim() || 'Sin nombre',
        phone: c.tel?.[0]?.trim(),
      }))

      const result = await bulkCreateClientsAction(contacts)
      setLoading(false)

      if (!result.success) {
        toast.error(result.error.message)
        return
      }

      const { created, skipped } = result.data
      if (created === 0) {
        toast.info('Esos contactos ya estaban en tu lista de clientes.')
      } else {
        toast.success(
          `${created} ${created === 1 ? 'contacto importado' : 'contactos importados'}` +
            (skipped > 0 ? ` · ${skipped} ya existían` : '')
        )
        router.refresh()
      }
    } catch {
      // El usuario cerró el selector nativo sin elegir nada: no es un error.
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleImport} disabled={loading}>
      <Contact className="size-4" strokeWidth={1.8} aria-hidden="true" />
      {loading ? 'Importando…' : 'Importar contactos'}
    </Button>
  )
}
