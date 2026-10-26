import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from 'crisbo-tattoo'

export const ConfirmarBorrado = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>¿Eliminar este pago?</DialogTitle>
        <DialogDescription>Se quitan $150.000 del proyecto de Juan David Lara. No se puede deshacer.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button variant="destructive">Eliminar pago</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
