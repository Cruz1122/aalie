"use client";

import type {
  ImageResource,
  ReferenceResource,
  Term,
} from "@aa/content-catalog/types";
import { useEffect, useMemo } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  ContentBlockRenderer,
  TermAutoLinkProvider,
} from "@/features/content-rendering";
import { useSectionCompletionTracking } from "@/hooks/useContentProgress";
import type { ContentModuleData } from "@/lib/content/types";
import { buildTermsIndex } from "@aa/content-catalog/terms";
interface CourseModuleViewProps {
  data: ContentModuleData;
}

type ResourceEntry = ImageResource | ReferenceResource;

function buildResourceMap(
  module: ContentModuleData["module"],
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
  module: ContentModuleData["module"],
): Record<string, Term> {
  return Object.fromEntries(
    (module.terms ?? []).map((term) => [term.termId, term]),
  );
}

export function CourseModuleView({ data }: CourseModuleViewProps) {
  const { finishNavigation } = useNavigation();
  useSectionCompletionTracking({
    spaceId: data.space.spaceId,
    module: data.moduleSummary,
    sections: data.sectionSummaries,
  });
  const resourcesById = useMemo(
    () => buildResourceMap(data.module),
    [data.module],
  );
  const termsById = useMemo(() => buildTermMap(data.module), [data.module]);
  const termsIndex = useMemo(() => {
    const localIndex = buildTermsIndex(data.module.terms);
    const localIds = new Set(localIndex.map((t) => t.termId));

    // Merge global terms that don't collide with local termIds
    const merged = [...localIndex];
    for (const globalTerm of data.courseTermsIndex) {
      if (!localIds.has(globalTerm.termId)) {
        merged.push(globalTerm);
      }
    }
    return merged;
  }, [data.module.terms, data.courseTermsIndex]);

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
                <TermAutoLinkProvider key={section.sectionId}>
                  <section
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
                          termsIndex={termsIndex}
                          resourcesById={resourcesById}
                        />
                      ))}
                    </div>
                  </section>
                </TermAutoLinkProvider>
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
      <Footer />
    </div>
  );
}
