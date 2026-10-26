import { PageHeader, Button } from 'crisbo-tattoo'

export const ConAccion = () => (
  <PageHeader kicker="Estudio" title="Proyectos" description="14 activos · 3 por agendar" action={<Button>Nuevo proyecto</Button>} />
)

export const Simple = () => <PageHeader title="Clientes" description="1.624 en total" />
