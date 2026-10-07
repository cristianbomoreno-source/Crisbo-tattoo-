import type { CSSProperties } from 'react'
import type { LinkPageTheme, BackgroundConfig } from '@/lib/link-page/theme'

/** '#RRGGBB' → 'rgba(r,g,b,a)'. Si no es hex válido, devuelve el color tal cual. */
export function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!match) return hex
  const [, r, g, b] = match
  return `rgba(${parseInt(r!, 16)}, ${parseInt(g!, 16)}, ${parseInt(b!, 16)}, ${alpha})`
}

const SHADOW_MAP: Record<LinkPageTheme['shadow'], string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.18)',
  md: '0 6px 18px rgba(0,0,0,0.28)',
  lg: '0 14px 34px rgba(0,0,0,0.4)',
}

export function backgroundStyle(bg: BackgroundConfig): CSSProperties {
  if (bg.type === 'color') return { backgroundColor: bg.color }
  if (bg.type === 'gradient') return { backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }
  if (bg.type === 'image') return { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  return { backgroundColor: '#000000' } // video: el <video> va aparte, esto es el color de respaldo
}

export function cardStyle(theme: LinkPageTheme): CSSProperties {
  return {
    backgroundColor: theme.glass ? hexToRgba(theme.colors.card, 0.14) : theme.colors.card,
    color: theme.colors.buttonText,
    borderRadius: theme.radius,
    boxShadow: SHADOW_MAP[theme.shadow],
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.glass ? hexToRgba(theme.colors.border, 0.3) : theme.colors.border,
    backdropFilter: theme.glass ? 'blur(16px)' : undefined,
    WebkitBackdropFilter: theme.glass ? 'blur(16px)' : undefined,
  }
}

export function fontStyle(theme: LinkPageTheme): CSSProperties {
  return {
    fontFamily: theme.font.family,
    fontSize: theme.font.size,
    fontWeight: theme.font.weight,
    color: theme.colors.text,
  }
}
