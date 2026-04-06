import { getTranslations } from "next-intl/server";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <PageHeader
          icon="shield"
          title={t("heroTitle")}
          description={t("heroDesc")}
          className="mb-10 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="h-1 w-1 rounded-full bg-green-400"></span>
            <p className="text-xs sm:text-sm text-green-400 font-medium">
              {t("lastUpdate")}
            </p>
          </div>
        </PageHeader>

        {/* Cards Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16">
          {/* Card 1: Sin Datos Personales */}
          <div className="glass-card p-5 sm:p-6 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-white/5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-2xl mb-3">
                <span className="material-symbols-outlined text-green-400 text-2xl sm:text-3xl">
                  no_accounts
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {t("card1Title")}
              </h3>
            </div>
            <ul className="space-y-2 text-dark-text text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                {t("card1Item1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                {t("card1Item2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                {t("card1Item3")}
              </li>
            </ul>
          </div>

          {/* Card 2: Procesamiento Temporal */}
          <div className="glass-card p-5 sm:p-6 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-white/5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-2xl mb-3">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                  hourglass_empty
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {t("card2Title")}
              </h3>
            </div>
            <ul className="space-y-2 text-dark-text text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                {t("card2Item1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                {t("card2Item2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
                {t("card2Item3")}
              </li>
            </ul>
          </div>

          {/* Card 3: Código Seguro */}
          <div className="glass-card p-5 sm:p-6 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-white/5 md:col-span-2 lg:col-span-1">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-2xl mb-3">
                <span className="material-symbols-outlined text-blue-400 text-2xl sm:text-3xl">
                  code_blocks
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {t("card3Title")}
              </h3>
            </div>
            <ul className="space-y-2 text-dark-text text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                {t("card3Item1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                {t("card3Item2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                {t("card3Item3")}
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-card p-6 sm:p-8 rounded-xl mb-10 border border-white/5">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
            {t("faqTitle")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-6">
              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq1Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq1A")}
                </p>
              </div>

              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq2Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq2A")}
                </p>
              </div>

              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq3Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq3A")}
                </p>
              </div>

              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq4Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq4A")}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq5Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq5A")}
                </p>
              </div>

              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq6Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                  {t("faq6A")}
                </p>
              </div>

              <div className="p-4 rounded-lg hover:bg-white/5 transition-colors">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {t("faq7Q")}
                </h3>
                <p className="text-dark-text text-xs sm:text-sm mb-3 leading-relaxed">
                  {t("faq7A")}
                </p>
                <ul className="space-y-2 text-dark-text text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm shrink-0 mt-0.5">
                      email
                    </span>
                    <span className="min-w-0">
                      <a
                        href="mailto:juan.cruz37552@ucaldas.edu.co"
                        className="text-blue-400 hover:text-blue-300 underline break-all"
                      >
                        juan.cruz37552@ucaldas.edu.co
                      </a>
                      <span className="text-slate-500 block sm:inline">
                        {" "}
                        ({t("contactName")})
                      </span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400 text-sm shrink-0">
                      code
                    </span>
                    <a
                      href="https://github.com/Cruz1122"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      GitHub @Cruz1122
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
