"use client";

import type {
  ImageResource,
  ReferenceResource,
  Term,
} from "@aa/content-catalog";
import { ArrowLeft, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import { ContentBlockRenderer } from "@/components/content/ContentBlockRenderer";
import { ContentTableOfContents } from "@/components/content/ContentTableOfContents";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";
import { useSectionCompletionTracking } from "@/hooks/useContentProgress";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useRouter } from "@/i18n/navigation";
import type { AssistantContext } from "@/lib/assistant/types";
import { searchContentIndex } from "@/lib/content/search";
import type { UserGuideModuleData } from "@/lib/content/types";

interface UserGuideModuleViewProps {
  data: UserGuideModuleData;
}

type ResourceEntry = ImageResource | ReferenceResource;

function buildResourceMap(
  module: UserGuideModuleData["module"],
): Record<string, ResourceEntry> {
  return Object.fromEntries(
    [
      ...(module.resources?.images ?? []),
      ...(module.resources?.figures ?? []),
      ...(module.resources?.references ?? []),
    ].map((resource) => [resource.resourceId, resource]),
  );
}

function buildTermMap(
  module: UserGuideModuleData["module"],
): Record<string, Term> {
  return Object.fromEntries(
    (module.terms ?? []).map((term) => [term.termId, term]),
  );
}

export function UserGuideModuleView({ data }: UserGuideModuleViewProps) {
  const locale = useLocale();
  const t = useTranslations("contentUi");
  const router = useRouter();
  const { finishNavigation, startNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();
  const { activeSectionId, completedSectionIds, percentage } =
    useSectionCompletionTracking({
      spaceId: data.space.spaceId,
      module: data.moduleSummary,
      sections: data.sectionSummaries,
    });
  const [query, setQuery] = useState("");

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const matches = useMemo(
    () =>
      searchContentIndex(data.searchIndex, data.allModules, query).slice(0, 6),
    [data.allModules, data.searchIndex, query],
  );
  const resourcesById = useMemo(
    () => buildResourceMap(data.module),
    [data.module],
  );
  const termsById = useMemo(() => buildTermMap(data.module), [data.module]);
  const activeSection = useMemo(
    () =>
      data.sectionSummaries.find(
        (section) => section.sectionId === activeSectionId,
      ) ?? data.sectionSummaries[0],
    [activeSectionId, data.sectionSummaries],
  );

  const assistantContext: AssistantContext = useMemo(
    () => ({
      surface: "user-guide",
      locale,
      pageContext: {
        route: data.moduleSummary.route,
        view: "module-page",
        title: data.module.title,
        description: data.module.summary,
        query: query.trim() || undefined,
        notes: [`module=${data.module.moduleId}`, `progress=${percentage}`],
      },
      guideSection: activeSection
        ? {
            id: activeSection.sectionId,
            title: activeSection.title,
            description: activeSection.chapterTitle,
            summary: activeSection.summary,
          }
        : undefined,
    }),
    [
      activeSection,
      data.module,
      data.moduleSummary.route,
      locale,
      percentage,
      query,
    ],
  );

  const handleNavigate = (href: string) => {
    setQuery("");

    if (typeof globalThis.window !== "undefined") {
      const currentPath = globalThis.window.location.pathname.replace(
        /^\/[a-z]{2}/,
        "",
      );
      const destination = new URL(href, globalThis.window.location.origin);

      if (destination.pathname === currentPath && destination.hash) {
        globalThis.window.history.replaceState(
          null,
          "",
          `${globalThis.window.location.pathname}${destination.hash}`,
        );
        globalThis.document
          .getElementById(destination.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    startNavigation();
    router.push(href);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <NavigationLink
            href={data.space.route}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            {t("backToGuide")}
          </NavigationLink>

          <section className="relative">
            <label className="glass-card flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && matches.length > 0) {
                    handleNavigate(matches[0].entry.route);
                  }
                }}
                placeholder={t("searchWithinModulePlaceholder")}
                aria-label={t("searchWithinModuleAriaLabel")}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            {query.trim() ? (
              <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#182431] shadow-xl">
                {matches.length > 0 ? (
                  <ul className="divide-y divide-white/10">
                    {matches.map((match) => (
                      <li key={`${match.entry.kind}-${match.entry.id}`}>
                        <button
                          type="button"
                          onClick={() => handleNavigate(match.entry.route)}
                          className="w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
                        >
                          <div className="text-sm font-semibold text-white">
                            {match.entry.title}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            {match.moduleTitle}
                          </div>
                          {match.snippet ? (
                            <div className="mt-2 text-xs leading-5 text-slate-300">
                              {match.snippet}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-400">
                    <div className="font-semibold text-white">
                      {t("emptySearchTitle")}
                    </div>
                    <div className="mt-1">{t("emptySearchDescription")}</div>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <ContentTableOfContents
                sections={data.sectionSummaries}
                activeSectionId={activeSectionId}
                completedSectionIds={completedSectionIds}
              />
            </div>

            <div className="space-y-8 lg:col-span-3">
              {data.module.chapters.map((chapter) => (
                <section
                  key={chapter.chapterId}
                  id={chapter.slug}
                  className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5 sm:p-6"
                >
                  <header className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {chapter.title}
                    </div>
                    {chapter.summary ? (
                      <p className="text-sm leading-6 text-slate-300">
                        {chapter.summary}
                      </p>
                    ) : null}
                  </header>

                  {chapter.sections.map((section) => (
                    <section
                      key={section.sectionId}
                      id={section.slug}
                      data-content-section-id={section.sectionId}
                      className="scroll-mt-28 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <header className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                          <span>{section.kind}</span>
                          {completedSectionIds.includes(section.sectionId) ? (
                            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                              {t("completed")}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                          {section.title}
                        </h2>
                      </header>

                      <div className="space-y-4">
                        {section.blocks.map((block) => (
                          <ContentBlockRenderer
                            key={block.id}
                            block={block}
                            targetMap={data.targetMap}
                            termsById={termsById}
                            resourcesById={resourcesById}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </section>
              ))}

              <NavigationFooter
                namespace="contentUi"
                prev={
                  data.previousModule
                    ? {
                        href: data.previousModule.route,
                        labelKey: "previousModule",
                      }
                    : undefined
                }
                next={
                  data.nextModule
                    ? {
                        href: data.nextModule.route,
                        labelKey: "nextModule",
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </main>

      <EmbeddedAssistantLauncher
        surface="user-guide"
        assistantContext={assistantContext}
        onAnalyzeCode={(code) => {
          void runAnalysis(code);
        }}
      />

      <Footer />
    </div>
  );
}
