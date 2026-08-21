import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> },
) {
  const { studyId } = await params;
  return proxyApiRequest(request, {
    path: `/admin/studies/${encodeURIComponent(studyId)}/status`,
    policy: POLICIES.admin,
    method: "PATCH",
  });
}
