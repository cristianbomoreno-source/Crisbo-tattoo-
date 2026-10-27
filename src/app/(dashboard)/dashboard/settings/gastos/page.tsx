import { redirect } from 'next/navigation'

/** Los gastos fijos se manejan en Caja y cuentas. Se deja la ruta para que los enlaces viejos no den error. */
export default function Page() {
  redirect('/dashboard?caja=1')
}
