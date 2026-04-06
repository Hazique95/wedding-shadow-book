import {
  DEFAULT_EVENT_RADIUS_KM,
  MAX_EVENT_BUDGET,
  MIN_EVENT_BUDGET,
  type BookingType,
  type CreateBookingPayload,
  type EventSearchFormValues,
} from "@/lib/events/types";
import { EVENT_SERVICES } from "@/lib/events/types";
import type { VendorService } from "@/lib/vendor/types";

export class EventValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EventValidationError";
    this.status = status;
  }
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeServices(value: unknown) {
  if (!Array.isArray(value)) {
    throw new EventValidationError("Choose at least one service.");
  }

  const normalized = value.filter(
    (entry): entry is VendorService => typeof entry === "string" && EVENT_SERVICES.includes(entry as VendorService)
  );

  if (!normalized.length) {
    throw new EventValidationError("Choose at least one service.");
  }

  return [...new Set(normalized)];
}

function normalizeNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new EventValidationError("A required number is missing.");
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new EventValidationError("One of the number fields is invalid.");
  }

  return parsed;
}

export function parseEventSearchPayload(body: unknown): EventSearchFormValues {
  if (!body || typeof body !== "object") {
    throw new EventValidationError("Invalid event request payload.");
  }

  const payload = body as Record<string, unknown>;
  const startDate = payload.startDate;
  const endDate = payload.endDate;

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new EventValidationError("Select a valid event date range.");
  }

  if (new Date(startDate) > new Date(endDate)) {
    throw new EventValidationError("The event end date must be on or after the start date.");
  }

  const venueLabel = typeof payload.venueLabel === "string" ? payload.venueLabel.trim() : "";
  const venueLat = normalizeNumber(payload.venueLat);
  const venueLng = normalizeNumber(payload.venueLng);
  const budget = normalizeNumber(payload.budget);
  const guestCount = normalizeNumber(payload.guestCount);
  const radiusKm = normalizeNumber(payload.radiusKm, DEFAULT_EVENT_RADIUS_KM);

  if (!venueLabel) {
    throw new EventValidationError("Choose a venue from Google Places so exact coordinates are captured.");
  }

  if (budget < MIN_EVENT_BUDGET || budget > MAX_EVENT_BUDGET) {
    throw new EventValidationError(`Budget must stay between ${MIN_EVENT_BUDGET} and ${MAX_EVENT_BUDGET}.`);
  }

  if (guestCount < 1 || guestCount > 5000) {
    throw new EventValidationError("Guest count must be between 1 and 5000.");
  }

  if (radiusKm < 5 || radiusKm > 150) {
    throw new EventValidationError("Search radius must stay between 5km and 150km.");
  }

  return {
    startDate,
    endDate,
    venueLabel,
    venueLat,
    venueLng,
    budget,
    guestCount,
    radiusKm,
    services: normalizeServices(payload.services),
  };
}

export function parseBookingPayload(body: unknown): CreateBookingPayload {
  if (!body || typeof body !== "object") {
    throw new EventValidationError("Invalid booking request payload.");
  }

  const payload = body as Record<string, unknown>;
  const eventId = typeof payload.eventId === "string" ? payload.eventId : "";
  const vendorId = typeof payload.vendorId === "string" ? payload.vendorId : "";
  const type = payload.type as BookingType;
  const estimatedHours = normalizeNumber(payload.estimatedHours);

  if (!eventId || !vendorId) {
    throw new EventValidationError("Event and vendor are required.");
  }

  if (type !== "primary" && type !== "shadow") {
    throw new EventValidationError("Booking type must be primary or shadow.");
  }

  if (estimatedHours < 1 || estimatedHours > 24) {
    throw new EventValidationError("Estimated hours must stay between 1 and 24.");
  }

  return {
    eventId,
    vendorId,
    type,
    estimatedHours,
  };
}