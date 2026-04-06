"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UserGuideCard } from "@/components/UserGuideCard";
import { useNavigation } from "@/contexts/NavigationContext";
import { useContentProgress } from "@/hooks/useContentProgress";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";
import type { UserGuideLandingData } from "@/lib/content/types";

interface UserGuideLandingViewProps {
  data: UserGuideLandingData;
}

export function UserGuideLandingView({ data }: UserGuideLandingViewProps) {
  const locale = useLocale();
  const t = useTranslations("contentUi");
  const { finishNavigation } = useNavigation();
  const { runAnalysis } = useRunAnalysis();
  const { moduleProgressById, spaceProgress } = useContentProgress(
    data.space.spaceId,
    data.modules,
  );

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const assistantContext: AssistantContext = useMemo(
    () => ({
      surface: "user-guide",
      locale,
      pageContext: {
        route: data.space.route,
        view: "guide-grid",
        title: data.space.title,
        description: data.space.description,
        notes: [
          "context=user-guide-landing",
          `spaceId=${data.space.spaceId}`,
          `modules=${data.modules.length}`,
          `progress=${spaceProgress}`,
        ],
      },
    }),
    [data.modules.length, data.space, locale, spaceProgress],
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section aria-label={t("moduleGrid")} className="documentation-grid">
            {data.modules.map((module) => (
              <div key={module.moduleId} className="min-w-0 h-full">
                <UserGuideCard
                  module={module}
                  progress={moduleProgressById[module.moduleId] ?? 0}
                />
              </div>
            ))}
          </section>
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
