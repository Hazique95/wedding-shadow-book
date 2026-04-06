import { NextResponse } from "next/server";

import type { VendorFormValues } from "@/lib/vendor/types";
import { createRouteClient } from "@/lib/supabase/route";
import { validateVendorProfile } from "@/lib/vendor/validation";

export async function POST(request: Request) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const values = (await request.json()) as VendorFormValues;
    const errors = validateVendorProfile(values);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const payload = {
      id: values.id,
      user_id: user.id,
      name: values.name.trim(),
      services: values.services,
      availability: values.availability,
      portfolio_url: values.portfolioUrl,
      primary_image_url: values.primaryImageUrl,
      bio: values.bio.trim() || null,
      hourly_rate: values.hourlyRate,
      location_label: values.locationLabel.trim(),
      location: `POINT(${values.locationLng} ${values.locationLat})`,
      verified: values.verified,
      claimed_at: values.claimedAt,
    };

    const { error } = await supabase.from("vendors").upsert(payload);

    if (error) {
      throw error;
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save vendor profile." },
      { status: 500 }
    );
  }
}