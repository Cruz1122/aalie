import type { NextRequest } from "next/server";

import { STUDY_COOKIE_NAME, studyCookieOptions } from "@/lib/bff/identity";
import { POLICIES } from "@/lib/bff/policies";
import { proxyApiRequest } from "@/lib/bff/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const response = await proxyApiRequest(request, {
    path: `/studies/${encodeURIComponent(slug)}/consent`,
    policy: POLICIES.study,
  });
  if (response.ok) {
    response.cookies.set(STUDY_COOKIE_NAME, slug, studyCookieOptions());
  }
  return response;
}
