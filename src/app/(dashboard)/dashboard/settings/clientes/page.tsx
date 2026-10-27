import { redirect } from 'next/navigation'

/** Página intermedia quitada: Clientes, Galería y Consentimientos son tarjetas de Estudio. Se deja la ruta para que los enlaces viejos no den error. */
export default function Page() {
  redirect('/dashboard/settings')
}
