'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Boxes,
  Tag,
  Layers,
  AlertTriangle,
  Minus,
  Plus,
  PackageCheck,
  Save,
  Sparkles,
  Trash2,
  Pencil,
  X,
  Check,
} from 'lucide-react'

import {
  createInventoryItemAction,
  updateInventoryQuantityAction,
  updateInventoryDefaultsAction,
  deleteInventoryItemAction,
  createInventoryCategoryAction,
} from '@/actions/inventory'
import type { InventoryItem, InventoryCategory } from '@/queries/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const UNITS = ['Unidades', 'Botellas', 'Cajas', 'Pares', 'Cartuchos', 'Frascos', 'Mililitros', 'Gramos', 'Otros']

/** Sugerencias de categoría — un tap crea (o reutiliza si ya existe) la
 * categoría con este ícono/color por defecto; el tatuador puede editarlo
 * después. "Crear" abre el picker de ícono+color libre. */
const CATEGORY_PRESETS = [
  { name: 'Tintas', icon: '🖋️', color: '#B8F400' },
  { name: 'Agujas', icon: '🪡', color: '#8B5CF6' },
  { name: 'Cartuchos', icon: '📦', color: '#3B82F6' },
  { name: 'Aftercare', icon: '🧴', color: '#F97316' },
  { name: 'Guantes', icon: '🧤', color: '#EC4899' },
  { name: 'Higiene', icon: '🧼', color: '#06B6D4' },
  { name: 'Máquinas', icon: '⚡', color: '#EAB308' },
  { name: 'Baterías', icon: '🔋', color: '#22C55E' },
  { name: 'Desechables', icon: '🧻', color: '#94A3B8' },
  { name: 'Papelería', icon: '📋', color: '#F43F5E' },
]
const COLOR_SWATCHES = ['#B8F400', '#3B82F6', '#8B5CF6', '#F97316', '#EC4899', '#06B6D4', '#EAB308', '#EF4444']

function statusOf(item: InventoryItem): { label: string; dot: string; text: string } {
  if (item.quantity <= 0) return { label: 'Agotado', dot: 'bg-red-500', text: 'text-red-400' }
  if (item.min_stock != null && item.quantity <= item.min_stock)
    return { label: 'Stock bajo', dot: 'bg-orange-400', text: 'text-orange-300' }
  return { label: 'Disponible', dot: 'bg-primary', text: 'text-primary' }
}

/**
 * Ajustes → Inventario, rediseño completo (v1.0.2) sobre el mockup del
 * tatuador — cero cambios de lógica: mismas acciones/consultas de siempre
 * (`createInventoryItemAction`, `updateInventoryQuantityAction`,
 * `updateInventoryDefaultsAction`, `deleteInventoryItemAction`,
 * `createInventoryCategoryAction`), mismas tablas (`inventory_items`,
 * `inventory_categories`), solo cambia la interfaz.
 */
export function InventarioPanel({
  items,
  categories,
}: {
  items: InventoryItem[]
  categories: InventoryCategory[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [categoryName, setCategoryName] = useState<string>('')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('✨')
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_SWATCHES[0])
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('Unidades')
  const [minStock, setMinStock] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [defaultQty, setDefaultQty] = useState('')
  const [unitCost, setUnitCost] = useState('')

  const categoryMeta = (catName: string | null) => categories.find((c) => c.name === catName) ?? null
  const selectedCategoryMeta = categoryMeta(categoryName)

  function resetForm() {
    setName('')
    setCategoryName('')
    setQuantity(1)
    setUnit('Unidades')
    setMinStock('')
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Escribe el nombre del insumo')
      return
    }
    startTransition(async () => {
      const result = await createInventoryItemAction({
        name: name.trim(),
        category: categoryName || undefined,
        quantity,
        unit,
        min_stock: minStock === '' ? undefined : Number(minStock),
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Insumo guardado')
      resetForm()
      router.refresh()
    })
  }

  function handlePickCategory(preset: { name: string; icon: string; color: string }) {
    setCategoryName(preset.name)
    setCategoryPickerOpen(false)
    if (!categoryMeta(preset.name)) {
      startTransition(async () => {
        await createInventoryCategoryAction(preset)
        router.refresh()
      })
    }
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Ponle un nombre a la categoría')
      return
    }
    startTransition(async () => {
      const result = await createInventoryCategoryAction({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setCategoryName(result.data.name)
      setNewCategoryOpen(false)
      setCategoryPickerOpen(false)
      setNewCategoryName('')
      router.refresh()
    })
  }

  function adjust(item: InventoryItem, delta: number) {
    startTransition(async () => {
      const result = await updateInventoryQuantityAction(item.id, {
        quantity: Math.max(0, item.quantity + delta),
      })
      if (!result.success) toast.error(result.error.message)
      else router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteInventoryItemAction(id)
      if (!result.success) toast.error(result.error.message)
      else {
        toast.success('Insumo eliminado')
        router.refresh()
      }
    })
  }

  function openDefaults(item: InventoryItem) {
    if (expandedId === item.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(item.id)
    setDefaultQty(String(item.default_qty_per_session ?? 0))
    setUnitCost(item.unit_cost != null ? String(item.unit_cost) : '')
  }

  function saveDefaults(id: string) {
    startTransition(async () => {
      const result = await updateInventoryDefaultsAction(id, {
        default_qty_per_session: defaultQty === '' ? 0 : Number(defaultQty),
        unit_cost: unitCost === '' ? null : Number(unitCost),
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Guardado')
      setExpandedId(null)
      router.refresh()
    })
  }

  return (
    <div className="pb-10">
      <div className="relative overflow-hidden rounded-b-[2rem] px-5 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(80% 60% at 88% 15%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%), linear-gradient(180deg, #0a0a0a 0%, #000 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-0 size-56 rounded-full opacity-40 blur-3xl sm:size-72"
          style={{ background: 'color-mix(in srgb, var(--primary) 35%, transparent)' }}
        />

        <Link
          href="/dashboard/settings"
          aria-label="Volver"
          className="relative grid size-10 place-items-center rounded-full bg-card/80 text-white/80 backdrop-blur transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>

        <div className="relative mt-5 max-w-[80%] sm:max-w-[70%]">
          <p className="font-heading text-xs font-semibold uppercase tracking-widest text-primary">Nuevo insumo</p>
          <h1 className="mt-1 font-title text-[2.75rem] leading-[0.95] text-white sm:text-6xl">INVENTARIO</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Organiza tus insumos y mantén tu estudio{' '}
            <span className="text-primary">siempre listo</span>.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl space-y-5 px-5 sm:px-8">
        <div className="-mt-4 space-y-5 rounded-[1.75rem] border border-white/8 bg-card p-5 shadow-[0_0_40px_-15px_rgba(184,244,0,0.15)] sm:p-6">
          <FieldShell icon={Boxes} label="Nombre del insumo">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Tinta negra, Agujas RL 1203…"
              className="w-full bg-transparent text-[15px] text-white placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </FieldShell>

          <div className="relative">
            <FieldShell
              icon={Tag}
              label="Categoría (opcional)"
              onClick={() => setCategoryPickerOpen((v) => !v)}
              trailing={
                selectedCategoryMeta ? (
                  <span className="text-lg leading-none">{selectedCategoryMeta.icon}</span>
                ) : undefined
              }
            >
              <button type="button" onClick={() => setCategoryPickerOpen((v) => !v)} className="w-full text-left">
                <span className={categoryName ? 'text-[15px] text-white' : 'text-[15px] text-muted-foreground/50'}>
                  {categoryName || 'Ej. Tintas, Agujas, Cartuchos, Otros…'}
                </span>
              </button>
            </FieldShell>

            {categoryPickerOpen && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-white/10 bg-background p-3 shadow-2xl">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    ...categories.map((c) => ({ name: c.name, icon: c.icon, color: c.color })),
                    ...CATEGORY_PRESETS.filter((p) => !categories.some((c) => c.name === p.name)),
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePickCategory(preset)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-colors',
                        categoryName === preset.name ? 'border-primary bg-primary/10' : 'border-white/8 hover:border-white/20'
                      )}
                    >
                      <span className="text-lg leading-none" style={{ filter: `drop-shadow(0 0 6px ${preset.color}55)` }}>
                        {preset.icon}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewCategoryOpen(true)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-white/15 px-2 py-2.5 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    <Plus className="size-4" aria-hidden />
                    <span className="text-[10px]">Crear</span>
                  </button>
                </div>

                {newCategoryOpen && (
                  <div className="mt-3 space-y-2.5 border-t border-white/8 pt-3">
                    <div className="flex gap-2">
                      <input
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        maxLength={4}
                        className="w-12 shrink-0 rounded-lg border border-white/10 bg-card px-2 py-2 text-center text-lg"
                        aria-label="Emoji del ícono"
                      />
                      <input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCategoryColor(c)}
                          aria-label={`Color ${c}`}
                          className={cn(
                            'size-6 rounded-full transition-transform',
                            newCategoryColor === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setNewCategoryOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={handleCreateCategory} disabled={pending}>
                        Crear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldShell icon={Layers} label="Cantidad">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                  aria-label="Restar"
                  className="grid size-8 place-items-center rounded-full text-white/70 transition-all hover:bg-white/5 active:scale-90"
                >
                  <Minus className="size-4" />
                </button>
                <span key={quantity} className="animate-fade-in text-lg font-semibold tabular-nums text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Sumar"
                  className="grid size-8 place-items-center rounded-full text-white/70 transition-all hover:bg-white/5 active:scale-90"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </FieldShell>

            <FieldShell
              icon={() => (
                <span className="grid grid-cols-2 gap-0.5">
                  <span className="size-1.5 rounded-[2px] bg-current" />
                  <span className="size-1.5 rounded-[2px] bg-current" />
                  <span className="size-1.5 rounded-[2px] bg-current" />
                  <span className="size-1.5 rounded-[2px] bg-current" />
                </span>
              )}
              label="Unidades"
            >
              <Select value={unit} onValueChange={(v) => v !== null && setUnit(v)}>
                <SelectTrigger className="h-auto w-full border-0 bg-transparent p-0 text-[15px] text-white shadow-none focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          </div>

          <FieldShell icon={AlertTriangle} label="Alerta de stock bajo (opcional)">
            <input
              value={minStock}
              onChange={(e) => setMinStock(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="Ej. 5 unidades"
              className="w-full bg-transparent text-[15px] text-white placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </FieldShell>

          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-background/60 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Tip profesional</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                Define una alerta de stock para evitar quedarte sin insumos durante una sesión.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={resetForm} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1 gap-2" onClick={handleSave} disabled={pending}>
              <Save className="size-4" aria-hidden /> Guardar
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex items-center gap-2 opacity-30">
              <Boxes className="size-10" strokeWidth={1.2} />
              <PackageCheck className="size-10" strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Todavía no has agregado insumos.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Agrega tu primer material para empezar a controlar tu inventario.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const meta = categoryMeta(item.category)
              const status = statusOf(item)
              const pct = item.min_stock
                ? Math.min(100, Math.round((item.quantity / Math.max(item.min_stock * 3, 1)) * 100))
                : 100
              return (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-white/8 bg-card p-4 transition-shadow hover:shadow-[0_0_30px_-12px_rgba(184,244,0,0.2)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl"
                      style={{ backgroundColor: `${meta?.color ?? '#B8F400'}22` }}
                    >
                      {meta?.icon ?? '📦'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.category ?? 'Sin categoría'} · {item.quantity} {item.unit}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium',
                        status.text
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className={cn('h-full rounded-full transition-all', status.dot)} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjust(item, -1)}
                        disabled={pending}
                        aria-label="Restar"
                        className="grid size-7 place-items-center rounded-full border border-white/10 text-muted-foreground transition-all hover:bg-white/5 active:scale-90"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjust(item, 1)}
                        disabled={pending}
                        aria-label="Sumar"
                        className="grid size-7 place-items-center rounded-full border border-white/10 text-muted-foreground transition-all hover:bg-white/5 active:scale-90"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openDefaults(item)}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5',
                          expandedId === item.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <Pencil className="size-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        disabled={pending}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <div className="mt-3 space-y-2.5 border-t border-white/8 pt-3">
                      <p className="text-xs text-muted-foreground">
                        Mínimo que gastas por sesión — precarga el popup de materiales al iniciar una cita.
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          placeholder={`Mínimo por sesión (${item.unit})`}
                          value={defaultQty}
                          onChange={(e) => setDefaultQty(e.target.value)}
                        />
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          placeholder="Costo por unidad (opcional)"
                          value={unitCost}
                          onChange={(e) => setUnitCost(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setExpandedId(null)}>
                          <X className="size-3.5" />
                        </Button>
                        <Button type="button" size="sm" onClick={() => saveDefaults(item.id)} disabled={pending} className="gap-1.5">
                          <Check className="size-3.5" /> Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/** Campo con ícono + label superior — mismo marco visual para todos los
 * campos del formulario, per mockup. */
function FieldShell({
  icon: Icon,
  label,
  children,
  trailing,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-white/8 bg-background/40 px-4 py-3 transition-colors',
        onClick && 'cursor-pointer hover:border-white/20'
      )}
      onClick={onClick}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
      {trailing}
    </div>
  )
}
