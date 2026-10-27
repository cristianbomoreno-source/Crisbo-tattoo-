import { redirect } from 'next/navigation'

/** El bot de solicitudes (/t/{slug}) se eliminó a pedido (oct 2026): los
 * enlaces viejos que circulan llevan a la página de links del estudio. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/l/${slug}`)
}
