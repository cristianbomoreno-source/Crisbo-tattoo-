import { redirect } from 'next/navigation'
import { AppShell } from '@/components/shared/app-shell'
import { getCurrentStudio } from '@/queries/studio'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Verificar autenticación
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const studio = await getCurrentStudio()

  // Si no hay estudio asociado, también redirigir
  if (!studio) {
    redirect('/login')
  }

  const brand = {
    name: studio.name,
    logoUrl: studio.logoUrl,
    isStudioOwner: studio.accountKind === 'estudio' && studio.role === 'owner',
  }

  return (
    <AppShell studio={brand}>
      <main className="flex-1 overflow-x-hidden p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top))] sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:p-8 lg:pt-8 lg:pb-8">
        {children}
      </main>
    </AppShell>
  )
}
