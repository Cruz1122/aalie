"use client";

import type { RecursiveAnalysisStep } from "@aa/types";

import AAAnalysisStepCard from "./AAAnalysisStepCard";

interface AAAnalysisStepTimelineProps {
  steps: RecursiveAnalysisStep[];
}

export default function AAAnalysisStepTimeline({ steps }: Readonly<AAAnalysisStepTimelineProps>) {
  return (
    <div className="relative max-w-full space-y-4">
      <div className="pointer-events-none absolute bottom-4 left-4 top-4 z-0 w-px bg-gradient-to-b from-blue-400/40 via-blue-300/20 to-transparent" />
      {steps.map((step) => (
        <AAAnalysisStepCard key={step.id} step={step} />
      ))}
    </div>
  );
}
