import { INTAKE_ZONES } from '@/lib/validations/intake'

/** Posición (%) de cada zona sobre la silueta, viewBox 0 0 200 420.
 * Figura genérica, no anatómicamente literal — suficiente para transmitir
 * "elegí sobre el cuerpo" en vez de una lista de texto. Compartida entre el
 * selector de zona del bot (`body-zone-picker.tsx`) y el mapa de calor de
 * Estadísticas (`stats-zones-map.tsx`). */
export const ZONE_POINTS: Partial<Record<typeof INTAKE_ZONES[number], { x: number; y: number }>> = {
  Cabeza: { x: 100, y: 32 },
  Cuello: { x: 100, y: 64 },
  Hombro: { x: 146, y: 94 },
  Pecho: { x: 100, y: 122 },
  Espalda: { x: 58, y: 118 },
  Costillas: { x: 72, y: 140 },
  Abdomen: { x: 100, y: 155 },
  Cintura: { x: 100, y: 178 },
  Brazo: { x: 152, y: 172 },
  Antebrazo: { x: 168, y: 150 },
  Muñeca: { x: 164, y: 230 },
  Mano: { x: 160, y: 258 },
  Ingle: { x: 100, y: 242 },
  Glúteo: { x: 100, y: 228 },
  Muslo: { x: 80, y: 280 },
  Pierna: { x: 84, y: 300 },
  Pantorrilla: { x: 78, y: 345 },
  Tobillo: { x: 76, y: 388 },
  Pie: { x: 100, y: 396 },
}

export const ZONES_ON_FIGURE = INTAKE_ZONES.filter((z) => ZONE_POINTS[z])

/** `<g>` con la silueta base (cabeza, torso, brazos, piernas). Mismo trazo en
 * ambos lugares — se importa como componente para no duplicar el markup SVG. */
export function BodySilhouette({ className }: { className?: string }) {
  return (
    <g className={className} fill="#1c1c1e" stroke="rgba(255,255,255,0.08)">
      <circle cx="100" cy="34" r="22" />
      <rect x="92" y="54" width="16" height="18" rx="6" />
      <path d="M62 74 Q100 60 138 74 L150 168 Q100 190 50 168 Z" />
      <path d="M50 84 L20 172 Q18 190 34 194 L58 100 Z" />
      <path d="M150 84 L180 172 Q182 190 166 194 L142 100 Z" />
      <ellipse cx="27" cy="200" rx="13" ry="10" />
      <ellipse cx="173" cy="200" rx="13" ry="10" />
      <path d="M55 168 Q100 182 145 168 L152 250 Q100 268 48 250 Z" />
      <path d="M60 248 L52 388 Q52 402 68 402 L80 320 L86 402 Q100 404 100 388 L96 248 Z" />
      <path d="M140 248 L148 388 Q148 402 132 402 L120 320 L114 402 Q100 404 100 388 L104 248 Z" />
      <ellipse cx="66" cy="405" rx="16" ry="8" />
      <ellipse cx="134" cy="405" rx="16" ry="8" />
    </g>
  )
}
