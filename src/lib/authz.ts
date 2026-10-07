import { createClient } from '@/lib/supabase/server'

type OwnedTable = 'projects' | 'clients' | 'consent_templates' | 'quotes' | 'consents'

/**
 * Verifica que un registro pertenezca al estudio del usuario actual.
 * Se apoya en RLS: el select con el cliente autenticado solo ve filas del
 * propio estudio, así que "existe" equivale a "es mío". Evita que una acción
 * inserte referencias (project_id/client_id) apuntando a otro estudio, algo
 * que las policies no cubren porque solo validan la columna studio_id.
 */
export async function ownsRow(table: OwnedTable, id: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.from(table).select('id').eq('id', id).maybeSingle()
  return Boolean(data)
}
