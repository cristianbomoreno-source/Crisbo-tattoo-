interface PageHeaderProps {
  title: string
  /** Rótulo pequeño en mayúsculas sobre el título. */
  kicker?: string
  description?: string
  action?: React.ReactNode
}

/** Encabezado de página al estilo iOS (Apple Games): título grande en
 * negrita, descripción en gris y las acciones a la derecha. Igual en el
 * celular y en la web. */
export function PageHeader({ title, kicker, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {kicker && <p className="mb-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{kicker}</p>}
        <h1 className="large-title break-words lg:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-[1.0625rem] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 sm:shrink-0">{action}</div>}
    </div>
  )
}
