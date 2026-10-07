import { redirect } from 'next/navigation'

// Registro deshabilitado - solo el admin puede crear cuentas
export default function RegisterPage() {
  redirect('/login')
}
