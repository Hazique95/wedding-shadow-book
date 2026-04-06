import type { CurrencyCode } from "@/lib/auth-types";
import type { PlannerEventTimeline } from "@/lib/events/timeline";
import { VENDOR_SERVICES, type VendorService } from "@/lib/vendor/types";

export const EVENT_SERVICES = VENDOR_SERVICES;
export const MIN_EVENT_BUDGET = 1000;
export const MAX_EVENT_BUDGET = 100000;
export const DEFAULT_EVENT_BUDGET = 25000;
export const DEFAULT_EVENT_RADIUS_KM = 50;
export const DEFAULT_EVENT_HOURS = 6;

export type EventSearchFormValues = {
  startDate: string;
  endDate: string;
  venueLabel: string;
  venueLat: number;
  venueLng: number;
  budget: number;
  services: VendorService[];
  guestCount: number;
  radiusKm: number;
};

export type VendorMatchRecord = {
  id: string;
  name: string;
  services: VendorService[];
  rating: number;
  no_shows: number;
  total_gigs: number;
  location_label: string | null;
  hourly_rate: number;
  primary_image_url: string | null;
  portfolio_url: string[];
  verified: boolean;
  distance_meters: number;
  risk_score: number;
  vendor_currency: CurrencyCode;
};

export type MatchEventsResponse = {
  eventId: string;
  matches: VendorMatchRecord[];
  cached: boolean;
};

export type BookingType = "primary" | "shadow";
export type BookingStatus = "pending" | "paid" | "confirmed" | "payment_failed" | "cancelled";

export type CreateBookingPayload = {
  eventId: string;
  vendorId: string;
  type: BookingType;
  estimatedHours: number;
};

export type BookingResponse = {
  id: string;
  status: BookingStatus;
  escrow_amount: number;
  currency: CurrencyCode;
  checkout_url?: string;
  session_id?: string;
};

export type BookingCancelResponse = {
  bookingId: string;
  status: BookingStatus;
  refundAmount: number;
  refundPercentage: number;
  refundStatus: "none" | "pending" | "succeeded" | "failed";
};

export type EventsDashboardInitialData = {
  currentTimeline: PlannerEventTimeline | null;
  userId: string;
};