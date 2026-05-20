import { Github, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmbeddedAssistantStaticPage } from "@/components/assistant/EmbeddedAssistantStaticPage";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const capabilityKeys = [
    "write",
    "analyze",
    "recursive",
    "trace",
    "quizzes",
    "export",
  ] as const;
  const differentiatorKeys = [
    "path",
    "conservative",
    "classroom",
    "bilingual",
  ] as const;
  const limitKeys = [
    "realCode",
    "teacher",
    "space",
    "average",
    "truth",
    "advanced",
  ] as const;
  const contacts = ["luz", "camilo", "jhon"] as const;

  const assistantFeatures = [
    {
      id: "formal-analyzer",
      title: t("assistant.features.analyzerTitle"),
      location: "/analyzer",
      description: t("assistant.features.analyzerDescription"),
      availability:
        locale === "es"
          ? "Disponible desde el menú principal"
          : "Available from the main navigation",
    },
    {
      id: "course",
      title: t("assistant.features.courseTitle"),
      location: "/course",
      description: t("assistant.features.courseDescription"),
      availability:
        locale === "es"
          ? "Disponible por módulos y capítulos"
          : "Available through modules and chapters",
    },
    {
      id: "examples-catalog",
      title: t("assistant.features.examplesTitle"),
      location: "/examples",
      description: t("assistant.features.examplesDescription"),
      availability:
        locale === "es"
          ? "Disponible para practicar y comparar"
          : "Available for practice and comparison",
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
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:gap-12">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {t("hero.eyebrow")}
            </p>
            <div
              aria-hidden="true"
              className="h-20 w-20 bg-white shadow-[0_0_40px_rgba(255,255,255,0.16)]"
              style={{
                WebkitMaskImage: "url('/aalie.svg')",
                maskImage: "url('/aalie.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="text-lg leading-8 text-slate-200">
              {t("hero.subtitle")}
            </p>
            <p className="text-[15px] leading-7 text-dark-text">
              {t("hero.body")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <NavigationLink
                href="/analyzer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/15 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/20 focus-visible-enhanced"
              >
                <span className="material-symbols-outlined text-base">
                  psychology
                </span>
                {t("hero.primaryCta")}
              </NavigationLink>
              <NavigationLink
                href="/course"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06] focus-visible-enhanced"
              >
                <span className="material-symbols-outlined text-base">
                  school
                </span>
                {t("hero.secondaryCta")}
              </NavigationLink>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("why.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("why.paragraph1")}</p>
              <p>{t("why.paragraph2")}</p>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("capabilities.title")}
              </h2>
            </header>
            <ol className="space-y-5 text-[15px] leading-7">
              {capabilityKeys.map((key, index) => (
                <li key={key} className="flex items-start gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t(`capabilities.items.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-dark-text">
                      {t(`capabilities.items.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("ai.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("ai.paragraph1")}</p>
              <p>{t("ai.paragraph2")}</p>
            </div>
            <aside className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.06] p-5 text-sm leading-7 text-cyan-100/90">
              {t("ai.microcopy")}
            </aside>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("differentiators.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              {differentiatorKeys.map((key) => (
                <div key={key}>
                  <h3 className="text-lg font-semibold text-white">
                    {t(`differentiators.items.${key}.title`)}
                  </h3>
                  <p className="mt-1">
                    {t(`differentiators.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("limits.title")}
              </h2>
            </header>
            <div className="space-y-5 text-[15px] leading-7 text-dark-text">
              <p>{t("limits.intro")}</p>
              <ul className="space-y-3">
                {limitKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
                    <span>{t(`limits.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-5">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t("contact.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {t("contact.intro")}
              </p>
            </header>
            <div className="grid gap-4 text-[15px] leading-7 text-dark-text sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((member) => (
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
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-7">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {t("cta.title")}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-dark-text">
              {t("cta.body")}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <NavigationLink
                href="/analyzer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/15 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/20 focus-visible-enhanced"
              >
                <span className="material-symbols-outlined text-base">
                  play_arrow
                </span>
                {t("cta.primary")}
              </NavigationLink>
              <NavigationLink
                href="/examples"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06] focus-visible-enhanced"
              >
                <span className="material-symbols-outlined text-base">
                  code_blocks
                </span>
                {t("cta.secondary")}
              </NavigationLink>
            </div>
          </section>
        </div>
      </main>

      <EmbeddedAssistantStaticPage
        surface="about"
        route={`/${locale}/about`}
        title={t("meta.title")}
        description={t("meta.description")}
        notes={[
          "sections=hero,why-exists,what-you-can-do,ai-clarification,differentiators,limitations,team,contact,cta",
          "teamSize=3",
          "audience=students,teachers,evaluators",
          "assistantOptional=true",
          "bilingual=true",
          "layout=editorial-single-column",
        ]}
        guideSection={{
          id: "about-overview",
          title: t("hero.eyebrow"),
          description: t("hero.subtitle"),
          summary: t("hero.body"),
        }}
        availableFeatures={assistantFeatures}
      />

      <Footer />
    </div>
  );
}
