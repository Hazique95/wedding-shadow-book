import { describe, expect, it, vi } from "vitest";

import { buildVendorRiskAnalysisFromContext } from "@/lib/risk/service";
import type { VendorRiskContext } from "@/lib/risk/types";

const baseContext: VendorRiskContext = {
  vendor: {
    id: "vendor-1",
    name: "Royal Caterers",
    rating: 4.7,
    no_shows: 1,
    total_gigs: 25,
  },
  reviews: [
    {
      id: "review-1",
      vendor_id: "vendor-1",
      text: "They arrived on time, handled a last-minute seating change calmly, and the food quality stayed excellent.",
      date: "2026-03-14",
      sentiment: 0.92,
    },
    {
      id: "review-2",
      vendor_id: "vendor-1",
      text: "Setup was smooth, but they were slow to respond during the final planning week.",
      date: "2026-03-10",
      sentiment: 0.44,
    },
  ],
  rateLimit: {
    limit: 100,
    remaining: 99,
    resetAt: "2026-04-07T00:00:00.000Z",
  },
};

describe("vendor risk service", () => {
  it("blends AI and database scores into a 0-10 range", async () => {
    const analyzer = vi.fn().mockResolvedValue({
      aiScore: 8.8,
      explanation: "Reviews suggest a reliable team with strong delivery quality and only minor communication risk.",
      topRisks: ["Reply speed can slow down close to the event date."],
    });

    const result = await buildVendorRiskAnalysisFromContext(baseContext, {
      analyzer,
      reporter: vi.fn().mockResolvedValue(undefined),
    });

    expect(result.source).toBe("openai");
    expect(result.aiScore).toBe(8.8);
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalScore).toBeLessThanOrEqual(10);
    expect(analyzer).toHaveBeenCalledTimes(1);
  });

  it("falls back to the database score when the AI analyzer is rate-limited", async () => {
    const reporter = vi.fn().mockResolvedValue(undefined);
    const analyzer = vi.fn().mockRejectedValue({ status: 429 });

    const result = await buildVendorRiskAnalysisFromContext(baseContext, {
      analyzer,
      reporter,
    });

    expect(result.source).toBe("db_fallback");
    expect(result.fallbackReason).toBe("openai_rate_limited");
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
    expect(result.finalScore).toBeLessThanOrEqual(10);
    expect(reporter).toHaveBeenCalledTimes(1);
  });
});