import { z } from 'zod'

/** Crear un link de consentimiento (desde el estudio, para un proyecto). */
export const createConsentLinkSchema = z.object({
  project_id: z.string().uuid(),
  client_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
})

export const DOCUMENT_TYPES = [
  'Cédula de ciudadanía',
  'Cédula de extranjería',
  'Tarjeta de identidad',
  'Pasaporte',
] as const

const yesNo = z.enum(['si', 'no'])
const detail = z.string().optional().default('')
const mustAccept = z.boolean().refine((v) => v === true, 'Debes aceptar')

/** Envío del cliente desde la página pública: cuestionario completo + firma.
 * Las claves de salud están escritas a mano (en vez de generarlas desde
 * `HEALTH` de `consent-fields.ts`) para que zod infiera tipos literales
 * precisos — deben mantenerse en sincro con esa lista si se agrega o
 * quita una pregunta. */
export const submitConsentSchema = z
  .object({
    token: z.string().min(1),

    // Datos personales (precargados desde el cliente cuando ya existen).
    primer_nombre: z.string().min(1, 'Requerido'),
    apellido: z.string().min(1, 'Requerido'),
    tipo_documento: z.string().min(1, 'Requerido'),
    numero_documento: z.string().min(1, 'Requerido'),
    fecha_nacimiento: z.string().min(1, 'Requerido'),
    edad: z.string().optional().default(''),
    telefono: z.string().min(1, 'Requerido'),
    correo: z.string().email('Correo inválido'),
    direccion: z.string().min(1, 'Requerido'),

    // Proyecto: confirmación de que el diseño/detalle mostrado es correcto.
    confirma_diseno: z.boolean().refine((v) => v === true, 'Debes confirmar el diseño'),

    // Salud (sí/no) + un detalle opcional por pregunta — obligatorio solo
    // si esa pregunta puntual se respondió "Sí" (ver `superRefine`).
    bajo_influencia: yesNo,
    bajo_influencia_detalle: detail,
    alergias: yesNo,
    alergias_detalle: detail,
    medicamentos: yesNo,
    medicamentos_detalle: detail,
    diabetes: yesNo,
    diabetes_detalle: detail,
    cardiacos: yesNo,
    cardiacos_detalle: detail,
    epilepsia: yesNo,
    epilepsia_detalle: detail,
    sangre: yesNo,
    sangre_detalle: detail,
    vih_hepatitis: yesNo,
    vih_hepatitis_detalle: detail,
    dermatologicas: yesNo,
    dermatologicas_detalle: detail,
    queloides: yesNo,
    queloides_detalle: detail,
    embarazo: yesNo,
    embarazo_detalle: detail,

    // Diseño
    zona: z.string().min(1, 'Requerido'),
    descripcion_diseno: z.string().min(1, 'Requerido'),

    // Declaraciones (deben aceptarse)
    mayor_edad: mustAccept,
    documento_valido: mustAccept,
    diseno_aprobado: mustAccept,
    entiende_permanente: mustAccept,
    acepta_riesgos: mustAccept,
    info_veridica: mustAccept,
    recibio_cuidados: mustAccept,
    autoriza_datos: mustAccept,
    confirma_precision: mustAccept,

    // Uso de imagen (opcional para el cliente)
    autoriza_fotos: yesNo,

    // Firma
    signature_data: z.string().min(1, 'Firma requerida'),
    fecha_firma: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    const healthKeys = [
      'bajo_influencia',
      'alergias',
      'medicamentos',
      'diabetes',
      'cardiacos',
      'epilepsia',
      'sangre',
      'vih_hepatitis',
      'dermatologicas',
      'queloides',
      'embarazo',
    ] as const
    for (const key of healthKeys) {
      if (data[key] === 'si' && data[`${key}_detalle`].trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cuéntanos brevemente sobre esta condición',
          path: [`${key}_detalle`],
        })
      }
    }
  })

export type CreateConsentLinkInput = z.infer<typeof createConsentLinkSchema>
export type SubmitConsentInput = z.infer<typeof submitConsentSchema>
