import "server-only";

import { getApiBase } from "./api-base";
import { BffHttpError } from "./body";
import { hashRateLimitSubject } from "./identity";
import type { BffPolicy, RateLimitScope } from "./policies";
import type { BffRequestContext } from "./request-context";

interface Decision {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface LocalBucket {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as typeof globalThis & {
  aalieFallbackLimiter?: Map<string, LocalBucket>;
};
const fallbackBuckets = (globalForLimiter.aalieFallbackLimiter ??= new Map());

const DEFAULTS: Record<RateLimitScope, [number, number]> = {
  parse: [120, 300],
  analysis: [30, 120],
  trace: [10, 40],
  quiz: [20, 60],
  export_text: [10, 30],
  export_pdf: [2, 8],
  llm: [5, 20],
};

function enabled(): boolean {
  return !["0", "false", "off", "no"].includes(
    (process.env.AALIE_RATE_LIMITS_ENABLED ?? "true").trim().toLowerCase(),
  );
}

function fallbackDecision(
  scope: RateLimitScope,
  subjectHash: string,
  authenticated: boolean,
): Decision {
  const now = Date.now();
  const key = `${scope}:${subjectHash}:${authenticated ? "auth" : "anon"}`;
  const configured = DEFAULTS[scope][authenticated ? 1 : 0];
  const limit = Math.max(1, Math.floor(configured / 2));
  const existing = fallbackBuckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : existing;
  bucket.count += 1;
  fallbackBuckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: bucket.count > limit ? Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) : 0,
  };
}

export async function enforceRateLimit(
  context: BffRequestContext,
  policy: BffPolicy,
): Promise<Decision> {
  if (!enabled()) return { allowed: true, retryAfterSeconds: 0 };
  const subjectHash = hashRateLimitSubject(context.subject);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_500);
  try {
    const response = await fetch(`${getApiBase()}/internal/rate-limits/check`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": context.requestId },
      body: JSON.stringify({
        scope: policy.rateScope,
        subjectHash,
        authenticated: context.authenticated,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`rate limiter returned ${response.status}`);
    const raw = (await response.json()) as Record<string, unknown>;
    return {
      allowed: raw.allowed === true,
      retryAfterSeconds: Math.max(0, Number(raw.retryAfterSeconds ?? 0) || 0),
    };
  } catch (error) {
    if (policy.failClosedRateLimit) {
      throw new BffHttpError(
        503,
        "RATE_LIMIT_UNAVAILABLE",
        "Safe quota determination is temporarily unavailable",
        { "Retry-After": "5" },
      );
    }
    return fallbackDecision(policy.rateScope, subjectHash, context.authenticated);
  } finally {
    clearTimeout(timer);
  }
}
