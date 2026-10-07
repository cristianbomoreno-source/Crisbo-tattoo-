'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ClipboardList,
  UserRound,
  MapPin,
  Palette,
  FileText,
  CalendarDays,
  Clock,
  Wallet,
  ShieldCheck,
  PiggyBank,
  Check,
  AlertCircle,
} from 'lucide-react'
import { createClientAction } from '@/actions/clients'
import { createQuoteAction } from '@/actions/quotes'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_TEMPLATE } from '@/lib/quotes/message'
import { cop } from '@/lib/projects/metrics'
import { formatDuration } from '@/components/quote-wizard/step-price'
import { depositPercentageFor, type StudioDeposit } from '@/lib/quotes/deposit'
import type { Client } from '@/queries/clients'
import type { WizardDraft } from '@/components/quote-wizard/quote-wizard'

type StepSummaryProps = {
  draft: WizardDraft
  clients: Client[]
  quoteMessageTemplate?: string
  studioDeposit?: StudioDeposit | null
  /** El footer sticky de `quote-wizard.tsx` es quien muestra el botón real
   * "Guardar cotización" (para que sea visible sin tener que hacer scroll
   * hasta el final del resumen) — este paso solo le pasa su `handleSave`
   * más reciente en cada render, y le avisa cuando está guardando para que
   * el botón se deshabilite/muestre "Guardando…". Cero cambio de lógica de
   * guardado, solo de dónde vive el botón. */
  onRegisterSave?: (save: () => void) => void
  onSavingChange?: (saving: boolean) => void
}

/**
 * Glifo de WhatsApp (marca). Mismo path que `step-client.tsx` (que a su vez
 * lo copió de `today-appointments.tsx`, donde es privado al módulo).
 */
function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/**
 * Etiqueta "monto · %" del abono que se aplicará, para la fila del Resumen.
 * `null` si no hay config o no es computable (mismos casos que `depositPercentageFor`).
 */
function depositSummaryLabel(
  studioDeposit: StudioDeposit | null | undefined,
  price: number,
  percentage: number | null
): string | null {
  if (!studioDeposit || percentage === null) return null
  if (studioDeposit.mode === 'percent') {
    const amount = Math.round((price * percentage) / 100)
    return `${percentage}% · ${cop(amount)}`
  }
  if (studioDeposit.mode === 'fixed' && studioDeposit.value !== null) {
    return `${cop(studioDeposit.value)} · ${percentage}%`
  }
  return null
}

/** Card de solo lectura del resumen: icono rojo outline + etiqueta muted + valor. */
function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
        <Icon className="size-4.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-display text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 break-words text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

/**
 * Paso 5 — Resumen: cards de solo lectura del draft + botón "Guardar
 * cotización" que (1) crea el cliente si es nuevo, (2) crea la cotización, y
 * (3) reemplaza la vista por la pantalla de éxito (patrón del overlay del bot
 * en `src/components/intake/summary.tsx`, bloque `if (sentLink)`).
 *
 * El mensaje de WhatsApp se arma con el MISMO helper que `quote-form.tsx`:
 * `buildMessage(quoteMessageTemplate || DEFAULT_TEMPLATE, {...})` +
 * `waLink(phone, message)`. El wizard no maneja cortesía, así que `valor`
 * siempre es el precio formateado con `cop()` (no hay rama "Cortesía").
 */
export function StepSummary({
  draft, clients, quoteMessageTemplate, studioDeposit, onRegisterSave, onSavingChange,
}: StepSummaryProps) {
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [savedQuoteId, setSavedQuoteId] = React.useState<string | null>(null)
  const [savedClientName, setSavedClientName] = React.useState('')
  const [savedClientPhone, setSavedClientPhone] = React.useState<string | null | undefined>(undefined)
  // Cliente nuevo YA creado en un intento anterior. Si `createClientAction`
  // tuvo éxito pero `createQuoteAction` falló, el reintento debe REUSAR este
  // id — sin este estado, cada "Reintentar" crearía un cliente duplicado.
  const [createdClient, setCreatedClient] = React.useState<{
    id: string
    name: string
    phone: string | null
  } | null>(null)

  const existingClient = clients.find((c) => c.id === draft.clientId)
  const clientName = draft.clientMode === 'new' ? draft.newClientName.trim() : existingClient?.name
  const clientPhone =
    draft.clientMode === 'new' ? draft.newClientPhone.trim() || undefined : existingClient?.phone

  // Abono del estudio aplicado a esta cotización — helper puro compartido con
  // el hint del paso Precio (`depositPercentageFor`). `null` = sin config o no
  // computable → el fd.set de abajo se omite y el default del schema (20) manda.
  const priceNum = draft.price === '' ? NaN : Number(draft.price)
  const depositPercentage = depositPercentageFor(studioDeposit, priceNum)
  const depositLabel = depositSummaryLabel(studioDeposit, priceNum, depositPercentage)

  async function handleSave() {
    setSaving(true)
    setError(null)

    let clientId = draft.clientId
    let name = existingClient?.name ?? ''
    let phone: string | null | undefined = existingClient?.phone

    if (draft.clientMode === 'new') {
      if (createdClient) {
        // Reintento: el cliente ya se creó en un intento anterior — reusar,
        // NO volver a llamar `createClientAction` (evita duplicados en BD).
        clientId = createdClient.id
        name = createdClient.name
        phone = createdClient.phone
      } else {
        const clientResult = await createClientAction({
          name: draft.newClientName.trim(),
          ...(draft.newClientPhone.trim() ? { phone: draft.newClientPhone.trim() } : {}),
        })
        if (!clientResult.success) {
          setSaving(false)
          setError(clientResult.error.message)
          toast.error(clientResult.error.message)
          return
        }
        // Persistir INMEDIATAMENTE, antes de intentar la quote: si la quote
        // falla, el próximo intento entra por la rama de arriba.
        setCreatedClient({
          id: clientResult.data.id,
          name: clientResult.data.name,
          phone: clientResult.data.phone,
        })
        clientId = clientResult.data.id
        name = clientResult.data.name
        phone = clientResult.data.phone
      }
    }

    if (!clientId) {
      setSaving(false)
      setError('Selecciona un cliente para continuar.')
      toast.error('Selecciona un cliente para continuar.')
      return
    }

    // FormData para `createQuoteAction`: solo se agregan claves con valor —
    // el schema (`createQuoteSchema`) rechaza strings vacíos en campos que
    // esperan otro tipo, así que omitir es más seguro que mandar ''.
    const fd = new FormData()
    fd.set('client_id', clientId)
    const setIfPresent = (key: string, value: string | number | undefined) => {
      if (value === undefined || value === '') return
      fd.set(key, String(value))
    }
    setIfPresent('body_zone', draft.zone)
    setIfPresent('style', draft.style)
    setIfPresent('description', draft.description)
    setIfPresent('price', draft.price === '' ? undefined : draft.price)
    setIfPresent('session_count', draft.sessionCount)
    setIfPresent('avg_session_duration', formatDuration(draft.durationMin))
    setIfPresent('size', draft.size)
    setIfPresent('color', draft.workType)
    setIfPresent('skin_tone', draft.skinTone)
    setIfPresent('service', draft.coverUp ? 'Cover up' : 'Tatuaje')
    if (depositPercentage !== null) {
      fd.set('deposit_percentage', String(depositPercentage))
    }

    const quoteResult = await createQuoteAction(fd)
    setSaving(false)
    if (!quoteResult.success) {
      setError(quoteResult.error.message)
      toast.error(quoteResult.error.message)
      return
    }

    setSavedQuoteId(quoteResult.data.id)
    setSavedClientName(name)
    setSavedClientPhone(phone)
  }

  // Le pasa la versión más fresca de `handleSave` al footer sticky del
  // wizard (que es quien renderiza el botón real) en cada render — así el
  // footer siempre invoca la última closure, con el `draft`/estado actual.
  React.useEffect(() => {
    onRegisterSave?.(handleSave)
  })
  React.useEffect(() => {
    onSavingChange?.(saving)
  }, [saving, onSavingChange])

  // Pantalla de éxito — reemplaza el wizard entero (mismo patrón que
  // `IntakeSummary`: overlay `fixed inset-0` a pantalla completa).
  if (savedQuoteId) {
    const message = buildMessage(quoteMessageTemplate || DEFAULT_TEMPLATE, {
      nombre_cliente: savedClientName,
      nombre_proyecto: [draft.style, draft.zone].filter(Boolean).join(' — ') || 'tu tatuaje',
      valor: cop(Number(draft.price) || 0),
      numero_sesiones: String(draft.sessionCount),
    })
    const wa = waLink(savedClientPhone, message)

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cotización guardada"
        className="fixed inset-0 z-[100] overflow-y-auto bg-background px-6 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 text-center">
          {/* Check con destellos */}
          <div className="relative grid place-items-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute size-32 text-primary"
              fill="none"
              aria-hidden="true"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const a = ((i * 30) * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={50 + 34 * Math.cos(a)}
                    y1={50 + 34 * Math.sin(a)}
                    x2={50 + 46 * Math.cos(a)}
                    y2={50 + 46 * Math.sin(a)}
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <div className="relative grid size-20 place-items-center rounded-full bg-primary">
              <Check className="size-10 text-primary-foreground" strokeWidth={3} aria-hidden="true" />
            </div>
          </div>

          <div>
            <h2 className="font-title text-3xl uppercase tracking-tight">Cotización guardada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ya está lista para compartir con tu cliente.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <WaGlyph />
                Enviar por WhatsApp
              </a>
            ) : (
              <div className="rounded-lg border border-border px-4 py-3 text-center text-xs text-muted-foreground">
                El cliente no tiene WhatsApp
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 pt-1 text-sm">
            <Link
              href={`/dashboard/quotes/${savedQuoteId}`}
              className="cursor-pointer rounded-sm font-medium text-primary underline underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver cotización
            </Link>
            <Link
              href="/dashboard"
              className="cursor-pointer rounded-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-1 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
          <ClipboardList className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 pt-1">
          <h2 className="font-display text-base font-semibold uppercase tracking-wide">
            Resumen de tu cotización
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisa los detalles antes de generar y enviar
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {clientName && (
          <SummaryCard
            icon={UserRound}
            label="Cliente"
            value={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {clientName}
                {clientPhone && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <WaGlyph />
                    {clientPhone}
                  </span>
                )}
              </span>
            }
          />
        )}
        {draft.zone && <SummaryCard icon={MapPin} label="Zona del cuerpo" value={draft.zone} />}
        {draft.style && <SummaryCard icon={Palette} label="Estilo de tatuaje" value={draft.style} />}
        {draft.description && (
          <SummaryCard icon={FileText} label="Describe tu idea" value={draft.description} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={CalendarDays} label="Sesiones" value={draft.sessionCount} />
          <SummaryCard
            icon={Clock}
            label="Duración por sesión"
            value={formatDuration(draft.durationMin)}
          />
        </div>

        {draft.price !== '' && Number(draft.price) > 0 && (
          <div className="rounded-2xl bg-card p-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
              <p className="font-display text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                Valor total
              </p>
            </div>
            <p className="mt-1 font-title text-3xl tabular-nums">{cop(Number(draft.price))}</p>
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-border p-3">
              <ShieldCheck className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                Este valor puede ajustarse en el resumen final según los detalles del proyecto.
              </p>
            </div>
            {depositLabel && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PiggyBank className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
                  Abono para reservar
                </span>
                <span className="text-sm font-medium tabular-nums">{depositLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
