'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { deleteMyAccount } from '@/actions/delete-account'

export function DeleteAccountSection({ isOwner, studioName }: { isOwner: boolean; studioName: string }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [pending, startTransition] = useTransition()

  const canConfirm = confirmText.trim().toUpperCase() === 'ELIMINAR'

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMyAccount()
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      window.location.href = '/login'
    })
  }

  return (
    <section className="mt-8 rounded-[1.75rem] border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="font-title text-lg uppercase leading-none text-destructive">Zona de peligro</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isOwner
              ? `Esto borra TODO "${studioName}" para siempre: proyectos, clientes, cotizaciones, pagos, citas, galería y enlaces. No hay vuelta atrás.`
              : 'Esto elimina tu cuenta de este estudio. No hay vuelta atrás.'}
          </p>
        </div>
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-semibold text-destructive"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Escribe <span className="font-bold">ELIMINAR</span> para confirmar.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoCapitalize="characters"
            className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setExpanded(false)
                setConfirmText('')
              }}
              className="flex-1 rounded-xl bg-card px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canConfirm || pending}
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {pending ? 'Eliminando…' : 'Eliminar para siempre'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
