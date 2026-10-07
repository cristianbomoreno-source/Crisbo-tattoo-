'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'

export type StudioLink = {
  id: string
  label: string
  subtitle: string | null
  url: string
  icon: string
  color: string | null
  enabled: boolean
  sortOrder: number
}

async function requireOwnerStudioId(): Promise<Result<string>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño puede editar los enlaces')
  return ok(studio.id)
}

export async function listStudioLinks(): Promise<Result<StudioLink[]>> {
  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studio_links')
    .select('id, label, subtitle, url, icon, color, enabled, sort_order')
    .eq('studio_id', gate.data)
    .order('sort_order', { ascending: true })
  if (error) return dbError(error)

  return ok((data ?? []).map((l) => ({ ...l, sortOrder: l.sort_order })))
}

export async function createStudioLink(input: {
  label: string
  url: string
  icon?: string
  subtitle?: string
  color?: string
}): Promise<Result<StudioLink>> {
  if (!input.label.trim()) return err('VALIDATION_ERROR', 'Ingresa un nombre para el enlace')
  if (!input.url.trim()) return err('VALIDATION_ERROR', 'Ingresa la URL del enlace')

  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const url = /^https?:\/\//i.test(input.url.trim()) ? input.url.trim() : `https://${input.url.trim()}`

  const supabase = await createClient()
  const { count } = await supabase
    .from('studio_links')
    .select('id', { count: 'exact', head: true })
    .eq('studio_id', gate.data)

  const { data, error } = await supabase
    .from('studio_links')
    .insert({
      studio_id: gate.data,
      label: input.label.trim(),
      subtitle: input.subtitle?.trim() || null,
      url,
      icon: input.icon ?? 'link',
      color: input.color ?? null,
      sort_order: count ?? 0,
    })
    .select('id, label, subtitle, url, icon, color, enabled, sort_order')
    .single()
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/enlace')
  return ok({ ...data, sortOrder: data.sort_order })
}

export async function updateStudioLink(
  id: string,
  patch: { label?: string; subtitle?: string | null; url?: string; icon?: string; color?: string | null; enabled?: boolean }
): Promise<Result<void>> {
  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const cleanPatch: Record<string, unknown> = { ...patch }
  if (patch.url) {
    cleanPatch.url = /^https?:\/\//i.test(patch.url.trim()) ? patch.url.trim() : `https://${patch.url.trim()}`
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('studio_links')
    .update(cleanPatch)
    .eq('id', id)
    .eq('studio_id', gate.data)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/enlace')
  return ok(undefined)
}

export async function deleteStudioLink(id: string): Promise<Result<void>> {
  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { error } = await supabase.from('studio_links').delete().eq('id', id).eq('studio_id', gate.data)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/enlace')
  return ok(undefined)
}

/** Sube/baja un enlace en la lista intercambiando su `sort_order` con el
 * vecino — reordenado simple de manija arriba/abajo, sin drag & drop. */
export async function moveStudioLink(id: string, direction: 'up' | 'down'): Promise<Result<void>> {
  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data: links } = await supabase
    .from('studio_links')
    .select('id, sort_order')
    .eq('studio_id', gate.data)
    .order('sort_order', { ascending: true })
  if (!links) return ok(undefined)

  const index = links.findIndex((l) => l.id === id)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || swapIndex < 0 || swapIndex >= links.length) return ok(undefined)

  const a = links[index]!
  const b = links[swapIndex]!
  await supabase.from('studio_links').update({ sort_order: b.sort_order }).eq('id', a.id)
  await supabase.from('studio_links').update({ sort_order: a.sort_order }).eq('id', b.id)

  revalidatePath('/dashboard/settings/enlace')
  return ok(undefined)
}

/** Reordenado por drag & drop: recibe la lista completa de ids en el orden
 * final y reescribe `sort_order` de una vez (0, 1, 2…). Reemplaza al
 * intercambio de a pares de `moveStudioLink` cuando el front ya soltó el
 * enlace en su posición nueva. */
export async function reorderStudioLinks(orderedIds: string[]): Promise<Result<void>> {
  const gate = await requireOwnerStudioId()
  if (!gate.success) return gate

  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('studio_links').update({ sort_order: index }).eq('id', id).eq('studio_id', gate.data)
    )
  )

  revalidatePath('/dashboard/settings/enlace')
  return ok(undefined)
}
