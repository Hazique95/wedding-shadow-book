import { Redis } from "@upstash/redis";

import type { VendorMatchRecord } from "@/lib/events/types";

let redisClient: Redis | null | undefined;

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

export async function getCachedVendorMatches(cacheKey: string) {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    return await redis.get<VendorMatchRecord[]>(cacheKey);
  } catch {
    return null;
  }
}

export async function setCachedVendorMatches(cacheKey: string, matches: VendorMatchRecord[]) {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(cacheKey, matches, { ex: 300 });
  } catch {
    // Cache failures should never block booking flow.
  }
}