import { describe, expect, it } from "vitest";

import { calculateEscrowAmount } from "@/lib/events/utils";
import { EventValidationError, parseEventSearchPayload } from "@/lib/events/validation";

describe("event utils", () => {
  it("calculates escrow with a 10 percent premium", () => {
    expect(calculateEscrowAmount(250, 8)).toBe(2200);
  });

  it("validates and normalizes event search payloads", () => {
    expect(
      parseEventSearchPayload({
        startDate: "2026-05-01",
        endDate: "2026-05-03",
        venueLabel: "Lahore Fort",
        venueLat: 31.5889,
        venueLng: 74.3094,
        budget: 18000,
        guestCount: 220,
        radiusKm: 50,
        services: ["mehndi", "photog", "photog"],
      })
    ).toMatchObject({
      services: ["mehndi", "photog"],
      budget: 18000,
      guestCount: 220,
    });
  });

  it("rejects empty services", () => {
    expect(() =>
      parseEventSearchPayload({
        startDate: "2026-05-01",
        endDate: "2026-05-03",
        venueLabel: "Lahore Fort",
        venueLat: 31.5889,
        venueLng: 74.3094,
        budget: 18000,
        guestCount: 220,
        radiusKm: 50,
        services: [],
      })
    ).toThrow(EventValidationError);
  });
});