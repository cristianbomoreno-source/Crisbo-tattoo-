import { Textarea, Label } from 'crisbo-tattoo'

export const NotaDeCita = () => (
  <div className="grid max-w-sm gap-1.5">
    <Label htmlFor="nota">Nota para la sesión</Label>
    <Textarea id="nota" defaultValue="Traer referencia impresa. Piel sensible en la muñeca: ir despacio con el sombreado." />
  </div>
)

export const Vacio = () => (
  <div className="max-w-sm">
    <Textarea placeholder="Escribe una nota…" />
  </div>
)
