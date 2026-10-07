'use client'

import { ArrowRight, ShieldCheck, Sparkles, Clock } from 'lucide-react'

/** Portada emocional del bot: reemplaza el arranque directo en el chat.
 * Cero lógica — un solo callback (`onStart`) que revela el flujo de siempre. */
export function IntakeCover({
  studioName,
  logoUrl,
  onStart,
}: {
  studioName: string
  logoUrl: string | null
  onStart: () => void
}) {
  return (
    <div className="flex h-dvh w-full max-w-[480px] mx-auto flex-col overflow-hidden bg-background animate-fade-in">
      {/* Foto a pantalla completa en la mitad superior */}
      <div className="relative h-[52%] shrink-0 overflow-hidden">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[calc(0.875rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-9 rounded-full border border-white/20 object-cover" />
            ) : (
              <div className="grid size-9 place-items-center rounded-full bg-card font-heading text-xs uppercase">
                {studioName.slice(0, 2)}
              </div>
            )}
            <p className="font-heading text-xs uppercase tracking-wide text-white drop-shadow-sm">{studioName}</p>
          </div>
        </div>
      </div>

      {/* Tarjeta negra sólida en la mitad inferior */}
      <div className="flex flex-1 min-h-0 flex-col justify-between px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-white/50">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Hola, soy {studioName.split(' ')[0]}
          </p>
          <h1 className="mt-2 font-title text-[26px] leading-[1.12] text-white uppercase">
            Gracias por interesarte en tatuarte <span className="text-primary">conmigo</span>.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            Para darte una cotización acertada, quiero conocer tu idea y crear juntos un proyecto
            increíble.
          </p>
        </div>

        <ul className="my-5 space-y-2.5 text-sm text-white/80">
          <li className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-primary" aria-hidden /> Solo tomará 2 minutos
          </li>
          <li className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden /> Información 100% segura
          </li>
          <li className="flex items-center gap-2.5">
            <Sparkles className="size-4 shrink-0 text-primary" aria-hidden /> Cotización personalizada
          </li>
        </ul>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-13 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary font-heading text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Comenzar mi proyecto <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
