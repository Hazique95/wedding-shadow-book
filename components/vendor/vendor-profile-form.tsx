"use client";

import { CalendarArrowUpIcon, CheckCircle2Icon, LoaderCircleIcon, MapPinIcon, ShieldAlertIcon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

import { GooglePlacesInput } from "@/components/auth/google-places-input";
import { StripeConnectCard } from "@/components/vendor/stripe-connect-card";
import { AvailabilityCalendar } from "@/components/vendor/availability-calendar";
import { GigHistoryTable } from "@/components/vendor/gig-history-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CurrencyCode } from "@/lib/auth-types";
import { formatMoney } from "@/lib/currency";
import { buildAvailabilityIcs } from "@/lib/vendor/ics";
import { VENDOR_SERVICES, type VendorFormValues, type VendorGigRecord, type VendorProfileRecord, type VendorService } from "@/lib/vendor/types";
import { uploadVendorImage } from "@/lib/vendor/upload";

type VendorProfileFormProps = {
  userId: string;
  initialVendor: VendorProfileRecord | null;
  fallbackName: string;
  fallbackLocationLabel: string;
  fallbackLocationLat: number | null;
  fallbackLocationLng: number | null;
  fallbackService: VendorService | null;
  fallbackRate: number | null;
  fallbackBio: string | null;
  preferredCurrency: CurrencyCode;
  gigs: VendorGigRecord[];
};

function initialValuesFromProps({
  initialVendor,
  fallbackName,
  fallbackLocationLabel,
  fallbackLocationLat,
  fallbackLocationLng,
  fallbackService,
  fallbackRate,
  fallbackBio,
}: Omit<VendorProfileFormProps, "gigs" | "userId" | "preferredCurrency">): VendorFormValues {
  return {
    id: initialVendor?.id,
    name: initialVendor?.name ?? fallbackName,
    services: initialVendor?.services?.length
      ? initialVendor.services
      : fallbackService
        ? [fallbackService]
        : [],
    locationLabel: initialVendor?.location_label ?? fallbackLocationLabel,
    locationLat: initialVendor?.location_lat ?? fallbackLocationLat,
    locationLng: initialVendor?.location_lng ?? fallbackLocationLng,
    availability: initialVendor?.availability ?? { selectedDates: [] },
    portfolioUrl: initialVendor?.portfolio_url ?? [],
    primaryImageUrl: initialVendor?.primary_image_url ?? null,
    bio: initialVendor?.bio ?? fallbackBio ?? "",
    hourlyRate: initialVendor?.hourly_rate ?? fallbackRate,
    verified: initialVendor?.verified ?? false,
    claimedAt: initialVendor?.claimed_at ?? null,
  };
}

export function VendorProfileForm(props: VendorProfileFormProps) {
  const [values, setValues] = useState<VendorFormValues>(() => initialValuesFromProps(props));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(props.initialVendor?.primary_image_url ?? null);
  const [isSaving, setIsSaving] = useState(false);

  function toggleService(service: VendorService) {
    setValues((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((entry) => entry !== service)
        : [...current.services, service],
    }));
  }

  function exportCalendar() {
    const content = buildAvailabilityIcs(values.name || "Vendor", values.availability);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(values.name || "vendor").replace(/\s+/g, "-").toLowerCase()}-availability.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleClaimProfile() {
    setValues((current) => ({
      ...current,
      claimedAt: current.claimedAt ?? new Date().toISOString(),
    }));
    toast.success("Profile marked as claimed. Save to persist the claim.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      let primaryImageUrl = values.primaryImageUrl;
      let portfolioUrl = values.portfolioUrl;

      if (imageFile) {
        primaryImageUrl = await uploadVendorImage(imageFile, props.userId);
        portfolioUrl = Array.from(new Set([primaryImageUrl, ...portfolioUrl]));
      }

      const response = await fetch("/api/vendor/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          primaryImageUrl,
          portfolioUrl,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        id?: string;
        primary_image_url?: string | null;
        portfolio_url?: string[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save vendor profile.");
      }

      setValues((current) => ({
        ...current,
        id: payload.id ?? current.id,
        primaryImageUrl: payload.primary_image_url ?? primaryImageUrl,
        portfolioUrl: payload.portfolio_url ?? portfolioUrl,
      }));
      setPreviewUrl(payload.primary_image_url ?? primaryImageUrl);
      setImageFile(null);
      toast.success("Vendor profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save vendor profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendor-name">Vendor name</Label>
                <Input
                  id="vendor-name"
                  value={values.name}
                  onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Zaynah Mehndi Studio"
                />
              </div>

              <GooglePlacesInput
                value={values.locationLabel}
                onValueChange={(locationLabel) => setValues((current) => ({ ...current, locationLabel }))}
                onCoordinatesChange={({ lat, lng }) =>
                  setValues((current) => ({ ...current, locationLat: lat, locationLng: lng }))
                }
              />

              <div className="space-y-2">
                <Label htmlFor="vendor-rate">Hourly rate ({props.preferredCurrency})</Label>
                <Input
                  id="vendor-rate"
                  type="number"
                  min="100"
                  max="5000"
                  step="1"
                  value={values.hourlyRate ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      hourlyRate: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder={props.preferredCurrency === "PKR" ? "15000" : "125"}
                />
                <p className="text-xs text-muted-foreground">Stored and displayed in your selected currency preference.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Services</Label>
              <div className="flex flex-wrap gap-2">
                {VENDOR_SERVICES.map((service) => {
                  const active = values.services.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background/70 hover:border-primary/20"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Choose at least one service.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-bio">Bio</Label>
              <Textarea
                id="vendor-bio"
                value={values.bio}
                onChange={(event) => setValues((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Share what makes your team reliable on high-pressure wedding days."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Availability calendar</Label>
                  <p className="text-xs text-muted-foreground">Select the days you are available and export them to ICS.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-full" onClick={exportCalendar}>
                  <CalendarArrowUpIcon className="size-4" />
                  Export .ics
                </Button>
              </div>
              <AvailabilityCalendar
                selectedDates={values.availability.selectedDates}
                onChange={(selectedDates) =>
                  setValues((current) => ({
                    ...current,
                    availability: {
                      selectedDates,
                      exportedAt: new Date().toISOString(),
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-6">
            <StripeConnectCard
              accountId={props.initialVendor?.stripe_account_id ?? null}
              country={props.initialVendor?.stripe_account_country ?? null}
              onboardingComplete={props.initialVendor?.stripe_onboarding_complete ?? false}
              payoutsEnabled={props.initialVendor?.stripe_payouts_enabled ?? false}
              preferredCurrency={props.preferredCurrency}
            />

            <div className="rounded-[1.75rem] border border-border bg-background/70 p-5 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Portfolio image</div>
                  <div className="text-xs text-muted-foreground">Supabase Storage by default, Cloudinary when configured.</div>
                </div>
                <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
                  {values.primaryImageUrl ? "Uploaded" : "Pending"}
                </Badge>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border bg-muted/40">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Vendor portfolio preview"
                    width={1200}
                    height={900}
                    className="h-64 w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    Upload a hero image for the public profile.
                  </div>
                )}
              </div>

              <Label htmlFor="vendor-image" className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/30">
                <UploadIcon className="size-4" />
                Choose image
              </Label>
              <Input
                id="vendor-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) {
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {!values.verified ? (
              <div className="rounded-[1.75rem] border border-amber-300/40 bg-amber-50/80 p-5 dark:border-amber-300/20 dark:bg-amber-400/8">
                <div className="flex items-start gap-3">
                  <ShieldAlertIcon className="mt-0.5 size-5 text-amber-700 dark:text-amber-300" />
                  <div>
                    <div className="font-medium">Unverified vendor profile</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Claim the profile now, then save to attach it to your account for review.
                    </p>
                    <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={handleClaimProfile}>
                      Claim Profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.75rem] border border-border bg-background/70 p-5 dark:bg-white/5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPinIcon className="size-4 text-primary" />
                Lahore geo guardrail
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Saved vendor coordinates must stay within 50km of Lahore for this rollout. The form blocks out-of-range coordinates before submit.
              </p>
              <div className="mt-4 space-y-2 text-sm text-foreground/85">
                <div>Lat: {values.locationLat ?? "-"}</div>
                <div>Lng: {values.locationLng ?? "-"}</div>
                <div>Services: {values.services.length || 0} selected</div>
                <div>Rate: {values.hourlyRate ? formatMoney(values.hourlyRate, props.preferredCurrency) : "Not set"}</div>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-full" disabled={isSaving}>
              {isSaving ? <LoaderCircleIcon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
              {isSaving ? "Saving vendor profile..." : "Save vendor profile"}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-4xl leading-none">Gig history</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sortable and paginated event history from your vendor bookings.</p>
        </div>
        <GigHistoryTable gigs={props.gigs} />
      </div>
    </div>
  );
}