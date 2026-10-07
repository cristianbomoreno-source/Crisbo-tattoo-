'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { uploadGalleryItemAction } from '@/actions/gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Las fotos se suben sin pedir etapa (simple para el tatuador); entran como 'progress'.
const DEFAULT_GALLERY_TYPE = 'progress'

type ProjectOption = { id: string; name: string }

export function GalleryUpload({
  projectId,
  projects,
}: {
  /** Proyecto fijo (uso desde el detalle de un proyecto). */
  projectId?: string
  /** Lista de proyectos para elegir (uso desde la galería del estudio). */
  projects?: ProjectOption[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>(
    projectId ?? projects?.[0]?.id ?? ''
  )

  const activeProjectId = projects ? selectedProject : (projectId ?? '')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Selecciona un archivo')
      return
    }
    if (!activeProjectId) {
      toast.error('Selecciona un proyecto')
      return
    }

    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('project_id', activeProjectId)
    fd.append('type', DEFAULT_GALLERY_TYPE)
    fd.append('caption', caption)

    const result = await uploadGalleryItemAction(fd)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error.message)
      return
    }

    toast.success('Foto subida')
    setPreview(null)
    setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-2xl bg-card p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide">
        <ImagePlus className="size-4 text-primary" strokeWidth={1.8} />
        Subir foto
      </h3>

      {projects && (
        <div className="space-y-2">
          <Label>Proyecto</Label>
          <Select
            items={Object.fromEntries(projects.map((p) => [p.id, p.name]))}
            value={selectedProject || null}
            onValueChange={(v) => setSelectedProject(v ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="gallery-file">Archivo</Label>
        <Input
          id="gallery-file"
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Vista previa" className="h-40 w-full rounded-md border object-cover" />
      )}

      <div className="space-y-2">
        <Label htmlFor="gallery-caption">Descripción (opcional)</Label>
        <Input
          id="gallery-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ej: primera sesión de sombreado"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Subiendo…' : 'Subir foto'}
      </Button>
    </form>
  )
}
