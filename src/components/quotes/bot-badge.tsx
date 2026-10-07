import { Bot, PenLine } from 'lucide-react'

/**
 * Chip de origen de la cotización. Mismo componente para los dos estados
 * (antes solo existía el caso "bot"; las manuales no mostraban chip) — solo
 * cambia ícono + texto según `source`. Ver DESIGN.md §6.
 */
export function BotBadge({ source }: { source: 'manual' | 'bot' }) {
  const isBot = source === 'bot'
  const Icon = isBot ? Bot : PenLine
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 font-display text-[11px] font-medium uppercase tracking-wider text-white">
      <Icon className="size-3" aria-hidden />
      {isBot ? 'Desde bot' : 'Creada por mí'}
    </span>
  )
}
