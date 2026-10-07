interface PageHeaderProps {
  title: string
  /** Pequeño rótulo en rojo sobre el título (Oswald, tracking amplio). */
  kicker?: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, kicker, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {kicker && (
          <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {kicker}
          </p>
        )}
        <h1 className="font-title text-4xl uppercase leading-[0.95] tracking-[0.01em] break-words sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2 sm:shrink-0">{action}</div>}
    </div>
  )
}
