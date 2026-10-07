import { Bot } from 'lucide-react'
import { COPY } from '@/components/intake/copy'
import { STYLE_SLUG } from '@/lib/body-render-assets'
import type { QuoteWithClient } from '@/queries/quotes'

/**
 * Reemplaza al checklist genérico anterior ("Seleccionó estilo: X", "Zona: X")
 * por una transcripción real de la conversación: la MISMA pregunta que el bot
 * le hizo al cliente (`@/components/intake/copy`, única fuente de verdad —
 * si el texto del bot cambia, esto cambia solo) emparejada con lo que
 * respondió, en el mismo orden del flujo (`intake/flow.ts`). Sin inventar
 * nada: un campo sin valor simplemente no aparece.
 */

type BotItem = { question: string; answer: string; image?: string }

function formatBotTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const wasYesterday = d.toDateString() === yesterday.toDateString()
  const hour = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(d)
  if (sameDay) return `Hoy, ${hour}`
  if (wasYesterday) return `Ayer, ${hour}`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(d) + `, ${hour}`
}

export function BotIntakeSummary({
  quote: q,
  clientName,
  clientPhone,
  clientEmail,
  referencePhotosCount,
}: {
  quote: QuoteWithClient
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  referencePhotosCount: number
}) {
  const items: BotItem[] = []
  items.push({ question: COPY.askName, answer: clientName })
  if (q.gender) items.push({ question: COPY.askGender, answer: q.gender })
  if (q.age) items.push({ question: COPY.askAge, answer: `${q.age} años` })
  if (q.service) items.push({ question: COPY.askService(clientName), answer: q.service })
  if (q.size) items.push({ question: COPY.askSize, answer: q.size })
  if (q.body_zone) items.push({ question: COPY.askZone, answer: q.body_zone })
  if (q.color) items.push({ question: COPY.askColor, answer: q.color })
  if (q.skin_tone) items.push({ question: COPY.askSkin, answer: q.skin_tone })
  if (q.style) {
    const slug = STYLE_SLUG[q.style]
    items.push({ question: COPY.askStyle, answer: q.style, image: slug ? `/styles/style-${slug}.webp` : undefined })
  }
  if (referencePhotosCount > 0) {
    items.push({
      question: COPY.askPhotos,
      answer: `${referencePhotosCount} imagen${referencePhotosCount === 1 ? '' : 'es'}`,
    })
  }
  if (q.description) items.push({ question: COPY.askDescription, answer: q.description })
  const contact = [clientPhone, clientEmail].filter(Boolean).join('  ·  ')
  if (contact) items.push({ question: COPY.askContact, answer: contact })
  if (q.availability) items.push({ question: COPY.askAvailability, answer: q.availability })

  return (
    <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wide text-primary">
          <Bot className="size-4" strokeWidth={1.8} aria-hidden />
          Información del bot
        </h3>
        <span className="text-[11px] text-muted-foreground">{formatBotTime(q.created_at)}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="max-w-[88%] self-start rounded-xl rounded-bl-sm bg-card px-3.5 py-2.5 text-[13px] leading-snug text-muted-foreground">
              {item.question}
            </div>
            <div className="flex max-w-[88%] items-center gap-2 self-end rounded-xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-right text-sm leading-snug text-foreground">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" loading="lazy" className="size-9 shrink-0 rounded-lg object-cover" />
              )}
              <span className="flex-1">{item.answer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
