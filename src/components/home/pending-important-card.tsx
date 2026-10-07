import Link from 'next/link'
import { FileText, CalendarClock, FileSignature, ArrowRight } from 'lucide-react'

type PendingItem = {
  href: string
  icon: React.ElementType
  title: string
  subtitle: string
}

/**
 * "Pendientes importantes" del Home en iPad/escritorio: nada de datos
 * nuevos, solo 3 conteos que ya existen en otras pantallas (cotizaciones
 * `status = 'new'`, consentimientos sin firmar, proyectos `status =
 * 'approval'` sin sesión agendada) resumidos en una tarjeta.
 */
export function PendingImportantCard({
  pendingQuotes,
  pendingConsents,
  unscheduledApproved,
}: {
  pendingQuotes: number
  pendingConsents: number
  unscheduledApproved: number
}) {
  const items: PendingItem[] = []
  if (pendingQuotes > 0) {
    items.push({
      href: '/dashboard/quotes',
      icon: FileText,
      title: `${pendingQuotes} ${pendingQuotes === 1 ? 'cotización pendiente' : 'cotizaciones pendientes'} de revisar`,
      subtitle: 'Responde para aumentar tus aprobaciones.',
    })
  }
  if (unscheduledApproved > 0) {
    items.push({
      href: '/dashboard/projects',
      icon: CalendarClock,
      title: `${unscheduledApproved} ${unscheduledApproved === 1 ? 'proyecto aprobado' : 'proyectos aprobados'} por agendar`,
      subtitle: unscheduledApproved === 1 ? 'Está listo para reservar fecha.' : 'Están listos para reservar fecha.',
    })
  }
  if (pendingConsents > 0) {
    items.push({
      href: '/dashboard/consents',
      icon: FileSignature,
      title: `${pendingConsents} ${pendingConsents === 1 ? 'consentimiento por firmar' : 'consentimientos por firmar'}`,
      subtitle: 'Pendiente de confirmación del cliente.',
    })
  }

  return (
    <section className="rounded-[1.75rem] bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Pendientes importantes</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No tienes pendientes por ahora.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href + item.title}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <item.icon className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
              </span>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
