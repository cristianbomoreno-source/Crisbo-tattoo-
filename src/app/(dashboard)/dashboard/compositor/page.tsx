import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { listCompositions } from '@/lib/compositor/store'
import { PageHeader } from '@/components/shared/page-header'
import { CompositorStudio } from '@/components/compositor/compositor-studio'

export const metadata = { title: 'Compositor · Crisbo Tattoo' }

/** Compositor con IA: foto de un tatuaje → diseño plano separado en capas (fondo y cada elemento) para Procreate. */
export default async function CompositorPage() {
  const studio = await getCurrentStudio()
  if (!studio) redirect('/login')
  const history = await listCompositions(createAdminClient(), studio.id)
  return (
    <div className="space-y-6">
      <PageHeader title="Compositor" description="Sube un tatuaje de referencia y la IA separa cada elemento en su propia capa para editarlo en Procreate." />
      <CompositorStudio initialHistory={history} />
    </div>
  )
}
