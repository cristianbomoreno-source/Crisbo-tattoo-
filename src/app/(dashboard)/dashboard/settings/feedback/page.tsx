import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { getMyFeedback } from '@/actions/feedback'
import { FeatureRatingCard } from '@/components/feedback/feature-rating-card'
import { FEEDBACK_SECTIONS, TOTAL_FEATURES } from '@/lib/feedback/features'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getMyFeedback()
  const myFeedback = result.success ? result.data : {}
  const rated = Object.keys(myFeedback).length

  return (
    <div>
      <PageHeader
        kicker="Mensaje de OFINK"
        title="Califica cada función"
        description={`Ya calificaste ${rated} de ${TOTAL_FEATURES}. Cada estrella se guarda sola, no hay que enviar nada al final.`}
      />

      <div className="mx-auto max-w-2xl space-y-8">
        <p className="rounded-2xl bg-card p-4 text-xs text-muted-foreground">
          Varias tarjetas ya muestran capturas reales de la app; las que todavía no tienen una
          capturada usan una ilustración simple mientras tanto — de cualquier forma, escribe lo
          que quieras: cada pregunta tiene su propio espacio para tu retroalimentación.
        </p>

        {FEEDBACK_SECTIONS.map((section) => (
          <section key={section.key} className="space-y-3">
            <h2 className="font-title text-lg uppercase leading-none">{section.title}</h2>
            <div className="space-y-3">
              {section.features.map((feature) => (
                <FeatureRatingCard
                  key={feature.key}
                  feature={feature}
                  initial={myFeedback[feature.key]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
