import { describe, it, expect } from 'vitest'
import { buildIntakeMessage } from './message'

const input = {
  name: 'Andrés',
  gender: 'Hombre',
  age: 27,
  body_zone: 'Brazo — Antebrazo',
  size: 'Mediano (10 a 15 cm)',
  color: 'Negro',
  description: 'Quiero un león con destellos',
} as const

describe('buildIntakeMessage', () => {
  it('arma el mensaje con todos los datos', () => {
    const msg = buildIntakeMessage('Crisbo Tattoo', input, 2)
    expect(msg).toContain('Hola *Crisbo Tattoo*! Soy *Andrés* (Hombre, 27 años) y quiero cotizar un tatuaje:')
    expect(msg).toContain('· Zona: Brazo — Antebrazo')
    expect(msg).toContain('· Tamaño: Mediano (10 a 15 cm)')
    expect(msg).toContain('· Color: Negro')
    expect(msg).toContain('· Idea: Quiero un león con destellos')
    expect(msg).toContain('fotos de referencia en tu panel de OFINK')
  })
  it('sin fotos no promete fotos', () => {
    const msg = buildIntakeMessage('Crisbo Tattoo', input, 0)
    expect(msg).not.toContain('fotos de referencia')
    expect(msg).toContain('en tu panel de OFINK')
  })
  it('con una sola foto usa singular', () => {
    const msg = buildIntakeMessage('Crisbo Tattoo', input, 1)
    expect(msg).toContain('con mi foto de referencia')
    expect(msg).not.toContain('mis fotos')
  })
})
