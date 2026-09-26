import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();

    const ticketNumber = formData.get("ticketNumber");
    const name = formData.get("name");
    const whatsapp = formData.get("whatsapp");
    const email = formData.get("email");
    const paymentProof = formData.get("paymentProof");

    // Validaciones
    if (!ticketNumber || !name || !whatsapp || !paymentProof) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que el ticket esté disponible
    const { data: ticket, error: ticketError } = await supabase
      .from("raffle_tickets")
      .select("status")
      .eq("number", ticketNumber)
      .single();

    if (ticketError) {
      return NextResponse.json(
        { error: "Numero de boleta no valido" },
        { status: 400 }
      );
    }

    if (ticket.status !== "available") {
      return NextResponse.json(
        { error: "Esta boleta ya no esta disponible" },
        { status: 400 }
      );
    }

    // Subir comprobante de pago
    const fileExt = paymentProof.name.split(".").pop();
    const fileName = `${ticketNumber}-${Date.now()}.${fileExt}`;

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

    // Crear la reservación
    const { data: reservation, error: reservationError } = await supabase
      .from("raffle_reservations")
      .insert({
        ticket_number: ticketNumber,
        buyer_name: name,
        buyer_whatsapp: whatsapp,
        buyer_email: email || null,
        payment_proof_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (reservationError) {
      console.error("Error creando reservacion:", reservationError);
      return NextResponse.json(
        { error: "Error al crear la reservacion" },
        { status: 500 }
      );
    }

    // Actualizar el estado del ticket a reservado
    const { error: updateError } = await supabase
      .from("raffle_tickets")
      .update({
        status: "reserved",
        reserved_at: new Date().toISOString(),
      })
      .eq("number", ticketNumber);

    if (updateError) {
      console.error("Error actualizando ticket:", updateError);
      // Intentar revertir la reservación
      await supabase.from("raffle_reservations").delete().eq("id", reservation.id);
      return NextResponse.json(
        { error: "Error al procesar la reserva" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: "Reserva creada exitosamente",
    });
  } catch (error) {
    console.error("Error en reserva:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
