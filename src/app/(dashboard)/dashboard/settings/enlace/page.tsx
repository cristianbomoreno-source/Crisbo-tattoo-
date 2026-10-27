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
          className="mt-6 flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[1.0625rem] font-semibold text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <Paintbrush className="size-4" />
          Cambiar el diseño
        </Link>
        <StudioLinksPanel slug={studio.slug} initialLinks={linksResult.success ? linksResult.data : []} />
      </div>
    </div>
  )
}
