import { z } from 'zod'

// Claves de los 8 pasos del onboarding (usadas por ONBOARDING_STEPS,
// onboarding_steps_done y saveOnboardingStep). Ver docs/superpowers/specs/2026-07-10-onboarding-8-pasos-design.md
export type OnboardingStepKey =
  | 'profile'
  | 'specialty'
  | 'experience'
  | 'studio'
  | 'socials'
  | 'deposit'
  | 'policies'
  | 'review'

// Valores exactos que se guardan como texto en la BD (studios/artists).
export const STUDIO_TYPE_VALUES = [
  'Estudio privado',
  'Estudio comercial',
  'Trabajo desde casa',
  'Cabina en otro negocio',
  'Artista independiente',
  'Artista itinerante',
] as const

export const EXPERIENCE_RANGE_VALUES = [
  'Menos de 1 año',
  '1 a 3 años',
  '3 a 5 años',
  '5 a 10 años',
  'Más de 10 años',
] as const

export const ARTIST_COUNT_VALUES = ['Solo yo', '2-3', '4-6', '7+'] as const

export const WEEK_DAY_VALUES = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const

export const DEPOSIT_MODE_VALUES = ['fixed', 'percent'] as const

export const PAYMENT_POLICY_VALUES = [
  'Abono obligatorio',
  'Pago total antes de la sesión',
  'Pago parcial y el resto al finalizar',
  'A convenir',
] as const

export const CANCELLATION_POLICY_VALUES = [
  'Cancela con 24h de anticipación: sin penalidad',
  'Cancela con menos de 24h: pierde el abono',
  'No se presenta: pierde el abono y no puede reagendar',
] as const

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

// Paso 1 — Perfil (OBLIGATORIO)
export const profileStepSchema = z.object({
  name: z.string().trim().min(2, 'Cuéntanos tu nombre'),
  artisticName: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  city: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
  whatsapp: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
})
export type ProfileStepInput = z.infer<typeof profileStepSchema>

// Paso 2 — Especialidad (opcional)
export const specialtyStepSchema = z.object({
  styles: z.array(z.string().trim().min(1).max(60)).max(10, 'Máximo 10 estilos').optional(),
  otherStyle: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
})
export type SpecialtyStepInput = z.infer<typeof specialtyStepSchema>

// Paso 3 — Experiencia (opcional)
export const experienceStepSchema = z.object({
  experienceRange: z.enum(EXPERIENCE_RANGE_VALUES).optional(),
  fullTime: z.boolean().optional(),
  ownStudio: z.boolean().optional(),
})
export type ExperienceStepInput = z.infer<typeof experienceStepSchema>

// Paso 4 — Estudio / agenda (OBLIGATORIO: studioType + openDays)
export const studioStepSchema = z.object({
  studioType: z.enum(STUDIO_TYPE_VALUES, { message: 'Selecciona un tipo de estudio' }),
  address: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
  mapsUrl: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
  artistCount: z.enum(ARTIST_COUNT_VALUES).optional(),
  openDays: z.array(z.enum(WEEK_DAY_VALUES)).min(1, 'Selecciona al menos un día'),
  openTime: z.string().trim().regex(HH_MM_REGEX, 'Hora inválida (HH:MM)').optional(),
  closeTime: z.string().trim().regex(HH_MM_REGEX, 'Hora inválida (HH:MM)').optional(),
})
export type StudioStepInput = z.infer<typeof studioStepSchema>

// Paso 5 — Redes sociales (opcional)
export const socialsStepSchema = z.object({
  instagram: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  tiktok: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  facebook: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  website: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,40}$/, 'Solo minúsculas, números y guiones (3-40)')
    .optional(),
})
export type SocialsStepInput = z.infer<typeof socialsStepSchema>

// Paso 6 — Abono para reservar (opcional, pero si hay modo debe haber monto)
export const depositStepSchema = z
  .object({
    depositMode: z.enum(DEPOSIT_MODE_VALUES).optional(),
    depositValue: z.number().positive('El monto debe ser mayor a 0').optional(),
  })
  .refine((data) => !data.depositMode || data.depositValue !== undefined, {
    message: 'Ingresa el monto del abono',
    path: ['depositValue'],
  })
export type DepositStepInput = z.infer<typeof depositStepSchema>

// Paso 7 — Políticas y reglas (opcional)
export const policiesStepSchema = z.object({
  paymentPolicy: z.enum(PAYMENT_POLICY_VALUES).optional(),
  cancellationPolicy: z.enum(CANCELLATION_POLICY_VALUES).optional(),
  rules: z.array(z.string().trim().min(1).max(120)).max(20, 'Máximo 20 reglas').optional(),
})
export type PoliciesStepInput = z.infer<typeof policiesStepSchema>
