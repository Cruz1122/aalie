import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

export const VISITOR_COOKIE_NAME = "aalie_vid";
export const STUDY_COOKIE_NAME = "aalie_study";
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STUDY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validVisitorId(value: string | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function validStudySlug(value: string | undefined): value is string {
  return Boolean(value && value.length <= 96 && STUDY_SLUG_RE.test(value));
}

export function visitorCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
  };
}

export function studyCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
  };
}

export function resolveVisitor(request: NextRequest): {
  visitorId: string;
  shouldSetCookie: boolean;
} {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (validVisitorId(existing)) {
    return { visitorId: existing, shouldSetCookie: false };
  }
  return { visitorId: randomUUID(), shouldSetCookie: true };
}

export function resolveStudySlug(request: NextRequest): string | null {
  const value = request.cookies.get(STUDY_COOKIE_NAME)?.value;
  return validStudySlug(value) ? value : null;
}

export function hashRateLimitSubject(subject: string): string {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "RATE_LIMIT_HMAC_SECRET is required when product rate limits are enabled",
    );
  }
  return createHmac("sha256", secret).update(subject, "utf8").digest("hex");
}
