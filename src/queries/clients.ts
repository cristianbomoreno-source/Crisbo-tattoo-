import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'

export type Client = {
  id: string
  studio_id: string
  artist_id: string | null
  name: string
  phone: string | null
  email: string | null
  instagram: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Un member del estudio solo ve sus propios clientes; el owner (tatuador
 * independiente o dueño de estudio) ve todos, igual que siempre. */
export async function getClients(): Promise<Result<Client[]>> {
  const studio = await getCurrentStudio()
  const supabase = await createClient()
  let query = supabase.from('clients').select('*').order('name')
  if (studio && studio.role !== 'owner') {
    query = query.eq('artist_id', studio.artistId)
  }
  const { data, error } = await query

  if (error) return dbError(error)
  return ok(data as Client[])
}

export async function getClient(id: string): Promise<Result<Client>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return err('NOT_FOUND', 'Cliente no encontrado')
  return ok(data as Client)
}
