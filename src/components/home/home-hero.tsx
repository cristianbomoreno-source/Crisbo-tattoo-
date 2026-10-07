import { firstName } from '@/lib/home/month-metrics'
import { WorkShiftCard } from '@/components/home/work-shift-card'

/** Frases cortas, puramente decorativas (no son datos del negocio) —
 * rotan por día del mes para variar sin necesitar estado ni configuración. */
const PHRASES = [
  'Hoy escribirás nuevas historias sobre la piel.',
  'Cada tatuaje cuenta una historia — hoy sigues la tuya.',
  'Tu trabajo deja huella para siempre.',
  'Un buen día empieza con una buena idea.',
  'Hoy es un gran día para crear algo único.',
]

/**
 * Hero del Home EXCLUSIVO para iPad/escritorio (`hidden md:block` desde
 * `dashboard/page.tsx`). Portada configurable (Ajustes → Perfil del
 * estudio → Foto de portada); sin foto, fondo oscuro con textura. Sobre la
 * imagen: saludo + nombre + fecha + frase, y la tarjeta de jornada
 * alineada a la derecha — nada más se dibuja encima de la portada.
 */
export function HomeHero({
  name,
  greeting,
  dateLabel,
  coverPhotoUrl,
  activeShift,
}: {
  name: string | null
  greeting: string
  dateLabel: string
  coverPhotoUrl: string | null
  activeShift: { id: string; startedAt: string } | null
}) {
  const who = name ? firstName(name) : 'OFINK'
  const phrase = PHRASES[new Date().getDate() % PHRASES.length]

  return (
    <section className="relative flex min-h-[300px] w-full items-end overflow-hidden rounded-[2rem] p-8 lg:min-h-[340px]">
      {/* Fondo: portada configurable, o textura oscura por defecto. */}
      <div className="absolute inset-0 -z-10 bg-black">
        {coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhotoUrl} alt="" className="size-full object-cover" />
        ) : (
          <div
            className="size-full opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(163,255,18,0.12), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.06), transparent 40%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      </div>

      <div className="flex w-full items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm text-white/70">{greeting}</p>
          <h1 className="-mt-1 truncate font-title text-6xl leading-[0.95] tracking-[0.005em] text-primary lg:text-7xl">
            {who}
          </h1>
          <p className="mt-2 text-sm text-white/60">{dateLabel}</p>
          <p className="mt-2 max-w-md text-sm text-white/50">&ldquo;{phrase}&rdquo;</p>
        </div>

        <WorkShiftCard activeShift={activeShift} />
      </div>
    </section>
  )
}
