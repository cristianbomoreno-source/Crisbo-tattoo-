'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  CalendarPlus,
  Camera,
  Mic,
  Square,
  UserPlus,
  UserCheck,
  Search,
  MapPin,
  X as XIcon,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'motion/react'

import { createClientAction, updateClientAction, findClientProjectsByPhoneAction } from '@/actions/clients'
import { createQuoteAction, convertQuoteToProjectAction } from '@/actions/quotes'
import { transcribeAudioAction } from '@/actions/transcribe'
import { PhoneInput } from '@/components/shared/phone-input'
import { ScheduleSessionsDialog } from '@/components/calendar/schedule-sessions-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BodySizeCards } from '@/components/intake/body-cards'
import { BodyMapExplorer } from '@/components/intake/body-map-explorer'
import { INTAKE_STYLES, INTAKE_MAX_PHOTOS } from '@/lib/validations/intake'
import { cop } from '@/lib/projects/metrics'
import { waLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { QuickQuoteTopBar } from '@/components/quotes/quick-quote-topbar'
import { QuickSection, BigOptionCard, BigChip, PresetCard, TinyTip } from '@/components/quotes/quick-quote-parts'
import { AnimatedPrice, StyleGridPicker, QuickQuoteSummaryBar } from '@/components/quotes/quick-quote-extras'

const FALLBACK_STYLES = INTAKE_STYLES.filter((s) => s !== 'Otro' && s !== 'No lo sé')
const SESSION_CHIPS = ['1', '2', '3', '4', '5+'] as const
const TOTAL_SECTIONS = 8

type Preset = { label: string; amount: number }

/**
 * Cotización rápida: 1 sola pantalla (a diferencia del wizard de 5 pasos de
 * "Cotización formal"). Cliente + idea + estilo + precio (por presets o a
 * mano) → "Crear proyecto" pasa por cliente → cotización → conversión a
 * proyecto sin salir del formulario. Una vez creado, aparece "Agendar cita".
 *
 * REDISEÑO (misma lógica de siempre, interfaz nueva): ya no es una lista
 * larga de campos con scroll — es un panel tipo dashboard (2 columnas en
 * escritorio/iPad, todo visible sin scroll) con tarjetas grandes, chips y
 * un precio protagonista, más una barra de resumen fija abajo. Todo el
 * estado, validaciones y server actions de abajo son EXACTAMENTE los
 * mismos que antes del rediseño — lo único que cambió es cómo se ven.
 */
export function QuickQuoteForm({ styles, presets }: { styles: string[]; presets: Preset[] }) {
  const router = useRouter()
  const styleOptions = styles.length > 0 ? styles : FALLBACK_STYLES

  const [clientMode, setClientMode] = useState<'new' | 'existing' | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [existingClientId, setExistingClientId] = useState<string | null>(null)
  const [searchingClient, setSearchingClient] = useState(false)
  const [clientNotFound, setClientNotFound] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [photoDragOver, setPhotoDragOver] = useState(false)
  const [description, setDescription] = useState('')
  const [styles_, setStyles] = useState<string[]>([])
  const [sessionCount, setSessionCount] = useState('')
  const [selectedPresets, setSelectedPresets] = useState<number[]>([])
  const [precisionZone, setPrecisionZone] = useState<string | null>(null)
  const [precisionSize, setPrecisionSize] = useState<string | null>(null)
  const [precisionGender, setPrecisionGender] = useState<'Hombre' | 'Mujer'>('Hombre')
  const [precisionOpen, setPrecisionOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ projectId: string; projectName: string } | null>(null)
  const [saved, setSaved] = useState<{ clientId: string; quoteId: string } | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  // Último teléfono ya guardado en el cliente (recién encontrado o creado) —
  // si se sigue editando después, se compara contra esto para saber si hay
  // que actualizar el cliente ya agregado.
  const [lastSyncedPhone, setLastSyncedPhone] = useState('')

  const presetSum = selectedPresets.reduce((sum, i) => sum + (presets[i]?.amount ?? 0), 0)
  const effectivePrice = priceTouched ? Number(price.replace(/\D/g, '')) || 0 : presetSum
  const projectName = [styles_.join(' + '), selectedPresets.map((i) => presets[i]?.label).filter(Boolean).join(' + ')]
    .filter(Boolean)
    .join(' — ') || 'Nuevo proyecto'

  const locked = loading || !!saved

  // ── Progreso automático ("Paso X de 8") — 8 secciones fijas, igual que la
  // referencia. No es navegación secuencial: todo está siempre visible,
  // esto solo refleja cuánto lleva completado el tatuador.
  const sectionsDone = useMemo(
    () => [
      clientMode === 'existing' ? !!existingClientId : clientMode === 'new' ? clientName.trim().length >= 2 : false,
      photos.length > 0,
      description.trim().length > 0,
      styles_.length > 0,
      !!sessionCount,
      selectedPresets.length > 0,
      !!precisionZone || !!precisionSize,
      effectivePrice > 0,
    ],
    [clientMode, existingClientId, clientName, photos, description, styles_, sessionCount, selectedPresets, precisionZone, precisionSize, effectivePrice]
  )
  const completedCount = sectionsDone.filter(Boolean).length

  function startRecording() {
    if (recording || transcribing) return
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []
        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop())
          setTranscribing(true)
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          const fd = new FormData()
          fd.set('audio', blob, 'nota.webm')
          const result = await transcribeAudioAction(fd)
          setTranscribing(false)
          if (!result.success) {
            toast.error(result.error.message)
            return
          }
          setDescription((prev) => (prev ? `${prev.trim()} ${result.data}` : result.data))
        }
        mediaRecorderRef.current = recorder
        recorder.start()
        setRecording(true)
      })
      .catch(() => {
        toast.error('No se pudo acceder al micrófono. Revisa los permisos.')
      })
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  function togglePreset(i: number) {
    setSelectedPresets((sel) => (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]))
    setPriceTouched(false)
  }

  function addPhotos(files: FileList | File[]) {
    const room = INTAKE_MAX_PHOTOS - photos.length
    if (room <= 0) return
    const next = Array.from(files).slice(0, room)
    setPhotos((prev) => [...prev, ...next])
    setPhotoPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))])
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  /** Busca un cliente ya registrado por su teléfono (últimos 10 dígitos, sin
   * importar indicativo/formato — misma lógica que ya usa el calendario) y
   * carga su nombre. Reutiliza `findClientProjectsByPhoneAction` en vez de
   * duplicar la búsqueda. */
  async function searchExistingClient(phone: string) {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) return
    setSearchingClient(true)
    setClientNotFound(false)
    const res = await findClientProjectsByPhoneAction(phone)
    setSearchingClient(false)
    if (res.success && res.data) {
      setClientName(res.data.clientName)
      setExistingClientId(res.data.clientId)
      setClientNotFound(false)
      setLastSyncedPhone(phone)
    } else {
      setClientName('')
      setExistingClientId(null)
      setClientNotFound(true)
    }
  }

  function resetClientPicker() {
    setClientMode(null)
    setClientName('')
    setClientPhone('')
    setExistingClientId(null)
    setClientNotFound(false)
    setLastSyncedPhone('')
  }

  /** Crea cliente + cotización la primera vez; si ya se creó (por el botón de
   * WhatsApp), reutiliza esos IDs en vez de duplicarlos. Si el cliente ya
   * estaba agregado (existente o ya creado en este flujo) y el teléfono se
   * siguió editando, lo actualiza en su ficha antes de continuar. */
  async function ensureClientAndQuote(): Promise<{ clientId: string; quoteId: string } | null> {
    async function syncPhone(clientId: string) {
      if (clientPhone && clientPhone !== lastSyncedPhone) {
        const res = await updateClientAction(clientId, { phone: clientPhone })
        if (res.success) setLastSyncedPhone(clientPhone)
      }
    }

    if (saved) {
      await syncPhone(saved.clientId)
      return saved
    }
    if (clientName.trim().length < 2) {
      toast.error('Ponle un nombre al cliente')
      return null
    }

    let clientId = clientMode === 'existing' ? existingClientId : null
    if (clientId) {
      await syncPhone(clientId)
    } else {
      const clientRes = await createClientAction({
        name: clientName.trim(),
        phone: clientPhone || undefined,
      })
      if (!clientRes.success) {
        toast.error(clientRes.error.message)
        return null
      }
      clientId = clientRes.data.id
      setLastSyncedPhone(clientPhone)
    }
    if (!clientId) return null

    const zoneLabel = precisionZone || selectedPresets.map((i) => presets[i]?.label).filter(Boolean).join(' + ')
    const fd = new FormData()
    fd.set('client_id', clientId)
    if (styles_.length > 0) fd.set('style', styles_.join(', '))
    if (zoneLabel) fd.set('body_zone', zoneLabel)
    if (precisionSize) fd.set('size', precisionSize)
    if (description.trim()) fd.set('description', description.trim())
    fd.set('price', String(effectivePrice))
    if (sessionCount) fd.set('session_count', sessionCount)
    photos.forEach((f, i) => fd.append(i === 0 ? 'reference_photo' : 'extra_photos', f))

    const quoteRes = await createQuoteAction(fd)
    if (!quoteRes.success) {
      toast.error(quoteRes.error.message)
      return null
    }

    const next = { clientId, quoteId: quoteRes.data.id }
    setSaved(next)
    return next
  }

  /** Botón "Crear cotización": la deja guardada (ya aparece en Cotizaciones)
   * y abre WhatsApp con el resumen para el cliente. */
  async function handleCreateQuote() {
    setLoading(true)
    const ids = await ensureClientAndQuote()
    setLoading(false)
    if (!ids) return

    toast.success('Cotización creada')
    const link = waLink(
      clientPhone,
      `Hola${clientName ? ` ${clientName.trim()}` : ''}, te comparto tu cotización de OFINK:\n\n${
        styles_.length > 0 ? `Estilo: ${styles_.join(', ')}\n` : ''
      }${description.trim() ? `Idea: ${description.trim()}\n` : ''}Precio: ${cop(effectivePrice)}`
    )
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  /** Botón "Crear proyecto" / CTA "Continuar" de la barra inferior: reutiliza
   * la cotización si ya existe (por WhatsApp) y la convierte a proyecto sin
   * salir del formulario. */
  async function handleCreateProject() {
    setLoading(true)
    const ids = await ensureClientAndQuote()
    if (!ids) {
      setLoading(false)
      return
    }

    const projectRes = await convertQuoteToProjectAction(ids.quoteId)
    setLoading(false)
    if (!projectRes.success) {
      toast.error(projectRes.error.message)
      return
    }

    setResult({ projectId: projectRes.data.projectId, projectName })
    toast.success('Proyecto creado')
  }

  function goHomeWithTransition() {
    setTransitioning(true)
    window.setTimeout(() => router.push('/dashboard'), 180)
  }

  const sizeShortLabel = precisionSize ? precisionSize.split('(')[0]!.trim() : null
  const sizeRangeLabel = precisionSize?.match(/\(([^)]+)\)/)?.[1] ?? null

  return (
    <div className="-mx-4 -mt-[4.5rem] -mb-[calc(5.5rem+env(safe-area-inset-bottom))] min-h-dvh bg-[#050505] sm:-mx-6 lg:mx-0 lg:mt-0 lg:mb-0 lg:rounded-[1.75rem]">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col lg:min-h-0 lg:py-6">
        {!result ? (
          <>
            <QuickQuoteTopBar completed={completedCount} total={TOTAL_SECTIONS} />

            <div className="grid flex-1 grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:gap-5 lg:border lg:border-t-0 lg:border-white/8 lg:px-6 lg:pb-5">
              {/* 1 — Cliente */}
              <QuickSection n={1} title="Cliente" spanFull done={sectionsDone[0]}>
                {clientMode === null ? (
                  <div className="flex gap-3">
                    <BigOptionCard
                      icon={UserPlus}
                      title="Cliente nuevo"
                      subtitle="Crear nuevo contacto"
                      onClick={() => setClientMode('new')}
                    />
                    <BigOptionCard
                      icon={UserCheck}
                      title="Cliente existente"
                      subtitle="Buscar en mis clientes"
                      onClick={() => setClientMode('existing')}
                    />
                  </div>
                ) : clientMode === 'existing' ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Busca por su teléfono</span>
                      <button
                        type="button"
                        onClick={resetClientPicker}
                        disabled={locked}
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
                      >
                        Cambiar
                      </button>
                    </div>
                    <PhoneInput
                      value={clientPhone}
                      onChange={(v) => {
                        setClientPhone(v)
                        setExistingClientId(null)
                        setClientNotFound(false)
                        setClientName('')
                      }}
                      onBlur={() => searchExistingClient(clientPhone)}
                    />
                    {searchingClient && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Search className="size-3.5 animate-pulse" strokeWidth={2} />
                        Buscando cliente…
                      </p>
                    )}
                    {!searchingClient && existingClientId && clientName && (
                      <p className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                        <Check className="size-4" strokeWidth={2.4} />
                        {clientName}
                      </p>
                    )}
                    {!searchingClient && clientNotFound && (
                      <div className="rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-xs text-muted-foreground">
                        No encontramos ningún cliente con ese teléfono.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setClientMode('new')
                            setClientNotFound(false)
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          Crear como cliente nuevo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:flex sm:gap-2.5 sm:space-y-0">
                    <div className="flex items-center justify-between sm:hidden">
                      <span className="text-xs text-muted-foreground">Datos del cliente nuevo</span>
                      <button
                        type="button"
                        onClick={resetClientPicker}
                        disabled={locked}
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
                      >
                        Cambiar
                      </button>
                    </div>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre completo"
                      disabled={locked}
                      className="h-11 w-full flex-1 rounded-xl border border-white/12 bg-white/[0.02] px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/20"
                    />
                    <div className="flex-1">
                      <PhoneInput value={clientPhone} onChange={setClientPhone} />
                    </div>
                    <button
                      type="button"
                      onClick={resetClientPicker}
                      disabled={locked}
                      className="hidden shrink-0 self-center text-xs font-medium text-primary hover:underline disabled:opacity-40 sm:block"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </QuickSection>

              {/* 2 — Fotos de referencia */}
              <QuickSection n={2} title="Fotos de referencia" done={sectionsDone[1]}>
                {photos.length < INTAKE_MAX_PHOTOS && (
                  <label
                    htmlFor="quick-quote-photo"
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!locked) setPhotoDragOver(true)
                    }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setPhotoDragOver(false)
                      if (locked) return
                      if (e.dataTransfer.files?.length) addPhotos(e.dataTransfer.files)
                    }}
                    className={cn(
                      'flex min-h-[168px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors duration-200',
                      locked && 'pointer-events-none opacity-50',
                      photoDragOver ? 'border-primary bg-primary/[0.06]' : 'border-white/15 hover:border-primary/40'
                    )}
                  >
                    <span className="mb-1 grid size-11 place-items-center rounded-full border border-primary/30 text-primary">
                      <Camera className="size-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-semibold text-foreground">Agregar referencia</span>
                    <span className="text-xs text-muted-foreground">Toma una foto o elige de la galería</span>
                    <span className="mt-1 text-[11px] text-muted-foreground/70">
                      Arrastra tu imagen aquí · hasta {INTAKE_MAX_PHOTOS}
                    </span>
                  </label>
                )}
                <input
                  id="quick-quote-photo"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={locked}
                  onChange={(e) => {
                    if (e.target.files?.length) addPhotos(e.target.files)
                    e.target.value = ''
                  }}
                  className="sr-only"
                />
                <AnimatePresence>
                  {photos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-2"
                    >
                      {photos.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreviews[i]} alt="Referencia elegida" className="size-12 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(1)} MB
                              <span className="flex items-center gap-0.5 text-primary">
                                <Check className="size-3" strokeWidth={3} /> aprobado
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => removePhoto(i)}
                            aria-label="Quitar imagen"
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-40"
                          >
                            <XIcon className="size-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </QuickSection>

              {/* 3 — Idea del tatuaje */}
              <QuickSection n={3} title="Idea del tatuaje" done={sectionsDone[2]}>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={locked}
                    rows={5}
                    placeholder="Describe tu idea, concepto o significado…"
                    className="w-full resize-none rounded-2xl border border-white/12 bg-white/[0.02] px-4 py-3.5 pr-14 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    onPointerDown={startRecording}
                    onPointerUp={stopRecording}
                    onPointerLeave={stopRecording}
                    onContextMenu={(e) => e.preventDefault()}
                    disabled={locked || transcribing}
                    aria-label={recording ? 'Suelta para terminar de dictar' : 'Mantén presionado para dictar'}
                    className={cn(
                      'absolute bottom-3 right-3 flex size-9 touch-none select-none items-center justify-center rounded-full transition-colors duration-200',
                      recording ? 'bg-primary text-primary-foreground' : 'bg-white/8 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {recording ? <Square className="size-3.5" strokeWidth={2.5} /> : <Mic className="size-4" strokeWidth={1.8} />}
                  </button>
                  {transcribing && (
                    <span className="absolute bottom-3 right-14 text-[11px] text-muted-foreground">Transcribiendo…</span>
                  )}
                </div>
                <TinyTip>✨ Sé específico para obtener un mejor diseño.</TinyTip>
              </QuickSection>

              {/* 4 — Estilo */}
              {styleOptions.length > 0 && (
                <QuickSection n={4} title="Estilo" hint="(Selecciona uno o varios)" spanFull done={sectionsDone[3]}>
                  <StyleGridPicker styles={styleOptions} value={styles_} onChange={setStyles} disabled={locked} />
                </QuickSection>
              )}

              {/* 5 — Número de sesiones */}
              <QuickSection n={5} title="Número de sesiones" done={sectionsDone[4]}>
                <div className="flex gap-2">
                  {SESSION_CHIPS.map((chip) => {
                    const chipValue = chip === '5+' ? '5' : chip
                    const active = chip === '5+' ? Number(sessionCount) >= 5 : sessionCount === chipValue
                    return (
                      <BigChip
                        key={chip}
                        label={chip}
                        selected={active}
                        disabled={locked}
                        onClick={() => setSessionCount(chipValue)}
                      />
                    )
                  })}
                </div>
                <TinyTip>Recomendación basada en tamaño y detalle.</TinyTip>
              </QuickSection>

              {/* 6 — Precios preestablecidos */}
              {presets.length > 0 && (
                <QuickSection n={6} title="Precios preestablecidos" hint="(Selecciona todas las que apliquen)" done={sectionsDone[5]}>
                  <div className="space-y-2">
                    {presets.map((p, i) => (
                      <PresetCard
                        key={`${p.label}-${i}`}
                        label={p.label}
                        subtitle="Zona completa"
                        amount={p.amount}
                        formattedAmount={cop(p.amount)}
                        selected={selectedPresets.includes(i)}
                        onClick={() => togglePreset(i)}
                        disabled={locked}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setPrecisionOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-40"
                  >
                    <Plus className="size-3.5" strokeWidth={2.4} />
                    Agregar zona personalizada
                  </button>
                </QuickSection>
              )}

              {/* 7 — Zona y tamaño exactos */}
              <QuickSection n={7} title="Zona y tamaño exactos" hint="Selecciona en el mapa del cuerpo" done={sectionsDone[6]}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setPrecisionOpen(true)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                    precisionZone || precisionSize ? 'border-primary/50 bg-primary/[0.05]' : 'border-white/12 hover:border-primary/40'
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/5 text-primary">
                    <MapPin className="size-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  {precisionZone || precisionSize ? (
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Zona seleccionada</span>
                      <span className="block truncate text-sm font-semibold text-primary">{precisionZone || 'Sin definir'}</span>
                      {sizeShortLabel && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Tamaño <span className="text-foreground">{sizeShortLabel}</span>
                          {sizeRangeLabel ? ` · ${sizeRangeLabel}` : ''}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">Elegir en el mapa del cuerpo</span>
                  )}
                  <span className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Editar
                  </span>
                </button>
              </QuickSection>

              {/* 8 — Precio total */}
              <QuickSection
                n={8}
                title="Precio total estimado"
                done={sectionsDone[7]}
                className="flex flex-col justify-center bg-gradient-to-b from-primary/[0.07] to-transparent"
              >
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2 text-center">
                  <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Total
                  </span>
                  <AnimatedPrice value={effectivePrice} className="font-title text-4xl leading-none text-primary sm:text-5xl" />
                  <TinyTip>
                    Este es un precio estimado.
                    <br />
                    El valor final puede variar según el diseño.
                  </TinyTip>
                </div>
                <div className="space-y-1.5 border-t border-white/8 pt-3">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Ajustar precio manualmente
                  </label>
                  <input
                    inputMode="numeric"
                    value={priceTouched ? price : effectivePrice ? String(effectivePrice) : ''}
                    onChange={(e) => {
                      setPriceTouched(true)
                      setPrice(e.target.value)
                    }}
                    disabled={locked}
                    placeholder="0"
                    className="h-10 w-full rounded-xl border border-white/12 bg-white/[0.02] px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/20"
                  />
                </div>
              </QuickSection>
            </div>

            {saved && (
              <p className="px-4 pb-2 text-center text-xs text-primary sm:px-6">
                Cotización guardada — ya aparece en &quot;Cotizaciones&quot;.
              </p>
            )}

            <div className="px-4 pb-2 sm:px-6">
              <button
                type="button"
                onClick={handleCreateQuote}
                disabled={locked}
                className="w-full rounded-xl border border-white/12 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading && !saved ? 'Creando…' : 'O solo crear la cotización y enviarla por WhatsApp'}
              </button>
            </div>

            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-0 lg:pb-0">
              <QuickQuoteSummaryBar
                data={{
                  styleThumb: null,
                  styleLabel: styles_.length > 0 ? styles_.join(', ') : null,
                  zoneLabel: precisionZone || (selectedPresets.length > 0 ? presets[selectedPresets[0]!]?.label ?? null : null),
                  sizeLabel: sizeShortLabel,
                  sessionLabel: sessionCount ? `${sessionCount}${Number(sessionCount) >= 5 ? '+' : ''} sesiones` : null,
                  price: effectivePrice,
                }}
                ctaLabel={loading ? 'Creando…' : 'Continuar'}
                ctaDisabled={loading}
                onCta={handleCreateProject}
              />
            </div>

            <p className="flex items-center justify-center gap-1.5 pb-4 pt-1 text-center text-[11px] text-muted-foreground/70">
              <ShieldCheck className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
              Tu información está segura y protegida
            </p>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center sm:px-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="size-7" strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Proyecto creado</p>
              <p className="text-sm text-muted-foreground">{result.projectName}</p>
            </div>

            <div className="w-full max-w-xs space-y-2.5">
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="glow-primary flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <CalendarPlus className="size-4" strokeWidth={2} />
                {(Number(sessionCount) || 1) > 1 ? 'Agendar sesiones' : 'Agendar sesión'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/projects/${result.projectId}`)}
                className="w-full rounded-xl border border-white/12 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
              >
                Ver proyecto
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <ScheduleSessionsDialog
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          projectId={result.projectId}
          sessionCount={Number(sessionCount) || 1}
          onScheduled={goHomeWithTransition}
        />
      )}

      {/* Zona y tamaño exactos (opcional) — mismo BodyMapExplorer/BodySizeCards
          del bot, para que una cotización armada a mano y una del bot usen el
          mismo vocabulario en quotes.body_zone/quotes.size. */}
      <Dialog open={precisionOpen} onOpenChange={setPrecisionOpen}>
        <DialogContent className="flex h-[85dvh] max-w-md flex-col sm:max-h-[640px]">
          <DialogHeader>
            <DialogTitle>Zona y tamaño exactos</DialogTitle>
            <DialogDescription>El mismo selector visual que ve el cliente en el bot.</DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 rounded-full border border-border bg-secondary p-1" role="group" aria-label="Referencia">
            {(['Hombre', 'Mujer'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setPrecisionGender(g)}
                aria-pressed={precisionGender === g}
                className={cn(
                  'flex-1 cursor-pointer rounded-full py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                  precisionGender === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <section className="flex flex-col gap-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">Tamaño</h3>
              <div className="flex h-72 shrink-0">
                <BodySizeCards
                  gender={precisionGender}
                  initialValue={precisionSize ?? undefined}
                  onPick={(v) => setPrecisionSize(v)}
                />
              </div>
            </section>

            <section className="flex min-h-96 flex-1 flex-col gap-2">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">Zona</h3>
              <div className="flex flex-1 rounded-xl border border-border bg-secondary/30 p-2">
                <BodyMapExplorer gender={precisionGender} onDone={(label) => setPrecisionZone(label)} />
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={() => setPrecisionOpen(false)}
            className="mt-1 flex w-full shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Listo
          </button>
        </DialogContent>
      </Dialog>

      {/* Transición rápida de vuelta a Inicio: el pulpo blanco aparece con
          fade y desaparece casi de inmediato (180ms) mientras navega. */}
      {transitioning && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-background animate-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pulpo-blanco.png" alt="" className="size-16 opacity-90" />
        </div>
      )}
    </div>
  )
}
