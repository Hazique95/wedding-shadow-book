import { describe, expect, it } from "vitest";

import { deriveTimelineStep, getRefundPolicy } from "@/lib/events/timeline";
import { getNotificationRetryDelayMinutes } from "@/lib/notifications/retry";

describe("notification retry backoff", () => {
  it("backs off exponentially", () => {
    expect(getNotificationRetryDelayMinutes(1)).toBe(5);
    expect(getNotificationRetryDelayMinutes(2)).toBe(10);
    expect(getNotificationRetryDelayMinutes(3)).toBe(20);
  });
});

describe("event timeline helpers", () => {
  it("returns booked when a paid booking exists before the event", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const futureEnd = new Date(future);
    futureEnd.setDate(future.getDate() + 1);

    expect(
      deriveTimelineStep({
        startDate: future.toISOString().slice(0, 10),
        endDate: futureEnd.toISOString().slice(0, 10),
        bookings: [{ status: "paid" }],
      })
    ).toBe("booked");
  });

  it("keeps refunds within expected bounds", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const refund = getRefundPolicy(future.toISOString().slice(0, 10), 1000);

    expect(refund.percentage).toBe(80);
    expect(refund.refundAmount).toBe(800);
  });
});