import { COPY } from './copy'
import type { INTAKE_SERVICES } from '@/lib/validations/intake'

export type StepId =
  | 'phone' | 'name' | 'gender' | 'age' | 'service' | 'other' | 'size' | 'zone' | 'subzone' | 'color'
  | 'skin' | 'style' | 'photos' | 'description' | 'contact' | 'availability' | 'summary'

export type Answers = {
  phone?: string
  /** true si el teléfono coincidió con un cliente ya existente del estudio —
   * permite saltar 'name' y el email de 'contact' si ya los tenemos. */
  knownClient?: boolean
  name?: string
  gender?: 'Hombre' | 'Mujer'
  age?: number
  /** Fecha de nacimiento (YYYY-MM-DD). Si el cliente ya la tenía guardada
   * (`clients.birthdate`), se resuelve junto con el teléfono y el paso
   * 'age' se salta — ver `nextStepId('gender', ...)`. Si se preguntó de
   * nuevo, se guarda para no volver a pedirla la próxima vez. */
  birthdate?: string
  service?: typeof INTAKE_SERVICES[number]
  otherQuery?: string
  size?: string
  zone?: string
  subzone?: string
  color?: string
  skinTone?: string
  style?: string
  photos?: File[]
  description?: string
  email?: string
  availability?: string
}

export function nextStepId(current: StepId, answers: Answers, askAvailability: boolean = true): StepId | null {
  switch (current) {
    case 'phone': return answers.name ? 'gender' : 'name'
    case 'name': return 'gender'
    // Si ya conocemos la edad (cliente existente con `birthdate` guardado,
    // resuelto en el paso 'phone'), saltamos 'age' directo a 'service'.
    case 'gender': return answers.age !== undefined ? 'service' : 'age'
    case 'age': return 'service'
    case 'service': return answers.service === 'Otro' ? 'other' : 'size'
    case 'other': return null
    case 'size': return 'zone'
    case 'zone': return 'color'
    case 'subzone': return 'color'
    case 'color': return 'skin'
    case 'skin': return 'style'
    case 'style': return 'photos'
    case 'photos': return 'description'
    case 'description': return answers.email ? (askAvailability ? 'availability' : 'summary') : 'contact'
    case 'contact': return askAvailability ? 'availability' : 'summary'
    case 'availability': return 'summary'
    case 'summary': return null
  }
}

/** "Brazo — Antebrazo" o solo la zona si no hay subzona útil. */
export function buildBodyZone(answers: Answers): string {
  const { zone = 'No lo sé', subzone } = answers
  if (subzone && subzone !== 'No lo sé') return `${zone} — ${subzone}`
  return zone
}

/** Pregunta del bot para un paso dado. Depende de `answers` solo para `service` (usa el nombre). */
export function questionFor(step: StepId, answers: Answers): string {
  switch (step) {
    case 'phone': return COPY.askPhone
    case 'name': return COPY.askName
    case 'gender':
      return answers.knownClient && answers.name
        ? `¡Qué bueno verte de nuevo, ${answers.name.split(' ')[0]}! Ya tengo tus datos guardados. ¿Sos hombre o mujer?`
        : COPY.askGender
    case 'age': return COPY.askAge
    case 'service': return COPY.askService(answers.name ?? '')
    case 'other': return COPY.askOther
    case 'size': return COPY.askSize
    case 'zone': return COPY.askZone
    case 'subzone': return COPY.askSubzone
    case 'color': return COPY.askColor
    case 'skin': return COPY.askSkin
    case 'style': return COPY.askStyle
    case 'photos': return COPY.askPhotos
    case 'description': return COPY.askDescription
    case 'contact': return COPY.askContact
    case 'availability': return COPY.askAvailability
    case 'summary': return COPY.summaryTitle
  }
}

export type HistoryItem = { stepId: StepId; question: string; answer: string }

export type EditOutcome = {
  history: HistoryItem[]
  answers: Answers
  current: StepId
  done: boolean
  /** Paso a reabrir en edición inmediatamente (inserción/limpieza de subzone), o null si la edición termina aquí. */
  reopenAs: StepId | null
}

/**
 * Aplica la edición de un paso ya respondido (tap-to-edit en el history).
 * Pura: no toca DOM ni estado de React. Cubre las dos reglas de dependencia
 * del dominio (zone <-> subzone, service trunca lo posterior); el resto de
 * pasos son ediciones simples sin efecto sobre el resto del history.
 */
export function applyEdit(params: {
  history: HistoryItem[]
  answers: Answers
  current: StepId
  done: boolean
  stepId: StepId
  label: string
  patch: Partial<Answers>
}): EditOutcome {
  const { history, answers, current, done, stepId, label, patch } = params

  if (stepId === 'service') {
    const oldService = answers.service
    const newService = patch.service ?? oldService
    const idx = history.findIndex(h => h.stepId === 'service')
    const existing = idx === -1 ? undefined : history[idx]
    const updatedItem: HistoryItem = existing
      ? { ...existing, answer: label }
      : { stepId: 'service', question: questionFor('service', answers), answer: label }

    if (newService === oldService) {
      const nextHistory = history.map((h, i) => (i === idx ? updatedItem : h))
      return {
        history: nextHistory,
        answers: { ...answers, ...patch },
        current,
        done,
        reopenAs: null,
      }
    }

    // Cambiar de servicio invalida todo lo posterior: es el único caso destructivo.
    const truncated = idx === -1 ? history : [...history.slice(0, idx), updatedItem]
    const nextAnswers: Answers = { name: answers.name, service: newService }
    const nextCurrent = nextStepId('service', nextAnswers) ?? current
    return {
      history: truncated,
      answers: nextAnswers,
      current: nextCurrent,
      done: false,
      reopenAs: null,
    }
  }

  if (stepId === 'zone') {
    const mergedAnswers: Answers = { ...answers, ...patch, subzone: undefined }
    const zoneIdx = history.findIndex(h => h.stepId === 'zone')
    const subzoneIdx = history.findIndex(h => h.stepId === 'subzone')
    const willHaveSubzone = nextStepId('zone', { zone: patch.zone }) === 'subzone'
    const hadSubzoneItem = subzoneIdx !== -1

    const existingZoneItem = zoneIdx === -1 ? undefined : history[zoneIdx]
    const updatedZoneItem: HistoryItem = existingZoneItem
      ? { ...existingZoneItem, answer: label }
      : { stepId: 'zone', question: questionFor('zone', mergedAnswers), answer: label }
    let nextHistory = history.map((h, i) => (i === zoneIdx ? updatedZoneItem : h))

    if (willHaveSubzone && !hadSubzoneItem) {
      // Antes no había subzone: se inserta el item justo después de zone, en modo edición.
      const placeholder: HistoryItem = {
        stepId: 'subzone',
        question: questionFor('subzone', mergedAnswers),
        answer: '',
      }
      const insertAt = nextHistory.findIndex(h => h.stepId === 'zone') + 1
      nextHistory = [...nextHistory.slice(0, insertAt), placeholder, ...nextHistory.slice(insertAt)]
      return { history: nextHistory, answers: mergedAnswers, current, done, reopenAs: 'subzone' }
    }

    if (willHaveSubzone && hadSubzoneItem) {
      // Ya había subzone (p. ej. Brazo -> Pierna): se mantiene el item pero se limpia
      // y se reabre en edición inmediata con las opciones de la nueva zona.
      nextHistory = nextHistory.map(h =>
        h.stepId === 'subzone'
          ? { ...h, question: questionFor('subzone', mergedAnswers), answer: '' }
          : h
      )
      return { history: nextHistory, answers: mergedAnswers, current, done, reopenAs: 'subzone' }
    }

    if (!willHaveSubzone && hadSubzoneItem) {
      // La nueva zona no tiene subzonas: se elimina el item subzone del history.
      nextHistory = nextHistory.filter(h => h.stepId !== 'subzone')
      return { history: nextHistory, answers: mergedAnswers, current, done, reopenAs: null }
    }

    // Sin subzone antes ni ahora: edición simple.
    return { history: nextHistory, answers: mergedAnswers, current, done, reopenAs: null }
  }

  // Edición simple: no tiene pasos dependientes, solo se reemplaza el item y se funde el patch.
  const idx = history.findIndex(h => h.stepId === stepId)
  const nextHistory = idx === -1 ? history : history.map((h, i) => (i === idx ? { ...h, answer: label } : h))
  return {
    history: nextHistory,
    answers: { ...answers, ...patch },
    current,
    done,
    reopenAs: null,
  }
}
