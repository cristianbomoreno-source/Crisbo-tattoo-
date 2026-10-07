'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { getMedicalAlertDetailsAction } from '@/actions/consent-links'

/**
 * "Este cliente reportó una condición médica. Revísala antes de iniciar la
 * sesión." — solo se monta cuando el proyecto tiene un consentimiento
 * firmado con `has_medical_alert`. El detalle (qué preguntas y su
 * explicación) se pide al tocar "Ver detalle", nunca se precarga: RLS de
 * `consent_links` ya garantiza que solo el tatuador asignado o el dueño
 * del estudio pueden obtenerlo.
 */
export function MedicalAlertBanner({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<{ label: string; detail: string }[] | null>(null)

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (details !== null) return
    setLoading(true)
    const result = await getMedicalAlertDetailsAction(projectId)
    setLoading(false)
    if (result.success) setDetails(result.data)
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <AlertTriangle className="size-4.5 shrink-0 text-destructive" strokeWidth={2} />
        <span className="min-w-0 flex-1 text-sm font-medium text-destructive">
          Este cliente reportó una condición médica. Revísala antes de iniciar la sesión.
        </span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-destructive" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-destructive" strokeWidth={2} />
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t border-destructive/30 px-4 py-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Cargando…</p>
          ) : !details || details.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin detalle disponible.</p>
          ) : (
            details.map((d) => (
              <div key={d.label} className="text-sm">
                <p className="font-medium">{d.label.replace(/^¿|\?$/g, '')}</p>
                {d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
