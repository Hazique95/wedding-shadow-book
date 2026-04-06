import { NextResponse } from "next/server";

import {
  CURRENCY_OPTIONS,
  ROLE_OPTIONS,
  SERVICE_OPTIONS,
  type CurrencyCode,
  type ServiceType,
  type UTMParams,
  type UserRole,
} from "@/lib/auth-types";
import { buildLocationLabel, resolveLocationSelection } from "@/lib/location-data";
import { withRetry } from "@/lib/retry";
import { createRouteClient } from "@/lib/supabase/route";

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function isUserRole(value: unknown): value is UserRole {
  return ROLE_OPTIONS.some((option) => option.value === value);
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCY_OPTIONS.includes(value as CurrencyCode);
}

function isServiceType(value: unknown): value is ServiceType {
  return value == null || SERVICE_OPTIONS.some((option) => option.value === value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as SupabaseLikeError;
    const messageParts = [maybeError.message, maybeError.details, maybeError.hint]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    if (messageParts.length) {
      return messageParts.join(" ");
    }

    if (maybeError.code) {
      return `Supabase error code: ${maybeError.code}`;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Failed to save onboarding profile.";
}

export async function POST(request: Request) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      role?: UserRole;
      fullName?: string;
      country?: string;
      city?: string;
      postalCode?: string;
      locationLabel?: string;
      locationLat?: number | null;
      locationLng?: number | null;
      service?: ServiceType | "" | null;
      bio?: string;
      hourlyRate?: string | number | null;
      currency?: CurrencyCode;
      signupSourceUtm?: UTMParams | null;
    };

    const role = body.role;
    const fullName = body.fullName?.trim() ?? "";
    const currency = body.currency;
    const service = body.service || null;
    const hourlyRate = body.hourlyRate === "" || body.hourlyRate == null ? null : Number(body.hourlyRate);
    const locationSelection = resolveLocationSelection({
      country: body.country,
      city: body.city,
      postalCode: body.postalCode,
    });

    if (!isUserRole(role)) {
      return NextResponse.json({ error: "Choose Planner or Vendor before continuing." }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!locationSelection) {
      return NextResponse.json({ error: "Choose a valid country, city, and postal code combination." }, { status: 400 });
    }

    if (!isCurrencyCode(currency)) {
      return NextResponse.json({ error: "Choose a valid currency." }, { status: 400 });
    }

    if (!isServiceType(service)) {
      return NextResponse.json({ error: "Choose a valid service category." }, { status: 400 });
    }

    if (role === "vendor" && !service) {
      return NextResponse.json({ error: "Choose a service category for the vendor profile." }, { status: 400 });
    }

    if (role === "vendor" && (!Number.isFinite(hourlyRate) || hourlyRate == null)) {
      return NextResponse.json({ error: "Add an hourly rate for the vendor profile." }, { status: 400 });
    }

    await withRetry(async () => {
      const response = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        role,
        full_name: fullName,
        location_label: buildLocationLabel(locationSelection),
        location_lat: null,
        location_lng: null,
        service: role === "vendor" ? service : null,
        bio: body.bio?.trim() ? body.bio.trim() : null,
        hourly_rate: role === "vendor" ? hourlyRate : null,
        currency,
        signup_source_utm: body.signupSourceUtm ?? null,
      });

      if (response.error) {
        throw new Error(getErrorMessage(response.error));
      }

      return response;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}