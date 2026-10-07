'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Eye, X } from 'lucide-react'
import { saveLinkPageConfig } from '@/actions/link-page'
import type { LinkPageConfig } from '@/lib/link-page/theme'
import type { StudioLink } from '@/actions/studio-links'
import { LinkPageDesignPanel } from '@/components/settings/link-page/design-panel'
import { LinkPageLinksEditor } from '@/components/settings/link-page/links-editor'
import { LinkTreePage, type LinkTreeLink } from '@/components/studio/link-tree-page'
import { cn } from '@/lib/utils'

type Socials = {
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  whatsapp: string | null
}

export function LinkPageCustomizer({
  slug,
  studioName,
  socials,
  initialConfig,
  initialLinks,
}: {
  slug: string
  studioName: string
  socials: Socials
  initialConfig: LinkPageConfig
  initialLinks: StudioLink[]
}) {
  const [config, setConfig] = useState(initialConfig)
  const [tab, setTab] = useState<'design' | 'links'>('design')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [previewOpen, setPreviewOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipFirstSave = useRef(true)

  function patchConfig(patch: Partial<LinkPageConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false
      return
    }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const result = await saveLinkPageConfig(config)
      setSaveState(result.success ? 'saved' : 'idle')
      if (result.success) {
        setTimeout(() => setSaveState('idle'), 1500)
      }
    }, 800)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
     
  }, [config])

  const previewLinks: LinkTreeLink[] = initialLinks
    .filter((l) => l.enabled)
    .map((l) => ({ id: l.id, label: l.label, subtitle: l.subtitle, url: l.url, icon: l.icon, color: l.color }))

  const previewNode = (
    <LinkTreePage
      slug={slug}
      studioName={studioName}
      instagram={socials.instagram}
      tiktok={socials.tiktok}
      facebook={socials.facebook}
      website={socials.website}
      whatsapp={socials.whatsapp}
      links={previewLinks}
      config={config}
      isOwner={false}
    />
  )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/dashboard/settings/enlace" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          Enlaces
        </Link>
        <span className="text-xs text-muted-foreground">
          {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado ✓' : ''}
        </span>
      </div>

      <h1 className="mb-4 font-title text-2xl uppercase leading-none">Personalizar mi link</h1>

      <div className="mb-4 flex gap-1.5 rounded-xl bg-card p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setTab('design')}
          className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === 'design' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          Diseño
        </button>
        <button
          type="button"
          onClick={() => setTab('links')}
          className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === 'links' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          Enlaces
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="hidden lg:block">
            <div className="mb-4 flex gap-1.5 rounded-xl bg-card p-1">
              <button
                type="button"
                onClick={() => setTab('design')}
                className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === 'design' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Diseño
              </button>
              <button
                type="button"
                onClick={() => setTab('links')}
                className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === 'links' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Enlaces
              </button>
            </div>
          </div>

          {tab === 'design' ? (
            <LinkPageDesignPanel config={config} onChange={patchConfig} />
          ) : (
            <LinkPageLinksEditor initialLinks={initialLinks} />
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[2rem] bg-black" style={{ aspectRatio: '9/18', maxHeight: '80vh' }}>
            <div className="size-full overflow-y-auto">{previewNode}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg lg:hidden"
      >
        <Eye className="size-4" />
        Vista previa
      </button>

      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black lg:hidden"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewOpen(false)
            }}
            aria-label="Cerrar vista previa"
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white active:bg-white/25"
          >
            <X className="size-5" />
          </button>
          <div className="size-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {previewNode}
          </div>
        </div>
      )}
    </div>
  )
}
