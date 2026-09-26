const SUPABASE_URL = 'https://zzmtnjlfrlqmouijfste.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bXRuamxmcmxxbW91aWpmc3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTIyNzcsImV4cCI6MjEwNTU4ODI3N30.CEXPeB-_MlyLvtIRnV6f6Q1nqYIdtNWughlUv74yyUk';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

async function resetData() {
  console.log('Obteniendo reservaciones...');

  // Obtener todas las reservaciones
  const resResponse = await fetch(`${SUPABASE_URL}/rest/v1/raffle_reservations?select=id,ticket_number`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const reservations = await resResponse.json();
  console.log(`Encontradas ${reservations?.length || 0} reservaciones`);

  // Intentar borrar con un filtro más amplio
  console.log('Intentando borrar reservaciones...');
  const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_reservations?status=neq.deleted_placeholder`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete status:', deleteRes.status);

  console.log('\nReseteando tickets...');

  // Resetear todos los tickets
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets?number=neq.000`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'available',
      reserved_at: null,
      sold_at: null
    })
  });
  console.log('Update status:', updateRes.status);

  // Verificar estado final
  const finalRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_reservations?select=id`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const finalReservations = await finalRes.json();

  const finalTickets = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets?status=neq.available&select=number,status`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const nonAvailableTickets = await finalTickets.json();

  console.log('\n=== ESTADO FINAL ===');
  console.log(`Reservaciones restantes: ${finalReservations?.length || 0}`);
  console.log(`Tickets no disponibles: ${nonAvailableTickets?.length || 0}`);

  if (finalReservations?.length > 0) {
    console.log('\nReservaciones que no se pudieron borrar (posiblemente por RLS):');
    console.log(JSON.stringify(finalReservations, null, 2));
    console.log('\nNecesitas ir a Supabase Dashboard > Table Editor > raffle_reservations y borrarlas manualmente,');
    console.log('o desactivar temporalmente RLS para poder borrarlas.');
  }
}

resetData().catch(console.error);
