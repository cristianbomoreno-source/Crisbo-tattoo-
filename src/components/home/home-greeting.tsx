import { firstName } from '@/lib/home/month-metrics'
import { NotificationBell } from '@/components/home/notification-bell'
import { LargeTitle } from '@/components/shared/large-title'

/** Encabezado de Inicio al estilo iOS: saludo pequeño, título grande "Inicio"
 * y a la derecha la campana y el avatar del perfil. */
export function HomeGreeting({
  name,
  greeting,
  dateLabel,
  logoUrl,
}: {
  name: string | null
  greeting: string
  dateLabel: string
  logoUrl?: string | null
}) {
  const who = name ? firstName(name) : null
  const initial = who ? who.charAt(0).toUpperCase() : 'C'

  return (
    <div>
      <p className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
        {who ? `${greeting}, ${who}` : greeting} · {dateLabel}
      </p>
      <LargeTitle title="Inicio" actions={<NotificationBell />} avatar={{ initial, photoUrl: logoUrl }} />
    </div>
  )
}
