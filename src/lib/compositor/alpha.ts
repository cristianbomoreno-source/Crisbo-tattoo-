/**
 * Cada capa llega de la IA sobre blanco. Para apilarlas en Procreate el blanco
 * de alrededor tiene que ser transparente, pero no el blanco que es parte del
 * dibujo (brillos, la llama de la vela, el papel dentro de una flor pequeña).
 * Se borra el blanco conectado al borde de la imagen y cualquier zona blanca
 * grande; el borde del dibujo se suaviza quitándole el blanco (color a alpha)
 * para que no quede un halo claro.
 */

/** Un píxel cuenta como blanco de fondo si sus tres canales pasan de este valor. */
const WHITE = 236
/** Zonas blancas cerradas más grandes que esta fracción de la imagen también se borran. */
const BIG_HOLE = 0.004

export function whiteToAlpha(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): void {
  const n = width * height
  const white = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const p = i * 4
    white[i] = rgba[p]! >= WHITE && rgba[p + 1]! >= WHITE && rgba[p + 2]! >= WHITE ? 1 : 0
  }

  // Zonas blancas conectadas (4 vecinos): se borran las que tocan el borde o son grandes.
  const clear = new Uint8Array(n)
  const seen = new Uint8Array(n)
  const stack = new Int32Array(n)
  const region: number[] = []
  for (let start = 0; start < n; start++) {
    if (!white[start] || seen[start]) continue
    let top = 0
    stack[top++] = start
    seen[start] = 1
    region.length = 0
    let edge = false
    while (top) {
      const i = stack[--top]!
      region.push(i)
      const x = i % width
      const y = (i - x) / width
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edge = true
      if (x > 0 && white[i - 1] && !seen[i - 1]) {
        seen[i - 1] = 1
        stack[top++] = i - 1
      }
      if (x < width - 1 && white[i + 1] && !seen[i + 1]) {
        seen[i + 1] = 1
        stack[top++] = i + 1
      }
      if (y > 0 && white[i - width] && !seen[i - width]) {
        seen[i - width] = 1
        stack[top++] = i - width
      }
      if (y < height - 1 && white[i + width] && !seen[i + width]) {
        seen[i + width] = 1
        stack[top++] = i + width
      }
    }
    if (edge || region.length > n * BIG_HOLE) for (const i of region) clear[i] = 1
  }

  for (let i = 0; i < n; i++) {
    const p = i * 4
    if (clear[i]) {
      rgba[p] = rgba[p + 1] = rgba[p + 2] = 255
      rgba[p + 3] = 0
      continue
    }
    // Un blanco que se conservó (brillo encerrado) se queda opaco.
    if (white[i]) continue
    const x = i % width
    const y = (i - x) / width
    const touches =
      (x > 0 && clear[i - 1]) ||
      (x < width - 1 && clear[i + 1]) ||
      (y > 0 && clear[i - width]) ||
      (y < height - 1 && clear[i + width]) ||
      (x > 1 && clear[i - 2]) ||
      (x < width - 2 && clear[i + 2]) ||
      (y > 1 && clear[i - 2 * width]) ||
      (y < height - 2 && clear[i + 2 * width])
    if (!touches) continue
    // Color a alpha desde blanco: el píxel claro del borde se vuelve tinta semitransparente.
    const r = rgba[p]!
    const g = rgba[p + 1]!
    const b = rgba[p + 2]!
    const a = Math.max(255 - r, 255 - g, 255 - b) / 255
    if (a <= 0) {
      rgba[p + 3] = 0
      continue
    }
    rgba[p] = Math.round(255 - (255 - r) / a)
    rgba[p + 1] = Math.round(255 - (255 - g) / a)
    rgba[p + 2] = Math.round(255 - (255 - b) / a)
    rgba[p + 3] = Math.round(a * rgba[p + 3]!)
  }
}
