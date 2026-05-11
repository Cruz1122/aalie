"use client";

import type {
  ImageResource,
  ReferenceResource,
  Term,
} from "@aa/content-catalog";
import { useLocale } from "next-intl";
import { useEffect, useMemo } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { useNavigation } from "@/contexts/NavigationContext";
import { ContentBlockRenderer } from "@/features/content-rendering";
import { useSectionCompletionTracking } from "@/hooks/useContentProgress";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";
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
  const { finishNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();
  const { activeSectionId, percentage } = useSectionCompletionTracking({
    spaceId: data.space.spaceId,
    module: data.moduleSummary,
    sections: data.sectionSummaries,
  });
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
        notes: [
          "context=user-guide-module",
          `spaceId=${data.space.spaceId}`,
          `moduleId=${data.module.moduleId}`,
          `slug=${data.moduleSummary.slug}`,
          `progress=${percentage}`,
        ],
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
      data.moduleSummary.slug,
      data.space.spaceId,
      locale,
      percentage,
    ],
  );

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
          {data.module.chapters.map((chapter) => (
            <section
              key={chapter.chapterId}
              id={chapter.slug}
              className="space-y-10"
            >
              <header className="border-b border-white/10 pb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {chapter.title}
                </p>
                {chapter.summary ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {chapter.summary}
                  </p>
                ) : null}
              </header>

              {chapter.sections.map((section) => (
                <section
                  key={section.sectionId}
                  id={section.slug}
                  data-content-section-id={section.sectionId}
                  className="scroll-mt-28 space-y-5"
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    {section.title}
                  </h2>

                  <div className="space-y-5 text-[15px] leading-7">
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
