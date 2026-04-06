import { NextResponse } from "next/server";

import type { BookingResponse } from "@/lib/events/types";
import { calculateEscrowAmount } from "@/lib/events/utils";
import { EventValidationError, parseBookingPayload } from "@/lib/events/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = parseBookingPayload(await request.json());

    const [{ data: eventRow, error: eventError }, { data: vendorRow, error: vendorError }] = await Promise.all([
      supabase
        .from("events")
        .select("id")
        .eq("id", payload.eventId)
        .eq("planner_user_id", user.id)
        .maybeSingle(),
      supabase
        .from("vendors")
        .select("id, name, hourly_rate")
        .eq("id", payload.vendorId)
        .maybeSingle(),
    ]);

    if (eventError || !eventRow) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (vendorError || !vendorRow) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const hourlyRate = Number(vendorRow.hourly_rate ?? 0);
    const escrowAmount = calculateEscrowAmount(hourlyRate, payload.estimatedHours);

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        event_id: payload.eventId,
        vendor_id: payload.vendorId,
        planner_user_id: user.id,
        type: payload.type,
        status: "pending",
        estimated_hours: payload.estimatedHours,
        hourly_rate_snapshot: hourlyRate,
        escrow_amount: escrowAmount,
      })
      .select("id, status, escrow_amount")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `A ${payload.type} booking already exists for this vendor on the event.` },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as BookingResponse);
  } catch (error) {
    if (error instanceof EventValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking." },
      { status: 500 }
    );
  }
}