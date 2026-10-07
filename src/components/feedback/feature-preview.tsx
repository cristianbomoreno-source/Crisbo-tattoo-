import {
  Home,
  CalendarDays,
  Users,
  FileText,
  FolderKanban,
  Signature,
  Images,
  Wallet,
  Package,
  Bot,
  Settings,
  UsersRound,
  Link2,
  Bell,
} from 'lucide-react'
import type { PreviewKind } from '@/lib/feedback/features'

const ICONS: Record<PreviewKind, React.ElementType> = {
  home: Home,
  calendar: CalendarDays,
  clients: Users,
  quotes: FileText,
  projects: FolderKanban,
  consents: Signature,
  gallery: Images,
  payments: Wallet,
  inventory: Package,
  bot: Bot,
  settings: Settings,
  team: UsersRound,
  'public-page': Link2,
  notifications: Bell,
}

/** Mockup mini genérico: unas líneas + el ícono de la sección, con el
 * mismo lenguaje visual de OFINK (fondo negro, tarjeta, acento lima).
 * Ayuda a identificar la función sin ser una captura literal de pantalla. */
export function FeaturePreview({ kind, screenshot }: { kind: PreviewKind; screenshot?: string }) {
  if (screenshot) {
    return (
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-black sm:h-28 sm:w-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
    )
  }

  const Icon = ICONS[kind]

  return (
    <div className="relative flex h-28 w-full shrink-0 flex-col justify-between overflow-hidden rounded-xl bg-black p-3 sm:w-24">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary/60" />
        <span className="h-1.5 w-10 rounded-full bg-white/10" />
        <span className="ml-auto grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-3/4 rounded-full bg-white/10" />
        <div className="h-2 w-1/2 rounded-full bg-white/10" />
      </div>
      <div className="flex gap-1.5">
        <span className="h-4 flex-1 rounded-md bg-white/[0.06]" />
        <span className="h-4 flex-1 rounded-md bg-primary/15" />
        <span className="h-4 flex-1 rounded-md bg-white/[0.06]" />
      </div>
    </div>
  )
}
