/** Instagram y Meta tardan unos segundos la primera vez (luego quedan en
 * caché 6 h): el esqueleto sale al instante. */
export default function SocialStatsLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-9 w-64 rounded-full bg-card" />
      <div className="h-7 w-48 rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-card" />
        <div className="h-56 rounded-2xl bg-card" />
      </div>
    </div>
  )
}
