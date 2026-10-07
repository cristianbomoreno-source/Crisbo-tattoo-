import { describe, it, expect } from 'vitest'
import type { SessionWithProject } from '@/queries/sessions'
import type { ProjectSummary } from '@/queries/projects'
import {
  firstName, greetingWord, daysInMonth, sessionsInMonth, monthMetrics,
  deltaPct, monthHeatmap, weekdayIndexMonday, dailySessionCounts, dailyProjectedIncome, WORKDAY_MINUTES,
  weekdayKeyOf, scheduleWorkdayMinutes, isOpenDay, type StudioSchedule,
} from './month-metrics'

// Helpers de fixtures mínimos (solo los campos que usan las puras).
const s = (id: string, project_id: string, iso: string, mins: number, status: SessionWithProject['status'] = 'scheduled') =>
  ({ id, project_id, scheduled_at: iso, duration_minutes: mins, status } as SessionWithProject)
const p = (id: string, total: number, status: ProjectSummary['status'], paid: number[] = []) =>
  ({ id, status, total_value: total, payments: paid.map((amount) => ({ amount })), sessions: [] } as unknown as ProjectSummary)

describe('firstName', () => {
  it('toma el primer token', () => expect(firstName('Cristian Restrepo')).toBe('Cristian'))
  it('nombre simple', () => expect(firstName('Ana')).toBe('Ana'))
})

describe('greetingWord', () => {
  it('mañana', () => expect(greetingWord(8)).toBe('Buenos días'))
  it('tarde', () => expect(greetingWord(15)).toBe('Buenas tardes'))
  it('noche', () => expect(greetingWord(21)).toBe('Buenas noches'))
})

describe('daysInMonth', () => {
  it('julio 2026 = 31', () => expect(daysInMonth('2026-07')).toBe(31))
  it('febrero 2026 = 28', () => expect(daysInMonth('2026-02')).toBe(28))
})

describe('sessionsInMonth', () => {
  it('filtra por mes y excluye canceladas', () => {
    const list = [
      s('1', 'a', '2026-07-10T15:00:00Z', 60),
      s('2', 'a', '2026-08-01T15:00:00Z', 60),
      s('3', 'a', '2026-07-11T15:00:00Z', 60, 'cancelled'),
    ]
    expect(sessionsInMonth(list, '2026-07').map((x) => x.id)).toEqual(['1'])
  })
})

describe('monthMetrics', () => {
  const sessions = [
    s('1', 'p1', '2026-07-10T15:00:00Z', 240),
    s('2', 'p1', '2026-07-11T15:00:00Z', 480),
    s('3', 'p2', '2026-07-20T15:00:00Z', 120),
    s('x', 'p3', '2026-07-05T15:00:00Z', 60, 'cancelled'),
  ]
  const projects = [
    p('p1', 1_000_000, 'in_progress', [300_000]),
    p('p2', 500_000, 'scheduled', []),
    p('p3', 800_000, 'completed', [800_000]),
  ]
  const m = monthMetrics('2026-07', sessions, projects, ['2026-07-04'], '2026-07-01')

  it('cuenta sesiones no canceladas del mes', () => expect(m.scheduledSessions).toBe(3))
  it('ingresos = total_value de proyectos con sesion en el mes (p1+p2)', () =>
    expect(m.projectedIncome).toBe(1_500_000))
  it('por cobrar = saldos de proyectos no completados (p1 700k + p2 500k)', () =>
    expect(m.pendingToCollect).toBe(1_200_000))
  it('ocupacion = dias con sesion(3) / dias habiles(31-1 bloqueado=30)', () =>
    expect(m.occupancyPct).toBe(Math.round((3 / 30) * 100)))
  it('dias libres desde 2026-07-01: 31 - 3 con sesion - 1 bloqueado = 27', () =>
    expect(m.freeDays).toBe(27))
  it('dias con sesion = 3 (dias distintos)', () => expect(m.daysWithSession).toBe(3))
  it('dias del mes = 31', () => expect(m.daysInMonth).toBe(31))
})

describe('dailyProjectedIncome', () => {
  it('acumula el valor del proyecto por dia con sesion', () => {
    const sessions = [
      s('1', 'p1', '2026-07-10T15:00:00Z', 60),
      s('2', 'p2', '2026-07-10T18:00:00Z', 60),
      s('3', 'p1', '2026-07-20T15:00:00Z', 60),
      s('x', 'p1', '2026-07-05T15:00:00Z', 60, 'cancelled'),
    ]
    const projects = [p('p1', 1_000_000, 'in_progress'), p('p2', 500_000, 'scheduled')]
    const series = dailyProjectedIncome('2026-07', sessions, projects)
    expect(series).toHaveLength(31)
    expect(series[9]).toBe(1_500_000) // dia 10: p1 + p2
    expect(series[19]).toBe(1_000_000) // dia 20: p1
    expect(series[4]).toBe(0) // dia 5: cancelada -> no cuenta
  })
})

describe('deltaPct', () => {
  it('sube', () => expect(deltaPct(112, 100)).toBe(12))
  it('null si base 0 (no inventar)', () => expect(deltaPct(5, 0)).toBeNull())
})

describe('monthHeatmap', () => {
  const sessions = [
    s('1', 'a', '2026-07-10T15:00:00Z', 480), // full
    s('2', 'a', '2026-07-11T15:00:00Z', 120), // partial
  ]
  const cells = monthHeatmap('2026-07', sessions, ['2026-07-04'])
  it('31 celdas', () => expect(cells).toHaveLength(31))
  it('dia 10 = full', () => expect(cells[9]!.state).toBe('full'))
  it('dia 11 = partial con horas restantes', () => {
    expect(cells[10]!.state).toBe('partial')
    expect(cells[10]!.remainingMinutes).toBe(WORKDAY_MINUTES - 120)
  })
  it('dia 4 = blocked', () => expect(cells[3]!.state).toBe('blocked'))
  it('dia 1 = free', () => expect(cells[0]!.state).toBe('free'))
})

describe('weekdayIndexMonday', () => {
  it('2026-07-01 es miercoles -> indice 2 (lun=0)', () => expect(weekdayIndexMonday('2026-07')).toBe(2))
})

describe('dailySessionCounts', () => {
  it('cuenta por dia del mes', () => {
    const counts = dailySessionCounts('2026-07', [
      s('1', 'a', '2026-07-10T15:00:00Z', 60),
      s('2', 'a', '2026-07-10T18:00:00Z', 60),
    ])
    expect(counts).toHaveLength(31)
    expect(counts[9]).toBe(2)
    expect(counts[0]).toBe(0)
  })
})

describe('weekdayKeyOf', () => {
  it('2026-07-13 es lunes -> LUN', () => expect(weekdayKeyOf('2026-07-13')).toBe('LUN'))
  it('2026-07-12 es domingo -> DOM', () => expect(weekdayKeyOf('2026-07-12')).toBe('DOM'))
  it('2026-07-01 es miercoles -> MIE (consistente con weekdayIndexMonday)', () =>
    expect(weekdayKeyOf('2026-07-01')).toBe('MIE'))
  it('2026-07-18 es sabado -> SAB', () => expect(weekdayKeyOf('2026-07-18')).toBe('SAB'))
})

describe('scheduleWorkdayMinutes', () => {
  it('10:00-20:00 = 600 minutos', () =>
    expect(scheduleWorkdayMinutes({ openDays: null, openTime: '10:00', closeTime: '20:00' })).toBe(600))
  it('sin schedule (undefined) -> fallback 480', () => expect(scheduleWorkdayMinutes(undefined)).toBe(WORKDAY_MINUTES))
  it('openTime/closeTime faltantes -> fallback 480', () =>
    expect(scheduleWorkdayMinutes({ openDays: null, openTime: null, closeTime: null })).toBe(WORKDAY_MINUTES))
  it('formato invalido -> fallback 480', () =>
    expect(scheduleWorkdayMinutes({ openDays: null, openTime: '25:00', closeTime: '20:00' })).toBe(WORKDAY_MINUTES))
  it('closeTime <= openTime -> fallback 480', () =>
    expect(scheduleWorkdayMinutes({ openDays: null, openTime: '20:00', closeTime: '20:00' })).toBe(WORKDAY_MINUTES))
})

describe('isOpenDay', () => {
  const schedule: StudioSchedule = { openDays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], openTime: '10:00', closeTime: '18:00' }
  it('sin schedule -> siempre abierto', () => expect(isOpenDay('2026-07-12', undefined)).toBe(true))
  it('openDays null -> siempre abierto', () =>
    expect(isOpenDay('2026-07-12', { openDays: null, openTime: null, closeTime: null })).toBe(true))
  it('openDays vacio -> siempre abierto', () =>
    expect(isOpenDay('2026-07-12', { openDays: [], openTime: null, closeTime: null })).toBe(true))
  it('domingo (12) cerrado segun schedule', () => expect(isOpenDay('2026-07-12', schedule)).toBe(false))
  it('viernes (10) abierto segun schedule', () => expect(isOpenDay('2026-07-10', schedule)).toBe(true))
})

describe('monthMetrics con schedule', () => {
  const schedule: StudioSchedule = { openDays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], openTime: '10:00', closeTime: '18:00' }
  // Domingos de julio 2026: 5, 12, 19, 26 (cerrados). 31 - 4 = 27 dias abiertos.
  const sessions = [
    s('1', 'p1', '2026-07-10T15:00:00Z', 240), // viernes, abierto
    s('2', 'p1', '2026-07-11T15:00:00Z', 480), // sabado, abierto
    s('3', 'p2', '2026-07-12T15:00:00Z', 120), // domingo, CERRADO
    s('x', 'p3', '2026-07-05T15:00:00Z', 60, 'cancelled'), // domingo, cancelada
  ]
  const projects = [
    p('p1', 1_000_000, 'in_progress', [300_000]),
    p('p2', 500_000, 'scheduled', []),
    p('p3', 800_000, 'completed', [800_000]),
  ]
  const blocked = ['2026-07-04'] // sabado, abierto y bloqueado
  const m = monthMetrics('2026-07', sessions, projects, blocked, '2026-07-01', schedule)

  it('scheduledSessions cuenta tambien la sesion en dia cerrado (3)', () => expect(m.scheduledSessions).toBe(3))
  it('workableDays = dias abiertos(27) - bloqueados-abiertos(1) = 26', () => expect(m.workableDays).toBe(26))
  it('occupancy = dias-con-sesion-abiertos(2, excluye el domingo cerrado) / workableDays(26)', () =>
    expect(m.occupancyPct).toBe(Math.round((2 / 26) * 100)))
  it('freeDays = solo dias abiertos sin sesion ni bloqueo = 24', () => expect(m.freeDays).toBe(24))
  it('daysWithSession sigue contando dias distintos con sesion, cerrados o no (3)', () =>
    expect(m.daysWithSession).toBe(3))

  it('sin schedule, workableDays cae al fallback (total - bloqueados)', () => {
    const fallback = monthMetrics('2026-07', sessions, projects, blocked, '2026-07-01')
    expect(fallback.workableDays).toBe(30) // 31 - 1 bloqueado, todos los dias abiertos
  })

  it('daysWithSessionOpen excluye dias cerrados y bloqueados; daysWithSession los incluye', () => {
    const lunVie: StudioSchedule = { openDays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'], openTime: null, closeTime: null }
    const twoSessions = [
      s('a', 'p1', '2026-07-10T15:00:00Z', 240), // viernes, abierto
      s('b', 'p1', '2026-07-11T15:00:00Z', 240), // sabado, CERRADO (Lun-Vie)
    ]
    const withSchedule = monthMetrics('2026-07', twoSessions, projects, [], '2026-07-01', lunVie)
    expect(withSchedule.daysWithSession).toBe(2) // cuenta tambien el sabado cerrado
    expect(withSchedule.daysWithSessionOpen).toBe(1) // solo el viernes abierto (numerador del anillo)
    expect(withSchedule.daysWithSessionOpen).toBeLessThanOrEqual(withSchedule.workableDays)

    // Sin schedule: coinciden salvo bloqueados — una sesion en dia bloqueado cuenta en
    // daysWithSession pero NO en daysWithSessionOpen (el loop salta dias bloqueados).
    const noScheduleNoBlock = monthMetrics('2026-07', twoSessions, projects, [], '2026-07-01')
    expect(noScheduleNoBlock.daysWithSessionOpen).toBe(noScheduleNoBlock.daysWithSession) // 2 = 2

    const noScheduleBlockedSat = monthMetrics('2026-07', twoSessions, projects, ['2026-07-11'], '2026-07-01')
    expect(noScheduleBlockedSat.daysWithSession).toBe(2)
    expect(noScheduleBlockedSat.daysWithSessionOpen).toBe(1)
  })
})

describe('monthHeatmap con schedule', () => {
  const schedule: StudioSchedule = { openDays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'], openTime: '10:00', closeTime: '20:00' } // 600 min
  const sessions = [
    s('1', 'a', '2026-07-10T15:00:00Z', 600), // viernes, abierto -> full
    s('2', 'a', '2026-07-11T15:00:00Z', 120), // sabado, abierto -> partial
  ]
  const blocked = ['2026-07-04', '2026-07-19'] // 04 sabado(abierto), 19 domingo(cerrado)
  const cells = monthHeatmap('2026-07', sessions, blocked, WORKDAY_MINUTES, schedule)

  it('31 celdas', () => expect(cells).toHaveLength(31))
  it('dia 10 = full (600/600 con jornada del schedule)', () => expect(cells[9]!.state).toBe('full'))
  it('dia 11 = partial con remainingMinutes segun schedule (600-120=480)', () => {
    expect(cells[10]!.state).toBe('partial')
    expect(cells[10]!.remainingMinutes).toBe(480)
  })
  it('dia 12 (domingo, cerrado, sin bloqueo) = closed', () => expect(cells[11]!.state).toBe('closed'))
  it('dia 4 (sabado abierto pero bloqueado) = blocked', () => expect(cells[3]!.state).toBe('blocked'))
  it('dia 19 (domingo cerrado Y bloqueado) = blocked (bloqueado prevalece sobre cerrado)', () =>
    expect(cells[18]!.state).toBe('blocked'))
  it('dia 1 (miercoles, abierto, sin sesion) = free', () => expect(cells[0]!.state).toBe('free'))
})
