import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { cropBack, fitToRatio, isLetter } from './frame'

const img = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#808080' } }).jpeg().toBuffer()

describe('proporción exacta para Nano Banana', () => {
  it('una hoja carta se completa a 3:4 y al recortar vuelve a ser carta', async () => {
    const framed = await fitToRatio(await img(1583, 2048))
    expect(framed.aspectRatio).toBe('3:4')
    // Simula la respuesta de la IA: la misma imagen completada, a otra resolución (2K).
    const ai = await sharp(Buffer.from(framed.image)).resize(1536, 2048, { fit: 'fill' }).png().toBuffer()
    const back = await sharp(Buffer.from(await cropBack(ai, framed.crop))).metadata()
    expect(Math.abs(back.width! / back.height! - 1583 / 2048)).toBeLessThan(0.005)
    expect(isLetter(back.width!, back.height!)).toBe(true)
  })

  it('una imagen que ya tiene una proporción soportada no se toca', async () => {
    const source = await img(1200, 1600)
    const framed = await fitToRatio(source)
    expect(framed.image).toBe(source)
    expect(framed.crop).toEqual({ left: 0, top: 0, width: 1, height: 1 })
  })

  it('reconoce carta vertical y horizontal', () => {
    expect(isLetter(2550, 3300)).toBe(true)
    expect(isLetter(3300, 2550)).toBe(true)
    expect(isLetter(1200, 1600)).toBe(false)
  })
})
