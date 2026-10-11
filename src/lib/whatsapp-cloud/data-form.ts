/** Formulario de datos del cliente como WhatsApp Flow: se llena dentro de
 * WhatsApp (sin abrir links) y llega de vuelta por el webhook como un
 * mensaje `interactive` → `nfm_reply`. Es un Flow estático (sin endpoint):
 * las respuestas viajan en el payload de la acción `complete`. */

export const FORM_FLOW_VERSION = '7.3'

/** Botón de la plantilla que abre el Flow. */
export const FORM_BUTTON_TEXT = 'Llenar formulario'

export const FORM_TEMPLATE_LANGUAGE = 'es'

export function formTemplateBody(studioName: string) {
  return `¡Hola! Te escribimos de ${studioName}. Para registrarte y agendar tu cita necesitamos algunos datos: toca el botón y completa el formulario, toma menos de un minuto.`
}

export function formFlowJson() {
  return {
    version: FORM_FLOW_VERSION,
    screens: [
      {
        id: 'DATOS',
        title: 'Tus datos',
        terminal: true,
        success: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextSubheading', text: 'Completa tus datos para agendar' },
            {
              type: 'Form',
              name: 'datos',
              children: [
                { type: 'TextInput', name: 'nombre', label: 'Nombre completo', 'input-type': 'text', required: true },
                { type: 'TextInput', name: 'celular', label: 'Celular', 'input-type': 'phone', required: true },
                { type: 'TextInput', name: 'correo', label: 'Correo', 'input-type': 'email', required: true },
                { type: 'DatePicker', name: 'nacimiento', label: 'Fecha de nacimiento', required: true },
                {
                  type: 'Footer',
                  label: 'Enviar',
                  'on-click-action': {
                    name: 'complete',
                    payload: {
                      nombre: '${form.nombre}',
                      celular: '${form.celular}',
                      correo: '${form.correo}',
                      nacimiento: '${form.nacimiento}',
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

export type FormAnswers = {
  nombre: string | null
  celular: string | null
  correo: string | null
  /** YYYY-MM-DD (o null si no vino una fecha válida). */
  nacimiento: string | null
}

function clean(v: unknown, max: number) {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

/** Lee `nfm_reply.response_json` (string JSON). Null si no es nuestro formulario. */
export function parseFormResponse(responseJson: string | null | undefined): FormAnswers | null {
  if (!responseJson) return null
  let data: Record<string, unknown>
  try {
    data = JSON.parse(responseJson)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  if (!['nombre', 'celular', 'correo', 'nacimiento'].some((k) => k in data)) return null

  // DatePicker manda "YYYY-MM-DD" (Flow JSON ≥ 5.0); versiones viejas, epoch ms.
  let nacimiento: string | null = null
  const raw = data.nacimiento
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) nacimiento = raw
  else if (typeof raw === 'string' && /^\d{9,}$/.test(raw)) nacimiento = new Date(Number(raw)).toISOString().slice(0, 10)

  const correo = clean(data.correo, 200)
  return {
    nombre: clean(data.nombre, 150),
    celular: clean(data.celular, 30),
    correo: correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? correo.toLowerCase() : correo,
    nacimiento,
  }
}

/** Texto de la burbuja en la bandeja. */
export function formAnswersText(a: FormAnswers) {
  return [
    '📋 Formulario de datos',
    `Nombre completo: ${a.nombre ?? '—'}`,
    `Celular: ${a.celular ?? '—'}`,
    `Correo: ${a.correo ?? '—'}`,
    `Fecha de nacimiento: ${a.nacimiento ?? '—'}`,
  ].join('\n')
}
