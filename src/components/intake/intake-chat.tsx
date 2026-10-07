'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowLeft, Brush, Layers, Sparkles, Pencil, MoreHorizontal, Check, Mic, Square } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import {
  INTAKE_SERVICES, INTAKE_STYLES,
} from '@/lib/validations/intake'
import { COPY } from './copy'
import { applyEdit, nextStepId, questionFor, type Answers, type HistoryItem, type StepId } from './flow'
import { ColorCards, SkinSwatches, PhotoPicker } from './visual-inputs'
import { BodySizeCards, GenderCards } from './body-cards'
import { BodyMapExplorer } from './body-map-explorer'
import { StyleCarousel, parseStyleValue } from '@/components/shared/style-carousel'
import { TattooMachineIcon } from '@/components/quotes/tattoo-machine-icon'
import { IntakeSummary } from './summary'
import { IntakeCover } from './intake-cover'
import { IntakeProgress, STEP_HEADERS } from './intake-progress'

type Props = {
  slug: string
  studioName: string
  logoUrl: string | null
  waPhone: string | null
  instagram?: string | null
  availableDays?: { key: string; label: string }[]
  /** Si el estudio apagó la pregunta "¿qué día se acomoda mejor?" en Ajustes → Bot, el flujo la salta. */
  askAvailability?: boolean
}

/**
 * Rediseño v0.98.0: vuelve a ser una CONVERSACIÓN — el historial de
 * preguntas y respuestas ya respondidas se ve como burbujas de chat
 * (bot a la izquierda, cliente a la derecha) en una sola tira que crece
 * hacia abajo, y el paso activo aparece como la última pregunta del bot
 * con su selector/campo justo debajo, en vez de tomarse toda la pantalla
 * por separado (eso era v0.76.0). Mismo `history`/`applyEdit`/`StepInput`
 * de siempre — el modelo de datos ya era de conversación por dentro
 * (`HistoryItem = { question, answer }`), esto solo cambia cómo se ve.
 * Tocar una respuesta ya dada (si no se envió el proyecto) la reabre en
 * edición, igual que antes.
 */
export function IntakeChat({ slug, studioName, logoUrl, waPhone, instagram, availableDays = [], askAvailability = true }: Props) {
  const [started, setStarted] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [current, setCurrent] = useState<StepId>('phone')
  const [answers, setAnswers] = useState<Answers>({})
  const [done, setDone] = useState(false)
  const [editing, setEditing] = useState<StepId | null>(null)
  // El bot "escribe" (puntitos animados) unos ~700ms antes de que aparezca
  // la siguiente pregunta — da la sensación de conversación real en vez de
  // que el siguiente paso salte instantáneo. Se cancela solo si el
  // componente se desmonta a mitad de camino.
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentBlockRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }, [])

  /** Envuelve cualquier cambio de paso en la pausa de "escribiendo…". */
  function withTypingDelay(run: () => void) {
    setTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      setTyping(false)
      run()
    }, 750)
  }

  function advance(answerLabel: string, patch: Partial<Answers>) {
    const merged = { ...answers, ...patch }
    setAnswers(merged)
    setHistory(prev => [
      ...prev,
      { stepId: current, question: questionFor(current, answers), answer: answerLabel },
    ])
    const next = nextStepId(current, merged, askAvailability)
    withTypingDelay(() => {
      if (!next) {
        setDone(true)
        return
      }
      setCurrent(next)
    })
  }

  /** Tras un envío exitoso: bloquea edición pero mantiene visible el paso
   * 'summary', que pasa a mostrar la confirmación en vez de desmontarse. */
  function handleSummarySent() {
    setDone(true)
  }

  function startEdit(stepId: StepId) {
    if (done || editing !== null) return
    setEditing(stepId)
  }

  function handleEditAnswer(stepId: StepId, label: string, patch: Partial<Answers>) {
    const result = applyEdit({ history, answers, current, done, stepId, label, patch })
    withTypingDelay(() => {
      setHistory(result.history)
      setAnswers(result.answers)
      setCurrent(result.current)
      setDone(result.done)
      setEditing(result.reopenAs)
    })
  }

  /** Flecha "Volver": cancela una edición en curso, o reabre en edición el
   * último paso ya respondido. En el primer paso, vuelve a la portada. */
  function handleBack() {
    if (editing !== null) {
      setEditing(null)
      return
    }
    if (history.length === 0) {
      setStarted(false)
      return
    }
    startEdit(history[history.length - 1]!.stepId)
  }

  // Auto-scroll al fondo del hilo cada vez que aparece una pregunta nueva
  // (respuesta agregada al history, o cambio de paso/edición). `scrollTop`
  // directo sobre el propio contenedor — nunca `scrollIntoView`, que en
  // iOS Safari/PWA puede arrastrar la página ENTERA en vez de solo este
  // hilo (bug real ya visto y arreglado en el Home; se evita de raíz acá). */
  // Cada pregunta nueva se posiciona cerca del TOPE visible del hilo (no
  // todo abajo) para que se lea completa y quede legible, con su
  // selector/foto/campo ocupando el resto de la pantalla debajo — así nunca
  // queda a medio scrollear ni tapada. Mientras "escribe" (los puntitos),
  // sí va al fondo, para revelarlos justo después de la respuesta.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (typing) {
      el.scrollTop = el.scrollHeight
      return
    }
    const block = currentBlockRef.current
    if (block) {
      el.scrollTop = Math.max(0, block.offsetTop - 12)
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [history.length, current, editing, done, typing])

  // Este retorno va DESPUÉS de todos los hooks a propósito: estaba arriba, antes
  // del useEffect de scroll, y eso rompe las reglas de hooks. Si `waPhone` pasa
  // de null a un valor sin desmontar el componente —navegar de /t/estudio-a a
  // /t/estudio-b reusa la instancia—, React ve menos hooks de los que espera y
  // la pantalla del chat truena entera.
  if (!waPhone) {
    return (
      <Shell studioName={studioName} logoUrl={logoUrl}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="font-title text-2xl text-white">{COPY.unavailableTitle}</p>
          <p className="text-sm text-muted-foreground">{COPY.unavailableBody}</p>
        </div>
      </Shell>
    )
  }

  if (!started) {
    return <IntakeCover studioName={studioName} logoUrl={logoUrl} onStart={() => setStarted(true)} />
  }

  const activeStep = editing ?? current
  // Mientras "escribe" (`typing`), el paso activo todavía no cambió de
  // verdad (el cambio está pausado en `withTypingDelay`) — si no se
  // ocultara acá, se vería el widget de la pregunta que YA se respondió al
  // mismo tiempo que su burbuja de respuesta recién agregada al historial.
  const showStepScreen = !typing && (editing !== null || !done || current === 'summary')
  // Mientras se edita un paso ya respondido, el hilo solo muestra lo
  // anterior a ese paso (lo posterior podría cambiar según la respuesta
  // nueva) — apenas se confirma, `applyEdit` decide qué queda del resto.
  const editIdx = editing ? history.findIndex(h => h.stepId === editing) : -1
  const visibleHistory = editing !== null && editIdx !== -1 ? history.slice(0, editIdx) : history

  return (
    <Shell studioName={studioName} logoUrl={logoUrl} current={current} onBack={!done ? handleBack : undefined} scrollRef={scrollRef}>
      {visibleHistory.map((item, i) => (
        <div key={`${item.stepId}-${i}`} className="flex flex-col gap-2">
          <BotBubble logoUrl={logoUrl} text={item.question} />
          <UserBubble
            text={item.answer}
            editable={editing === null && !done}
            onClick={() => startEdit(item.stepId)}
          />
        </div>
      ))}

      {typing && <TypingBubble logoUrl={logoUrl} />}

      {showStepScreen && (
        <div key={activeStep} ref={currentBlockRef} className="flex flex-col gap-3 animate-fade-in">
          <BotBubble
            logoUrl={logoUrl}
            text={
              activeStep === 'subzone' && answers.zone
                ? answers.zone
                : activeStep === 'gender' && answers.knownClient && answers.name
                  ? questionFor('gender', answers)
                  : activeStep !== 'service' && activeStep !== 'summary'
                    ? STEP_HEADERS[activeStep].title
                    : questionFor(activeStep, answers)
            }
            subtext={
              activeStep !== 'service' && activeStep !== 'summary'
                ? (activeStep === 'subzone' ? 'Elige la zona específica.' : STEP_HEADERS[activeStep].subtitle)
                : undefined
            }
          />
          <div className="overflow-y-auto rounded-[1.75rem]">
            <StepInput
              step={activeStep}
              answers={answers}
              slug={slug}
              studioName={studioName}
              waPhone={waPhone}
              instagram={instagram}
              availableDays={availableDays}
              onAnswer={editing ? (label, patch) => handleEditAnswer(activeStep, label, patch) : advance}
              onSummarySent={handleSummarySent}
              onEditStep={startEdit}
            />
          </div>
        </div>
      )}
    </Shell>
  )
}

/** Burbuja de "escribiendo…" — 3 puntitos animados, mismo marco que
 * `BotBubble`, mientras `withTypingDelay` hace su pausa antes de mostrar la
 * siguiente pregunta. Da la sensación de que hay alguien del otro lado. */
function TypingBubble({ logoUrl }: { logoUrl: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="mt-0.5 size-7 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-card text-[10px] font-heading uppercase text-white/70">
          B
        </div>
      )}
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card px-4 py-3.5" role="status" aria-label="Escribiendo">
        <span className="size-1.5 animate-bounce rounded-full bg-white/50 motion-reduce:animate-none [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-white/50 motion-reduce:animate-none [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-white/50 motion-reduce:animate-none" />
      </div>
    </div>
  )
}

/** Burbuja del bot: logo/isotipo a la izquierda + texto, alineado a la
 * izquierda, como cualquier mensaje entrante de un chat. */
function BotBubble({ logoUrl, text, subtext }: { logoUrl: string | null; text: string; subtext?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="mt-0.5 size-7 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-card text-[10px] font-heading uppercase text-white/70">
          B
        </div>
      )}
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-2.5">
        <p className="font-title text-[17px] leading-[1.2] text-white">{text}</p>
        {subtext && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  )
}

/** Burbuja de la respuesta del cliente: alineada a la derecha, en verde de
 * marca — tocable para reabrir en edición (mismo mecanismo de siempre). */
function UserBubble({ text, editable, onClick }: { text: string; editable: boolean; onClick: () => void }) {
  if (!text) return null
  return (
    <div className="flex justify-end pl-8">
      <button
        type="button"
        onClick={editable ? onClick : undefined}
        disabled={!editable}
        aria-label={editable ? `Editar respuesta: ${text}` : undefined}
        className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-left text-[15px] font-medium leading-snug text-primary-foreground transition-opacity disabled:cursor-default enabled:hover:opacity-90 enabled:active:opacity-80"
      >
        <span>{text}</span>
        {editable && <Pencil className="size-3 shrink-0 opacity-70" aria-hidden />}
      </button>
    </div>
  )
}

function Shell({
  studioName, logoUrl, current, onBack, scrollRef, children,
}: {
  studioName: string
  logoUrl: string | null
  current?: StepId
  onBack?: () => void
  scrollRef?: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden">
      <header className="shrink-0 px-5 pt-[calc(0.875rem+env(safe-area-inset-top))] pb-1">
        <div className="flex h-9 items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="grid size-9 cursor-pointer place-items-center rounded-full bg-card text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-card font-heading text-xs uppercase">
                  {studioName.slice(0, 2)}
                </div>
              )}
              <p className="font-heading text-xs uppercase tracking-wide text-white">{studioName}</p>
            </div>
          )}
        </div>
        {current && (
          <div className="mt-3">
            <IntakeProgress current={current} />
          </div>
        )}
      </header>
      {/* Hilo de conversación: crece hacia abajo, con scroll propio — el
          `scrollTop` se fija a mano en `IntakeChat` (nunca `scrollIntoView`,
          que en iOS Safari/PWA puede arrastrar la página entera). */}
      <div
        ref={scrollRef}
        className="relative flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        {children}
      </div>
    </div>
  )
}

/** Input del paso actual — un único campo/selector por pantalla. */
function StepInput({
  step, answers, slug, studioName, waPhone, instagram, availableDays, onAnswer, onSummarySent, onEditStep,
}: {
  step: StepId
  answers: Answers
  slug: string
  studioName: string
  waPhone: string
  instagram?: string | null
  availableDays: { key: string; label: string }[]
  onAnswer: (label: string, patch: Partial<Answers>) => void
  onSummarySent: () => void
  onEditStep: (stepId: StepId) => void
}) {
  switch (step) {
    case 'phone':
      return (
        <PhoneEntry
          slug={slug}
          onResolved={(phone, known) => {
            if (!known) return onAnswer(phone, { phone })
            const knownAge = known.birthdate ? ageFromBirthdate(known.birthdate) : null
            onAnswer(phone, {
              phone,
              name: known.name,
              email: known.email ?? undefined,
              knownClient: true,
              ...(knownAge !== null ? { age: knownAge, birthdate: known.birthdate ?? undefined } : {}),
            })
          }}
        />
      )
    case 'name':
      return (
        <TextEntry
          label="Tu nombre y apellido"
          minLength={2}
          maxLength={80}
          placeholder="Nombre y apellido..."
          requireTwoWords
          onSubmit={v => onAnswer(v, { name: v })}
        />
      )
    case 'service':
      return (
        <ServiceCards
          waPhone={waPhone}
          studioName={studioName}
          onPick={v => onAnswer(v, { service: v as Answers['service'] })}
        />
      )
    case 'other':
      return (
        <TextEntry
          label="Motivo de tu consulta"
          multiline
          minLength={5}
          maxLength={1000}
          submitLabel={COPY.otherSend}
          onSubmit={v => {
            const link = waLink(waPhone, `Hola *${studioName}*! ${v}`)
            if (link) window.open(link, '_blank', 'noopener')
            onAnswer(v, { otherQuery: v })
          }}
        />
      )
    case 'gender':
      return <GenderCards onPick={v => onAnswer(v, { gender: v })} />
    case 'age':
      return <AgeEntry onSubmit={(v, birthdate) => onAnswer(`${v} años`, { age: v, birthdate })} />
    case 'size':
      return <BodySizeCards gender={answers.gender} onPick={v => onAnswer(v, { size: v })} />
    case 'zone':
      return (
        <BodyMapExplorer
          gender={answers.gender ?? 'Hombre'}
          onDone={label => onAnswer(label, { zone: label, subzone: undefined })}
        />
      )
    case 'subzone':
      // Ya no se enruta acá — la subzona quedó embebida dentro de BodyMapExplorer
      // (ver 'zone' arriba). Se deja el caso por compatibilidad de tipos de StepId.
      return null
    case 'color':
      return <ColorCards onPick={v => onAnswer(v, { color: v })} />
    case 'skin':
      return <SkinSwatches onPick={v => onAnswer(v, { skinTone: v })} />
    case 'style':
      return (
        <StyleCards
          initialValue={answers.style}
          onDone={v => onAnswer(v, { style: v })}
        />
      )
    case 'photos':
      return (
        <PhotoPicker
          onDone={files =>
            onAnswer(
              files.length > 0 ? `${files.length} imagen${files.length > 1 ? 'es' : ''} de referencia` : COPY.noPhotos,
              { photos: files }
            )
          }
        />
      )
    case 'description':
      return (
        <TextEntry
          label="Tu idea"
          multiline
          minLength={10}
          maxLength={1000}
          placeholder={COPY.descriptionPlaceholder}
          allowVoice
          onSubmit={v => onAnswer(v, { description: v })}
        />
      )
    case 'contact':
      return <EmailEntry onSubmit={email => onAnswer(email, { email })} />
    case 'availability':
      return (
        <AvailabilityDaysPicker
          days={availableDays}
          onPick={v => onAnswer(v, { availability: v })}
        />
      )
    case 'summary':
      return (
        <IntakeSummary
          slug={slug}
          studioName={studioName}
          answers={answers}
          instagram={instagram}
          onSent={onSummarySent}
          onEditStep={onEditStep}
        />
      )
  }
}

const SERVICE_ICONS: Record<typeof INTAKE_SERVICES[number], typeof Brush> = {
  Tatuaje: Brush,
  'Cover up': Layers,
  Retoque: Sparkles,
  'Diseño personalizado': Pencil,
  Otro: MoreHorizontal,
}

const SERVICE_PHOTO: Record<typeof INTAKE_SERVICES[number], string> = {
  Tatuaje: '/styles/style-realismo.webp',
  'Cover up': '/styles/style-blackwork.webp',
  Retoque: '/styles/style-dotwork.webp',
  'Diseño personalizado': '/styles/style-lettering.webp',
  Otro: '/styles/style-otro-strip.webp',
}

const SERVICE_DESCRIPTION: Record<typeof INTAKE_SERVICES[number], string> = {
  Tatuaje: 'Crear una pieza completamente nueva desde cero.',
  'Cover up': 'Transformar un tatuaje existente en una nueva obra.',
  Retoque: 'Mejorar, refrescar o corregir una pieza existente.',
  'Diseño personalizado': 'Crear una ilustración exclusiva para ti.',
  Otro: 'Cuéntame tu idea y encontraremos la mejor forma de hacerla realidad.',
}

/**
 * Paso "servicio": rediseño visual (fotos reales en vez de íconos planos,
 * hero con foto + degradado) — la selección sigue siendo instantánea, mismo
 * `onPick(service)` de siempre. El único agregado de comportamiento es un
 * "flash" de ~180ms (borde + check) antes de avanzar, puramente cosmético,
 * para que la selección se sienta (no cambia qué valor se guarda).
 */
function ServiceCards({ onPick, waPhone, studioName }: { onPick: (v: string) => void; waPhone: string; studioName: string }) {
  const [picked, setPicked] = useState<string | null>(null)
  const gridServices = INTAKE_SERVICES.filter(s => s !== 'Otro')
  const otro = INTAKE_SERVICES.find(s => s === 'Otro')

  function pick(service: string) {
    if (picked) return
    setPicked(service)
    window.setTimeout(() => onPick(service), 180)
  }

  const helpLink = waLink(waPhone, `Hola *${studioName}*! Tengo dudas sobre mi proyecto.`)

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col overflow-y-auto pb-1">
      {/* Hero: título + descripción a la izquierda, ilustración con halo verde a la derecha. */}
      <div className="relative mb-5 flex shrink-0 items-start gap-3 overflow-hidden rounded-3xl border border-white/8 bg-card p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-title text-[26px] leading-[1.05] text-white">
            {STEP_HEADERS.service.title.split('tu piel').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-primary">tu piel</span>}
              </span>
            ))}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            {STEP_HEADERS.service.subtitle}
          </p>
        </div>
        <div className="relative grid size-20 shrink-0 place-items-center">
          <span className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" aria-hidden />
          <TattooMachineIcon className="relative size-16 text-primary drop-shadow-[0_0_12px_var(--primary)]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {gridServices.map(service => {
          const Icon = SERVICE_ICONS[service]
          const active = picked === service
          return (
            <button
              key={service}
              type="button"
              onClick={() => pick(service)}
              disabled={!!picked}
              className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[28px] border bg-card text-left transition-all duration-[180ms] active:scale-[0.97] ${
                active ? 'border-primary shadow-[0_0_24px_-4px_var(--primary)]' : 'border-white/8 hover:border-primary/40'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SERVICE_PHOTO[service]}
                alt=""
                loading="lazy"
                className={`absolute inset-0 size-full object-cover grayscale contrast-125 transition-transform duration-300 group-hover:scale-105 ${active ? 'scale-105' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" aria-hidden />
              {active && <div className="absolute inset-0 bg-primary/10" aria-hidden />}
              {active && (
                <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground animate-fade-in">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
              )}
              {!active && (
                <Icon className="absolute right-3 top-3 size-5 text-primary/80" strokeWidth={1.8} aria-hidden />
              )}
              <div className="relative z-10 p-3.5">
                <span className="block font-heading text-[15px] font-semibold uppercase tracking-wide text-white">
                  {service}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-white/70">
                  {SERVICE_DESCRIPTION[service]}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {otro && (
        <button
          type="button"
          onClick={() => pick(otro)}
          disabled={!!picked}
          className={`group relative mt-3 flex h-24 shrink-0 items-center overflow-hidden rounded-[28px] border bg-card text-left transition-all duration-[180ms] active:scale-[0.98] ${
            picked === otro ? 'border-primary shadow-[0_0_24px_-4px_var(--primary)]' : 'border-white/8 hover:border-primary/40'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SERVICE_PHOTO[otro]}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-top opacity-60 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" aria-hidden />
          {picked === otro && <div className="absolute inset-0 bg-primary/10" aria-hidden />}
          <div className="relative z-10 flex flex-1 items-center gap-3 px-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <MoreHorizontal className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-[15px] font-semibold uppercase tracking-wide text-white">Otro</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-white/70">{SERVICE_DESCRIPTION[otro]}</span>
            </span>
          </div>
          {picked === otro && (
            <span className="relative z-10 mr-4 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground animate-fade-in">
              <Check className="size-4" strokeWidth={3} aria-hidden />
            </span>
          )}
        </button>
      )}

      {helpLink && (
        <a
          href={helpLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex shrink-0 items-center justify-between rounded-2xl border border-white/8 bg-card px-4 py-3 text-sm text-white/80 transition-colors hover:border-primary/40"
        >
          <span>
            ¿Tienes dudas? Escríbeme por <span className="text-primary">WhatsApp</span>
          </span>
          <ArrowRight className="size-4 text-primary" aria-hidden />
        </a>
      )}
    </div>
  )
}

/** Carrusel de estilos a pantalla completa (fotos reales, `StyleCarousel`
 * compartida con el wizard de cotización formal y la rápida — misma fuente
 * de verdad `lib/body-render-assets.ts`). Ahora con selección MÚLTIPLE: se
 * eligen todos los que apliquen y se confirma con "Continuar" — antes
 * tocar una tarjeta avanzaba de inmediato, así que acá se necesita estado
 * local (no se llama `onDone`/avanza el paso hasta confirmar). */
function StyleCards({ initialValue, onDone }: { initialValue?: string; onDone: (v: string) => void }) {
  const styles = INTAKE_STYLES.filter(s => s !== 'No lo sé')
  const [value, setValue] = useState(initialValue ?? '')
  const hasSelection = parseStyleValue(value).length > 0

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-3">
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <StyleCarousel styles={styles} value={value} onChange={setValue} />
        {hasSelection && (
          <button
            type="button"
            onClick={() => onDone(value)}
            className="sticky bottom-2 left-full flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-heading text-xs uppercase tracking-wide text-primary-foreground shadow-lg transition-all active:scale-95"
          >
            <Check className="size-3.5" strokeWidth={3} aria-hidden /> Listo
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDone('No lo sé')}
        className="shrink-0 py-1 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Todavía no lo sé
      </button>
    </div>
  )
}

function TextEntry({
  label, onSubmit, minLength, maxLength, multiline = false, placeholder, submitLabel = 'Continuar', requireTwoWords = false, allowVoice = false,
}: {
  label: string
  onSubmit: (value: string) => void
  minLength: number
  maxLength: number
  multiline?: boolean
  placeholder?: string
  submitLabel?: string
  /** Exige al menos dos palabras (p. ej. nombre y apellido) además del largo mínimo. */
  requireTwoWords?: boolean
  /** Nota de voz con transcripción automática (Deepgram) — solo tiene sentido en `description`. */
  allowVoice?: boolean
}) {
  const [value, setValue] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const trimmed = value.trim()
  const hasTwoWords = trimmed.split(/\s+/).filter(Boolean).length >= 2
  const valid = trimmed.length >= minLength && trimmed.length <= maxLength && (!requireTwoWords || hasTwoWords)
  const id = `intake-${label.replace(/\s/g, '-').toLowerCase()}`

  function startRecording() {
    if (recording || transcribing) return
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []
        recorder.ondataavailable = e => chunks.push(e.data)
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          setTranscribing(true)
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          const fd = new FormData()
          fd.set('audio', blob, 'nota.webm')
          const { transcribeAudioAction } = await import('@/actions/transcribe')
          const result = await transcribeAudioAction(fd)
          setTranscribing(false)
          if (!result.success) return
          setValue(prev => (prev.trim() ? `${prev.trim()} ${result.data}` : result.data).slice(0, maxLength))
        }
        mediaRecorderRef.current = recorder
        recorder.start()
        setRecording(true)
      })
      .catch(() => {})
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  return (
    <form
      className="flex w-full flex-1 min-h-0 flex-col gap-3"
      onSubmit={e => {
        e.preventDefault()
        if (valid) onSubmit(trimmed)
      }}
    >
      <label htmlFor={id} className="sr-only">{label}</label>
      {multiline ? (
        <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-white/8 bg-card p-4">
          {allowVoice && (
            <button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              onContextMenu={e => e.preventDefault()}
              disabled={transcribing}
              className={`mb-2 flex shrink-0 w-fit touch-none items-center gap-1.5 self-end rounded-full px-3 py-1.5 text-xs font-medium transition-colors select-none ${
                recording ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {recording ? (
                <>
                  <Square className="size-3" strokeWidth={2.5} aria-hidden />
                  Suelta para terminar
                </>
              ) : transcribing ? (
                'Transcribiendo…'
              ) : (
                <>
                  <Mic className="size-3.5" strokeWidth={2} aria-hidden />
                  Mantén presionado para hablar
                </>
              )}
            </button>
          )}
          <textarea
            id={id}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (valid) onSubmit(trimmed)
              }
            }}
            maxLength={maxLength}
            placeholder={placeholder}
            autoFocus
            className="min-h-0 flex-1 resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <div className="mt-1 flex shrink-0 items-center justify-between">
            <p className="text-[11px] tabular-nums text-muted-foreground/70">
              {trimmed.length} / {maxLength}
            </p>
            <button
              type="submit"
              disabled={!valid}
              aria-label={submitLabel}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            value={value}
            onChange={e => setValue(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            autoFocus
            className="w-full rounded-2xl border border-white/8 bg-card py-4 pl-4 pr-14 text-[15px] placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring"
          />
          <button
            type="submit"
            disabled={!valid}
            aria-label={submitLabel}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
          {requireTwoWords && trimmed.length > 0 && !hasTwoWords && (
            <p className="mt-2 text-xs text-muted-foreground">Incluye tu apellido.</p>
          )}
        </div>
      )}
    </form>
  )
}

/** Calcula la edad exacta a partir de una fecha de nacimiento (YYYY-MM-DD). */
function ageFromBirthdate(birthdate: string): number | null {
  if (!birthdate) return null
  const b = new Date(birthdate + 'T00:00:00')
  if (Number.isNaN(b.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() >= b.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

function AgeEntry({ onSubmit }: { onSubmit: (value: number, birthdate: string) => void }) {
  const [birthdate, setBirthdate] = useState('')
  const age = ageFromBirthdate(birthdate)
  const valid = age !== null && age >= 10 && age <= 100
  const sentRef = useRef(false)

  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()).toISOString().slice(0, 10)
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

  // Sin botón "Continuar": apenas la fecha elegida es válida, avanza sola
  // (con una pausa breve para que se alcance a leer "Tienes X años").
  useEffect(() => {
    if (!valid || sentRef.current) return
    sentRef.current = true
    const id = setTimeout(() => onSubmit(age!, birthdate), 550)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-5 pt-2">
      <label htmlFor="intake-birthdate" className="sr-only">Fecha de nacimiento</label>
      <input
        id="intake-birthdate"
        type="date"
        min={minDate}
        max={maxDate}
        value={birthdate}
        onChange={e => { sentRef.current = false; setBirthdate(e.target.value) }}
        className="w-full rounded-2xl border border-white/8 bg-card px-4 py-4 text-center text-[17px] text-white [color-scheme:dark] placeholder:text-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
      />

      {age !== null && (
        <p className="text-center text-sm text-muted-foreground">
          {valid ? (
            <>Tienes <span className="font-heading text-primary">{age} años</span>.</>
          ) : (
            'Revisá la fecha, algo no parece correcto.'
          )}
        </p>
      )}
    </div>
  )
}

/** Primer paso del bot: WhatsApp del cliente. Busca si ya existe como
 * cliente del estudio — si lo encuentra, precarga nombre/email y el bot
 * salta esas preguntas más adelante (ver nextStepId en flow.ts). */
function PhoneEntry({
  slug, onResolved,
}: {
  slug: string
  onResolved: (phone: string, known: { name: string; email: string | null; birthdate: string | null } | null) => void
}) {
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const phoneValid = phone.replace(/\D/g, '').length >= 10

  async function submit() {
    if (!phoneValid || checking) return
    setChecking(true)
    try {
      const { lookupClientByPhoneForBot } = await import('@/actions/intake')
      const result = await lookupClientByPhoneForBot(slug, phone.trim())
      onResolved(phone.trim(), result.success ? result.data : null)
    } catch {
      onResolved(phone.trim(), null)
    } finally {
      setChecking(false)
    }
  }

  return (
    <form
      className="relative flex w-full flex-col gap-3"
      onSubmit={e => { e.preventDefault(); void submit() }}
    >
      <label htmlFor="intake-phone" className="sr-only">WhatsApp</label>
      <input
        id="intake-phone"
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="WhatsApp · ej. 350 204 6957"
        autoFocus
        className="w-full rounded-2xl border border-white/8 bg-card py-4 pl-4 pr-14 text-[15px] placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring"
      />
      <button
        type="submit"
        disabled={!phoneValid || checking}
        aria-label={checking ? 'Buscando…' : 'Continuar'}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {checking ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
        ) : (
          <ArrowRight className="size-4" aria-hidden />
        )}
      </button>
    </form>
  )
}

function EmailEntry({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <form
      className="relative flex w-full flex-col gap-2.5"
      onSubmit={e => {
        e.preventDefault()
        if (emailValid) onSubmit(email.trim())
      }}
    >
      <label htmlFor="intake-email" className="sr-only">Email</label>
      <input
        id="intake-email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email · ej. andres@gmail.com"
        autoFocus
        className="rounded-2xl border border-white/8 bg-card py-4 pl-4 pr-14 text-[15px] placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring"
      />
      <button
        type="submit"
        disabled={!emailValid}
        aria-label="Continuar"
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  )
}

/** Preferencia de día de la semana (Lunes..Domingo, según los días
 * habilitados en Ajustes → Horario) — ya no son fechas puntuales, ver
 * `weekdayOptions` en `(bot)/t/[slug]/page.tsx`. Selección múltiple (hasta 3).
 * Todo este paso se puede apagar desde Ajustes → Bot (`askAvailability`). */
function AvailabilityDaysPicker({
  days, onPick,
}: {
  days: { key: string; label: string }[]
  onPick: (v: string) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const sentRef = useRef(false)

  function toggle(key: string, label: string) {
    setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : prev.length < 3 ? [...prev, key] : prev))
    void label
  }

  // Sin días configurados: no hay nada que elegir, así que avanza sola en
  // vez de esperar un tap en un botón que solo dice "Continuar".
  useEffect(() => {
    if (days.length > 0 || sentRef.current) return
    sentRef.current = true
    const id = setTimeout(() => onPick('A coordinar por WhatsApp'), 900)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length])

  if (days.length === 0) {
    return (
      <div className="flex w-full flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <p className="text-center text-sm text-muted-foreground">
          Todavía no tenemos días configurados — cualquiera está bien, lo coordinamos por WhatsApp.
        </p>
        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-3">
      <p className="shrink-0 text-xs text-muted-foreground">Puedes elegir hasta 3 días.</p>
      <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto py-0.5 pr-0.5">
        {days.map(d => {
          const active = selected.includes(d.key)
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggle(d.key, d.label)}
              className={`flex shrink-0 items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                active ? 'border-primary bg-primary/10' : 'border-white/8 bg-card hover:border-white/20'
              }`}
            >
              <span className="text-sm capitalize text-white/90">{d.label}</span>
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  active ? 'border-primary bg-primary' : 'border-white/20'
                }`}
              >
                {active && <Check className="size-3 text-primary-foreground" strokeWidth={3.5} aria-hidden />}
              </span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const labels = days.filter(d => selected.includes(d.key)).map(d => d.label)
            onPick(labels.join(', '))
          }}
          className="ml-auto flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-heading text-xs uppercase tracking-wide text-primary-foreground transition-all active:scale-95"
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden /> Listo
        </button>
      )}
    </div>
  )
}
