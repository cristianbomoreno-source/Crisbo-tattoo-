'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ClipboardList, Mail, Phone, RefreshCw, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { refreshDataFormStatus, setupDataForm } from '@/actions/whatsapp'
import type { WhatsAppAccountStatus } from '@/queries/whatsapp'
import { FORM_BUTTON_TEXT, formTemplateBody } from '@/lib/whatsapp-cloud/data-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const FIELDS = [
  { icon: UserRound, label: 'Nombre completo' },
  { icon: Phone, label: 'Celular' },
  { icon: Mail, label: 'Correo' },
  { icon: CalendarDays, label: 'Fecha de nacimiento' },
]

const STATUS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprobada', className: 'bg-income/15 text-income' },
  PENDING: { label: 'En revisión de Meta', className: 'bg-amber-400/15 text-amber-200' },
  REJECTED: { label: 'Rechazada', className: 'bg-destructive/15 text-destructive' },
  PAUSED: { label: 'Pausada por Meta', className: 'bg-amber-400/15 text-amber-200' },
  DISABLED: { label: 'Desactivada', className: 'bg-destructive/15 text-destructive' },
}

export function WhatsAppDataFormCard({
  account,
  studioName,
}: {
  account: WhatsAppAccountStatus
  studioName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const status = account.formTemplateStatus
  const badge = status ? (STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }) : null
  const canRecreate = !status || status === 'REJECTED' || status === 'DISABLED'

  function create() {
    startTransition(async () => {
      const result = await setupDataForm()
      if (!result.success) {
        toast.error(result.error.message, { duration: 10000 })
        return
      }
      toast.success(
        result.data.status === 'APPROVED'
          ? 'Plantilla aprobada: ya puedes enviar el formulario desde Mensajes'
          : 'Formulario creado. Meta está revisando la plantilla (suele tardar unos minutos).'
      )
      router.refresh()
    })
  }

  function refresh() {
    startTransition(async () => {
      const result = await refreshDataFormStatus()
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(`Estado: ${STATUS[result.data.status]?.label ?? result.data.status}`)
      router.refresh()
    })
  }

  return (
    <section className="max-w-lg space-y-4 rounded-2xl bg-card p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h2 className="text-[1.0625rem] font-semibold">Formulario de datos</h2>
        </div>
        {badge && (
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium', badge.className)}>
            {badge.label}
          </span>
        )}
      </div>

      <p className="text-muted-foreground">
        Un formulario de WhatsApp Flows que el cliente llena sin salir del chat. Las respuestas llegan a Mensajes y se
        guardan solas en su ficha de cliente (si no existe, se crea).
      </p>

      <ul className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs">
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            {label}
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-muted/60 p-3 text-xs">
        <p className="mb-1.5 font-medium text-muted-foreground">Mensaje de la plantilla</p>
        <p className="whitespace-pre-wrap">{formTemplateBody(account.verifiedName || studioName)}</p>
        <p className="mt-2 rounded-lg bg-background/60 py-1.5 text-center font-medium text-primary">
          {FORM_BUTTON_TEXT}
        </p>
      </div>

      {account.formTemplateReason && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Motivo de Meta: {account.formTemplateReason}
        </p>
      )}
      {status === 'APPROVED' && (
        <p className="rounded-lg bg-income/10 px-3 py-2 text-xs text-income">
          Listo: en cualquier chat de Mensajes toca <strong>Enviar formulario</strong>. Funciona incluso si pasaron más
          de 24 h desde el último mensaje del cliente.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canRecreate && (
          <Button onClick={create} disabled={pending}>
            {pending ? 'Creando en Meta…' : status ? 'Crear de nuevo' : 'Crear formulario y plantilla'}
          </Button>
        )}
        {status && status !== 'APPROVED' && (
          <Button variant="outline" onClick={refresh} disabled={pending}>
            <RefreshCw className={cn(pending && 'animate-spin')} />
            Actualizar estado
          </Button>
        )}
      </div>
    </section>
  )
}
