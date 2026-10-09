'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * `next-themes` ya era una dependencia (la usa `sonner.tsx` vía `useTheme()`)
 * pero nunca se montó ningún `<ThemeProvider>` — la app forzaba `.dark` a
 * mano en `layout.tsx`. Este wrapper solo existe porque `RootLayout` es un
 * Server Component y `ThemeProvider` necesita ser cliente.
 *
 * `attribute="class"` coincide con el mecanismo que ya usa globals.css
 * (`:root` = claro, `.dark` = oscuro, `.minimal` = minimalista).
 * `enableSystem={false}`: el toggle de Ajustes es manual, no sigue la
 * preferencia del sistema.
 *
 * Temas disponibles: dark, light, minimal
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={['dark', 'light', 'minimal']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
