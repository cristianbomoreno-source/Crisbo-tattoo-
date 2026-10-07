import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getLinkPageConfig } from '@/actions/link-page'
import { listStudioLinks } from '@/actions/studio-links'
import { LinkPageCustomizer } from '@/components/settings/link-page/customizer'

export default async function PersonalizarLinkPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const [configResult, linksResult] = await Promise.all([getLinkPageConfig(), listStudioLinks()])
  if (!configResult.success) redirect('/dashboard/settings/enlace')

  return (
    <LinkPageCustomizer
      slug={studio.slug}
      studioName={studio.name}
      socials={{
        instagram: studio.instagram,
        tiktok: studio.tiktok,
        facebook: studio.facebook,
        website: studio.website,
        whatsapp: studio.whatsappPhone,
      }}
      initialConfig={configResult.data}
      initialLinks={linksResult.success ? linksResult.data : []}
    />
  )
}
