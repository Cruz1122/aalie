"use client";

import type { RecursiveAnalysisStep } from "@aa/types";

import AAAnalysisStepCard from "./AAAnalysisStepCard";

interface AAAnalysisStepTimelineProps {
  steps: RecursiveAnalysisStep[];
  accent?: "blue" | "purple" | "orange" | "cyan";
}

export default function AAAnalysisStepTimeline({
  steps,
  accent = "blue",
}: Readonly<AAAnalysisStepTimelineProps>) {
  const lineClassName =
    accent === "purple"
      ? "pointer-events-none absolute bottom-4 left-4 top-4 z-0 w-px bg-gradient-to-b from-violet-400/40 via-violet-300/20 to-transparent"
      : accent === "cyan"
        ? "pointer-events-none absolute bottom-4 left-4 top-4 z-0 w-px bg-gradient-to-b from-cyan-400/45 via-cyan-300/25 to-transparent"
      : accent === "orange"
        ? "pointer-events-none absolute bottom-4 left-4 top-4 z-0 w-px bg-gradient-to-b from-orange-400/45 via-orange-300/25 to-transparent"
      : "pointer-events-none absolute bottom-4 left-4 top-4 z-0 w-px bg-gradient-to-b from-blue-400/40 via-blue-300/20 to-transparent";
  return (
    <div className="relative max-w-full space-y-4">
      <div className={lineClassName} />
      {steps.map((step) => (
        <AAAnalysisStepCard key={step.id} step={step} accent={accent} />
      ))}
    </div>
  );
}
