/**
 * Reduce una foto en el navegador antes de subirla: lado mayor ≤ 2048 px y
 * JPEG al 85 %. Vercel corta cualquier petición de más de 4,5 MB antes de
 * llegar al server action (falla sin log), y las fotos de celular suelen
 * pesar 3–10 MB; además convierte HEIC (iPhone) a JPEG cuando el navegador
 * sabe decodificarlo (Safari). Si algo falla, devuelve el archivo original.
 */
export async function compressImage(file: File, maxSide = 2048, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) return file
  try {
    const bitmap = await loadBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    if ('close' in bitmap) bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    // Ya era JPEG pequeño y no se redimensionó: no vale la pena re-comprimir.
    if (file.type === 'image/jpeg' && scale === 1 && blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Respeta la orientación EXIF (fotos verticales del celular).
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Safari viejo o formato no soportado por createImageBitmap: probar con <img>.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}
