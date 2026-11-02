import { describe, expect, it } from 'vitest'
import { hasArmEdgeLines } from './edges'

const W = 100
const H = 100
const blank = () => new Uint8Array(W * H).fill(255)

describe('hasArmEdgeLines', () => {
  it('detecta una línea larga y algo inclinada cerca del borde', () => {
    const g = blank()
    for (let y = 5; y < 95; y++) g[y * W + 10 + Math.floor(y / 10)] = 0
    expect(hasArmEdgeLines(g, W, H)).toBe(true)
  })

  it('no se activa con el contorno de un diseño normal, que salta de un lado a otro', () => {
    const g = blank()
    // Hojas: cada 8 filas el contorno exterior se corre 15 px hacia un lado u otro.
    for (let y = 0; y < 100; y++) {
      const x = 20 + ((Math.floor(y / 8) % 2) * 15)
      g[y * W + x] = 0
      g[y * W + (W - 1 - x)] = 0
    }
    expect(hasArmEdgeLines(g, W, H)).toBe(false)
  })
})
