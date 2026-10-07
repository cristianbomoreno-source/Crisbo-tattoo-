import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StudioInviteResponse } from '@/components/onboarding/studio-invite-response'

export default async function StudioInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cliente admin: en este punto (usuario recién llegado, 0 cuentas OFINK)
  // la invitación puede todavía no tener `invited_user_id` vinculado — la
  // policy de studio_invitations no dejaría verla con el cliente normal.
  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from('studio_invitations')
    .select('id, status, studio:studios(name)')
    .eq('id', id)
    .maybeSingle()

  if (!invitation || invitation.status !== 'pending') redirect('/onboarding/choose')

  const studioName = (invitation.studio as unknown as { name: string } | null)?.name ?? 'Un estudio'

  return <StudioInviteResponse invitationId={id} studioName={studioName} />
}
