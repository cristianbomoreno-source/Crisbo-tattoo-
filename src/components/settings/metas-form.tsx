'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Target } from 'lucide-react'

import { updateMonthlyGoals } from '@/actions/studio'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'

type Props = {
  quotedValue: number | null
  approvedProjects: number | null
  scheduledSessions: number | null
}

/** '' en el input = sin meta (null). Cualquier otro valor se guarda como número. */
function toStr(n: number | null): string {
  return n === null ? '' : String(n)
}
function toNumOrNull(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function MetasForm({ quotedValue, approvedProjects, scheduledSessions }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [quoted, setQuoted] = useState(toStr(quotedValue))
  const [approved, setApproved] = useState(toStr(approvedProjects))
  const [sessions, setSessions] = useState(toStr(scheduledSessions))

  const dirty =
    quoted !== toStr(quotedValue) || approved !== toStr(approvedProjects) || sessions !== toStr(scheduledSessions)

  function save() {
    startTransition(async () => {
      const result = await updateMonthlyGoals({
        monthly_goal_quoted_value: toNumOrNull(quoted),
        monthly_goal_approved_projects: toNumOrNull(approved),
        monthly_goal_scheduled_sessions: toNumOrNull(sessions),
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Metas actualizadas')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage
      title="Metas mensuales"
      description="Se muestran como barras de progreso en Estadísticas. Deja un campo vacío si no quieres definir esa meta — no se inventa ningún número."
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estas metas se repiten cada mes (no son específicas de julio ni de ningún mes en particular). Podrás
            cambiarlas cuando quieras.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meta-cotizado" className="block text-sm font-medium text-foreground">
            Meta de valor cotizado
          </label>
          <Input
            id="meta-cotizado"
            type="number"
            min={0}
            step={100000}
            inputMode="numeric"
            placeholder="Ej. 12000000"
            value={quoted}
            onChange={(e) => setQuoted(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Cuánto quieres cotizar en total cada mes.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meta-aprobados" className="block text-sm font-medium text-foreground">
            Meta de proyectos aprobados
          </label>
          <Input
            id="meta-aprobados"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="Ej. 15"
            value={approved}
            onChange={(e) => setApproved(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Cuántos proyectos quieres que aprueben tus clientes cada mes.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="meta-sesiones" className="block text-sm font-medium text-foreground">
            Meta de sesiones agendadas
          </label>
          <Input
            id="meta-sesiones"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="Ej. 10"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Cuántas sesiones quieres tener agendadas cada mes.</p>
        </div>

        <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
      </div>
    </SettingsSubpage>
  )
}
