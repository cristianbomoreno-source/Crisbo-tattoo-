/** Definiciones de los campos del consentimiento informado. ÚNICA fuente de
 * verdad: la usan el formulario público (`public-consent-form.tsx`) y el PDF
 * (`consent-pdf.tsx`), para que el PDF muestre EXACTAMENTE lo que firmó el
 * cliente. Cada entrada es `[clave_en_form_data, etiqueta]`. */

export const PERSONAL_FIELDS: readonly (readonly [string, string])[] = [
  ['primer_nombre', 'Primer nombre'],
  ['apellido', 'Apellido'],
  ['tipo_documento', 'Tipo de documento'],
  ['numero_documento', 'Número de documento'],
  ['fecha_nacimiento', 'Fecha de nacimiento'],
  ['edad', 'Edad'],
  ['telefono', 'Teléfono'],
  ['correo', 'Correo electrónico'],
  ['direccion', 'Dirección'],
]

export const HEALTH: readonly (readonly [string, string])[] = [
  ['bajo_influencia', '¿Estás bajo influencia de alcohol o sustancias?'],
  ['alergias', '¿Tienes alergias?'],
  ['medicamentos', '¿Tomas algún medicamento actualmente?'],
  ['diabetes', '¿Tienes diabetes?'],
  ['cardiacos', '¿Problemas cardíacos o hipertensión?'],
  ['epilepsia', '¿Epilepsia o convulsiones?'],
  ['sangre', '¿Enfermedades de la sangre o de coagulación?'],
  ['vih_hepatitis', '¿VIH, Hepatitis B o C?'],
  ['dermatologicas', '¿Enfermedades dermatológicas?'],
  ['queloides', '¿Antecedentes de queloides o cicatrices anormales?'],
  ['embarazo', '¿Embarazo o lactancia? (si aplica)'],
]

export const ACCEPT: readonly (readonly [string, string])[] = [
  ['mayor_edad', 'Soy mayor de 18 años.'],
  ['documento_valido', 'Presenté un documento de identidad válido.'],
  ['diseno_aprobado', 'Revisé y aprobé el diseño a tatuar.'],
  ['entiende_permanente', 'Entiendo que el tatuaje es permanente.'],
  ['acepta_riesgos', 'Acepto los riesgos del procedimiento.'],
  ['info_veridica', 'La información que doy es verídica y completa.'],
  ['recibio_cuidados', 'Recibí las instrucciones de cuidado posterior.'],
  ['autoriza_datos', 'Autorizo el tratamiento de mis datos personales.'],
  ['confirma_precision', 'Confirmo que toda la información es precisa.'],
]

export const DESIGN_FIELDS: readonly (readonly [string, string])[] = [
  ['zona', 'Zona del cuerpo a tatuar'],
  ['descripcion_diseno', 'Descripción del diseño'],
]

/** Valor de un campo de `form_data` como string ('' si falta). */
export function formStr(fd: Record<string, unknown> | null, key: string): string {
  if (!fd) return ''
  const v = fd[key]
  return v === undefined || v === null ? '' : String(v)
}

/** Campos Sí/No guardados como 'si'/'no'. */
export function siNo(v: unknown): string {
  if (v === 'si') return 'Sí'
  if (v === 'no') return 'No'
  return '—'
}

/** Declaraciones guardadas como boolean. */
export function boolSiNo(v: unknown): string {
  return v === true ? 'Sí' : 'No'
}

/** Sufijo de la clave del campo "Explícanos brevemente" que aparece bajo
 * cada pregunta de salud respondida "Sí" — p. ej. `diabetes_detalle`. */
export function healthDetailKey(key: string): string {
  return `${key}_detalle`
}

/** Cualquier "Sí" en salud dispara la alerta médica privada para el
 * tatuador (ver `submitSignedConsentAction`). */
export function hasMedicalAlert(form: Record<string, unknown> | null): boolean {
  if (!form) return false
  return HEALTH.some(([key]) => form[key] === 'si')
}

/** Preguntas de salud respondidas "Sí", con su explicación (si la hay) —
 * lo único que puede leer el tatuador de la alerta médica. */
export function medicalAlertDetails(
  form: Record<string, unknown> | null
): { label: string; detail: string }[] {
  if (!form) return []
  return HEALTH.filter(([key]) => form[key] === 'si').map(([key, label]) => ({
    label,
    detail: formStr(form, healthDetailKey(key)),
  }))
}
