'use client'

import * as React from 'react'
import { Camera, Plus, PenLine, Feather, Info } from 'lucide-react'
import { toast } from 'sonner'
import { WaGlyph } from '@/components/shared/wa-glyph'
import { LOGO_MAX_BYTES } from '@/lib/validations/studio'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Solo JPG/PNG en el onboarding (spec §1) — subconjunto de `LOGO_ALLOWED_TYPES`
 * (que también acepta WebP/SVG en Ajustes). El límite de tamaño SÍ es el mismo
 * que Ajustes (`LOGO_MAX_BYTES`, 2 MB) porque se sube con la MISMA action
 * (`uploadStudioLogo`, ver `saveStep('profile', …)` en onboarding-wizard.tsx) —
 * validar client-side contra un límite distinto solo produciría un error de
 * servidor confuso tras "elegir" un archivo que la UI dijo que sí cabía. */
const LOGO_ACCEPT = 'image/jpeg,image/png'
const ONBOARDING_LOGO_TYPES = new Set(['image/jpeg', 'image/png'])

const inputClass =
  'w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function FieldLabel({
  icon,
  htmlFor,
  children,
}: {
  icon: React.ReactNode
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wide text-foreground"
    >
      {icon}
      {children}
    </label>
  )
}

/**
 * Paso 1 — Perfil (OBLIGATORIO, spec §1). Logo circular del estudio (preview
 * local; el `File` real vive en `draft.logoFile` y se sube reusando la MISMA
 * action de Ajustes, `uploadStudioLogo`, dentro de `saveStep('profile', …)`
 * en onboarding-wizard.tsx — DESPUÉS de que `completeProfileStep` cree/actualice
 * el estudio, porque `uploadStudioLogo` exige que el estudio ya exista) +
 * 4 campos (nombre, nombre artístico, ciudad, WhatsApp). `name`/`whatsapp`
 * llegan prellenados de `user_metadata` (spec decisión 4).
 */
export function StepProfile({ draft, patch }: OnboardingStepProps) {
  const fileRef = React.useRef<HTMLInputElement>(null)

  // Mismo patrón que `intake/visual-inputs.tsx`: la URL se DERIVA vía useMemo
  // (nunca setState dentro de un effect — el React Compiler lo marca error,
  // "cascading renders"); el useEffect solo se usa para el efecto secundario
  // real (revocar el object URL anterior al cambiar/desmontar).
  const previewUrl = React.useMemo(
    () => (draft.logoFile ? URL.createObjectURL(draft.logoFile) : null),
    [draft.logoFile]
  )
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ONBOARDING_LOGO_TYPES.has(file.type)) {
      toast.error('Formato no permitido (solo JPG o PNG)')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('El logo supera 2 MB')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    patch({ logoFile: file })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Logo del estudio */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileRef}
          id="profile-logo"
          type="file"
          accept={LOGO_ACCEPT}
          onChange={onPickLogo}
          className="hidden"
        />
        <label
          htmlFor="profile-logo"
          className="relative flex size-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40 bg-card/40 transition-colors hover:border-primary/50"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Vista previa del logo" className="size-full object-cover" />
          ) : (
            <>
              <Camera className="size-9 text-primary" strokeWidth={1.6} aria-hidden="true" />
              <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" />
              </span>
            </>
          )}
        </label>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="font-display text-sm italic text-foreground">Agrega tu foto</span>
          <span className="text-xs text-muted-foreground">JPG, PNG. Máx. 2 MB.</span>
        </div>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel
            icon={<PenLine className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />}
            htmlFor="profile-name"
          >
            ¿Cómo te llamas?
          </FieldLabel>
          <input
            id="profile-name"
            type="text"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Tu nombre"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Ej: Sofía Ramírez</p>
        </div>

        <div>
          <FieldLabel
            icon={<Feather className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />}
            htmlFor="profile-artistic-name"
          >
            Nombre artístico o nombre de tu estudio
          </FieldLabel>
          <input
            id="profile-artistic-name"
            type="text"
            value={draft.artisticName}
            onChange={(e) => patch({ artisticName: e.target.value })}
            placeholder="(opcional)"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Ej: Crisbo Tattoo</p>
        </div>

        <div>
          <FieldLabel
            icon={<WaGlyph className="size-3.5 text-primary" />}
            htmlFor="profile-whatsapp"
          >
            Número de WhatsApp
          </FieldLabel>
          <input
            id="profile-whatsapp"
            type="tel"
            value={draft.whatsapp}
            onChange={(e) => patch({ whatsapp: e.target.value })}
            placeholder="+57 300 000 0000"
            className={inputClass}
          />
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            Este será tu contacto principal para clientes.
          </p>
        </div>
      </div>
    </div>
  )
}
