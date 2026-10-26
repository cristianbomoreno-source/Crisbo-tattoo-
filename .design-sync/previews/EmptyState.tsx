import { EmptyState, ImagesSquare, UsersThree } from 'crisbo-tattoo'

export const GaleriaVacia = () => (
  <div className="max-w-md">
    <EmptyState
      icon={ImagesSquare as never}
      title="Aún no hay trabajos en tu galería"
      description="Sube las fotos de tus tatuajes terminados para mostrarlas en tu página."
      action={{ label: 'Subir foto', onClick: () => {} }}
    />
  </div>
)

export const SinAccion = () => (
  <div className="max-w-md">
    <EmptyState icon={UsersThree as never} title="Sin clientes nuevos" description="Cuando alguien cotice desde tu enlace aparecerá aquí." />
  </div>
)
