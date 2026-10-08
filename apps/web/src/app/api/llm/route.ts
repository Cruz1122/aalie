import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyJsonRequest } from "@/lib/bff/proxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return proxyJsonRequest(request, {
    path: "/llm",
    maxBodyBytes: POLICIES.llm.bodyLimitBytes,
    policy: (_body, context) =>
      context.isUniversityUser ? POLICIES.llmUcaldas : POLICIES.llm,
  });
}
