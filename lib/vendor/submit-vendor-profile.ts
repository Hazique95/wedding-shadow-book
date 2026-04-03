import type { SupabaseClient } from "@supabase/supabase-js";

import type { VendorFormValues } from "@/lib/vendor/types";
import { validateVendorProfile } from "@/lib/vendor/validation";

export type VendorSubmitDeps = {
  supabase: Pick<SupabaseClient, "from">;
  userId: string;
  uploadImage?: (file: File, userId: string) => Promise<string>;
};

export async function submitVendorProfile(
  values: VendorFormValues,
  deps: VendorSubmitDeps,
  imageFile?: File | null
) {
  const errors = validateVendorProfile(values);

  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  let primaryImageUrl = values.primaryImageUrl;
  let portfolioUrl = values.portfolioUrl;

  if (imageFile && deps.uploadImage) {
    primaryImageUrl = await deps.uploadImage(imageFile, deps.userId);
    portfolioUrl = Array.from(new Set([primaryImageUrl, ...portfolioUrl]));
  }

  const payload = {
    id: values.id,
    user_id: deps.userId,
    name: values.name.trim(),
    services: values.services,
    availability: values.availability,
    portfolio_url: portfolioUrl,
    primary_image_url: primaryImageUrl,
    bio: values.bio.trim() || null,
    hourly_rate: values.hourlyRate,
    location_label: values.locationLabel.trim(),
    location: `POINT(${values.locationLng} ${values.locationLat})`,
    verified: values.verified,
    claimed_at: values.claimedAt,
  };

  const { error } = await deps.supabase.from("vendors").upsert(payload);

  if (error) {
    throw error;
  }

  return payload;
}
