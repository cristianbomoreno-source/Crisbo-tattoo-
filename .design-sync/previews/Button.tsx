import { Button, Wallet, CaretRight, Warning } from 'crisbo-tattoo'

export const Variantes = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>Guardar cita</Button>
    <Button variant="secondary">Cancelar</Button>
    <Button variant="outline">Ver proyecto</Button>
    <Button variant="ghost">Omitir</Button>
    <Button variant="destructive">Eliminar</Button>
    <Button variant="link">Ver todos los gastos</Button>
  </div>
)

export const Tamanos = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button size="xs">Deshacer</Button>
    <Button size="sm">Marcar pagado</Button>
    <Button>Registrar cobro</Button>
    <Button size="lg">Empezar jornada</Button>
  </div>
)

export const ConIcono = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>
      <Wallet weight="duotone" /> Abrir caja
    </Button>
    <Button variant="outline">
      Siguiente <CaretRight weight="bold" />
    </Button>
    <Button size="icon" variant="secondary" aria-label="Alerta">
      <Warning weight="duotone" />
    </Button>
    <Button disabled>Guardando…</Button>
  </div>
)
