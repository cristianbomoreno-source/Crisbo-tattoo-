'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock3, XCircle } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

/** Sondea cada 10s: si el owner aprueba, `getCurrentStudio` ya encuentra la
 * fila de `artists` y basta un refresh de la ruta para caer a `/dashboard`
 * (la propia page hace `redirect` cuando `existingArtist` existe). */
export function PendingApproval({
  studioName,
  rejected,
}: {
  studioName: string
  rejected: boolean
}) {
  const router = useRouter()

  useEffect(() => {
    if (rejected) return
    const interval = setInterval(() => router.refresh(), 10_000)
    return () => clearInterval(interval)
  }, [rejected, router])

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-12">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <Logo full className="text-5xl" />

        <div className="mt-10 flex size-16 items-center justify-center rounded-full bg-primary/10">
          {rejected ? (
            <XCircle className="size-8 text-destructive" strokeWidth={1.6} />
          ) : (
            <Clock3 className="size-8 text-primary" strokeWidth={1.6} />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {rejected ? 'Solicitud no aprobada' : 'Esperando aprobación'}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          {rejected
            ? `El estudio ${studioName} no aprobó tu solicitud de ingreso.`
            : `Le avisamos a ${studioName} que quieres unirte. Te dejamos entrar apenas te aprueben.`}
        </p>

        {rejected && (
          <Button className="mt-8 w-full" onClick={() => router.push('/onboarding/choose')}>
            Volver a intentar
          </Button>
        )}
      </div>
    </div>
  )
}
