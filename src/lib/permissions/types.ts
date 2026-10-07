import type { Database } from '@/lib/types/database.types'

export type ArtistPermissions = Omit<
  Database['public']['Tables']['artist_permissions']['Row'],
  'artist_id' | 'created_at' | 'updated_at'
>

/** El owner de un estudio (o el tatuador independiente) siempre tiene todo. */
export const OWNER_PERMISSIONS: ArtistPermissions = {
  can_create_appointments: true,
  can_move_appointments: true,
  can_block_schedule: true,
  can_cancel_sessions: true,
  can_create_clients: true,
  can_edit_clients: true,
  can_create_projects: true,
  can_edit_projects: true,
  can_delete_projects: true,
  can_respond_quotes: true,
  can_modify_prices: true,
  can_edit_duration: true,
  can_use_inventory: true,
  can_discount_materials: true,
  can_create_inventory_categories: true,
  can_edit_inventory: true,
}

/** Si un member aún no tiene fila en `artist_permissions` (no debería pasar,
 * `approveJoinRequest` siempre la crea), todo cerrado por seguridad. */
export const NO_PERMISSIONS: ArtistPermissions = {
  can_create_appointments: false,
  can_move_appointments: false,
  can_block_schedule: false,
  can_cancel_sessions: false,
  can_create_clients: false,
  can_edit_clients: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_delete_projects: false,
  can_respond_quotes: false,
  can_modify_prices: false,
  can_edit_duration: false,
  can_use_inventory: false,
  can_discount_materials: false,
  can_create_inventory_categories: false,
  can_edit_inventory: false,
}

export const PERMISSION_LABELS: Record<keyof ArtistPermissions, string> = {
  can_create_appointments: 'Puede crear citas',
  can_move_appointments: 'Puede mover citas',
  can_block_schedule: 'Puede bloquear horarios',
  can_cancel_sessions: 'Puede cancelar sesiones',
  can_create_clients: 'Puede crear clientes',
  can_edit_clients: 'Puede editar clientes',
  can_create_projects: 'Puede crear proyectos',
  can_edit_projects: 'Puede editar proyectos',
  can_delete_projects: 'Puede eliminar proyectos',
  can_respond_quotes: 'Puede responder cotizaciones',
  can_modify_prices: 'Puede modificar precios',
  can_edit_duration: 'Puede editar duración',
  can_use_inventory: 'Puede utilizar inventario',
  can_discount_materials: 'Puede descontar materiales',
  can_create_inventory_categories: 'Puede crear categorías',
  can_edit_inventory: 'Puede editar inventario',
}
