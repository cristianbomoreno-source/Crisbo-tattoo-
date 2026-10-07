import type { INTAKE_SIZES, INTAKE_ZONES, INTAKE_ARM_SUBZONES, INTAKE_LEG_SUBZONES, INTAKE_GENDERS } from '@/lib/validations/intake'

const BODY_ASSETS_PATH = '/body'

type Gender = typeof INTAKE_GENDERS[number]

/** 'Hombre'/'Mujer' → prefijo de archivo. Si el usuario no dijo su género
 * (paso opcional / "Prefiero no decir"), se usa 'male' como base neutra por
 * defecto — misma silueta para ambos casos, no afecta el dato guardado. */
function assetGender(gender: Gender | null | undefined): 'male' | 'female' {
  return gender === 'Mujer' ? 'female' : 'male'
}

/** Nombre corto por tamaño (para el subtítulo de cada tarjeta). */
export const SIZE_DESCRIPTIONS: Record<typeof INTAKE_SIZES[number], string> = {
  'No lo sé': 'Aún estoy explorando las posibilidades.',
  'Muy pequeño (menos de 4 cm)': 'Menos de 4 cm',
  'Pequeño (5 a 9 cm)': '5 a 9 cm',
  'Mediano (10 a 15 cm)': '10 a 15 cm',
  'Grande (16 a 20 cm)': '16 a 20 cm',
  'Muy grande (más de 20 cm)': 'Más de 20 cm',
}

export const SIZE_SHORT_LABELS: Record<typeof INTAKE_SIZES[number], string> = {
  'No lo sé': 'No lo sé',
  'Muy pequeño (menos de 4 cm)': 'Muy pequeño',
  'Pequeño (5 a 9 cm)': 'Pequeño',
  'Mediano (10 a 15 cm)': 'Mediano',
  'Grande (16 a 20 cm)': 'Grande',
  'Muy grande (más de 20 cm)': 'Muy grande',
}

const SIZE_FILE: Record<typeof INTAKE_SIZES[number], string> = {
  'No lo sé': 'body-size-unknown',
  'Muy pequeño (menos de 4 cm)': 'body-size-xs',
  'Pequeño (5 a 9 cm)': 'body-size-s',
  'Mediano (10 a 15 cm)': 'body-size-m',
  'Grande (16 a 20 cm)': 'body-size-l',
  'Muy grande (más de 20 cm)': 'body-size-xl',
}

const ZONE_FILE: Record<typeof INTAKE_ZONES[number], string> = {
  'No lo sé': 'body-size-unknown',
  Cabeza: 'body-head',
  Cuello: 'body-neck',
  Pecho: 'body-chest',
  Espalda: 'body-back',
  Hombro: 'body-shoulder',
  Brazo: 'body-arm',
  Antebrazo: 'body-forearm',
  Muñeca: 'body-wrist',
  Mano: 'body-hand',
  Costillas: 'body-ribs',
  Abdomen: 'body-abdomen',
  Cintura: 'body-waist',
  Glúteo: 'body-glute',
  Muslo: 'body-thigh',
  Pierna: 'body-leg',
  Pantorrilla: 'body-calf',
  Tobillo: 'body-ankle',
  Pie: 'body-foot',
  Ingle: 'body-groin',
}

const ARM_SUBZONE_FILE: Record<typeof INTAKE_ARM_SUBZONES[number], string> = {
  'Manga completa': 'body-arm-full-sleeve',
  'Media manga (muñeca a codo)': 'body-arm-half-lower',
  'Media manga (codo a hombro)': 'body-arm-half-upper',
  Bíceps: 'body-arm-bicep',
  Tríceps: 'body-arm-tricep',
  Codo: 'body-arm-elbow',
  Antebrazo: 'body-arm-forearm-sub',
  Muñeca: 'body-arm-wrist-sub',
  'No lo sé': 'body-arm-unknown',
}

export const ARM_SUBZONE_DESCRIPTIONS: Record<typeof INTAKE_ARM_SUBZONES[number], string> = {
  'Manga completa': 'Hombro a muñeca',
  'Media manga (muñeca a codo)': 'Codo a muñeca',
  'Media manga (codo a hombro)': 'Hombro a codo',
  Bíceps: 'Parte superior del brazo',
  Tríceps: 'Parte posterior del brazo',
  Codo: 'Zona de la articulación',
  Antebrazo: 'Interior o exterior',
  Muñeca: 'Zona de la muñeca',
  'No lo sé': 'Aún no lo tengo claro',
}

const LEG_SUBZONE_FILE: Record<typeof INTAKE_LEG_SUBZONES[number], string> = {
  Muslo: 'body-leg-thigh-sub',
  Rodilla: 'body-leg-knee',
  Pantorrilla: 'body-leg-calf-sub',
  Tobillo: 'body-leg-ankle-sub',
  'Pierna completa': 'body-leg-full',
  'No lo sé': 'body-leg-unknown',
}

export const LEG_SUBZONE_DESCRIPTIONS: Record<typeof INTAKE_LEG_SUBZONES[number], string> = {
  Muslo: 'Parte superior de la pierna',
  Rodilla: 'Zona de la articulación',
  Pantorrilla: 'Parte posterior inferior',
  Tobillo: 'Zona del tobillo',
  'Pierna completa': 'De la cadera al tobillo',
  'No lo sé': 'Aún no lo tengo claro',
}

export function sizeRender(gender: Gender | null | undefined, size: typeof INTAKE_SIZES[number]): string {
  return `${BODY_ASSETS_PATH}/${assetGender(gender)}-${SIZE_FILE[size]}.webp`
}

export function zoneRender(gender: Gender | null | undefined, zone: typeof INTAKE_ZONES[number]): string {
  return `${BODY_ASSETS_PATH}/${assetGender(gender)}-${ZONE_FILE[zone]}.webp`
}

export function armSubzoneRender(gender: Gender | null | undefined, subzone: typeof INTAKE_ARM_SUBZONES[number]): string {
  return `${BODY_ASSETS_PATH}/${assetGender(gender)}-${ARM_SUBZONE_FILE[subzone]}.webp`
}

export function legSubzoneRender(gender: Gender | null | undefined, subzone: typeof INTAKE_LEG_SUBZONES[number]): string {
  return `${BODY_ASSETS_PATH}/${assetGender(gender)}-${LEG_SUBZONE_FILE[subzone]}.webp`
}

/** Estilo → slug del archivo en public/styles/style-{slug}.webp. Única fuente
 * de verdad, usada tanto por el bot (`StyleCards`) como por el wizard de
 * cotización formal (`StepDetails`) — "Otro" y "No lo sé" no tienen foto. */
export const STYLE_SLUG: Record<string, string> = {
  Realismo: 'realismo',
  Microrealismo: 'microrealismo',
  'Black & Grey': 'black-grey',
  Blackwork: 'blackwork',
  Minimalista: 'minimalista',
  'Línea fina': 'linea-fina',
  Neotradicional: 'neotradicional',
  Tradicional: 'tradicional',
  Chicano: 'chicano',
  Lettering: 'lettering',
  Acuarela: 'acuarela',
  Anime: 'anime',
  Oriental: 'oriental',
  Dotwork: 'dotwork',
  Tribal: 'tribal',
  Surrealismo: 'surrealismo',
}

export function styleRender(style: string): string | null {
  const slug = STYLE_SLUG[style]
  return slug ? `/styles/style-${slug}.webp` : null
}
