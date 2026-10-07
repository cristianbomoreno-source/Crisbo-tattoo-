// Grupo propio (no usa el layout de (public)): el bot es la cara del ESTUDIO,
// con la marca OFINK solo en el pie. Tema oscuro forzado: es la experiencia de marca.
export default function BotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      {children}
    </div>
  )
}
