import {
  DEFAULT_EVENT_HOURS,
  type EventSearchFormValues,
  type VendorMatchRecord,
} from "@/lib/events/types";
import type { VendorService } from "@/lib/vendor/types";

export function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateEscrowAmount(hourlyRate: number, estimatedHours = DEFAULT_EVENT_HOURS) {
  return Number((hourlyRate * estimatedHours * 1.1).toFixed(2));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount);
}

export function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}

function hashString(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

export function buildEventMatchCacheKey(values: EventSearchFormValues) {
  const normalized = {
    ...values,
    services: [...values.services].sort(),
  };

  return `events:match:${hashString(JSON.stringify(normalized))}`;
}

export function normalizeVendorMatch(raw: {
  id: string;
  name: string;
  services: unknown;
  rating: number | string;
  no_shows: number | string;
  total_gigs: number | string;
  location_label: string | null;
  hourly_rate: number | string;
  primary_image_url: string | null;
  portfolio_url: string[] | null;
  verified: boolean;
  distance_meters: number | string;
  risk_score: number | string;
}): VendorMatchRecord {
  const services = Array.isArray(raw.services)
    ? raw.services.filter((value): value is VendorService => typeof value === "string")
    : [];

  return {
    id: raw.id,
    name: raw.name,
    services,
    rating: Number(raw.rating),
    no_shows: Number(raw.no_shows),
    total_gigs: Number(raw.total_gigs),
    location_label: raw.location_label,
    hourly_rate: Number(raw.hourly_rate),
    primary_image_url: raw.primary_image_url,
    portfolio_url: raw.portfolio_url ?? [],
    verified: raw.verified,
    distance_meters: Number(raw.distance_meters),
    risk_score: Number(raw.risk_score),
  };
}

export function getRiskScoreTone(score: number) {
  return score >= 4.5
    ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
    : "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200";
}

export function getAdvancedRiskTone(score: number) {
  if (score >= 8) {
    return "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200";
  }

  if (score >= 6) {
    return "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200";
  }

  return "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200";
}