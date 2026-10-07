'use client'

import { useEffect, useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { cn } from '@/lib/utils'

/** Los primeros 6 se van marcando solos por temporizador; el último
 * ("¡Todo preparado!") SOLO se marca cuando la petición real de
 * `finishOnboarding()` ya respondió con éxito (`ready`) — nunca miente
 * diciendo que algo está listo antes de que en verdad lo esté.
 *
 * Al terminar, YA NO avanza solo: aparece un botón "Entrar a OFINK" y la
 * pantalla solo cambia cuando el usuario lo toca (a pedido — simula mejor
 * que de verdad se está configurando todo, sin sentirse apurado). */
const FINALIZING_ITEMS = [
  'Perfil creado',
  'Agenda configurada',
  'Especialidades guardadas',
  'Políticas guardadas',
  'Mi Link generado',
  'Calendario listo',
  '¡Todo preparado!',
]
const AUTO_ITEMS = FINALIZING_ITEMS.length - 1
const STEP_MS = 550

export function OnboardingFinalizing({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [doneCount, setDoneCount] = useState(0)

  useEffect(() => {
    if (doneCount >= AUTO_ITEMS) return
    const t = setTimeout(() => setDoneCount((c) => c + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [doneCount])

  useEffect(() => {
    if (doneCount === AUTO_ITEMS && ready) {
      const t = setTimeout(() => setDoneCount(AUTO_ITEMS + 1), 500)
      return () => clearTimeout(t)
    }
  }, [doneCount, ready])

  const finished = doneCount > AUTO_ITEMS

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[110px]"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <h1 className="font-title text-2xl uppercase leading-tight">
          {finished ? '¡Listo!' : 'Configurando tu estudio digital'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {finished ? 'Todo quedó configurado correctamente.' : 'Esto tomará solo unos segundos…'}
        </p>

        <ul className="mt-8 w-full space-y-2">
          {FINALIZING_ITEMS.map((item, i) => {
            const done = i < doneCount
            return (
              <li
                key={item}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ease-out',
                  done ? 'bg-card opacity-100' : 'bg-card/30 opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
                    done ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}
                >
                  {done && <Check className="size-3 text-primary-foreground" strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className={cn('text-sm transition-colors duration-300', done ? 'text-foreground' : 'text-muted-foreground')}>
                  {item}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 h-14 w-full">
          {finished && (
            <button
              type="button"
              onClick={onDone}
              className="flex w-full animate-in fade-in items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Entrar a OFINK
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>

        {!finished && (
          <div className="mt-2">
            <Logo className="text-2xl opacity-50" />
          </div>
        )}
      </div>
    </div>
  )
}
