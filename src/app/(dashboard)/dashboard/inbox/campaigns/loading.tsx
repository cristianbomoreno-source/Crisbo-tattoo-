/** Se ve apenas tocas "Campañas": sin esto la bandeja quedaba quieta unos
 * segundos mientras el servidor arma la lista, y parecía que el botón no
 * funcionaba. */
export default function CampaignsLoading() {
  return (
    <div className="animate-pulse space-y-3 p-1" aria-busy="true" aria-label="Cargando campaña">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-3 w-64 rounded bg-muted" />
        </div>
      </div>
      <div className="h-14 rounded-xl bg-card" />
      <div className="h-20 rounded-xl bg-card" />
      <div className="h-40 rounded-2xl bg-card" />
      <div className="space-y-2">
        <div className="h-12 rounded-xl bg-card" />
        <div className="h-12 rounded-xl bg-card" />
        <div className="h-12 rounded-xl bg-card" />
      </div>
    </div>
  )
}
