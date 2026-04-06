import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { captureServerException } from "@/lib/monitoring/sentry";
import { processNotificationQueue } from "@/lib/notifications/queue";
import { notifyBookingPaid, notifyPaymentFailed } from "@/lib/notifications/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeWebhookSignature } from "@/lib/stripe/server";

async function updateBooking(admin: NonNullable<ReturnType<typeof createAdminClient>>, bookingId: string, values: Record<string, unknown>) {
  const { error } = await admin.from("bookings").update(values as never).eq("id", bookingId);
  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 500 });
  }

  const payload = await request.text();

  try {
    const event = verifyStripeWebhookSignature(payload, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          await updateBooking(admin, bookingId, {
            status: "paid",
            stripe_payment_status: "paid",
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
            paid_at: new Date().toISOString(),
            payout_released_at: new Date().toISOString(),
          });
          await notifyBookingPaid(bookingId, admin);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          await updateBooking(admin, bookingId, {
            status: "payment_failed",
            stripe_payment_status: "expired",
          });
          await notifyPaymentFailed(bookingId, admin);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          await updateBooking(admin, bookingId, {
            status: "payment_failed",
            stripe_payment_status: "failed",
            stripe_payment_intent_id: paymentIntent.id,
          });
          await notifyPaymentFailed(bookingId, admin);
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const { error } = await admin
          .from("vendors")
          .update({
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_details_submitted: account.details_submitted,
            stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
          } as never)
          .eq("stripe_account_id", account.id);

        if (error) {
          throw error;
        }
        break;
      }
      default:
        break;
    }

    await processNotificationQueue({ admin }).catch(() => {
      // Webhooks should stay resilient even if queued notifications need later retry.
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    await captureServerException(error, {
      route: "stripe-webhooks",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process Stripe webhook." },
      { status: 400 }
    );
  }
}