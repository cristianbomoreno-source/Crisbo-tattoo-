'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { checkReply, type AgentMessage, type CheckedReply } from '@/lib/ad-agent/guard'
import { writeReply } from '@/lib/ad-agent/reply'
import { loadAdAgentSettings, saveAdAgentSettings } from '@/lib/ad-agent/store'

const schema = z.object({ enabled: z.boolean(), knowledge: z.string().trim().min(20).max(6000) })

/** Encender el agente fija `enabledAt`: solo atiende anuncios que entren desde
 * ese momento, nunca los chats que Crisbo ya venía llevando. */
export async function updateAdAgent(input: unknown): Promise<Result<void>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  const parsed = schema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Escribe la información del estudio')
  try {
    const admin = createAdminClient()
    const current = await loadAdAgentSettings(admin, studio.id)
    await saveAdAgentSettings(admin, studio.id, {
      ...parsed.data,
      enabledAt: parsed.data.enabled ? (current.enabled && current.enabledAt ? current.enabledAt : new Date().toISOString()) : null,
    })
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
  revalidatePath('/dashboard/settings/agente')
  return ok(undefined)
}

const trySchema = z.object({
  knowledge: z.string().trim().min(20).max(6000),
  messages: z.array(z.object({ direction: z.enum(['in', 'out']), body: z.string().max(2000) })).min(1).max(40),
})

/** Simulador de Ajustes: el agente contesta aquí mismo y no envía nada a nadie. */
export async function tryAdAgent(input: unknown): Promise<Result<CheckedReply>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño del estudio puede cambiar esto')
  const parsed = trySchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Mensaje inválido')
  const { knowledge } = parsed.data
  const messages: AgentMessage[] = parsed.data.messages.map((m) => ({
    ...m,
    type: 'text',
    media_filename: null,
    created_at: new Date().toISOString(),
  }))
  try {
    return ok(checkReply(await writeReply({ messages, media: [], knowledge, contactName: null, returningClient: false }), knowledge))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
}
