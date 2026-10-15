/** Campaña "Nuevos Trazos": a quién le llega y cómo se saluda.
 * Lógica pura (sin Supabase) para poder probarla. */

export type CampaignGroup = 'A' | 'B'

export const CAMPAIGN_GROUPS: Record<CampaignGroup, { label: string; hint: string }> = {
  A: { label: 'Grupo A', hint: 'Vinieron hace 3 a 12 meses' },
  B: { label: 'Grupo B', hint: 'Más de 1 año sin venir' },
}

const DAY = 24 * 60 * 60 * 1000

/** Meses sin venir (aprox.) desde la última visita. */
export function monthsSince(lastVisit: string, now = new Date()): number {
  return (now.getTime() - new Date(lastVisit).getTime()) / (30.44 * DAY)
}

/** Grupo según la última visita; null = vino hace menos de 3 meses (no entra). */
export function campaignGroup(lastVisit: string, now = new Date()): CampaignGroup | null {
  const months = monthsSince(lastVisit, now)
  if (months < 3) return null
  return months < 12 ? 'A' : 'B'
}

/** Primer nombre con mayúscula inicial: "hellman Fajardo" → "Hellman". */
export function firstName(fullName: string): string {
  const word = fullName.trim().split(/\s+/)[0] ?? ''
  return word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es')
}

/** "hace 7 meses" / "hace 1 año y 2 meses". */
export function timeAwayLabel(lastVisit: string, now = new Date()): string {
  const total = Math.floor(monthsSince(lastVisit, now))
  const years = Math.floor(total / 12)
  const months = total % 12
  const m = months === 1 ? '1 mes' : `${months} meses`
  if (years === 0) return `hace ${m}`
  const y = years === 1 ? '1 año' : `${years} años`
  return months === 0 ? `hace ${y}` : `hace ${y} y ${m}`
}
