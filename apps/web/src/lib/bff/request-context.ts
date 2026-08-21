import "server-only";

import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { getAuth } from "@/lib/auth";

import { resolveStudySlug, resolveVisitor } from "./identity";

export type OperationalRole = "USER" | "ADMIN";

export interface BffRequestContext {
  requestId: string;
  authenticated: boolean;
  userId: string | null;
  role: OperationalRole | null;
  subject: string;
  visitorId: string;
  shouldSetVisitorCookie: boolean;
  studySlug: string | null;
}

export async function buildRequestContext(
  request: NextRequest,
): Promise<BffRequestContext> {
  const visitor = resolveVisitor(request);
  const session = await getAuth().api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  const userId = session?.user?.id ? String(session.user.id) : null;
  const rawRole = session?.user?.role;
  const role: OperationalRole | null =
    rawRole === "ADMIN" ? "ADMIN" : rawRole === "USER" ? "USER" : null;
  const authenticated = Boolean(userId && role);

  return {
    requestId: randomUUID(),
    authenticated,
    userId: authenticated ? userId : null,
    role: authenticated ? role : null,
    subject: authenticated ? `user:${userId}` : `visitor:${visitor.visitorId}`,
    visitorId: visitor.visitorId,
    shouldSetVisitorCookie: visitor.shouldSetCookie,
    studySlug: authenticated ? resolveStudySlug(request) : null,
  };
}
