import Link from 'next/link'
import { Check } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

export function CelebrationScreen({
  title,
  subtitle,
  items,
  cta,
  href,
}: {
  title: string
  subtitle: string
  items: string[]
  cta: string
  href: string
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[110px]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <Logo full className="text-5xl" />

        <div className="mt-8 flex size-24 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10">
          <Check className="size-11 text-primary" strokeWidth={2.2} />
        </div>

        <h1 className="mt-8 font-title text-3xl uppercase leading-tight">{title}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>

        <ul className="mt-8 w-full space-y-2.5 text-left">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
              <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
              <span className="text-sm text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground"
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}
