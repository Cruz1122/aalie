import AAButton from "@/components/AAButton";

interface SupportActionsBarProps {
  readonly onImport: () => void;
  readonly onAnalyze: () => void;
  readonly importLabel: string;
  readonly analyzeLabel: string;
  readonly isImporting?: boolean;
  readonly isAnalyzing?: boolean;
  readonly canAnalyze?: boolean;
  readonly extraActions?: React.ReactNode;
  readonly className?: string;
}

export function SupportActionsBar({
  onImport,
  onAnalyze,
  importLabel,
  analyzeLabel,
  isImporting = false,
  isAnalyzing = false,
  canAnalyze = true,
  extraActions,
  className,
}: Readonly<SupportActionsBarProps>) {
  return (
    <div
      className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onImport}
          disabled={isImporting}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[13px] font-medium transition-all hover:scale-[1.05] focus:outline-none focus:ring-1 focus:ring-slate-400/50 bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group text-slate-300"
          title={importLabel}
        >
          <span className="material-symbols-outlined text-base">
            {isImporting ? "progress_activity" : "upload"}
          </span>
        </button>
        <AAButton
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          variant="primary"
          size="sm"
          className="w-[95px] h-[32px] min-w-[95px] text-xs font-semibold px-2"
        >
          {analyzeLabel}
        </AAButton>
        {extraActions}
      </div>
    </div>
  );
}
