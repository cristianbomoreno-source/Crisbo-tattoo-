import { createClient } from '@/lib/supabase/server'
import { getFeedbackOverview, listPlatformAdmins, listPlatformSignups, listStudiosForFeatures } from '@/actions/platform-admin'
import { StudioFeaturesPanel } from '@/components/admin/studio-features-panel'
import { ManageAdmins } from '@/components/admin/manage-admins'
import { Star, Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function AverageBar({ average }: { average: number }) {
  const pct = (average / 5) * 100
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
      <div
        className={cn('h-full rounded-full', average === 0 ? 'bg-transparent' : average < 3 ? 'bg-red-500' : average < 4 ? 'bg-amber-400' : 'bg-primary')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [overviewResult, adminsResult, signupsResult, studiosResult] = await Promise.all([
    getFeedbackOverview(),
    listPlatformAdmins(),
    listPlatformSignups(),
    listStudiosForFeatures(),
  ])

  if (!overviewResult.success) {
    return <p className="text-sm text-destructive">{overviewResult.error.message}</p>
  }
  const data = overviewResult.data
  const admins = adminsResult.success ? adminsResult.data : []
  const signups = signupsResult.success ? signupsResult.data : []
  const studios = studiosResult.success ? studiosResult.data : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-title text-3xl uppercase leading-none">Feedback de tatuadores</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Calificaciones que dejaron los tatuadores/estudios en Ajustes → Mensaje de OFINK.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Star} value={data.overallAverage ? data.overallAverage.toFixed(1) : '—'} label="Promedio general" />
        <StatCard icon={MessageSquare} value={String(data.totalResponses)} label="Calificaciones recibidas" />
        <StatCard icon={Users} value={String(data.respondingStudios)} label="Estudios/cuentas que respondieron" />
      </div>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title text-lg uppercase leading-none">Promedio por función</h2>
        <div className="space-y-3">
          {data.byFeature.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{f.sectionTitle} · </span>
                  {f.label}
                </span>
                <span className="shrink-0 tabular-nums">
                  {f.count > 0 ? `${f.average.toFixed(1)} ★ (${f.count})` : 'Sin datos'}
                </span>
              </div>
              <AverageBar average={f.average} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title text-lg uppercase leading-none">Comentarios</h2>
        {data.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>
        ) : (
          <div className="space-y-3">
            {data.comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{c.featureLabel}</p>
                  <span className="shrink-0 text-xs text-primary">{'★'.repeat(c.rating)}</span>
                </div>
                <p className="mt-1.5 text-sm text-foreground/90">{c.comment}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {c.studioName ?? 'Estudio sin nombre'}
                  {c.artistName ? ` · ${c.artistName}` : ''} ·{' '}
                  {new Date(c.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title text-lg uppercase leading-none">Módulos por cuenta</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Activa o desactiva qué puede usar cada estudio/cuenta. Al apagar uno, esa cuenta ve un aviso de
          «disponible más adelante por suscripción» al intentar entrar.
        </p>
        <StudioFeaturesPanel studios={studios} />
      </section>

      <section className="rounded-[1.75rem] bg-card p-5">
        <h2 className="mb-4 font-title text-lg uppercase leading-none">Clientes de OFINK</h2>
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
        <h2 className="mb-4 font-title text-lg uppercase leading-none">Administradores</h2>
        <ManageAdmins admins={admins} myUserId={user?.id ?? ''} />
      </section>
    </div>
  )
}
