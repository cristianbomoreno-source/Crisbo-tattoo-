import { describe, it, expect } from 'vitest'
import {
  profileStepSchema,
  specialtyStepSchema,
  experienceStepSchema,
  studioStepSchema,
  socialsStepSchema,
  depositStepSchema,
  policiesStepSchema,
} from './onboarding'

describe('profileStepSchema', () => {
  it('acepta datos válidos completos', () => {
    const r = profileStepSchema.safeParse({
      name: 'Crisbo',
      artisticName: 'Crisbo Tattoo',
      city: 'Medellín',
      whatsapp: '+57 350 204 6957',
    })
    expect(r.success).toBe(true)
  })

  it('acepta solo el nombre (resto opcional)', () => {
    expect(profileStepSchema.safeParse({ name: 'Andrés' }).success).toBe(true)
  })

  it('rechaza nombre muy corto', () => {
    expect(profileStepSchema.safeParse({ name: 'A' }).success).toBe(false)
  })

  it('rechaza name faltante', () => {
    expect(profileStepSchema.safeParse({}).success).toBe(false)
  })

  it('rechaza city mayor a 80 caracteres', () => {
    expect(
      profileStepSchema.safeParse({ name: 'Andrés', city: 'x'.repeat(81) }).success
    ).toBe(false)
  })
})

describe('specialtyStepSchema', () => {
  it('acepta estilos válidos + otro estilo', () => {
    const r = specialtyStepSchema.safeParse({
      styles: ['Realismo', 'Blackwork'],
      otherStyle: 'Puntillismo fino',
    })
    expect(r.success).toBe(true)
  })

  it('acepta objeto vacío (paso opcional)', () => {
    expect(specialtyStepSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza más de 10 estilos', () => {
    const styles = Array.from({ length: 11 }, (_, i) => `Estilo ${i}`)
    expect(specialtyStepSchema.safeParse({ styles }).success).toBe(false)
  })
})

describe('experienceStepSchema', () => {
  it('acepta datos válidos completos', () => {
    const r = experienceStepSchema.safeParse({
      experienceRange: '1 a 3 años',
      fullTime: true,
      ownStudio: false,
    })
    expect(r.success).toBe(true)
  })

  it('acepta objeto vacío (paso opcional)', () => {
    expect(experienceStepSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza experienceRange fuera del enum', () => {
    expect(
      experienceStepSchema.safeParse({ experienceRange: '20 años' }).success
    ).toBe(false)
  })
})

describe('studioStepSchema', () => {
  it('acepta datos válidos completos', () => {
    const r = studioStepSchema.safeParse({
      studioType: 'Estudio privado',
      address: 'Cra 45 #10-20',
      artistCount: '2-3',
      openDays: ['LUN', 'MAR', 'MIE'],
      openTime: '09:00',
      closeTime: '18:30',
    })
    expect(r.success).toBe(true)
  })

  it('acepta solo los campos requeridos (studioType + openDays)', () => {
    expect(
      studioStepSchema.safeParse({
        studioType: 'Artista independiente',
        openDays: ['LUN'],
      }).success
    ).toBe(true)
  })

  it('rechaza openDays vacío (requerido)', () => {
    expect(
      studioStepSchema.safeParse({
        studioType: 'Estudio privado',
        openDays: [],
      }).success
    ).toBe(false)
  })

  it('rechaza studioType faltante', () => {
    expect(studioStepSchema.safeParse({ openDays: ['LUN'] }).success).toBe(false)
  })

  it('rechaza studioType fuera del enum', () => {
    expect(
      studioStepSchema.safeParse({ studioType: 'Estudio inventado', openDays: ['LUN'] })
        .success
    ).toBe(false)
  })

  it('rechaza openTime con formato inválido', () => {
    expect(
      studioStepSchema.safeParse({
        studioType: 'Estudio privado',
        openDays: ['LUN'],
        openTime: '9am',
      }).success
    ).toBe(false)
  })
})

describe('socialsStepSchema', () => {
  it('acepta datos válidos completos', () => {
    const r = socialsStepSchema.safeParse({
      instagram: 'crisbo.tattoo',
      tiktok: 'crisbo.tattoo',
      facebook: 'CrisboTattoo',
      website: 'https://crisbo.com',
      slug: 'crisbo-tattoo',
    })
    expect(r.success).toBe(true)
  })

  it('acepta objeto vacío (paso opcional)', () => {
    expect(socialsStepSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza slug con mayúsculas', () => {
    expect(socialsStepSchema.safeParse({ slug: 'Crisbo-Tattoo' }).success).toBe(false)
  })

  it('rechaza slug con espacios o caracteres inválidos', () => {
    expect(socialsStepSchema.safeParse({ slug: 'mi estudio' }).success).toBe(false)
  })

  it('rechaza campos de redes mayores a 120 caracteres', () => {
    expect(
      socialsStepSchema.safeParse({ instagram: 'x'.repeat(121) }).success
    ).toBe(false)
  })
})

describe('depositStepSchema', () => {
  it('acepta modo fijo con monto positivo', () => {
    expect(
      depositStepSchema.safeParse({ depositMode: 'fixed', depositValue: 100000 }).success
    ).toBe(true)
  })

  it('acepta modo porcentaje con valor positivo', () => {
    expect(
      depositStepSchema.safeParse({ depositMode: 'percent', depositValue: 30 }).success
    ).toBe(true)
  })

  it('acepta objeto vacío (paso opcional)', () => {
    expect(depositStepSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza depositValue negativo', () => {
    expect(
      depositStepSchema.safeParse({ depositMode: 'fixed', depositValue: -50000 }).success
    ).toBe(false)
  })

  it('rechaza depositValue cero', () => {
    expect(
      depositStepSchema.safeParse({ depositMode: 'fixed', depositValue: 0 }).success
    ).toBe(false)
  })

  it('rechaza mode sin value', () => {
    expect(depositStepSchema.safeParse({ depositMode: 'fixed' }).success).toBe(false)
  })

  it('rechaza depositMode fuera de fixed/percent', () => {
    expect(
      depositStepSchema.safeParse({ depositMode: 'other', depositValue: 100 }).success
    ).toBe(false)
  })
})

describe('policiesStepSchema', () => {
  it('acepta datos válidos completos', () => {
    const r = policiesStepSchema.safeParse({
      paymentPolicy: 'Abono obligatorio',
      cancellationPolicy: 'Cancela con 24h de anticipación: sin penalidad',
      rules: ['Respeto', 'Puntualidad'],
    })
    expect(r.success).toBe(true)
  })

  it('acepta objeto vacío (paso opcional)', () => {
    expect(policiesStepSchema.safeParse({}).success).toBe(true)
  })

  it('rechaza paymentPolicy fuera del enum', () => {
    expect(
      policiesStepSchema.safeParse({ paymentPolicy: 'Pago en cuotas' }).success
    ).toBe(false)
  })

  it('rechaza cancellationPolicy fuera del enum', () => {
    expect(
      policiesStepSchema.safeParse({ cancellationPolicy: 'Sin política' }).success
    ).toBe(false)
  })
})
