import { normalizeText } from '@/lib/whatsapp-cloud/tattoo-keywords'

/**
 * Si el contacto es hombre o mujer, para tratarlo como lo haría Crisbo ("bro" o
 * "pa" solo a hombres). Manda lo que la persona dice de sí misma ("estoy
 * interesada"); si no, el primer nombre del contacto. Ante la duda, null.
 */
export type Gender = 'hombre' | 'mujer'

const FEMALE = new Set(
  `ana andrea angela angelica alejandra alexandra adriana alba alicia amparo antonia aura beatriz camila carolina catalina cecilia claudia
  clara constanza cristina daniela dayana diana dora elena eliana elizabeth emilia erika esperanza estefania estefany fernanda flor gabriela
  gloria graciela isabel isabella ivonne jazmin jenny jennifer jessica johana joana juana juliana julieta karen karina katherine kelly laura
  leidy lina liliana lorena lucia luisa luz manuela margarita maria mariana marcela marisol martha marta melissa milena monica natalia
  nathalia nancy nicole olga paola patricia paula rocio rosa rosario sandra sara sarah silvia sofia sonia stefany susana tatiana valentina
  valeria vanessa veronica victoria viviana ximena yamile yesenia yolanda yuliana zulma salome antonella luciana mariangel maryuri yurany
  yeimy jhoana nataly yessica wendy lady leydi geraldine allison michelle kimberly brenda abigail ashley danna violeta paulina`
    .split(/\s+/)
    .filter(Boolean)
)

const MALE = new Set(
  `alejandro alexander andres angel antonio armando arturo camilo carlos cesar cristian christian daniel david diego eduardo edwin enrique
  esteban fabian felipe fernando francisco gabriel german gustavo hector hernan ivan jaime javier jhon john jhonatan jonathan jorge jose
  juan julian julio kevin leonardo luis manuel marco marcos mario martin mateo mauricio miguel nelson nicolas oscar pablo pedro rafael
  ricardo roberto rodrigo ruben samuel santiago sebastian sergio simon tomas victor william wilson yeison jhonny johan steven brayan
  bryan duvan dylan emanuel emmanuel faber fredy freddy gerson harold henry jefferson jeison jairo jesus joel jose leandro maicol michael
  mike oscar raul ronald stiven wilmer alvaro hugo ernesto orlando gonzalo alberto benjamin thiago jeronimo emiliano matias lucas joaquin
  agustin ignacio isaac elkin edgar fabio jhojan anderson didier`
    .split(/\s+/)
    .filter(Boolean)
)

const SELF = '(?:estoy|soy|quedo|me siento|ando|me encuentro)\\s+(?:muy\\s+|super\\s+|re\\s+)?'
const ADJ = '(?:interesad|encantad|decidid|emocionad|nervios|segur|list|nuev|asustad|animad|cansad|convencid|antojad)'
const SAYS_FEMALE = new RegExp(`\\b(?:${SELF}${ADJ}a|soy mujer|soy una chica)\\b`)
const SAYS_MALE = new RegExp(`\\b(?:${SELF}${ADJ}o|soy hombre|soy un man)\\b`)

export function genderFromName(contactName: string | null): Gender | null {
  const first = normalizeText(contactName ?? '')
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)[0]
  if (!first) return null
  if (FEMALE.has(first)) return 'mujer'
  if (MALE.has(first)) return 'hombre'
  return null
}

export function guessGender(contactName: string | null, inboundTexts: string[]): Gender | null {
  const said = normalizeText(inboundTexts.join(' \n '))
  const female = SAYS_FEMALE.test(said)
  const male = SAYS_MALE.test(said)
  if (female !== male) return female ? 'mujer' : 'hombre'
  return genderFromName(contactName)
}

/** Lo que solo se le dice a un hombre. "pa" solo cuenta al final de la frase
 * ("listo pa"), para no confundirlo con "pa' qué". */
const MALE_VOCATIVES = /,?\s*\b(?:mi bro+|bro+|parce|hermano|pa)\b(?=\s*(?:[.,!?🫡]|$))|\b(?:mi bro+|bro+|parce|hermano)\b,?\s*/gi

/** Quita "bro", "pa", "parce" y "hermano" de un mensaje para una mujer. */
export function stripMaleVocatives(text: string) {
  return text
    .replace(MALE_VOCATIVES, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
