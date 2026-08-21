import { afterEach, describe, expect, it, vi } from "vitest";

import { hashRateLimitSubject, visitorCookieOptions } from "../identity";
import { POLICIES } from "../policies";
import { enforceRateLimit } from "../rate-limit";
import type { BffRequestContext } from "../request-context";

function context(
  overrides: Partial<BffRequestContext> = {},
): BffRequestContext {
  return {
    requestId: `request-${crypto.randomUUID()}`,
    authenticated: false,
    userId: null,
    role: null,
    subject: `visitor:${crypto.randomUUID()}`,
    visitorId: crypto.randomUUID(),
    shouldSetVisitorCookie: false,
    studySlug: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("MF3 BFF quota and identity gates", () => {
  it("hashes stable subjects deterministically without storing the raw identity", () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test-only-hmac-secret");
    const visitor = `visitor:${crypto.randomUUID()}`;
    const other = `visitor:${crypto.randomUUID()}`;

    const first = hashRateLimitSubject(visitor);
    const repeated = hashRateLimitSubject(visitor);
    const distinct = hashRateLimitSubject(other);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(repeated).toBe(first);
    expect(distinct).not.toBe(first);
    expect(first).not.toContain(visitor);
  });

  it("marks visitor cookies Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(visitorCookieOptions().secure).toBe(true);
  });

  it("keeps the MF3 payload and timeout policy baselines explicit", () => {
    expect(POLICIES.parse).toMatchObject({
      bodyLimitBytes: 128 * 1024,
      timeoutMs: 10_000,
      rateScope: "parse",
    });
    expect(POLICIES.analysis).toMatchObject({
      bodyLimitBytes: 128 * 1024,
      timeoutMs: 30_000,
      rateScope: "analysis",
    });
    expect(POLICIES.trace).toMatchObject({
      bodyLimitBytes: 128 * 1024,
      timeoutMs: 30_000,
      rateScope: "trace",
    });
    expect(POLICIES.quiz).toMatchObject({
      bodyLimitBytes: 128 * 1024,
      timeoutMs: 15_000,
      rateScope: "quiz",
    });
    expect(POLICIES.llm).toMatchObject({
      bodyLimitBytes: 256 * 1024,
      timeoutMs: 60_000,
      rateScope: "llm",
      failClosedRateLimit: true,
    });
    expect(POLICIES.exportPdf).toMatchObject({
      bodyLimitBytes: 512 * 1024,
      timeoutMs: 130_000,
      rateScope: "export_pdf",
      failClosedRateLimit: true,
    });
    expect(POLICIES.study).toMatchObject({
      bodyLimitBytes: 64 * 1024,
      requireAuth: true,
    });
    expect(POLICIES.admin).toMatchObject({
      bodyLimitBytes: 64 * 1024,
      requireAuth: true,
      requireAdmin: true,
    });
  });

  it("uses a stricter deterministic local fallback for cheap scopes", async () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test-only-hmac-secret");
    vi.stubEnv("AALIE_RATE_LIMITS_ENABLED", "true");
    vi.stubEnv("AALIE_RATE_LIMIT_ANALYSIS_ANON", "2");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("database unavailable")),
    );
    const requestContext = context();

    const first = await enforceRateLimit(requestContext, POLICIES.analysis);
    const second = await enforceRateLimit(requestContext, POLICIES.analysis);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("fails closed for expensive scopes when quota cannot be determined", async () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test-only-hmac-secret");
    vi.stubEnv("AALIE_RATE_LIMITS_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("database unavailable")),
    );

    await expect(
      enforceRateLimit(context(), POLICIES.llm),
    ).rejects.toMatchObject({
      status: 503,
      code: "RATE_LIMIT_UNAVAILABLE",
      headers: { "Retry-After": "5" },
    });
    await expect(
      enforceRateLimit(context(), POLICIES.exportPdf),
    ).rejects.toMatchObject({
      status: 503,
      code: "RATE_LIMIT_UNAVAILABLE",
    });
  });
});
