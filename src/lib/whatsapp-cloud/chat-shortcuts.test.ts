import { describe, expect, it } from 'vitest'
import { suggestReplies } from './chat-shortcuts'

describe('suggestReplies', () => {
  it('detecta las preguntas típicas de los clientes', () => {
    expect(suggestReplies('¿Y cómo hago para separar la cita? ¿Hay que pagar algo antes?')[0]).toBe('abono')
    expect(suggestReplies('¿dónde queda el estudio exactamente?')).toContain('ubicacion')
    expect(suggestReplies('tengo 17 años, ¿me pueden tatuar si voy con mi mamá?')[0]).toBe('menores')
    expect(suggestReplies('Se me ve como rojito y le está saliendo tinta, ¿es normal?')[0]).toBe('cuidados')
    expect(suggestReplies('¿qué horarios manejan?')).toContain('horario')
    expect(suggestReplies('¿Puedo tomar algo antes de la cita?')[0]).toBe('recomendaciones')
  })
  it('tras el pago sugiere comprobante y formulario', () => {
    const s = suggestReplies('Listo, ya te hice el abono de $50.000 🙌')
    expect(s).toContain('comprobante')
    expect(s).toContain('formulario')
  })
  it('nada si no hay pistas', () => {
    expect(suggestReplies('Hola, buenas tardes')).toEqual([])
    expect(suggestReplies('')).toEqual([])
  })
})
