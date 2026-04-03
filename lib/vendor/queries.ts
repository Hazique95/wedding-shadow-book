import type { VendorGigRecord, VendorProfileRecord } from "@/lib/vendor/types";
import { createClient } from "@/lib/supabase/server";

export async function getVendorPageData(userId: string) {
  const supabase = await createClient();

  const [{ data: vendor }, { data: gigs }] = await Promise.all([
    supabase.from("vendors").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("vendor_gigs")
      .select("*")
      .eq("vendor_user_id", userId)
      .order("event_date", { ascending: false }),
  ]);

  return {
    vendor: (vendor as VendorProfileRecord | null) ?? null,
    gigs: (gigs as VendorGigRecord[] | null) ?? [],
  };
}
