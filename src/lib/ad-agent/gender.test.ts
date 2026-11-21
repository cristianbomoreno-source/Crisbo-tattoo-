import { describe, expect, it } from 'vitest'
import { genderFromName, guessGender, stripMaleVocatives } from './gender'
import { checkReply } from './guard'
import { DEFAULT_KNOWLEDGE } from './persona'

describe('genderFromName', () => {
  it('reads the first name, with accents, emojis and surnames', () => {
    expect(genderFromName('Laura Gómez')).toBe('mujer')
    expect(genderFromName('María José')).toBe('mujer')
    expect(genderFromName('Sebastián 🔥')).toBe('hombre')
    expect(genderFromName('José María Pérez')).toBe('hombre')
    expect(genderFromName('JUAN')).toBe('hombre')
  })

  it('does not guess from unknown names or nicknames', () => {
    expect(genderFromName('Tattoo lover')).toBeNull()
    expect(genderFromName('🖤')).toBeNull()
    expect(genderFromName(null)).toBeNull()
  })
})

describe('guessGender', () => {
  it('trusts what the person says about themselves over the name', () => {
    expect(guessGender('Kimi', ['Hola estoy muy interesada en el antebrazo'])).toBe('mujer')
    expect(guessGender('Laura', ['soy nuevo en esto de los tatuajes'])).toBe('hombre')
    expect(guessGender(null, ['Hola, soy mujer y quiero algo fino'])).toBe('mujer')
  })

  it('falls back to the name, and to null when nothing is clear', () => {
    expect(guessGender('Camila R', ['Hola cuánto cuesta'])).toBe('mujer')
    expect(guessGender('xX_ink_Xx', ['Hola cuánto cuesta'])).toBeNull()
  })
})

describe('stripMaleVocatives', () => {
  it('removes bro, pa, parce and hermano', () => {
    expect(stripMaleVocatives('Perfecto bro claro que si lo podríamos hacer')).toBe('Perfecto claro que si lo podríamos hacer')
    expect(stripMaleVocatives('Mi bro la verdad podríamos diseñar algo')).toBe('la verdad podríamos diseñar algo')
    expect(stripMaleVocatives('Trabajamos de 10 am a 5 pm bro')).toBe('Trabajamos de 10 am a 5 pm')
    expect(stripMaleVocatives('Listo pa 🫡')).toBe('Listo 🫡')
  })

  it('keeps "pa" when it means "para"', () => {
    expect(stripMaleVocatives('pa que veas el trabajo')).toBe('pa que veas el trabajo')
  })
})

describe('checkReply with gender', () => {
  const reply = { mensajes: ['Perfecto bro te saldría en 750000'], pasarACrisbo: false, motivo: null, enviarUbicacion: false }

  it('never sends "bro" to a woman', () => {
    expect(checkReply(reply, DEFAULT_KNOWLEDGE, undefined, false, 'mujer').bubbles).toEqual(['Perfecto te saldría en 750000'])
  })

  it('leaves men alone', () => {
    expect(checkReply(reply, DEFAULT_KNOWLEDGE, undefined, false, 'hombre').bubbles).toEqual(['Perfecto bro te saldría en 750000'])
  })
})
