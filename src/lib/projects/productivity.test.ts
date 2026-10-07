import { describe, it, expect } from 'vitest'
import type { ProjectSummary } from '@/queries/projects'
import { productivityMetrics, formatHM } from './productivity'

const sess = (status: string, iso: string, mins: number) =>
  ({ id: Math.random().toString(), status, scheduled_at: iso, duration_minutes: mins })

const proj = (
  status: ProjectSummary['status'],
  updated_at: string,
  sessions: ReturnType<typeof sess>[],
) => ({ status, updated_at, sessions } as unknown as ProjectSummary)

describe('formatHM', () => {
  it('horas y minutos', () => expect(formatHM(150)).toBe('2h 30m'))
  it('solo horas', () => expect(formatHM(120)).toBe('2h'))
  it('solo minutos', () => expect(formatHM(45)).toBe('45m'))
  it('cero', () => expect(formatHM(0)).toBe('0m'))
})

describe('productivityMetrics', () => {
  const projects = [
    proj('in_progress', '2026-07-02T10:00:00Z', [
      sess('completed', '2026-07-10T15:00:00Z', 150), // tatuada
      sess('scheduled', '2026-07-20T15:00:00Z', 120), // pendiente
      sess('cancelled', '2026-07-05T15:00:00Z', 60), // ignorada
      sess('completed', '2026-08-01T15:00:00Z', 90), // otro mes, ignorada
    ]),
    proj('completed', '2026-07-28T10:00:00Z', [
      sess('completed', '2026-07-12T15:00:00Z', 90), // tatuada
    ]),
    proj('completed', '2026-06-15T10:00:00Z', []), // finalizado en junio, no cuenta en julio
  ]
  const m = productivityMetrics('2026-07', projects)

  it('horas tatuadas = completadas del mes (150 + 90)', () =>
    expect(m.tattooedMinutes).toBe(240))
  it('sesiones realizadas = 2', () => expect(m.sessionsDone).toBe(2))
  it('horas pendientes = agendadas no completadas del mes (120)', () =>
    expect(m.pendingMinutes).toBe(120))
  it('proyectos finalizados en el mes = 1 (el completado en julio)', () =>
    expect(m.projectsFinished).toBe(1))
})
