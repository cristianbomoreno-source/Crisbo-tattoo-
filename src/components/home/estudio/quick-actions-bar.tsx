'use client'

import Link from 'next/link'
import { CalendarPlus, Lock, UserPlus, Wallet } from 'lucide-react'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'

function ActionButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card px-2 py-3 text-center transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="text-[11px] font-medium leading-tight text-foreground/90">{label}</span>
    </Link>
  )
}

/** 4 accesos directos del Home de Estudio. "Nuevo cliente" abre el mismo
 * diálogo de siempre (`CreateClientDialog`); el resto enlaza a la pantalla
 * que ya resuelve esa acción (agendar por tatuador, bloquear fecha,
 * registrar pago) — no se duplica esa lógica aquí. */
export function EstudioQuickActions() {
  return (
    <div className="flex gap-2">
      <ActionButton icon={CalendarPlus} label="Nueva cita" href="/dashboard/estudio/calendario" />
      <ActionButton icon={Lock} label="Bloquear horario" href="/dashboard/settings/fechas" />
      <CreateClientDialog
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card px-2 py-3 text-center transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
              <UserPlus className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-foreground/90">Nuevo cliente</span>
          </button>
        }
      />
      <ActionButton icon={Wallet} label="Registrar pago" href="/dashboard/projects" />
    </div>
  )
}
