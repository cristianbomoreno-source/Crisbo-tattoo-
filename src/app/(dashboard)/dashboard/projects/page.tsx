import { getProjects } from '@/queries/projects'
import { getClients } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { LargeTitle } from '@/components/shared/large-title'
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
      <LargeTitle
        title="Proyectos"
        actions={
          <CreateProjectDialog
            clients={clients}
            trigger={
              <button
                type="button"
                aria-label="Nuevo proyecto"
                className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.94]"
              >
                <Plus className="size-6" weight="bold" />
              </button>
            }
          />
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
