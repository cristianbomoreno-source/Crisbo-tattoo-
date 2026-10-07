'use client'

import { usePathname } from 'next/navigation'

/**
 * Topbar móvil. A pedido, ya no muestra el isotipo de OFINK (ni ninguna
 * marca) arriba en ninguna página — al quedar vacío, no se renderiza.
 * Se conserva el componente (y su prop) para no tocar app-shell ni la
 * lógica de quien lo monta.
 */
export function MobileTopbar({
  studio: _studio,
}: {
  studio: { name: string; logoUrl: string | null } | null
}) {
  const pathname = usePathname()
  void pathname
  return null
}
