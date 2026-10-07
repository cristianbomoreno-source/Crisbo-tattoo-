import { describe, it, expect } from 'vitest'
import { instagramUrl, instagramHandle } from './instagram'

describe('instagramUrl', () => {
  it('arma la URL a partir de un @handle', () => {
    expect(instagramUrl('@usuario')).toBe('https://instagram.com/usuario')
  })
  it('arma la URL a partir de un handle sin @', () => {
    expect(instagramUrl('usuario')).toBe('https://instagram.com/usuario')
  })
  it('normaliza instagram.com/usuario sin duplicar el dominio', () => {
    expect(instagramUrl('instagram.com/usuario')).toBe('https://instagram.com/usuario')
  })
  it('normaliza www.instagram.com/usuario sin duplicar el dominio', () => {
    expect(instagramUrl('www.instagram.com/usuario')).toBe('https://instagram.com/usuario')
  })
  it('deja intacta una URL https ya armada', () => {
    expect(instagramUrl('https://instagram.com/usuario')).toBe('https://instagram.com/usuario')
  })
  it('quita espacios y barra final', () => {
    expect(instagramUrl('  usuario/  ')).toBe('https://instagram.com/usuario')
  })
  it('devuelve null para vacío', () => {
    expect(instagramUrl('')).toBeNull()
  })
  it('devuelve null para solo espacios', () => {
    expect(instagramUrl('   ')).toBeNull()
  })
  it('devuelve null para undefined', () => {
    expect(instagramUrl(undefined)).toBeNull()
  })
  it('devuelve null para null', () => {
    expect(instagramUrl(null)).toBeNull()
  })
})

describe('instagramHandle', () => {
  it('quita el @ de un @handle', () => {
    expect(instagramHandle('@usuario')).toBe('usuario')
  })
  it('deja igual un handle limpio (con punto, como crisbo.tattoo)', () => {
    expect(instagramHandle('crisbo.tattoo')).toBe('crisbo.tattoo')
  })
  it('extrae el handle de una URL de instagram', () => {
    expect(instagramHandle('https://www.instagram.com/usuario/')).toBe('usuario')
  })
  it('extrae el handle de instagram.com/usuario sin protocolo', () => {
    expect(instagramHandle('instagram.com/usuario')).toBe('usuario')
  })
  it('quita espacios y barra final', () => {
    expect(instagramHandle('  usuario/  ')).toBe('usuario')
  })
  it('devuelve null para una URL ajena con path (no imprime basura)', () => {
    expect(instagramHandle('https://linktr.ee/usuario')).toBeNull()
  })
  it('devuelve null para vacío, espacios, undefined y null', () => {
    expect(instagramHandle('')).toBeNull()
    expect(instagramHandle('   ')).toBeNull()
    expect(instagramHandle(undefined)).toBeNull()
    expect(instagramHandle(null)).toBeNull()
  })
})
