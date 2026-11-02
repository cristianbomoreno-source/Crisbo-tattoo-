import { describe, expect, it } from 'vitest'
import { whiteToAlpha } from './alpha'

/** Imagen RGBA blanca de w×h con los píxeles indicados en negro. */
function image(w: number, h: number, black: [number, number][]) {
  const data = new Uint8Array(w * h * 4).fill(255)
  for (const [x, y] of black) data.fill(0, (y * w + x) * 4, (y * w + x) * 4 + 3)
  return data
}
const alpha = (d: Uint8Array, w: number, x: number, y: number) => d[(y * w + x) * 4 + 3]

describe('whiteToAlpha', () => {
  it('borra el blanco que toca el borde y deja la tinta opaca', () => {
    const d = image(5, 5, [[2, 2]])
    whiteToAlpha(d, 5, 5)
    expect(alpha(d, 5, 0, 0)).toBe(0)
    expect(alpha(d, 5, 2, 2)).toBe(255)
  })

  it('conserva un brillo blanco pequeño encerrado por el dibujo', () => {
    // Anillo negro de 3×3 en una imagen grande: el centro blanco es parte del dibujo.
    const ring: [number, number][] = []
    for (let x = 10; x <= 12; x++) for (let y = 10; y <= 12; y++) if (x !== 11 || y !== 11) ring.push([x, y])
    const d = image(40, 40, ring)
    whiteToAlpha(d, 40, 40)
    expect(alpha(d, 40, 11, 11)).toBe(255)
    expect(alpha(d, 40, 0, 0)).toBe(0)
  })

  it('borra un hueco blanco grande aunque esté encerrado', () => {
    const w = 40
    const frame: [number, number][] = []
    for (let i = 0; i < w; i++) frame.push([i, 1], [i, w - 2], [1, i], [w - 2, i])
    const d = image(w, w, frame)
    whiteToAlpha(d, w, w)
    expect(alpha(d, w, 20, 20)).toBe(0)
  })
})
