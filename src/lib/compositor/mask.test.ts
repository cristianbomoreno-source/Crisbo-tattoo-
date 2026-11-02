import { describe, expect, it } from 'vitest'
import { dilate, erode, splitLayers } from './mask'

const W = 10
const H = 10
function box(x0: number, y0: number, x1: number, y1: number) {
  const m = new Uint8Array(W * H)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * W + x] = 1
  return m
}
const plano = () => {
  const p = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) p.set([i, i, i, 255], i * 4)
  return p
}

describe('máscaras del compositor', () => {
  it('erosionar y dilatar encogen y agrandan la silueta', () => {
    const m = box(3, 3, 7, 7)
    expect(erode(m, W, H, 1).reduce((a, b) => a + b, 0)).toBe(4)
    expect(dilate(m, W, H, 1).reduce((a, b) => a + b, 0)).toBe(36)
  })

  it('cada píxel queda en una sola capa: el de adelante gana y el fondo es lo que sobra', () => {
    const atras = box(0, 0, 6, 10)
    const adelante = box(4, 0, 10, 10)
    const { layers, fondo } = splitLayers(plano(), W, H, [atras, adelante])
    const opaque = (l: Uint8Array, x: number) => l[(0 * W + x) * 4 + 3] === 255
    expect(opaque(layers[1]!, 5)).toBe(true) // zona compartida: la tiene el de adelante
    expect(opaque(layers[0]!, 5)).toBe(false) // y no el de atrás
    expect(opaque(layers[0]!, 2)).toBe(true)
    expect(opaque(fondo, 5)).toBe(false)
    const { fondo: soloFondo } = splitLayers(plano(), W, H, [box(0, 0, 5, 10), null])
    expect(opaque(soloFondo, 7)).toBe(true) // lo que nadie reclama va al fondo
    expect(soloFondo[(0 * W + 7) * 4]).toBe(7) // con los píxeles exactos del diseño
  })
})
