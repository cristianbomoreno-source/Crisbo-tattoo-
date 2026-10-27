'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

import { updateStudioSlug } from '@/actions/studio'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

/** Saneo en vivo del slug — mismo que el onboarding (step-socials.tsx). */
function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
}

export function EnlaceForm({ initialSlug }: { initialSlug: string }) {
  const router = useRouter()
  const [slug, setSlug] = useState(initialSlug)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const url = `${origin}/l/${slug}`
  const changed = slug !== initialSlug

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`)
    setCopied(true)
    toast.success('Enlace copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    startTransition(async () => {
      const result = await updateStudioSlug({ slug })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Enlace actualizado')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage title="Página de links" description="Tu página con todos tus enlaces, como Linktree. Aquí eliges la dirección y los botones.">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="settings-slug">Tu enlace</Label>
          <div className="flex gap-2">
            <div className="flex h-12 flex-1 items-center rounded-2xl bg-foreground/[0.07] pl-4">
              <span className="shrink-0 text-[1.0625rem] text-muted-foreground">l/</span>
              <Input
                id="settings-slug"
                value={slug}
                onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
                className="h-12 border-0 bg-transparent pl-1 focus-visible:bg-transparent focus-visible:ring-0"
              />
            </div>
            <Button type="button" variant="secondary" size="icon" onClick={copy} aria-label="Copiar enlace" className="size-12">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground">{url}</p>
          {changed && (
            <p className="text-xs text-warning">Ojo: al cambiar el enlace, el anterior deja de funcionar.</p>
          )}
        </div>
      </div>
      <SettingsSaveBar dirty={changed} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
