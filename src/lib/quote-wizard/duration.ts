/** Formato/parseo de duración por sesión ("5h 00m" <-> 300 minutos).
 * Vive en un módulo plano (SIN 'use client') a propósito: `step-price.tsx`
 * (de donde salieron estas dos funciones originalmente) es un componente
 * cliente — importarlas desde ahí en un Server Component (como la página
 * de detalle de un proyecto) rompía el render de TODOS los proyectos con
 * "Algo no cargó bien". Server Components y Client Components importan
 * este archivo por igual, sin cruzar ningún límite. */

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** Inverso de `formatDuration` ("5h 00m" -> 300) — usado para precargar la
 * duración al agendar una cita desde un proyecto con la que el tatuador ya
 * eligió en la cotización (`avg_session_duration`). `null` si no matchea
 * el formato esperado (dato viejo/manual con otro texto libre). */
export function parseDurationLabel(label: string | null | undefined): number | null {
  if (!label) return null
  const match = /^(\d+)h\s*(\d+)m$/.exec(label.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}
