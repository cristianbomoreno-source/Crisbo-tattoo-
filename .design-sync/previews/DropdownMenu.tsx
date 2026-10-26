import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from 'crisbo-tattoo'

export const AccionesDeProyecto = () => (
  <DropdownMenu open>
    <DropdownMenuTrigger render={<Button variant="outline" />}>Acciones</DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuGroup>
        <DropdownMenuLabel>Rosa en el antebrazo</DropdownMenuLabel>
        <DropdownMenuItem>Agendar sesión</DropdownMenuItem>
        <DropdownMenuItem>Registrar abono</DropdownMenuItem>
        <DropdownMenuItem>Enviar por WhatsApp</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">Eliminar proyecto</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
