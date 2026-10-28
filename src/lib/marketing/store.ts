import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketingPlan } from './types'
import { seedPlan } from './seed'

/**
 * El plan de /marketing vive como JSON en el bucket privado
 * `studio-private/{studioId}/marketing-plan.json` (igual que
 * lib/social/store.ts): sin cambiar el esquema de la base. Si no existe,
 * se usa el plan inicial (seed.ts).
 */
const BUCKET = 'studio-private'
const path = (studioId: string) => `${studioId}/marketing-plan.json`

export async function loadMarketingPlan(admin: SupabaseClient, studioId: string): Promise<MarketingPlan> {
  const { data, error } = await admin.storage.from(BUCKET).download(path(studioId))
  if (error || !data) return seedPlan()
  try {
    const plan = JSON.parse(await data.text()) as MarketingPlan
    return plan?.actions && plan?.campaigns ? plan : seedPlan()
  } catch {
    return seedPlan()
  }
}

export async function saveMarketingPlan(admin: SupabaseClient, studioId: string, plan: MarketingPlan) {
  const body = new Blob([JSON.stringify(plan)], { type: 'application/json' })
  let { error } = await admin.storage.from(BUCKET).upload(path(studioId), body, { upsert: true, contentType: 'application/json' })
  if (error && /not found/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await admin.storage.from(BUCKET).upload(path(studioId), body, { upsert: true, contentType: 'application/json' }))
  }
  if (error) throw new Error(error.message)
}
