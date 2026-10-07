'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { LOGO_MAX_BYTES, LOGO_ALLOWED_TYPES } from '@/lib/validations/studio'
import { DEFAULT_THEME, type LinkPageConfig, type LinkPageTheme, type TemplateKey } from '@/lib/link-page/theme'
import { revalidatePath } from 'next/cache'

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}
const COVER_MAX_BYTES = 8 * 1024 * 1024

async function requireOwner(): Promise<Result<{ studioId: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('AUTH_ERROR', 'Solo el dueño puede personalizar el link')
  return ok({ studioId: studio.id })
}

/** Config completa de la página pública — con defaults (plantilla Dark) si
 * el estudio todavía no personalizó nada. */
export async function getLinkPageConfig(): Promise<Result<LinkPageConfig>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studio_link_page')
    .select('*')
    .eq('studio_id', gate.data.studioId)
    .maybeSingle()
  if (error) return dbError(error)

  return ok({
    profilePhotoUrl: data?.profile_photo_url ?? null,
    coverPhotoUrl: data?.cover_photo_url ?? null,
    displayName: data?.display_name ?? null,
    bio: data?.bio ?? null,
    tagline: data?.tagline ?? null,
    badgeLabel: data?.badge_label ?? null,
    locationLabel: data?.location_label ?? null,
    template: (data?.template as TemplateKey) ?? 'dark',
    theme: (data?.theme as LinkPageTheme) && Object.keys(data?.theme ?? {}).length > 0 ? (data!.theme as LinkPageTheme) : DEFAULT_THEME,
  })
}

/** Autoguardado: el cliente manda el objeto completo (no parches parciales)
 * cada vez que algo cambia, con debounce — evita bugs de mezcla parcial. */
export async function saveLinkPageConfig(config: LinkPageConfig): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const { error } = await supabase.from('studio_link_page').upsert(
    {
      studio_id: gate.data.studioId,
      profile_photo_url: config.profilePhotoUrl,
      cover_photo_url: config.coverPhotoUrl,
      display_name: config.displayName,
      bio: config.bio,
      tagline: config.tagline,
      badge_label: config.badgeLabel,
      location_label: config.locationLabel,
      template: config.template,
      theme: config.theme,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'studio_id' }
  )
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/enlace')
  return ok(undefined)
}

async function uploadLinkPagePhoto(
  formData: FormData,
  kind: 'profile' | 'cover'
): Promise<Result<{ url: string }>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return err('VALIDATION_ERROR', 'Archivo requerido')
  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number]))
    return err('VALIDATION_ERROR', 'Formato no permitido (PNG, JPG o WebP)')
  const maxBytes = kind === 'profile' ? LOGO_MAX_BYTES : COVER_MAX_BYTES
  if (file.size > maxBytes) return err('VALIDATION_ERROR', `La foto supera ${Math.round(maxBytes / 1024 / 1024)} MB`)

  const studioId = gate.data.studioId
  const ext = EXT_BY_TYPE[file.type] ?? 'jpg'
  const storagePath = `${studioId}/${kind}.${ext}`
  const pathColumn = `${kind}_photo_path`
  const urlColumn = `${kind}_photo_url`

  const supabase = await createClient()
  const { data: prev } = await supabase
    .from('studio_link_page')
    .select(pathColumn)
    .eq('studio_id', studioId)
    .maybeSingle()

  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from('link-page-photos')
    .upload(storagePath, file, { contentType: file.type, upsert: true })
  if (upErr) {
    console.error('[storage]', upErr.message)
    return err('DB_ERROR', 'No se pudo subir la foto. Intenta de nuevo.')
  }

  const { data: { publicUrl } } = admin.storage.from('link-page-photos').getPublicUrl(storagePath)
  const url = `${publicUrl}?v=${Date.now()}`

  const prevPath = (prev as Record<string, string | null> | null)?.[pathColumn]
  if (prevPath && prevPath !== storagePath) {
    await admin.storage.from('link-page-photos').remove([prevPath])
  }

  const { error: dbErr } = await supabase
    .from('studio_link_page')
    .upsert({ studio_id: studioId, [urlColumn]: url, [pathColumn]: storagePath }, { onConflict: 'studio_id' })
  if (dbErr) return dbError(dbErr)

  revalidatePath('/dashboard/settings/enlace')
  return ok({ url })
}

export async function uploadLinkPageProfilePhoto(formData: FormData) {
  return uploadLinkPagePhoto(formData, 'profile')
}

export async function uploadLinkPageCoverPhoto(formData: FormData) {
  return uploadLinkPagePhoto(formData, 'cover')
}
