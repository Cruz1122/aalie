import type { NextRequest } from "next/server";

import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ studyId: string; participantId: string }>;
  },
) {
  const { studyId, participantId } = await params;
  return proxyApiRequest(request, {
    path: `/admin/studies/${encodeURIComponent(studyId)}/participants/${encodeURIComponent(participantId)}/condition`,
    policy: POLICIES.admin,
    method: "PATCH",
  });
}
