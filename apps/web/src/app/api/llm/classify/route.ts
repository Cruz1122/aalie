import { NextRequest, NextResponse } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyJsonRequest } from "@/lib/bff/proxy";

export const runtime = "nodejs";

type ClassifyRequest = {
  source?: unknown;
  mode?: unknown;
};

type ClassifyBackendResponse = {
  kind?: "iterative" | "recursive" | "hybrid" | "unknown";
};

export async function POST(request: NextRequest) {
  const response = await proxyJsonRequest(request, {
    path: "/classify",
    policy: POLICIES.classify,
    transformBody: (raw) => {
      const body =
        raw && typeof raw === "object" ? (raw as ClassifyRequest) : {};
      return { source: body.source };
    },
  });

  if (!response.ok) return response;

  const backend = (await response.json()) as ClassifyBackendResponse;
  const compatible = NextResponse.json({
    kind: backend.kind ?? "unknown",
    method: "ast",
    timestamp: new Date().toISOString(),
  });

  const visitorCookie = response.headers.get("set-cookie");
  if (visitorCookie) compatible.headers.set("set-cookie", visitorCookie);
  const requestId = response.headers.get("x-request-id");
  if (requestId) compatible.headers.set("x-request-id", requestId);
  compatible.headers.set("Cache-Control", "no-store");
  return compatible;
}
