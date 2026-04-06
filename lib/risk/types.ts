export type VendorRiskSource = "openai" | "cache" | "db_fallback";

export type VendorRiskFallbackReason =
  | "free_tier_limit"
  | "openai_error"
  | "openai_rate_limited"
  | "no_reviews"
  | null;

export type VendorReviewRecord = {
  id: string;
  vendor_id: string;
  text: string;
  date: string;
  sentiment: number;
};

export type VendorRiskVendorRecord = {
  id: string;
  name: string;
  rating: number;
  no_shows: number;
  total_gigs: number;
};

export type VendorRiskRateLimit = {
  limit: number;
  remaining: number;
  resetAt: string;
};

export type VendorRiskAiAnalysis = {
  aiScore: number;
  explanation: string;
  topRisks: string[];
};

export type VendorRiskAnalysisResponse = {
  vendorId: string;
  vendorName: string;
  dbScore: number;
  dbScore10: number;
  aiScore: number | null;
  finalScore: number;
  explanation: string;
  topRisks: string[];
  reviewCount: number;
  averageStoredSentiment: number | null;
  source: VendorRiskSource;
  cached: boolean;
  fallbackReason: VendorRiskFallbackReason;
  rateLimit: VendorRiskRateLimit;
};

export type VendorRiskContext = {
  vendor: VendorRiskVendorRecord;
  reviews: VendorReviewRecord[];
  rateLimit: VendorRiskRateLimit;
};