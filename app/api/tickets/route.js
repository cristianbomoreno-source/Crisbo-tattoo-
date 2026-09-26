import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data: tickets, error } = await supabase
      .from("raffle_tickets")
      .select("number, status")
      .order("number", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Error al cargar los tickets" },
      { status: 500 }
    );
  }
}
