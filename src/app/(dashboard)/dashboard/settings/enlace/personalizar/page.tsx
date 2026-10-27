import { redirect } from 'next/navigation'

/** El personalizador viejo (plantillas, colores, fondo) se unió al editor de
 * Estudio → Página de links; la página pública ahora tiene diseño fijo estilo Apple. */
export default function Page() {
  redirect('/dashboard/settings/enlace')
}
