import { CalendarCheck, Users, Clock3 } from 'lucide-react'

/** Fila de 3 métricas del día, en una sola tarjeta compacta (antes sin
 * caja contenedora) — parte de la compactación de Inicio para que quepa
 * todo en una pantalla sin scroll. */
export function TodayCards({
  citasHoy,
  clientesHoy,
  horasHoy,
}: {
  citasHoy: number
  clientesHoy: number
  horasHoy: number
}) {
  const items = [
    { icon: CalendarCheck, value: citasHoy, label: citasHoy === 1 ? 'Sesión hoy' : 'Sesiones hoy' },
    { icon: Users, value: clientesHoy, label: clientesHoy === 1 ? 'Cliente hoy' : 'Clientes hoy' },
    { icon: Clock3, value: horasHoy, label: 'Horas hoy' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card py-2.5">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-1 text-center">
          <span className="grid size-8 place-items-center rounded-full bg-background text-primary">
            <it.icon className="size-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-title text-xl leading-none tabular-nums">{it.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{it.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
