export const WIZARD_STEPS = [
  { key: 'client', label: 'Cliente' },
  { key: 'zone', label: 'Zona' },
  { key: 'details', label: 'Detalles' },
  { key: 'price', label: 'Precio' },
  { key: 'summary', label: 'Resumen' },
] as const
export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key']

export const FRONT_ZONES = [
  'Pecho', 'Brazo', 'Antebrazo', 'Mano', 'Muslo', 'Pierna', 'Tobillo', 'Pie',
  'Cuello', 'Hombro', 'Costado', 'Abdomen', 'Cadera', 'Pantorrilla',
] as const
export const BACK_ZONES = [
  'Nuca', 'Espalda alta', 'Espalda baja', 'Hombro', 'Brazo', 'Codo',
  'Glúteo', 'Muslo', 'Pantorrilla', 'Tobillo',
] as const

/** Tamaños del wizard (mockup 03). Guardan el string completo en quotes.size. */
export const WIZARD_SIZES = [
  { label: 'Pequeño', range: 'Hasta 10 cm', value: 'Pequeño (hasta 10 cm)', fill: 0.2 },
  { label: 'Mediano', range: '10 - 20 cm', value: 'Mediano (10 a 20 cm)', fill: 0.45 },
  { label: 'Grande', range: '20 - 30 cm', value: 'Grande (20 a 30 cm)', fill: 0.7 },
  { label: 'Muy grande', range: '+ 30 cm', value: 'Muy grande (más de 30 cm)', fill: 1 },
] as const

export const WORK_TYPES = [
  { label: 'Black & Grey', value: 'Negro' },
  { label: 'A color', value: 'Color' },
] as const

export const SESSION_OPTIONS = [1, 2, 3, 4] as const // 4 = "4+", habilita stepper
export const DURATION_STEP_MIN = 30
export const DURATION_MIN = 30
export const DURATION_MAX = 600
