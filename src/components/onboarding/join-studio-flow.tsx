'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, MapPin, Users } from 'lucide-react'
import { findStudioByJoinCode, requestToJoinStudio, type StudioSearchResult } from '@/actions/team'
import { Button } from '@/components/ui/button'

const INPUT_CLASS =
  'w-full bg-transparent text-base font-semibold uppercase tracking-wider text-foreground placeholder:text-muted-foreground placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none'

export function JoinStudioFlow({ defaultName }: { defaultName: string }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [studio, setStudio] = useState<StudioSearchResult | null>(null)
  const [name, setName] = useState(defaultName)
  const [specialty, setSpecialty] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await findStudioByJoinCode(code)
    setLoading(false)
    if (!result.success) {
      setError(result.error.message)
      return
    }
    setStudio(result.data)
  }

  async function handleRequest() {
    if (!studio) return
    setError(null)
    setLoading(true)
    const result = await requestToJoinStudio({ studioId: studio.id, name, specialty })
    setLoading(false)
    if (!result.success) {
      setError(result.error.message)
      return
    }
    router.push('/onboarding/pending')
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-x-hidden bg-background px-4 py-12">
      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => (studio ? setStudio(null) : router.push('/onboarding/choose'))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Atrás
        </button>

        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Únete a un estudio</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Solicita a tu administrador el código de acceso del estudio.
          </p>
        </div>

        {!studio ? (
          <form onSubmit={handleSearch} className="mt-8 space-y-4">
            <label className="flex cursor-text items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5">
              <Search className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
              <input
                className={INPUT_CLASS}
                placeholder="OFK-9X2L8"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? 'Buscando…' : 'Buscar estudio'}
            </Button>
          </form>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="rounded-3xl border border-white/10 bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
                  {studio.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={studio.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Users className="size-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{studio.name}</p>
                  {studio.city && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {studio.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-muted-foreground">
                {studio.ownerName && <span>Administrador: {studio.ownerName}</span>}
                <span>{studio.artistCount} tatuadores activos</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-text items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5">
                <input
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="flex cursor-text items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5">
                <input
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="Especialidad (opcional)"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="button"
              onClick={handleRequest}
              className="w-full"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Enviando…' : 'Solicitar acceso'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
