import { describe, it, expect } from 'vitest'
import { intakeSchema } from './intake'

const valid = {
  slug: 'crisbo-tattoo',
  name: 'Andrés Rivera',
  gender: 'Hombre',
  age: 28,
  size: 'Mediano (10 a 15 cm)',
  body_zone: 'Brazo — Antebrazo',
  color: 'Negro',
  skin_tone: 'Medio',
  description: 'Quiero un león con destellos en el antebrazo',
  email: 'andres@example.com',
  phone: '350 204 6957',
  availability: 'Tardes',
  website: '',
}

describe('intakeSchema', () => {
  it('acepta una solicitud completa válida', () => {
    expect(intakeSchema.safeParse(valid).success).toBe(true)
  })
  it('rechaza honeypot lleno', () => {
    expect(intakeSchema.safeParse({ ...valid, website: 'spam.com' }).success).toBe(false)
  })
  it('rechaza tamaño fuera del catálogo', () => {
    expect(intakeSchema.safeParse({ ...valid, size: 'Gigante' }).success).toBe(false)
  })
  it('rechaza descripción muy corta', () => {
    expect(intakeSchema.safeParse({ ...valid, description: 'un león' }).success).toBe(false)
  })
  it('rechaza descripción de más de 1000 caracteres', () => {
    expect(intakeSchema.safeParse({ ...valid, description: 'x'.repeat(1001) }).success).toBe(false)
  })
  it('rechaza email inválido', () => {
    expect(intakeSchema.safeParse({ ...valid, email: 'no-es-email' }).success).toBe(false)
  })
  it('rechaza slug con mayúsculas o espacios', () => {
    expect(intakeSchema.safeParse({ ...valid, slug: 'Crisbo Tattoo' }).success).toBe(false)
  })
  it('acepta service y style dentro del catálogo', () => {
    expect(
      intakeSchema.safeParse({ ...valid, service: 'Tatuaje', style: 'Realismo' }).success
    ).toBe(true)
  })
  it('rechaza service fuera del catálogo', () => {
    expect(intakeSchema.safeParse({ ...valid, service: 'Piercing' }).success).toBe(false)
  })
  // `style` dejó de ser enum a propósito (v1.29.0): el selector permite marcar
  // VARIOS estilos y se guardan unidos por coma en este mismo campo, así que
  // solo se valida que sea texto acotado. El catálogo `INTAKE_STYLES` sigue
  // existiendo, pero manda en la UI, no en el esquema.
  it('acepta varios estilos unidos por coma', () => {
    const style = 'Realismo, Blackwork, Fine line'
    expect(intakeSchema.safeParse({ ...valid, style }).success).toBe(true)
  })
  it('rechaza un style mas largo que el tope de 300 caracteres', () => {
    const style = 'a'.repeat(301)
    expect(intakeSchema.safeParse({ ...valid, style }).success).toBe(false)
  })
})
