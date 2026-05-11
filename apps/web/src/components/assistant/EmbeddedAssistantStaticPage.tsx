"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext, AssistantSurface } from "@/lib/assistant/types";

import { EmbeddedAssistantLauncher } from "./EmbeddedAssistantLauncher";

export interface EmbeddedAssistantStaticPageProps {
  surface: Extract<AssistantSurface, "about" | "privacy">;
  route: string;
  title: string;
  description: string;
}

export function EmbeddedAssistantStaticPage({
  surface,
  route,
  title,
  description,
}: EmbeddedAssistantStaticPageProps) {
  const locale = useLocale();
  const { runAnalysis } = useRunAnalysis();

  const assistantContext = useMemo<AssistantContext>(
    () => ({
      surface,
      locale,
      pageContext: {
        route,
        view: "static",
        title,
        description,
        notes: [`page=${surface}`],
      },
    }),
    [surface, locale, route, title, description],
  );

  return (
    <EmbeddedAssistantLauncher
      surface={surface}
      assistantContext={assistantContext}
      onAnalyzeCode={(code) => {
        void runAnalysis(code);
      }}
    />
  );
}
