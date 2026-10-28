import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketing · Crisbo Tattoo',
  robots: { index: false, follow: false },
}

/** crisbotattoo.com/marketing: tema oscuro fijo. La letra de las láminas viene de components/marketing/fonts.ts. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-dvh bg-background text-foreground">{children}</div>
}
