import type { CurrencyCode } from "@/lib/auth-types";
import { toMinorUnit } from "@/lib/currency";
import { getStripeServerClient } from "@/lib/stripe/server";

export async function createStripeRefund(options: {
  paymentIntentId: string;
  amount: number;
  currency: CurrencyCode;
  bookingId: string;
  reason?: string;
}) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.refunds.create({
    payment_intent: options.paymentIntentId,
    amount: toMinorUnit(options.amount, options.currency),
    metadata: {
      booking_id: options.bookingId,
      reason: options.reason ?? "planner_cancelled",
    },
  });
}