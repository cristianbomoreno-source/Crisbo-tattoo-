import { describe, expect, it } from 'vitest'
import { cleanTags, leadSource, lostReason, lostTag, visibleTags } from './options'

describe('crm options', () => {
  it('cleans tags: trims, drops empty and case-insensitive duplicates', () => {
    expect(cleanTags([' VIP ', 'vip', '', 'Color'])).toEqual(['VIP', 'Color'])
  })

  it('keeps the lost reason as a tag apart from the visible ones', () => {
    const tags = ['VIP', lostTag('Precio')]
    expect(visibleTags(tags)).toEqual(['VIP'])
    expect(lostReason(tags)).toBe('Precio')
    expect(lostReason(['VIP'])).toBeNull()
  })

  it('falls back to the chat channel when the client has no source', () => {
    expect(leadSource(null, 'instagram')).toBe('Instagram')
    expect(leadSource('  ', 'whatsapp')).toBe('WhatsApp')
    expect(leadSource('Referido', 'instagram')).toBe('Referido')
  })
})
