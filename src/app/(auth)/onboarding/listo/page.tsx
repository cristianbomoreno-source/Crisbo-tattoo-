import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CelebrationScreen } from '@/components/onboarding/celebration-screen'

export default async function OnboardingListoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <CelebrationScreen
      title="¡Bienvenido a OFINK!"
      subtitle="Tu estudio digital ya está listo."
      items={['Perfil creado', 'Agenda configurada', 'Especialidades guardadas', 'Políticas guardadas']}
      cta="Entrar a OFINK"
      href="/dashboard"
    />
  )
}
