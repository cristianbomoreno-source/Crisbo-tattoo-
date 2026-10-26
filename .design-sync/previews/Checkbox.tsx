import { Checkbox, Label } from 'crisbo-tattoo'

export const Estados = () => (
  <div className="flex flex-col gap-3">
    <Label className="flex items-center gap-2.5">
      <Checkbox defaultChecked /> Mandar recordatorio por WhatsApp
    </Label>
    <Label className="flex items-center gap-2.5">
      <Checkbox /> Cobrar abono antes de la cita
    </Label>
    <Label className="flex items-center gap-2.5 opacity-60">
      <Checkbox disabled /> Pedir consentimiento (ya firmado)
    </Label>
  </div>
)
