import { Redis } from "@upstash/redis";

import type { VendorRiskAnalysisResponse, VendorRiskRateLimit } from "@/lib/risk/types";

const RISK_CACHE_TTL_SECONDS = 60 * 60 * 24;

type VendorRiskRateLimitState = VendorRiskRateLimit & {
  allowed: boolean;
};

type LocalRiskCacheEntry = {
  expiresAt: number;
  value: VendorRiskAnalysisResponse;
};

type LocalRateLimitEntry = {
  count: number;
  resetAt: number;
};

let redisClient: Redis | null | undefined;
const localRiskCache = new Map<string, LocalRiskCacheEntry>();
const localRateLimitCache = new Map<string, LocalRateLimitEntry>();

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getRateLimitWindow(now = new Date()) {
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return {
    dateKey: now.toISOString().slice(0, 10),
    resetAt,
    ttlSeconds: Math.max(60, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function getCachedVendorRiskAnalysis(cacheKey: string) {
  const redis = getRedisClient();

  if (redis) {
    try {
      return await redis.get<VendorRiskAnalysisResponse>(cacheKey);
    } catch {
      // Fall back to in-memory cache if Redis is unavailable.
    }
  }

  const entry = localRiskCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    localRiskCache.delete(cacheKey);
    return null;
  }

  return entry.value;
}

export async function setCachedVendorRiskAnalysis(cacheKey: string, analysis: VendorRiskAnalysisResponse) {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.set(cacheKey, analysis, { ex: RISK_CACHE_TTL_SECONDS });
      return;
    } catch {
      // Keep moving if Redis writes fail.
    }
  }

  localRiskCache.set(cacheKey, {
    value: analysis,
    expiresAt: Date.now() + RISK_CACHE_TTL_SECONDS * 1000,
  });
}

export async function consumeVendorRiskRateLimit(identifier: string, limit = 100) {
  const redis = getRedisClient();
  const window = getRateLimitWindow();
  const key = `risk:limit:${identifier}:${window.dateKey}`;

  if (redis) {
    try {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, window.ttlSeconds);
      }

      return {
        allowed: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        resetAt: window.resetAt.toISOString(),
      } satisfies VendorRiskRateLimitState;
    } catch {
      // Fall back to in-memory rate limiting if Redis is unavailable.
    }
  }

  const localEntry = localRateLimitCache.get(key);
  const now = Date.now();
  const nextCount = localEntry && localEntry.resetAt > now ? localEntry.count + 1 : 1;

  localRateLimitCache.set(key, {
    count: nextCount,
    resetAt: window.resetAt.getTime(),
  });

  return {
    allowed: nextCount <= limit,
    limit,
    remaining: Math.max(0, limit - nextCount),
    resetAt: window.resetAt.toISOString(),
  } satisfies VendorRiskRateLimitState;
}

export type { VendorRiskRateLimitState };