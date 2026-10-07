import { z } from 'zod'

export const INTAKE_MAX_PHOTOS = 3
export const INTAKE_PHOTO_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
export const INTAKE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Género de la persona — se usa para elegir la librería de renders del
 * selector visual (masculina/femenina) y también se guarda en la cotización
 * (`quotes.gender`) para las estadísticas de público del estudio. */
export const INTAKE_GENDERS = ['Hombre', 'Mujer'] as const

export const INTAKE_SERVICES = [
  'Tatuaje',
  'Cover up',
  'Retoque',
  'Diseño personalizado',
  'Otro',
] as const

export const INTAKE_STYLES = [
  'Realismo', 'Microrealismo', 'Black & Grey', 'Blackwork', 'Minimalista', 'Línea fina',
  'Neotradicional', 'Tradicional', 'Chicano', 'Lettering', 'Acuarela', 'Anime',
  'Oriental', 'Dotwork', 'Tribal', 'Surrealismo', 'Otro', 'No lo sé',
] as const

export const INTAKE_SIZES = [
  'No lo sé',
  'Muy pequeño (menos de 4 cm)',
  'Pequeño (5 a 9 cm)',
  'Mediano (10 a 15 cm)',
  'Grande (16 a 20 cm)',
  'Muy grande (más de 20 cm)',
] as const

export const INTAKE_ZONES = [
  'No lo sé', 'Cabeza', 'Cuello', 'Pecho', 'Espalda', 'Hombro', 'Brazo', 'Antebrazo', 'Muñeca',
  'Mano', 'Costillas', 'Abdomen', 'Cintura', 'Glúteo', 'Muslo', 'Pierna', 'Pantorrilla', 'Tobillo',
  'Pie', 'Ingle',
] as const

export const INTAKE_ARM_SUBZONES = [
  'Manga completa', 'Media manga (muñeca a codo)', 'Media manga (codo a hombro)',
  'Bíceps', 'Tríceps', 'Codo', 'Antebrazo', 'Muñeca', 'No lo sé',
] as const

export const INTAKE_LEG_SUBZONES = [
  'Muslo', 'Rodilla', 'Pantorrilla', 'Tobillo', 'Pierna completa', 'No lo sé',
] as const

export const INTAKE_COLORS = ['No lo sé', 'Color', 'Negro'] as const

export const INTAKE_SKIN_TONES = [
  { label: 'Claro', hex: '#F3D9C6' },
  { label: 'Medio claro', hex: '#E8C39E' },
  { label: 'Medio', hex: '#C99B6A' },
  { label: 'Medio oscuro', hex: '#9A6B43' },
  { label: 'Oscuro', hex: '#6B4226' },
  { label: 'Muy oscuro', hex: '#3E2718' },
] as const

export const INTAKE_SKIN_TONE_LABELS = [
  'Claro', 'Medio claro', 'Medio', 'Medio oscuro', 'Oscuro', 'Muy oscuro',
  'Prefiero no decir',
] as const

export const INTAKE_AVAILABILITY = [
  'Mañanas',
  'Tardes',
  'Noches',
  'Fines de semana',
  'Otro',
] as const

export const intakeSchema = z.object({
  slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2, 'Cuéntame tu nombre').max(80),
  gender: z.enum(INTAKE_GENDERS),
  age: z.coerce.number().int().min(10, 'Edad inválida').max(100, 'Edad inválida'),
  // Opcional a propósito: si el cliente ya existía con `birthdate` guardado,
  // el bot salta la pregunta y no viaja un valor nuevo — no se sobreescribe
  // lo que ya había. Solo llega con dato cuando SÍ se preguntó.
  birthdate: z.string().trim().max(10).optional().or(z.literal('')),
  service: z.enum(INTAKE_SERVICES).optional(),
  // Antes un enum de un solo valor; el carrusel de estilos ahora permite
  // selección múltiple y las guarda unidas por coma ("Realismo, Blackwork"),
  // así que valida como texto libre (igual que ya hacía `validations/quotes.ts`).
  style: z.string().trim().max(300).optional(),
  size: z.enum(INTAKE_SIZES),
  body_zone: z.string().trim().min(2).max(80),
  color: z.enum(INTAKE_COLORS),
  skin_tone: z.enum(INTAKE_SKIN_TONE_LABELS),
  description: z.string().trim().min(10, 'Cuéntame un poco más de tu idea').max(1000),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono inválido').max(20),
  // Antes un enum fijo (mañanas/tardes/...); ahora el cliente elige días reales
  // del calendario del estudio (ver 'availability' en body-map-explorer/intake-chat),
  // así que el valor es texto libre (p. ej. "Lunes 22 jul, Miércoles 24 jul").
  availability: z.string().trim().min(1, 'Elige al menos un día').max(300),
  // Honeypot: los humanos nunca ven este campo; si trae algo, es un bot.
  website: z.literal(''),
})

export type IntakeInput = z.infer<typeof intakeSchema>
