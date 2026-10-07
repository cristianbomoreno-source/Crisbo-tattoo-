/**
 * Mismo set de íconos que `icons.tsx`, pero como SVG plano (`<svg>`/`<path>`
 * en minúscula) en vez de los componentes de `@react-pdf/renderer` — next/og
 * (Satori) no entiende `<Svg>`/`<Path>` de react-pdf, es un motor de layout
 * distinto. Misma geometría, mismo lenguaje visual (línea verde, 1.6px).
 */

function strokeProps(color: string) {
  return { stroke: color, strokeWidth: 1.6, fill: 'none' } as const
}

export function OgIconZone({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M9 3 C6 3 5 6 6 9 L8 14 L8 21 L16 21 L16 13 L18 9 C19 6 18 3 15 3 Z" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconStyle({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M4 20 L15 9 L19 13 L8 20 Z" {...strokeProps(color)} strokeLinejoin="round" />
      <line x1={14} y1={5} x2={19} y2={10} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconColor({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M12 3 C8 8 6 11 6 14 A6 6 0 0 0 18 14 C18 11 16 8 12 3 Z" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconSize({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={3} y={9} width={18} height={6} rx={1} {...strokeProps(color)} />
      <line x1={7} y1={9} x2={7} y2={12} {...strokeProps(color)} />
      <line x1={11} y1={9} x2={11} y2={12} {...strokeProps(color)} />
      <line x1={15} y1={9} x2={15} y2={12} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconSessions({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M12 3 L21 8 L12 13 L3 8 Z" {...strokeProps(color)} strokeLinejoin="round" />
      <path d="M3 12 L12 17 L21 12" {...strokeProps(color)} strokeLinejoin="round" />
      <path d="M3 16 L12 21 L21 16" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconClock({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <circle cx={12} cy={12} r={9} {...strokeProps(color)} />
      <line x1={12} y1={7} x2={12} y2={12.5} {...strokeProps(color)} />
      <line x1={12} y1={12.5} x2={15.5} y2={14.5} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconGallery({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={3} y={5} width={18} height={14} rx={2} {...strokeProps(color)} />
      <circle cx={9} cy={10} r={1.6} {...strokeProps(color)} />
      <path d="M4 17 L9 12 L13 16 L16 13 L20 17" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconShield({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M12 3 L20 6 V11 C20 16 17 19.5 12 21 C7 19.5 4 16 4 11 V6 Z" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconDescription({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={4} y={3} width={16} height={18} rx={2} {...strokeProps(color)} />
      <line x1={8} y1={8} x2={16} y2={8} {...strokeProps(color)} />
      <line x1={8} y1={12} x2={16} y2={12} {...strokeProps(color)} />
      <line x1={8} y1={16} x2={13} y2={16} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconSkin({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <circle cx={12} cy={8} r={4} {...strokeProps(color)} />
      <path d="M4 21 C4 15 8 13 12 13 C16 13 20 15 20 21" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconService({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={3} y={8} width={18} height={12} rx={2} {...strokeProps(color)} />
      <path d="M8 8 V6 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 V8" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconAvailability({ size = 20, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={3} y={5} width={18} height={16} rx={2} {...strokeProps(color)} />
      <line x1={3} y1={10} x2={21} y2={10} {...strokeProps(color)} />
      <line x1={8} y1={3} x2={8} y2={7} {...strokeProps(color)} />
      <line x1={16} y1={3} x2={16} y2={7} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconCheck({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M4 12 L10 18 L20 6" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------- Contacto (footer) ----------

export function OgIconWhatsapp({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M4 21 L5.3 16.6 A8 8 0 1 1 8 19.2 Z" {...strokeProps(color)} strokeLinejoin="round" />
      <path d="M8.5 9.5 C8.5 12 12 15 14.5 15 C15.5 15 15.5 13.3 15 13 C14.5 12.7 13.3 12 13 12.3 C12.7 12.6 12.5 13 12.2 12.9 C11.3 12.6 10 11.5 9.7 10.5 C9.6 10.2 10 10 10.3 9.7 C10.6 9.4 9.9 8.2 9.6 7.7 C9.3 7.2 8.5 7.2 8.5 9.5 Z" {...strokeProps(color)} strokeLinejoin="round" />
    </svg>
  )
}

export function OgIconInstagram({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <rect x={3} y={3} width={18} height={18} rx={5} {...strokeProps(color)} />
      <circle cx={12} cy={12} r={4.2} {...strokeProps(color)} />
      <circle cx={17.2} cy={6.8} r={1} fill={color} stroke="none" />
    </svg>
  )
}

export function OgIconTiktok({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M14 3 C14 6.5 16.5 9 20 9" {...strokeProps(color)} strokeLinecap="round" />
      <path d="M14 3 V15.5 A4.5 4.5 0 1 1 10 11 C10.5 11 11 11.1 11.5 11.2" {...strokeProps(color)} strokeLinecap="round" />
    </svg>
  )
}

export function OgIconFacebook({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <circle cx={12} cy={12} r={9} {...strokeProps(color)} />
      <path d="M14 8.5 H12.5 A2 2 0 0 0 10.5 10.5 V21" {...strokeProps(color)} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={9} y1={13.5} x2={13.5} y2={13.5} {...strokeProps(color)} />
    </svg>
  )
}

export function OgIconWebsite({ size = 16, color = '#C8FF1A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <circle cx={12} cy={12} r={9} {...strokeProps(color)} />
      <ellipse cx={12} cy={12} rx={4} ry={9} {...strokeProps(color)} />
      <line x1={3} y1={12} x2={21} y2={12} {...strokeProps(color)} />
    </svg>
  )
}
