import { Badge } from "@/components/ui/badge";
import type { CurrencyCode } from "@/lib/auth-types";
import type { PlannerEventTimeline, TimelineStep } from "@/lib/events/timeline";
import { describeTimelineStep, formatBookingEscrowLabel, formatEventDateRange, getRefundPolicy } from "@/lib/events/timeline";
import { cn } from "@/lib/utils";

const STEPS: TimelineStep[] = ["planning", "booked", "event_day"];

const STEP_LABELS: Record<TimelineStep, string> = {
  planning: "Planning",
  booked: "Booked",
  event_day: "Event day",
  cancelled: "Cancelled",
};

export function EventTimelineStepper({
  timeline,
  preferredCurrency,
  onCancelBooking,
  cancelingBookingId,
}: {
  timeline: PlannerEventTimeline;
  preferredCurrency: CurrencyCode;
  onCancelBooking?: (bookingId: string) => void;
  cancelingBookingId?: string | null;
}) {
  const activeStepIndex = timeline.step === "cancelled" ? 0 : STEPS.indexOf(timeline.step);

  return (
    <div className="space-y-5 rounded-[1.75rem] border border-border bg-background/70 p-5 dark:bg-white/4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-medium">Event timeline</div>
          <h3 className="mt-2 font-heading text-3xl leading-none">{timeline.venueLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {formatEventDateRange(timeline.startDate, timeline.endDate)}. {describeTimelineStep(timeline.step)}
          </p>
        </div>
        <Badge className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground shadow-none">
          {STEP_LABELS[timeline.step]}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const active = index <= activeStepIndex;
          return (
            <div
              key={step}
              className={cn(
                "rounded-2xl border px-4 py-4 transition",
                active ? "border-primary/40 bg-primary/8" : "border-border bg-background/80 dark:bg-white/6"
              )}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Step {index + 1}</div>
              <div className="mt-2 font-medium">{STEP_LABELS[step]}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Services</div>
          <div className="mt-2 text-sm capitalize text-foreground/85">{timeline.services.join(", ")}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Guests</div>
          <div className="mt-2 text-sm text-foreground/85">{timeline.guestCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Radius</div>
          <div className="mt-2 text-sm text-foreground/85">{timeline.searchRadiusKm} km</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Booking ledger</div>
        {timeline.bookings.length ? (
          timeline.bookings.map((booking) => {
            const refundPolicy = getRefundPolicy(timeline.startDate, booking.escrowAmount);
            return (
              <div key={booking.id} className="rounded-2xl border border-border bg-background/80 p-4 dark:bg-white/6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-medium capitalize">
                      {booking.type} - {booking.vendorName}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.status} • {formatBookingEscrowLabel(booking.escrowAmount, booking.currency, preferredCurrency)} escrow
                    </p>
                    {booking.refundStatus !== "none" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Refund {booking.refundStatus}: {formatBookingEscrowLabel(booking.refundAmount, booking.currency, preferredCurrency)}
                      </p>
                    ) : null}
                  </div>
                  {onCancelBooking && booking.status !== "cancelled" ? (
                    <button
                      type="button"
                      className="rounded-full border border-rose-300/50 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-200"
                      onClick={() => onCancelBooking(booking.id)}
                      disabled={cancelingBookingId === booking.id}
                    >
                      {cancelingBookingId === booking.id ? "Cancelling..." : `Cancel${refundPolicy.percentage ? ` (${refundPolicy.percentage}% refund)` : ""}`}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground dark:bg-white/4">
            No bookings yet. Secure a primary or shadow vendor to move this event into the booked phase.
          </div>
        )}
      </div>
    </div>
  );
}