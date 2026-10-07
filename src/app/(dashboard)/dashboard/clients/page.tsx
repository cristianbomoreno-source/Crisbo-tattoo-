import { getClients } from '@/queries/clients'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { PhoneContactsImport } from '@/components/clients/phone-contacts-import'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function ClientsPage() {
  const result = await getClients()
  const clients = result.success ? result.data : []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="Base de datos de tus clientes"
        action={
          <div className="hidden lg:block">
            <CreateClientDialog />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <PhoneContactsImport />
        <div className="lg:hidden">
          <CreateClientDialog />
        </div>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title="No tienes clientes aún"
          description="Agrega tu primer cliente para empezar a gestionar proyectos."
        />
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[client.phone, client.email, client.instagram].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
