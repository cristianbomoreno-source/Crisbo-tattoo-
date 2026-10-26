import { StatsClientsCard } from 'crisbo-tattoo'

const c = (id: string, name: string) => ({ id, name }) as never

export const Octubre = () => (
  <div className="max-w-md">
    <StatsClientsCard
      newClients={[c('1', 'Juan David Lara'), c('2', 'Lukas Mora'), c('3', 'Ana Ruiz'), c('4', 'Pedro Gil')]}
      recurringClients={[c('5', 'Hellman Díaz'), c('6', 'Fernando Rey')]}
    />
  </div>
)
