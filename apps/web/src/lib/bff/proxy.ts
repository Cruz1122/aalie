import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getApiBase } from "./api-base";
import { BffHttpError, readJsonBody } from "./body";
import { STUDY_COOKIE_NAME, VISITOR_COOKIE_NAME, visitorCookieOptions } from "./identity";
import { mintInternalJwt } from "./jwt";
import type { BffPolicy } from "./policies";
import { enforceRateLimit } from "./rate-limit";
import { buildRequestContext, type BffRequestContext } from "./request-context";

const SAFE_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "content-length",
  "x-snapshot-id",
  "x-content-hash",
  "retry-after",
] as const;

type PolicyResolver = BffPolicy | ((body: unknown) => BffPolicy);

interface ProxyOptions {
  path: string;
  policy: PolicyResolver;
  transformBody?: (body: unknown) => unknown;
}

function jsonError(status: number, code: string, message: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ ok: false, code, error: message }, { status, headers });
}

function applyVisitorCookie(response: NextResponse, context: BffRequestContext): NextResponse {
  if (context.shouldSetVisitorCookie) {
    response.cookies.set(VISITOR_COOKIE_NAME, context.visitorId, visitorCookieOptions());
  }
  return response;
}

export function copySafeResponseHeaders(source: Headers): Headers {
  const target = new Headers({ "Cache-Control": "no-store" });
  for (const name of SAFE_RESPONSE_HEADERS) {
    const value = source.get(name);
    if (value) target.set(name, value);
  }
  return target;
}

export function buildBackendHeaders(
  context: BffRequestContext,
  token: string | null,
  body: unknown,
  path: string,
): Headers {
  const headers = new Headers({
    "content-type": "application/json",
    "x-request-id": context.requestId,
  });
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (context.studySlug && token) headers.set("x-aalie-study-slug", context.studySlug);

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (path === "/export/report" && typeof record.format === "string") {
    headers.set("x-aalie-export-format", record.format.slice(0, 16));
  }
  if (path === "/llm" && typeof record.job === "string") {
    headers.set("x-aalie-llm-job", record.job.slice(0, 64));
  }
  if (path === "/analyze/open") {
    if (typeof record.algorithm_kind === "string") {
      headers.set("x-aalie-algorithm-kind", record.algorithm_kind.slice(0, 32));
    }
    if (typeof record.preferred_method === "string") {
      headers.set("x-aalie-analysis-method", record.preferred_method.slice(0, 64));
    }
  }
  return headers;
}

export async function proxyJsonRequest(request: NextRequest, options: ProxyOptions): Promise<NextResponse> {
  let context: BffRequestContext | null = null;
  try {
    context = await buildRequestContext(request);
    const preliminary = typeof options.policy === "function" ? null : options.policy;
    const maxBytes = preliminary?.bodyLimitBytes ?? 512 * 1024;
    let body = await readJsonBody(request, maxBytes);
    const policy = typeof options.policy === "function" ? options.policy(body) : options.policy;
    if (policy.bodyLimitBytes < maxBytes) {
      const encodedSize = new TextEncoder().encode(JSON.stringify(body)).byteLength;
      if (encodedSize > policy.bodyLimitBytes) {
        throw new BffHttpError(413, "PAYLOAD_TOO_LARGE", "Request payload is too large");
      }
    }
    if (options.transformBody) body = options.transformBody(body);

    if (policy.requireAuth && !context.authenticated) {
      return applyVisitorCookie(jsonError(401, "UNAUTHORIZED", "Authentication required"), context);
    }
    if (policy.requireAdmin && context.role !== "ADMIN") {
      return applyVisitorCookie(jsonError(403, "FORBIDDEN", "Admin role required"), context);
    }

    const decision = await enforceRateLimit(context, policy);
    if (!decision.allowed) {
      return applyVisitorCookie(
        jsonError(429, "RATE_LIMITED", "Too many requests", {
          "Retry-After": String(Math.max(1, decision.retryAfterSeconds)),
        }),
        context,
      );
    }

    const token = context.authenticated ? await mintInternalJwt(request.headers) : null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    try {
      const upstream = await fetch(`${getApiBase()}${options.path}`, {
        method: "POST",
        headers: buildBackendHeaders(context, token, body, options.path),
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
      const response = new NextResponse(upstream.body, {
        status: upstream.status,
        headers: copySafeResponseHeaders(upstream.headers),
      });
      response.headers.set("X-Request-ID", context.requestId);
      return applyVisitorCookie(response, context);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const response =
      error instanceof BffHttpError
        ? jsonError(error.status, error.code, error.message, error.headers)
        : error instanceof Error && error.name === "AbortError"
          ? jsonError(504, "UPSTREAM_TIMEOUT", "Upstream request timed out")
          : jsonError(503, "BFF_UNAVAILABLE", error instanceof Error ? error.message : "Service unavailable");
    return context ? applyVisitorCookie(response, context) : response;
  }
}

export function clearStudyCookie(response: NextResponse): NextResponse {
  response.cookies.set(STUDY_COOKIE_NAME, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return response;
}
