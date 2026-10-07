/**
 * Configuración del tutorial guiado interactivo (`GuidedTour`,
 * `src/components/shared/guided-tour.tsx`). Un solo lugar para agregar,
 * quitar o reordenar pasos — el componente no tiene ningún texto ni ruta
 * hardcodeada, todo sale de acá.
 *
 * Cada paso apunta a un elemento real de la interfaz vía `data-tour="..."`
 * (ver ese atributo repartido por los componentes reales — nunca clases
 * CSS, que cambian con el rediseño). `target` es una lista de candidatos
 * en orden de preferencia: OFINK tiene versiones móvil/escritorio
 * distintas para la misma función (p. ej. el pulpo central es solo móvil,
 * escritorio tiene un botón "Nueva cotización" aparte) — el motor prueba
 * cada `data-tour` de la lista y usa el primero que esté realmente
 * visible en pantalla. Si NINGUNO está visible, el paso se omite solo
 * (nunca bloquea el recorrido).
 *
 * `target: null` = paso "flotante" sin spotlight (bienvenida, cierre).
 */

export type TourStepTarget = {
  /** Candidatos de `data-tour`, en orden de preferencia (fallback responsive). */
  keys: string[]
  /** Dónde preferir la tarjeta respecto al elemento resaltado. 'auto' decide
   * según el espacio disponible en el viewport. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}

export type TourStep = {
  /** Id estable del paso (no debe cambiar entre versiones — se usa para
   * loguear en qué paso quedó alguien, no solo el índice numérico). */
  id: string
  title: string
  body: string
  /** Ruta a la que navegar antes de mostrar este paso (si no es la actual). */
  route?: string
  target: TourStepTarget | null
}

export type TourKey = 'tatuador' | 'estudio'

/** Recorrido para cuentas de Tatuador Independiente y colaboradores
 * (members de un estudio, que ven este mismo Home). */
export const TATUADOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a OFINK',
    body: 'Un recorrido de 2 minutos por lo esencial: tu agenda, tus cotizaciones y cómo crear cosas rápido. Puedes omitirlo cuando quieras y retomarlo después desde Ajustes → Ayuda.',
    route: '/dashboard',
    target: null,
  },
  {
    id: 'home',
    title: 'Inicio',
    body: 'Todo tu día cabe en una sola pantalla: saludo, calendario, próxima sesión, resumen y caja — sin necesidad de bajar.',
    route: '/dashboard',
    target: { keys: ['home-greeting'], placement: 'bottom' },
  },
  {
    id: 'today-sessions',
    title: 'Agenda del día',
    body: 'Las citas de hoy, en orden. Tócalas para ver el proyecto, o usa el botón de cada una para marcarla como finalizada.',
    route: '/dashboard',
    target: { keys: ['home-today-sessions'], placement: 'top' },
  },
  {
    id: 'session-timer',
    title: 'Temporizador de sesión',
    body: 'Antes de empezar a tatuar, toca aquí: arranca el cronómetro de la sesión y descuenta del inventario los materiales que uses.',
    route: '/dashboard',
    target: { keys: ['session-timer'], placement: 'left' },
  },
  {
    id: 'nav-bar',
    title: 'Barra de navegación',
    body: 'Desde aquí te mueves por toda la app: Inicio, Proyectos, Cotizaciones y Estudio siempre a un toque de distancia.',
    route: '/dashboard',
    target: { keys: ['nav-bar'], placement: 'top' },
  },
  {
    id: 'nav-home',
    title: 'Inicio',
    body: 'Este botón te trae de vuelta a Inicio sin importar dónde estés.',
    route: '/dashboard',
    target: { keys: ['nav-home'], placement: 'top' },
  },
  {
    id: 'nav-quotes',
    title: 'Cotizaciones',
    body: 'Aquí llegan las solicitudes de tus clientes y las que cargas tú a mano.',
    route: '/dashboard/quotes',
    target: { keys: ['nav-quotes'], placement: 'top' },
  },
  {
    id: 'quote-create',
    title: 'Crear cotización',
    body: 'Toca aquí para cargar una cotización nueva — rápida (unos datos) o formal (con foto de referencia y detalle).',
    route: '/dashboard/quotes',
    target: { keys: ['quote-create-desktop', 'octopus-trigger'], placement: 'auto' },
  },
  {
    id: 'quotes-list',
    title: 'Lista de cotizaciones',
    body: 'Todas tus cotizaciones, con su estado — desde aquí las conviertes en proyecto en cuanto el cliente confirma.',
    route: '/dashboard/quotes',
    target: { keys: ['quotes-list'], placement: 'top' },
  },
  {
    id: 'octopus',
    title: 'El botón central',
    body: 'Tu acceso rápido: clientes, agenda, cotización rápida o formal, sin importar en qué pantalla estés.',
    route: '/dashboard/quotes',
    target: { keys: ['octopus-trigger'], placement: 'top' },
  },
  {
    id: 'calendar',
    title: 'Calendario',
    body: 'Tu agenda completa por día, semana o mes — toca cualquier día para ver el detalle.',
    route: '/dashboard',
    target: { keys: ['calendar-card'], placement: 'bottom' },
  },
  {
    id: 'calendar-create',
    title: 'Crear cita',
    body: 'Toca un día para abrir su detalle y agendar una nueva cita en el horario que quieras.',
    route: '/dashboard',
    target: { keys: ['calendar-week-strip'], placement: 'bottom' },
  },
  {
    id: 'profile',
    title: 'Perfil',
    body: 'Tu nombre, foto, ciudad y presencia pública — lo primero que ve un cliente nuevo.',
    route: '/dashboard/settings',
    target: { keys: ['settings-perfil'], placement: 'right' },
  },
  {
    id: 'services',
    title: 'Servicios',
    body: 'Define tus precios preestablecidos para cotizar más rápido.',
    route: '/dashboard/settings',
    target: { keys: ['settings-precios'], placement: 'right' },
  },
  {
    id: 'settings',
    title: 'Ajustes',
    body: 'El centro de control de tu cuenta: horario, pagos, mensajes, bot de solicitudes y todo lo que necesites personalizar.',
    route: '/dashboard/settings',
    target: { keys: ['settings-hero'], placement: 'bottom' },
  },
  {
    id: 'finish',
    title: 'Listo para empezar',
    body: 'Eso es todo. Puedes volver a ver este recorrido cuando quieras desde Ajustes → Ayuda.',
    route: '/dashboard/settings',
    target: null,
  },
]

/** Recorrido para cuentas de Estudio (dueño). */
export const ESTUDIO_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a OFINK',
    body: 'Un recorrido de 2 minutos por el panel de tu estudio: la agenda de todo el equipo, cómo sumar tatuadores y dónde ver las finanzas. Puedes retomarlo luego desde Ajustes → Ayuda.',
    route: '/dashboard',
    target: null,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    body: 'Todo lo que pasa hoy en tu estudio: quién está trabajando, alertas importantes y el resumen de ingresos del día.',
    route: '/dashboard',
    target: { keys: ['estudio-dashboard-overview'], placement: 'bottom' },
  },
  {
    id: 'agenda-general',
    title: 'Agenda general',
    body: 'La agenda de todo el equipo, hora por tatuador — sin tener que abrir la de cada uno por separado.',
    route: '/dashboard',
    target: { keys: ['estudio-agenda-grid'], placement: 'top' },
  },
  {
    id: 'team-list',
    title: 'Lista de tatuadores',
    body: 'Todos los tatuadores de tu estudio, activos e inactivos, con su estado.',
    route: '/dashboard/settings/equipo',
    target: { keys: ['team-list'], placement: 'top' },
  },
  {
    id: 'add-tatuador',
    title: 'Añadir tatuador',
    body: 'Escribe el correo de la persona que quieres invitar — si ya tiene cuenta de OFINK, la invitación le llega de una vez.',
    route: '/dashboard/settings/equipo',
    target: { keys: ['team-invite-section'], placement: 'bottom' },
  },
  {
    id: 'permisos',
    title: 'Permisos',
    body: 'Toca a un tatuador de la lista para ver y ajustar qué puede hacer dentro del estudio.',
    route: '/dashboard/settings/equipo',
    target: { keys: ['team-permissions'], placement: 'right' },
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    body: 'Ingresos, pagos y el estado financiero completo de tu estudio.',
    route: '/dashboard/settings',
    target: { keys: ['settings-finanzas'], placement: 'right' },
  },
  {
    id: 'config-estudio',
    title: 'Configuración del estudio',
    body: 'Nombre, logo, dirección y toda la presencia pública de tu estudio se configura aquí.',
    route: '/dashboard/settings',
    target: { keys: ['settings-perfil'], placement: 'right' },
  },
  {
    id: 'finish',
    title: 'Listo para empezar',
    body: 'Eso es todo. Puedes volver a ver este recorrido cuando quieras desde Ajustes → Ayuda.',
    route: '/dashboard/settings',
    target: null,
  },
]

export function tourStepsFor(tourKey: TourKey): TourStep[] {
  return tourKey === 'estudio' ? ESTUDIO_TOUR_STEPS : TATUADOR_TOUR_STEPS
}

export const OPEN_TOUR_EVENT = 'ofink:open-guided-tour'
