import { Lightbulb, MapPin, Brush, ListChecks, Check } from 'lucide-react'
import type { StepId } from './flow'

/** Fases visibles del progreso (el mockup): agrupan los StepId reales sin
 * tocar el flujo — es solo presentación. 5 fases (v0.76.0, antes 6): "Tamaño"
 * se fusionó dentro de "Idea" para calzar con la referencia visual. */
const PHASES = [
  { label: 'Idea', icon: Lightbulb, steps: ['phone', 'name', 'gender', 'age', 'service', 'other', 'size'] },
  { label: 'Ubicación', icon: MapPin, steps: ['zone', 'subzone'] },
  { label: 'Estilo', icon: Brush, steps: ['color', 'skin', 'style'] },
  { label: 'Detalles', icon: ListChecks, steps: ['photos', 'description', 'contact', 'availability'] },
  { label: 'Listo', icon: Check, steps: ['summary'] },
] as const

function phaseIndexFor(step: StepId): number {
  const i = PHASES.findIndex(p => (p.steps as readonly string[]).includes(step))
  return i === -1 ? 0 : i
}

/** Textos emocionales por paso (títulos grandes + subtexto persuasivo).
 * Solo presentación: las preguntas "reales" del history (`questionFor`) no cambian. */
export const STEP_HEADERS: Record<StepId, { title: string; subtitle: string }> = {
  name: { title: 'Todo comienza con una idea.', subtitle: 'Primero lo primero: ¿cómo te llamas? Escribe tu nombre y apellido.' },
  gender: { title: 'Un dato más.', subtitle: 'Nos ayuda a mostrarte referencias más precisas.' },
  age: { title: '¿Cuándo naciste?', subtitle: 'Elegí tu fecha de nacimiento — calculamos tu edad automáticamente.' },
  service: { title: '¿Qué quieres llevar en tu piel?', subtitle: 'Cuéntame qué tienes en mente para empezar a darle forma.' },
  other: { title: 'Cuéntame tu caso.', subtitle: 'Escríbeme el motivo de tu consulta y todos los datos que creas relevantes.' },
  size: { title: '¿De qué tamaño lo imaginas?', subtitle: 'Esto nos ayuda a estimar mejor el tiempo, el nivel de detalle y el valor aproximado del proyecto.' },
  zone: { title: 'Ubiquemos tu tatuaje.', subtitle: 'Recorré tu cuerpo hasta llegar a la zona exacta.' },
  subzone: { title: 'Afinemos la zona.', subtitle: '¿En qué parte exactamente lo imaginas?' },
  color: { title: '¿Cómo te lo imaginas?', subtitle: 'Elige la opción que más se acerque a lo que tienes en mente.' },
  skin: { title: 'Hablemos de tu piel.', subtitle: 'El tono de piel nos ayuda a elegir la mejor técnica para que luzca increíble.' },
  style: { title: 'Definamos el estilo de tu tatuaje.', subtitle: 'Cada estilo transmite algo distinto. ¿Cuál conecta más contigo?' },
  photos: { title: 'Inspírame.', subtitle: 'Sube imágenes que se acerquen a lo que imaginas. Pueden ser tatuajes, fotos, ilustraciones, lo que quieras.' },
  description: { title: 'Cuéntame la historia.', subtitle: 'Este es el corazón del tatuaje. ¿Qué significado tiene? ¿Qué quieres transmitir? ¿Qué no puede faltar?' },
  phone: { title: 'Empecemos por lo básico.', subtitle: 'Tu WhatsApp — si ya nos escribiste antes, te reconocemos al toque.' },
  contact: { title: 'Ya casi.', subtitle: 'Déjame tu email para enviarte la cotización personalizada.' },
  availability: { title: '¿Cuándo te viene bien?', subtitle: 'Elegí los días que más te acomoden — te mostramos los que el estudio tiene libres.' },
  summary: { title: 'Casi terminamos.', subtitle: 'Revisa tu proyecto antes de enviarlo y comenzar a crear tu cotización.' },
}

export function IntakeProgress({ current }: { current: StepId }) {
  const active = phaseIndexFor(current)

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90">
          Tu proyecto
        </p>
        <p className="font-heading text-[10px] tabular-nums tracking-wider text-muted-foreground">
          {active + 1} / {PHASES.length}
        </p>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        {PHASES.map((p, i) => (
          <span key={p.label} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: i < active ? '100%' : i === active ? '55%' : '0%' }}
              aria-hidden
            />
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-start justify-between">
        {PHASES.map((p, i) => {
          const Icon = p.icon
          const state = i < active ? 'done' : i === active ? 'active' : 'todo'
          return (
            <div key={p.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className="grid size-7 place-items-center rounded-full border transition-all duration-300"
                style={{
                  borderColor: state === 'todo' ? 'rgba(255,255,255,0.14)' : 'var(--primary)',
                  color: state === 'todo' ? 'rgba(255,255,255,0.3)' : state === 'active' ? '#000' : 'var(--primary)',
                  backgroundColor:
                    state === 'active' ? 'var(--primary)' : state === 'done' ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent',
                  boxShadow: state === 'active' ? '0 0 14px -2px var(--primary-glow, rgba(184,244,0,0.5))' : 'none',
                }}
              >
                {state === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
              </span>
              <span
                className="text-center text-[7.5px] font-semibold uppercase tracking-wider transition-colors"
                style={{ color: state === 'todo' ? 'rgba(255,255,255,0.3)' : 'var(--primary)' }}
              >
                {p.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
