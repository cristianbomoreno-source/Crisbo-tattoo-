import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppleLinkPage } from '@/components/studio/apple-link-page'
import { loadPublicLinkPage, mainStudioId } from '@/lib/link-page/load'

export const metadata: Metadata = {
  title: 'Crisbo Tattoo · Redes',
  description: 'Instagram, WhatsApp, ubicación y todos los enlaces de Crisbo Tattoo.',
}

/** crisbotattoo.com/redes: la página de links del estudio principal. */
export default async function RedesPage() {
  const id = mainStudioId()
  const page = id ? await loadPublicLinkPage({ id }) : null
  if (!page) notFound()
  return <AppleLinkPage page={page} />
}
