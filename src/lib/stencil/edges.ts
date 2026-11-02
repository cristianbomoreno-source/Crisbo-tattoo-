/**
 * ¿Quedaron en el stencil las líneas largas del borde del brazo? Solo si
 * aparecen vale la pena la segunda pasada (otra imagen de IA, ~270 pesos); si
 * no, el primer resultado ya sirve.
 *
 * El borde del brazo es lo más externo del dibujo y baja casi recto: se mira,
 * fila por fila, el primer trazo desde la izquierda (y desde la derecha). Si
 * ese contorno exterior avanza sin saltos (≤ 2 px por fila) durante más de la
 * mitad de la altura y casi vertical, es una línea de borde. El contorno de un
 * diseño normal (hojas, plumas, pelo) salta de un lado a otro y no cuenta.
 */
export function hasArmEdgeLines(gray: Uint8Array, width: number, height: number, threshold = 128, minFraction = 0.55): boolean {
  const left = new Int32Array(height).fill(-1)
  const right = new Int32Array(height).fill(-1)
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++)
      if (gray[row + x]! < threshold) {
        left[y] = x
        break
      }
    for (let x = width - 1; x >= 0; x--)
      if (gray[row + x]! < threshold) {
        right[y] = x
        break
      }
  }
  return smoothRun(left, height, width, minFraction) || smoothRun(right, height, width, minFraction)
}

/** Tramo más largo de filas seguidas donde el contorno se mueve ≤ 2 px por fila y en total poco hacia los lados. */
function smoothRun(edge: Int32Array, height: number, width: number, minFraction: number): boolean {
  const need = height * minFraction
  const maxDrift = width * 0.25
  let start = 0
  let lo = Infinity
  let hi = -Infinity
  for (let y = 0; y < height; y++) {
    const x = edge[y]!
    const broken = x < 0 || (y > start && Math.abs(x - edge[y - 1]!) > 2)
    if (broken) {
      start = x < 0 ? y + 1 : y
      lo = x < 0 ? Infinity : x
      hi = x < 0 ? -Infinity : x
      continue
    }
    lo = Math.min(lo, x)
    hi = Math.max(hi, x)
    if (hi - lo > maxDrift) {
      // Demasiado inclinado para ser el borde: se reinicia desde aquí.
      start = y
      lo = hi = x
      continue
    }
    if (y - start + 1 >= need) return true
  }
  return false
}
