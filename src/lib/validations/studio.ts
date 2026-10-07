import { z } from 'zod'
import {
  STUDIO_TYPE_VALUES,
  ARTIST_COUNT_VALUES,
  WEEK_DAY_VALUES,
  DEPOSIT_MODE_VALUES,
  PAYMENT_POLICY_VALUES,
  CANCELLATION_POLICY_VALUES,
  EXPERIENCE_RANGE_VALUES,
} from './onboarding'

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const updateStudioNameSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
})
export type UpdateStudioNameInput = z.infer<typeof updateStudioNameSchema>

export const updateQuoteTemplateSchema = z.object({
  quote_message_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
})
export type UpdateQuoteTemplateInput = z.infer<typeof updateQuoteTemplateSchema>

/** Las 4 plantillas de WhatsApp editables desde Ajustes → Personalización →
 * Plantillas de WhatsApp (`mensajes-form.tsx`). Incluye la de cotización de
 * siempre + las 3 nuevas (saldo pendiente, sesión, contacto general). */
export const updateMessageTemplatesSchema = z.object({
  quote_message_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  reminder_balance_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  reminder_session_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  contact_client_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  bot_contact_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  quote_confirm_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  booking_confirmation_template: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
})
export type UpdateMessageTemplatesInput = z.infer<typeof updateMessageTemplatesSchema>

export const updateQuoteLandingSchema = z.object({
  quote_letter_message: z.string().max(2000).optional(),
  quote_price_negotiable: z.coerce.boolean(),
})
export type UpdateQuoteLandingInput = z.infer<typeof updateQuoteLandingSchema>

/** Metas mensuales (Ajustes → Estudio → Metas), usadas en el dashboard de
 * Estadísticas. `null` = sin meta definida para ese indicador (no se dibuja
 * esa barra de progreso, no se inventa un número). */
export const updateMonthlyGoalsSchema = z.object({
  monthly_goal_quoted_value: z.number().min(0).max(999_999_999_999).nullable(),
  monthly_goal_approved_projects: z.number().int().min(0).max(100_000).nullable(),
  monthly_goal_scheduled_sessions: z.number().int().min(0).max(100_000).nullable(),
})
export type UpdateMonthlyGoalsInput = z.infer<typeof updateMonthlyGoalsSchema>

export const updateBotSettingsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  bot_ask_availability: z.boolean().default(true),
  whatsapp_phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{10,20}$/, 'Número inválido')
    .or(z.literal('')),
  instagram: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
})
export type UpdateBotSettingsInput = z.infer<typeof updateBotSettingsSchema>

export const LOGO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
export const LOGO_ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const

// --- Ajustes (rediseño hub, spec 2026-07-12-ajustes-rediseno.md) ---
// Reusan los enums canónicos del onboarding: los valores que van a la BD son
// los mismos que capturó el registro, para que editar en Ajustes no divergir.

// Pantalla 1 — Perfil del estudio (studios): nombre + ubicación + tipo + redes.
export const updateStudioProfileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  city: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
  address: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
  mapsUrl: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
  studioType: z.enum(STUDIO_TYPE_VALUES).optional(),
  artistCount: z.enum(ARTIST_COUNT_VALUES).optional(),
  instagram: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  tiktok: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  facebook: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  website: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
})
export type UpdateStudioProfileInput = z.infer<typeof updateStudioProfileSchema>

// Pantalla 2 — Enlace público (studios.slug). Mismo formato que updateBotSettings.
export const updateStudioSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
})
export type UpdateStudioSlugInput = z.infer<typeof updateStudioSlugSchema>

// Pantalla 3 — Horario (studios). Días SIN acento (WEEK_DAY_VALUES) + apertura/cierre.
export const updateStudioScheduleSchema = z.object({
  openDays: z.array(z.enum(WEEK_DAY_VALUES)).min(1, 'Selecciona al menos un día'),
  openTime: z.string().trim().regex(HH_MM_REGEX, 'Hora inválida (HH:MM)').optional(),
  closeTime: z.string().trim().regex(HH_MM_REGEX, 'Hora inválida (HH:MM)').optional(),
})
export type UpdateStudioScheduleInput = z.infer<typeof updateStudioScheduleSchema>

// Pantalla 5 — Abono (studios). Mismo refine que depositStepSchema.
export const updateStudioDepositSchema = z
  .object({
    depositMode: z.enum(DEPOSIT_MODE_VALUES).optional(),
    depositValue: z.number().positive('El monto debe ser mayor a 0').optional(),
  })
  .refine((d) => !d.depositMode || d.depositValue !== undefined, {
    message: 'Ingresa el monto del abono',
    path: ['depositValue'],
  })
export type UpdateStudioDepositInput = z.infer<typeof updateStudioDepositSchema>

// Pantalla 6 — Métodos de pago (studios.payment_methods). Sugeridos + libres.
export const PAYMENT_METHOD_OPTIONS = [
  'Efectivo',
  'Nequi',
  'Daviplata',
  'Transferencia',
  'Tarjeta',
] as const
export const updateStudioPaymentMethodsSchema = z.object({
  methods: z.array(z.string().trim().min(1).max(40)).max(12, 'Demasiados métodos'),
})
export type UpdateStudioPaymentMethodsInput = z.infer<typeof updateStudioPaymentMethodsSchema>

// Pantalla 7 — Políticas (studios). Mismos enums que policiesStepSchema.
export const updateStudioPoliciesSchema = z.object({
  paymentPolicy: z.enum(PAYMENT_POLICY_VALUES).optional(),
  cancellationPolicy: z.enum(CANCELLATION_POLICY_VALUES).optional(),
  rules: z.array(z.string().trim().min(1).max(120)).max(20, 'Máximo 20 reglas').optional(),
})
export type UpdateStudioPoliciesInput = z.infer<typeof updateStudioPoliciesSchema>

// Pantalla 10 — Perfil de artista (artists + studios.styles).
export const updateArtistProfileSchema = z.object({
  name: z.string().trim().min(2, 'Cuéntanos tu nombre').max(100, 'Máximo 100 caracteres'),
  styles: z.array(z.string().trim().min(1).max(60)).max(12, 'Máximo 12 estilos').optional(),
  experienceRange: z.enum(EXPERIENCE_RANGE_VALUES).optional(),
  fullTime: z.boolean().optional(),
  ownStudio: z.boolean().optional(),
})
export type UpdateArtistProfileInput = z.infer<typeof updateArtistProfileSchema>

export const updatePricePresetsSchema = z.object({
  presets: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        amount: z.coerce.number().min(0),
      })
    )
    .max(30),
})

export const updateSlotIntervalSchema = z.object({
  minutes: z.coerce.number().int().refine((n) => [15, 30, 60].includes(n), {
    message: 'Debe ser 15, 30 o 60 minutos',
  }),
})
