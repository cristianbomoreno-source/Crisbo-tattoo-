import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para obtener todos los tickets con su estado
export async function getTickets() {
  const { data, error } = await supabase
    .from('raffle_tickets')
    .select('*')
    .order('number', { ascending: true });

  if (error) throw error;
  return data;
}

// Helper para crear una reservación
export async function createReservation(ticketNumber, buyerData, paymentProofUrl) {
  // Primero verificar que el ticket esté disponible
  const { data: ticket, error: ticketError } = await supabase
    .from('raffle_tickets')
    .select('status')
    .eq('number', ticketNumber)
    .single();

  if (ticketError) throw ticketError;
  if (ticket.status !== 'available') {
    throw new Error('Este número ya no está disponible');
  }

  // Crear la reservación
  const { data: reservation, error: reservationError } = await supabase
    .from('raffle_reservations')
    .insert({
      ticket_number: ticketNumber,
      buyer_name: buyerData.name,
      buyer_whatsapp: buyerData.whatsapp,
      buyer_email: buyerData.email || null,
      payment_proof_url: paymentProofUrl,
    })
    .select()
    .single();

  if (reservationError) throw reservationError;

  // Actualizar el estado del ticket a reservado
  const { error: updateError } = await supabase
    .from('raffle_tickets')
    .update({
      status: 'reserved',
      reserved_at: new Date().toISOString()
    })
    .eq('number', ticketNumber);

  if (updateError) throw updateError;

  return reservation;
}

// Helper para subir comprobante de pago
export async function uploadPaymentProof(file, ticketNumber) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${ticketNumber}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, file);

  if (error) throw error;

  // Obtener URL pública (aunque el bucket sea privado, podemos generar una URL firmada)
  const { data: urlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// Admin: Obtener todas las reservaciones pendientes
export async function getPendingReservations() {
  const { data, error } = await supabase
    .from('raffle_reservations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Admin: Aprobar reservación
export async function approveReservation(reservationId, ticketNumber) {
  // Actualizar reservación
  const { error: resError } = await supabase
    .from('raffle_reservations')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reservationId);

  if (resError) throw resError;

  // Actualizar ticket a vendido
  const { error: ticketError } = await supabase
    .from('raffle_tickets')
    .update({
      status: 'sold',
      sold_at: new Date().toISOString()
    })
    .eq('number', ticketNumber);

  if (ticketError) throw ticketError;
}

// Admin: Rechazar reservación
export async function rejectReservation(reservationId, ticketNumber, adminNotes) {
  // Actualizar reservación
  const { error: resError } = await supabase
    .from('raffle_reservations')
    .update({
      status: 'rejected',
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reservationId);

  if (resError) throw resError;

  // Devolver ticket a disponible
  const { error: ticketError } = await supabase
    .from('raffle_tickets')
    .update({
      status: 'available',
      reserved_at: null
    })
    .eq('number', ticketNumber);

  if (ticketError) throw ticketError;
}
