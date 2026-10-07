'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, BellRing } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/actions/notifications'
import type { NotificationItem } from '@/queries/notifications'
import { subscribeToPush } from '@/lib/push/client'
import { cn } from '@/lib/utils'

/** Formatea "hace X" en español, simple (sin librerías). */
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

/** Campana de notificaciones — es la ÚNICA en Inicio (antes había un botón
 * aparte para activar push; se fusionó acá para no ocupar dos íconos en el
 * encabezado). Avisa de cotizaciones nuevas del bot (in-app, tabla
 * `notifications`) y, si el navegador soporta push y este dispositivo aún
 * no está suscrito, el menú suma un primer ítem "Activar notificaciones
 * push" — desaparece apenas se concede el permiso. */
export function NotificationBell() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [pushAvailable, setPushAvailable] = useState(false)

  useEffect(() => {
    getNotificationsAction().then((res) => {
      if (res.success) {
        setItems(res.data.items)
        setUnread(res.data.unread)
      }
    })
  }, [])

  // Una sola campana hace las dos cosas: si el navegador soporta push y
  // este dispositivo todavía no está suscrito, el menú suma un primer
  // ítem "Activar notificaciones push" (antes era un botón aparte).
  useEffect(() => {
    let cancelled = false
    async function check() {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        typeof Notification === 'undefined' ||
        Notification.permission === 'denied'
      ) {
        return
      }
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (!cancelled) setPushAvailable(!sub)
      } catch {
        // Sin service worker listo todavía: no se ofrece — no es crítico.
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  async function activatePush() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      await subscribeToPush(reg)
      setPushAvailable(false)
    } catch (e) {
      console.error('[push] no se pudo activar', e)
      toast.error(e instanceof Error ? e.message : 'No se pudo activar el push')
    }
  }

  async function openItem(n: NotificationItem) {
    if (!n.read) {
      await markNotificationReadAction(n.id)
      setUnread((u) => Math.max(0, u - 1))
      setItems((its) => its.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  async function markAll() {
    await markAllNotificationsReadAction()
    setUnread(0)
    setItems((its) => its.map((i) => ({ ...i, read: true })))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'}
        className="relative grid size-11 place-items-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
      >
        <Bell className="size-5" strokeWidth={1.8} />
        {(unread > 0 || pushAvailable) && (
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {pushAvailable && (
          <DropdownMenuItem onClick={activatePush} className="gap-2 py-2.5 text-primary">
            <BellRing className="size-4 shrink-0" strokeWidth={1.9} />
            Activar notificaciones push
          </DropdownMenuItem>
        )}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-xs text-primary focus-visible:outline-none"
            >
              Marcar todo leído
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Sin notificaciones todavía.
          </p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => openItem(n)}
              className={cn('flex flex-col items-start gap-0.5 py-2.5', !n.read && 'bg-primary/5')}
            >
              <span className="flex w-full items-center gap-1.5">
                {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                <span className="truncate text-sm font-medium">{n.title}</span>
              </span>
              {n.body && (
                <span className="line-clamp-2 pl-3 text-xs text-muted-foreground">{n.body}</span>
              )}
              <span className="pl-3 text-[11px] text-muted-foreground/70">
                {timeAgo(n.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
