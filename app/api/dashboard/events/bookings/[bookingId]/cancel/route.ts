import { NextResponse } from "next/server";

import type { BookingCancelResponse } from "@/lib/events/types";
import { getRefundPolicy } from "@/lib/events/timeline";
import { processNotificationQueue } from "@/lib/notifications/queue";
import { notifyPrimaryCancelled } from "@/lib/notifications/service";
import { createClient } from "@/lib/supabase/server";
import { createStripeRefund } from "@/lib/stripe/refunds";

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { bookingId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, planner_user_id, event_id, vendor_id, type, status, escrow_amount, currency, stripe_payment_intent_id, event:events!inner(event_start_date)"
    )
    .eq("id", bookingId)
    .eq("planner_user_id", user.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: error?.message ?? "Booking not found." }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 409 });
  }

  const eventRelation = booking.event as { event_start_date: string } | Array<{ event_start_date: string }> | null;
  const eventStartDate = Array.isArray(eventRelation) ? eventRelation[0]?.event_start_date : eventRelation?.event_start_date;

  if (!eventStartDate) {
    return NextResponse.json({ error: "Event details are missing for this booking." }, { status: 500 });
  }

  const refundPolicy = getRefundPolicy(eventStartDate, Number(booking.escrow_amount ?? 0));
  let refundStatus: BookingCancelResponse["refundStatus"] = "none";

  try {
    if (booking.stripe_payment_intent_id && refundPolicy.refundAmount > 0) {
      await createStripeRefund({
        paymentIntentId: booking.stripe_payment_intent_id,
        amount: refundPolicy.refundAmount,
        currency: booking.currency === "PKR" ? "PKR" : "USD",
        bookingId: booking.id,
        reason: body.reason,
      });
      refundStatus = "succeeded";
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        canceled_at: new Date().toISOString(),
        cancel_reason: body.reason?.trim() || null,
        refund_amount: refundPolicy.refundAmount,
        refund_percentage: refundPolicy.percentage,
        refund_status: refundStatus,
        refunded_at: refundStatus === "succeeded" ? new Date().toISOString() : null,
      })
      .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    if (booking.type === "primary") {
      await notifyPrimaryCancelled(booking.id).catch(() => {
        // Cancellation should still succeed even if alerts queue later.
      });
      await processNotificationQueue().catch(() => {
        // Queue retries can happen asynchronously.
      });
    }

    const response: BookingCancelResponse = {
      bookingId: booking.id,
      status: "cancelled",
      refundAmount: refundPolicy.refundAmount,
      refundPercentage: refundPolicy.percentage,
      refundStatus,
    };

    return NextResponse.json(response);
  } catch (cancelError) {
    return NextResponse.json(
      { error: cancelError instanceof Error ? cancelError.message : "Failed to cancel booking." },
      { status: 500 }
    );
  }
}