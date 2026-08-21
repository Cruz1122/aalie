import { getTranslations } from "next-intl/server";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProfileView from "@/components/ProfileView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ProfilePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex flex-1 items-center justify-center px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <ProfileView />
      </main>

      <Footer />
    </div>
  );
}
