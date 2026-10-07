/** Preview de cada función: si hay una captura real de la app (carpeta
 * `public/feedback/`, las que nos compartió el equipo) se usa esa; si no,
 * se cae a la ilustración genérica por tipo (`PreviewKind`) — ver
 * `feature-preview.tsx`. */
export type PreviewKind =
  | 'home'
  | 'calendar'
  | 'clients'
  | 'quotes'
  | 'projects'
  | 'consents'
  | 'gallery'
  | 'payments'
  | 'inventory'
  | 'bot'
  | 'settings'
  | 'team'
  | 'public-page'
  | 'notifications'

export type FeatureItem = {
  key: string
  label: string
  description: string
  preview: PreviewKind
  /** Ruta bajo /public — captura real de la app, si la tenemos. */
  screenshot?: string
}

export type FeatureSection = {
  key: string
  title: string
  features: FeatureItem[]
}

export const FEEDBACK_SECTIONS: FeatureSection[] = [
  {
    key: 'inicio',
    title: 'Inicio',
    features: [
      {
        key: 'home_dashboard',
        label: 'Dashboard de Inicio',
        description: 'El saludo, el calendario, la próxima sesión y el resumen del día.',
        preview: 'home',
        screenshot: '/feedback/home-estudio.png',
      },
      {
        key: 'home_notifications',
        label: 'Notificaciones',
        description: 'La campana con avisos de cotizaciones nuevas y alertas.',
        preview: 'notifications',
        screenshot: '/feedback/home-tatuador.png',
      },
    ],
  },
  {
    key: 'agenda',
    title: 'Agenda',
    features: [
      {
        key: 'calendar_view',
        label: 'Calendario (día/semana/mes)',
        description: 'Ver y moverte entre tus citas agendadas.',
        preview: 'calendar',
        screenshot: '/feedback/calendario-mes.png',
      },
      {
        key: 'calendar_scheduling',
        label: 'Agendar y reprogramar citas',
        description: 'Crear una cita nueva o mover una existente.',
        preview: 'calendar',
        screenshot: '/feedback/agendar-cita.png',
      },
      {
        key: 'calendar_blocked_days',
        label: 'Bloquear horarios/fechas',
        description: 'Marcar días u horas en los que no atiendes.',
        preview: 'calendar',
        screenshot: '/feedback/home-tatuador.png',
      },
    ],
  },
  {
    key: 'clientes',
    title: 'Clientes',
    features: [
      {
        key: 'clients_list',
        label: 'Lista de clientes',
        description: 'Buscar y ver el historial de cada cliente.',
        preview: 'clients',
        screenshot: '/feedback/pulpo-menu.png',
      },
      {
        key: 'clients_create',
        label: 'Crear/editar cliente',
        description: 'Guardar los datos de contacto de un cliente nuevo.',
        preview: 'clients',
      },
    ],
  },
  {
    key: 'cotizaciones',
    title: 'Cotizaciones',
    features: [
      {
        key: 'quotes_wizard',
        label: 'Crear cotización',
        description: 'El formulario paso a paso para cotizar un tatuaje.',
        preview: 'quotes',
        screenshot: '/feedback/nueva-cotizacion-cliente.png',
      },
      {
        key: 'quotes_list',
        label: 'Lista de cotizaciones',
        description: 'Solicitudes del bot y cotizaciones manuales, todas en un lugar.',
        preview: 'quotes',
        screenshot: '/feedback/cotizaciones-vacio.png',
      },
      {
        key: 'quotes_public_link',
        label: 'Enlace público de cotización',
        description: 'La página que le llega al cliente para aprobar/pagar.',
        preview: 'quotes',
      },
    ],
  },
  {
    key: 'proyectos',
    title: 'Proyectos',
    features: [
      {
        key: 'projects_tracking',
        label: 'Seguimiento de proyectos',
        description: 'Ver el progreso, sesiones y saldo de cada proyecto.',
        preview: 'projects',
        screenshot: '/feedback/proyectos.png',
      },
      {
        key: 'projects_gallery',
        label: 'Galería de fotos por proyecto',
        description: 'Subir y organizar fotos del trabajo en curso/terminado.',
        preview: 'gallery',
      },
    ],
  },
  {
    key: 'consentimientos',
    title: 'Consentimientos',
    features: [
      {
        key: 'consents_signing',
        label: 'Firma de consentimientos',
        description: 'Que el cliente firme el consentimiento informado.',
        preview: 'consents',
      },
    ],
  },
  {
    key: 'pagos',
    title: 'Pagos y finanzas',
    features: [
      {
        key: 'payments_methods',
        label: 'Métodos de pago',
        description: 'Cómo te pueden pagar tus clientes (efectivo, Nequi, transferencia...).',
        preview: 'payments',
        screenshot: '/feedback/metodos-pago.png',
      },
      {
        key: 'payments_register',
        label: 'Registrar pagos/abonos',
        description: 'Anotar un pago recibido de un cliente.',
        preview: 'payments',
      },
      {
        key: 'finances_overview',
        label: 'Resumen de finanzas',
        description: 'Ingresos, pendientes y gastos del estudio.',
        preview: 'payments',
      },
    ],
  },
  {
    key: 'inventario',
    title: 'Inventario',
    features: [
      {
        key: 'inventory_stock',
        label: 'Control de inventario',
        description: 'Materiales, existencias y consumo por sesión.',
        preview: 'inventory',
        screenshot: '/feedback/estudio-checklist.png',
      },
    ],
  },
  {
    key: 'bot',
    title: 'Bot de WhatsApp',
    features: [
      {
        key: 'bot_messages',
        label: 'Mensajes automáticos',
        description: 'Recordatorios y plantillas que le llegan al cliente.',
        preview: 'bot',
        screenshot: '/feedback/bot-plantillas.png',
      },
    ],
  },
  {
    key: 'ajustes',
    title: 'Ajustes',
    features: [
      {
        key: 'settings_profile',
        label: 'Perfil y personalización',
        description: 'Logo, colores y datos de tu perfil/estudio.',
        preview: 'settings',
        screenshot: '/feedback/estudio-banner-ofink.png',
      },
      {
        key: 'settings_pricing',
        label: 'Precios y calendario',
        description: 'Precios preestablecidos y el intervalo de horas al agendar.',
        preview: 'settings',
        screenshot: '/feedback/precios-calendario.png',
      },
      {
        key: 'settings_public_page',
        label: 'Página pública (enlace tipo Linktree)',
        description: 'La página que compartes con tus redes.',
        preview: 'public-page',
      },
      {
        key: 'settings_team',
        label: 'Equipo (cuentas de Estudio)',
        description: 'Invitar tatuadores y administrar permisos.',
        preview: 'team',
        screenshot: '/feedback/equipo.png',
      },
    ],
  },
]

export const TOTAL_FEATURES = FEEDBACK_SECTIONS.reduce((sum, s) => sum + s.features.length, 0)
