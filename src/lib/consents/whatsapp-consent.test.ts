import { describe, expect, it } from 'vitest'
import { ACCEPT, HEALTH } from './consent-fields'
import { ageFrom, consentComplete, consentFlowData, consentFlowJson, parseConsentFlowResponse } from './whatsapp-consent'

const full = {
  flow_token: 'consent:tok123',
  primer_nombre: 'Laura',
  apellido: 'Gómez',
  tipo_documento: 'Cédula de ciudadanía',
  numero_documento: '1020',
  fecha_nacimiento: '2000-10-20',
  correo: 'laura@x.co',
  zona: 'Brazos',
  descripcion_diseno: 'Rosa',
  ...Object.fromEntries(HEALTH.map(([k]) => [k, 'no'])),
  alergias: 'si',
  salud_detalle: 'Al látex',
  declaraciones: ACCEPT.map(([k]) => k),
  autoriza_fotos: 'si',
  firma_nombre: 'Laura Gómez',
  acepta_firma: true,
}

describe('parseConsentFlowResponse', () => {
  it('lee la respuesta con las claves del formulario web', () => {
    const a = parseConsentFlowResponse(JSON.stringify(full), new Date('2026-10-16T12:00:00'))!
    expect(a.token).toBe('tok123')
    expect(a.form.primer_nombre).toBe('Laura')
    expect(a.form.edad).toBe('25')
    expect(a.form.alergias).toBe('si')
    expect(a.form.alergias_detalle).toBe('Al látex')
    expect(a.form.diabetes).toBe('no')
    expect(a.form.diabetes_detalle).toBe('')
    expect(a.form.mayor_edad).toBe(true)
    expect(consentComplete(a)).toBe(true)
  })

  it('ignora otros formularios', () => {
    expect(parseConsentFlowResponse(JSON.stringify({ flow_token: 'abc', nombre: 'x' }))).toBeNull()
    expect(parseConsentFlowResponse('no json')).toBeNull()
  })

  it('sin todas las declaraciones no está completo', () => {
    const a = parseConsentFlowResponse(JSON.stringify({ ...full, declaraciones: ['mayor_edad'] }))!
    expect(consentComplete(a)).toBe(false)
  })
})

describe('ageFrom', () => {
  it('cuenta si ya cumplió años', () => {
    expect(ageFrom('2000-10-16', new Date('2026-10-16T12:00:00'))).toBe('26')
    expect(ageFrom('2000-10-17', new Date('2026-10-16T12:00:00'))).toBe('25')
    expect(ageFrom('x')).toBe('')
  })
})

describe('consentFlowJson', () => {
  it('respeta el límite de 30 caracteres de WhatsApp en etiquetas y opciones', () => {
    const tooLong: string[] = []
    const walk = (n: unknown) => {
      if (Array.isArray(n)) return n.forEach(walk)
      if (!n || typeof n !== 'object') return
      const o = n as Record<string, unknown>
      if (['RadioButtonsGroup', 'CheckboxGroup', 'Dropdown'].includes(String(o.type))) {
        if (String(o.label).length > 30) tooLong.push(String(o.label))
        for (const item of (o['data-source'] as { title: string }[]) ?? []) {
          if (item.title.length > 30) tooLong.push(item.title)
        }
      }
      if ((o.type === 'TextInput' || o.type === 'TextArea') && String(o.label).length > 20) tooLong.push(String(o.label))
      Object.values(o).forEach(walk)
    }
    walk(consentFlowJson())
    expect(tooLong).toEqual([])
  })
})

describe('consentFlowData', () => {
  it('solo manda los datos que existen y son válidos', () => {
    expect(
      consentFlowData({ primer_nombre: 'Laura', apellido: ' ', tipo_documento: 'CC', fecha_nacimiento: '2000-01-02' })
    ).toEqual({ init_values: { primer_nombre: 'Laura', fecha_nacimiento: '2000-01-02' } })
  })
})
