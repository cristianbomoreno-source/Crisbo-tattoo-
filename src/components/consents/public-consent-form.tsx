'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  IdCard,
  MapPin,
  PenLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SignaturePad } from '@/components/consents/signature-pad'
import { BodyMapExplorer } from '@/components/intake/body-map-explorer'
import type { MapGender } from '@/lib/body-map-assets'
import { submitSignedConsentAction } from '@/actions/consent-links'
import { HEALTH, ACCEPT, healthDetailKey } from '@/lib/consents/consent-fields'
import { DOCUMENT_TYPES } from '@/lib/validations/consent-links'
import { cop } from '@/lib/projects/metrics'
import { formatTime } from '@/lib/calendar/utils'
import type { PublicConsentClient, PublicConsentProject } from '@/queries/consent-links'

type FormValue = string | boolean

const STEPS = [
  { id: 'proyecto', label: 'Proyecto', icon: Sparkles },
  { id: 'datos', label: 'Datos', icon: IdCard },
  { id: 'salud', label: 'Salud', icon: HeartPulse },
  { id: 'diseno', label: 'Diseño', icon: MapPin },
  { id: 'declaraciones', label: 'Declaraciones', icon: ClipboardList },
  { id: 'firma', label: 'Firma', icon: PenLine },
] as const

/** Edad calculada a partir de la fecha de nacimiento (YYYY-MM-DD). */
function calcAge(birthdate: string): string {
  if (!birthdate) return ''
  const b = new Date(`${birthdate}T00:00:00`)
  if (Number.isNaN(b.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

/** ISO (con hora) o YYYY-MM-DD → YYYY-MM-DD, para precargar un <input type="date">. */
function toDateInput(v: string | null): string {
  if (!v) return ''
  return v.slice(0, 10)
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

export function PublicConsentForm({
  token,
  studioName,
  client,
  project,
  templateContent,
}: {
  token: string
  studioName: string
  client: PublicConsentClient
  project: PublicConsentProject | null
  templateContent: string | null
}) {
  const { first, last } = splitName(client.name)

  const [f, setF] = React.useState<Record<string, FormValue>>(() => {
    const init: Record<string, FormValue> = {
      primer_nombre: first,
      apellido: last,
      tipo_documento: client.documentType ?? '',
      numero_documento: client.documentNumber ?? '',
      fecha_nacimiento: toDateInput(client.birthdate),
      telefono: client.phone ?? '',
      correo: client.email ?? '',
      direccion: client.address ?? '',
      confirma_diseno: false,
      zona: project?.bodyZone ?? '',
      descripcion_diseno: project?.description ?? '',
      autoriza_fotos: 'no',
    }
    for (const [k] of HEALTH) {
      init[k] = 'no'
      init[healthDetailKey(k)] = ''
    }
    for (const [k] of ACCEPT) init[k] = false
    return init
  })
  const set = (k: string, v: FormValue) => setF((prev) => ({ ...prev, [k]: v }))

  const [step, setStep] = React.useState(0)
  // Zona del cuerpo: si ya viene de la cotización (project.bodyZone), se
  // muestra fija con opción de "Cambiar zona"; si no, se abre directo el
  // explorador con fotos (mismo que usa el tatuador al cotizar).
  const [editingZone, setEditingZone] = React.useState(!project?.bodyZone)
  const [zoneGender, setZoneGender] = React.useState<MapGender>('Hombre')
  const [signature, setSignature] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const age = calcAge(f.fecha_nacimiento as string)

  // Validez de cada paso — habilita "Continuar" y pinta el check verde en
  // la barra de progreso apenas se cumple, sin esperar al envío final.
  const stepValid: boolean[] = [
    !project || f.confirma_diseno === true,
    ['primer_nombre', 'apellido', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'telefono', 'correo', 'direccion'].every(
      (k) => String(f[k] ?? '').trim().length > 0
    ) && /.+@.+\..+/.test(String(f.correo)),
    HEALTH.every(([k]) => f[k] !== 'si' || String(f[healthDetailKey(k)] ?? '').trim().length > 0),
    String(f.zona).trim().length > 0 && String(f.descripcion_diseno).trim().length > 0,
    ACCEPT.every(([k]) => f[k] === true),
    signature !== null,
  ]

  function goNext() {
    if (!stepValid[step]) {
      toast.error('Completa este paso antes de continuar')
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }
  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleSubmit() {
    if (!stepValid.every(Boolean)) {
      toast.error('Revisa que todos los pasos estén completos')
      return
    }
    if (!signature) {
      toast.error('Falta guardar la firma')
      return
    }
    setLoading(true)
    try {
      const result = await submitSignedConsentAction({
        token,
        ...f,
        edad: age,
        signature_data: signature,
        fecha_firma: new Date().toISOString(),
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setDone(true)
    } catch {
      toast.error('No se pudo enviar el consentimiento. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h1 className="mt-3 font-display text-xl font-medium uppercase">¡Listo!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu consentimiento quedó firmado. ¡Gracias!
        </p>
      </div>
    )
  }

  const yesno = (name: string, label: string, detailPrompt?: string) => {
    const val = f[name]
    return (
      <div className="rounded-xl border border-border/70 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{label}</span>
          <div className="flex shrink-0 gap-1">
            {(['no', 'si'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set(name, v)}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs font-medium uppercase transition-colors',
                  val === v
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {v === 'si' ? 'Sí' : 'No'}
              </button>
            ))}
          </div>
        </div>
        {val === 'si' && detailPrompt !== undefined && (
          <div className="mt-2.5 space-y-1">
            <Label htmlFor={`${name}_detalle`} className="text-xs text-muted-foreground">
              {detailPrompt}
            </Label>
            <Textarea
              id={`${name}_detalle`}
              rows={2}
              value={f[healthDetailKey(name)] as string}
              onChange={(e) => set(healthDetailKey(name), e.target.value)}
              required
            />
          </div>
        )}
      </div>
    )
  }

  const check = (name: string, label: string) => (
    <label className="flex items-start gap-2.5 rounded-xl border border-border/70 px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        checked={f[name] as boolean}
        onChange={(e) => set(name, e.target.checked)}
        className="mt-0.5 accent-primary"
      />
      <span>{label}</span>
    </label>
  )

  const text = (
    name: string,
    label: string,
    opts: { type?: string; inputMode?: 'numeric' | 'tel' } = {}
  ) => {
    const isEmpty = String(f[name] ?? '').trim().length === 0
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>
          {label}
          {isEmpty && <span className="text-primary">*</span>}
        </Label>
        <Input
          id={name}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          value={f[name] as string}
          onChange={(e) => set(name, e.target.value)}
          required
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5">
      <div>
        <h1 className="font-display text-xl font-medium uppercase leading-tight">
          Consentimiento informado
        </h1>
        <p className="text-sm text-muted-foreground">{studioName}</p>
      </div>

      {/* Barra de progreso: 6 pasos, check verde en los ya completados. */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  i === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : stepValid[i]
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground'
                )}
              >
                {stepValid[i] && i !== step ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <s.icon className="size-3.5" strokeWidth={2} />
                )}
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-1 h-0.5 flex-1', stepValid[i] ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {step + 1}. {STEPS[step]!.label}
      </p>

      {templateContent && step === 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
          {templateContent}
        </div>
      )}

      {/* Paso 1: Proyecto */}
      {step === 0 && (
        <div className="space-y-4">
          {!project ? (
            <p className="text-sm text-muted-foreground">
              Este consentimiento no tiene un proyecto vinculado.
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl bg-background">
                {project.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.photoUrl} alt="" className="h-44 w-full object-cover" />
                )}
                <div className="space-y-2.5 p-4">
                  <p className="text-lg font-semibold">{project.name}</p>
                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    {project.bodyZone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Zona</p>
                        <p className="font-medium">{project.bodyZone}</p>
                      </div>
                    )}
                    {project.size && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tamaño</p>
                        <p className="font-medium">{project.size}</p>
                      </div>
                    )}
                    {project.avgSessionDuration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Duración aprox.</p>
                        <p className="font-medium">{project.avgSessionDuration}</p>
                      </div>
                    )}
                    {project.sessionCount != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Sesiones</p>
                        <p className="font-medium">{project.sessionCount}</p>
                      </div>
                    )}
                    {project.totalValue != null && project.totalValue > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-medium">{cop(project.totalValue)}</p>
                      </div>
                    )}
                    {project.artistName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tatuador</p>
                        <p className="font-medium">{project.artistName}</p>
                      </div>
                    )}
                    {project.nextSessionAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha y hora</p>
                        <p className="font-medium">
                          {new Date(project.nextSessionAt).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                            timeZone: 'UTC',
                          })}{' '}
                          · {formatTime(project.nextSessionAt)}
                        </p>
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Descripción</p>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={f.confirma_diseno as boolean}
                  onChange={(e) => set('confirma_diseno', e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>Confirmo que este es el diseño que voy a tatuarme.</span>
              </label>
            </>
          )}
        </div>
      )}

      {/* Paso 2: Datos personales */}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {text('primer_nombre', 'Primer nombre')}
          {text('apellido', 'Apellido')}
          <div className="space-y-1.5">
            <Label htmlFor="tipo_documento">
              Tipo de documento
              {!f.tipo_documento && <span className="text-primary">*</span>}
            </Label>
            <select
              id="tipo_documento"
              value={f.tipo_documento as string}
              onChange={(e) => set('tipo_documento', e.target.value)}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {text('numero_documento', 'Número de documento', { inputMode: 'numeric' })}
          <div className="space-y-1.5">
            <Label htmlFor="fecha_nacimiento">
              Fecha de nacimiento
              {!f.fecha_nacimiento && <span className="text-primary">*</span>}
            </Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              value={f.fecha_nacimiento as string}
              onChange={(e) => set('fecha_nacimiento', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Edad</Label>
            <Input value={age} disabled placeholder="Se calcula sola" />
          </div>
          {text('telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' })}
          {text('correo', 'Correo electrónico', { type: 'email' })}
          <div className="sm:col-span-2">{text('direccion', 'Dirección')}</div>
        </div>
      )}

      {/* Paso 3: Salud */}
      {step === 2 && (
        <div className="space-y-2">
          {HEALTH.map(([key, label]) => (
            <React.Fragment key={key}>{yesno(key, label, 'Explícanos brevemente.')}</React.Fragment>
          ))}
        </div>
      )}

      {/* Paso 4: Diseño */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Zona del cuerpo a tatuar
              {!String(f.zona).trim() && <span className="text-primary">*</span>}
            </Label>

            {!editingZone && String(f.zona).trim() ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5">
                <span className="text-sm font-medium">{f.zona as string}</span>
                <button
                  type="button"
                  onClick={() => setEditingZone(true)}
                  className="shrink-0 text-xs font-medium text-primary"
                >
                  Cambiar zona
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex rounded-full border border-border bg-secondary p-1" role="group" aria-label="Referencia">
                  {(['Hombre', 'Mujer'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setZoneGender(g)}
                      aria-pressed={zoneGender === g}
                      className={cn(
                        'flex-1 rounded-full py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                        zoneGender === g
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="max-h-80 overflow-y-auto rounded-2xl border border-border bg-secondary/40 p-3">
                  <BodyMapExplorer
                    gender={zoneGender}
                    onDone={(label) => {
                      set('zona', label)
                      setEditingZone(false)
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion_diseno">
              Descripción del diseño
              {!String(f.descripcion_diseno).trim() && <span className="text-primary">*</span>}
            </Label>
            <Textarea
              id="descripcion_diseno"
              rows={3}
              value={f.descripcion_diseno as string}
              onChange={(e) => set('descripcion_diseno', e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {/* Paso 5: Declaraciones */}
      {step === 4 && (
        <div className="space-y-2">
          {ACCEPT.map(([name, label]) => (
            <React.Fragment key={name}>{check(name, label)}</React.Fragment>
          ))}
          {yesno('autoriza_fotos', 'Autorizo el uso de fotos/videos con fines promocionales')}
        </div>
      )}

      {/* Paso 6: Firma — resumen visual + firma digital. */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl bg-background p-4 text-sm">
            <p className="mb-1 flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wide text-primary">
              <ShieldCheck className="size-3.5" strokeWidth={2} />
              Resumen antes de firmar
            </p>
            {[
              ['Cliente', `${f.primer_nombre} ${f.apellido}`],
              ['Proyecto', project?.name ?? '—'],
              ['Zona', String(f.zona)],
              project?.size ? ['Tamaño', project.size] : null,
              ['Duración', project?.avgSessionDuration ?? '—'],
              project?.totalValue ? ['Valor', cop(project.totalValue)] : null,
              project?.nextSessionAt
                ? [
                    'Fecha',
                    new Date(project.nextSessionAt).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      timeZone: 'UTC',
                    }),
                  ]
                : null,
              project?.nextSessionAt ? ['Hora', formatTime(project.nextSessionAt)] : null,
              project?.artistName ? ['Tatuador', project.artistName] : null,
            ]
              .filter((row): row is [string, string] => row !== null)
              .map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <Label>Firma</Label>
            <SignaturePad
              onSave={(d) => {
                setSignature(d)
                toast.success('Firma guardada')
              }}
            />
            {signature && <p className="text-xs font-medium text-primary">Firma guardada ✓</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
          <ChevronLeft className="size-4" />
          Atrás
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Continuar
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            <ShieldCheck className="size-4" />
            {loading ? 'Enviando…' : 'Firmar y confirmar consentimiento'}
          </Button>
        )}
      </div>
    </div>
  )
}
