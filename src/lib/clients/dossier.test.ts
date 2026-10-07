import { describe, it, expect } from 'vitest'
import { clientTotals, clientAppointments } from './dossier'
import type { ProjectSummary } from '@/queries/projects'

// Factory mínima de ProjectSummary para los tests.
function project(over: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'p1',
    studio_id: 's1',
    client_id: 'c1',
    artist_id: 'artist1',
    name: 'Dragón',
    status: 'in_progress',
    total_value: 1_000_000,
    deposit: null,
    session_count: 2,
    deposit_percentage: null,
    notes: null,
    manual_progress: null,
    worked_minutes: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    clients: { name: 'Laura', phone: null },
    sessions: [],
    payments: [],
    gallery: [],
    quotes: null,
    ...over,
  }
}

describe('clientTotals', () => {
  it('cuenta proyectos y suma pagos y saldos', () => {
    const projects = [
      project({ id: 'a', total_value: 1_000_000, payments: [{ id: 'pay-a', amount: 400_000, session_id: null, paid_at: '2026-01-05T00:00:00.000Z', payment_method: null }] }),
      project({ id: 'b', total_value: 600_000, payments: [{ id: 'pay-b', amount: 600_000, session_id: null, paid_at: '2026-01-06T00:00:00.000Z', payment_method: null }] }),
    ]
    const t = clientTotals(projects)
    expect(t.projectCount).toBe(2)
    expect(t.totalPaid).toBe(1_000_000)
    // saldo: (1.000.000-400.000) + (600.000-600.000) = 600.000
    expect(t.totalBalance).toBe(600_000)
  })
  it('sin proyectos: todo en cero', () => {
    expect(clientTotals([])).toEqual({ projectCount: 0, totalPaid: 0, totalBalance: 0 })
  })
})

describe('clientAppointments', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')
  it('separa próximas de pasadas, excluye canceladas de próximas, ordena', () => {
    const projects = [
      project({
        id: 'a',
        name: 'Dragón',
        sessions: [
          { id: 's1', status: 'completed', scheduled_at: '2026-06-01T15:00:00.000Z', duration_minutes: 60 },
          { id: 's2', status: 'scheduled', scheduled_at: '2026-06-20T15:00:00.000Z', duration_minutes: 90 },
          { id: 's3', status: 'cancelled', scheduled_at: '2026-06-25T15:00:00.000Z', duration_minutes: 30 },
        ],
      }),
    ]
    const { upcoming, past } = clientAppointments(projects, now)
    // próximas: solo s2 (s3 cancelada excluida)
    expect(upcoming.map((a) => a.id)).toEqual(['s2'])
    expect(upcoming[0]?.projectName).toBe('Dragón')
    // pasadas: s1 (y la cancelada s3 NO cuenta como próxima ni pasada futura; es pasada solo si su fecha < now)
    expect(past.map((a) => a.id)).toEqual(['s1'])
  })
  it('ordena próximas ascendente y pasadas descendente', () => {
    const projects = [
      project({
        id: 'a',
        sessions: [
          { id: 'p_old', status: 'completed', scheduled_at: '2026-05-01T15:00:00.000Z', duration_minutes: 60 },
          { id: 'p_recent', status: 'completed', scheduled_at: '2026-06-10T15:00:00.000Z', duration_minutes: 60 },
          { id: 'u_near', status: 'scheduled', scheduled_at: '2026-06-18T15:00:00.000Z', duration_minutes: 60 },
          { id: 'u_far', status: 'scheduled', scheduled_at: '2026-07-01T15:00:00.000Z', duration_minutes: 60 },
        ],
      }),
    ]
    const { upcoming, past } = clientAppointments(projects, now)
    expect(upcoming.map((a) => a.id)).toEqual(['u_near', 'u_far'])
    expect(past.map((a) => a.id)).toEqual(['p_recent', 'p_old'])
  })
})
