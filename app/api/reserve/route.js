import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();

    const ticketNumbersJson = formData.get("ticketNumbers");
    const name = formData.get("name");
    const whatsapp = formData.get("whatsapp");
    const email = formData.get("email");
    const paymentProof = formData.get("paymentProof");

    // Parsear los números de boleta
    let ticketNumbers;
    try {
      ticketNumbers = JSON.parse(ticketNumbersJson);
    } catch {
      return NextResponse.json(
        { error: "Formato de boletas inválido" },
        { status: 400 }
      );
    }

    // Validaciones
    if (!ticketNumbers || ticketNumbers.length === 0 || !name || !whatsapp || !paymentProof) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que TODOS los tickets estén disponibles
    const { data: tickets, error: ticketError } = await supabase
      .from("raffle_tickets")
      .select("number, status")
      .in("number", ticketNumbers);

    if (ticketError) {
      return NextResponse.json(
        { error: "Error verificando boletas" },
        { status: 400 }
      );
    }

    // Verificar que se encontraron todos los tickets
    if (tickets.length !== ticketNumbers.length) {
      return NextResponse.json(
        { error: "Algunas boletas no existen" },
        { status: 400 }
      );
    }

    // Verificar que todos estén disponibles
    const unavailable = tickets.filter(t => t.status !== "available");
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: `Las boletas ${unavailable.map(t => '#' + t.number).join(', ')} ya no están disponibles` },
        { status: 400 }
      );
    }

    // Subir comprobante de pago (uno solo para todas las boletas)
    const fileExt = paymentProof.name.split(".").pop();
    const fileName = `${ticketNumbers.join('-')}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, paymentProof);

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el comprobante" },
        { status: 500 }
      );
    }

    // Obtener URL del archivo
    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    // Crear reservaciones para cada boleta
    const reservationsData = ticketNumbers.map(number => ({
      ticket_number: number,
      buyer_name: name,
      buyer_whatsapp: whatsapp,
      buyer_email: email || null,
      payment_proof_url: urlData.publicUrl,
    }));

    const { data: reservations, error: reservationError } = await supabase
      .from("raffle_reservations")
      .insert(reservationsData)
      .select();

    if (reservationError) {
      console.error("Error creando reservaciones:", reservationError);
      return NextResponse.json(
        { error: "Error al crear las reservaciones" },
        { status: 500 }
      );
    }

    // Actualizar el estado de todos los tickets a reservado
    const { error: updateError } = await supabase
      .from("raffle_tickets")
      .update({
        status: "reserved",
        reserved_at: new Date().toISOString(),
      })
      .in("number", ticketNumbers);

    if (updateError) {
      console.error("Error actualizando tickets:", updateError);
      // Intentar revertir las reservaciones
      const reservationIds = reservations.map(r => r.id);
      await supabase.from("raffle_reservations").delete().in("id", reservationIds);
      return NextResponse.json(
        { error: "Error al procesar la reserva" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservations,
      ticketCount: ticketNumbers.length,
      totalAmount: ticketNumbers.length * 30000,
      message: `${ticketNumbers.length} boleta(s) reservada(s) exitosamente`,
    });
  } catch (error) {
    console.error("Error en reserva:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
