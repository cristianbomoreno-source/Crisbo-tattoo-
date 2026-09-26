import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET: Obtener todas las reservaciones (para admin)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // pending, approved, rejected, all

  try {
    let query = supabase
      .from("raffle_reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: reservations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Error al cargar las reservaciones" },
      { status: 500 }
    );
  }
}

// PUT: Aprobar o rechazar una reservación
export async function PUT(request) {
  try {
    const { reservationId, ticketNumber, action, adminNotes } = await request.json();

    if (!reservationId || !ticketNumber || !action) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Actualizar reservación a aprobada
      const { error: resError } = await supabase
        .from("raffle_reservations")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Actualizar ticket a vendido
      const { error: ticketError } = await supabase
        .from("raffle_tickets")
        .update({
          status: "sold",
          sold_at: new Date().toISOString(),
        })
        .eq("number", ticketNumber);

      if (ticketError) throw ticketError;

      return NextResponse.json({
        success: true,
        message: "Reservacion aprobada",
      });
    } else if (action === "reject") {
      // Actualizar reservación a rechazada
      const { error: resError } = await supabase
        .from("raffle_reservations")
        .update({
          status: "rejected",
          admin_notes: adminNotes || "Pago no verificado",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Devolver ticket a disponible
      const { error: ticketError } = await supabase
        .from("raffle_tickets")
        .update({
          status: "available",
          reserved_at: null,
        })
        .eq("number", ticketNumber);

      if (ticketError) throw ticketError;

      return NextResponse.json({
        success: true,
        message: "Reservacion rechazada",
      });
    } else if (action === "cancel") {
      // Cancelar una reservación aprobada
      const { error: resError } = await supabase
        .from("raffle_reservations")
        .update({
          status: "cancelled",
          admin_notes: adminNotes || "Cancelado por admin",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (resError) throw resError;

      // Devolver ticket a disponible
      const { error: ticketError } = await supabase
        .from("raffle_tickets")
        .update({
          status: "available",
          reserved_at: null,
          sold_at: null,
        })
        .eq("number", ticketNumber);

      if (ticketError) throw ticketError;

      return NextResponse.json({
        success: true,
        message: "Reservacion cancelada",
      });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    console.error("Error processing reservation:", error);
    return NextResponse.json(
      { error: "Error al procesar la reservacion" },
      { status: 500 }
    );
  }
}
