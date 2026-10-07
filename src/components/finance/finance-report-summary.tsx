'use client'

import { cop } from '@/lib/projects/metrics'
import {
  Receipt,
  CheckCircle2,
  Clock,
  Users,
  UserPlus,
  Wallet,
  TrendingUp,
  Calendar,
  Banknote,
  PiggyBank,
  Target,
  BarChart3,
} from 'lucide-react'

type ReportData = {
  // Cotizaciones
  totalQuotes: number
  quotedValue: number
  approvedQuotes: number
  approvedValue: number
  pendingQuotes: number
  pendingValue: number
  rejectedQuotes: number
  conversionRate: number | null

  // Ingresos
  confirmedIncome: number
  pendingIncome: number
  averageTicket: number

  // Producción
  totalSessions: number
  completedSessions: number
  hoursWorked: number

  // Clientes
  totalActiveClients: number
  newClients: number
  recurringClients: number

  // Gastos
  totalExpenses: number
  profit: number | null

  // Periodo
  fromDate: string
  toDate: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  subvalue,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subvalue?: string
  variant?: 'default' | 'success' | 'warning' | 'primary'
}) {
  const bgClasses = {
    default: 'bg-white/[0.03]',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    primary: 'bg-primary/10',
  }
  const iconClasses = {
    default: 'text-muted-foreground',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    primary: 'text-primary',
  }

  return (
    <div className={`rounded-xl p-4 ${bgClasses[variant]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-4 ${iconClasses[variant]}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-display text-xl font-semibold tabular-nums text-white">{value}</p>
      {subvalue && <p className="text-xs text-muted-foreground mt-0.5">{subvalue}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </h3>
  )
}

export function FinanceReportSummary({ data }: { data: ReportData }) {
  const fromLabel = new Date(data.fromDate + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const toLabel = new Date(data.toDate + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Reporte Financiero</h2>
          <p className="text-sm text-muted-foreground">
            {fromLabel} — {toLabel}
          </p>
        </div>
        <BarChart3 className="size-6 text-primary" />
      </div>

      {/* Resumen Principal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Receipt}
          label="Cotizaciones"
          value={data.totalQuotes}
          subvalue={cop(data.quotedValue)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Aprobadas"
          value={data.approvedQuotes}
          subvalue={cop(data.approvedValue)}
          variant="success"
        />
        <StatCard
          icon={Wallet}
          label="Cobrado"
          value={cop(data.confirmedIncome)}
          variant="primary"
        />
        <StatCard
          icon={PiggyBank}
          label="Utilidad"
          value={data.profit !== null ? cop(data.profit) : '—'}
          subvalue={data.profit !== null ? `Gastos: ${cop(data.totalExpenses)}` : 'Sin gastos registrados'}
          variant={data.profit !== null && data.profit > 0 ? 'success' : 'default'}
        />
      </div>

      {/* Cotizaciones */}
      <div>
        <SectionTitle>Cotizaciones</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Receipt}
            label="Total cotizaciones"
            value={data.totalQuotes}
            subvalue={cop(data.quotedValue)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Aprobadas"
            value={data.approvedQuotes}
            subvalue={`${data.conversionRate ?? 0}% conversión`}
            variant="success"
          />
          <StatCard
            icon={Clock}
            label="Pendientes"
            value={data.pendingQuotes}
            subvalue={cop(data.pendingValue)}
            variant="warning"
          />
          <StatCard
            icon={Target}
            label="Ticket promedio"
            value={cop(data.averageTicket)}
          />
        </div>
      </div>

      {/* Ingresos */}
      <div>
        <SectionTitle>Ingresos</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={Banknote}
            label="Ingresos confirmados"
            value={cop(data.confirmedIncome)}
            variant="primary"
          />
          <StatCard
            icon={Clock}
            label="Por cobrar"
            value={cop(data.pendingIncome)}
            variant="warning"
          />
          <StatCard
            icon={TrendingUp}
            label="Valor aprobado"
            value={cop(data.approvedValue)}
            variant="success"
          />
        </div>
      </div>

      {/* Producción */}
      <div>
        <SectionTitle>Producción</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={Calendar}
            label="Sesiones totales"
            value={data.totalSessions}
          />
          <StatCard
            icon={CheckCircle2}
            label="Sesiones completadas"
            value={data.completedSessions}
            variant="success"
          />
          <StatCard
            icon={Clock}
            label="Horas trabajadas"
            value={`${data.hoursWorked.toFixed(1)}h`}
          />
        </div>
      </div>

      {/* Clientes */}
      <div>
        <SectionTitle>Clientes</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Users}
            label="Clientes activos"
            value={data.totalActiveClients}
          />
          <StatCard
            icon={UserPlus}
            label="Nuevos"
            value={data.newClients}
            variant="success"
          />
          <StatCard
            icon={Users}
            label="Recurrentes"
            value={data.recurringClients}
            variant="primary"
          />
        </div>
      </div>
    </div>
  )
}

export type { ReportData }
