'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Plus, Minus, Copy, MessageCircle, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EstudioStepShell } from '@/components/onboarding/estudio-step-shell'
import { STUDIO_TYPES, ARTIST_COUNTS, WEEK_DAYS } from '@/components/onboarding/constants'
import {
  createStudioOnboarding,
  updateStudioOnboarding,
  type StudioOnboardingState,
} from '@/actions/studio-onboarding'
import { uploadStudioLogo, uploadStudioCover } from '@/actions/studio'
import { QUOTE_TEMPLATE_COLORS, type QuoteTemplateColorId } from '@/lib/pdf/quote-template-data'

type Draft = StudioOnboardingState & { logoFile: File | null; coverFile: File | null }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export function EstudioOnboardingWizard({ initial }: { initial: StudioOnboardingState }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({ ...initial, logoFile: null, coverFile: null })
  const [saving, setSaving] = useState(false)

  function patch(next: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...next }))
  }

  async function persist(fields: Record<string, unknown>) {
    const result = await updateStudioOnboarding(fields)
    if (!result.success) {
      toast.error(result.error.message)
      return false
    }
    return true
  }

  async function handleContinue() {
    setSaving(true)
    try {
      if (step === 0) {
        if (!draft.studioId) {
          const result = await createStudioOnboarding({
            name: draft.name,
            city: draft.city,
            whatsapp: draft.whatsapp,
            instagram: draft.instagram,
          })
          if (!result.success) {
            toast.error(result.error.message)
            return
          }
          patch({ studioId: result.data.studioId, joinCode: result.data.joinCode, slug: result.data.slug })
          if (draft.logoFile) {
            const fd = new FormData()
            fd.append('file', draft.logoFile)
            const logoResult = await uploadStudioLogo(fd)
            if (logoResult.success) patch({ logoUrl: logoResult.data.logoUrl })
          }
        } else {
          // Reutiliza un estudio ya existente (p. ej. el stub creado por el
          // paso 1 del wizard de tatuador si eligió "Soy propietario de un
          // estudio" después) — sin esto, lo que el usuario escribe acá se
          // perdía en silencio.
          const okStep = await persist({
            name: draft.name,
            city: draft.city || null,
            whatsapp_phone: draft.whatsapp || null,
            instagram: draft.instagram || null,
          })
          if (!okStep) return
          if (draft.logoFile) {
            const fd = new FormData()
            fd.append('file', draft.logoFile)
            const logoResult = await uploadStudioLogo(fd)
            if (logoResult.success) patch({ logoUrl: logoResult.data.logoUrl })
          }
        }
      } else if (step === 1) {
        const okStep = await persist({
          studio_type: draft.studioType,
          artist_count: draft.artistCount,
          accepts_residents: draft.acceptsResidents,
        })
        if (!okStep) return
      } else if (step === 2) {
        const okStep = await persist({
          open_days: draft.openDays,
          open_time: draft.openTime || null,
          close_time: draft.closeTime || null,
          slot_interval_minutes: draft.slotIntervalMinutes,
          cabins: draft.cabins,
          stations: draft.stations,
        })
        if (!okStep) return
      } else if (step === 3) {
        const okStep = await persist({
          deposit_mode: draft.depositMode || null,
          deposit_value: draft.depositValue ?? null,
          payment_policy: draft.paymentPolicy || null,
          cancellation_policy: draft.cancellationPolicy || null,
          studio_rules: draft.rules,
        })
        if (!okStep) return
      } else if (step === 4) {
        if (draft.coverFile) {
          const fd = new FormData()
          fd.append('file', draft.coverFile)
          const coverResult = await uploadStudioCover(fd)
          if (coverResult.success) patch({ coverPhotoUrl: coverResult.data.coverPhotoUrl })
        }
        const okStep = await persist({
          quote_template_color: draft.quoteTemplateColor,
          description: draft.description || null,
          website: draft.website || null,
        })
        if (!okStep) return
      } else if (step === 6) {
        router.push('/onboarding/estudio/listo')
        return
      }
      setStep((s) => s + 1)
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    <StepStudioInfo key="0" draft={draft} patch={patch} />,
    <StepCharacteristics key="1" draft={draft} patch={patch} />,
    <StepSpace key="2" draft={draft} patch={patch} />,
    <StepPolicies key="3" draft={draft} patch={patch} />,
    <StepCustomize key="4" draft={draft} patch={patch} />,
    <StepInviteArtists key="5" draft={draft} />,
    <StepSummary key="6" draft={draft} />,
  ]

  const titles = [
    { title: 'Tu estudio', subtitle: 'Empecemos por lo más importante.' },
    { title: 'Conozcamos tu estudio', subtitle: 'Cuéntanos cómo es tu espacio.' },
    { title: 'Configura tu espacio', subtitle: 'Define tu agenda y capacidad.' },
    { title: 'Políticas generales', subtitle: 'Se aplicarán a todos los artistas.' },
    { title: 'Personaliza tu estudio', subtitle: 'Así te verán tus clientes.' },
    { title: 'Invita a tus artistas', subtitle: 'Comparte el código para que se unan.' },
    { title: 'Resumen de tu estudio', subtitle: 'Revisa que todo esté listo.' },
  ]

  const canContinue = step === 0 ? draft.name.trim().length >= 2 && draft.city.trim().length >= 2 : true

  return (
    <EstudioStepShell
      stepIndex={step}
      title={titles[step]!.title}
      subtitle={titles[step]!.subtitle}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      onContinue={handleContinue}
      canContinue={canContinue}
      saving={saving}
      continueLabel={step === 6 ? 'FINALIZAR REGISTRO' : 'CONTINUAR'}
    >
      {steps[step]}
    </EstudioStepShell>
  )
}

// ── Paso 1: TU ESTUDIO ──────────────────────────────────────────────────
function StepStudioInfo({ draft, patch }: { draft: Draft; patch: (d: Partial<Draft>) => void }) {
  const previewUrl = draft.logoFile ? URL.createObjectURL(draft.logoFile) : draft.logoUrl
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <label className="relative flex size-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-card">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <Camera className="size-7 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) patch({ logoFile: file })
            }}
          />
        </label>
      </div>
      <Field label="Nombre del estudio *">
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Black Rose Tattoo"
        />
      </Field>
      <Field label="Ciudad *">
        <input
          className={inputClass}
          value={draft.city}
          onChange={(e) => patch({ city: e.target.value })}
          placeholder="Bogotá, Colombia"
        />
      </Field>
      <Field label="WhatsApp del estudio">
        <input
          className={inputClass}
          value={draft.whatsapp}
          onChange={(e) => patch({ whatsapp: e.target.value })}
          placeholder="+57 300 000 0000"
        />
      </Field>
      <Field label="Instagram (opcional)">
        <input
          className={inputClass}
          value={draft.instagram}
          onChange={(e) => patch({ instagram: e.target.value })}
          placeholder="@tuestudio"
        />
      </Field>
    </div>
  )
}

// ── Paso 2: CONOZCAMOS TU ESTUDIO ───────────────────────────────────────
function StepCharacteristics({ draft, patch }: { draft: Draft; patch: (d: Partial<Draft>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo de estudio
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {STUDIO_TYPES.map(({ value, label, icon: Icon }) => {
            const active = draft.studioType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => patch({ studioType: value })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center',
                  active ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <Icon className="size-5 text-foreground" strokeWidth={1.7} />
                <span className="text-[11px] font-medium uppercase leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ¿Cuántos artistas trabajan?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ARTIST_COUNTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => patch({ artistCount: value })}
              className={cn(
                'rounded-xl border bg-card py-2.5 text-center text-sm font-semibold',
                draft.artistCount === value ? 'border-primary bg-primary/5 text-primary' : 'border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ¿Aceptas residentes?
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => patch({ acceptsResidents: true })}
            className={cn(
              'flex-1 rounded-xl border bg-card py-2.5 text-sm font-semibold',
              draft.acceptsResidents ? 'border-primary bg-primary/5 text-primary' : 'border-border'
            )}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => patch({ acceptsResidents: false })}
            className={cn(
              'flex-1 rounded-xl border bg-card py-2.5 text-sm font-semibold',
              !draft.acceptsResidents ? 'border-primary bg-primary/5 text-primary' : 'border-border'
            )}
          >
            No
          </button>
        </div>
      </section>
    </div>
  )
}

// ── Paso 3: CONFIGURA TU ESPACIO ────────────────────────────────────────
function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number | null
  onChange: (v: number) => void
  min?: number
}) {
  const v = value ?? min
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5">
      <button type="button" onClick={() => onChange(Math.max(min, v - 1))} className="text-primary">
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{v}</span>
      <button type="button" onClick={() => onChange(v + 1)} className="text-primary">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function StepSpace({ draft, patch }: { draft: Draft; patch: (d: Partial<Draft>) => void }) {
  function toggleDay(day: string) {
    const set = new Set(draft.openDays)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    patch({ openDays: [...set] })
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Días de atención
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleDay(value)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-semibold',
                draft.openDays.includes(value) ? 'border-primary bg-primary/5 text-primary' : 'border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Apertura">
          <input
            type="time"
            className={inputClass}
            value={draft.openTime}
            onChange={(e) => patch({ openTime: e.target.value })}
          />
        </Field>
        <Field label="Cierre">
          <input
            type="time"
            className={inputClass}
            value={draft.closeTime}
            onChange={(e) => patch({ closeTime: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Intervalo entre citas">
        <select
          className={inputClass}
          value={draft.slotIntervalMinutes}
          onChange={(e) => patch({ slotIntervalMinutes: Number(e.target.value) })}
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={60}>60 minutos</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cabinas">
          <Stepper value={draft.cabins} onChange={(v) => patch({ cabins: v })} />
        </Field>
        <Field label="Estaciones">
          <Stepper value={draft.stations} onChange={(v) => patch({ stations: v })} />
        </Field>
      </div>
    </div>
  )
}

// ── Paso 4: POLÍTICAS GENERALES ─────────────────────────────────────────
function StepPolicies({ draft, patch }: { draft: Draft; patch: (d: Partial<Draft>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Modo de abono">
          <select
            className={inputClass}
            value={draft.depositMode}
            onChange={(e) => patch({ depositMode: e.target.value })}
          >
            <option value="">Sin definir</option>
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </Field>
        <Field label="Valor del abono">
          <input
            type="number"
            className={inputClass}
            value={draft.depositValue ?? ''}
            onChange={(e) => patch({ depositValue: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="100000"
          />
        </Field>
      </div>
      <Field label="Política de cancelación">
        <textarea
          className={cn(inputClass, 'min-h-20 resize-none')}
          value={draft.cancellationPolicy}
          onChange={(e) => patch({ cancellationPolicy: e.target.value })}
          placeholder="24h de anticipación para reprogramar sin costo."
        />
      </Field>
      <Field label="Política de pagos">
        <textarea
          className={cn(inputClass, 'min-h-20 resize-none')}
          value={draft.paymentPolicy}
          onChange={(e) => patch({ paymentPolicy: e.target.value })}
          placeholder="Aceptamos efectivo y transferencia."
        />
      </Field>
      <Field label="Reglas del estudio (una por línea)">
        <textarea
          className={cn(inputClass, 'min-h-24 resize-none')}
          value={draft.rules.join('\n')}
          onChange={(e) => patch({ rules: e.target.value.split('\n').filter(Boolean) })}
          placeholder={'No fotos sin autorización\nMenores acompañados de un adulto'}
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        Estas políticas se aplicarán automáticamente a todos los artistas del estudio.
      </p>
    </div>
  )
}

// ── Paso 5: PERSONALIZA TU ESTUDIO ──────────────────────────────────────
function StepCustomize({ draft, patch }: { draft: Draft; patch: (d: Partial<Draft>) => void }) {
  const previewUrl = draft.coverFile ? URL.createObjectURL(draft.coverFile) : draft.coverPhotoUrl
  return (
    <div className="flex flex-col gap-5">
      <Field label="Foto de portada">
        <label className="relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-card">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <Camera className="size-6 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) patch({ coverFile: file })
            }}
          />
        </label>
      </Field>

      <Field label="Color principal">
        <div className="flex gap-2.5">
          {(Object.entries(QUOTE_TEMPLATE_COLORS) as [QuoteTemplateColorId, string][]).map(([id, hex]) => (
            <button
              key={id}
              type="button"
              onClick={() => patch({ quoteTemplateColor: id })}
              className={cn(
                'size-9 rounded-full border-2',
                draft.quoteTemplateColor === id ? 'border-primary' : 'border-transparent'
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </Field>

      <Field label="Descripción del estudio">
        <textarea
          className={cn(inputClass, 'min-h-20 resize-none')}
          maxLength={160}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Arte, pasión y precisión. Convertimos tus ideas en tatuajes que cuentan historias."
        />
        <span className="mt-1 block text-right text-[10px] text-muted-foreground">
          {draft.description.length}/160
        </span>
      </Field>

      <Field label="Página web (opcional)">
        <input
          className={inputClass}
          value={draft.website}
          onChange={(e) => patch({ website: e.target.value })}
          placeholder="www.tuestudio.com"
        />
      </Field>
    </div>
  )
}

// ── Paso 6: INVITA A TUS ARTISTAS ───────────────────────────────────────
function StepInviteArtists({ draft }: { draft: Draft }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ofink.app'
  const inviteText = `Únete a ${draft.name} en OFINK. Tu código de invitación es ${draft.joinCode} — regístrate en ${appUrl} y elige "Trabajo en un estudio".`

  function copyCode() {
    navigator.clipboard.writeText(draft.joinCode)
    toast.success('Código copiado')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-card p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Código de invitación</p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-widest">{draft.joinCode || '—'}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Este código permite que los tatuadores se unan a tu estudio.
        </p>
      </div>

      {draft.joinCode && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteText)}`}
            alt="Código QR de invitación"
            className="size-44 rounded-xl bg-white p-2"
          />
        </div>
      )}

      <button
        type="button"
        onClick={copyCode}
        className="flex items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-semibold"
      >
        <Copy className="size-4" /> Copiar código
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <MessageCircle className="size-4" /> Compartir por WhatsApp
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(`Invitación a ${draft.name} en OFINK`)}&body=${encodeURIComponent(inviteText)}`}
        className="flex items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-semibold"
      >
        <Mail className="size-4" /> Invitar por correo
      </a>
      <p className="text-center text-xs text-muted-foreground">
        También puedes invitar artistas después desde Ajustes → Equipo.
      </p>
    </div>
  )
}

// ── Paso 7: RESUMEN ─────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

function StepSummary({ draft }: { draft: Draft }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
        {draft.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.logoUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 font-title text-lg text-primary">
            {draft.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-semibold">{draft.name}</p>
          <p className="text-xs text-muted-foreground">{draft.city}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4">
        <SummaryRow label="Tipo de estudio" value={draft.studioType} />
        <SummaryRow label="Artistas" value={draft.artistCount} />
        <SummaryRow
          label="Horario"
          value={draft.openDays.length ? `${draft.openDays.join(', ')} · ${draft.openTime}-${draft.closeTime}` : ''}
        />
        <SummaryRow label="Intervalo" value={`${draft.slotIntervalMinutes} min`} />
        <SummaryRow label="Cabinas" value={draft.cabins ? String(draft.cabins) : ''} />
        <SummaryRow label="Estaciones" value={draft.stations ? String(draft.stations) : ''} />
        <SummaryRow label="Políticas" value={`${draft.rules.length} configuradas`} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Podrás editar todo esto después desde Ajustes.
      </p>
    </div>
  )
}
