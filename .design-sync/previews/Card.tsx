import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction, Button, Badge } from 'crisbo-tattoo'

export const Proyecto = () => (
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Rosa realista en el antebrazo</CardTitle>
      <CardDescription>Juan David Lara · cotizado el 12 de octubre</CardDescription>
      <CardAction>
        <Badge>Aprobado</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-muted-foreground">Valor total</span>
        <span className="font-title text-xl font-bold tabular-nums">$460.000</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full w-1/3 rounded-full bg-primary" />
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">Abonó $150.000 · faltan $310.000</p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button variant="outline" className="flex-1">Ver proyecto</Button>
      <Button className="flex-1">Agendar sesión</Button>
    </CardFooter>
  </Card>
)

export const Simple = () => (
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Meta del mes</CardTitle>
      <CardDescription>Cotizar $10.000.000 en octubre</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="font-title text-3xl font-bold tabular-nums">84%</p>
    </CardContent>
  </Card>
)
