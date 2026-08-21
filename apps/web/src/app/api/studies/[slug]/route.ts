import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return proxyApiRequest(request, {
    path: `/studies/${encodeURIComponent(slug)}`,
    policy: POLICIES.quiz,
    method: "GET",
  });
}
