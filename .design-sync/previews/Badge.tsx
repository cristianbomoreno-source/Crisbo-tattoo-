import { Badge } from 'crisbo-tattoo'

export const Variantes = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>Nuevo</Badge>
    <Badge variant="secondary">Fine line</Badge>
    <Badge variant="outline">Antebrazo</Badge>
    <Badge variant="destructive">Vencido</Badge>
    <Badge variant="ghost">Borrador</Badge>
  </div>
)

export const EnContexto = () => (
  <div className="flex max-w-sm items-center justify-between rounded-2xl bg-card p-4">
    <div>
      <p className="text-[15px] font-medium">Rosa en el antebrazo</p>
      <p className="text-[13px] text-muted-foreground">Juan David Lara · 2 sesiones</p>
    </div>
    <Badge>Agendado</Badge>
  </div>
)
