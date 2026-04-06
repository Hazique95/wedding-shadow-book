import { NextResponse } from "next/server";

import type { BookingResponse } from "@/lib/events/types";
import { calculateEscrowAmount } from "@/lib/events/utils";
import { EventValidationError, parseBookingPayload } from "@/lib/events/validation";
import { createClient } from "@/lib/supabase/server";
import { calculateApplicationFee, calculateVendorPayout, convertCurrencyAmount, normalizeCurrency } from "@/lib/currency";
import { createBookingCheckoutSession } from "@/lib/stripe/server";

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

    const [
      { data: eventRow, error: eventError },
      { data: vendorRow, error: vendorError },
      { data: plannerProfile },
    ] = await Promise.all([
      supabase
        .from("events")
        .select("id")
        .eq("id", payload.eventId)
        .eq("planner_user_id", user.id)
        .maybeSingle(),
      supabase
        .from("vendors")
        .select("id, user_id, name, hourly_rate, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled")
        .eq("id", payload.vendorId)
        .maybeSingle(),
      supabase.from("users").select("currency").eq("id", user.id).maybeSingle(),
    ]);

    if (eventError || !eventRow) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (vendorError || !vendorRow) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    if (!vendorRow.stripe_account_id || !vendorRow.stripe_onboarding_complete || !vendorRow.stripe_payouts_enabled) {
      return NextResponse.json(
        { error: "This vendor has not completed Stripe payout onboarding yet." },
        { status: 400 }
      );
    }

    const plannerCurrency = normalizeCurrency(plannerProfile?.currency, "USD");
    const { data: vendorProfile } = vendorRow.user_id
      ? await supabase.from("users").select("currency").eq("id", vendorRow.user_id).maybeSingle()
      : { data: null };
    const vendorCurrency = normalizeCurrency(vendorProfile?.currency, plannerCurrency);
    const sourceHourlyRate = Number(vendorRow.hourly_rate ?? 0);
    const convertedHourlyRate = convertCurrencyAmount(sourceHourlyRate, vendorCurrency, plannerCurrency);
    const escrowAmount = calculateEscrowAmount(convertedHourlyRate, payload.estimatedHours);
    const applicationFeeAmount = calculateApplicationFee(escrowAmount);
    const vendorPayoutAmount = calculateVendorPayout(escrowAmount);

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("event_id", payload.eventId)
      .eq("vendor_id", payload.vendorId)
      .eq("type", payload.type)
      .maybeSingle();

    let bookingId = existingBooking?.id ?? null;

    if (existingBooking && (existingBooking.status === "paid" || existingBooking.status === "confirmed")) {
      return NextResponse.json(
        { error: `A ${payload.type} booking already exists for this vendor on the event.` },
        { status: 409 }
      );
    }

    const bookingPayload = {
      event_id: payload.eventId,
      vendor_id: payload.vendorId,
      planner_user_id: user.id,
      type: payload.type,
      status: "pending",
      estimated_hours: payload.estimatedHours,
      hourly_rate_snapshot: convertedHourlyRate,
      escrow_amount: escrowAmount,
      currency: plannerCurrency,
      planner_currency: plannerCurrency,
      vendor_currency: vendorCurrency,
      exchange_rate: vendorCurrency === plannerCurrency ? 1 : Number((convertCurrencyAmount(1, "USD", "PKR")).toFixed(6)),
      application_fee_amount: applicationFeeAmount,
      vendor_payout_amount: vendorPayoutAmount,
      stripe_payment_status: "unpaid",
    };

    if (bookingId) {
      const { error } = await supabase.from("bookings").update(bookingPayload).eq("id", bookingId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select("id")
        .single();

      if (error || !data) {
        return NextResponse.json({ error: error?.message ?? "Failed to create booking." }, { status: 500 });
      }

      bookingId = data.id;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await createBookingCheckoutSession({
      bookingId,
      eventId: payload.eventId,
      vendorId: payload.vendorId,
      plannerUserId: user.id,
      vendorName: vendorRow.name,
      vendorStripeAccountId: vendorRow.stripe_account_id,
      amount: escrowAmount,
      currency: plannerCurrency,
      applicationFeeAmount,
      successUrl: `${siteUrl}/dashboard/success?session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteUrl}/dashboard/events?checkout=cancelled`,
      customerEmail: user.email,
      type: payload.type,
    });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const response: BookingResponse = {
      id: bookingId,
      status: "pending",
      escrow_amount: escrowAmount,
      currency: plannerCurrency,
      checkout_url: session.url ?? undefined,
      session_id: session.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof EventValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking checkout." },
      { status: 500 }
    );
  }
}