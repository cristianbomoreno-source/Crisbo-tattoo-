import { redirect } from 'next/navigation'

/** Finanzas quedó dentro de Estadísticas. Se deja la ruta para que los enlaces viejos no den error. */
export default function Page() {
  redirect('/dashboard/stats')
}
