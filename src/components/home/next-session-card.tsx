'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarCheck2, FileSignature, BadgeCheck, Clock3, ChevronLeft, ChevronRight, Play, Square } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_SESSION_TEMPLATE } from '@/lib/messages/templates'
import { formatTime, dayLabel, dayKey } from '@/lib/calendar/utils'
import { ConsentSendDialog } from '@/components/home/consent-send-dialog'
import { SessionMaterialsDialog } from '@/components/home/session-materials-dialog'
import { endSessionShift } from '@/actions/session-materials'
import type { SessionWithProject } from '@/queries/sessions'
import type { InventoryItem } from '@/queries/inventory'
import { RemotePhoto } from '@/components/shared/remote-photo'

/** Variantes de la transición al deslizar entre citas del día: la tarjeta
 * saliente se desliza HACIA AFUERA del marco (encogiéndose un poco) por el
 * lado por el que "se fue", y la entrante ENTRA completa desde el lado
 * contrario — la tarjeta entera (contador, foto, hora, botones) se mueve
 * como una sola pieza, para que se sienta como cambiar a otra tarjeta
 * física, no como un texto que se desliza un poco y ya. `dir` (1 =
 * siguiente, -1 = anterior) lo pone `go()` según hacia dónde se movió el
 * índice, tanto por flechitas como por el swipe táctil. */
const cardVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0, scale: 0.97 }),
}

/** Glifo de WhatsApp (marca). */
function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/** "1:04:32" o "04:32" según pase o no de una hora — cronómetro de la sesión en curso. */
function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/**
 * Tarjeta destacada de sesiones de HOY: desliza izquierda/derecha (o con las
 * flechitas) entre todas las citas del día, no solo la próxima. Tocar la
 * tarjeta (fuera de los botones) va directo al proyecto. "Consentimiento"
 * abre un popup para generarlo y enviarlo por WhatsApp.
 *
 * Botón ▶ "iniciar sesión": antes esto solo existía como jornada general del
 * día en el Home de escritorio — ahora es por CITA puntual, aquí y en cada
 * fila de escritorio (mismo popup de materiales, misma acción del servidor).
 * Antes de arrancar el cronómetro, pide confirmar los materiales gastados
 * (precargados con el mínimo configurado por insumo en Ajustes → Inventario)
 * y descuenta el stock apenas se confirma.
 */
export function NextSessionCard({
  sessions,
  photoUrls,
  initialIndex = 0,
  template,
  inventoryItems = [],
  activeShifts = {},
  consentSignedProjectIds,
}: {
  sessions: SessionWithProject[]
  photoUrls: Record<string, string | null>
  initialIndex?: number
  template?: string | null
  /** Insumos del inventario, para precargar el popup de materiales. */
  inventoryItems?: InventoryItem[]
  /** Cronómetros de sesión abiertos, indexados por `session_id` (desde el server). */
  activeShifts?: Record<string, { id: string; startedAt: string }>
  /** project_id con consentimiento ya firmado — "Iniciar sesión" no deja
   * avanzar (ni abre el popup de materiales) si el proyecto no está acá. */
  consentSignedProjectIds?: Set<string>
}) {
  const router = useRouter()
  const [index, setIndex] = useState(Math.min(initialIndex, sessions.length - 1))
  // Sentido del último movimiento entre citas (1 = siguiente, -1 = anterior)
  // — alimenta `cardVariants` para que la tarjeta entrante/saliente se
  // deslice hacia el lado correcto, sin importar si vino de las flechitas
  // o de un swipe táctil.
  const [direction, setDirection] = useState(1)
  const [consentOpen, setConsentOpen] = useState(false)
  const [materialsOpen, setMaterialsOpen] = useState(false)
  // Overrides locales por sesión — reflejan de inmediato iniciar/finalizar
  // sin esperar al revalidate del server. `undefined` = usar `activeShifts`
  // tal cual vino del server; `null` = se cerró localmente (aunque el prop
  // todavía no se haya actualizado).
  const [shiftOverrides, setShiftOverrides] = useState<Record<string, { id: string; startedAt: string } | null>>({})
  const [now, setNow] = useState(() => Date.now())
  const touchStartX = useRef<number | null>(null)

  // `sessions` nunca está vacío al montar (ambos callers lo condicionan a
  // `todayOrdered.length > 0`) y `index` siempre queda acotado a
  // `[0, sessions.length - 1]` por el estado inicial y por `go()`.
  const session = sessions[index]!
  const activeShift =
    session.id in shiftOverrides ? shiftOverrides[session.id] : (activeShifts[session.id] ?? null)

  useEffect(() => {
    if (!activeShift) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeShift])
  const photoUrl = photoUrls[session.id] ?? null
  const clientName = session.projects?.clients?.name ?? 'Cliente'
  const clientId = session.projects?.clients?.id
  const phone = session.projects?.clients?.phone
  const wa = waLink(
    phone,
    buildMessage(template || DEFAULT_SESSION_TEMPLATE, {
      nombre_cliente: clientName,
      fecha: dayLabel(dayKey(session.scheduled_at)),
      hora: formatTime(session.scheduled_at),
    })
  )

  function go(delta: number) {
    setIndex((i) => {
      const next = Math.max(0, Math.min(sessions.length - 1, i + delta))
      if (next !== i) setDirection(delta > 0 ? 1 : -1)
      return next
    })
  }

  function handleTouchStart(e: React.TouchEvent) {
    // `touchstart`/`touchend` siempre traen al menos un toque en la lista.
    touchStartX.current = e.touches[0]!.clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0]!.clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    go(delta < 0 ? 1 : -1)
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/projects/${session.project_id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/dashboard/projects/${session.project_id}`)
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative cursor-pointer overflow-hidden rounded-[1.75rem] bg-card transition-colors hover:bg-card/80"
    >
      {/* Tarjeta completa por-cita: cada swipe/flechita cambia `session.id`,
          lo que hace que `AnimatePresence` desmonte la tarjeta saliente
          deslizándola/encogiéndose hacia el lado por el que se fue y monte
          la entrante completa desde el lado contrario — contador, foto,
          hora, cliente, botones y los puntos de posición se mueven juntos
          como una sola tarjeta física, no solo el texto. */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={session.id}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="p-4 sm:p-5"
        >
          {!photoUrl && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-primary/25 blur-3xl"
            />
          )}
          {photoUrl && (
            <RemotePhoto
              src={photoUrl}
              width={320}
              eager
              className="pointer-events-none absolute -right-5 -top-5 size-28 rounded-2xl object-cover opacity-90 sm:size-32"
            />
          )}

          <div className="relative flex items-center justify-between gap-2 text-primary">
            <div className="flex items-center gap-1.5">
              <CalendarCheck2 className="size-4" strokeWidth={2} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                {sessions.length > 1 ? `Sesión de hoy ${index + 1}/${sessions.length}` : 'Próxima sesión'}
              </span>
            </div>
            {sessions.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Sesión anterior"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    go(-1)
                  }}
                  className="grid size-6 place-items-center rounded-full text-primary disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  aria-label="Sesión siguiente"
                  disabled={index === sessions.length - 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    go(1)
                  }}
                  className="grid size-6 place-items-center rounded-full text-primary disabled:opacity-30"
                >
                  <ChevronRight className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            )}
          </div>

          <div className="relative mt-2.5 max-w-[65%] sm:max-w-[60%]">
            <p className="font-title text-4xl leading-none tabular-nums">
              {formatTime(session.scheduled_at)}
            </p>

            <p className="mt-2 truncate text-base font-semibold uppercase tracking-tight">{clientName}</p>
            <p className="truncate text-xs text-muted-foreground">{session.projects?.name ?? 'Sesión'}</p>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" strokeWidth={2} />
              {session.duration_minutes} min
            </div>
          </div>

          <div className="relative mt-3.5 flex flex-wrap gap-2">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <WaGlyph />
                Contactar cliente
              </a>
            ) : null}
            {clientId && (
              consentSignedProjectIds?.has(session.project_id) ? (
                <span className="flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2.5 text-sm font-medium text-primary">
                  <BadgeCheck className="size-4" strokeWidth={2} aria-hidden="true" />
                  Consentimiento firmado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConsentOpen(true)
                  }}
                  className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FileSignature className="size-4" strokeWidth={2} aria-hidden="true" />
                  Consentimiento
                </button>
              )
            )}

            {/* ▶ Iniciar sesión / ■ Finalizar — a la derecha, justo debajo de la
                foto del proyecto (antes flotaba encima de la foto, arriba).
                Antes de arrancar, popup de materiales gastados (se precargan
                del mínimo configurado y descuentan del inventario apenas se
                confirma). */}
            <button
              type="button"
              data-tour="session-timer"
              onClick={(e) => {
                e.stopPropagation()
                if (activeShift) {
                  endSessionShift(activeShift.id)
                  setShiftOverrides((m) => ({ ...m, [session.id]: null }))
                } else if (consentSignedProjectIds && !consentSignedProjectIds.has(session.project_id)) {
                  toast.error('Falta firmar el consentimiento para iniciar esta sesión')
                } else {
                  setMaterialsOpen(true)
                }
              }}
              aria-label={activeShift ? 'Finalizar sesión' : 'Iniciar sesión'}
              className={
                activeShift
                  ? 'ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-2.5 text-primary'
                  : 'ml-auto flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 size-11'
              }
            >
              {activeShift ? (
                <>
                  <Square className="size-4" strokeWidth={2} fill="currentColor" aria-hidden="true" />
                  <span className="font-mono text-sm tabular-nums">{formatElapsed(now - new Date(activeShift.startedAt).getTime())}</span>
                </>
              ) : (
                <Play className="size-4" strokeWidth={2} fill="currentColor" aria-hidden="true" />
              )}
            </button>
          </div>

          {sessions.length > 1 && (
            <div className="relative mt-2.5 flex justify-center gap-1.5">
              {sessions.map((s, i) => (
                <span
                  key={s.id}
                  className={i === index ? 'h-1.5 w-4 rounded-full bg-primary' : 'size-1.5 rounded-full bg-accent'}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {clientId && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConsentSendDialog
            projectId={session.project_id}
            clientId={clientId}
            clientName={clientName}
            phone={phone}
            open={consentOpen}
            onOpenChange={setConsentOpen}
          />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <SessionMaterialsDialog
          open={materialsOpen}
          onOpenChange={setMaterialsOpen}
          sessionId={session.id}
          items={inventoryItems}
          // La acción devuelve `shiftId`; acá el turno se guarda como `id`
          // (mismo shape que `activeShifts` del servidor). Sin este mapeo
          // `activeShift.id` queda undefined y "Detener" no cierra el turno.
          onStarted={(shift) =>
            setShiftOverrides((m) => ({
              ...m,
              [session.id]: { id: shift.shiftId, startedAt: shift.startedAt },
            }))
          }
        />
      </div>
    </article>
  )
}
