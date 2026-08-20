import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const user = session.user as typeof session.user & { role: "USER" | "ADMIN" };

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      role: user.role,
    },
  });
}
