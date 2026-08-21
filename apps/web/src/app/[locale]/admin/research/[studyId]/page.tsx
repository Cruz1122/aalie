import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ResearchStudyDetail } from "@/components/research/ResearchAdminClient";
import { getAuth } from "@/lib/auth";

type Props = { params: Promise<{ locale: string; studyId: string }> };

export default async function ResearchStudyPage({ params }: Props) {
  const { locale, studyId } = await params;
  const session = await getAuth().api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session?.user) redirect(`/${locale}`);
  if (session.user.role !== "ADMIN") notFound();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 px-3 py-8 sm:px-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <ResearchStudyDetail studyId={studyId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
