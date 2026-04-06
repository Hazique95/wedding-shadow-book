import Stripe from "stripe";

import type { CurrencyCode } from "@/lib/auth-types";
import { toStripeCurrency, toMinorUnit } from "@/lib/currency";

let stripeClient: Stripe | null | undefined;

export type CreateStripeCheckoutSessionOptions = {
  bookingId: string;
  eventId: string;
  vendorId: string;
  plannerUserId: string;
  vendorName: string;
  vendorStripeAccountId: string;
  amount: number;
  currency: CurrencyCode;
  applicationFeeAmount: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  type: "primary" | "shadow";
};

export function getStripeServerClient() {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(apiKey);
  return stripeClient;
}

export async function createConnectedVendorAccount(options: {
  email?: string | null;
  country: "US" | "PK";
  vendorName: string;
  vendorId: string;
  userId: string;
}) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.accounts.create({
    type: "express",
    country: options.country,
    email: options.email ?? undefined,
    business_type: "individual",
    business_profile: {
      name: options.vendorName,
    },
    capabilities: {
      transfers: {
        requested: true,
      },
    },
    metadata: {
      vendor_id: options.vendorId,
      user_id: options.userId,
    },
  });
}

export async function getConnectedVendorAccount(accountId: string) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.accounts.retrieve(accountId);
}

export async function createConnectedAccountLink(options: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.accountLinks.create({
    account: options.accountId,
    refresh_url: options.refreshUrl,
    return_url: options.returnUrl,
    type: "account_onboarding",
  });
}

export async function createBookingCheckoutSession(options: CreateStripeCheckoutSessionOptions) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail ?? undefined,
    metadata: {
      booking_id: options.bookingId,
      event_id: options.eventId,
      vendor_id: options.vendorId,
      planner_user_id: options.plannerUserId,
      type: options.type,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: toStripeCurrency(options.currency),
          product_data: {
            name: `${options.type === "primary" ? "Primary" : "Shadow"} booking for ${options.vendorName}`,
          },
          unit_amount: toMinorUnit(options.amount, options.currency),
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: toMinorUnit(options.applicationFeeAmount, options.currency),
      transfer_data: {
        destination: options.vendorStripeAccountId,
      },
      on_behalf_of: options.vendorStripeAccountId,
      metadata: {
        booking_id: options.bookingId,
        event_id: options.eventId,
        vendor_id: options.vendorId,
        planner_user_id: options.plannerUserId,
        type: options.type,
      },
    },
  });
}

export function verifyStripeWebhookSignature(payload: string, signature: string) {
  const stripe = getStripeServerClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripeServerClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}