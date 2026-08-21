"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type {
  AssistantContext,
  AssistantFeatureContext,
  AssistantGuideSectionContext,
  AssistantSurface,
} from "@/lib/assistant/types";

import { EmbeddedAssistantLauncher } from "./EmbeddedAssistantLauncher";

export interface EmbeddedAssistantStaticPageProps {
  surface: Extract<AssistantSurface, "about" | "privacy" | "terms">;
  route: string;
  title: string;
  description: string;
  notes?: string[];
  availableFeatures?: AssistantFeatureContext[];
  guideSection?: AssistantGuideSectionContext;
}

export function EmbeddedAssistantStaticPage({
  surface,
  route,
  title,
  description,
  notes,
  availableFeatures,
  guideSection,
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
        notes: [`page=${surface}`, ...(notes ?? [])],
      },
      ...(availableFeatures?.length ? { availableFeatures } : {}),
      ...(guideSection ? { guideSection } : {}),
    }),
    [
      surface,
      locale,
      route,
      title,
      description,
      notes,
      availableFeatures,
      guideSection,
    ],
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
