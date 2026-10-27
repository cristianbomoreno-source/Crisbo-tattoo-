import { describe, expect, it } from 'vitest'
import { buildLinkUrl, linkFieldValue, linkType } from './types'

describe('link page button types', () => {
  it('builds WhatsApp links from a Colombian number, with optional message', () => {
    expect(buildLinkUrl('whatsapp', '320 210 7769')).toBe('https://wa.me/573202107769')
    expect(buildLinkUrl('whatsapp', '+57 320 210 7769', 'Hola, quiero cotizar')).toBe('https://wa.me/573202107769?text=Hola%2C%20quiero%20cotizar')
    expect(linkFieldValue('whatsapp', 'https://wa.me/573202107769?text=Hola')).toEqual({ value: '3202107769', message: 'Hola' })
  })

  it('builds map, phone and plain links', () => {
    expect(buildLinkUrl('location', 'Calle 1 #2-3, Bogotá')).toBe('https://maps.google.com/?q=Calle%201%20%232-3%2C%20Bogot%C3%A1')
    expect(linkFieldValue('location', buildLinkUrl('location', 'Calle 1, Bogotá')).value).toBe('Calle 1, Bogotá')
    expect(buildLinkUrl('phone', '3202107769')).toBe('tel:+573202107769')
    expect(buildLinkUrl('url', 'crisbotattoo.com')).toBe('https://crisbotattoo.com')
    expect(buildLinkUrl('url', 'https://x.com/a')).toBe('https://x.com/a')
  })

  it('falls back to the generic link type', () => {
    expect(linkType('nope').key).toBe('link')
    expect(linkType('whatsapp').tone).toBe('tile-green')
  })
})
