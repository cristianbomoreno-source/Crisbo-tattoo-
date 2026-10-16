/** Consentimiento informado como WhatsApp Flow: el cliente lo llena dentro
 * de WhatsApp (3 pantallas) y vuelve por el webhook como `nfm_reply`. Se
 * envía solo, 5 min después de la hora de cada cita (uno por cita), con la
 * plantilla de Utilidad CONSENT_TEMPLATE_NAME. El `flow_token` es
 * `consent:<token del consent_link>`: así la respuesta se asocia a su cita.
 *
 * Firma: WhatsApp no tiene firma dibujada. Se usa firma electrónica — nombre
 * escrito + casilla "Acepto y firmo" — más la evidencia que da WhatsApp
 * (número verificado del remitente, id del mensaje y hora). Las claves de
 * las respuestas son las mismas del formulario web (`consent-fields.ts`),
 * así el PDF y la alerta médica funcionan igual. */

import { DOCUMENT_TYPES } from '@/lib/validations/consent-links'
import { ACCEPT, HEALTH } from './consent-fields'

export const CONSENT_FLOW_VERSION = '7.3'
export const CONSENT_FLOW_NAME = 'Consentimiento informado v2'
export const CONSENT_TEMPLATE_NAME = 'consentimiento_cita_v2'
export const CONSENT_TEMPLATE_LANGUAGE = 'es'
export const CONSENT_BUTTON_TEXT = 'Firmar consentimiento'
export const CONSENT_FIRST_SCREEN = 'DATOS'
export const CONSENT_FLOW_TOKEN_PREFIX = 'consent:'

/** Minutos después de la hora de la cita en que se envía. */
export const CONSENT_SEND_DELAY_MINUTES = 5

export function consentTemplateBody(studioName: string) {
  return `Para tu sesión de hoy en ${studioName} necesitamos tu consentimiento informado. Lo puedes llenar aquí mismo en WhatsApp, toma unos 3 minutos.`
}

/** Texto que guarda el chat para el mensaje enviado. */
export function consentSentText(studioName: string) {
  return `📝 Consentimiento informado\n\n${consentTemplateBody(studioName)}\n\n[${CONSENT_BUTTON_TEXT}]`
}

/** Etiquetas cortas (WhatsApp limita a 30 caracteres) para las preguntas de salud. */
const HEALTH_SHORT: Record<string, string> = {
  bajo_influencia: '¿Alcohol o sustancias hoy?',
  alergias: '¿Tienes alergias?',
  medicamentos: '¿Tomas medicamentos?',
  diabetes: '¿Tienes diabetes?',
  cardiacos: '¿Corazón o hipertensión?',
  epilepsia: '¿Epilepsia o convulsiones?',
  sangre: '¿Problemas de coagulación?',
  vih_hepatitis: '¿VIH, Hepatitis B o C?',
  dermatologicas: '¿Enfermedades de la piel?',
  queloides: '¿Queloides o cicatrices?',
  embarazo: '¿Embarazo o lactancia?',
}

/** Títulos cortos de las declaraciones (la frase completa va en la descripción). */
const ACCEPT_SHORT: Record<string, string> = {
  mayor_edad: 'Soy mayor de 18 años',
  documento_valido: 'Presenté mi documento',
  diseno_aprobado: 'Aprobé el diseño',
  entiende_permanente: 'Es permanente',
  acepta_riesgos: 'Acepto los riesgos',
  info_veridica: 'Mi información es verídica',
  recibio_cuidados: 'Recibí los cuidados',
  autoriza_datos: 'Autorizo mis datos',
  confirma_precision: 'Todo es preciso',
}

const SI_NO = [
  { id: 'no', title: 'No' },
  { id: 'si', title: 'Sí' },
]

export const BODY_ZONES = ['Cabeza', 'Pecho', 'Espalda', 'Brazos', 'Piernas', 'Otro'] as const

const DATOS_FIELDS = [
  'primer_nombre',
  'apellido',
  'tipo_documento',
  'numero_documento',
  'fecha_nacimiento',
  'correo',
  'zona',
  'descripcion_diseno',
] as const

/** Datos personales que se precargan si el cliente ya los dio antes
 * (salud, zona, diseño y declaraciones se responden en cada cita). */
export const PREFILL_FIELDS = [
  'primer_nombre',
  'apellido',
  'tipo_documento',
  'numero_documento',
  'fecha_nacimiento',
  'correo',
] as const
export type ConsentPrefill = Partial<Record<(typeof PREFILL_FIELDS)[number], string>>

/** `data` que recibe la primera pantalla: solo las claves con valor (el
 * Form las usa como `init-values`). */
export function consentFlowData(prefill: ConsentPrefill) {
  const init: Record<string, string> = {}
  for (const k of PREFILL_FIELDS) {
    const v = prefill[k]?.trim()
    if (!v) continue
    if (k === 'tipo_documento' && !(DOCUMENT_TYPES as readonly string[]).includes(v)) continue
    if (k === 'fecha_nacimiento' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) continue
    init[k] = v
  }
  return { init_values: init }
}

const HEALTH_KEYS = HEALTH.map(([k]) => k)

/** Declaración de datos que recibe una pantalla (Flow JSON exige tipo + ejemplo). */
function dataDecl(keys: readonly string[]) {
  return Object.fromEntries(keys.map((k) => [k, { type: 'string', __example__: 'x' }]))
}

function forward(keys: readonly string[], from: 'form' | 'data') {
  return Object.fromEntries(keys.map((k) => [k, `\${${from}.${k}}`]))
}

export function consentFlowJson() {
  return {
    version: CONSENT_FLOW_VERSION,
    screens: [
      {
        id: 'DATOS',
        title: 'Tus datos',
        data: {
          init_values: {
            type: 'object',
            properties: Object.fromEntries(PREFILL_FIELDS.map((k) => [k, { type: 'string' }])),
            __example__: { primer_nombre: 'Laura' },
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextSubheading', text: 'Consentimiento informado' },
            { type: 'TextBody', text: 'Revisa tus datos y cuéntanos sobre tu tatuaje de hoy.' },
            {
              type: 'Form',
              name: 'datos',
              'init-values': '${data.init_values}',
              children: [
                { type: 'TextInput', name: 'primer_nombre', label: 'Nombre', 'input-type': 'text', required: true },
                { type: 'TextInput', name: 'apellido', label: 'Apellido', 'input-type': 'text', required: true },
                {
                  type: 'Dropdown',
                  name: 'tipo_documento',
                  label: 'Tipo de documento',
                  required: true,
                  'data-source': DOCUMENT_TYPES.map((d) => ({ id: d, title: d })),
                },
                { type: 'TextInput', name: 'numero_documento', label: 'Número de documento', 'input-type': 'text', required: true },
                { type: 'DatePicker', name: 'fecha_nacimiento', label: 'Fecha de nacimiento', required: true },
                { type: 'TextInput', name: 'correo', label: 'Correo', 'input-type': 'email', required: true },
                {
                  type: 'Dropdown',
                  name: 'zona',
                  label: 'Zona a tatuar',
                  required: true,
                  'data-source': BODY_ZONES.map((z) => ({ id: z, title: z })),
                },
                { type: 'TextArea', name: 'descripcion_diseno', label: 'Describe el diseño', required: true },
                {
                  type: 'Footer',
                  label: 'Continuar',
                  'on-click-action': {
                    name: 'navigate',
                    next: { type: 'screen', name: 'SALUD' },
                    payload: forward(DATOS_FIELDS, 'form'),
                  },
                },
              ],
            },
          ],
        },
      },
      {
        id: 'SALUD',
        title: 'Salud',
        data: dataDecl(DATOS_FIELDS),
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextBody', text: 'Responde con sinceridad: es para cuidar tu salud durante la sesión.' },
            {
              type: 'Form',
              name: 'salud',
              children: [
                ...HEALTH_KEYS.map((k) => ({
                  type: 'RadioButtonsGroup',
                  name: k,
                  label: HEALTH_SHORT[k],
                  required: true,
                  'data-source': SI_NO,
                })),
                { type: 'TextBody', text: 'Si respondiste Sí a alguna, cuéntanos brevemente:' },
                {
                  type: 'TextArea',
                  name: 'salud_detalle',
                  label: 'Detalle de tus Sí',
                  required: false,
                },
                {
                  type: 'Footer',
                  label: 'Continuar',
                  'on-click-action': {
                    name: 'navigate',
                    next: { type: 'screen', name: 'FIRMA' },
                    payload: {
                      ...forward(DATOS_FIELDS, 'data'),
                      ...forward([...HEALTH_KEYS, 'salud_detalle'], 'form'),
                    },
                  },
                },
              ],
            },
          ],
        },
      },
      {
        id: 'FIRMA',
        title: 'Declaraciones y firma',
        terminal: true,
        success: true,
        data: dataDecl([...DATOS_FIELDS, ...HEALTH_KEYS, 'salud_detalle']),
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextBody',
              text: 'El tatuaje es un procedimiento permanente que puede tener riesgos como infección, alergia a las tintas, cicatrización anormal o variaciones de color. Seguir los cuidados indicados reduce estos riesgos.',
            },
            {
              type: 'Form',
              name: 'firma',
              children: [
                {
                  type: 'CheckboxGroup',
                  name: 'declaraciones',
                  label: 'Marca todas para continuar',
                  required: true,
                  'min-selected-items': ACCEPT.length,
                  'data-source': ACCEPT.map(([k, label]) => ({ id: k, title: ACCEPT_SHORT[k], description: label })),
                },
                {
                  type: 'RadioButtonsGroup',
                  name: 'autoriza_fotos',
                  label: '¿Fotos/videos para redes?',
                  required: true,
                  'data-source': [
                    { id: 'si', title: 'Sí, autorizo' },
                    { id: 'no', title: 'No autorizo' },
                  ],
                },
                { type: 'TextBody', text: 'Escribe tu nombre completo como firma.' },
                {
                  type: 'TextInput',
                  name: 'firma_nombre',
                  label: 'Tu nombre (firma)',
                  'input-type': 'text',
                  required: true,
                },
                {
                  type: 'OptIn',
                  name: 'acepta_firma',
                  label: 'Acepto y firmo electrónicamente este consentimiento.',
                  required: true,
                },
                {
                  type: 'Footer',
                  label: 'Firmar',
                  'on-click-action': {
                    name: 'complete',
                    payload: {
                      ...forward([...DATOS_FIELDS, ...HEALTH_KEYS, 'salud_detalle'], 'data'),
                      declaraciones: '${form.declaraciones}',
                      autoriza_fotos: '${form.autoriza_fotos}',
                      firma_nombre: '${form.firma_nombre}',
                      acepta_firma: '${form.acepta_firma}',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  }
}

export type ConsentFlowAnswers = {
  token: string
  /** Mismas claves que el formulario web (para PDF y alerta médica). */
  form: Record<string, unknown>
  signerName: string
}

function str(v: unknown, max = 300) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

/** Edad cumplida a hoy desde YYYY-MM-DD ('' si no se puede calcular). */
export function ageFrom(birth: string, now = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth)
  if (!m) return ''
  let age = now.getFullYear() - Number(m[1])
  const md = (now.getMonth() + 1) * 100 + now.getDate()
  if (md < Number(m[2]) * 100 + Number(m[3])) age--
  return age >= 0 && age < 130 ? String(age) : ''
}

/** Lee `nfm_reply.response_json`. Null si no es una respuesta del consentimiento. */
export function parseConsentFlowResponse(responseJson: string | null | undefined, now = new Date()): ConsentFlowAnswers | null {
  if (!responseJson) return null
  let d: Record<string, unknown>
  try {
    d = JSON.parse(responseJson)
  } catch {
    return null
  }
  const flowToken = typeof d?.flow_token === 'string' ? d.flow_token : ''
  if (!flowToken.startsWith(CONSENT_FLOW_TOKEN_PREFIX)) return null
  const token = flowToken.slice(CONSENT_FLOW_TOKEN_PREFIX.length)
  if (!token) return null

  // DatePicker: "YYYY-MM-DD" (versiones viejas mandaban epoch ms).
  let birth = str(d.fecha_nacimiento, 20)
  if (/^\d{9,}$/.test(birth)) birth = new Date(Number(birth)).toISOString().slice(0, 10)

  const form: Record<string, unknown> = {}
  for (const k of DATOS_FIELDS) form[k] = str(d[k], k === 'descripcion_diseno' ? 1000 : 200)
  form.fecha_nacimiento = birth
  form.edad = ageFrom(birth, now)

  // Una sola explicación para todas las respuestas "Sí".
  const detail = str(d.salud_detalle, 1000)
  for (const k of HEALTH_KEYS) {
    const v = d[k] === 'si' ? 'si' : 'no'
    form[k] = v
    form[`${k}_detalle`] = v === 'si' ? detail : ''
  }

  const declared = Array.isArray(d.declaraciones) ? (d.declaraciones as unknown[]).map(String) : []
  for (const [k] of ACCEPT) form[k] = declared.includes(k)
  form.autoriza_fotos = d.autoriza_fotos === 'si' ? 'si' : 'no'
  form.confirma_diseno = true

  const signerName = str(d.firma_nombre, 150)
  form.firma_nombre = signerName
  form.acepta_firma = d.acepta_firma === true || d.acepta_firma === 'true'
  return { token, form, signerName }
}

/** ¿El cliente completó lo obligatorio (todas las declaraciones + firma)? */
export function consentComplete(a: ConsentFlowAnswers): boolean {
  return !!a.signerName && a.form.acepta_firma === true && ACCEPT.every(([k]) => a.form[k] === true)
}
