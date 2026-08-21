import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> },
) {
  const { studyId } = await params;
  return proxyApiRequest(request, {
    path: `/admin/studies/${encodeURIComponent(studyId)}/export`,
    policy: POLICIES.admin,
    method: "GET",
  });
}
