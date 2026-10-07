import { getStudioGallery } from '@/queries/gallery'
import { getProjects } from '@/queries/projects'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { GalleryUpload } from '@/components/gallery/gallery-upload'
import Image from 'next/image'

export default async function GalleryPage() {
  const [galleryResult, projectsResult] = await Promise.all([
    getStudioGallery(),
    getProjects(),
  ])
  const items = galleryResult.success ? galleryResult.data : []
  const projects = projectsResult.success
    ? projectsResult.data.map((p) => ({ id: p.id, name: p.name }))
    : []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Galería"
        description="Trabajos finales de tu estudio"
      />

      {projects.length > 0 && <GalleryUpload projects={projects} />}

      {items.length === 0 ? (
        <EmptyState
          title="La galería está vacía"
          description="Las fotos marcadas como 'final' en tus proyectos aparecerán aquí."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">
              <Image
                src={item.url}
                alt={item.caption ?? 'Tatuaje'}
                fill
                className="object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
