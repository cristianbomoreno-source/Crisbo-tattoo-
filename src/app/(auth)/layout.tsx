import { AuthShell } from '@/components/shared/auth-shell'

/**
 * Layout de autenticación (login, registro, onboarding). El chrome (marca
 * OFINK + fondo `auth-bg.jpg`) vive en `AuthShell` (client, `usePathname`):
 * el onboarding trae su propio header y fondo por paso (`step-shell.tsx`) y
 * es pantalla completa, así que `AuthShell` se hace pass-through en esa ruta
 * para no duplicar la marca ni romper su layout — ver el comentario de
 * `AuthShell` para el detalle.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>
}
