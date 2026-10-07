'use client'

import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Piezas visuales compartidas del rediseño de Cotización Rápida
 * (`quick-quote-form.tsx`) — extraídas para reutilizarlas entre secciones
 * y para que agregar una sección nueva sea copiar un patrón, no inventar
 * estilos desde cero. Nada de esto toca lógica de datos: son solo
 * presentación (tarjetas, chips, badges) sobre el estado que ya vive en
 * el formulario.
 */

/** Badge numerado verde (1, 2, 3…) que antecede el título de cada sección,
 * como en la referencia. */
export function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-lg font-display text-[11px] font-bold transition-colors duration-200',
        done ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
      )}
    >
      {n}
    </span>
  )
}

/** Envoltorio de sección: número + título (+ hint opcional) + contenido.
 * Estandariza el espaciado y la tipografía de encabezado en toda la
 * pantalla. `spanFull` la hace ocupar las dos columnas del grid de
 * escritorio (Cliente y Estilo, en la referencia). */
export function QuickSection({
  n,
  title,
  hint,
  done,
  spanFull,
  className,
  children,
}: {
  n: number
  title: string
  hint?: string
  done?: boolean
  spanFull?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'space-y-3 rounded-[1.75rem] border border-white/8 bg-card/60 p-4 sm:p-5',
        spanFull && 'lg:col-span-2',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <StepBadge n={n} done={done} />
        <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

/** Tarjeta grande de opción (Cliente nuevo / Cliente existente): ícono +
 * título + subtexto, con el estado "seleccionada" (borde verde, sombra
 * verde muy sutil, ligera escala) que pide la referencia. */
export function BigOptionCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onClick,
  disabled,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  selected?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      animate={{ scale: selected ? 1.015 : 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'flex flex-1 flex-col items-center gap-2 rounded-2xl border px-4 py-6 text-center transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/[0.07] shadow-[0_0_0_1px_rgba(184,244,0,0.25),0_8px_24px_-8px_rgba(184,244,0,0.35)]'
          : 'border-white/10 hover:border-primary/40 hover:bg-white/[0.02]'
      )}
    >
      <Icon className={cn('size-6', selected ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.8} aria-hidden="true" />
      <span className={cn('font-display text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </motion.button>
  )
}

/** Chip rápido (número de sesiones): pastilla grande, verde OFINK al
 * seleccionar con un leve rebote. */
export function BigChip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string
  selected?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn(
        'flex h-12 flex-1 items-center justify-center rounded-xl border font-display text-sm font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-white/10 bg-white/[0.02] text-foreground hover:border-primary/40'
      )}
    >
      {label}
    </motion.button>
  )
}

/** Tarjeta de precio preestablecido: checkbox + nombre + subtexto + precio
 * a la derecha. Fondo iluminado y precio verde cuando está activa. */
export function PresetCard({
  label,
  subtitle,
  formattedAmount,
  selected,
  onClick,
  disabled,
}: {
  label: string
  subtitle?: string
  amount: number
  formattedAmount: string
  selected?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        selected ? 'border-primary bg-primary/[0.08]' : 'border-white/10 hover:border-primary/30'
      )}
    >
      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-[6px] border transition-colors duration-200',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-white/25 text-transparent'
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm font-medium', selected ? 'text-foreground' : 'text-foreground/90')}>
          {label}
        </span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <span className={cn('shrink-0 font-display text-sm font-bold tabular-nums', selected ? 'text-primary' : 'text-foreground/80')}>
        {formattedAmount}
      </span>
    </button>
  )
}

export function TinyTip({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
}
