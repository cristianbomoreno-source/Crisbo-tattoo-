import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyJoinRequestStatus } from '@/actions/team'
import { ChooseAccountType } from '@/components/onboarding/choose-account-type'

/**
 * Primera pantalla tras el registro: "¿Cómo quieres usar OFINK?". Reemplaza
 * el salto directo a `/onboarding` (paso 1 del wizard de perfil) para las
 * cuentas nuevas — ver `docs` en el spec de evolución de arquitectura.
 * "Independiente" y "Crear un estudio" llevan al wizard de siempre
 * (`completeProfileStep` ya crea studio+artist owner). "Trabajo en un
 * estudio" lleva a `/onboarding/join`.
 */
export default async function ChooseAccountTypePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingArtist) redirect('/dashboard')

  const requestResult = await getMyJoinRequestStatus()
  if (requestResult.success && requestResult.data?.status === 'pending') {
    redirect('/onboarding/pending')
  }

  return <ChooseAccountType />
}
