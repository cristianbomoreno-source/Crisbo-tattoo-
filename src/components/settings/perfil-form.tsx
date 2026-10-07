'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, Trash2, ImageOff, MapPin } from 'lucide-react'

import { updateStudioProfileSchema, type UpdateStudioProfileInput } from '@/lib/validations/studio'
import { updateStudioProfile, uploadStudioLogo, removeStudioLogo, uploadStudioCover, removeStudioCover } from '@/actions/studio'
import { STUDIO_TYPES, ARTIST_COUNTS } from '@/components/onboarding/constants'
import { LogoCropDialog } from '@/components/settings/logo-crop-dialog'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  logoUrl: string | null
  coverPhotoUrl: string | null
  defaults: UpdateStudioProfileInput
}

export function PerfilForm({ logoUrl, coverPhotoUrl, defaults }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

  const form = useForm<UpdateStudioProfileInput>({
    resolver: zodResolver(updateStudioProfileSchema) as Resolver<UpdateStudioProfileInput>,
    defaultValues: defaults,
  })

  async function onSubmit(values: UpdateStudioProfileInput) {
    const result = await updateStudioProfile(values)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Perfil actualizado')
    form.reset(values)
    router.refresh()
  }

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // No sube directo: primero abre el encuadre circular (estilo
    // Instagram) para que la foto quede bien centrada dentro del círculo
    // antes de subirla.
    setPendingLogoFile(file)
  }

  async function onCropConfirm(cropped: File) {
    setPendingLogoFile(null)
    setBusy(true)
    const fd = new FormData()
    fd.append('file', cropped)
    const result = await uploadStudioLogo(fd)
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Logo actualizado')
    router.refresh()
  }

  function onCropCancel() {
    setPendingLogoFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onRemoveLogo() {
    setBusy(true)
    const result = await removeStudioLogo()
    setBusy(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Logo eliminado')
    router.refresh()
  }

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverBusy(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadStudioCover(fd)
    setCoverBusy(false)
    if (coverFileRef.current) coverFileRef.current.value = ''
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Foto de portada actualizada')
    router.refresh()
  }

  async function onRemoveCover() {
    setCoverBusy(true)
    const result = await removeStudioCover()
    setCoverBusy(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Foto de portada eliminada')
    router.refresh()
  }

  return (
    <SettingsSubpage title="Perfil del estudio" description="Logo, nombre, ciudad y redes de tu estudio.">
      {/* Logo circular (reusa uploadStudioLogo/removeStudioLogo) */}
      <section className="mb-8 flex items-center gap-4">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-card">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo del estudio" className="size-full object-cover" />
          ) : (
            <ImageOff className="size-7 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onPickLogo}
            className="hidden"
            aria-hidden="true"
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="h-10 gap-2">
            <Upload className="size-4" strokeWidth={1.8} aria-hidden="true" />
            {logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </Button>
          {logoUrl && (
            <Button type="button" variant="ghost" disabled={busy} onClick={onRemoveLogo} className="h-10 gap-2 text-muted-foreground">
              <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Quitar logo
            </Button>
          )}
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP o SVG · máx. 2 MB.</p>
        </div>
      </section>

      {/* Foto de portada — solo se usa en el Home de iPad/escritorio. */}
      <section className="mb-8">
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-foreground">
          Foto de portada
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Se usa como fondo del Home cuando entras desde iPad o computador. En el celular no se muestra.
        </p>
        <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card sm:h-40">
          {coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhotoUrl} alt="Foto de portada" className="size-full object-cover" />
          ) : (
            <ImageOff className="size-7 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={coverFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPickCover}
            className="hidden"
            aria-hidden="true"
          />
          <Button type="button" variant="outline" disabled={coverBusy} onClick={() => coverFileRef.current?.click()} className="h-10 gap-2">
            <Upload className="size-4" strokeWidth={1.8} aria-hidden="true" />
            {coverPhotoUrl ? 'Cambiar portada' : 'Subir portada'}
          </Button>
          {coverPhotoUrl && (
            <Button type="button" variant="ghost" disabled={coverBusy} onClick={onRemoveCover} className="h-10 gap-2 text-muted-foreground">
              <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Quitar portada
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">PNG, JPG o WebP · máx. 8 MB.</p>
      </section>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del estudio</FormLabel>
                <FormControl>
                  <Input placeholder="Crisbo Tattoo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Bogotá" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Calle 123 #45-67" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mapsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación en Google Maps</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Pega aquí el enlace de Maps" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 gap-1.5"
                    onClick={() => {
                      const query = [form.getValues('address'), form.getValues('city')]
                        .filter(Boolean)
                        .join(', ')
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'estudio de tatuajes')}`,
                        '_blank'
                      )
                    }}
                  >
                    <MapPin className="size-4" /> Buscar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toca &quot;Buscar&quot;, ubica tu estudio en Maps, copia el enlace (botón Compartir) y
                  pégalo aquí.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studioType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de estudio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STUDIO_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="artistCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Cuántos artistas trabajan?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ARTIST_COUNTS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Redes del estudio
            </legend>
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="@crisbo.tattoo" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tiktok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TikTok</FormLabel>
                  <FormControl>
                    <Input placeholder="@usuario" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="facebook.com/tuestudio" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Página web</FormLabel>
                  <FormControl>
                    <Input placeholder="www.tuestudio.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          <SettingsSaveBar dirty={form.formState.isDirty} saving={form.formState.isSubmitting} onSave={form.handleSubmit(onSubmit)} />
        </form>
      </Form>

      <LogoCropDialog file={pendingLogoFile} onCancel={onCropCancel} onConfirm={onCropConfirm} />
    </SettingsSubpage>
  )
}
