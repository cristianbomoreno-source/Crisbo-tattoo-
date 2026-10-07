import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { PerfilForm } from '@/components/settings/perfil-form'
import type { UpdateStudioProfileInput } from '@/lib/validations/studio'
import { STUDIO_TYPE_VALUES, ARTIST_COUNT_VALUES } from '@/lib/validations/onboarding'

export default async function PerfilSettingsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  // Estrecha los strings libres de la BD a los enums del form (o undefined si
  // el valor guardado ya no calza — no rompe, solo deja el select en placeholder).
  const studioType = STUDIO_TYPE_VALUES.find((v) => v === studio.studioType)
  const artistCount = ARTIST_COUNT_VALUES.find((v) => v === studio.artistCount)

  const defaults: UpdateStudioProfileInput = {
    name: studio.name,
    city: studio.city ?? '',
    address: studio.address ?? '',
    mapsUrl: studio.mapsUrl ?? '',
    studioType,
    artistCount,
    instagram: studio.instagram ?? '',
    tiktok: studio.tiktok ?? '',
    facebook: studio.facebook ?? '',
    website: studio.website ?? '',
  }

  return <PerfilForm logoUrl={studio.logoUrl} coverPhotoUrl={studio.coverPhotoUrl} defaults={defaults} />
}
