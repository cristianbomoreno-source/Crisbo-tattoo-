import { Input, Label } from 'crisbo-tattoo'

export const Campo = () => (
  <div className="grid max-w-sm gap-1.5">
    <Label htmlFor="cliente">Nombre del cliente</Label>
    <Input id="cliente" defaultValue="Juan David Lara" />
  </div>
)

export const Estados = () => (
  <div className="grid max-w-sm gap-3">
    <Input placeholder="Monto (ej. 150000)" inputMode="numeric" />
    <Input aria-invalid defaultValue="abc" />
    <Input disabled defaultValue="Daviplata" />
  </div>
)
