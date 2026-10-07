import { describe, it, expect } from 'vitest'
import {
  PERSONAL_FIELDS,
  HEALTH,
  ACCEPT,
  DESIGN_FIELDS,
  formStr,
  siNo,
  boolSiNo,
  hasMedicalAlert,
  medicalAlertDetails,
  healthDetailKey,
} from './consent-fields'

describe('consent-fields listas', () => {
  it('las listas tienen las claves esperadas', () => {
    const keys = (l: readonly (readonly [string, string])[]) => l.map(([k]) => k)
    expect(keys(HEALTH)).toContain('alergias')
    expect(keys(HEALTH)).toContain('vih_hepatitis')
    expect(keys(ACCEPT)).toContain('mayor_edad')
    expect(keys(ACCEPT)).toContain('autoriza_datos')
    expect(keys(PERSONAL_FIELDS)).toContain('primer_nombre')
    expect(keys(DESIGN_FIELDS)).toContain('zona')
  })
})

describe('formStr', () => {
  it('devuelve el valor como string o vacío', () => {
    expect(formStr({ documento: '123' }, 'documento')).toBe('123')
    expect(formStr({ edad: 25 }, 'edad')).toBe('25')
    expect(formStr(null, 'x')).toBe('')
    expect(formStr({}, 'ausente')).toBe('')
  })
})

describe('siNo / boolSiNo', () => {
  it('siNo mapea si/no', () => {
    expect(siNo('si')).toBe('Sí')
    expect(siNo('no')).toBe('No')
    expect(siNo(undefined)).toBe('—')
  })
  it('boolSiNo mapea booleanos', () => {
    expect(boolSiNo(true)).toBe('Sí')
    expect(boolSiNo(false)).toBe('No')
    expect(boolSiNo('si')).toBe('No')
  })
})

describe('alerta médica', () => {
  it('hasMedicalAlert detecta cualquier "sí" en salud', () => {
    expect(hasMedicalAlert(null)).toBe(false)
    expect(hasMedicalAlert({ alergias: 'no', diabetes: 'no' })).toBe(false)
    expect(hasMedicalAlert({ alergias: 'no', diabetes: 'si' })).toBe(true)
  })
  it('medicalAlertDetails solo trae las preguntas en "sí", con su detalle', () => {
    const details = medicalAlertDetails({
      alergias: 'si',
      alergias_detalle: 'Penicilina',
      diabetes: 'no',
    })
    expect(details).toEqual([{ label: '¿Tienes alergias?', detail: 'Penicilina' }])
  })
  it('healthDetailKey arma la clave del campo de detalle', () => {
    expect(healthDetailKey('diabetes')).toBe('diabetes_detalle')
  })
})
