import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return proxyApiRequest(request, {
    path: `/studies/${encodeURIComponent(slug)}/measurements`,
    policy: POLICIES.study,
  });
}
