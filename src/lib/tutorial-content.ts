/**
 * Contenido de texto de las ayudas contextuales (`page-hint.tsx`) — el
 * banner discreto que explica una sección la primera vez que se visita.
 * El recorrido guiado con spotlight vive en `src/lib/tour/tour-config.ts`
 * (`GuidedTour`, `src/components/shared/guided-tour.tsx`).
 */

export type TutorialStep = {
  title: string
  body: string
}

/** Explicación de cada sección principal, mostrada como banner discreto la
 * primera vez que se visita esa ruta (una vez completado el recorrido de
 * arriba). Las claves son prefijos de ruta — se usa la coincidencia más
 * larga, así una subpágina de Ajustes hereda la explicación de Ajustes si
 * no tiene una propia. */
export const PAGE_HINTS: Record<string, TutorialStep> = {
  '/dashboard': {
    title: 'Inicio',
    body: 'Aquí ves tu día: próxima sesión, calendario y lo que necesita tu atención hoy.',
  },
  '/dashboard/projects': {
    title: 'Proyectos',
    body: 'Los tatuajes en marcha, con su progreso y sesiones agendadas.',
  },
  '/dashboard/quotes': {
    title: 'Cotizaciones',
    body: 'Solicitudes del bot y cotizaciones manuales. Tócalas para ver el detalle o convertirlas en proyecto.',
  },
  '/dashboard/settings': {
    title: 'Estudio',
    body: 'El centro de control de tu cuenta: perfil, precios, mensajes, bot y personalización.',
  },
  '/dashboard/clients': {
    title: 'Clientes',
    body: 'Tu base de clientes completa, con su historial de proyectos y cotizaciones.',
  },
  '/dashboard/gallery': {
    title: 'Galería',
    body: 'Fotos de tus trabajos terminados, listas para compartir o mostrar como referencia.',
  },
  '/dashboard/consents': {
    title: 'Consentimientos',
    body: 'Los consentimientos firmados por tus clientes antes de cada sesión.',
  },
  '/dashboard/stats': {
    title: 'Estadísticas',
    body: 'Cómo va tu estudio este mes: cotizado, ocupación, estilos y público.',
  },
  '/dashboard/estudio': {
    title: 'Dashboard del estudio',
    body: 'Facturación, tatuadores activos y ranking del equipo — solo visible para el dueño del estudio.',
  },
}

const HINT_KEYS_BY_LENGTH = Object.keys(PAGE_HINTS).sort((a, b) => b.length - a.length)

/** Busca el hint por coincidencia de prefijo más larga (p. ej.
 * `/dashboard/settings/perfil` cae en `/dashboard/settings`). */
export function findPageHint(pathname: string): { key: string; step: TutorialStep } | null {
  for (const key of HINT_KEYS_BY_LENGTH) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      return { key, step: PAGE_HINTS[key]! }
    }
  }
  return null
}

/** Se marca en '1' cuando el recorrido guiado (`GuidedTour`) termina o se
 * omite — las ayudas contextuales de abajo esperan a que eso pase, para no
 * apilar dos overlays a la vez. */
export const TOUR_DONE_KEY = 'ofink:tour-done'
export const HINT_SEEN_PREFIX = 'ofink:hint-seen:'
