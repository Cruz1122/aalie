"use client";

import { useTranslations } from "next-intl";

import type { HardwareSuitabilityReport } from "@/lib/hardware/types";

import BaseModalContainer from "./modals/BaseModalContainer";

interface GPUCPUModalProps {
  open: boolean;
  onClose: () => void;
  analysis: HardwareSuitabilityReport | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ConfidenceBadge({
  confidence,
}: Readonly<{ confidence: HardwareSuitabilityReport["confidence"] }>) {
  const colors: Record<string, string> = {
    high: "bg-green-500/20 border-green-500/40 text-green-300",
    medium: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    low: "bg-red-500/20 border-red-500/40 text-red-300",
  };
  const labels: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[confidence]}`}
    >
      {labels[confidence] ?? confidence}
    </span>
  );
}

function RecommendationBadge({
  rec,
}: Readonly<{ rec: HardwareSuitabilityReport["primaryRecommendation"] }>) {
  const colors: Record<string, string> = {
    gpu: "bg-purple-500/20 border-purple-500/40 text-purple-200",
    cpu: "bg-blue-500/20 border-blue-500/40 text-blue-200",
    hybrid: "bg-cyan-500/20 border-cyan-500/40 text-cyan-200",
  };
  const labels: Record<string, string> = {
    gpu: "GPU",
    cpu: "CPU",
    hybrid: "Híbrido",
  };
  const icons: Record<string, string> = {
    gpu: "memory",
    cpu: "developer_board",
    hybrid: "merge",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${colors[rec]}`}
    >
      <span className="material-symbols-outlined text-2xl">{icons[rec]}</span>
      <span className="text-xl font-bold">
        {labels[rec] ?? rec.toUpperCase()}
      </span>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: Readonly<{ label: string; value: number; color: string }>) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  icon,
  color,
}: Readonly<{ title: string; items: string[]; icon: string; color: string }>) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        className={`flex items-center gap-2 mb-2 text-xs font-semibold ${color} uppercase tracking-wide`}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-0.5 text-slate-500 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatternChip({
  name,
  confidence,
}: Readonly<{ name: string; confidence: number }>) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
      <span className="material-symbols-outlined text-sm text-slate-400">
        pattern
      </span>
      <span>{name}</span>
      <span className="text-slate-500">({(confidence * 100).toFixed(0)}%)</span>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────

function GPUCPUContent({
  analysis,
  t,
}: Readonly<{
  analysis: HardwareSuitabilityReport;
  t: (key: string) => string;
}>) {
  const {
    scores,
    reasons,
    detectedPatterns,
    diagnostics,
    confidence,
    primaryRecommendation,
    summary,
  } = analysis;

  return (
    <div className="space-y-6">
      {/* Header: Recommendation + Confidence */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/10">
        <RecommendationBadge rec={primaryRecommendation} />
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {t("confidence")}:
            </span>
            <ConfidenceBadge confidence={confidence} />
          </div>
          <p className="text-sm text-slate-300 mt-1">{summary}</p>
        </div>
      </div>

      {/* Score bars */}
      <div className="glass-card p-4 rounded-xl border border-white/10 space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
          {t("scores")}
        </p>
        <ScoreBar label="GPU" value={scores.gpu} color="bg-purple-500" />
        <ScoreBar label="CPU" value={scores.cpu} color="bg-blue-500" />
        <ScoreBar
          label={t("hybrid")}
          value={scores.hybrid}
          color="bg-cyan-500"
        />
      </div>

      {/* Blockers — always visible if present */}
      {reasons.blockers.length > 0 && (
        <div className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <ListSection
            title={t("blockers")}
            items={reasons.blockers}
            icon="block"
            color="text-red-400"
          />
        </div>
      )}

      {/* Positive/Negative/Opportunities */}
      <div className="glass-card p-4 rounded-xl border border-white/10 space-y-4">
        <ListSection
          title={t("positive")}
          items={reasons.positive}
          icon="check_circle"
          color="text-green-400"
        />
        <ListSection
          title={t("negative")}
          items={reasons.negative}
          icon="warning"
          color="text-yellow-400"
        />
        <ListSection
          title={t("opportunities")}
          items={reasons.opportunities}
          icon="lightbulb"
          color="text-purple-400"
        />
      </div>

      {/* Detected Patterns */}
      {detectedPatterns.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
            {t("patterns")}
          </p>
          <div className="flex flex-wrap gap-2">
            {detectedPatterns.map((p, i) => (
              <PatternChip key={i} name={p.name} confidence={p.confidence} />
            ))}
          </div>
        </div>
      )}

      {/* Diagnostics */}
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
          {t("diagnostics")}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(
            [
              ["controlRegularity", diagnostics.controlRegularity],
              ["memoryRegularity", diagnostics.memoryRegularity],
              ["dependencyStrength", diagnostics.dependencyStrength],
              ["parallelismType", diagnostics.parallelismType],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-slate-500 capitalize">
                {k.replace(/([A-Z])/g, " $1")}
              </span>
              <span className="text-slate-200 font-medium capitalize">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex justify-end">
        <div className="relative group">
          <button
            className="w-5 h-5 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 hover:bg-slate-500/30 flex items-center justify-center text-xs font-semibold transition-colors"
            title={t("disclaimerTitle")}
          >
            ?
          </button>
          <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-800 border border-slate-500/30 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-left">
            <div className="text-slate-300">{t("disclaimer")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

export default function GPUCPUModal({
  open,
  onClose,
  analysis,
}: Readonly<GPUCPUModalProps>) {
  const t = useTranslations("analyzer.gpuCpuModal");

  if (!open || !analysis) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="speed"
      closeAriaLabel={t("closeModal")}
      zIndexClassName="z-[70]"
      sizeClassName="w-[95vw] sm:w-[85vw] max-w-3xl h-[85vh] max-h-[85dvh]"
      panelClassName="mx-2 sm:mx-4 overscroll-contain"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-custom">
        <GPUCPUContent analysis={analysis} t={t} />
      </div>
    </BaseModalContainer>
  );
}
