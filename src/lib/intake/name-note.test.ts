import { describe, it, expect } from 'vitest'
import { buildNameMismatchNote } from './name-note'

describe('buildNameMismatchNote', () => {
  it('mismo nombre con distinto case/espacios -> sin nota', () => {
    expect(buildNameMismatchNote('Andrés Torres', '  andrés torres  ')).toBeNull()
  })

  it('nombres distintos -> nota exacta con el nombre escrito', () => {
    expect(buildNameMismatchNote('Andrés Torres', 'Andresito')).toBe(
      'El cliente escribió su nombre como: Andresito'
    )
  })
})
