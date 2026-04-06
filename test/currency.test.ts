import { describe, expect, it } from "vitest";

import { calculateApplicationFee, calculateVendorPayout, convertCurrencyAmount, toMinorUnit } from "@/lib/currency";

describe("currency helpers", () => {
  it("converts between USD and PKR", () => {
    expect(convertCurrencyAmount(100, "USD", "PKR")).toBeGreaterThan(100);
    expect(convertCurrencyAmount(28000, "PKR", "USD")).toBeGreaterThan(0);
  });

  it("calculates the platform fee and vendor payout split", () => {
    expect(calculateApplicationFee(1100)).toBe(110);
    expect(calculateVendorPayout(1100)).toBe(990);
  });

  it("converts to Stripe minor units", () => {
    expect(toMinorUnit(12.5, "USD")).toBe(1250);
    expect(toMinorUnit(12.5, "PKR")).toBe(1250);
  });
});