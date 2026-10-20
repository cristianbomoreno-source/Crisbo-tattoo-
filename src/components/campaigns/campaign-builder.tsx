'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, ImagePlus, Loader2, Megaphone, Search, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cop } from '@/lib/projects/metrics'
import {
  createCampaign,
  getCampaignAudience,
  uploadCampaignImage,
  type CreateCampaignInput,
} from '@/actions/custom-campaigns'
import {
  COMODIN,
  COMODIN_BUTTONS,
  COST_PER_MESSAGE,
  CUSTOM_FOOTER,
  INTEREST_NO,
  INTEREST_YES,
  bodyFromDraft,
  renderBody,
  sanitizeParam,
  type AudienceFilter,
  type AudienceRow,
  type TemplateInfo,
} from '@/lib/campaigns/custom'

type Mode = CreateCampaignInput['mode']

const TEMPLATE_STATUS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprobada', className: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300' },
  PENDING: { label: 'En revisión', className: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
  REJECTED: { label: 'Rechazada', className: 'bg-destructive/15 text-destructive' },
  MISSING: { label: 'Creándose', className: 'bg-muted text-muted-foreground' },
}

const SEGMENTS: { key: AudienceFilter['segment']; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'tatuados', label: 'Ya se tatuaron' },
  { key: 'inactivos', label: 'No vuelven hace…' },
  { key: 'sin_visitas', label: 'Nunca se han tatuado' },
  { key: 'etapa', label: 'Por etapa en Mensajes' },
]
const STAGES: { key: NonNullable<AudienceFilter['stage']>; label: string }[] = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'cotizando', label: 'Cotizando' },
  { key: 'abono', label: 'Abono' },
  { key: 'agendado', label: 'Agendado' },
  { key: 'perdido', label: 'Perdido' },
]

const input =
  'w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** "Crear campaña": mensaje (comodín, aprobada o nueva) → a quién → cuándo. */
export function CampaignBuilder({ templates, error }: { templates: TemplateInfo[]; error: string | null }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<Mode>('comodin')
  const [message, setMessage] = useState('')
  const [templateName, setTemplateName] = useState<string | null>(null)
  const [params, setParams] = useState<string[]>([])
  const [draft, setDraft] = useState('Hola {nombre}, te habla Crisbo 👋\n\n')
  const [footer, setFooter] = useState(CUSTOM_FOOTER)
  const [buttons, setButtons] = useState<string[]>([INTEREST_YES, INTEREST_NO, ''])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [filter, setFilter] = useState<AudienceFilter>({ segment: 'todos', months: 6, stage: 'cotizando', excludeBooked: true, excludeRecent: true })
  const [audience, setAudience] = useState<AudienceRow[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [later, setLater] = useState(false)
  const [when, setWhen] = useState('')
  const [submitting, startSubmit] = useTransition()

  const usable = templates.filter((t) => t.compatible && !t.name.startsWith('campana_comodin'))
  const approved = usable.filter((t) => t.status === 'APPROVED')
  const chosen = templates.find((t) => t.name === templateName) ?? null
  const comodin = templates.find((t) => t.name === (imageUrl ? COMODIN.image.name : COMODIN.text.name))

  // Audiencia: se recarga al cambiar el filtro (todos quedan marcados).
  const filterKey = JSON.stringify(filter)
  useEffect(() => {
    let alive = true
    getCampaignAudience(JSON.parse(filterKey) as AudienceFilter).then((res) => {
      if (!alive) return
      if (!res.success) return void toast.error(res.error.message)
      setAudience(res.data)
      setSelected(new Set(res.data.map((r) => r.clientId)))
    })
    return () => {
      alive = false
    }
  }, [filterKey])

  const visibleAudience = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = audience ?? []
    return needle ? list.filter((r) => r.name.toLowerCase().includes(needle) || r.phone.includes(needle)) : list
  }, [audience, search])

  async function onPickImage(file: File | undefined) {
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await uploadCampaignImage(form)
    setUploading(false)
    if (!res.success) return void toast.error(res.error.message)
    setImageUrl(res.data.url)
  }

  // Vista previa del mensaje como le llega al cliente ("Laura" de ejemplo).
  const preview = useMemo(() => {
    if (mode === 'comodin') {
      return {
        body: renderBody(COMODIN.text.body, ['Laura', sanitizeParam(message) || '…tu mensaje…']),
        footer: CUSTOM_FOOTER,
        buttons: COMODIN_BUTTONS,
        image: !!imageUrl,
      }
    }
    if (mode === 'existing') {
      if (!chosen) return null
      return {
        body: renderBody(chosen.body, ['Laura', ...params.map((p, i) => sanitizeParam(p) || `{{${i + 2}}}`)]),
        footer: chosen.footer,
        buttons: chosen.buttons,
        image: chosen.header === 'IMAGE',
      }
    }
    return {
      body: renderBody(bodyFromDraft(draft), ['Laura']),
      footer: footer.trim() || null,
      buttons: buttons.map((b) => b.trim()).filter(Boolean),
      image: !!imageUrl,
    }
  }, [mode, message, chosen, params, draft, footer, buttons, imageUrl])

  const count = selected.size
  const needsImage = mode === 'existing' && chosen?.header === 'IMAGE'

  function submit() {
    if (name.trim().length < 3) return void toast.error('Ponle un nombre a la campaña')
    if (mode === 'existing' && !chosen) return void toast.error('Elige una plantilla')
    if (needsImage && !imageUrl) return void toast.error('Esta plantilla lleva imagen: súbela')
    if (!count) return void toast.error('Elige al menos un cliente')
    if (later && !when) return void toast.error('Elige fecha y hora')
    const scheduledAt = later ? new Date(`${when}:00-05:00`).toISOString() : null
    if (scheduledAt && new Date(scheduledAt) < new Date()) return void toast.error('Esa hora ya pasó')
    startSubmit(async () => {
      const res = await createCampaign({
        name,
        mode,
        message,
        templateName: chosen?.name,
        params,
        draft,
        footer,
        buttons,
        imageUrl,
        clientIds: [...selected],
        scheduledAt,
      })
      if (!res.success) return void toast.error(res.error.message)
      toast.success(
        res.data.status === 'awaiting_template'
          ? 'Plantilla enviada a revisión de Meta. Te aviso cuando la aprueben.'
          : later
            ? 'Campaña programada'
            : 'Campaña en camino 🚀'
      )
      router.push(`/dashboard/inbox/campaigns/c/${res.data.id}`)
    })
  }

  const willWait = mode === 'new' || (mode === 'comodin' && comodin?.status !== 'APPROVED') || (mode === 'existing' && chosen?.status === 'PENDING')

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox/campaigns"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
          aria-label="Volver a campañas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold">Crear campaña</h2>
          <p className="text-xs text-muted-foreground">Mensaje → a quién → cuándo</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Step n={1} title="Nombre">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej.: Promo línea fina noviembre"
            maxLength={60}
            className={cn(input, 'h-11')}
          />
          <p className="text-xs text-muted-foreground">Solo lo ves tú; aparece en el chat de cada cliente como encabezado.</p>
        </Step>

        <Step n={2} title="Mensaje">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-xs font-medium">
            {(
              [
                ['comodin', 'Comodín'],
                ['existing', 'Plantilla aprobada'],
                ['new', 'Nueva plantilla'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={cn('rounded-lg px-2 py-2', mode === k ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'comodin' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Escribe el mensaje y sale de una, sin esperar a Meta. Va dentro de &quot;Hola {'{nombre}'}, te habla Crisbo 👋 …
                Si te interesa, respóndeme por aquí&quot;, con los botones <b>{INTEREST_YES}</b> y <b>{INTEREST_NO}</b>. Debe ser
                un solo párrafo.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.replace(/\n/g, ' '))}
                rows={4}
                maxLength={900}
                placeholder="Ej.: Este mes tengo 10 cupos para tatuajes de línea fina desde $150.000 con retoque incluido, solo hasta el 30 de noviembre."
                className={cn(input, 'py-2.5')}
              />
              <p className="text-right text-[11px] text-muted-foreground">{message.length}/900</p>
              {comodin && comodin.status !== 'APPROVED' && (
                <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  La plantilla comodín {imageUrl ? 'con imagen' : 'de texto'} está{' '}
                  {(TEMPLATE_STATUS[comodin.status] ?? { label: comodin.status }).label.toLowerCase()} en Meta. Puedes crear la
                  campaña igual: sale apenas la aprueben.
                </p>
              )}
            </div>
          )}

          {mode === 'existing' && (
            <div className="space-y-2">
              {approved.length === 0 && <p className="text-sm text-muted-foreground">No hay plantillas aprobadas que se puedan usar.</p>}
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {usable.map((t) => {
                  const st = TEMPLATE_STATUS[t.status] ?? { label: t.status, className: 'bg-muted text-muted-foreground' }
                  const disabled = t.status !== 'APPROVED' && t.status !== 'PENDING'
                  return (
                    <li key={`${t.name}-${t.language}`}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setTemplateName(t.name)
                          setParams(Array.from({ length: Math.max(t.paramCount - 1, 0) }, () => ''))
                        }}
                        className={cn(
                          'w-full space-y-1 rounded-xl border p-3 text-left text-xs disabled:opacity-40',
                          templateName === t.name ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-mono font-medium">{t.name}</span>
                          {t.header === 'IMAGE' && <span className="text-muted-foreground">🖼️</span>}
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px]', st.className)}>{st.label}</span>
                        </span>
                        <span className="line-clamp-2 block text-muted-foreground">{t.body}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {chosen && params.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{'{{1}}'} es el nombre del cliente. Llena los demás espacios:</p>
                  {params.map((p, i) => (
                    <input
                      key={i}
                      value={p}
                      onChange={(e) => setParams((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`{{${i + 2}}}`}
                      className={cn(input, 'h-10')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'new' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Se manda a revisión de Meta al crear la campaña (tarda de minutos a horas) y sale sola cuando la aprueben.
                Escribe <b>{'{nombre}'}</b> donde va el nombre del cliente; no puede ir ni al principio ni al final.
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={7}
                maxLength={1000}
                className={cn(input, 'py-2.5')}
              />
              <button
                type="button"
                onClick={() => setDraft((d) => `${d}{nombre}`)}
                className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs hover:bg-accent"
              >
                <Sparkles className="size-3" /> Insertar {'{nombre}'}
              </button>
              <input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Pie (letra pequeña)" maxLength={60} className={cn(input, 'h-10')} />
              <div className="grid grid-cols-3 gap-2">
                {buttons.map((b, i) => (
                  <input
                    key={i}
                    value={b}
                    onChange={(e) => setButtons((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Botón ${i + 1}`}
                    maxLength={25}
                    className={cn(input, 'h-10 px-2.5 text-xs')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Imagen: opcional en comodín y nueva; obligatoria si la plantilla elegida la lleva. */}
          {(mode !== 'existing' || needsImage) && (
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-16 w-28 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-background shadow ring-1 ring-border"
                    aria-label="Quitar imagen"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs hover:bg-accent/50"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {needsImage ? 'Subir imagen (obligatoria)' : 'Agregar imagen (opcional)'}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
              <p className="text-[11px] text-muted-foreground">JPG o PNG, máx. 5 MB. Ideal horizontal (1200×628).</p>
            </div>
          )}

          {preview && (
            <div className="rounded-2xl bg-[#0b141a] p-3">
              <div className="ml-auto max-w-[85%] space-y-1.5 rounded-xl bg-[#202c33] p-2 text-[13px] text-[#e9edef]">
                {preview.image &&
                  (imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="w-full rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-24 place-items-center rounded-lg bg-white/10 text-xs text-white/60">Imagen</div>
                  ))}
                <p className="whitespace-pre-wrap">{preview.body}</p>
                {preview.footer && <p className="text-[11px] text-white/50">{preview.footer}</p>}
                {preview.buttons.map((b) => (
                  <p key={b} className="border-t border-white/10 pt-1.5 text-center text-[#53bdeb]">
                    {b}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Step>

        <Step n={3} title="A quién">
          <div className="flex flex-wrap gap-1.5">
            {SEGMENTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter((f) => ({ ...f, segment: s.key }))}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium',
                  filter.segment === s.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {filter.segment === 'inactivos' && (
            <label className="flex items-center gap-2 text-sm">
              Sin venir hace al menos
              <input
                type="number"
                min={1}
                max={60}
                value={filter.months ?? 6}
                onChange={(e) => setFilter((f) => ({ ...f, months: Math.max(1, Number(e.target.value) || 1) }))}
                className={cn(input, 'h-9 w-20')}
              />
              meses
            </label>
          )}
          {filter.segment === 'etapa' && (
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFilter((f) => ({ ...f, stage: s.key }))}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs',
                    filter.stage === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-1.5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filter.excludeBooked}
                onChange={(e) => setFilter((f) => ({ ...f, excludeBooked: e.target.checked }))}
                className="size-4 accent-[var(--primary)]"
              />
              Sacar a quien tiene cita próxima o se tatuó el último mes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filter.excludeRecent}
                onChange={(e) => setFilter((f) => ({ ...f, excludeRecent: e.target.checked }))}
                className="size-4 accent-[var(--primary)]"
              />
              Sacar a quien recibió una campaña en los últimos 7 días
            </label>
          </div>

          <div className="rounded-xl border border-border">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar"
                  className="h-8 w-full rounded-lg bg-muted/60 pr-2 pl-8 text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setSelected(new Set((audience ?? []).map((r) => r.clientId)))}
                className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10"
              >
                Todos
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg px-2 py-1 text-xs hover:bg-accent">
                Ninguno
              </button>
            </div>
            <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto">
              {audience === null && (
                <li className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Buscando clientes…
                </li>
              )}
              {visibleAudience.slice(0, 300).map((r) => {
                const on = selected.has(r.clientId)
                return (
                  <li key={r.clientId}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (on) next.delete(r.clientId)
                          else next.add(r.clientId)
                          return next
                        })
                      }
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/40"
                    >
                      <span
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded border',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                        )}
                      >
                        {on && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                      <span className="text-[11px] text-muted-foreground">{r.phone}</span>
                    </button>
                  </li>
                )
              })}
              {visibleAudience.length > 300 && (
                <li className="p-2 text-center text-[11px] text-muted-foreground">
                  y {visibleAudience.length - 300} más (usa el buscador para encontrarlos)
                </li>
              )}
              {audience?.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">Nadie cumple ese filtro.</li>}
            </ul>
          </div>
          <p className="text-sm">
            <b>{count}</b> personas seleccionadas · costo aprox. <b>{cop(count * COST_PER_MESSAGE)}</b>
          </p>
        </Step>

        <Step n={4} title="Cuándo">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs font-medium">
            <button type="button" onClick={() => setLater(false)} className={cn('rounded-lg py-2', !later ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              Enviar ahora
            </button>
            <button type="button" onClick={() => setLater(true)} className={cn('rounded-lg py-2', later ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              Programar
            </button>
          </div>
          {later && (
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={cn(input, 'h-11')} />
          )}
          <p className="text-xs text-muted-foreground">
            {willWait
              ? 'La plantilla necesita aprobación de Meta: la campaña sale apenas la aprueben (o a la hora programada, si es después).'
              : 'Sale por tandas de 250 cada 5 minutos. Te llega una notificación cuando termine.'}
          </p>
        </Step>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {mode === 'new' ? 'Enviar plantilla a revisión y crear campaña' : later ? 'Programar campaña' : `Enviar a ${count} personas`}
        </button>
      </div>
    </div>
  )
}
