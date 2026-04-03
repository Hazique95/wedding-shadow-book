import type { UserProfile } from "@/lib/auth-types";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAuthState() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (data as UserProfile | null) ?? null };
}

export function isProfileComplete(profile: Partial<UserProfile> | null) {
  if (!profile) {
    return false;
  }

  return Boolean(profile.role && profile.full_name && profile.location_label);
}
