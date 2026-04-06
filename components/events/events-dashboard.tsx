"use client";

import {
  CalendarRangeIcon,
  LoaderCircleIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { GooglePlacesInput } from "@/components/auth/google-places-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurrencyCode } from "@/lib/auth-types";
import { convertCurrencyAmount, formatMoney } from "@/lib/currency";
import {
  DEFAULT_EVENT_BUDGET,
  DEFAULT_EVENT_HOURS,
  DEFAULT_EVENT_RADIUS_KM,
  EVENT_SERVICES,
  MAX_EVENT_BUDGET,
  MIN_EVENT_BUDGET,
  type BookingType,
  type MatchEventsResponse,
  type VendorMatchRecord,
} from "@/lib/events/types";
import {
  calculateEscrowAmount,
  formatDistance,
  getAdvancedRiskTone,
  getRiskScoreTone,
  toDateString,
} from "@/lib/events/utils";
import type { VendorRiskAnalysisResponse } from "@/lib/risk/types";
import { cn } from "@/lib/utils";

type EventsDashboardProps = {
  preferredCurrency: CurrencyCode;
};

type BookingIntent = {
  vendor: VendorMatchRecord;
  type: BookingType;
};

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@weddingshadowbook.com";

export function EventsDashboard({ preferredCurrency }: EventsDashboardProps) {
  const searchParams = useSearchParams();
  const checkoutToastShown = useRef(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [venueLabel, setVenueLabel] = useState("");
  const [venueLat, setVenueLat] = useState<number | null>(null);
  const [venueLng, setVenueLng] = useState<number | null>(null);
  const [budget, setBudget] = useState(DEFAULT_EVENT_BUDGET);
  const [guestCount, setGuestCount] = useState(180);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_EVENT_RADIUS_KM);
  const [services, setServices] = useState<string[]>(["mehndi", "photog"]);
  const [matches, setMatches] = useState<VendorMatchRecord[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingIntent, setBookingIntent] = useState<BookingIntent | null>(null);
  const [estimatedHours, setEstimatedHours] = useState(DEFAULT_EVENT_HOURS);
  const [isBooking, setIsBooking] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [riskInsights, setRiskInsights] = useState<Record<string, VendorRiskAnalysisResponse>>({});
  const [loadingRiskIds, setLoadingRiskIds] = useState<Record<string, boolean>>({});
  const riskRequestId = useRef(0);

  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled" && !checkoutToastShown.current) {
      checkoutToastShown.current = true;
      toast.error("Checkout was not completed. You can retry the payment.");
    }
  }, [searchParams]);

  const bookingPreview = useMemo(() => {
    if (!bookingIntent) {
      return null;
    }

    const displayedRate = convertCurrencyAmount(
      bookingIntent.vendor.hourly_rate,
      bookingIntent.vendor.vendor_currency,
      preferredCurrency
    );

    return calculateEscrowAmount(displayedRate, estimatedHours);
  }, [bookingIntent, estimatedHours, preferredCurrency]);

  const bookingRiskInsight = bookingIntent ? riskInsights[bookingIntent.vendor.id] : null;
  const bookingRiskLoading = bookingIntent ? Boolean(loadingRiskIds[bookingIntent.vendor.id]) : false;
  const bookingAdvancedScore = bookingIntent ? bookingRiskInsight?.finalScore ?? bookingIntent.vendor.risk_score * 2 : 0;

  function toggleService(service: string) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((entry) => entry !== service)
        : [...current, service]
    );
  }

  async function hydrateRiskInsights(nextMatches: VendorMatchRecord[], requestId: number) {
    const vendorIds = Array.from(new Set(nextMatches.map((vendor) => vendor.id)));

    if (!vendorIds.length) {
      setRiskInsights({});
      setLoadingRiskIds({});
      return;
    }

    setLoadingRiskIds(Object.fromEntries(vendorIds.map((vendorId) => [vendorId, true])));

    const results = await Promise.allSettled(
      vendorIds.map(async (vendorId) => {
        const response = await fetch(`/api/risk/${vendorId}`);
        const payload = (await response.json()) as VendorRiskAnalysisResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Risk analysis failed.");
        }

        return payload;
      })
    );

    if (requestId !== riskRequestId.current) {
      return;
    }

    const nextInsights: Record<string, VendorRiskAnalysisResponse> = {};
    let failedCount = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        nextInsights[result.value.vendorId] = result.value;
      } else {
        failedCount += 1;
      }
    }

    setRiskInsights(nextInsights);
    setLoadingRiskIds({});

    if (failedCount > 0) {
      toast.error("Some AI risk scans could not be completed. Showing database scores for the remaining vendors.");
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Pick an event date range first.");
      return;
    }

    if (!services.length) {
      toast.error("Select at least one required service.");
      return;
    }

    if (venueLat === null || venueLng === null) {
      toast.error("Pick the venue from Google Places so we can calculate radius accurately.");
      return;
    }

    const activeRiskRequestId = riskRequestId.current + 1;
    riskRequestId.current = activeRiskRequestId;
    setRiskInsights({});
    setLoadingRiskIds({});
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/dashboard/events/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: toDateString(startDate),
          endDate: toDateString(endDate),
          venueLabel,
          venueLat,
          venueLng,
          budget,
          guestCount,
          radiusKm,
          services,
        }),
      });

      const payload = (await response.json()) as MatchEventsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed.");
      }

      setEventId(payload.eventId);
      setMatches(payload.matches);

      if (payload.matches.length) {
        toast.success(payload.cached ? "Vendor shortlist loaded from cache." : "Vendor shortlist ready.");
        void hydrateRiskInsights(payload.matches, activeRiskRequestId);
      } else {
        toast.error("No live matches yet. Try broadening the radius.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleBookingConfirm() {
    if (!bookingIntent || !eventId) {
      return;
    }

    setIsBooking(true);

    try {
      const response = await fetch("/api/dashboard/events/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          vendorId: bookingIntent.vendor.id,
          type: bookingIntent.type,
          estimatedHours,
        }),
      });

      const payload = (await response.json()) as { error?: string; checkout_url?: string; currency?: CurrencyCode; escrow_amount?: number };

      if (!response.ok) {
        throw new Error(payload.error ?? "Booking failed.");
      }

      if (!payload.checkout_url) {
        throw new Error("Stripe checkout link was not created.");
      }

      toast.success(
        `Escrow session ready for ${formatMoney(payload.escrow_amount ?? bookingPreview ?? 0, payload.currency ?? preferredCurrency)}.`
      );
      window.location.assign(payload.checkout_url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking failed.");
      setIsBooking(false);
      return;
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="glass-panel border-white/50 bg-white/80 dark:border-white/10 dark:bg-white/6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
                Planner command center
              </Badge>
              <h2 className="mt-4 font-heading text-4xl leading-none sm:text-5xl">Create a wedding event</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Search across nearby vendors within 50km, check availability overlap, and launch Stripe-hosted escrow checkout for primary and shadow coverage.
              </p>
            </div>
            <div className="hidden rounded-[1.75rem] border border-primary/15 bg-primary/8 p-4 text-right sm:block">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Search radius</div>
              <div className="mt-2 font-heading text-4xl leading-none">{radiusKm}km</div>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSearch}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="event-dates">Event dates</Label>
                <div className="event-datepicker-shell relative rounded-[1.5rem] border border-border bg-background/80 px-4 py-3 shadow-sm">
                  <CalendarRangeIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <DatePicker
                    id="event-dates"
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    onChange={(range) => setDateRange(range)}
                    placeholderText="Choose wedding weekend or event range"
                    className="w-full bg-transparent pl-8 text-sm outline-none"
                    calendarClassName="event-datepicker"
                    dayClassName={() => "event-datepicker__day"}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <GooglePlacesInput
                  value={venueLabel}
                  onValueChange={setVenueLabel}
                  onCoordinatesChange={({ lat, lng }) => {
                    setVenueLat(lat);
                    setVenueLng(lng);
                  }}
                />
              </div>              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="event-budget">Budget</Label>
                  <span className="text-sm font-medium text-foreground/85">{formatMoney(budget, preferredCurrency)}</span>
                </div>
                <input
                  id="event-budget"
                  type="range"
                  min={MIN_EVENT_BUDGET}
                  max={MAX_EVENT_BUDGET}
                  step={1000}
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatMoney(MIN_EVENT_BUDGET, preferredCurrency)}</span>
                  <span>{formatMoney(MAX_EVENT_BUDGET, preferredCurrency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-count">Guest count</Label>
                <Input
                  id="guest-count"
                  type="number"
                  min="1"
                  max="5000"
                  value={guestCount}
                  onChange={(event) => setGuestCount(Number(event.target.value || 0))}
                />
                <p className="text-xs text-muted-foreground">We use party size as a signal for backup urgency and vendor capacity.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Required services</Label>
                <span className="text-xs text-muted-foreground">Matches require every selected service.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EVENT_SERVICES.map((service) => {
                  const active = services.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm capitalize transition",
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background/70 hover:border-primary/25"
                      )}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-background/60 p-4 dark:bg-white/4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Search radius</div>
                  <p className="mt-1 text-xs text-muted-foreground">Default is Lahore-friendly 50km. Expand only if local matches dry up.</p>
                </div>
                <div className="text-lg font-semibold">{radiusKm} km</div>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(event) => setRadiusKm(Number(event.target.value))}
                className="mt-4 h-2 w-full cursor-pointer accent-primary"
              />
            </div>

            <Button type="submit" className="h-12 rounded-full px-6" disabled={isSearching}>
              {isSearching ? <LoaderCircleIcon className="size-4 animate-spin" /> : <SearchIcon className="size-4" />}
              {isSearching ? "Finding top vendors..." : "Find top 5 vendors"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="glass-panel border-white/50 bg-white/80 dark:border-white/10 dark:bg-white/6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Ranked vendor shortlist</div>
                <p className="mt-1 text-sm text-muted-foreground">Ordered by database risk score first, then enriched with cached GPT review analysis in the background.</p>
              </div>
              {hasSearched ? (
                <Badge className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground shadow-none">
                  {matches.length} found
                </Badge>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {isSearching
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-[1.75rem] border border-border bg-background/60 p-5 dark:bg-white/4">
                      <div className="flex gap-4">
                        <div className="size-20 rounded-[1.25rem] bg-muted" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-32 rounded-full bg-muted" />
                          <div className="h-3 w-full rounded-full bg-muted" />
                          <div className="h-3 w-3/4 rounded-full bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))
                : matches.map((vendor) => {
                    const riskInsight = riskInsights[vendor.id];
                    const isRiskLoading = Boolean(loadingRiskIds[vendor.id]);
                    const advancedScore = riskInsight?.finalScore ?? vendor.risk_score * 2;
                    const displayedRate = convertCurrencyAmount(vendor.hourly_rate, vendor.vendor_currency, preferredCurrency);
                    const riskSourceLabel = isRiskLoading
                      ? "AI review running"
                      : riskInsight
                        ? riskInsight.source === "cache"
                          ? "Cached AI scan"
                          : riskInsight.source === "openai"
                            ? "Live AI scan"
                            : "DB fallback"
                        : "Database baseline";

                    return (
                      <div key={vendor.id} className="rounded-[1.75rem] border border-border bg-background/60 p-5 dark:bg-white/4">
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="overflow-hidden rounded-[1.4rem] border border-border bg-muted/40 sm:w-28">
                            {vendor.primary_image_url ? (
                              <Image
                                src={vendor.primary_image_url}
                                alt={vendor.name}
                                width={240}
                                height={240}
                                unoptimized
                                className="h-28 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-28 items-center justify-center bg-secondary/60 font-heading text-3xl text-secondary-foreground">
                                {vendor.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-heading text-3xl leading-none">{vendor.name}</h3>
                                  {vendor.verified ? <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-300" /> : null}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPinIcon className="size-4" />
                                    {vendor.location_label ?? "Location on file"}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <UsersIcon className="size-4" />
                                    {formatDistance(vendor.distance_meters)}
                                  </span>
                                </div>
                              </div>
                              <Badge className={cn("rounded-full px-3 py-1 shadow-none", getRiskScoreTone(vendor.risk_score))}>
                                DB score {vendor.risk_score.toFixed(2)}/5
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {vendor.services.map((service) => (
                                <Badge key={service} className="rounded-full bg-muted px-3 py-1 text-foreground shadow-none capitalize">
                                  {service}
                                </Badge>
                              ))}
                            </div>

                            <div className="grid gap-3 text-sm sm:grid-cols-3">
                              <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
                                <div className="text-muted-foreground">Hourly rate</div>
                                <div className="mt-1 font-semibold">{formatMoney(displayedRate, preferredCurrency)}</div>
                                {vendor.vendor_currency !== preferredCurrency ? (
                                  <div className="mt-1 text-xs text-muted-foreground">Converted from {vendor.vendor_currency}</div>
                                ) : null}
                              </div>
                              <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
                                <div className="text-muted-foreground">Star rating</div>
                                <div className="mt-1 inline-flex items-center gap-1 font-semibold">
                                  <StarIcon className="size-4 fill-current text-amber-500" />
                                  {vendor.rating.toFixed(1)}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
                                <div className="text-muted-foreground">Show rate</div>
                                <div className="mt-1 font-semibold">
                                  {vendor.total_gigs > 0
                                    ? `${Math.max(0, ((vendor.total_gigs - vendor.no_shows) / vendor.total_gigs) * 100).toFixed(0)}%`
                                    : "New vendor"}
                                </div>
                              </div>
                            </div>                            <div className="rounded-[1.5rem] border border-border bg-background/80 p-4 dark:bg-white/6">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="text-sm font-medium">Advanced reliability scan</div>
                                  <p className="mt-1 text-xs text-muted-foreground">GPT review analysis blends with your stored database score and refreshes from cache every 24 hours.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isRiskLoading ? <LoaderCircleIcon className="size-4 animate-spin text-primary" /> : null}
                                  <Badge className={cn("rounded-full px-3 py-1 shadow-none", getAdvancedRiskTone(advancedScore))}>
                                    {advancedScore.toFixed(1)}/10
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs shadow-none">
                                  {riskSourceLabel}
                                </Badge>
                                {riskInsight?.aiScore !== null && riskInsight?.aiScore !== undefined ? (
                                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs shadow-none">
                                    AI {riskInsight.aiScore.toFixed(1)}/10
                                  </Badge>
                                ) : null}
                              </div>

                              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {isRiskLoading
                                  ? "Scanning the most recent written reviews for reliability patterns, no-show mentions, and delivery quality."
                                  : riskInsight?.explanation ??
                                    "Written reviews have not been analyzed yet, so the shortlist is currently showing the database baseline."}
                              </p>

                              {riskInsight?.topRisks.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {riskInsight.topRisks.map((risk) => (
                                    <Badge key={risk} className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
                                      {risk}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <Button
                                type="button"
                                className="rounded-full"
                                onClick={() => {
                                  setEstimatedHours(DEFAULT_EVENT_HOURS);
                                  setBookingIntent({ vendor, type: "primary" });
                                }}
                              >
                                Book Primary
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  setEstimatedHours(DEFAULT_EVENT_HOURS);
                                  setBookingIntent({ vendor, type: "shadow" });
                                }}
                              >
                                Add Shadow
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

              {!isSearching && hasSearched && matches.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-border bg-background/70 p-6 text-sm dark:bg-white/4">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 size-5 text-primary" />
                    <div>
                      <div className="font-medium">No matches inside the current radius.</div>
                      <p className="mt-2 max-w-xl leading-6 text-muted-foreground">
                        Try expanding the search radius beyond {radiusKm}km or send the support team a broaden-search request so we can hunt outside the default zone.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setRadiusKm((current) => Math.min(current + 25, 100))}
                        >
                          Expand radius
                        </Button>
                        <Button type="button" variant="ghost" className="rounded-full" asChild>
                          <a
                            href={`mailto:${supportEmail}?subject=Broaden%20search%20for%20wedding%20event&body=Please%20broaden%20the%20vendor%20search%20for%20my%20current%20event.`}
                          >
                            <MailIcon className="size-4" />
                            Broaden search?
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(bookingIntent)} onOpenChange={(open) => !open && setBookingIntent(null)}>
        <DialogContent className="max-w-lg rounded-[1.75rem] border-white/50 bg-background/95 p-0 dark:border-white/10 dark:bg-[#1b1520]/95">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-3xl">
                {bookingIntent?.type === "primary" ? "Confirm primary booking" : "Confirm shadow booking"}
              </DialogTitle>
              <DialogDescription>
                Launch a Stripe-hosted escrow payment with a 10% platform fee already split from the vendor payout.
              </DialogDescription>
            </DialogHeader>

            {bookingIntent ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 dark:bg-white/4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{bookingIntent.vendor.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatMoney(
                          convertCurrencyAmount(
                            bookingIntent.vendor.hourly_rate,
                            bookingIntent.vendor.vendor_currency,
                            preferredCurrency
                          ),
                          preferredCurrency
                        )} per hour
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge className={cn("rounded-full px-3 py-1 shadow-none", getRiskScoreTone(bookingIntent.vendor.risk_score))}>
                        DB {bookingIntent.vendor.risk_score.toFixed(2)}/5
                      </Badge>
                      <Badge className={cn("rounded-full px-3 py-1 shadow-none", getAdvancedRiskTone(bookingAdvancedScore))}>
                        {bookingRiskLoading ? "Scanning..." : `Advanced ${bookingAdvancedScore.toFixed(1)}/10`}
                      </Badge>
                    </div>
                  </div>
                  {bookingRiskInsight?.explanation ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{bookingRiskInsight.explanation}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-hours">Estimated hours</Label>
                  <Input
                    id="estimated-hours"
                    type="number"
                    min="1"
                    max="24"
                    value={estimatedHours}
                    onChange={(event) => setEstimatedHours(Number(event.target.value || DEFAULT_EVENT_HOURS))}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 dark:bg-white/4">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Base spend</div>
                    <div className="mt-2 text-xl font-semibold">
                      {formatMoney((bookingPreview ?? 0) / 1.1, preferredCurrency)}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-primary/20 bg-primary/8 p-4 dark:border-primary/15 dark:bg-primary/10">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Escrow total</div>
                    <div className="mt-2 text-xl font-semibold">{formatMoney(bookingPreview ?? 0, preferredCurrency)}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="rounded-b-[1.75rem] bg-muted/40 dark:bg-white/4" showCloseButton>
            <Button onClick={handleBookingConfirm} className="rounded-full" disabled={isBooking || !bookingIntent}>
              {isBooking ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
              {isBooking ? "Opening checkout..." : "Continue to payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}