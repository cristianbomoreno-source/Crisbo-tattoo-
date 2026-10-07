/** Ilustración simple (outline) de una máquina de tatuar, en el verde de
 * marca — puramente decorativa, para el header del modal "Editar
 * cotización". No hay asset propio en `public/` para esto todavía. */
export function TattooMachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 21v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="12" y="27" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M20 37v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 43h12l-2 8a4 4 0 0 1-8 0l-2-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 30h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="41" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 8l4 3-4 3M6 20l3-4-3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  )
}
