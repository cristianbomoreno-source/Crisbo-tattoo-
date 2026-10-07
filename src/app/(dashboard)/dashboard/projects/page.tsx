import { getProjects } from '@/queries/projects'
import { getClients } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { PageHeader } from '@/components/shared/page-header'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectsBoard } from '@/components/projects/projects-board'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>
}) {
  const { q, view } = await searchParams

  const [projectsResult, clientsResult, studio] = await Promise.all([
    getProjects(),
    getClients(),
    getCurrentStudio(),
  ])
  const projects = projectsResult.success ? projectsResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Tu estudio"
        title="Proyectos"
        description="Todos tus proyectos de tatuaje"
        action={
          <div className="hidden lg:block">
            <CreateProjectDialog clients={clients} />
          </div>
        }
      />
      <ProjectsBoard
        projects={projects}
        q={q}
        view={view === 'list' ? 'list' : 'grid'}
        contactClientTemplate={studio?.contactClientTemplate}
      />
    </div>
  )
}
