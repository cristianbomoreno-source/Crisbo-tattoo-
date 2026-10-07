'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import {
  LINK_PAGE_TEMPLATES,
  FONT_OPTIONS,
  type LinkPageConfig,
  type LinkPageTheme,
  type TemplateKey,
  type BackgroundConfig,
} from '@/lib/link-page/theme'
import { uploadLinkPageProfilePhoto, uploadLinkPageCoverPhoto } from '@/actions/link-page'
import { ColorField } from '@/components/settings/link-page/color-field'
import { ToggleSwitch } from '@/components/settings/link-page/toggle-switch'
import { cn } from '@/lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[1.5rem] bg-card p-4">
      <h3 className="font-title text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function PhotoField({
  label,
  url,
  onUpload,
  onClear,
  aspect,
}: {
  label: string
  url: string | null
  onUpload: (file: File) => Promise<void>
  onClear: () => void
  aspect: 'square' | 'wide'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    await onUpload(file)
    setBusy(false)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-background px-3.5 py-3">
      <div
        className={cn(
          'shrink-0 overflow-hidden bg-card/60',
          aspect === 'square' ? 'size-14 rounded-full' : 'h-14 w-24 rounded-lg'
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Camera className="size-5" strokeWidth={1.6} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-primary disabled:opacity-50"
          >
            {busy ? 'Subiendo…' : url ? 'Cambiar' : 'Subir foto'}
          </button>
          {url && (
            <button type="button" onClick={onClear} className="text-xs font-medium text-destructive">
              Quitar
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}

export function LinkPageDesignPanel({
  config,
  onChange,
}: {
  config: LinkPageConfig
  onChange: (patch: Partial<LinkPageConfig>) => void
}) {
  const theme = config.theme

  function patchTheme(patch: Partial<LinkPageTheme>) {
    onChange({ theme: { ...theme, ...patch } })
  }
  function patchColors(patch: Partial<LinkPageTheme['colors']>) {
    patchTheme({ colors: { ...theme.colors, ...patch } })
  }
  function patchBackground(patch: Partial<BackgroundConfig>) {
    patchTheme({ background: { ...theme.background, ...patch } as BackgroundConfig })
  }
  function applyTemplate(key: TemplateKey) {
    onChange({ template: key, theme: LINK_PAGE_TEMPLATES[key].theme })
  }

  async function handleProfileUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadLinkPageProfilePhoto(formData)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    onChange({ profilePhotoUrl: result.data.url })
  }
  async function handleCoverUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadLinkPageCoverPhoto(formData)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    onChange({ coverPhotoUrl: result.data.url })
  }

  return (
    <div className="space-y-4">
      <Section title="Plantillas">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(LINK_PAGE_TEMPLATES) as TemplateKey[]).map((key) => {
            const tpl = LINK_PAGE_TEMPLATES[key]
            const active = config.template === key
            const bg = tpl.theme.background
            const previewColor = bg.type === 'color' ? bg.color : bg.type === 'gradient' ? bg.from : '#000'
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyTemplate(key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-colors',
                  active ? 'border-primary' : 'border-transparent bg-background'
                )}
              >
                <span
                  className="size-9 rounded-full border"
                  style={{ backgroundColor: previewColor, borderColor: tpl.theme.colors.accent }}
                />
                <span className="text-[10px] font-medium">{tpl.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Perfil">
        <PhotoField label="Foto de perfil" url={config.profilePhotoUrl} onUpload={handleProfileUpload} onClear={() => onChange({ profilePhotoUrl: null })} aspect="square" />
        <PhotoField label="Foto de portada" url={config.coverPhotoUrl} onUpload={handleCoverUpload} onClear={() => onChange({ coverPhotoUrl: null })} aspect="wide" />
        <input
          value={config.displayName ?? ''}
          onChange={(e) => onChange({ displayName: e.target.value || null })}
          placeholder="Nombre a mostrar"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={config.badgeLabel ?? ''}
          onChange={(e) => onChange({ badgeLabel: e.target.value || null })}
          placeholder="Insignia (ej. Artista del realismo)"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={config.tagline ?? ''}
          onChange={(e) => onChange({ tagline: e.target.value || null })}
          placeholder="Frase corta (ej. Tattoo Artist)"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <textarea
          value={config.bio ?? ''}
          onChange={(e) => onChange({ bio: e.target.value || null })}
          placeholder="Bio corta"
          rows={2}
          className="w-full resize-none rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={config.locationLabel ?? ''}
          onChange={(e) => onChange({ locationLabel: e.target.value || null })}
          placeholder="Ubicación (ej. Bogotá, Colombia)"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Section>

      <Section title="Fondo">
        <div className="flex gap-1.5 rounded-xl bg-background p-1">
          {(['color', 'gradient', 'image', 'video'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                patchBackground(
                  t === 'color'
                    ? { type: 'color', color: theme.colors.card }
                    : t === 'gradient'
                      ? { type: 'gradient', from: theme.colors.card, to: '#000000', angle: 160 }
                      : t === 'image'
                        ? { type: 'image', url: '' }
                        : { type: 'video', url: '' }
                )
              }
              className={cn(
                'flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors',
                theme.background.type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {t === 'color' ? 'Color' : t === 'gradient' ? 'Degradado' : t === 'image' ? 'Imagen' : 'Video'}
            </button>
          ))}
        </div>
        {theme.background.type === 'color' && (
          <ColorField label="Color de fondo" value={theme.background.color} onChange={(hex) => patchBackground({ color: hex })} />
        )}
        {theme.background.type === 'gradient' && (
          <>
            <ColorField label="Color inicial" value={theme.background.from} onChange={(hex) => patchBackground({ from: hex })} />
            <ColorField label="Color final" value={theme.background.to} onChange={(hex) => patchBackground({ to: hex })} />
          </>
        )}
        {theme.background.type === 'image' && (
          <input
            value={theme.background.url}
            onChange={(e) => patchBackground({ url: e.target.value })}
            placeholder="URL de la imagen de fondo"
            className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        {theme.background.type === 'video' && (
          <input
            value={theme.background.url}
            onChange={(e) => patchBackground({ url: e.target.value })}
            placeholder="URL del video de fondo (MP4)"
            className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
      </Section>

      <Section title="Colores de la interfaz">
        <ColorField label="Texto" value={theme.colors.text} onChange={(hex) => patchColors({ text: hex })} />
        <ColorField label="Fondo de botones" value={theme.colors.buttonBg} onChange={(hex) => patchColors({ buttonBg: hex })} />
        <ColorField label="Texto de botones" value={theme.colors.buttonText} onChange={(hex) => patchColors({ buttonText: hex })} />
        <ColorField label="Iconos" value={theme.colors.icon} onChange={(hex) => patchColors({ icon: hex })} />
        <ColorField label="Bordes" value={theme.colors.border} onChange={(hex) => patchColors({ border: hex })} />
        <ColorField label="Tarjetas" value={theme.colors.card} onChange={(hex) => patchColors({ card: hex })} />
        <ColorField label="Acento" value={theme.colors.accent} onChange={(hex) => patchColors({ accent: hex })} />
      </Section>

      <Section title="Tipografía">
        <select
          value={theme.font.family}
          onChange={(e) => patchTheme({ font: { ...theme.font, family: e.target.value } })}
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="block rounded-xl bg-background px-3.5 py-2.5">
          <span className="flex items-center justify-between text-sm">
            <span>Tamaño</span>
            <span className="tabular-nums text-muted-foreground">{theme.font.size}px</span>
          </span>
          <input
            type="range"
            min={13}
            max={20}
            value={theme.font.size}
            onChange={(e) => patchTheme({ font: { ...theme.font, size: Number(e.target.value) } })}
            className="mt-2 w-full"
          />
        </label>
        <label className="block rounded-xl bg-background px-3.5 py-2.5">
          <span className="flex items-center justify-between text-sm">
            <span>Peso</span>
            <span className="tabular-nums text-muted-foreground">{theme.font.weight}</span>
          </span>
          <input
            type="range"
            min={400}
            max={800}
            step={100}
            value={theme.font.weight}
            onChange={(e) => patchTheme({ font: { ...theme.font, weight: Number(e.target.value) } })}
            className="mt-2 w-full"
          />
        </label>
      </Section>

      <Section title="Efectos">
        <label className="block rounded-xl bg-background px-3.5 py-2.5">
          <span className="flex items-center justify-between text-sm">
            <span>Bordes redondeados</span>
            <span className="tabular-nums text-muted-foreground">{theme.radius}px</span>
          </span>
          <input
            type="range"
            min={0}
            max={32}
            value={theme.radius}
            onChange={(e) => patchTheme({ radius: Number(e.target.value) })}
            className="mt-2 w-full"
          />
        </label>
        <div className="flex gap-1.5 rounded-xl bg-background p-1">
          {(['none', 'sm', 'md', 'lg'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patchTheme({ shadow: s })}
              className={cn(
                'flex-1 rounded-lg py-2 text-xs font-medium uppercase transition-colors',
                theme.shadow === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <ToggleSwitch label="Efecto glass (transparencias)" checked={theme.glass} onChange={(v) => patchTheme({ glass: v })} />
        <ToggleSwitch label="Animaciones suaves" checked={theme.animations} onChange={(v) => patchTheme({ animations: v })} />
      </Section>
    </div>
  )
}
