import { describe, expect, it } from 'vitest'
import { hollowFills } from './hollow'

function canvas(w: number, h: number) {
  return new Uint8Array(w * h).fill(255)
}
function rect(g: Uint8Array, w: number, x0: number, y0: number, x1: number, y1: number) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) g[y * w + x] = 0
}

describe('hollowFills', () => {
  it('vacía una masa negra gruesa y deja su contorno', () => {
    const w = 60
    const g = canvas(w, 60)
    rect(g, w, 10, 10, 50, 50)
    hollowFills(g, w, 60, 3)
    expect(g[30 * w + 30]).toBe(255) // centro vaciado
    expect(g[30 * w + 10]).toBe(0) // borde izquierdo intacto
    expect(g[10 * w + 30]).toBe(0) // borde superior intacto
  })

  it('no toca las líneas más delgadas que la ventana', () => {
    const w = 60
    const g = canvas(w, 60)
    rect(g, w, 5, 28, 55, 32) // línea horizontal de 4 px
    rect(g, w, 28, 5, 32, 55) // línea vertical de 4 px
    const before = g.slice()
    expect(hollowFills(g, w, 60, 3)).toBe(0)
    expect(g).toEqual(before)
  })
})
