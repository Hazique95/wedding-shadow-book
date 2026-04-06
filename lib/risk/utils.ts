import type { VendorReviewRecord, VendorRiskVendorRecord } from "@/lib/risk/types";

const MIN_SCORE = 0;
const MAX_DB_SCORE = 5;
const MAX_FINAL_SCORE = 10;

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

export function calculateDatabaseRiskScore(rating: number, totalGigs: number, noShows: number) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const safeTotalGigs = Number.isFinite(totalGigs) ? totalGigs : 0;
  const safeNoShows = Number.isFinite(noShows) ? noShows : 0;
  const safeGigDenominator = Math.max(safeTotalGigs, 1);

  const rawScore =
    ((safeRating / 5) * 0.5 +
      (Math.max(safeTotalGigs - safeNoShows, 0) / safeGigDenominator) * 0.3 +
      (1 - safeNoShows / safeGigDenominator) * 0.2) *
    5;

  return roundTo(clampNumber(rawScore, MIN_SCORE, MAX_DB_SCORE));
}

export function scaleDatabaseRiskScore(dbScore: number) {
  return roundTo(clampNumber(dbScore, MIN_SCORE, MAX_DB_SCORE) * 2);
}

export function blendRiskScores(dbScore: number, aiScore: number) {
  const normalizedDbScore = scaleDatabaseRiskScore(dbScore);
  const normalizedAiScore = clampNumber(aiScore, MIN_SCORE, MAX_FINAL_SCORE);

  return roundTo(clampNumber(normalizedDbScore * 0.7 + normalizedAiScore * 0.3, MIN_SCORE, MAX_FINAL_SCORE));
}

export function averageStoredSentiment(reviews: VendorReviewRecord[]) {
  if (!reviews.length) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + review.sentiment, 0);
  return roundTo(total / reviews.length, 3);
}

export function buildRiskCacheKey(vendorId: string) {
  return `risk:vendor:${vendorId}`;
}

export function deriveDatabaseRiskFlags(vendor: VendorRiskVendorRecord) {
  const risks: string[] = [];

  if (vendor.total_gigs === 0) {
    risks.push("No completed gig history yet.");
  }

  if (vendor.no_shows > 0) {
    const gigLabel = vendor.total_gigs === 1 ? "gig" : "gigs";
    const noShowLabel = vendor.no_shows === 1 ? "no-show" : "no-shows";
    risks.push(`${vendor.no_shows} recorded ${noShowLabel} across ${Math.max(vendor.total_gigs, 1)} ${gigLabel}.`);
  }

  if (vendor.rating < 4.5) {
    risks.push(`Average rating is ${vendor.rating.toFixed(1)}/5, below the strongest vendors on the platform.`);
  }

  if (!risks.length) {
    risks.push("Historical booking data looks stable, but AI review analysis is currently unavailable.");
  }

  return risks.slice(0, 3);
}