import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { clearStudyCookie, proxyApiRequest } from "@/lib/bff/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const response = await proxyApiRequest(request, {
    path: `/studies/${encodeURIComponent(slug)}/withdraw`,
    policy: POLICIES.study,
  });
  return response.ok ? clearStudyCookie(response) : response;
}
