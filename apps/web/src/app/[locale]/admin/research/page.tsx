import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ClassroomRoster } from "@/components/research/ClassroomRoster";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function ResearchAdminPage({ params }: Props) {
  const { locale } = await params;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session?.user) redirect(`/${locale}`);
  if (session.user.role !== "ADMIN") notFound();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex flex-1 flex-col px-3 py-8 sm:px-4 lg:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <ClassroomRoster />
        </div>
      </main>
      <Footer />
    </div>
  );
}
