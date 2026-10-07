import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { LinkTreePage } from '@/components/studio/link-tree-page'
import { DEFAULT_THEME, type LinkPageConfig, type LinkPageTheme, type TemplateKey } from '@/lib/link-page/theme'

export default async function StudioLinkTreePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: studio } = await admin
    .from('studios')
    .select('id, slug, name, description, city, instagram, tiktok, facebook, website, whatsapp_phone')
    .eq('slug', slug)
    .single()
  if (!studio) notFound()

  const [{ data: links }, { data: pageConfig }] = await Promise.all([
    admin
      .from('studio_links')
      .select('id, label, subtitle, url, icon, color')
      .eq('studio_id', studio.id)
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
    admin.from('studio_link_page').select('*').eq('studio_id', studio.id).maybeSingle(),
  ])

  const config: LinkPageConfig = {
    profilePhotoUrl: pageConfig?.profile_photo_url ?? null,
    coverPhotoUrl: pageConfig?.cover_photo_url ?? null,
    displayName: pageConfig?.display_name ?? null,
    bio: pageConfig?.bio ?? studio.description ?? null,
    tagline: pageConfig?.tagline ?? null,
    badgeLabel: pageConfig?.badge_label ?? null,
    locationLabel: pageConfig?.location_label ?? studio.city ?? null,
    template: (pageConfig?.template as TemplateKey) ?? 'dark',
    theme:
      pageConfig?.theme && Object.keys(pageConfig.theme as object).length > 0
        ? (pageConfig.theme as LinkPageTheme)
        : DEFAULT_THEME,
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isOwner = false
  if (user) {
    const { data: artist } = await supabase
      .from('artists')
      .select('role')
      .eq('user_id', user.id)
      .eq('studio_id', studio.id)
      .maybeSingle()
    isOwner = artist?.role === 'owner'
  }

  return (
    <LinkTreePage
      slug={studio.slug}
      studioName={studio.name}
      instagram={studio.instagram}
      tiktok={studio.tiktok}
      facebook={studio.facebook}
      website={studio.website}
      whatsapp={studio.whatsapp_phone}
      links={links ?? []}
      config={config}
      isOwner={isOwner}
    />
  )
}
