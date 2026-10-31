import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { listStencils } from '@/lib/stencil/store'
import { PageHeader } from '@/components/shared/page-header'
import { StencilStudio } from '@/components/stencil/stencil-studio'

export const metadata = { title: 'Stencils · Crisbo Tattoo' }

/** Generador de stencils con IA: foto o diseño → línea lista para imprimir o pasar a Procreate. */
export default async function StencilPage() {
  const studio = await getCurrentStudio()
  if (!studio) redirect('/login')
  const history = await listStencils(createAdminClient(), studio.id)
  return (
    <div className="space-y-6">
      <PageHeader title="Stencils" description="Sube una foto o un diseño y la IA lo convierte en stencil listo para imprimir." />
      <StencilStudio initialHistory={history} />
    </div>
  )
}
