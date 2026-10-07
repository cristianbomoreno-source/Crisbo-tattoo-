import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JoinStudioFlow } from '@/components/onboarding/join-studio-flow'

export default async function JoinStudioPage() {
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

  return <JoinStudioFlow defaultName={(user.user_metadata['name'] as string | undefined) ?? ''} />
}
