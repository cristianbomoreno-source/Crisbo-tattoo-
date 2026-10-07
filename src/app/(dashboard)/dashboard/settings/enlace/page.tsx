import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Paintbrush } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { EnlaceForm } from '@/components/settings/enlace-form'
import { StudioLinksPanel } from '@/components/settings/studio-links-panel'
import { listStudioLinks } from '@/actions/studio-links'

export default async function EnlaceSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const linksResult = await listStudioLinks()

  return (
    <div>
      <EnlaceForm initialSlug={studio.slug} />
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/dashboard/settings/enlace/personalizar"
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Paintbrush className="size-4" />
          Personalizar Mi Link
        </Link>
        <StudioLinksPanel slug={studio.slug} initialLinks={linksResult.success ? linksResult.data : []} />
      </div>
    </div>
  )
}
