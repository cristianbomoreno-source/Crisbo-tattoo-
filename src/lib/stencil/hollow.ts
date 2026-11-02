/**
 * Un stencil es solo línea: las zonas negras gruesas que la IA a veces rellena
 * (aunque el prompt lo prohíbe) se vacían y queda únicamente su contorno.
 * Erosión binaria con ventana cuadrada (2r+1): lo que sobrevive a la erosión es
 * el "interior" de una masa más gruesa que la ventana y se pinta de blanco; las
 * líneas normales, más delgadas que la ventana, no se tocan.
 *
 * `gray` es un canal de escala de grises (0 negro, 255 blanco), se modifica en sitio.
 */
export function hollowFills(gray: Uint8Array, width: number, height: number, radius: number, threshold = 128): number {
  const n = width * height
  const black = new Uint8Array(n)
  for (let i = 0; i < n; i++) black[i] = gray[i]! < threshold ? 1 : 0

  // Erosión horizontal: negro solo si toda la ventana [x-r, x+r] de la fila es negra.
  const horiz = new Uint8Array(n)
  const span = 2 * radius + 1
  for (let y = 0; y < height; y++) {
    const row = y * width
    let run = 0
    // run = cuántos negros seguidos terminan en x
    const runs = new Int32Array(width)
    for (let x = 0; x < width; x++) {
      run = black[row + x] ? run + 1 : 0
      runs[x] = run
    }
    for (let x = radius; x < width - radius; x++) if (runs[x + radius]! >= span) horiz[row + x] = 1
  }

  // Erosión vertical sobre el resultado horizontal.
  let hollowed = 0
  const runs = new Int32Array(height)
  for (let x = 0; x < width; x++) {
    let run = 0
    for (let y = 0; y < height; y++) {
      run = horiz[y * width + x] ? run + 1 : 0
      runs[y] = run
    }
    for (let y = radius; y < height - radius; y++) {
      if (runs[y + radius]! >= span) {
        gray[y * width + x] = 255
        hollowed++
      }
    }
  }
  return hollowed
}
