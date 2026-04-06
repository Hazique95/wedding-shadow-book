import { NextResponse } from "next/server";

import { captureServerException } from "@/lib/monitoring/sentry";
import { createConnectedVendorAccount, createConnectedAccountLink, getConnectedVendorAccount } from "@/lib/stripe/server";
import { parseStoredLocationLabel } from "@/lib/location-data";
import { createClient } from "@/lib/supabase/server";

function resolveStripeCountry(country: string | null | undefined) {
  if (country === "Pakistan") {
    return "PK" as const;
  }

  if (country === "United States") {
    return "US" as const;
  }

  return null;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [{ data: profile }, { data: vendor }] = await Promise.all([
    supabase.from("users").select("role, full_name, location_label").eq("id", user.id).maybeSingle(),
    supabase.from("vendors").select("id, name, stripe_account_id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profile?.role !== "vendor") {
    return NextResponse.json({ error: "Only vendors can connect Stripe payouts." }, { status: 403 });
  }

  if (!vendor) {
    return NextResponse.json({ error: "Save your vendor profile before starting Stripe onboarding." }, { status: 400 });
  }

  const location = parseStoredLocationLabel(profile.location_label);
  const country = resolveStripeCountry(location?.country);

  if (!country) {
    return NextResponse.json(
      { error: "Stripe Connect onboarding is currently enabled for vendors based in Pakistan or the United States." },
      { status: 400 }
    );
  }

  try {
    let accountId = vendor.stripe_account_id;
    let account = accountId ? await getConnectedVendorAccount(accountId) : null;

    if (!accountId || !account) {
      account = await createConnectedVendorAccount({
        email: user.email,
        country,
        vendorName: vendor.name,
        vendorId: vendor.id,
        userId: user.id,
      });
      accountId = account.id;
    }

    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        stripe_account_id: accountId,
        stripe_account_country: country,
        stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
      })
      .eq("id", vendor.id);

    if (updateError) {
      throw updateError;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const accountLink = await createConnectedAccountLink({
      accountId,
      refreshUrl: `${siteUrl}/vendor/profile?stripe=refresh`,
      returnUrl: `${siteUrl}/vendor/profile?stripe=return`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    await captureServerException(error, {
      userId: user.id,
      vendorId: vendor.id,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start Stripe onboarding." },
      { status: 500 }
    );
  }
}