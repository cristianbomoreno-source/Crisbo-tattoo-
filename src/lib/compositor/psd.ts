import { writePsd, type Layer } from 'ag-psd'

/**
 * Arma el .psd que se abre en Procreate (Procreate importa cada capa del PSD
 * como una capa propia, con su nombre y si está visible). Se hace en el
 * navegador con las imágenes ya guardadas: el servidor no tiene que mandar un
 * archivo grande. Orden de abajo hacia arriba: referencia (oculta), fondo,
 * elementos del de atrás al de adelante y el diseño completo (oculto).
 */
export type PsdLayer = { name: string; url: string; hidden?: boolean }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar una capa'))
    img.src = src
  })
}

export async function buildPsd(layers: PsdLayer[], width: number, height: number): Promise<Blob> {
  const children: Layer[] = []
  for (const l of layers) {
    const img = await loadImage(l.url)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    // La referencia puede tener otra proporción: se centra sin deformarla.
    const k = Math.min(width / img.naturalWidth, height / img.naturalHeight)
    const w = img.naturalWidth * k
    const h = img.naturalHeight * k
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
    children.push({ name: l.name, canvas, hidden: !!l.hidden, top: 0, left: 0 })
  }
  // Imagen compuesta (la miniatura que muestran Archivos y Procreate): las capas visibles encima de blanco.
  const composite = document.createElement('canvas')
  composite.width = width
  composite.height = height
  const ctx = composite.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  for (const c of children) if (!c.hidden && c.canvas) ctx.drawImage(c.canvas, 0, 0)

  const buffer = writePsd({ width, height, canvas: composite, children }, { generateThumbnail: true })
  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' })
}
