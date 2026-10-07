/** Módulos que el admin de OFINK puede activar/desactivar por estudio,
 * de cara a futuras suscripciones. Todo estudio nuevo empieza con todo
 * encendido — solo se restringe si un admin lo apaga a mano en /admin.
 * Al agregar un módulo nuevo aquí, protegerlo con `FeatureGate` en la
 * navegación (ver nav-items.tsx). */
export type FeatureKey =
  | 'inventory'
  | 'finances'
  | 'bot'
  | 'public_page'
  | 'team'
  | 'consents'
  | 'gallery'

export const STUDIO_FEATURES: { key: FeatureKey; label: string }[] = [
  { key: 'inventory', label: 'Inventario' },
  { key: 'finances', label: 'Finanzas' },
  { key: 'bot', label: 'Bot de WhatsApp' },
  { key: 'public_page', label: 'Página pública' },
  { key: 'team', label: 'Equipo (multi-tatuador)' },
  { key: 'consents', label: 'Consentimientos' },
  { key: 'gallery', label: 'Galería' },
]
