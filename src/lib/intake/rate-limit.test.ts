import { describe, it, expect } from 'vitest'
import { RateLimiter } from './rate-limit'

describe('RateLimiter', () => {
  it('permite hasta max intentos dentro de la ventana', () => {
    const rl = new RateLimiter(2, 1000)
    expect(rl.allow('a', 0)).toBe(true)
    expect(rl.allow('a', 10)).toBe(true)
    expect(rl.allow('a', 20)).toBe(false)
  })
  it('resetea al pasar la ventana', () => {
    const rl = new RateLimiter(1, 1000)
    expect(rl.allow('a', 0)).toBe(true)
    expect(rl.allow('a', 999)).toBe(false)
    expect(rl.allow('a', 1000)).toBe(true)
  })
  it('cuenta por clave independiente', () => {
    const rl = new RateLimiter(1, 1000)
    expect(rl.allow('a', 0)).toBe(true)
    expect(rl.allow('b', 0)).toBe(true)
  })
})
