'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowSquareOut, PaintBrush, ShareNetwork } from '@phosphor-icons/react'
import { Icon3D } from '@/components/ui/icon-3d'

/**
 * "Mi página de links" (tipo Linktree) en la pestaña Estudio: la página
 * pública (/redes o /l/{slug}) con tus redes, WhatsApp y los botones que configures.
 * Abrirla, compartir el enlace (o copiarlo) y editarla.
 */
/** `path`: /redes para el estudio principal, /l/{slug} para los demás. */
export function LinkPageCard({ slug, path = `/l/${slug}` }: { slug: string; path?: string }) {

  async function share() {
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mis links', url })
        return
      }
    } catch {
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <section data-tour="settings-link-page" className="tile-purple relative overflow-hidden rounded-[2rem] p-5 text-white">
      <Icon3D name="mobile-phone" className="absolute top-4 right-4 size-16" />
      <p className="text-[13px] font-semibold tracking-wide text-white/75 uppercase">Tu página de links</p>
      <h2 className="mt-0.5 pr-20 text-[1.5rem] leading-tight font-bold tracking-tight">Todos tus enlaces en uno</h2>
      <p className="mt-1 truncate pr-20 text-[15px] text-white/75">crisbotattoo.com{path}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/18 text-[15px] font-semibold backdrop-blur-md active:scale-[0.97]"
        >
          <ArrowSquareOut className="size-4" weight="bold" />
          Ver
        </a>
        <button
          type="button"
          onClick={share}
          className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/18 text-[15px] font-semibold backdrop-blur-md active:scale-[0.97]"
        >
          <ShareNetwork className="size-4" weight="bold" />
          Compartir
        </button>
        <Link
          href="/dashboard/settings/enlace"
          className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[15px] font-semibold text-black active:scale-[0.97]"
        >
          <PaintBrush className="size-4" weight="bold" />
          Editar
        </Link>
      </div>
    </section>
  )
}
