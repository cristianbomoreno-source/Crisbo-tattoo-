import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST: Resetear todos los datos (solo para desarrollo)
export async function POST(request) {
  try {
    // Borrar todas las reservaciones
    const { error: resError } = await supabase
      .from("raffle_reservations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Truco para borrar todo

    if (resError) throw resError;

    // Resetear todos los tickets a disponibles
    const { error: ticketError } = await supabase
      .from("raffle_tickets")
      .update({
        status: "available",
        reserved_at: null,
        sold_at: null,
      })
      .neq("number", "000"); // Truco para actualizar todo

    if (ticketError) throw ticketError;

    return NextResponse.json({
      success: true,
      message: "Todos los datos han sido reseteados",
    });
  } catch (error) {
    console.error("Error resetting data:", error);
    return NextResponse.json(
      { error: "Error al resetear los datos" },
      { status: 500 }
    );
  }
}
