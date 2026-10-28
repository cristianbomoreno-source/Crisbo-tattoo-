'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { loadMarketingPlan, saveMarketingPlan } from '@/lib/marketing/store'
import type { MarketingPlan } from '@/lib/marketing/types'

const MAX_BYTES = 2_000_000

/**
 * Guarda el plan completo de /marketing (lo manda el editor con pausa tras
 * cada cambio). Solo el dueño del estudio. Si otra pestaña guardó una
 * versión más nueva, se rechaza para no pisarla.
 */
export async function saveMarketingPlanAction(plan: MarketingPlan): Promise<Result<{ version: number; updatedAt: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'Inicia sesión')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño puede editar el plan')
  if (!plan || !Array.isArray(plan.actions) || !Array.isArray(plan.campaigns)) return err('VALIDATION_ERROR', 'Plan inválido')
  if (JSON.stringify(plan).length > MAX_BYTES) return err('VALIDATION_ERROR', 'El plan es demasiado grande')

  const admin = createAdminClient()
  const current = await loadMarketingPlan(admin, studio.id)
  if (current.version > plan.version) return err('VALIDATION_ERROR', 'Hay una versión más nueva del plan. Recarga la página.')

  const next: MarketingPlan = { ...plan, version: plan.version + 1, updatedAt: new Date().toISOString() }
  try {
    await saveMarketingPlan(admin, studio.id, next)
  } catch (e) {
    return err('UNKNOWN_ERROR', (e as Error).message)
  }
  return ok({ version: next.version, updatedAt: next.updatedAt })
}
