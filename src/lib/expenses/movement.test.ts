import { describe, it, expect } from 'vitest'
import { nameWordPattern } from './movement'

describe('nameWordPattern', () => {
  it('ignora tildes y mayúsculas usando las vocales como comodín', () => {
    expect(nameWordPattern('González')).toBe('%g_nz_l_z%')
    expect(nameWordPattern('gonzalez')).toBe('%g_nz_l_z%')
  })
  it('quita los comodines que escriba el usuario', () => {
    expect(nameWordPattern('50%_x')).toBe('%50x%')
  })
})
