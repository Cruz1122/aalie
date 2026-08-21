import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { StudyParticipationClient } from "@/components/research/StudyParticipationClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function StudyPage({ params }: Props) {
  const { locale, slug } = await params;
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 px-3 py-8 sm:px-4 lg:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <StudyParticipationClient slug={slug} locale={locale} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
