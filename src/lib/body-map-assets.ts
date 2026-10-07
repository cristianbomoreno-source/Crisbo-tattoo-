const BASE = '/body-map'

export type MapGender = 'Hombre' | 'Mujer'
export type Vista = 'Frente' | 'Espaldas'
export type Region = 'Cabeza' | 'Brazos' | 'Torso' | 'Piernas'
export type Lado = 'izquierdo' | 'derecho' // brazo
export type LadoPierna = 'izquierda' | 'derecha'
export type Profundidad = 'externa' | 'interna'

function g(gender: MapGender): 'male' | 'female' {
  return gender === 'Mujer' ? 'female' : 'male'
}

export function sexoImage(gender: MapGender): string {
  return `${BASE}/sexo-${gender === 'Mujer' ? 'mujer' : 'hombre'}.webp`
}

export function regionImage(gender: MapGender, region: Region): string {
  const map: Record<Region, string> = { Cabeza: 'cabeza', Brazos: 'brazos', Torso: 'torso', Piernas: 'piernas' }
  return `${BASE}/${g(gender)}-region-${map[region]}.webp`
}

// ---- Cabeza ----
export const CUELLO_OPTIONS = [
  { key: 'lateral-der', label: 'Lateral derecho' },
  { key: 'lateral-izq', label: 'Lateral izquierdo' },
  { key: 'centro', label: 'Centro' },
  { key: 'completo', label: 'Cuello completo' },
] as const

export const CARA_OPTIONS = [
  { key: 'orejas', label: 'Orejas' },
  { key: 'frente', label: 'Frente' },
  { key: 'pomulos', label: 'Pómulos' },
] as const

export function cuelloImage(gender: MapGender, key: string): string {
  return `${BASE}/${g(gender)}-cabeza-cuello-${key}.webp`
}
export function caraImage(gender: MapGender, key: string): string {
  return `${BASE}/${g(gender)}-cabeza-cara-${key}.webp`
}

// ---- Brazos ----
export function brazoLadoImage(gender: MapGender, lado: Lado): string {
  return `${BASE}/${g(gender)}-brazo-${lado}.webp`
}
export function brazoProfundidadImage(gender: MapGender, lado: Lado, prof: Profundidad): string {
  return `${BASE}/${g(gender)}-brazo-${lado}-${prof}.webp`
}
export const BRAZO_EXTERNA_OPTIONS = [
  { key: 'hombro-codo', label: 'Hombro a codo' },
  { key: 'codo', label: 'Codo' },
  { key: 'antebrazo', label: 'Antebrazo (exterior)' },
  { key: 'mano', label: 'Mano' },
] as const
export const BRAZO_INTERNA_OPTIONS = [
  { key: 'biceps', label: 'Bíceps' },
  { key: 'antebrazo', label: 'Antebrazo (interior)' },
  { key: 'palma', label: 'Palma de la mano' },
] as const
export function brazoSubzonaImage(gender: MapGender, lado: Lado, prof: Profundidad, key: string): string {
  const prefix = prof === 'externa' ? 'ext' : 'int'
  return `${BASE}/${g(gender)}-brazo-${lado}-${prefix}-${key}.webp`
}

// ---- Torso ----
export const TORSO_FRENTE_OPTIONS = [
  { key: 'pecho-completo', label: 'Pecho completo' },
  { key: 'pectoral-izq', label: 'Pectoral izquierdo' },
  { key: 'pectoral-der', label: 'Pectoral derecho' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'diafragma', label: 'Diafragma' },
  { key: 'pelvis', label: 'Pelvis' },
  { key: 'costilla-der', label: 'Costilla derecha' },
  { key: 'costilla-izq', label: 'Costilla izquierda' },
] as const
export const TORSO_ESPALDA_OPTIONS = [
  { key: 'paleta-der', label: 'Paleta derecha' },
  { key: 'paleta-izq', label: 'Paleta izquierda' },
  { key: 'espalda-completa', label: 'Espalda completa' },
  { key: 'espalda-alta', label: 'Espalda alta' },
  { key: 'espalda-media', label: 'Espalda media' },
  { key: 'espalda-baja', label: 'Espalda baja' },
] as const
export function torsoImage(gender: MapGender, key: string): string {
  // male-torso-costilla-der no existe (confirmado: no va a llegar) — se
  // reutiliza la foto real de costilla-izq en vez de inventar un espejo.
  if (gender !== 'Mujer' && key === 'costilla-der') {
    return `${BASE}/male-torso-costilla-izq.webp`
  }
  return `${BASE}/${g(gender)}-torso-${key}.webp`
}

// ---- Piernas ----
export function piernaLadoImage(gender: MapGender, lado: LadoPierna): string {
  return `${BASE}/${g(gender)}-pierna-${lado}.webp`
}
export function piernaProfundidadImage(gender: MapGender, lado: LadoPierna, prof: Profundidad): string {
  // male-pierna-izquierda-externa no existe (confirmado: no va a llegar) —
  // se reutiliza la foto real del lado derecho en vez de inventar un espejo.
  if (gender !== 'Mujer' && lado === 'izquierda' && prof === 'externa') {
    return `${BASE}/male-pierna-derecha-externa.webp`
  }
  return `${BASE}/${g(gender)}-pierna-${lado}-${prof}.webp`
}
export const PIERNA_EXTERNA_OPTIONS = [
  { key: 'gluteo', label: 'Glúteo' },
  { key: 'muslo', label: 'Muslo (exterior)' },
  { key: 'rodilla', label: 'Rodilla' },
  { key: 'gemelo', label: 'Gemelo (exterior)' },
  { key: 'pie', label: 'Pie' },
] as const
export const PIERNA_INTERNA_OPTIONS = [
  { key: 'muslo', label: 'Muslo (interior)' },
  { key: 'canilla', label: 'Canilla' },
  { key: 'gemelo', label: 'Gemelo (interior)' },
] as const
export function piernaSubzonaImage(gender: MapGender, lado: LadoPierna, prof: Profundidad, key: string): string {
  const prefix = prof === 'externa' ? 'ext' : 'int'
  return `${BASE}/${g(gender)}-pierna-${lado}-${prefix}-${key}.webp`
}
