'use client'

import { useState } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'
import type { QuoteTemplateData } from '@/lib/pdf/quote-template-data'

type Props = {
  quote: QuoteTemplateData
  artistName: string
  session: { scheduledAt: string; durationMinutes: number }
}

/** 'YYYYMMDDTHHMMSSZ' en UTC — formato que exige el estándar iCalendar. */
function toICSDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeICS(text: string): string {
  return text.replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
}

export function QuoteSessionCta({ quote, artistName, session }: Props) {
  const [open, setOpen] = useState(false)
  const start = new Date(session.scheduledAt)
  const end = new Date(start.getTime() + session.durationMinutes * 60_000)
  const title = `Sesión de tatuaje — ${quote.studioName}`
  const details = quote.description ? `Con ${artistName}. ${quote.description}` : `Con ${artistName}.`

  const dateLabel = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  }).format(start)

  function downloadICS() {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OFINK//Sesion//ES',
      'BEGIN:VEVENT',
      `UID:${session.scheduledAt}-${quote.studioName}@ofink`,
      `DTSTAMP:${toICSDate(new Date().toISOString())}`,
      `DTSTART:${toICSDate(start.toISOString())}`,
      `DTEND:${toICSDate(end.toISOString())}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${escapeICS(details)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sesion-tatuaje.ics'
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const googleUrl = new URL('https://calendar.google.com/calendar/render')
  googleUrl.searchParams.set('action', 'TEMPLATE')
  googleUrl.searchParams.set('text', title)
  googleUrl.searchParams.set('details', details)
  googleUrl.searchParams.set('dates', `${toICSDate(start.toISOString())}/${toICSDate(end.toISOString())}`)

  return (
    <section className="mx-auto mt-4 w-full max-w-md px-5">
      <div className="rounded-2xl border border-primary/25 bg-card p-4">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          Tu próxima sesión
        </p>
        <p className="mt-1.5 text-sm capitalize text-white/90">{dateLabel}</p>

        <div className="relative mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-heading text-sm uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <CalendarPlus className="size-4" aria-hidden /> Agregar a mi calendario
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {open && (
            <div className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-lg border border-white/10 bg-background shadow-lg">
              <a
                href={googleUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5"
              >
                Google Calendar
              </a>
              <button
                type="button"
                onClick={downloadICS}
                className="block w-full cursor-pointer px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5"
              >
                Apple Calendar / Outlook (.ics)
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
