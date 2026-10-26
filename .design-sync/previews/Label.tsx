import { Label, Input } from 'crisbo-tattoo'

export const ConCampo = () => (
  <div className="grid max-w-sm gap-1.5">
    <Label htmlFor="zona">Zona del cuerpo</Label>
    <Input id="zona" defaultValue="Antebrazo" />
  </div>
)
