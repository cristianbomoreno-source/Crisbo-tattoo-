import { describe, expect, it } from 'vitest'
import { adsCard, buildDecisionCards, conversionCard, postingCard, profileClicksCard, revenueCard, type DecisionInput } from './decisions'

const base: DecisionInput = {
  today: '2026-10-15',
  revenueGoal: 3_100_000,
  incomeThisMonth: 1_500_000,
  avgTicket: 460_000,
  ig: {
    postsLast14: 2,
    reach30: 15_000,
    reachPrev30: 30_000,
    profileViews30: 600,
    websiteClicks30: 6,
    reachBusyWeek: 12_000,
    reachQuietWeek: 4_000,
  },
  leads: { total30: 100, booked30: 5, openLeads: 12 },
  ads: { connected: true, spend30: 50_000, conversations30: 60, historicCostPerConv: 870 },
  tiktok: { month: '2026-09', current: null, previous: null },
  google: { month: '2026-09', current: null, previous: null },
}

describe('revenueCard', () => {
  it('compara con el ritmo del mes y dice cuántos tatuajes faltan', () => {
    // Día 15 de 31: ritmo = 1.5M → 1.5M llevados = verde.
    const c = revenueCard(base)
    expect(c.light).toBe('good')
    expect(c.action).toContain('~4 tatuajes') // 1.6M / 460k = 3.5 → 4
  })
  it('rojo si va por debajo del 70% del ritmo', () => {
    expect(revenueCard({ ...base, incomeThisMonth: 900_000 }).light).toBe('bad')
  })
  it('sin meta → gris y pide ponerla', () => {
    const c = revenueCard({ ...base, revenueGoal: null })
    expect(c.light).toBe('none')
  })
  it('meta cumplida → verde', () => {
    expect(revenueCard({ ...base, incomeThisMonth: 3_200_000 }).light).toBe('good')
  })
})

describe('instagram', () => {
  it('pocas publicaciones = rojo con la evidencia de sus propias semanas', () => {
    const c = postingCard(base)
    expect(c.light).toBe('bad')
    expect(c.detail).toContain('200% más')
  })
  it('1% de clics al enlace = rojo', () => {
    expect(profileClicksCard(base).light).toBe('bad')
  })
})

describe('conversionCard / adsCard', () => {
  it('5% de chats a cita = rojo y menciona los chats abiertos', () => {
    const c = conversionCard(base)
    expect(c.light).toBe('bad')
    expect(c.action).toContain('12 chats')
  })
  it('anuncios a ~$833 por conversación = verde', () => {
    expect(adsCard(base).light).toBe('good')
  })
  it('gasto sin conversaciones = rojo', () => {
    expect(adsCard({ ...base, ads: { ...base.ads, conversations30: 0 } }).light).toBe('bad')
  })
  it('sin conectar = gris', () => {
    expect(adsCard({ ...base, ads: { ...base.ads, connected: false } }).light).toBe('none')
  })
})

it('arma las 8 tarjetas', () => {
  expect(buildDecisionCards(base).map((c) => c.key)).toEqual([
    'revenue',
    'conversion',
    'ads',
    'posting',
    'reach',
    'clicks',
    'google',
    'tiktok',
  ])
})
