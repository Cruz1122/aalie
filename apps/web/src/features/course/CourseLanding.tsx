"use client";

import { useEffect } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UserGuideCard } from "@/components/UserGuideCard";
import { useNavigation } from "@/contexts/NavigationContext";
import { useContentProgress } from "@/hooks/useContentProgress";
import type { ContentLandingData } from "@/lib/content/types";

interface CourseLandingProps {
  data: ContentLandingData;
  locale: string;
}

export function CourseLanding({ data, locale }: CourseLandingProps) {
  const { finishNavigation } = useNavigation();
  const { moduleProgressById } = useContentProgress(
    data.space.spaceId,
    data.modules,
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
      <Footer />
    </div>
  );
}
