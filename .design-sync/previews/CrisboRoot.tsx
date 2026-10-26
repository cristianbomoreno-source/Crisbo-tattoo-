import { CrisboRoot, Button, Badge } from 'crisbo-tattoo'

export const TemaOscuro = () => (
  <CrisboRoot className="rounded-2xl p-5">
    <p className="text-[13px] text-muted-foreground">Entró este mes</p>
    <p className="font-title text-3xl font-bold tabular-nums">$2.675.000</p>
    <div className="mt-3 flex items-center gap-2">
      <Button size="sm">Registrar cobro</Button>
      <Badge variant="secondary">Octubre</Badge>
    </div>
  </CrisboRoot>
)
