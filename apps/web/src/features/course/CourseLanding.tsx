"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UserGuideCard } from "@/components/UserGuideCard";
import { useNavigation } from "@/contexts/NavigationContext";
import { useContentProgress } from "@/hooks/useContentProgress";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";
import type { ContentLandingData } from "@/lib/content/types";

interface CourseLandingProps {
  data: ContentLandingData;
  locale: string;
}

export function CourseLanding({ data, locale }: CourseLandingProps) {
  const appLocale = useLocale();
  const { finishNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();
  const { moduleProgressById, spaceProgress } = useContentProgress(
    data.space.spaceId,
    data.modules,
  );

  const assistantContext: AssistantContext = useMemo(
    () => ({
      surface: "course",
      locale: appLocale,
      pageContext: {
        route: data.space.route,
        view: "course-grid",
        title: data.space.title,
        description: data.space.description,
        notes: [
          "context=course-landing",
          `spaceId=${data.space.spaceId}`,
          `modules=${data.modules.length}`,
          `progress=${spaceProgress}`,
        ],
      },
    }),
    [appLocale, data.modules.length, data.space, spaceProgress],
  );

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="documentation-grid">
            {data.modules.map((module) => (
              <div key={module.moduleId} className="min-w-0 h-full">
                <UserGuideCard
                  module={module}
                  progress={moduleProgressById[module.moduleId] ?? 0}
                  locale={locale}
                />
              </div>
            ))}
          </section>
        </div>
      </main>

      <EmbeddedAssistantLauncher
        surface="course"
        assistantContext={assistantContext}
        onAnalyzeCode={(code) => {
          void runAnalysis(code);
        }}
      />

      <Footer />
    </div>
  );
}
