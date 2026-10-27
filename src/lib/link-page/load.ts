import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** Estudio dueño de crisbotattoo.com/redes: LINK_PAGE_STUDIO_ID o, si no
 * está, el mismo estudio de los atajos del iPhone (QUICK_EXPENSE_STUDIO_ID). */
export function mainStudioId() {
  return process.env.LINK_PAGE_STUDIO_ID?.trim() || process.env.QUICK_EXPENSE_STUDIO_ID?.trim() || null
}

export type PublicLink = { id: string; label: string; subtitle: string | null; url: string; icon: string; color: string | null }

export type PublicLinkPage = {
  studioId: string
  slug: string
  name: string
  logoUrl: string | null
  displayName: string | null
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  bio: string | null
  tagline: string | null
  badge: string | null
  location: string | null
  mapsUrl: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  whatsapp: string | null
  links: PublicLink[]
  isOwner: boolean
}

/** Datos de la página de links (pública): perfil del estudio, lo que se
 * configuró en Estudio → Página de links y los botones activos. */
export async function loadPublicLinkPage(by: { slug: string } | { id: string }): Promise<PublicLinkPage | null> {
  const admin = createAdminClient()
  const query = admin
    .from('studios')
    .select('id, slug, name, logo_url, description, city, maps_url, instagram, tiktok, facebook, website, whatsapp_phone')
  const { data: studio } = await ('slug' in by ? query.eq('slug', by.slug) : query.eq('id', by.id)).maybeSingle()
  if (!studio) return null

  const [{ data: links }, { data: page }] = await Promise.all([
    admin
      .from('studio_links')
      .select('id, label, subtitle, url, icon, color')
      .eq('studio_id', studio.id)
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
    admin.from('studio_link_page').select('*').eq('studio_id', studio.id).maybeSingle(),
  ])

  let isOwner = false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: artist } = await supabase.from('artists').select('role').eq('user_id', user.id).eq('studio_id', studio.id).maybeSingle()
    isOwner = artist?.role === 'owner'
  }

  return {
    studioId: studio.id,
    slug: studio.slug,
    name: studio.name,
    logoUrl: studio.logo_url,
    displayName: page?.display_name ?? null,
    profilePhotoUrl: page?.profile_photo_url ?? null,
    coverPhotoUrl: page?.cover_photo_url ?? null,
    bio: page?.bio ?? studio.description ?? null,
    tagline: page?.tagline ?? null,
    badge: page?.badge_label ?? null,
    location: page?.location_label ?? studio.city ?? null,
    mapsUrl: studio.maps_url ?? null,
    instagram: studio.instagram,
    tiktok: studio.tiktok,
    facebook: studio.facebook,
    website: studio.website,
    whatsapp: studio.whatsapp_phone,
    links: (links ?? []) as PublicLink[],
    isOwner,
  }
}
