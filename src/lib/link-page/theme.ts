import {
  MessageCircle,
  Image as ImageIcon,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Globe,
  Link2,
  Star,
  Heart,
  Calendar,
  Phone,
  Mail,
  Camera,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

// ── Tipos ───────────────────────────────────────────────────────────────

export type BackgroundConfig =
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'image'; url: string }
  | { type: 'video'; url: string }

export type LinkPageColors = {
  text: string
  buttonBg: string
  buttonText: string
  icon: string
  border: string
  card: string
  accent: string
}

export type LinkPageTheme = {
  background: BackgroundConfig
  colors: LinkPageColors
  font: { family: string; size: number; weight: number }
  radius: number
  shadow: 'none' | 'sm' | 'md' | 'lg'
  glass: boolean
  animations: boolean
}

export type TemplateKey = 'minimal' | 'premium' | 'dark' | 'luxury' | 'neon' | 'apple' | 'glass'

export type LinkPageConfig = {
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  displayName: string | null
  bio: string | null
  tagline: string | null
  badgeLabel: string | null
  locationLabel: string | null
  template: TemplateKey
  theme: LinkPageTheme
}

// ── Plantillas prediseñadas ─────────────────────────────────────────────
// Elegir una aplica su `theme` completo — sigue siendo 100% editable después.

export const LINK_PAGE_TEMPLATES: Record<TemplateKey, { label: string; theme: LinkPageTheme }> = {
  dark: {
    label: 'Dark',
    theme: {
      background: { type: 'color', color: '#0A0A0A' },
      colors: { text: '#FFFFFF', buttonBg: '#16181C', buttonText: '#FFFFFF', icon: '#A8FF60', border: '#A8FF60', card: '#14161A', accent: '#A8FF60' },
      font: { family: 'Inter', size: 15, weight: 600 },
      radius: 18,
      shadow: 'md',
      glass: false,
      animations: true,
    },
  },
  minimal: {
    label: 'Minimal',
    theme: {
      background: { type: 'color', color: '#FFFFFF' },
      colors: { text: '#111111', buttonBg: '#F5F5F5', buttonText: '#111111', icon: '#111111', border: '#E5E5E5', card: '#FAFAFA', accent: '#111111' },
      font: { family: 'Inter', size: 15, weight: 500 },
      radius: 12,
      shadow: 'none',
      glass: false,
      animations: true,
    },
  },
  premium: {
    label: 'Premium',
    theme: {
      background: { type: 'gradient', from: '#1A1A1A', to: '#2B2412', angle: 160 },
      colors: { text: '#F5EEDD', buttonBg: '#1C1C1C', buttonText: '#F5EEDD', icon: '#D4AF37', border: '#D4AF37', card: '#1C1C1C', accent: '#D4AF37' },
      font: { family: 'Poppins', size: 15, weight: 600 },
      radius: 16,
      shadow: 'md',
      glass: false,
      animations: true,
    },
  },
  luxury: {
    label: 'Luxury',
    theme: {
      background: { type: 'color', color: '#0D0D0D' },
      colors: { text: '#EDEDED', buttonBg: '#161616', buttonText: '#EDEDED', icon: '#C9A227', border: '#C9A227', card: '#161616', accent: '#C9A227' },
      font: { family: 'Poppins', size: 15, weight: 700 },
      radius: 6,
      shadow: 'lg',
      glass: false,
      animations: true,
    },
  },
  neon: {
    label: 'Neon',
    theme: {
      background: { type: 'gradient', from: '#050014', to: '#0D002B', angle: 145 },
      colors: { text: '#FFFFFF', buttonBg: '#0F0524', buttonText: '#FFFFFF', icon: '#FF2E92', border: '#39FF14', card: '#0F0524', accent: '#39FF14' },
      font: { family: 'Poppins', size: 15, weight: 600 },
      radius: 22,
      shadow: 'lg',
      glass: true,
      animations: true,
    },
  },
  apple: {
    label: 'Apple',
    theme: {
      background: { type: 'color', color: '#F5F5F7' },
      colors: { text: '#1D1D1F', buttonBg: '#FFFFFF', buttonText: '#1D1D1F', icon: '#0071E3', border: '#D2D2D7', card: '#FFFFFF', accent: '#0071E3' },
      font: { family: 'Inter', size: 15, weight: 500 },
      radius: 20,
      shadow: 'sm',
      glass: true,
      animations: true,
    },
  },
  glass: {
    label: 'Glass',
    theme: {
      background: { type: 'gradient', from: '#1A1A2E', to: '#16213E', angle: 150 },
      colors: { text: '#FFFFFF', buttonBg: '#FFFFFF', buttonText: '#FFFFFF', icon: '#7FDBFF', border: '#FFFFFF', card: '#FFFFFF', accent: '#7FDBFF' },
      font: { family: 'Inter', size: 15, weight: 500 },
      radius: 20,
      shadow: 'lg',
      glass: true,
      animations: true,
    },
  },
}

export const DEFAULT_THEME: LinkPageTheme = LINK_PAGE_TEMPLATES.dark.theme

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Caveat', label: 'Caveat (script)' },
  { value: 'Georgia', label: 'Georgia (serif)' },
  { value: 'system-ui', label: 'Sistema' },
]

// ── Catálogo de iconos para los enlaces ─────────────────────────────────

export const LINK_ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'portfolio', label: 'Portafolio', icon: ImageIcon },
  { key: 'quote', label: 'Cotizar', icon: MessageSquare },
  { key: 'shop', label: 'Tienda', icon: ShoppingBag },
  { key: 'location', label: 'Ubicación', icon: MapPin },
  { key: 'website', label: 'Web', icon: Globe },
  { key: 'link', label: 'Enlace', icon: Link2 },
  { key: 'star', label: 'Destacado', icon: Star },
  { key: 'heart', label: 'Favorito', icon: Heart },
  { key: 'calendar', label: 'Agenda', icon: Calendar },
  { key: 'phone', label: 'Teléfono', icon: Phone },
  { key: 'mail', label: 'Correo', icon: Mail },
  { key: 'camera', label: 'Galería', icon: Camera },
  { key: 'sparkles', label: 'Especial', icon: Sparkles },
]

export function iconFor(key: string): LucideIcon {
  return LINK_ICON_OPTIONS.find((o) => o.key === key)?.icon ?? Link2
}
