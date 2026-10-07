'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  createQuoteSchema,
  type CreateQuoteInput,
} from '@/lib/validations/quotes'
import { createQuoteAction, updateQuoteAction } from '@/actions/quotes'
import { updateClientAction } from '@/actions/clients'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_TEMPLATE } from '@/lib/quotes/message'
import { InlineCreateClient } from '@/components/clients/inline-create-client'
import { PhoneInput } from '@/components/shared/phone-input'
import { INTAKE_MAX_PHOTOS } from '@/lib/validations/intake'
import {
  MessageCircle, UserRound, PersonStanding, PenTool, FileText,
  CircleDollarSign, CalendarDays, Percent, MessageSquare, ChevronDown, Phone, X as XIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { DurationAccordion } from '@/components/quotes/duration-accordion'
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button'
import type { Client } from '@/queries/clients'
import type { QuoteWithClient } from '@/queries/quotes'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const DEPOSIT_PRESETS = ['20', '30', '50']

export function QuoteForm({
  clients,
  quoteMessageTemplate,
  quote,
  referencePhotos,
  onSuccess,
}: {
  clients: Client[]
  quoteMessageTemplate?: string
  /** Si viene, el formulario entra en modo edición sobre esta cotización. */
  quote?: QuoteWithClient
  /** URLs públicas ya resueltas de [reference_photo_path, ...extra_photo_paths],
   * mismo orden — para mostrarlas y poder quitarlas en modo edición. */
  referencePhotos?: string[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(quote)
  const [clientList, setClientList] = useState(clients)
  const form = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema) as Resolver<CreateQuoteInput>,
    defaultValues: quote
      ? {
          client_id: quote.client_id,
          body_zone: quote.body_zone ?? '',
          style: quote.style ?? '',
          description: quote.description ?? '',
          price: quote.price ?? undefined,
          is_courtesy: quote.is_courtesy,
          session_count: quote.session_count ?? undefined,
          avg_session_duration: quote.avg_session_duration ?? '',
          deposit_percentage: quote.deposit_percentage,
          notes: quote.notes ?? '',
        }
      : {
          client_id: '',
          body_zone: '',
          style: '',
          description: '',
          notes: '',
          is_courtesy: false,
          deposit_percentage: 20,
        },
  })
  const [created, setCreated] = useState<{ wa: string | null; quoteId: string } | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const initialClientPhone = quote?.clients?.phone ?? ''
  const [clientPhone, setClientPhone] = useState(initialClientPhone)
  const [existingPhotos, setExistingPhotos] = useState(() =>
    (referencePhotos ?? []).map((url, i) => ({
      path: [quote?.reference_photo_path, ...(quote?.extra_photo_paths ?? [])].filter(
        (p): p is string => Boolean(p)
      )[i],
      url,
    }))
  )
  const [removedPaths, setRemovedPaths] = useState<string[]>([])
  const totalPhotoCount = isEdit ? existingPhotos.length + photos.length : photos.length
  const [depositMode, setDepositMode] = useState<'preset' | 'otro'>(
    quote && !DEPOSIT_PRESETS.includes(String(quote.deposit_percentage)) ? 'otro' : 'preset'
  )

  function addPhotos(files: FileList | File[]) {
    const room = INTAKE_MAX_PHOTOS - totalPhotoCount
    if (room <= 0) return
    const next = Array.from(files).slice(0, room)
    setPhotos((prev) => [...prev, ...next])
    setPhotoPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))])
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addPhotos(e.target.files)
    e.target.value = ''
  }

  function removeNewPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function removeExistingPhoto(path: string | undefined) {
    if (!path) return
    setExistingPhotos((prev) => prev.filter((p) => p.path !== path))
    setRemovedPaths((prev) => [...prev, path])
  }

  async function onSubmit(values: CreateQuoteInput) {
    if (isEdit && clientPhone !== initialClientPhone) {
      const clientRes = await updateClientAction(quote!.client_id, { phone: clientPhone || undefined })
      if (!clientRes.success) {
        toast.error(clientRes.error.message)
        return
      }
    }

    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v))
    })
    if (!isEdit) {
      photos.forEach((f, i) => fd.append(i === 0 ? 'reference_photo' : 'extra_photos', f))
    } else {
      photos.forEach((f) => fd.append('new_photos', f))
      removedPaths.forEach((p) => fd.append('removed_photos', p))
    }

    const result = isEdit
      ? await updateQuoteAction(quote!.id, fd)
      : await createQuoteAction(fd)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }

    if (isEdit) {
      toast.success('Cambios guardados')
      router.refresh()
      onSuccess?.()
      return
    }

    toast.success('Cotización creada')
    router.refresh()
    const client = clientList.find((c) => c.id === values.client_id)
    const message = buildMessage(quoteMessageTemplate || DEFAULT_TEMPLATE, {
      nombre_cliente: client?.name ?? '',
      nombre_proyecto: [values.style, values.body_zone].filter(Boolean).join(' — ') || 'tu tatuaje',
      valor: values.is_courtesy
        ? 'Cortesía'
        : `$${Math.round(values.price ?? 0).toLocaleString('es-CO')}`,
      numero_sesiones: String(values.session_count ?? 1),
    })
    setCreated({ wa: waLink(client?.phone, message), quoteId: result.data.id })
  }

  const numberField = (name: 'price' | 'session_count', label: string, disabled?: boolean) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              disabled={disabled}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  if (created) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cotización creada. ¿Se la envías al cliente por WhatsApp?
        </p>
        <div className="flex flex-wrap gap-2">
          {created.wa ? (
            <a
              href={created.wa}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              <MessageCircle className="size-4" />
              Enviar por WhatsApp
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              Este cliente no tiene teléfono guardado.
            </p>
          )}
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => (onSuccess ? onSuccess() : router.push('/dashboard/quotes'))}
          >
            Listo
          </Button>
        </div>
      </div>
    )
  }

  const isCourtesy = form.watch('is_courtesy')
  const depositValue = String(form.watch('deposit_percentage') ?? 20)
  const showCustomDeposit = depositMode === 'otro' || !DEPOSIT_PRESETS.includes(depositValue)

  // Rediseño visual del modal "Editar cotización" (referencia de diseño) —
  // mismos campos, mismos nombres, mismo `onSubmit`/`form.control` de
  // siempre. El flujo de creación (más abajo) no se toca.
  if (isEdit) {
    const fieldCardClass = 'flex items-center gap-3 space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4 transition-colors duration-200'
    const iconWrapClass = 'grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'
    const fieldLabelClass = 'font-display text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'
    const bareInputClass = 'h-auto border-0 bg-transparent p-0 text-base font-medium text-white shadow-none outline-none focus-visible:ring-0'

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente */}
          <div className={fieldCardClass}>
            <span className={iconWrapClass}>
              <UserRound className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className={fieldLabelClass}>Cliente</p>
              <p className="truncate text-base font-medium text-white">{quote!.clients?.name ?? 'Cliente'}</p>
            </div>
          </div>

          {/* Teléfono del cliente */}
          <div className={fieldCardClass}>
            <span className={iconWrapClass}>
              <Phone className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className={fieldLabelClass}>WhatsApp / Teléfono</p>
              <div className="mt-1.5">
                <PhoneInput value={clientPhone} onChange={setClientPhone} />
              </div>
            </div>
          </div>

          {/* Zona corporal */}
          <FormField
            control={form.control}
            name="body_zone"
            render={({ field }) => (
              <FormItem className={fieldCardClass}>
                <span className={iconWrapClass}>
                  <PersonStanding className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <FormLabel className={fieldLabelClass}>Zona corporal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Brazo" {...field} value={field.value ?? ''} className={bareInputClass} />
                  </FormControl>
                  <FormMessage />
                </div>
                <ChevronDown className="size-4 shrink-0 text-primary/70" aria-hidden />
              </FormItem>
            )}
          />

          {/* Estilo */}
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem className={fieldCardClass}>
                <span className={iconWrapClass}>
                  <PenTool className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <FormLabel className={fieldLabelClass}>Estilo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Realismo, Tradicional…" {...field} value={field.value ?? ''} className={bareInputClass} />
                  </FormControl>
                  <FormMessage />
                </div>
                <ChevronDown className="size-4 shrink-0 text-primary/70" aria-hidden />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className={iconWrapClass}>
                    <FileText className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <FormLabel className={fieldLabelClass}>Descripción del proyecto</FormLabel>
                </div>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Qué quiere tatuarse el cliente…"
                    {...field}
                    value={field.value ?? ''}
                    className="border-0 bg-[#0D0D0D] p-3.5 text-sm text-white shadow-none outline-none focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Referencias */}
          <div className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={iconWrapClass}>
                  <ImageIcon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className={fieldLabelClass}>Referencias del cliente</p>
              </div>
              {totalPhotoCount < INTAKE_MAX_PHOTOS && (
                <Label
                  htmlFor="quote-photo-edit"
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                >
                  Agregar
                </Label>
              )}
            </div>
            <Input
              id="quote-photo-edit"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
            {existingPhotos.length === 0 && photoPreviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin fotos de referencia.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {existingPhotos.map((p) => (
                  <div key={p.url} className="group relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#2B2B2B]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="Referencia" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(p.path)}
                      aria-label="Quitar foto"
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
                    >
                      <XIcon className="size-3" strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
                {photoPreviews.map((src, i) => (
                  <div key={src} className="group relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#2B2B2B]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Referencia nueva" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      aria-label="Quitar foto"
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
                    >
                      <XIcon className="size-3" strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Es cortesía */}
          <FormField
            control={form.control}
            name="is_courtesy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2.5 space-y-0 px-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(Boolean(v))
                      if (v) form.setValue('price', 0)
                    }}
                    className="size-5 rounded-md border-[#2B2B2B] data-checked:border-primary data-checked:bg-primary"
                  />
                </FormControl>
                <FormLabel className="!mt-0 text-sm font-medium text-white">Es cortesía</FormLabel>
              </FormItem>
            )}
          />

          {/* Precio y sesiones */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
                  <FormLabel className={fieldLabelClass}>Precio (COP)</FormLabel>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CircleDollarSign className="size-4.5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        disabled={isCourtesy}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        className={bareInputClass}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="session_count"
              render={({ field }) => (
                <FormItem className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
                  <FormLabel className={fieldLabelClass}>Número de sesiones</FormLabel>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="size-4.5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        className={bareInputClass}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duración aproximada por sesión — acordeón + reloj circular */}
          <FormField
            control={form.control}
            name="avg_session_duration"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <DurationAccordion value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Abono requerido */}
          <FormField
            control={form.control}
            name="deposit_percentage"
            render={({ field }) => (
              <FormItem className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className={iconWrapClass}>
                    <Percent className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <FormLabel className={fieldLabelClass}>Abono requerido</FormLabel>
                </div>
                <Select
                  items={{ '20': '20%', '30': '30%', '50': '50%', otro: 'Otro %' }}
                  value={showCustomDeposit ? 'otro' : depositValue}
                  onValueChange={(v) => {
                    if (!v) return
                    if (v === 'otro') {
                      setDepositMode('otro')
                      field.onChange(undefined)
                    } else {
                      setDepositMode('preset')
                      field.onChange(Number(v))
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full border-[#2B2B2B] bg-[#0D0D0D]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="otro">Otro %</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomDeposit && (
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="mt-2.5 border-[#2B2B2B] bg-[#0D0D0D]"
                    placeholder="% personalizado"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notas */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-0 rounded-3xl border border-[#2B2B2B] bg-[#171717] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className={iconWrapClass}>
                    <MessageSquare className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <FormLabel className={fieldLabelClass}>Notas</FormLabel>
                </div>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Notas internas…"
                    {...field}
                    value={field.value ?? ''}
                    className="border-0 bg-[#0D0D0D] p-3.5 text-sm text-white shadow-none outline-none focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <DeleteQuoteButton
              quoteId={quote!.id}
              quoteLabel={quote!.clients?.name ?? 'Cliente'}
              label="Eliminar cotización"
              onDeleted={onSuccess}
              className="h-12 flex-1 rounded-[20px] border border-destructive/20 bg-destructive/10 text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/15"
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-12 flex-1 rounded-[20px] bg-primary text-sm font-semibold text-black transition-colors duration-200 hover:bg-primary/90"
            >
              {form.formState.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        {isEdit ? (
          <div className="space-y-2">
            <Label>Cliente</Label>
            <p className="text-sm">{quote!.clients?.name ?? 'Cliente'}</p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  items={Object.fromEntries(clientList.map((c) => [c.id, c.name]))}
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <InlineCreateClient
                    onCreated={(c) => {
                      setClientList((l) => [c, ...l])
                      field.onChange(c.id)
                    }}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="body_zone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona corporal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Brazo" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estilo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Realismo, Tradicional…" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Qué quiere tatuarse el cliente…" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="quote-photo">Fotos de referencia</Label>
            {photos.length < INTAKE_MAX_PHOTOS && (
              <Input id="quote-photo" type="file" accept="image/*" multiple onChange={handlePhotoChange} />
            )}
            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {photoPreviews.map((src, i) => (
                  <div key={src} className="group relative size-20 shrink-0 overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Vista previa" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      aria-label="Quitar foto"
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
                    >
                      <XIcon className="size-3" strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="is_courtesy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => {
                    field.onChange(Boolean(v))
                    if (v) form.setValue('price', 0)
                  }}
                />
              </FormControl>
              <FormLabel className="!mt-0">Es cortesía</FormLabel>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {numberField('price', 'Precio (COP)', isCourtesy)}
          {numberField('session_count', 'Número de sesiones')}
        </div>

        <FormField
          control={form.control}
          name="avg_session_duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración aproximada por sesión</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 2-3 horas" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deposit_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abono requerido</FormLabel>
              <Select
                items={{ '20': '20%', '30': '30%', '50': '50%', otro: 'Otro %' }}
                value={showCustomDeposit ? 'otro' : depositValue}
                onValueChange={(v) => {
                  if (!v) return
                  if (v === 'otro') {
                    setDepositMode('otro')
                    // Dejar el campo vacío para escribir el % desde cero
                    // (evita tener que borrar el 20 por defecto).
                    field.onChange(undefined)
                  } else {
                    setDepositMode('preset')
                    field.onChange(Number(v))
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="otro">Otro %</SelectItem>
                </SelectContent>
              </Select>
              {showCustomDeposit && (
                <Input
                  type="number"
                  inputMode="numeric"
                  className="mt-2"
                  placeholder="% personalizado"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Notas internas…" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? 'Guardando…'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear cotización'}
        </Button>
      </form>
    </Form>
  )
}
