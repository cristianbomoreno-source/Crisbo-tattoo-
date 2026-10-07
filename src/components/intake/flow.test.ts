import { describe, it, expect } from 'vitest'
import { applyEdit, nextStepId, questionFor, type HistoryItem, type Answers } from './flow'

function historyItem(stepId: HistoryItem['stepId'], answer: string, answers: Answers): HistoryItem {
  return { stepId, question: questionFor(stepId, answers), answer }
}

describe('applyEdit', () => {
  it('edicion simple: reemplaza el item y funde el patch, sin tocar el resto', () => {
    const answers: Answers = { name: 'Andrés', service: 'Tatuaje', size: 'Pequeño' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('service', 'Tatuaje', answers),
      historyItem('size', 'Pequeño', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'zone',
      done: false,
      stepId: 'size',
      label: 'Grande',
      patch: { size: 'Grande' },
    })

    expect(result.history).toHaveLength(3)
    expect(result.history[2]).toEqual({ stepId: 'size', question: questionFor('size', answers), answer: 'Grande' })
    expect(result.history[0]!.answer).toBe('Andrés')
    expect(result.history[1]!.answer).toBe('Tatuaje')
    expect(result.answers).toEqual({ name: 'Andrés', service: 'Tatuaje', size: 'Grande' })
    expect(result.current).toBe('zone')
    expect(result.done).toBe(false)
    expect(result.reopenAs).toBeNull()
  })

  // Desde el commit a81076d (20-jul) la subzona vive DENTRO de BodyMapExplorer:
  // `nextStepId('zone')` siempre devuelve 'color', y el explorador entrega un
  // label combinado ("Brazo — Derecho — Externa — Codo"). Ya no existe un paso
  // 'subzone' separado en el flujo real; estos tests cubren ese comportamiento.
  it('zone via BodyMapExplorer (label ya trae la subzona): edita en sitio, sin insertar paso subzone', () => {
    const answers: Answers = { name: 'Andrés', zone: 'Espalda' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('zone', 'Espalda', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'color',
      done: false,
      stepId: 'zone',
      label: 'Brazo — Derecho — Externa — Codo',
      patch: { zone: 'Brazo — Derecho — Externa — Codo', subzone: undefined },
    })

    expect(result.history).toHaveLength(2)
    expect(result.history[1]).toMatchObject({
      stepId: 'zone',
      answer: 'Brazo — Derecho — Externa — Codo',
    })
    expect(result.answers.zone).toBe('Brazo — Derecho — Externa — Codo')
    expect(result.answers.subzone).toBeUndefined()
    expect(result.reopenAs).toBeNull()
    // el paso actual del flujo principal no cambia mientras se edita
    expect(result.current).toBe('color')
    expect(result.done).toBe(false)
  })

  it('zone en una solicitud vieja con paso subzone: lo elimina y no lo reabre', () => {
    const answers: Answers = { name: 'Andrés', zone: 'Brazo', subzone: 'Antebrazo' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('zone', 'Brazo', answers),
      historyItem('subzone', 'Antebrazo', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'color',
      done: false,
      stepId: 'zone',
      label: 'Pierna',
      patch: { zone: 'Pierna', subzone: undefined },
    })

    expect(result.history.map((h) => h.stepId)).toEqual(['name', 'zone'])
    expect(result.history[1]).toMatchObject({ stepId: 'zone', answer: 'Pierna' })
    expect(result.answers.subzone).toBeUndefined()
    expect(result.reopenAs).toBeNull()
  })

  it('zone pierde subzona: elimina el item subzone del history', () => {
    const answers: Answers = { name: 'Andrés', zone: 'Brazo', subzone: 'Antebrazo' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('zone', 'Brazo', answers),
      historyItem('subzone', 'Antebrazo', answers),
      historyItem('color', 'Negro', { ...answers, color: 'Negro' }),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'skin',
      done: false,
      stepId: 'zone',
      label: 'Espalda',
      patch: { zone: 'Espalda', subzone: undefined },
    })

    expect(result.history.map(h => h.stepId)).toEqual(['name', 'zone', 'color'])
    expect(result.history[1]!.answer).toBe('Espalda')
    expect(result.answers.subzone).toBeUndefined()
    expect(result.reopenAs).toBeNull()
    expect(result.current).toBe('skin')
    expect(result.done).toBe(false)
  })

  it('service cambia: trunca el history posterior y resetea answers conservando name', () => {
    const answers: Answers = {
      name: 'Andrés',
      service: 'Tatuaje',
      size: 'Pequeño',
      zone: 'Brazo',
      subzone: 'Antebrazo',
      color: 'Negro',
    }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('service', 'Tatuaje', answers),
      historyItem('size', 'Pequeño', answers),
      historyItem('zone', 'Brazo', answers),
      historyItem('subzone', 'Antebrazo', answers),
      historyItem('color', 'Negro', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'skin',
      done: false,
      stepId: 'service',
      label: 'Otro',
      patch: { service: 'Otro' },
    })

    expect(result.history.map(h => h.stepId)).toEqual(['name', 'service'])
    expect(result.history[1]!.answer).toBe('Otro')
    expect(result.answers).toEqual({ name: 'Andrés', service: 'Otro' })
    expect(result.done).toBe(false)
    expect(result.current).toBe('other')
    expect(result.reopenAs).toBeNull()
  })

  it('service cambia a Tatuaje: siguiente paso es size', () => {
    const answers: Answers = { name: 'Andrés', service: 'Otro', otherQuery: 'algo' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('service', 'Otro', answers),
      historyItem('other', 'algo', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'summary',
      done: true,
      stepId: 'service',
      label: 'Tatuaje',
      patch: { service: 'Tatuaje' },
    })

    expect(result.history.map(h => h.stepId)).toEqual(['name', 'service'])
    expect(result.answers).toEqual({ name: 'Andrés', service: 'Tatuaje' })
    expect(result.current).toBe('size')
    expect(result.done).toBe(false)
  })

  it('service sin cambio real: edicion simple, sin truncar', () => {
    const answers: Answers = { name: 'Andrés', service: 'Tatuaje', size: 'Pequeño' }
    const history: HistoryItem[] = [
      historyItem('name', 'Andrés', answers),
      historyItem('service', 'Tatuaje', answers),
      historyItem('size', 'Pequeño', answers),
    ]

    const result = applyEdit({
      history,
      answers,
      current: 'zone',
      done: false,
      stepId: 'service',
      label: 'Tatuaje',
      patch: { service: 'Tatuaje' },
    })

    expect(result.history.map(h => h.stepId)).toEqual(['name', 'service', 'size'])
    expect(result.reopenAs).toBeNull()
    expect(result.current).toBe('zone')
  })
})

describe('nextStepId', () => {
  it('service = Otro va a other', () => {
    expect(nextStepId('service', { service: 'Otro' })).toBe('other')
  })

  it('service = Tatuaje va a size', () => {
    expect(nextStepId('service', { service: 'Tatuaje' })).toBe('size')
  })

  it('service = Cover up, Retoque o Diseño personalizado tambien van a size', () => {
    expect(nextStepId('service', { service: 'Cover up' })).toBe('size')
    expect(nextStepId('service', { service: 'Retoque' })).toBe('size')
    expect(nextStepId('service', { service: 'Diseño personalizado' })).toBe('size')
  })

  it('skin va a style', () => {
    expect(nextStepId('skin', {})).toBe('style')
  })

  it('style va a photos', () => {
    expect(nextStepId('style', {})).toBe('photos')
  })
})
