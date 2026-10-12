import { createClient } from '@/lib/supabase/server'
import { listPlatformAdmins, listPlatformSignups, listStudiosForFeatures } from '@/actions/platform-admin'
import { StudioFeaturesPanel } from '@/components/admin/studio-features-panel'
import { ManageAdmins } from '@/components/admin/manage-admins'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [adminsResult, signupsResult, studiosResult] = await Promise.all([
    listPlatformAdmins(),
    listPlatformSignups(),
    listStudiosForFeatures(),
  ])

  const admins = adminsResult.success ? adminsResult.data : []
  const signups = signupsResult.success ? signupsResult.data : []
  const studios = studiosResult.success ? studiosResult.data : []

  return (
    <div className="space-y-8">
      <h1 className="font-title font-bold text-3xl leading-none">Panel de plataforma</h1>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title font-bold text-lg leading-none">Módulos por cuenta</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Activa o desactiva qué puede usar cada estudio/cuenta. Al apagar uno, esa cuenta ve un aviso de
          «disponible más adelante por suscripción» al intentar entrar.
        </p>
        <StudioFeaturesPanel studios={studios} />
      </section>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title font-bold text-lg leading-none">Clientes de Crisbo Tattoo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Historial de cuentas creadas: correo/usuario, método y dispositivo.
        </p>
        {signups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay cuentas registradas.</p>
        ) : (
          <div className="space-y-1.5">
            {signups.map((s) => (
              <div key={s.userId} className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5">
                <span className="min-w-0 truncate text-sm">
                  {s.username ? `@${s.username}` : (s.email ?? s.userId)}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>{s.authProvider === 'google' ? 'Google' : 'Usuario/contraseña'}</span>
                  <span>·</span>
                  <span>{s.device}</span>
                  <span>·</span>
                  <span>{new Date(s.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title font-bold text-lg leading-none">Administradores</h2>
        <ManageAdmins admins={admins} myUserId={user?.id ?? ''} />
      </section>
    </div>
  )
}
