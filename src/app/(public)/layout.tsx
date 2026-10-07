import { Logo } from '@/components/shared/logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Logo full className="mb-8 text-center text-xl" />
        {children}
      </div>
    </main>
  )
}
