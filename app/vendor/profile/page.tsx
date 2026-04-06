import { redirect } from "next/navigation";

import { VendorProfileForm } from "@/components/vendor/vendor-profile-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentAuthState } from "@/lib/auth-state";
import { getVendorPageData } from "@/lib/vendor/queries";
import type { VendorService } from "@/lib/vendor/types";

export default async function VendorProfilePage() {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?next=/vendor/profile");
  }

  if (profile?.role !== "vendor") {
    redirect("/dashboard");
  }

  const { vendor, gigs } = await getVendorPageData(user.id);

  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
          Vendor dashboard
        </Badge>
        <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl">
          Vendor profile
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Manage your public vendor profile, upload media, track availability, export your calendar, and review gig performance from one place.
        </p>

        <div className="glass-panel mt-8 p-6 sm:p-8">
          <VendorProfileForm
            userId={user.id}
            initialVendor={vendor}
            fallbackName={profile.full_name}
            fallbackLocationLabel={profile.location_label}
            fallbackLocationLat={profile.location_lat}
            fallbackLocationLng={profile.location_lng}
            fallbackService={(profile.service as VendorService | null) ?? null}
            fallbackRate={profile.hourly_rate}
            fallbackBio={profile.bio}
            preferredCurrency={profile.currency}
            gigs={gigs}
          />
        </div>
      </div>
    </main>
  );
}