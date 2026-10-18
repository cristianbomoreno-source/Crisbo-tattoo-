import { describe, expect, it } from 'vitest'
import { looksAutomated } from './auto-reply'

describe('looksAutomated', () => {
  it('reconoce respuestas automáticas de negocios', () => {
    expect(looksAutomated('Gracias por comunicarte con C-LLANTAS. Por favor, haznos saber cómo podemos ayudarte.')).toBe(true)
    expect(looksAutomated('Gracias por tu mensaje. En este momento no estamos disponibles, pero te responderemos tan pronto regresemos.')).toBe(true)
    expect(looksAutomated('¡Hola! 👋\nGracias por comunicarte con *Nicolás Martínez*, Manager Financiero 📊')).toBe(true)
    expect(looksAutomated('Hola 👋 gracias por escribir a *L&V Inmobiliaria* 🏡\n\nEn este momento no estamos disponibles')).toBe(true)
  })
  it('no confunde respuestas de clientes', () => {
    for (const t of [
      'Gracias',
      'Hola Crisbo muchas gracias',
      'Gracias mi reeey',
      'Socio , como estas.... Gracias',
      'Buenos días Cris que aplica?',
      'Si hoy te aviso y agendamos',
      'Esta semana te escribo',
      'Hola vale gracias :3',
    ]) expect(looksAutomated(t)).toBe(false)
  })
})
