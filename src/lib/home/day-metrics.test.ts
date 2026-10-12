import { describe, it, expect } from 'vitest'
import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import { todayClientCount, nextAppointment, daySummary, monthSummary } from './day-metrics'

const sess = (
  id: string, project_id: string, iso: string, client: string | null,
  status: SessionWithProject['status'] = 'scheduled',
) =>
  ({
    id, project_id, scheduled_at: iso, duration_minutes: 60, status,
    projects: { name: `Proj ${project_id}`, clients: client ? { name: client, phone: null } : null },
  } as unknown as SessionWithProject)

const proj = (id: string, total: number, paid: number[] = []) =>
  ({ id, total_value: total, payments: paid.map((amount) => ({ amount })) } as unknown as ProjectSummary)

describe('todayClientCount', () => {
  it('cuenta clientes distintos por nombre', () => {
    const list = [sess('1','a','2026-07-08T15:00:00Z','Ana'), sess('2','b','2026-07-08T18:00:00Z','Ana'), sess('3','c','2026-07-08T20:00:00Z','Beto')]
    expect(todayClientCount(list)).toBe(2)
  })
  it('ignora sesiones sin cliente', () => {
    expect(todayClientCount([sess('1','a','2026-07-08T15:00:00Z', null)])).toBe(0)
  })
})

describe('nextAppointment', () => {
  const now = '2026-07-08T16:00:00Z'
  it('la próxima futura no cancelada', () => {
    const list = [
      sess('past','a','2026-07-08T10:00:00Z','Ana'),
      sess('next','b','2026-07-08T18:00:00Z','Beto'),
      sess('later','c','2026-07-08T20:00:00Z','Cid'),
      sess('cxl','d','2026-07-08T17:00:00Z','X','cancelled'),
    ]
    const n = nextAppointment(list, now)
    expect(n?.clientName).toBe('Beto')
    expect(n?.time).toBe('2026-07-08T18:00:00Z')
  })
  it('null si no hay futuras', () => {
    expect(nextAppointment([sess('past','a','2026-07-08T10:00:00Z','Ana')], now)).toBeNull()
  })
})

describe('daySummary', () => {
  it('esperados/abonos/pendiente de proyectos con cita hoy (distintos)', () => {
    const today = [sess('1','p1','2026-07-08T15:00:00Z','Ana'), sess('2','p1','2026-07-08T18:00:00Z','Ana'), sess('3','p2','2026-07-08T20:00:00Z','Beto')]
    const projects = [proj('p1', 1_000_000, [300_000]), proj('p2', 500_000, []), proj('p3', 999, [])]
    const d = daySummary(today, projects)
    expect(d.expected).toBe(1_500_000) // p1 + p2 (p1 no se duplica)
    expect(d.deposits).toBe(300_000)
    expect(d.pending).toBe(1_200_000)
  })
  it('pendiente nunca negativo', () => {
    const d = daySummary([sess('1','p1','2026-07-08T15:00:00Z','Ana')], [proj('p1', 100, [500])])
    expect(d.pending).toBe(0)
  })
})

describe('monthSummary', () => {
  const projWithPays = (id: string, pays: [number, string][]) =>
    ({ id, total_value: 0, payments: pays.map(([amount, paid_at]) => ({ amount, paid_at })) } as unknown as ProjectSummary)

  it('suma pagos del mes en hora de Colombia y compara con el mes anterior', () => {
    const projects = [
      projWithPays('a', [[100, '2026-10-05T15:00:00Z'], [50, '2026-09-20T15:00:00Z']]),
      // 1 oct 03:00 UTC = 30 sep 22:00 en Colombia → cuenta para septiembre.
      projWithPays('b', [[30, '2026-10-01T03:00:00Z']]),
    ]
    const r = monthSummary('2026-10', [], projects, [], '2026-10-12T15:00:00Z')
    expect(r.income).toBe(100)
    expect(r.prevIncome).toBe(80)
  })

  it('cuenta citas no canceladas del mes y cotizaciones en espera', () => {
    const sessions = [
      sess('1', 'a', '2026-10-02T15:00:00Z', 'Ana'),
      sess('2', 'a', '2026-10-20T15:00:00Z', 'Ana'),
      sess('3', 'a', '2026-10-21T15:00:00Z', 'Ana', 'cancelled'),
      sess('4', 'a', '2026-11-01T15:00:00Z', 'Ana'),
    ]
    const quotes = [{ status: 'new' }, { status: 'quoted' }, { status: 'reviewed' }, { status: 'approved' }, { status: 'rejected' }]
    const r = monthSummary('2026-10', sessions, [], quotes, '2026-10-12T15:00:00Z')
    expect(r.scheduled).toBe(2)
    expect(r.upcoming).toBe(1)
    expect(r.waitingQuotes).toBe(3)
    expect(r.newQuotes).toBe(1)
  })
})
