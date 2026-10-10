import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

type Params = { params: Promise<{ email: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { email } = await params;
  return proxyApiRequest(request, {
    path: `/admin/classroom/activity/${encodeURIComponent(email)}`,
    policy: POLICIES.admin,
    method: "GET",
  });
}
