import type { createClient as createServerClient } from "@/lib/supabase/server";
import { captureServerException } from "@/lib/monitoring/sentry";
import {
  consumeVendorRiskRateLimit,
  getCachedVendorRiskAnalysis,
  setCachedVendorRiskAnalysis,
  type VendorRiskRateLimitState,
} from "@/lib/risk/cache";
import { analyzeVendorReviewsWithOpenAI, isOpenAIRateLimitError } from "@/lib/risk/openai";
import type {
  VendorReviewRecord,
  VendorRiskAiAnalysis,
  VendorRiskAnalysisResponse,
  VendorRiskContext,
  VendorRiskFallbackReason,
  VendorRiskVendorRecord,
} from "@/lib/risk/types";
import {
  averageStoredSentiment,
  blendRiskScores,
  buildRiskCacheKey,
  calculateDatabaseRiskScore,
  deriveDatabaseRiskFlags,
  scaleDatabaseRiskScore,
} from "@/lib/risk/utils";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

type GetVendorRiskAnalysisOptions = {
  supabase: ServerSupabaseClient;
  vendorId: string;
  actorKey: string;
  dailyLimit?: number;
  analyzer?: (reviews: VendorReviewRecord[]) => Promise<VendorRiskAiAnalysis>;
  reporter?: (error: unknown, context?: Record<string, unknown>) => Promise<void>;
  getCached?: (cacheKey: string) => Promise<VendorRiskAnalysisResponse | null>;
  setCached?: (cacheKey: string, analysis: VendorRiskAnalysisResponse) => Promise<void>;
  consumeRateLimit?: (identifier: string, limit?: number) => Promise<VendorRiskRateLimitState>;
};

export class VendorRiskServiceError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "VendorRiskServiceError";
    this.status = status;
  }
}

function buildFallbackExplanation(reason: VendorRiskFallbackReason, reviewCount: number) {
  switch (reason) {
    case "free_tier_limit":
      return "The AI review quota is tapped out for today, so this score is temporarily using booking history only.";
    case "openai_rate_limited":
      return "The AI reviewer is rate-limited right now, so this score is temporarily using booking history only.";
    case "openai_error":
      return "The AI review scan is temporarily unavailable, so this score is using booking history only.";
    case "no_reviews":
      return reviewCount
        ? "Written reviews are too limited to analyze right now, so this score is using booking history only."
        : "No recent written reviews are available yet, so this score is using booking history only.";
    default:
      return "This score is using booking history only.";
  }
}

function buildFallbackAnalysis(context: VendorRiskContext, reason: VendorRiskFallbackReason, cached = false) {
  const dbScore = calculateDatabaseRiskScore(
    context.vendor.rating,
    context.vendor.total_gigs,
    context.vendor.no_shows
  );
  const dbScore10 = scaleDatabaseRiskScore(dbScore);

  return {
    vendorId: context.vendor.id,
    vendorName: context.vendor.name,
    dbScore,
    dbScore10,
    aiScore: null,
    finalScore: dbScore10,
    explanation: buildFallbackExplanation(reason, context.reviews.length),
    topRisks: deriveDatabaseRiskFlags(context.vendor),
    reviewCount: context.reviews.length,
    averageStoredSentiment: averageStoredSentiment(context.reviews),
    source: "db_fallback",
    cached,
    fallbackReason: reason,
    rateLimit: context.rateLimit,
  } satisfies VendorRiskAnalysisResponse;
}

async function fetchVendorRiskContext(supabase: ServerSupabaseClient, vendorId: string) {
  const { data: vendorRow, error: vendorError } = await supabase
    .from("vendors")
    .select("id, name, rating, no_shows, total_gigs")
    .eq("id", vendorId)
    .single();

  if (vendorError || !vendorRow) {
    throw new VendorRiskServiceError("Vendor not found.", 404);
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("vendor_reviews")
    .select("id, vendor_id, text, date, sentiment")
    .eq("vendor_id", vendorId)
    .order("date", { ascending: false })
    .limit(10);

  if (reviewError) {
    throw new VendorRiskServiceError(reviewError.message, 500);
  }

  return {
    vendor: {
      id: vendorRow.id,
      name: vendorRow.name,
      rating: Number(vendorRow.rating),
      no_shows: Number(vendorRow.no_shows),
      total_gigs: Number(vendorRow.total_gigs),
    } satisfies VendorRiskVendorRecord,
    reviews: (reviewRows ?? []).map(
      (review) =>
        ({
          id: review.id,
          vendor_id: review.vendor_id,
          text: review.text,
          date: review.date,
          sentiment: Number(review.sentiment),
        }) satisfies VendorReviewRecord
    ),
  };
}

export async function buildVendorRiskAnalysisFromContext(
  context: VendorRiskContext,
  options: Pick<GetVendorRiskAnalysisOptions, "analyzer" | "reporter"> = {}
) {
  if (!context.reviews.length) {
    return buildFallbackAnalysis(context, "no_reviews");
  }

  const analyzer = options.analyzer ?? analyzeVendorReviewsWithOpenAI;
  const reporter = options.reporter ?? captureServerException;

  try {
    const aiAnalysis = await analyzer(context.reviews);
    const dbScore = calculateDatabaseRiskScore(
      context.vendor.rating,
      context.vendor.total_gigs,
      context.vendor.no_shows
    );

    return {
      vendorId: context.vendor.id,
      vendorName: context.vendor.name,
      dbScore,
      dbScore10: scaleDatabaseRiskScore(dbScore),
      aiScore: aiAnalysis.aiScore,
      finalScore: blendRiskScores(dbScore, aiAnalysis.aiScore),
      explanation: aiAnalysis.explanation,
      topRisks: aiAnalysis.topRisks,
      reviewCount: context.reviews.length,
      averageStoredSentiment: averageStoredSentiment(context.reviews),
      source: "openai",
      cached: false,
      fallbackReason: null,
      rateLimit: context.rateLimit,
    } satisfies VendorRiskAnalysisResponse;
  } catch (error) {
    await reporter(error, {
      vendorId: context.vendor.id,
      vendorName: context.vendor.name,
      reviewCount: context.reviews.length,
    });

    return buildFallbackAnalysis(context, isOpenAIRateLimitError(error) ? "openai_rate_limited" : "openai_error");
  }
}

export async function getVendorRiskAnalysis({
  supabase,
  vendorId,
  actorKey,
  dailyLimit = Number(process.env.RISK_ANALYSIS_DAILY_LIMIT ?? 100),
  analyzer,
  reporter,
  getCached = getCachedVendorRiskAnalysis,
  setCached = setCachedVendorRiskAnalysis,
  consumeRateLimit = consumeVendorRiskRateLimit,
}: GetVendorRiskAnalysisOptions) {
  const cacheKey = buildRiskCacheKey(vendorId);
  const cachedAnalysis = await getCached(cacheKey);

  if (cachedAnalysis) {
    return {
      ...cachedAnalysis,
      source: "cache",
      cached: true,
    } satisfies VendorRiskAnalysisResponse;
  }

  const contextWithoutRateLimit = await fetchVendorRiskContext(supabase, vendorId);

  if (!contextWithoutRateLimit.reviews.length) {
    const analysis = buildFallbackAnalysis(
      {
        ...contextWithoutRateLimit,
        rateLimit: {
          limit: dailyLimit,
          remaining: dailyLimit,
          resetAt: new Date().toISOString(),
        },
      },
      "no_reviews"
    );
    await setCached(cacheKey, analysis);
    return analysis;
  }

  const rateLimit = await consumeRateLimit(actorKey, dailyLimit);
  const context = {
    ...contextWithoutRateLimit,
    rateLimit,
  } satisfies VendorRiskContext;

  if (!rateLimit.allowed) {
    return buildFallbackAnalysis(context, "free_tier_limit");
  }

  const analysis = await buildVendorRiskAnalysisFromContext(context, {
    analyzer,
    reporter,
  });

  if (analysis.source === "openai" || analysis.fallbackReason === "no_reviews") {
    await setCached(cacheKey, analysis);
  }

  return analysis;
}