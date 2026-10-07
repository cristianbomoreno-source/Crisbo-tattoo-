import {
  Store,
  Building2,
  Home,
  Armchair,
  UserRound,
  Globe,
  Brush,
  Hand,
  Gem,
  Skull,
  Crown,
  Wallet,
  CreditCard,
  Banknote,
  HandCoins,
  HeartHandshake,
  Clock,
  Ban,
  ShieldCheck,
  Camera,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import {
  STUDIO_TYPE_VALUES,
  EXPERIENCE_RANGE_VALUES,
  ARTIST_COUNT_VALUES,
  WEEK_DAY_VALUES,
  PAYMENT_POLICY_VALUES,
  CANCELLATION_POLICY_VALUES,
  type OnboardingStepKey,
} from '@/lib/validations/onboarding'

// Los 8 pasos del onboarding. Pasos 1 (profile) y 4 (studio) son obligatorios;
// el resto lleva "Configurar después". El 8 (review) siempre se muestra.
export const ONBOARDING_STEPS: { key: OnboardingStepKey; label: string; required: boolean }[] = [
  { key: 'profile', label: 'Perfil', required: true },
  { key: 'specialty', label: 'Especialidad', required: false },
  { key: 'experience', label: 'Experiencia', required: false },
  { key: 'studio', label: 'Tu estudio', required: true },
  { key: 'socials', label: 'Redes sociales', required: false },
  { key: 'deposit', label: 'Abono', required: false },
  { key: 'policies', label: 'Políticas', required: false },
  { key: 'review', label: 'Resumen', required: false },
]

// Paso 4 — tipo de estudio (6 cards)
export const STUDIO_TYPES: {
  value: (typeof STUDIO_TYPE_VALUES)[number]
  label: string
  icon: LucideIcon
}[] = [
  { value: 'Estudio privado', label: 'Estudio privado', icon: Store },
  { value: 'Estudio comercial', label: 'Estudio comercial', icon: Building2 },
  { value: 'Trabajo desde casa', label: 'Trabajo desde casa', icon: Home },
  { value: 'Cabina en otro negocio', label: 'Cabina en otro negocio', icon: Armchair },
  { value: 'Artista independiente', label: 'Artista independiente', icon: UserRound },
  { value: 'Artista itinerante', label: 'Artista itinerante', icon: Globe },
]

// Paso 3 — años tatuando (5 cards)
export const EXPERIENCE_RANGES: {
  value: (typeof EXPERIENCE_RANGE_VALUES)[number]
  label: string
  icon: LucideIcon
}[] = [
  { value: 'Menos de 1 año', label: 'Menos de 1 año', icon: Brush },
  { value: '1 a 3 años', label: '1 a 3 años', icon: Hand },
  { value: '3 a 5 años', label: '3 a 5 años', icon: Gem },
  { value: '5 a 10 años', label: '5 a 10 años', icon: Skull },
  { value: 'Más de 10 años', label: 'Más de 10 años', icon: Crown },
]

// Paso 4 — cuántos artistas trabajan
export const ARTIST_COUNTS: { value: (typeof ARTIST_COUNT_VALUES)[number]; label: string }[] = [
  { value: 'Solo yo', label: 'Solo yo' },
  { value: '2-3', label: '2-3' },
  { value: '4-6', label: '4-6' },
  { value: '7+', label: '7+' },
]

// Paso 4 — días de atención (multi-select)
export const WEEK_DAYS: { value: (typeof WEEK_DAY_VALUES)[number]; label: string }[] = [
  { value: 'LUN', label: 'LUN' },
  { value: 'MAR', label: 'MAR' },
  { value: 'MIE', label: 'MIE' },
  { value: 'JUE', label: 'JUE' },
  { value: 'VIE', label: 'VIE' },
  { value: 'SAB', label: 'SAB' },
  { value: 'DOM', label: 'DOM' },
]

// Paso 4 — horario, cada 30 min de 05:00 a 23:30
function buildTimeOptions(): string[] {
  const options: string[] = []
  for (let minutes = 5 * 60; minutes <= 23 * 60 + 30; minutes += 30) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    options.push(`${hh}:${mm}`)
  }
  return options
}
export const TIME_OPTIONS: string[] = buildTimeOptions()

// Paso 6 — abono sugerido
export const DEPOSIT_SUGGESTED_FIXED = [50000, 100000, 200000, 300000] as const
export const DEPOSIT_SUGGESTED_PCT = [10, 20, 30, 50] as const

// Paso 7 — política de pago (4 cards)
export const PAYMENT_POLICIES: {
  value: (typeof PAYMENT_POLICY_VALUES)[number]
  label: string
  subtitle: string
  icon: LucideIcon
}[] = [
  {
    value: 'Abono obligatorio',
    label: 'Abono obligatorio',
    subtitle: 'El cliente paga un abono para asegurar su cita.',
    icon: Wallet,
  },
  {
    value: 'Pago total antes de la sesión',
    label: 'Pago total antes',
    subtitle: 'El cliente paga el 100% antes de la sesión.',
    icon: CreditCard,
  },
  {
    value: 'Pago parcial y el resto al finalizar',
    label: 'Parcial + resto',
    subtitle: 'El cliente paga una parte y liquida el resto al terminar.',
    icon: Banknote,
  },
  {
    value: 'A convenir',
    label: 'A convenir',
    subtitle: 'Se define con el cliente caso a caso.',
    icon: HandCoins,
  },
]

// Paso 7 — política de cancelación (3 radios)
export const CANCELLATION_POLICIES: {
  value: (typeof CANCELLATION_POLICY_VALUES)[number]
  label: string
  subtitle: string
}[] = [
  {
    value: 'Cancela con 24h de anticipación: sin penalidad',
    label: 'Cancela con 24h de anticipación',
    subtitle: 'Sin penalidad si avisa con un día de anticipación.',
  },
  {
    value: 'Cancela con menos de 24h: pierde el abono',
    label: 'Cancela con menos de 24h',
    subtitle: 'Pierde el abono si cancela con menos de 24 horas.',
  },
  {
    value: 'No se presenta: pierde el abono y no puede reagendar',
    label: 'No se presenta',
    subtitle: 'Pierde el abono y no puede reagendar.',
  },
]

// Paso 7 — reglas del estudio (6 toggles; "Otras reglas" abre texto libre)
export const STUDIO_RULES: {
  value: string
  label: string
  subtitle: string
  icon: LucideIcon
}[] = [
  {
    value: 'Respeto',
    label: 'Respeto',
    subtitle: 'Trato respetuoso dentro del estudio.',
    icon: HeartHandshake,
  },
  {
    value: 'Puntualidad',
    label: 'Puntualidad',
    subtitle: 'Llegar a tiempo a la cita agendada.',
    icon: Clock,
  },
  {
    value: 'Sin alcohol ni drogas',
    label: 'Sin alcohol ni drogas',
    subtitle: 'No presentarse bajo efectos de alcohol o drogas.',
    icon: Ban,
  },
  {
    value: 'Cuidado del tatuaje',
    label: 'Cuidado del tatuaje',
    subtitle: 'Seguir las indicaciones de cuidado post-sesión.',
    icon: ShieldCheck,
  },
  {
    value: 'Fotos con permiso',
    label: 'Fotos con permiso',
    subtitle: 'El estudio puede tomar fotos con autorización.',
    icon: Camera,
  },
  {
    value: 'Otras reglas',
    label: 'Otras reglas',
    subtitle: 'Agrega una regla adicional en texto libre.',
    icon: FileText,
  },
]
