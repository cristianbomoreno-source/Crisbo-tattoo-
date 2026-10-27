import { redirect } from 'next/navigation'

/** Bot de solicitudes eliminado a pedido (oct 2026). Se deja la ruta para que los enlaces viejos no den error. */
export default function Page() {
  redirect('/dashboard/settings')
}
