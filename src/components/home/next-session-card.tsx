'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarCheck2, FileSignature, BadgeCheck, Clock3, ChevronLeft, ChevronRight } from 'lucide-react'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_SESSION_TEMPLATE } from '@/lib/messages/templates'
import { formatTime, dayLabel, dayKey } from '@/lib/calendar/utils'
import { ConsentSendDialog } from '@/components/home/consent-send-dialog'
import type { SessionWithProject } from '@/queries/sessions'
import { ConfirmationMenu } from '@/components/sessions/confirmation-menu'
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

/**
 * Tarjeta destacada de sesiones de HOY: desliza izquierda/derecha (o con las
 * flechitas) entre todas las citas del día, no solo la próxima. Tocar la
 * tarjeta (fuera de los botones) va directo al proyecto. "Consentimiento"
 * abre un popup para generarlo y enviarlo por WhatsApp. El botón principal
 * muestra si la cita está confirmada, cancelada o por confirmar (respuesta
 * al recordatorio de WhatsApp) y abre el chat del cliente.
 */
export function NextSessionCard({
  sessions,
  photoUrls,
  initialIndex = 0,
  template,
  consentSignedProjectIds,
  daysUntil,
}: {
  sessions: SessionWithProject[]
  /** Días que faltan para la cita (solo cuando hoy no hay citas y se
   * muestra la próxima agendada de otro día). */
  daysUntil?: number
  photoUrls: Record<string, string | null>
  initialIndex?: number
  template?: string | null
  /** project_id con consentimiento ya firmado (insignia "Consentimiento firmado"). */
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
  const touchStartX = useRef<number | null>(null)

  // `sessions` nunca está vacío al montar (ambos callers lo condicionan a
  // `todayOrdered.length > 0`) y `index` siempre queda acotado a
  // `[0, sessions.length - 1]` por el estado inicial y por `go()`.
  const session = sessions[index]!
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
            <>
              {/* Foto del proyecto del centro hacia la derecha, a lo alto
                  de toda la tarjeta, fundida hacia la izquierda (y un poco
                  abajo) con el color de la tarjeta para que el texto y los
                  botones se lean encima. */}
              <RemotePhoto
                src={photoUrl}
                width={720}
                eager
                className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card from-50% to-card/0 to-80%"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-card/90 to-transparent"
              />
            </>
          )}

          <div className="relative flex items-center justify-between gap-2 text-primary">
            <div className="flex items-center gap-1.5">
              <CalendarCheck2 className="size-4" strokeWidth={2} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                {daysUntil
                  ? 'Próxima cita'
                  : sessions.length > 1
                    ? `Sesión de hoy ${index + 1}/${sessions.length}`
                    : 'Próxima sesión'}
              </span>
            </div>
            {daysUntil ? (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground tabular-nums">
                {daysUntil === 1 ? 'Mañana' : `Faltan ${daysUntil} días`}
              </span>
            ) : null}
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
            <p className="font-title font-bold text-4xl leading-none tabular-nums">
              {formatTime(session.scheduled_at)}
            </p>
            {daysUntil ? (
              <p className="mt-1 text-sm font-medium capitalize text-primary">
                {dayLabel(dayKey(session.scheduled_at))}
              </p>
            ) : null}

            <p className="mt-2 truncate text-base font-semibold uppercase tracking-tight">{clientName}</p>
            <p className="truncate text-xs text-muted-foreground">{session.projects?.name ?? 'Sesión'}</p>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" strokeWidth={2} />
              {session.duration_minutes} min
            </div>
          </div>

          <div className="relative mt-3.5 flex flex-wrap gap-2">
            {/* Estado de la confirmación (recordatorio de WhatsApp 24 h antes).
                Al tocarlo se cambia a mano o se abre el WhatsApp del cliente. */}
            <ConfirmationMenu
              sessionId={session.id}
              confirmation={session.confirmation ?? null}
              waHref={wa}
              onChanged={() => router.refresh()}
            />
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

    </article>
  )
}
