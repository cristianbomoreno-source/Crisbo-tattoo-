/**
 * Skeleton de carga del dashboard: aparece INSTANTÁNEO al navegar entre
 * páginas mientras el servidor resuelve los datos. Antes no existía ningún
 * loading.tsx en la app: cada navegación dejaba la pantalla congelada en
 * blanco hasta la respuesta, lo que hacía sentir todo mucho más lento.
 * Es CSS puro (animate-pulse), sin JS ni imágenes — costo cero.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      {/* Encabezado de página */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-7 w-48 rounded bg-muted" />
      </div>
      {/* Tarjeta principal */}
      <div className="h-40 rounded-2xl bg-card" />
      {/* Filas de contenido */}
      <div className="space-y-3">
        <div className="h-16 rounded-xl bg-card" />
        <div className="h-16 rounded-xl bg-card" />
        <div className="h-16 rounded-xl bg-card" />
        <div className="h-16 rounded-xl bg-card" />
      </div>
    </div>
  )
}
