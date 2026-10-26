'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, PlugZap, Unplug } from 'lucide-react'

import { updateRevenueGoal, saveManualSocialMonth, saveMetaToken, disconnectMeta } from '@/actions/social'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GoogleMonth, TiktokMonth, ManualNetwork } from '@/lib/social/store'

const digits = (s: string) => s.replace(/\D/g, '')
const toNum = (s: string) => (digits(s) === '' ? null : Number(digits(s)))
const fmt = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('es-CO'))

/** Meta de ingresos del mes, editable en la misma tarjeta. */
export function RevenueGoalEditor({ goal }: { goal: number | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(fmt(goal))
  const [pending, start] = useTransition()

  function save() {
    start(async () => {
      const res = await updateRevenueGoal({ revenueGoal: toNum(value) })
      if (!res.success) return void toast.error(res.error.message)
      toast.success('Meta guardada')
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Pencil className="size-3" aria-hidden /> {goal ? 'Editar meta' : 'Poner meta'}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        inputMode="numeric"
        placeholder="Ej. 2.500.000"
        value={value}
        onChange={(e) => setValue(fmt(toNum(e.target.value)))}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="h-8 max-w-40 text-sm"
        aria-label="Meta de ingresos del mes"
      />
      <Button size="sm" onClick={save} disabled={pending}>
        <Check className="size-4" aria-hidden /> Guardar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
        Cancelar
      </Button>
    </div>
  )
}

const FIELDS: Record<ManualNetwork, { key: string; label: string; hint: string }[]> = {
  tiktok: [
    { key: 'views', label: 'Vistas de videos', hint: 'TikTok Studio → Análisis → Resumen' },
    { key: 'profileViews', label: 'Vistas del perfil', hint: 'Mismo resumen' },
    { key: 'followers', label: 'Seguidores al cierre', hint: 'Pestaña Seguidores' },
  ],
  google: [
    { key: 'views', label: 'Vistas del perfil', hint: 'Perfil de Google → Rendimiento' },
    { key: 'directions', label: 'Solicitudes de ruta', hint: 'Rendimiento → Interacciones' },
    { key: 'calls', label: 'Llamadas', hint: 'Rendimiento → Interacciones' },
    { key: 'webClicks', label: 'Clics al sitio web', hint: 'Rendimiento → Interacciones' },
    { key: 'reviews', label: 'Reseñas totales', hint: 'El número junto a las estrellas' },
  ],
}

/** Cifras mensuales de TikTok y Google, copiadas a mano de cada app. */
export function ManualMonthForm({
  months,
  saved,
}: {
  months: { key: string; label: string }[]
  saved: { tiktok: Record<string, TiktokMonth>; google: Record<string, GoogleMonth> }
}) {
  const router = useRouter()
  const [network, setNetwork] = useState<ManualNetwork>('google')
  const [month, setMonth] = useState(months[0]?.key ?? '')
  const current = (saved[network] as Record<string, Record<string, number | null>>)[month] ?? {}
  const [values, setValues] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const valueOf = (key: string) => values[`${network}:${month}:${key}`] ?? fmt(current[key])

  function save() {
    const out = Object.fromEntries(FIELDS[network].map((f) => [f.key, toNum(valueOf(f.key))]))
    start(async () => {
      const res = await saveManualSocialMonth({ network, month, values: out })
      if (!res.success) return void toast.error(res.error.message)
      toast.success('Datos guardados')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(['google', 'tiktok'] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNetwork(n)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${network === n ? 'bg-primary text-primary-foreground ring-primary' : 'ring-border'}`}
          >
            {n === 'google' ? 'Google Maps' : 'TikTok'}
          </button>
        ))}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="ml-auto rounded-full bg-transparent px-3 py-1 text-xs capitalize ring-1 ring-border"
          aria-label="Mes"
        >
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS[network].map((f) => (
          <label key={f.key} className="space-y-1">
            <span className="block text-xs font-medium">{f.label}</span>
            <Input
              inputMode="numeric"
              value={valueOf(f.key)}
              onChange={(e) => setValues((v) => ({ ...v, [`${network}:${month}:${f.key}`]: fmt(toNum(e.target.value)) }))}
              className="h-9"
            />
            <span className="block text-[11px] text-muted-foreground">{f.hint}</span>
          </label>
        ))}
      </div>
      <Button size="sm" onClick={save} disabled={pending}>
        <Check className="size-4" aria-hidden /> Guardar {network === 'google' ? 'Google' : 'TikTok'}
      </Button>
    </div>
  )
}

/** Pegar el token de Meta (usuario del sistema). Nunca se vuelve a mostrar. */
export function MetaConnectForm({ connected, savedAt }: { connected: boolean; savedAt: string | null }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [pending, start] = useTransition()

  function save() {
    start(async () => {
      const res = await saveMetaToken({ token })
      if (!res.success) return void toast.error(res.error.message)
      setToken('')
      if (res.data.missing.length) {
        toast.warning(`Conectado como ${res.data.name}, pero faltan permisos: ${res.data.missing.join(', ')}`)
      } else {
        toast.success(`Conectado como ${res.data.name}`)
      }
      router.refresh()
    })
  }

  function disconnect() {
    start(async () => {
      const res = await disconnectMeta()
      if (!res.success) return void toast.error(res.error.message)
      toast.success('Facebook desconectado')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {connected && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-income/15 px-2.5 py-1 font-medium text-income">
            Conectado{savedAt ? ` el ${new Date(savedAt).toLocaleDateString('es-CO')}` : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={disconnect} disabled={pending}>
            <Unplug className="size-4" aria-hidden /> Desconectar
          </Button>
        </div>
      )}
      <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>Meta Business → Configuración → Usuarios del sistema → <b>Employee</b>.</li>
        <li>Asignar activos: la página <b>Crisbo.Tattoo</b> (Estadísticas) y tu cuenta publicitaria (Ver rendimiento).</li>
        <li>
          Generar token → app <b>Diego Neira barberia</b>, vencimiento <b>Nunca</b>, permisos <code>ads_read</code>,{' '}
          <code>pages_read_engagement</code>, <code>read_insights</code> y los de WhatsApp que ya tenía.
        </li>
        <li>Pégalo aquí. No lo compartas por chat.</li>
      </ol>
      <div className="flex gap-2">
        <Input
          type="password"
          autoComplete="off"
          placeholder={connected ? 'Pegar un token nuevo para reemplazarlo' : 'Pega aquí el token (EAA…)'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="h-9"
          aria-label="Token de Meta"
        />
        <Button size="sm" onClick={save} disabled={pending || token.trim().length < 50} className="h-9">
          <PlugZap className="size-4" aria-hidden /> Conectar
        </Button>
      </div>
    </div>
  )
}
