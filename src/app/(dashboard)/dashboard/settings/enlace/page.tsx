import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getLinkPageConfig } from '@/actions/link-page'
import { listStudioLinks } from '@/actions/studio-links'
import { mainStudioId } from '@/lib/link-page/load'
import { LinkPageEditor } from '@/components/settings/link-page/link-page-editor'

/** Estudio → Página de links: editor único con vista previa real (ver link-page-editor.tsx). */
export default async function EnlaceSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const [configResult, linksResult] = await Promise.all([getLinkPageConfig(), listStudioLinks()])
  if (!configResult.success) redirect('/dashboard/settings')

  return (
    <LinkPageEditor
      studio={{
        slug: studio.slug,
        name: studio.name,
        logoUrl: studio.logoUrl,
        mapsUrl: studio.mapsUrl ?? null,
        instagram: studio.instagram,
        tiktok: studio.tiktok,
        facebook: studio.facebook,
        website: studio.website,
        whatsapp: studio.whatsappPhone,
      }}
      publicPath={studio.id === mainStudioId() ? '/redes' : `/l/${studio.slug}`}
      initialConfig={configResult.data}
      initialLinks={linksResult.success ? linksResult.data : []}
    />
  )
}
