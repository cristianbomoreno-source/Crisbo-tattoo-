import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStudio } from '@/queries/studio'
import { OWNER_PERMISSIONS, NO_PERMISSIONS, type ArtistPermissions } from '@/lib/permissions/types'

/**
 * Permisos del artista actual dentro de su estudio. El owner (tatuador
 * independiente o dueño de estudio) siempre tiene todo — no se consulta la
 * tabla. Un member lee su fila de `artist_permissions` (RLS: solo la suya).
 * `null` si no hay sesión/estudio (mismo caso que `getCurrentStudio`).
 */
export const getCurrentPermissions = cache(
  async (): Promise<{ role: string; permissions: ArtistPermissions } | null> => {
    const studio = await getCurrentStudio()
    if (!studio) return null

    if (studio.role === 'owner') {
      return { role: 'owner', permissions: OWNER_PERMISSIONS }
    }

    const supabase = await createClient()
    const { data } = await supabase
      .from('artist_permissions')
      .select(
        'can_create_appointments, can_move_appointments, can_block_schedule, can_cancel_sessions, can_create_clients, can_edit_clients, can_create_projects, can_edit_projects, can_delete_projects, can_respond_quotes, can_modify_prices, can_edit_duration, can_use_inventory, can_discount_materials, can_create_inventory_categories, can_edit_inventory'
      )
      .eq('artist_id', studio.artistId)
      .maybeSingle()

    return { role: studio.role, permissions: data ?? NO_PERMISSIONS }
  }
)
