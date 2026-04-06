import type { CurrencyCode } from "@/lib/auth-types";
import { convertCurrencyAmount, formatMoney } from "@/lib/currency";

export type TimelineStep = "planning" | "booked" | "event_day" | "cancelled";

export type EventTimelineBooking = {
  id: string;
  vendorId: string;
  vendorName: string;
  type: "primary" | "shadow";
  status: string;
  estimatedHours: number;
  escrowAmount: number;
  displayEscrowAmount: number;
  currency: CurrencyCode;
  refundAmount: number;
  refundPercentage: number;
  refundStatus: string;
  createdAt: string;
  canceledAt: string | null;
};

export type PlannerEventTimeline = {
  eventId: string;
  venueLabel: string;
  startDate: string;
  endDate: string;
  services: string[];
  guestCount: number;
  searchRadiusKm: number;
  step: TimelineStep;
  bookings: EventTimelineBooking[];
};

export function deriveTimelineStep(input: { startDate: string; endDate: string; bookings: Array<{ status: string }> }) {
  if (input.bookings.length > 0 && input.bookings.every((booking) => booking.status === "cancelled")) {
    return "cancelled" satisfies TimelineStep;
  }

  const today = new Date();
  const start = new Date(`${input.startDate}T00:00:00.000Z`);
  const end = new Date(`${input.endDate}T23:59:59.999Z`);

  if (today >= start && today <= end) {
    return "event_day" satisfies TimelineStep;
  }

  if (input.bookings.some((booking) => booking.status === "paid" || booking.status === "confirmed")) {
    return "booked" satisfies TimelineStep;
  }

  return "planning" satisfies TimelineStep;
}

export function formatEventDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const format: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

  if (startDate === endDate) {
    return start.toLocaleDateString("en-US", format);
  }

  return `${start.toLocaleDateString("en-US", format)} - ${end.toLocaleDateString("en-US", format)}`;
}

export function getRefundPolicy(startDate: string, escrowAmount: number) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const now = Date.now();
  const hoursUntilEvent = (start - now) / (1000 * 60 * 60);
  const percentage = hoursUntilEvent > 48 ? 80 : 0;
  const refundAmount = Number((escrowAmount * (percentage / 100)).toFixed(2));

  return {
    hoursUntilEvent,
    percentage,
    refundAmount,
  };
}

export function describeTimelineStep(step: TimelineStep) {
  switch (step) {
    case "booked":
      return "Backup coverage is locked and paid.";
    case "event_day":
      return "Today is the live event window. Keep shadows on standby.";
    case "cancelled":
      return "This event currently has only cancelled bookings.";
    default:
      return "Build the plan, shortlist vendors, and secure your backups.";
  }
}

export function formatBookingEscrowLabel(amount: number, sourceCurrency: CurrencyCode, preferredCurrency: CurrencyCode) {
  const converted = convertCurrencyAmount(amount, sourceCurrency, preferredCurrency);
  return formatMoney(converted, preferredCurrency);
}