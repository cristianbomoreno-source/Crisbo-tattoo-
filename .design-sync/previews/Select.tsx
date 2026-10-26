import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from 'crisbo-tattoo'

export const MedioDePago = () => (
  <div className="max-w-xs">
    <Select defaultValue="daviplata" open>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Cuenta</SelectLabel>
          <SelectItem value="daviplata">Daviplata</SelectItem>
          <SelectItem value="nequi">Nequi</SelectItem>
          <SelectItem value="efectivo">Efectivo</SelectItem>
          <SelectItem value="bancolombia">Bancolombia</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
)
