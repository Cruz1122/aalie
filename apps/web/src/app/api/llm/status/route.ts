import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return proxyApiRequest(request, {
    path: "/llm/status",
    policy: POLICIES.status,
    method: "GET",
  });
}
