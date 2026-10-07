import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { CelebrationScreen } from '@/components/onboarding/celebration-screen'

export default async function EstudioListoPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/onboarding/choose')

  return (
    <CelebrationScreen
      title="¡Estudio creado!"
      subtitle="Tu estudio ya está listo para gestionarse como un profesional."
      items={[
        'Estudio creado',
        'Código de invitación generado',
        'Agenda configurada',
        'Políticas establecidas',
        'Listo para agregar artistas',
      ]}
      cta="Ir al Dashboard"
      href="/dashboard"
    />
  )
}
