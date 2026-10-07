import { describe, it, expect } from 'vitest'
import { updateBotSettingsSchema } from './studio'

describe('updateBotSettingsSchema', () => {
  it('acepta slug válido y teléfono', () => {
    const r = updateBotSettingsSchema.safeParse({
      slug: 'crisbo-tattoo',
      whatsapp_phone: '+57 350 204 6957',
    })
    expect(r.success).toBe(true)
  })
  it('normaliza el slug a minúsculas', () => {
    const r = updateBotSettingsSchema.safeParse({ slug: 'Crisbo-Tattoo', whatsapp_phone: '' })
    expect(r.success && r.data.slug).toBe('crisbo-tattoo')
  })
  it('rechaza slug con espacios o tildes', () => {
    expect(updateBotSettingsSchema.safeParse({ slug: 'mi estudio', whatsapp_phone: '' }).success).toBe(false)
    expect(updateBotSettingsSchema.safeParse({ slug: 'tatuajes-josé', whatsapp_phone: '' }).success).toBe(false)
  })
  it('rechaza slug muy corto', () => {
    expect(updateBotSettingsSchema.safeParse({ slug: 'ab', whatsapp_phone: '' }).success).toBe(false)
  })
  it('acepta teléfono vacío (bot apagado)', () => {
    expect(updateBotSettingsSchema.safeParse({ slug: 'crisbo', whatsapp_phone: '' }).success).toBe(true)
  })
  it('rechaza teléfono con letras', () => {
    expect(updateBotSettingsSchema.safeParse({ slug: 'crisbo', whatsapp_phone: 'abc123' }).success).toBe(false)
  })
})

import {
  updateStudioProfileSchema,
  updateStudioSlugSchema,
  updateStudioScheduleSchema,
  updateStudioDepositSchema,
  updateStudioPaymentMethodsSchema,
  updateStudioPoliciesSchema,
  updateArtistProfileSchema,
} from './studio'

describe('updateStudioProfileSchema', () => {
  it('acepta nombre solo (resto opcional)', () => {
    expect(updateStudioProfileSchema.safeParse({ name: 'Crisbo Tattoo' }).success).toBe(true)
  })
  it('rechaza nombre vacío', () => {
    expect(updateStudioProfileSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('rechaza tipo de estudio fuera del enum', () => {
    expect(
      updateStudioProfileSchema.safeParse({ name: 'X', studioType: 'Inventado' }).success
    ).toBe(false)
  })
  it('acepta redes y tipo válidos', () => {
    const r = updateStudioProfileSchema.safeParse({
      name: 'X',
      city: 'Bogotá',
      studioType: 'Estudio privado',
      artistCount: '2-3',
      instagram: '@x',
    })
    expect(r.success).toBe(true)
  })
})

describe('updateStudioSlugSchema', () => {
  it('normaliza a minúsculas', () => {
    const r = updateStudioSlugSchema.safeParse({ slug: 'Crisbo-Tattoo' })
    expect(r.success && r.data.slug).toBe('crisbo-tattoo')
  })
  it('rechaza tildes/espacios y muy corto', () => {
    expect(updateStudioSlugSchema.safeParse({ slug: 'ab' }).success).toBe(false)
    expect(updateStudioSlugSchema.safeParse({ slug: 'josé' }).success).toBe(false)
    expect(updateStudioSlugSchema.safeParse({ slug: 'mi estudio' }).success).toBe(false)
  })
})

describe('updateStudioScheduleSchema', () => {
  it('exige al menos un día', () => {
    expect(updateStudioScheduleSchema.safeParse({ openDays: [] }).success).toBe(false)
  })
  it('acepta días válidos + horas', () => {
    const r = updateStudioScheduleSchema.safeParse({
      openDays: ['LUN', 'MAR'],
      openTime: '10:00',
      closeTime: '20:00',
    })
    expect(r.success).toBe(true)
  })
  it('rechaza día con acento y hora inválida', () => {
    expect(updateStudioScheduleSchema.safeParse({ openDays: ['MIÉ'] }).success).toBe(false)
    expect(updateStudioScheduleSchema.safeParse({ openDays: ['LUN'], openTime: '25:00' }).success).toBe(false)
  })
})

describe('updateStudioDepositSchema', () => {
  it('exige monto si hay modo', () => {
    expect(updateStudioDepositSchema.safeParse({ depositMode: 'percent' }).success).toBe(false)
  })
  it('rechaza monto <= 0', () => {
    expect(updateStudioDepositSchema.safeParse({ depositMode: 'fixed', depositValue: 0 }).success).toBe(false)
  })
  it('acepta modo + monto positivo', () => {
    expect(updateStudioDepositSchema.safeParse({ depositMode: 'percent', depositValue: 30 }).success).toBe(true)
  })
  it('acepta vacío (sin abono configurado)', () => {
    expect(updateStudioDepositSchema.safeParse({}).success).toBe(true)
  })
})

describe('updateStudioPaymentMethodsSchema', () => {
  it('acepta lista vacía y lista con métodos', () => {
    expect(updateStudioPaymentMethodsSchema.safeParse({ methods: [] }).success).toBe(true)
    expect(updateStudioPaymentMethodsSchema.safeParse({ methods: ['Nequi', 'Efectivo'] }).success).toBe(true)
  })
  it('rechaza entradas vacías', () => {
    expect(updateStudioPaymentMethodsSchema.safeParse({ methods: [''] }).success).toBe(false)
  })
})

describe('updateStudioPoliciesSchema', () => {
  it('acepta vacío y valores del enum', () => {
    expect(updateStudioPoliciesSchema.safeParse({}).success).toBe(true)
    const r = updateStudioPoliciesSchema.safeParse({
      paymentPolicy: 'Abono obligatorio',
      cancellationPolicy: 'Cancela con 24h de anticipación: sin penalidad',
      rules: ['Puntualidad'],
    })
    expect(r.success).toBe(true)
  })
  it('rechaza política fuera del enum', () => {
    expect(updateStudioPoliciesSchema.safeParse({ paymentPolicy: 'Otra' }).success).toBe(false)
  })
})

describe('updateArtistProfileSchema', () => {
  it('exige nombre (min 2)', () => {
    expect(updateArtistProfileSchema.safeParse({ name: 'A' }).success).toBe(false)
    expect(updateArtistProfileSchema.safeParse({ name: 'Ana' }).success).toBe(true)
  })
  it('acepta estilos y experiencia válidos', () => {
    const r = updateArtistProfileSchema.safeParse({
      name: 'Ana',
      styles: ['Blackwork'],
      experienceRange: '3 a 5 años',
      fullTime: true,
      ownStudio: false,
    })
    expect(r.success).toBe(true)
  })
  it('rechaza rango de experiencia inventado', () => {
    expect(updateArtistProfileSchema.safeParse({ name: 'Ana', experienceRange: '100 años' }).success).toBe(false)
  })
})
