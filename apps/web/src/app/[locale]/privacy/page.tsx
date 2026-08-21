import { Github, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmbeddedAssistantStaticPage } from "@/components/assistant/EmbeddedAssistantStaticPage";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  const summaryKeys = ["account", "formal", "browser", "ai", "sales"] as const;
  const providedKeys = [
    "pseudocode",
    "files",
    "results",
    "costs",
    "language",
    "progress",
    "questions",
    "context",
    "accountProfile",
    "sessionTechnical",
    "key",
  ] as const;
  const notCollectedKeys = [
    "documents",
    "payment",
    "location",
    "biometric",
    "passwords",
    "profiles",
    "sensitive",
    "ads",
    "thirdParty",
  ] as const;

  const assistantFeatures = [
    {
      id: "formal-analyzer",
      title: t("assistant.features.analyzerTitle"),
      location: "/analyzer",
      description: t("assistant.features.analyzerDescription"),
      availability:
        locale === "es"
          ? "Disponible sin crear cuenta"
          : "Available without creating an account",
    },
    {
      id: "course",
      title: t("assistant.features.courseTitle"),
      location: "/course",
      description: t("assistant.features.courseDescription"),
      availability:
        locale === "es"
          ? "Disponible como contenido de apoyo"
          : "Available as supporting content",
    },
    {
      id: "quizzes",
      title: t("assistant.features.quizzesTitle"),
      location: "/quizzes",
      description: t("assistant.features.quizzesDescription"),
      availability:
        locale === "es"
          ? "Disponible con progreso local"
          : "Available with local progress",
    },
    {
      id: "about",
      title: t("assistant.features.aboutTitle"),
      location: "/about",
      description: t("assistant.features.aboutDescription"),
      availability:
        locale === "es"
          ? "Disponible para contexto del proyecto"
          : "Available for project context",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {t("hero.title")}
            </h1>
            <p className="text-lg leading-8 text-slate-200">
              {t("hero.subtitle")}
            </p>
            <p className="text-[15px] leading-7 text-dark-text">
              {t("hero.body")}
            </p>
            <p className="text-sm italic text-slate-400">
              {t("hero.lastUpdated")}
            </p>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("summary.title")}
              </h2>
            </header>
            <ol className="space-y-5 text-[15px] leading-7">
              {summaryKeys.map((key, index) => (
                <li key={key} className="flex items-start gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t(`summary.items.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-dark-text">
                      {t(`summary.items.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.provided.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.provided.intro")}</p>
              <ul className="space-y-2">
                {providedKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                    <span>{t(`sections.provided.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <p>{t("sections.provided.purpose")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.notCollected.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <ul className="space-y-2">
                {notCollectedKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-amber-300" />
                    <span>{t(`sections.notCollected.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm font-medium text-amber-100">
                {t("sections.notCollected.warning")}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.analyzer.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.analyzer.paragraph1")}</p>
              <p>{t("sections.analyzer.paragraph2")}</p>
              <p>{t("sections.analyzer.paragraph3")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.txtFiles.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.txtFiles.paragraph1")}</p>
              <p>{t("sections.txtFiles.paragraph2")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.quizzesProgress.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.quizzesProgress.paragraph1")}</p>
              <p>{t("sections.quizzesProgress.paragraph2")}</p>
              <p>{t("sections.quizzesProgress.paragraph3")}</p>
              <p>{t("sections.quizzesProgress.paragraph4")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.localStorage.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.localStorage.paragraph1")}</p>
              <p>{t("sections.localStorage.paragraph2")}</p>
              <p>{t("sections.localStorage.paragraph3")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.assistant.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.assistant.paragraph1")}</p>
              <p>{t("sections.assistant.paragraph2")}</p>
              <p>{t("sections.assistant.paragraph3")}</p>
              <p>{t("sections.assistant.paragraph4")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.apiKeys.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.apiKeys.paragraph1")}</p>
              <p>{t("sections.apiKeys.paragraph2")}</p>
              <p>{t("sections.apiKeys.paragraph3")}</p>
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm font-medium text-red-100">
                {t("sections.apiKeys.warning")}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.exports.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.exports.paragraph1")}</p>
              <p>{t("sections.exports.paragraph2")}</p>
              <p>{t("sections.exports.paragraph3")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.providers.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.providers.paragraph1")}</p>
              <p>{t("sections.providers.paragraph2")}</p>
              <p>{t("sections.providers.paragraph3")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.security.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.security.paragraph1")}</p>
              <p>{t("sections.security.paragraph2")}</p>
              <ul className="space-y-2">
                {(
                  ["editor", "assistant", "key", "report", "browser"] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    <span>{t(`sections.security.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.rights.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.rights.paragraph1")}</p>
              <p>{t("sections.rights.paragraph2")}</p>
              <p>{t("sections.rights.paragraph3")}</p>
              <div className="grid gap-4 text-[15px] leading-7 text-dark-text sm:grid-cols-2 lg:grid-cols-3">
                {(["luz", "camilo", "jhon"] as const).map((member) => (
                  <article
                    key={member}
                    className="h-full rounded-2xl bg-white/[0.025] px-4 py-8"
                  >
                    <div className="flex h-full flex-col items-center text-center">
                      <h3 className="text-lg font-semibold leading-6 text-white">
                        {t(`contact.members.${member}.name`)}
                      </h3>
                      <div className="flex items-center justify-center gap-3 pt-4">
                        <a
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-primary transition-colors hover:bg-white/[0.06] hover:text-blue-300"
                          href={`mailto:${t(`contact.members.${member}.email`)}`}
                          aria-label={`${t(`contact.members.${member}.name`)} email`}
                          title="Email"
                        >
                          <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
                        </a>
                        {member === "luz" ? null : (
                          <a
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                            href={`https://github.com/${t(`contact.members.${member}.github`).replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${t(`contact.members.${member}.name`)} GitHub`}
                            title="GitHub"
                          >
                            <Github
                              className="h-[18px] w-[18px]"
                              strokeWidth={2}
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("sections.changes.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("sections.changes.paragraph1")}</p>
              <p>{t("sections.changes.paragraph2")}</p>
            </div>
          </section>
        </div>
      </main>

      <EmbeddedAssistantStaticPage
        surface="privacy"
        route={`/${locale}/privacy`}
        title={t("meta.title")}
        description={t("meta.description")}
        notes={[
          "sections=hero,quick-summary,information-you-provide,what-we-dont-collect,analyzer-use,txt-files,quizzes-progress,local-storage,ai-assistant,api-keys,exports,external-providers,security,rights,contact,policy-changes",
          "lastUpdated=2026-05",
          "noAccountRequired=true",
          "aiAssistantOptional=true",
          "bringYourOwnKeySupported=true",
          "localProgressStorage=true",
          "layout=editorial-single-column",
        ]}
        guideSection={{
          id: "privacy-overview",
          title: t("hero.title"),
          description: t("hero.subtitle"),
          summary: t("hero.body"),
        }}
        availableFeatures={assistantFeatures}
      />

      <Footer />
    </div>
  );
}
