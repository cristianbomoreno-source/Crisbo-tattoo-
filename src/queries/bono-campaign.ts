import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { err, ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'
import { firstName } from '@/lib/campaigns/audience'
import { BONO_KEY, BONO_MARKER } from '@/lib/campaigns/bono'
import { CAMPAIGN_MARKER } from '@/lib/campaigns/nuevos-trazos'

export type BonoRecipient = {
  clientId: string
  name: string
  firstName: string
  phone: string
  lastVisit: string | null
  conversationId: string | null
  /** Estado del bono (sent/delivered/read/failed); null = no enviado. */
  sentStatus: string | null
  /** Escribió algo después de recibir el bono. */
  wroteBack: boolean
  /** Quitado a mano: no se puede elegir. */
  excluded: boolean
  /** Ya le llegó Nuevos Trazos. */
  gotNuevosTrazos: boolean
}

const phoneKey = (p: string | null | undefined) => {
  const d = (p ?? '').replace(/\D/g, '')
  return d.length >= 7 ? d.slice(-10) : null
}

/** Todos los clientes con teléfono, con lo que ya les llegó. Solo el dueño. */
export async function getBonoCampaignData(): Promise<Result<BonoRecipient[]>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede ver las campañas')
  return loadBonoCampaignData(await createClient(), studio.id)
}

/** Paginado: Supabase devuelve máximo 1.000 filas por consulta. */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function loadBonoCampaignData(supabase: SupabaseClient, studioId: string): Promise<Result<BonoRecipient[]>> {
  try {
    type Client = { id: string; name: string; phone: string | null; last_session_date: string | null }
    type Conv = { id: string; client_id: string | null; wa_id: string }
    type Msg = { conversation_id: string; status: string; body: string; created_at: string }

    const [clients, convs, bonoOut, ntOut, exclusions] = await Promise.all([
      all<Client>((a, b) =>
        supabase
          .from('clients')
          .select('id, name, phone, last_session_date')
          .eq('studio_id', studioId)
          .not('phone', 'is', null)
          .order('name')
          .order('id')
          .range(a, b)
      ),
      all<Conv>((a, b) =>
        supabase.from('wa_conversations').select('id, client_id, wa_id').eq('studio_id', studioId).order('id').range(a, b)
      ),
      all<Msg>((a, b) =>
        supabase
          .from('wa_messages')
          .select('conversation_id, status, body, created_at')
          .eq('studio_id', studioId)
          .eq('direction', 'out')
          .like('body', `${BONO_MARKER}%`)
          .order('created_at', { ascending: true })
          .range(a, b)
      ),
      all<Msg>((a, b) =>
        supabase
          .from('wa_messages')
          .select('conversation_id, status, body, created_at')
          .eq('studio_id', studioId)
          .eq('direction', 'out')
          .like('body', `${CAMPAIGN_MARKER}%`)
          .neq('status', 'failed')
          .order('created_at', { ascending: true })
          .range(a, b)
      ),
      all<{ client_id: string }>((a, b) =>
        supabase
          .from('campaign_exclusions')
          .select('client_id')
          .eq('studio_id', studioId)
          .eq('campaign', BONO_KEY)
          .range(a, b)
      ),
    ])

    // Chat de cada cliente: el vinculado, o el que tenga su número.
    const convByClient = new Map<string, string>()
    const convByPhone = new Map<string, string>()
    for (const c of convs) {
      if (c.client_id && !convByClient.has(c.client_id)) convByClient.set(c.client_id, c.id)
      const k = phoneKey(c.wa_id)
      if (k && !convByPhone.has(k)) convByPhone.set(k, c.id)
    }

    const status = new Map<string, string>()
    const sentAt = new Map<string, string>()
    for (const m of bonoOut) {
      status.set(m.conversation_id, m.status)
      sentAt.set(m.conversation_id, m.created_at)
    }
    const gotNt = new Set(ntOut.map((m) => m.conversation_id))

    // Respuestas después del bono (solo en los chats a los que se envió).
    const wroteBack = new Set<string>()
    const sentConvs = [...sentAt.keys()]
    for (let i = 0; i < sentConvs.length; i += 200) {
      const { data, error } = await supabase
        .from('wa_messages')
        .select('conversation_id, created_at')
        .in('conversation_id', sentConvs.slice(i, i + 200))
        .eq('direction', 'in')
      if (error) throw error
      for (const m of (data ?? []) as { conversation_id: string; created_at: string }[]) {
        const at = sentAt.get(m.conversation_id)
        if (at && new Date(m.created_at) > new Date(at)) wroteBack.add(m.conversation_id)
      }
    }

    const excluded = new Set(exclusions.map((e) => e.client_id))
    const seenPhones = new Set<string>()
    const recipients: BonoRecipient[] = []
    for (const c of clients) {
      const k = phoneKey(c.phone)
      // Un mismo número guardado dos veces solo aparece una.
      if (!k || seenPhones.has(k)) continue
      seenPhones.add(k)
      const conv = convByClient.get(c.id) ?? convByPhone.get(k) ?? null
      recipients.push({
        clientId: c.id,
        name: c.name,
        firstName: firstName(c.name),
        phone: c.phone!.trim(),
        lastVisit: c.last_session_date,
        conversationId: conv,
        sentStatus: conv ? status.get(conv) ?? null : null,
        wroteBack: conv ? wroteBack.has(conv) : false,
        excluded: excluded.has(c.id),
        gotNuevosTrazos: conv ? gotNt.has(conv) : false,
      })
    }
    return ok(recipients)
  } catch (e) {
    return dbError(e as { message: string })
  }
}
