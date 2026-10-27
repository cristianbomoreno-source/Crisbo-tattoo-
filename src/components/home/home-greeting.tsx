import { firstName } from '@/lib/home/month-metrics'
import { NotificationBell } from '@/components/home/notification-bell'
import { LargeTitle } from '@/components/shared/large-title'

/** Encabezado de Inicio al estilo iOS: título grande "Inicio" y a la derecha
 * la campana y el avatar del perfil (sin saludo ni fecha, a pedido). */
export function HomeGreeting({ name, logoUrl }: { name: string | null; greeting: string; dateLabel: string; logoUrl?: string | null }) {
  const who = name ? firstName(name) : null
  const initial = who ? who.charAt(0).toUpperCase() : 'C'

  return <LargeTitle title="Inicio" actions={<NotificationBell />} avatar={{ initial, photoUrl: logoUrl }} />
}
