import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildRequestContext: vi.fn(),
  enforceRateLimit: vi.fn(),
  mintInternalJwt: vi.fn(),
}));

vi.mock("../request-context", () => ({
  buildRequestContext: mocks.buildRequestContext,
}));
vi.mock("../rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("../jwt", () => ({
  mintInternalJwt: mocks.mintInternalJwt,
}));
vi.mock("../api-base", () => ({
  getApiBase: () => "http://api.test",
}));

import { NextRequest } from "next/server";

import { POLICIES } from "../policies";
import { proxyApiRequest } from "../proxy";
import type { BffRequestContext } from "../request-context";

function context(
  overrides: Partial<BffRequestContext> = {},
): BffRequestContext {
  return {
    requestId: "request-gate",
    authenticated: false,
    userId: null,
    role: null,
    subject: "visitor:4a7a94e5-1a8e-4c80-a3e8-e1d8e5b7da4c",
    visitorId: "4a7a94e5-1a8e-4c80-a3e8-e1d8e5b7da4c",
    shouldSetVisitorCookie: false,
    studySlug: null,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.buildRequestContext.mockReset();
  mocks.enforceRateLimit.mockReset();
  mocks.mintInternalJwt.mockReset();
  mocks.buildRequestContext.mockResolvedValue(context());
  mocks.enforceRateLimit.mockResolvedValue({
    allowed: true,
    retryAfterSeconds: 0,
  });
  mocks.mintInternalJwt.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MF3 common BFF proxy", () => {
  it("returns 429 and Retry-After when the product quota is exhausted", async () => {
    mocks.enforceRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 7,
    });
    const request = new NextRequest("http://aalie.test/api/analyze/open", {
      method: "POST",
      body: JSON.stringify({ source: "ALGORITHM Test BEGIN END" }),
      headers: { "content-type": "application/json" },
    });

    const response = await proxyApiRequest(request, {
      path: "/analyze/open",
      policy: POLICIES.analysis,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
    expect(await response.json()).toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
    });
  });

  it("enforces ADMIN as 401 for anonymous, 403 for USER and proxies ADMIN", async () => {
    const anonymousRequest = new NextRequest(
      "http://aalie.test/api/admin/studies",
    );
    let response = await proxyApiRequest(anonymousRequest, {
      path: "/admin/studies",
      policy: POLICIES.admin,
      method: "GET",
    });
    expect(response.status).toBe(401);

    mocks.buildRequestContext.mockResolvedValue(
      context({
        authenticated: true,
        userId: "user-1",
        role: "USER",
        subject: "user:user-1",
      }),
    );
    response = await proxyApiRequest(
      new NextRequest("http://aalie.test/api/admin/studies"),
      {
        path: "/admin/studies",
        policy: POLICIES.admin,
        method: "GET",
      },
    );
    expect(response.status).toBe(403);

    mocks.buildRequestContext.mockResolvedValue(
      context({
        authenticated: true,
        userId: "admin-1",
        role: "ADMIN",
        subject: "user:admin-1",
      }),
    );
    mocks.mintInternalJwt.mockResolvedValue("server-minted-jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ id: "study-1" }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    response = await proxyApiRequest(
      new NextRequest("http://aalie.test/api/admin/studies"),
      {
        path: "/admin/studies",
        policy: POLICIES.admin,
        method: "GET",
      },
    );
    expect(response.status).toBe(200);
    expect(mocks.mintInternalJwt).toHaveBeenCalledOnce();
  });

  it("does not forward browser Authorization headers", async () => {
    const upstream = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", upstream);
    const request = new NextRequest("http://aalie.test/api/health", {
      headers: {
        authorization: "Bearer browser-controlled-token",
        "x-aalie-user": "attacker",
        "x-aalie-role": "ADMIN",
      },
    });

    const response = await proxyApiRequest(request, {
      path: "/health",
      policy: POLICIES.status,
      method: "GET",
    });

    expect(response.status).toBe(200);
    const init = upstream.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.has("x-aalie-user")).toBe(false);
    expect(headers.has("x-aalie-role")).toBe(false);
  });

  it("turns an upstream AbortController timeout into a controlled 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init?.signal;
            if (!signal) {
              reject(new Error("missing abort signal"));
              return;
            }
            signal.addEventListener(
              "abort",
              () => {
                const error = new Error("aborted");
                error.name = "AbortError";
                reject(error);
              },
              { once: true },
            );
          }),
      ),
    );
    const request = new NextRequest("http://aalie.test/api/slow");

    const response = await proxyApiRequest(request, {
      path: "/slow",
      method: "GET",
      policy: {
        bodyLimitBytes: 0,
        timeoutMs: 5,
        rateScope: null,
      },
    });

    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({
      ok: false,
      code: "UPSTREAM_TIMEOUT",
    });
  });
});
