'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Icon3D } from '@/components/ui/icon-3d'
import { cn } from '@/lib/utils'
import { LINK_TYPES, buildLinkUrl, linkFieldValue, linkType, type LinkTypeKey } from '@/lib/link-page/types'

export type LinkDraft = { label: string; subtitle: string | null; url: string; icon: string }

const FIELD_COPY = {
  whatsapp: { label: 'Número de WhatsApp', placeholder: '320 210 7769', mode: 'tel' as const },
  phone: { label: 'Número de teléfono', placeholder: '320 210 7769', mode: 'tel' as const },
  location: { label: 'Dirección', placeholder: 'Calle 1 # 2-3, Bogotá', mode: 'text' as const },
  url: { label: 'Enlace', placeholder: 'instagram.com/tu-usuario', mode: 'url' as const },
}

/**
 * Hoja para crear o editar un botón de la página de links: primero el tipo
 * (con su ícono 3D, que define el color en la página), luego nombre,
 * subtítulo y el dato según el tipo — un número para WhatsApp (arma el
 * wa.me con mensaje opcional), una dirección para Ubicación (abre Maps) o
 * un enlace. Guarda al tocar Guardar, no en cada letra.
 */
export function LinkEditSheet({
  open,
  initial,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean
  /** null = botón nuevo. */
  initial: LinkDraft | null
  onOpenChange: (open: boolean) => void
  onSave: (draft: LinkDraft) => Promise<boolean>
  onDelete?: () => void
}) {
  const startType = linkType(initial?.icon ?? 'whatsapp')
  const startField = initial ? linkFieldValue(startType.field, initial.url) : { value: '', message: '' }
  const [type, setType] = useState<LinkTypeKey>(startType.key)
  const [label, setLabel] = useState(initial?.label ?? startType.label)
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '')
  const [value, setValue] = useState(startField.value)
  const [message, setMessage] = useState(startField.message)
  const [saving, setSaving] = useState(false)

  const t = linkType(type)
  const copy = FIELD_COPY[t.field]
  const valid = label.trim().length > 0 && value.trim().length > 0

  function pickType(key: LinkTypeKey) {
    const next = linkType(key)
    // Al cambiar de tipo, el nombre por defecto sigue al tipo si no se escribió otro.
    if (!label.trim() || LINK_TYPES.some((x) => x.label === label.trim())) setLabel(next.label)
    if (next.field !== t.field) {
      setValue('')
      setMessage('')
    }
    setType(key)
  }

  async function save() {
    if (!valid) return
    setSaving(true)
    const ok = await onSave({
      label: label.trim(),
      subtitle: subtitle.trim() || null,
      url: buildLinkUrl(t.field, value, message),
      icon: type,
    })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar botón' : 'Nuevo botón'}</DialogTitle>
          <DialogDescription>El tipo define el ícono y el color en tu página.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {LINK_TYPES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => pickType(opt.key)}
              aria-pressed={type === opt.key}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl p-2 transition-[background-color,transform] duration-150 ease-out active:scale-95',
                type === opt.key ? cn(opt.tone, 'text-white') : 'bg-foreground/[0.06]',
              )}
            >
              <Icon3D name={opt.icon} className="size-9 drop-shadow-none" />
              <span className="w-full truncate text-center text-[12px] font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-label">Nombre del botón</Label>
            <Input id="link-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Agenda tu cita" maxLength={40} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-sub">Texto pequeño (opcional)</Label>
            <Input id="link-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Respondo en minutos" maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-value">{copy.label}</Label>
            <Input
              id="link-value"
              inputMode={copy.mode}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={copy.placeholder}
            />
          </div>
          {t.field === 'whatsapp' && (
            <div className="space-y-1.5">
              <Label htmlFor="link-msg">Mensaje que se escribe solo (opcional)</Label>
              <Input id="link-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola, quiero cotizar un tatuaje" />
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <Button type="button" className="h-12 w-full text-[1.0625rem]" disabled={!valid || saving} onClick={save}>
            {saving ? 'Guardando…' : initial ? 'Guardar' : 'Agregar botón'}
          </Button>
          {onDelete && (
            <Button type="button" variant="destructive" className="h-12 w-full text-[1.0625rem]" onClick={onDelete}>
              Eliminar botón
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
