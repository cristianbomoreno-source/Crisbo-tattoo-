import { describe, it, expect } from 'vitest'
import { applyInk, hexToRgb, inkAmount } from './ink'
import { stencilPrompt } from './styles'

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba)

describe('stencil ink', () => {
  it('lee colores hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
    expect(hexToRgb('2563eb')).toEqual([37, 99, 235])
  })

  it('lo oscuro es tinta, lo claro no, y el borde es suave', () => {
    expect(inkAmount(0, 170)).toBe(1)
    expect(inkAmount(255, 170)).toBe(0)
    expect(inkAmount(170, 170)).toBeCloseTo(0.5)
  })

  it('sin fondo: la línea queda del color escogido y el blanco transparente', () => {
    const out = applyInk(px(0, 0, 0, 255, 255, 255, 255, 255), { color: '#2563eb', transparent: true, threshold: 170 })
    expect([...out]).toEqual([37, 99, 235, 255, 37, 99, 235, 0])
  })

  it('con fondo: blanco queda blanco y la línea del color', () => {
    const out = applyInk(px(10, 10, 10, 255, 250, 250, 250, 255), { color: '#d92b2b', transparent: false, threshold: 170 })
    expect([...out]).toEqual([217, 43, 43, 255, 255, 255, 255, 255])
  })

  it('el prompt pide solo el tatuaje, sin piel ni fondo', () => {
    expect(stencilPrompt('mapa-tonal')).toMatch(/ignore the skin/)
    expect(stencilPrompt('mapa-tonal')).toMatch(/Tonal-map/)
  })
})
