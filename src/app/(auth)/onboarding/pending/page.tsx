import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyJoinRequestStatus } from '@/actions/team'
import { PendingApproval } from '@/components/onboarding/pending-approval'

export default async function PendingApprovalPage() {
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

  const result = await getMyJoinRequestStatus()
  const request = result.success ? result.data : null
  if (!request) redirect('/onboarding/choose')

  return <PendingApproval studioName={request.studioName} rejected={request.status === 'rejected'} />
}
