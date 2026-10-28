import { describe, expect, it } from 'vitest'
import { crc32, makeZip, slug } from './zip'

describe('zip', () => {
  it('calcula el CRC-32 estándar', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('arma un ZIP con encabezados locales, directorio central y cierre', () => {
    const data = new TextEncoder().encode('hola')
    const zip = makeZip([{ name: 'a.txt', data }])
    const v = new DataView(zip.buffer)
    expect(v.getUint32(0, true)).toBe(0x04034b50)
    expect(zip.length).toBe(30 + 5 + 4 + 46 + 5 + 22)
    const end = zip.length - 22
    expect(v.getUint32(end, true)).toBe(0x06054b50)
    expect(v.getUint16(end + 10, true)).toBe(1)
    expect(v.getUint32(end + 16, true)).toBe(39)
  })

  it('limpia títulos para nombres de archivo', () => {
    expect(slug('¿Cuánto cuesta un tatuaje en Bogotá?')).toBe('cuanto-cuesta-un-tatuaje-en-bogota')
  })
})
