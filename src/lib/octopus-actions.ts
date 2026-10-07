import {
  Users,
  CalendarDays,
  Zap,
  FileText,
  Layers,
  BarChart3,
  Images,
  Settings,
  ClipboardList,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

/**
 * Catálogo de acciones que pueden vivir en los 4 botones del menú pulpo
 * (octopus-menu.tsx). La geometría de los tentáculos es fija (cada brazo está
 * resuelto a mano para terminar en su botón); lo configurable es QUÉ acción
 * ocupa cada uno de los 4 espacios. La elección se guarda por dispositivo en
 * localStorage (es una preferencia de interfaz, no un dato del estudio) y se
 * edita desde Ajustes → Personalización → "Menú del pulpo".
 */
export type OctopusAction = {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

export const OCTOPUS_ACTIONS: OctopusAction[] = [
  { id: 'clientes', label: 'Clientes', href: '/dashboard/clients', icon: Users },
  { id: 'agenda', label: 'Agenda', href: '/dashboard?openAgenda=1', icon: CalendarDays },
  { id: 'rapida', label: 'Rápida', href: '/dashboard/quotes/quick', icon: Zap },
  { id: 'formal', label: 'Formal', href: '/dashboard/quotes/new', icon: FileText },
  { id: 'proyectos', label: 'Proyectos', href: '/dashboard/projects', icon: Layers },
  { id: 'stats', label: 'Stats', href: '/dashboard/stats', icon: BarChart3 },
  { id: 'galeria', label: 'Galería', href: '/dashboard/gallery', icon: Images },
  { id: 'consents', label: 'Consent.', href: '/dashboard/consents', icon: ClipboardList },
  { id: 'ajustes', label: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  // Solo tiene sentido para el dueño de un estudio (invitar tatuadores a su
  // equipo) — ver DEFAULT_OCTOPUS_SLOTS_ESTUDIO. Igual queda en el catálogo
  // general para que cualquiera pueda asignarlo a un brazo si quiere.
  { id: 'colaborador', label: 'Colaborador', href: '/dashboard/settings/equipo?invite=1', icon: UserPlus },
]

/** Los 4 de siempre, en el orden de los brazos: ext. izq → int. izq → int. der → ext. der. */
export const DEFAULT_OCTOPUS_SLOTS = ['clientes', 'agenda', 'rapida', 'formal']

/** Default para cuentas de Estudio (dueño): "añadir colaborador" reemplaza
 * a "Formal" — cotizar formalmente es una tarea de tatuador, no de
 * administrador de estudio; armar el equipo sí lo es. */
export const DEFAULT_OCTOPUS_SLOTS_ESTUDIO = ['clientes', 'agenda', 'rapida', 'colaborador']

const STORAGE_KEY = 'ofink-octopus-slots'
/** Evento propio para que el menú se entere al instante cuando Ajustes guarda. */
export const OCTOPUS_CONFIG_EVENT = 'ofink-octopus-config'

export function actionById(id: string): OctopusAction {
  return OCTOPUS_ACTIONS.find((a) => a.id === id) ?? OCTOPUS_ACTIONS[0]!
}

export function readOctopusSlots(fallback: string[] = DEFAULT_OCTOPUS_SLOTS): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      parsed.every((id) => OCTOPUS_ACTIONS.some((a) => a.id === id))
    ) {
      return parsed
    }
    return fallback
  } catch {
    return fallback
  }
}

export function writeOctopusSlots(slots: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
    window.dispatchEvent(new Event(OCTOPUS_CONFIG_EVENT))
  } catch {
    // localStorage bloqueado: la preferencia simplemente no persiste.
  }
}
