import type { FinanceHealth } from './metrics'

/**
 * Gasto fijo con fecha de vencimiento (día del mes).
 */
export type FixedExpense = {
  id: string
  name: string
  amount: number
  due_day: number
}

/**
 * Alerta de gasto próximo a vencer.
 */
export type UpcomingExpenseAlert = {
  expense: FixedExpense
  daysUntilDue: number
  dailyTargetToPayIt: number
  status: 'urgent' | 'warning' | 'ok'
  message: string
}

/**
 * Calcula cuántos días faltan hasta un día del mes.
 * Si el día ya pasó este mes, calcula para el próximo mes.
 */
function daysUntilDueDay(dueDay: number, today: Date): number {
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Días en el mes actual
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Ajustar due_day si es mayor que los días del mes
  const adjustedDueDay = Math.min(dueDay, daysInCurrentMonth)

  if (adjustedDueDay >= currentDay) {
    // El vencimiento es este mes
    return adjustedDueDay - currentDay
  } else {
    // El vencimiento es el próximo mes
    const daysInNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate()
    const adjustedNextDueDay = Math.min(dueDay, daysInNextMonth)
    const daysLeftThisMonth = daysInCurrentMonth - currentDay
    return daysLeftThisMonth + adjustedNextDueDay
  }
}

/**
 * Calcula alertas de gastos fijos próximos a vencer.
 *
 * - Urgente: vence en <= 3 días
 * - Warning: vence en <= 7 días
 * - OK: más de 7 días
 *
 * dailyTargetToPayIt = monto / días hasta vencimiento
 */
export function calculateUpcomingExpenseAlerts(
  fixedExpenses: FixedExpense[],
  availableMoney: number,
  today: Date = new Date()
): UpcomingExpenseAlert[] {
  const alerts: UpcomingExpenseAlert[] = []

  for (const expense of fixedExpenses) {
    if (!expense.due_day || expense.due_day < 1 || expense.due_day > 31) continue

    const daysUntilDue = daysUntilDueDay(expense.due_day, today)
    const dailyTargetToPayIt = daysUntilDue > 0 ? Math.ceil(expense.amount / daysUntilDue) : expense.amount

    let status: UpcomingExpenseAlert['status']
    let message: string

    if (daysUntilDue <= 0) {
      status = 'urgent'
      message = `${expense.name} vence hoy. Necesitas ${expense.amount.toLocaleString('es-CO')} COP.`
    } else if (daysUntilDue <= 3) {
      status = 'urgent'
      message = `${expense.name} vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}. Genera ${dailyTargetToPayIt.toLocaleString('es-CO')} COP/día.`
    } else if (daysUntilDue <= 7) {
      status = 'warning'
      message = `${expense.name} vence en ${daysUntilDue} días. Meta diaria: ${dailyTargetToPayIt.toLocaleString('es-CO')} COP.`
    } else {
      status = 'ok'
      message = `${expense.name} vence el día ${expense.due_day}. Tienes ${daysUntilDue} días.`
    }

    alerts.push({
      expense,
      daysUntilDue,
      dailyTargetToPayIt,
      status,
      message,
    })
  }

  // Ordenar: urgentes primero, luego warnings, luego ok
  // Dentro de cada grupo, ordenar por días hasta vencimiento
  return alerts.sort((a, b) => {
    const statusOrder = { urgent: 0, warning: 1, ok: 2 }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return a.daysUntilDue - b.daysUntilDue
  })
}

/**
 * Tipo de recomendación inteligente.
 */
export type SmartRecommendationType = 'alert' | 'income' | 'expense' | 'goal' | 'info'

/**
 * Recomendación inteligente basada en métricas y alertas.
 */
export type SmartRecommendation = {
  id: string
  type: SmartRecommendationType
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  metric?: {
    label: string
    value: string
    target?: string
  }
}

type MetricsForRecommendations = {
  confirmedIncome: number
  quotedValue: number
  monthlyGoal: number | null
  pendingPayments: number
  collectedPct: number | null
  hoursWorked: number
  sessionsThisMonth: number
  availableMoney: number
}

/**
 * Genera recomendaciones inteligentes basadas en métricas y alertas de gastos.
 */
export function getSmartRecommendations(
  metrics: MetricsForRecommendations,
  alerts: UpcomingExpenseAlert[]
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = []
  let id = 0

  // 1. Alertas de gastos urgentes
  const urgentAlerts = alerts.filter((a) => a.status === 'urgent')
  if (urgentAlerts.length > 0) {
    const totalUrgent = urgentAlerts.reduce((sum, a) => sum + a.expense.amount, 0)
    recommendations.push({
      id: String(++id),
      type: 'alert',
      priority: 'high',
      title: `${urgentAlerts.length} gasto${urgentAlerts.length > 1 ? 's' : ''} por vencer`,
      description: urgentAlerts.map((a) => a.expense.name).join(', '),
      action: `Necesitas generar ${totalUrgent.toLocaleString('es-CO')} COP`,
      metric: {
        label: 'Total urgente',
        value: `${totalUrgent.toLocaleString('es-CO')} COP`,
      },
    })
  }

  // 2. Alertas de gastos en warning
  const warningAlerts = alerts.filter((a) => a.status === 'warning')
  if (warningAlerts.length > 0) {
    const totalWarning = warningAlerts.reduce((sum, a) => sum + a.expense.amount, 0)
    const avgDays = Math.round(warningAlerts.reduce((sum, a) => sum + a.daysUntilDue, 0) / warningAlerts.length)
    recommendations.push({
      id: String(++id),
      type: 'expense',
      priority: 'medium',
      title: `${warningAlerts.length} gasto${warningAlerts.length > 1 ? 's' : ''} esta semana`,
      description: `${warningAlerts.map((a) => a.expense.name).join(', ')} vencen pronto`,
      action: `Prepara ${totalWarning.toLocaleString('es-CO')} COP en ~${avgDays} días`,
      metric: {
        label: 'Promedio de días',
        value: String(avgDays),
      },
    })
  }

  // 3. Meta mensual
  if (metrics.monthlyGoal && metrics.monthlyGoal > 0) {
    const progress = Math.round((metrics.quotedValue / metrics.monthlyGoal) * 100)
    const remaining = Math.max(0, metrics.monthlyGoal - metrics.quotedValue)

    if (progress < 50) {
      recommendations.push({
        id: String(++id),
        type: 'goal',
        priority: 'medium',
        title: 'Meta mensual en riesgo',
        description: `Llevas ${progress}% de tu meta de facturación`,
        action: `Faltan ${remaining.toLocaleString('es-CO')} COP`,
        metric: {
          label: 'Progreso',
          value: `${progress}%`,
          target: '100%',
        },
      })
    } else if (progress >= 100) {
      recommendations.push({
        id: String(++id),
        type: 'goal',
        priority: 'low',
        title: 'Meta mensual cumplida',
        description: `Superaste tu meta en ${progress - 100}%`,
        metric: {
          label: 'Logrado',
          value: `${progress}%`,
        },
      })
    }
  }

  // 4. Pagos pendientes altos
  if (metrics.pendingPayments > 0 && metrics.collectedPct !== null && metrics.collectedPct < 60) {
    recommendations.push({
      id: String(++id),
      type: 'income',
      priority: 'high',
      title: 'Cobros pendientes',
      description: `Solo has cobrado el ${metrics.collectedPct}% de lo facturado`,
      action: `Cobra ${metrics.pendingPayments.toLocaleString('es-CO')} COP pendientes`,
      metric: {
        label: 'Por cobrar',
        value: `${metrics.pendingPayments.toLocaleString('es-CO')} COP`,
      },
    })
  }

  // 5. Productividad
  if (metrics.hoursWorked > 0 && metrics.confirmedIncome > 0) {
    const valuePerHour = Math.round(metrics.confirmedIncome / metrics.hoursWorked)
    if (valuePerHour < 50000) {
      recommendations.push({
        id: String(++id),
        type: 'info',
        priority: 'low',
        title: 'Optimiza tu tiempo',
        description: `Tu valor/hora es ${valuePerHour.toLocaleString('es-CO')} COP`,
        action: 'Considera ajustar precios o reducir tiempos',
        metric: {
          label: 'Valor/hora',
          value: `${valuePerHour.toLocaleString('es-CO')} COP`,
        },
      })
    }
  }

  // 6. Sin actividad
  if (metrics.sessionsThisMonth === 0 && metrics.quotedValue === 0) {
    recommendations.push({
      id: String(++id),
      type: 'info',
      priority: 'medium',
      title: 'Activa tu agenda',
      description: 'No tienes sesiones ni cotizaciones este mes',
      action: 'Promociona tus servicios o revisa tu enlace de citas',
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
