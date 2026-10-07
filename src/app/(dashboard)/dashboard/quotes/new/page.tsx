import { getClients } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { QuoteWizard } from '@/components/quote-wizard/quote-wizard'

/**
 * Wizard de cotización a PANTALLA COMPLETA: en esta ruta el shell oculta la
 * topbar de marca y la tab bar (evita salidas accidentales del flujo), así
 * que el wrapper niega TODO el padding del layout (arriba y abajo) para que
 * el wizard ocupe el viewport entero. Sin `PageHeader`: el wizard trae su
 * propio header con la X y el progreso.
 */
export default async function NewQuotePage() {
  const [clientsResult, studio] = await Promise.all([getClients(), getCurrentStudio()])
  const clients = clientsResult.success ? clientsResult.data : []
  const studioDeposit = studio
    ? { mode: studio.depositMode, value: studio.depositValue }
    : null

  return (
    <div className="-mx-4 -mt-[4.5rem] -mb-[calc(5.5rem+env(safe-area-inset-bottom))] min-h-dvh sm:-mx-6 lg:mx-0 lg:mt-0 lg:mb-0">
      <QuoteWizard
        clients={clients}
        quoteMessageTemplate={studio?.quoteMessageTemplate}
        studioDeposit={studioDeposit}
      />
    </div>
  )
}
