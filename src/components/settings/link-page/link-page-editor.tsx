'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowLeft, ArrowSquareOut, ArrowUp, Camera, Plus, ShareNetwork, Trash } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Icon3D } from '@/components/ui/icon-3d'
import { cn } from '@/lib/utils'
import { saveLinkPageConfig, uploadLinkPageCoverPhoto, uploadLinkPageProfilePhoto } from '@/actions/link-page'
import { createStudioLink, deleteStudioLink, reorderStudioLinks, updateStudioLink, type StudioLink } from '@/actions/studio-links'
import { updateStudioSlug } from '@/actions/studio'
import type { LinkPageConfig } from '@/lib/link-page/theme'
import { linkType } from '@/lib/link-page/types'
import { AppleLinkPage } from '@/components/studio/apple-link-page'
import { LinkEditSheet, type LinkDraft } from './link-edit-sheet'

export type EditorStudio = {
  slug: string
  name: string
  logoUrl: string | null
  mapsUrl: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  whatsapp: string | null
}

/**
 * Editor de la página de links (una sola pantalla, estilo Apple): a la
 * izquierda perfil, botones y dirección; a la derecha la vista previa REAL
 * (el mismo componente que /redes). En el celular se cambia entre Editar y
 * Vista previa arriba. El perfil se guarda solo (con pausa); los botones,
 * desde su hoja al tocar Guardar.
 */
export function LinkPageEditor({
  studio,
  publicPath,
  initialConfig,
  initialLinks,
}: {
  studio: EditorStudio
  /** /redes para el estudio principal, /l/{slug} para los demás. */
  publicPath: string
  initialConfig: LinkPageConfig
  initialLinks: StudioLink[]
}) {
  const router = useRouter()
  const [config, setConfig] = useState(initialConfig)
  const [links, setLinks] = useState(initialLinks)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [editing, setEditing] = useState<StudioLink | 'new' | null>(null)
  const [slug, setSlug] = useState(studio.slug)
  const [slugPending, startSlug] = useTransition()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef(JSON.stringify(initialConfig))

  function patch(p: Partial<LinkPageConfig>) {
    setConfig((c) => ({ ...c, ...p }))
  }

  // Autoguardado del perfil con pausa (manda el objeto completo; ver saveLinkPageConfig).
  useEffect(() => {
    const json = JSON.stringify(config)
    if (json === lastSaved.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving')
      const res = await saveLinkPageConfig(config)
      if (!res.success) {
        setSaveState('idle')
        toast.error(res.error.message)
        return
      }
      lastSaved.current = json
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    }, 700)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [config])

  async function upload(kind: 'profile' | 'cover', file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = kind === 'profile' ? await uploadLinkPageProfilePhoto(fd) : await uploadLinkPageCoverPhoto(fd)
    if (!res.success) return toast.error(res.error.message)
    patch(kind === 'profile' ? { profilePhotoUrl: res.data.url } : { coverPhotoUrl: res.data.url })
  }

  async function saveLink(draft: LinkDraft): Promise<boolean> {
    if (editing === 'new') {
      const res = await createStudioLink({ label: draft.label, url: draft.url, icon: draft.icon, subtitle: draft.subtitle ?? undefined })
      if (!res.success) {
        toast.error(res.error.message)
        return false
      }
      setLinks((l) => [...l, res.data])
      toast.success('Botón agregado')
      return true
    }
    if (editing) {
      const id = editing.id
      const res = await updateStudioLink(id, draft)
      if (!res.success) {
        toast.error(res.error.message)
        return false
      }
      setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...draft } : x)))
      return true
    }
    return false
  }

  async function removeLink(id: string) {
    setEditing(null)
    const prev = links
    setLinks((l) => l.filter((x) => x.id !== id))
    const res = await deleteStudioLink(id)
    if (!res.success) {
      setLinks(prev)
      toast.error(res.error.message)
    }
  }

  async function toggle(link: StudioLink) {
    setLinks((l) => l.map((x) => (x.id === link.id ? { ...x, enabled: !x.enabled } : x)))
    const res = await updateStudioLink(link.id, { enabled: !link.enabled })
    if (!res.success) toast.error(res.error.message)
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= links.length) return
    const next = [...links]
    ;[next[index], next[j]] = [next[j]!, next[index]!]
    setLinks(next)
    reorderStudioLinks(next.map((l) => l.id)).then((res) => {
      if (!res.success) toast.error(res.error.message)
    })
  }

  async function share() {
    const url = `${window.location.origin}${publicPath}`
    try {
      if (navigator.share) return void (await navigator.share({ title: 'Mis links', url }))
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado')
    } catch {}
  }

  const preview = (
    <AppleLinkPage
      page={{
        studioId: '',
        slug: studio.slug,
        name: studio.name,
        logoUrl: studio.logoUrl,
        displayName: config.displayName,
        profilePhotoUrl: config.profilePhotoUrl,
        coverPhotoUrl: config.coverPhotoUrl,
        bio: config.bio,
        tagline: config.tagline,
        badge: config.badgeLabel,
        location: config.locationLabel,
        mapsUrl: studio.mapsUrl,
        instagram: studio.instagram,
        tiktok: studio.tiktok,
        facebook: studio.facebook,
        website: studio.website,
        whatsapp: studio.whatsapp,
        links: links.filter((l) => l.enabled),
        isOwner: false,
      }}
    />
  )

  const slugChanged = slug !== studio.slug

  return (
    <div className="mx-auto max-w-5xl pb-24 lg:pb-8">
      {/* Encabezado */}
      <div className="mb-5">
        <Link
          href="/dashboard/settings"
          className="mb-3 inline-flex h-10 items-center gap-1 rounded-full bg-secondary pr-4 pl-2.5 text-[15px] font-semibold active:scale-[0.96]"
        >
          <ArrowLeft className="size-5" weight="bold" />
          Estudio
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="large-title">Página de links</h1>
            <p className="text-[1.0625rem] text-muted-foreground">
              crisbotattoo.com{publicPath}
              <span className="ml-2 text-[13px] font-semibold text-primary">
                {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado ✓' : ''}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-secondary px-4 text-[15px] font-semibold active:scale-[0.96]"
            >
              <ArrowSquareOut className="size-4" weight="bold" />
              Ver
            </a>
            <button
              type="button"
              onClick={share}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:scale-[0.96]"
            >
              <ShareNetwork className="size-4" weight="bold" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Celular: Editar / Vista previa */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-foreground/[0.07] p-1 lg:hidden">
        {(['edit', 'preview'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn('h-10 rounded-full text-[15px] font-semibold', mode === m ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground')}
          >
            {m === 'edit' ? 'Editar' : 'Vista previa'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className={cn('min-w-0 space-y-8', mode === 'preview' && 'hidden lg:block')}>
          {/* Perfil */}
          <section className="space-y-4">
            <h2 className="font-title text-[1.5rem] font-bold tracking-tight">Perfil</h2>
            <div className="flex items-center gap-4">
              <PhotoPicker
                label="Foto"
                url={config.profilePhotoUrl ?? studio.logoUrl}
                round
                onPick={(f) => upload('profile', f)}
                onClear={config.profilePhotoUrl ? () => patch({ profilePhotoUrl: null }) : undefined}
              />
              <PhotoPicker
                label="Portada"
                url={config.coverPhotoUrl}
                onPick={(f) => upload('cover', f)}
                onClear={config.coverPhotoUrl ? () => patch({ coverPhotoUrl: null }) : undefined}
              />
            </div>
            <Field label="Nombre" value={config.displayName} placeholder={studio.name} onChange={(v) => patch({ displayName: v })} max={40} />
            <Field label="Etiqueta (arriba del nombre)" value={config.badgeLabel} placeholder="Artista" onChange={(v) => patch({ badgeLabel: v })} max={30} />
            <Field label="Frase (debajo del nombre)" value={config.tagline} placeholder="Realismo y fine line" onChange={(v) => patch({ tagline: v })} max={60} />
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="lp-bio">Bio</Label>
                <span className="text-[12px] text-muted-foreground tabular-nums">{(config.bio ?? '').length}/160</span>
              </div>
              <Textarea
                id="lp-bio"
                value={config.bio ?? ''}
                maxLength={160}
                onChange={(e) => patch({ bio: e.target.value || null })}
                placeholder="Cuéntale a la gente qué tatúas y dónde estás"
              />
            </div>
            <Field label="Ubicación" value={config.locationLabel} placeholder="Bogotá, Colombia" onChange={(v) => patch({ locationLabel: v })} max={50} />
          </section>

          {/* Botones */}
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-title text-[1.5rem] font-bold tracking-tight">Botones</h2>
                <p className="text-[15px] text-muted-foreground">Debajo de las tarjetas de Instagram, mapa, TikTok y web.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing('new')}
                aria-label="Agregar botón"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-[0.94]"
              >
                <Plus className="size-5" weight="bold" />
              </button>
            </div>

            {links.length === 0 ? (
              <button
                type="button"
                onClick={() => setEditing('new')}
                className="flex w-full flex-col items-center gap-2 rounded-[1.5rem] border-2 border-dashed border-foreground/15 px-4 py-8 text-center active:scale-[0.99]"
              >
                <Icon3D name="link" className="size-12" />
                <span className="text-[1.0625rem] font-semibold">Agrega tu primer botón</span>
                <span className="text-[15px] text-muted-foreground">WhatsApp con mensaje, tu agenda, tu portafolio…</span>
              </button>
            ) : (
              <ul className="overflow-hidden rounded-[1.25rem] bg-card [&>li+li]:border-t [&>li+li]:border-border">
                {links.map((l, i) => {
                  const t = linkType(l.icon)
                  return (
                    <li key={l.id} className={cn('flex items-center gap-3 px-3 py-2.5', !l.enabled && 'opacity-50')}>
                      <span className={cn('grid size-11 shrink-0 place-items-center rounded-[0.8rem]', t.tone)}>
                        <Icon3D name={t.icon} className="size-8 drop-shadow-none" />
                      </span>
                      <button type="button" onClick={() => setEditing(l)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[1.0625rem] font-semibold">{l.label}</span>
                        <span className="block truncate text-[13px] text-muted-foreground">{l.subtitle || l.url.replace(/^https?:\/\//, '')}</span>
                      </button>
                      <span className="flex shrink-0 items-center gap-1">
                        <IconBtn label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp className="size-4" weight="bold" />
                        </IconBtn>
                        <IconBtn label="Bajar" disabled={i === links.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown className="size-4" weight="bold" />
                        </IconBtn>
                        <Switch on={l.enabled} onToggle={() => toggle(l)} label={l.enabled ? 'Ocultar' : 'Mostrar'} />
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Dirección */}
          <section className="space-y-3">
            <h2 className="font-title text-[1.5rem] font-bold tracking-tight">Dirección</h2>
            {publicPath === '/redes' && (
              <p className="rounded-[1.25rem] bg-card px-4 py-3 text-[15px]">
                Tu página principal es <span className="font-semibold">crisbotattoo.com/redes</span>. También abre en la dirección de abajo.
              </p>
            )}
            <div className="flex gap-2">
              <div className="flex h-12 flex-1 items-center rounded-2xl bg-foreground/[0.07] pl-4">
                <span className="shrink-0 text-[1.0625rem] text-muted-foreground">crisbotattoo.com/l/</span>
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                        .slice(0, 40),
                    )
                  }
                  aria-label="Dirección"
                  className="h-12 min-w-0 flex-1 bg-transparent pr-3 text-[1.0625rem] outline-none"
                />
              </div>
              {slugChanged && (
                <Button
                  className="h-12 px-5"
                  disabled={slugPending || slug.length < 3}
                  onClick={() =>
                    startSlug(async () => {
                      const res = await updateStudioSlug({ slug })
                      if (!res.success) return void toast.error(res.error.message)
                      toast.success('Dirección actualizada')
                      router.refresh()
                    })
                  }
                >
                  Guardar
                </Button>
              )}
            </div>
            {slugChanged && <p className="text-[13px] text-warning">Ojo: la dirección anterior deja de funcionar.</p>}
          </section>
        </div>

        {/* Vista previa real */}
        <div className={cn(mode === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-6">
            <div className="mx-auto h-[760px] max-h-[80dvh] w-full max-w-[390px] overflow-hidden rounded-[2.75rem] bg-black ring-[10px] ring-neutral-800">
              <div className="h-full overflow-y-auto [&_main]:min-h-full">{preview}</div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <LinkEditSheet
          key={editing === 'new' ? 'new' : editing.id}
          open
          initial={editing === 'new' ? null : { label: editing.label, subtitle: editing.subtitle, url: editing.url, icon: editing.icon }}
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={saveLink}
          onDelete={editing === 'new' ? undefined : () => removeLink(editing.id)}
        />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  max,
}: {
  label: string
  value: string | null
  placeholder: string
  onChange: (v: string | null) => void
  max: number
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value ?? ''} placeholder={placeholder} maxLength={max} onChange={(e) => onChange(e.target.value || null)} />
    </div>
  )
}

function PhotoPicker({
  label,
  url,
  round,
  onPick,
  onClear,
}: {
  label: string
  url: string | null
  round?: boolean
  onPick: (f: File) => void
  onClear?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <label
        className={cn(
          'relative grid cursor-pointer place-items-center overflow-hidden bg-foreground/[0.07] active:scale-95',
          round ? 'size-24 rounded-full' : 'h-24 w-40 rounded-[1.25rem]',
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <Camera className="size-7 text-muted-foreground" weight="fill" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[12px] font-semibold text-white">Cambiar</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPick(f)
            e.target.value = ''
          }}
        />
      </label>
      <span className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
        {label}
        {onClear && (
          <button type="button" onClick={onClear} aria-label={`Quitar ${label.toLowerCase()}`} className="text-destructive">
            <Trash className="size-3.5" weight="bold" />
          </button>
        )}
      </span>
    </div>
  )
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full bg-foreground/[0.07] text-muted-foreground active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** Interruptor estilo iOS. */
function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn('relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors duration-200', on ? 'bg-income' : 'bg-foreground/20')}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-7 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.3)] transition-transform duration-200 ease-out',
          on && 'translate-x-5',
        )}
      />
    </button>
  )
}
