import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { loadMarketingPlan } from '@/lib/marketing/store'
import { todayKey } from '@/lib/calendar/utils'
import { MarketingApp } from '@/components/marketing/marketing-app'
import { MarketingLogin } from '@/components/marketing/marketing-login'

export const dynamic = 'force-dynamic'

/**
 * Estrategia de marketing del estudio. Pide usuario y contraseña (la cuenta
 * de la app) y solo la ve el dueño del estudio.
 */
export default async function MarketingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <MarketingLogin />

  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="large-title">Marketing</h1>
          <p className="text-muted-foreground">Esta página es solo para el dueño del estudio.</p>
        </div>
      </main>
    )
  }

  const admin = createAdminClient()
  const [plan, galleryRes] = await Promise.all([
    loadMarketingPlan(admin, studio.id),
    admin.from('gallery').select('url').eq('studio_id', studio.id).order('created_at', { ascending: false }).limit(150),
  ])
  const gallery = [...new Set((galleryRes.data ?? []).map((g) => g.url as string).filter(Boolean))]

  return <MarketingApp initialPlan={plan} gallery={gallery} today={todayKey()} />
}
