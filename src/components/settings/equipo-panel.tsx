'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, RefreshCw, Check, X, ChevronDown, MessageCircle, Mail, UserPlus } from 'lucide-react'
import {
  approveJoinRequest,
  rejectJoinRequest,
  regenerateJoinCode,
  getArtistPermissions,
  updateArtistPermissions,
  setArtistStatus,
  type PendingJoinRequest,
  type TeamMember,
} from '@/actions/team'
import {
  inviteCollaboratorByEmail,
  cancelInvitation,
  type StudioInvitationRow,
} from '@/actions/collaborators'
import { PERMISSION_LABELS, type ArtistPermissions } from '@/lib/permissions/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EquipoPanel({
  joinCode: initialJoinCode,
  maxArtists,
  requests,
  team,
  invitations,
  autoFocusInvite,
}: {
  joinCode: string
  maxArtists: number
  requests: PendingJoinRequest[]
  team: TeamMember[]
  invitations: StudioInvitationRow[]
  autoFocusInvite?: boolean
}) {
  const [joinCode, setJoinCode] = useState(initialJoinCode)
  const [pending, setPending] = useState(requests)
  const [regenerating, startRegenerate] = useTransition()
  const [invitationList, setInvitationList] = useState(invitations)
  const [email, setEmail] = useState('')
  const [inviting, startInvite] = useTransition()
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocusInvite) emailInputRef.current?.focus()
  }, [autoFocusInvite])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    startInvite(async () => {
      const result = await inviteCollaboratorByEmail(email)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Invitación enviada')
      setEmail('')
      setInvitationList((prev) => [
        { id: crypto.randomUUID(), email: email.trim().toLowerCase(), status: 'pending', createdAt: new Date().toISOString(), hasAccount: false },
        ...prev,
      ])
    })
  }

  async function handleCancelInvitation(id: string) {
    const result = await cancelInvitation(id)
    if (!result.success) return toast.error(result.error.message)
    setInvitationList((prev) => prev.filter((i) => i.id !== id))
    toast.success('Invitación cancelada')
  }

  function handleCopy() {
    navigator.clipboard.writeText(joinCode)
    toast.success('Código copiado')
  }

  function handleRegenerate() {
    startRegenerate(async () => {
      const result = await regenerateJoinCode()
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setJoinCode(result.data)
      toast.success('Nuevo código generado')
    })
  }

  async function handleApprove(id: string) {
    const result = await approveJoinRequest(id)
    if (!result.success) return toast.error(result.error.message)
    setPending((prev) => prev.filter((r) => r.id !== id))
    toast.success('Tatuador aprobado')
  }

  async function handleReject(id: string) {
    const result = await rejectJoinRequest(id)
    if (!result.success) return toast.error(result.error.message)
    setPending((prev) => prev.filter((r) => r.id !== id))
    toast.success('Solicitud rechazada')
  }

  const activeCount = team.filter((m) => m.status === 'active').length
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ofink.app'
  const inviteText = `Únete a nuestro estudio en OFINK con el código ${joinCode} — regístrate en ${appUrl} y elige "Trabajo en un estudio".`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl bg-card p-5" data-tour="team-invite-section">
        <h2 className="font-title text-lg uppercase">Invitar colaborador</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Si esa persona ya tiene cuenta de OFINK, verá la invitación apenas entre y se une con
          un toque — automático, sin código.
        </p>
        <form onSubmit={handleInvite} className="mt-3 flex gap-2">
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@tatuador.com"
            required
            className="min-w-0 flex-1 rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" disabled={inviting} className="shrink-0 gap-1.5">
            <UserPlus className="size-4" />
            {inviting ? 'Enviando…' : 'Invitar'}
          </Button>
        </form>

        {invitationList.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {invitationList.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl bg-background px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.status === 'pending' && (inv.hasAccount ? 'Esperando que acepte' : 'Esperando que se registre')}
                    {inv.status === 'accepted' && 'Aceptada'}
                    {inv.status === 'declined' && 'Rechazada'}
                    {inv.status === 'cancelled' && 'Cancelada'}
                  </p>
                </div>
                {inv.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleCancelInvitation(inv.id)}
                    aria-label="Cancelar invitación"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-card p-5">
        <h2 className="font-title text-lg uppercase">Código de acceso</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Compártelo con los tatuadores que quieras invitar a tu estudio.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex-1 rounded-xl bg-background px-4 py-3 text-center font-mono text-lg font-semibold tracking-widest">
            {joinCode}
          </span>
          <Button type="button" size="icon" variant="secondary" onClick={handleCopy}>
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={cn('size-4', regenerating && 'animate-spin')} />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {activeCount} / {maxArtists} tatuadores activos
        </p>
        <div className="mt-3 flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent('Invitación a nuestro estudio en OFINK')}&body=${encodeURIComponent(inviteText)}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-background py-2.5 text-xs font-semibold"
          >
            <Mail className="size-3.5" /> Correo
          </a>
        </div>
      </section>

      {pending.length > 0 && (
        <section className="rounded-2xl bg-card p-5">
          <h2 className="font-title text-lg uppercase">Solicitudes pendientes</h2>
          <div className="mt-3 space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.specialty || r.email || 'Sin datos adicionales'}
                  </p>
                </div>
                <Button type="button" size="icon" variant="secondary" onClick={() => handleApprove(r.id)}>
                  <Check className="size-4 text-primary" />
                </Button>
                <Button type="button" size="icon" variant="secondary" onClick={() => handleReject(r.id)}>
                  <X className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-card p-5" data-tour="team-list">
        <h2 className="font-title text-lg uppercase">Tatuadores</h2>
        <div className="mt-3 space-y-2">
          {team.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </section>
    </div>
  )
}

function MemberRow({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<ArtistPermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(member.status)

  async function handleToggleOpen() {
    if (!open && !permissions && member.role !== 'owner') {
      setLoading(true)
      const result = await getArtistPermissions(member.id)
      setLoading(false)
      if (result.success) setPermissions(result.data)
      else toast.error(result.error.message)
    }
    setOpen((v) => !v)
  }

  async function handleTogglePermission(key: keyof ArtistPermissions) {
    if (!permissions) return
    const next = { ...permissions, [key]: !permissions[key] }
    setPermissions(next)
    const result = await updateArtistPermissions(member.id, { [key]: next[key] })
    if (!result.success) {
      toast.error(result.error.message)
      setPermissions(permissions)
    }
  }

  async function handleToggleStatus() {
    const nextStatus = status === 'active' ? 'rejected' : 'active'
    const result = await setArtistStatus(member.id, nextStatus)
    if (!result.success) return toast.error(result.error.message)
    setStatus(nextStatus)
    toast.success(nextStatus === 'active' ? 'Tatuador activado' : 'Tatuador desactivado')
  }

  return (
    <div className="rounded-xl bg-background">
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={loading}
        data-tour={member.role !== 'owner' ? 'team-permissions' : undefined}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{member.name}</p>
          <p className="text-xs text-muted-foreground">
            {member.role === 'owner' ? 'Dueño del estudio' : status === 'active' ? 'Activo' : 'Desactivado'}
          </p>
        </div>
        {member.role !== 'owner' && (
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && member.role !== 'owner' && (
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          {permissions &&
            (Object.keys(PERMISSION_LABELS) as (keyof ArtistPermissions)[]).map((key) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground/90">{PERMISSION_LABELS[key]}</span>
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={() => handleTogglePermission(key)}
                  className="size-4 accent-primary"
                />
              </label>
            ))}
          <Button
            type="button"
            variant={status === 'active' ? 'destructive' : 'secondary'}
            size="sm"
            className="w-full"
            onClick={handleToggleStatus}
          >
            {status === 'active' ? 'Desactivar tatuador' : 'Reactivar tatuador'}
          </Button>
        </div>
      )}
    </div>
  )
}
