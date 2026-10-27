import { notFound } from 'next/navigation'
import { AppleLinkPage } from '@/components/studio/apple-link-page'
import { loadPublicLinkPage } from '@/lib/link-page/load'

/** Página de links de cualquier estudio (el principal también está en /redes). */
export default async function StudioLinkTreePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await loadPublicLinkPage({ slug })
  if (!page) notFound()
  return <AppleLinkPage page={page} />
}
