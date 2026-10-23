'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { deleteMetaSecret, saveMetaSecret, saveSocialSettings } from '@/lib/social/store'
import { checkMetaToken } from '@/lib/social/meta-ads'

const PAGE = '/dashboard/stats/redes'

async function requireOwner(): Promise<Result<{ studioId: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  return ok({ studioId: studio.id })
}

const goalSchema = z.object({ revenueGoal: z.number().int().min(0).max(10_000_000_000).nullable() })

/** Meta de ingresos del mes (se repite cada mes). */
export async function updateRevenueGoal(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Meta inválida')
  try {
    await saveSocialSettings(createAdminClient(), gate.data.studioId, (s) => ({ ...s, revenueGoal: parsed.data.revenueGoal }))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath(PAGE)
  return ok(undefined)
}

const n = z.number().int().min(0).max(1_000_000_000).nullable()
const manualSchema = z.discriminatedUnion('network', [
  z.object({
    network: z.literal('tiktok'),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    values: z.object({ followers: n, views: n, profileViews: n }),
  }),
  z.object({
    network: z.literal('google'),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    values: z.object({ views: n, directions: n, calls: n, webClicks: n, reviews: n }),
  }),
])

/** Cifras de un mes de TikTok o Google (se copian a mano de cada app). */
export async function saveManualSocialMonth(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = manualSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos')
  const d = parsed.data
  try {
    await saveSocialSettings(createAdminClient(), gate.data.studioId, (s) => ({
      ...s,
      manual:
        d.network === 'tiktok'
          ? { ...s.manual, tiktok: { ...s.manual.tiktok, [d.month]: d.values } }
          : { ...s.manual, google: { ...s.manual.google, [d.month]: d.values } },
    }))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath(PAGE)
  return ok(undefined)
}

/** Guarda el token del usuario del sistema de Meta (lo pega el dueño). Se
 * revisa contra Meta antes de guardarlo y nunca se devuelve al navegador. */
export async function saveMetaToken(input: unknown): Promise<Result<{ name: string; missing: string[] }>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = z.object({ token: z.string().trim().min(50).max(1000) }).safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Ese token no parece válido (es un texto largo que empieza por EAA).')
  let check: { name: string; missing: string[] }
  try {
    check = await checkMetaToken(parsed.data.token)
  } catch (e) {
    return err('VALIDATION_ERROR', `Meta rechazó el token: ${(e as Error).message}`)
  }
  try {
    await saveMetaSecret(createAdminClient(), gate.data.studioId, parsed.data.token)
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath(PAGE)
  return ok({ name: check.name, missing: [...check.missing] })
}

export async function disconnectMeta(): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  await deleteMetaSecret(createAdminClient(), gate.data.studioId)
  revalidatePath(PAGE)
  return ok(undefined)
}
