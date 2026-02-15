import { getTranslations } from "next-intl/server";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import NavigationLink from "@/components/NavigationLink";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("heroDesc"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <PageHeader
          icon="info"
          title={t("heroTitle")}
          description={t("heroDesc")}
          className="mb-12 sm:mb-16"
        />

        {/* Qué es - Card Principal */}
        <div className="glass-card p-6 sm:p-8 rounded-xl mb-10 border border-white/5">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                  calculate
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                {t("whatDoesTitle")}
              </h2>
              <p className="text-dark-text leading-relaxed mb-4 text-sm sm:text-base">
                {t("whatDoesDesc")}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:bg-green-500/30">
                  {t("badgeAuto")}
                </span>
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:bg-blue-500/30">
                  {t("badgeViz")}
                </span>
                <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs sm:text-sm font-medium transition-colors hover:bg-purple-500/30">
                  {t("badgeLatex")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Características Implementadas */}
        <div className="glass-card p-6 sm:p-8 rounded-xl mb-10 border border-white/5">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
            {t("featuresTitle")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="glass-secondary p-4 rounded-xl border-l-4 border-emerald-400 hover:border-emerald-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureRecursive")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureRecursiveDesc")}
              </p>
            </div>

            <div className="glass-secondary p-4 rounded-xl border-l-4 border-blue-400 hover:border-blue-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureTrace")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureTraceDesc")}
              </p>
            </div>

            <div className="glass-secondary p-4 rounded-xl border-l-4 border-purple-400 hover:border-purple-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureLlm")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureLlmDesc")}
              </p>
            </div>

            <div className="glass-secondary p-4 rounded-xl border-l-4 border-orange-400 hover:border-orange-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureGpu")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureGpuDesc")}
              </p>
            </div>

            <div className="glass-secondary p-4 rounded-xl border-l-4 border-cyan-400 hover:border-cyan-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureViz")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureVizDesc")}
              </p>
            </div>

            <div className="glass-secondary p-4 rounded-xl border-l-4 border-pink-400 hover:border-pink-300/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full shrink-0"></span>
                <h3 className="text-white font-semibold text-sm">
                  {t("featureMemo")}
                </h3>
              </div>
              <p className="text-dark-text text-xs sm:text-sm leading-relaxed">
                {t("featureMemoDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Características Clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <div className="glass-card p-5 sm:p-6 rounded-xl text-center hover:scale-[1.02] hover:border-green-500/30 transition-all duration-300 border border-white/5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-xl sm:text-2xl">
                privacy_tip
              </span>
            </div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">{t("noSignup")}</h3>
            <p className="text-dark-text text-xs sm:text-sm">
              {t("noSignupDesc")}
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-xl text-center hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 border border-white/5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">
                school
              </span>
            </div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">{t("educational")}</h3>
            <p className="text-dark-text text-xs sm:text-sm">
              {t("educationalDesc")}
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-xl text-center hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300 border border-white/5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-xl sm:text-2xl">
                speed
              </span>
            </div>
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">{t("realtime")}</h3>
            <p className="text-dark-text text-xs sm:text-sm">
              {t("realtimeDesc")}
            </p>
          </div>
        </div>

        {/* Cómo Funciona */}
        <div className="glass-card p-6 sm:p-8 rounded-xl mb-10 border border-white/5">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
            {t("howWorksTitle")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold text-sm sm:text-base">1</span>
              </div>
              <h3 className="text-white font-semibold mb-1 text-xs sm:text-sm">
                {t("step1Title")}
              </h3>
              <p className="text-dark-text text-[10px] sm:text-xs">
                {t("step1Desc")}
              </p>
            </div>

            <div className="text-center p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold text-sm sm:text-base">2</span>
              </div>
              <h3 className="text-white font-semibold mb-1 text-xs sm:text-sm">
                {t("step2Title")}
              </h3>
              <p className="text-dark-text text-[10px] sm:text-xs">
                {t("step2Desc")}
              </p>
            </div>

            <div className="text-center p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold text-sm sm:text-base">3</span>
              </div>
              <h3 className="text-white font-semibold mb-1 text-xs sm:text-sm">
                {t("step3Title")}
              </h3>
              <p className="text-dark-text text-[10px] sm:text-xs">
                {t("step3Desc")}
              </p>
            </div>

            <div className="text-center p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold text-sm sm:text-base">4</span>
              </div>
              <h3 className="text-white font-semibold mb-1 text-xs sm:text-sm">
                {t("step4Title")}
              </h3>
              <p className="text-dark-text text-[10px] sm:text-xs">
                {t("step4Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Contacto */}
        <div className="glass-card p-6 sm:p-8 rounded-xl mb-10 border border-white/5">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-2xl mb-4">
              <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                contact_mail
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("contactTitle")}</h2>
            <p className="text-dark-text text-xs sm:text-sm max-w-2xl mx-auto">
              {t("contactDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <a
              href="mailto:juan.cruz37552@ucaldas.edu.co"
              className="glass-secondary p-6 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-white/10 hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-400 text-2xl">
                    email
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1">{t("email")}</h3>
                  <p className="text-dark-text text-sm truncate">
                    juan.cruz37552@ucaldas.edu.co
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t("contactName")}</p>
                </div>
              </div>
            </a>

            <a
              href="https://github.com/Cruz1122"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-secondary p-6 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-white/10 hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-purple-400 text-2xl">
                    code
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1">{t("github")}</h3>
                  <p className="text-dark-text text-sm">@Cruz1122</p>
                  <p className="text-xs text-slate-400 mt-1">{t("githubSub")}</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Enlaces Rápidos */}
        <div className="text-center glass-secondary p-6 sm:p-8 rounded-xl border border-white/5">
          <h3 className="text-xl font-bold text-white mb-6">{t("linksTitle")}</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <NavigationLink
              href="/"
              className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">home</span>{" "}
              {t("gotoAALIE")}
            </NavigationLink>
            <NavigationLink
              href="/privacy"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">shield</span>{" "}
              {t("privacyPolicy")}
            </NavigationLink>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">api</span>{" "}
              {t("apiStatus")}
            </a>
          </div>
          <p className="text-xs text-dark-text mt-6">
            {t("projectTitle")}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
