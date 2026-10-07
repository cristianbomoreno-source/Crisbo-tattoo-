import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** Icono lucide contextual (no emojis). Ver DESIGN.md §5. */
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-card text-muted-foreground">
          <Icon className="size-6" strokeWidth={1.6} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold uppercase tracking-tight">{title}</h3>
      <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
