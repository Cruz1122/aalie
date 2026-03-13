"use client";

import { useTranslations } from "next-intl";

interface TraceStatusBannerProps {
  loading: boolean;
  error: string | null;
  truncated?: boolean;
  truncationReason?: string | null;
  showLoading?: boolean;
}

/**
 * Banner de estado del trace: spinner, error, aviso de truncamiento.
 * Usa useTranslations para todos los textos.
 *
 * @author Plan refactor subsistema trace (Bloque G)
 * @version 0.1.0
 */
export default function TraceStatusBanner({
  loading,
  error,
  truncated = false,
  truncationReason,
  showLoading = true,
}: TraceStatusBannerProps) {
  const t = useTranslations("analyzer.executionTrace");

  if ((!loading || !showLoading) && !error && !truncated) return null;

  return (
    <div className="flex flex-col gap-2 mb-3">
      {loading && showLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          <span>{t("executingTrace")}</span>
        </div>
      )}
      {error && (
        <div className="glass-card p-3 rounded-lg bg-red-900/20 border border-red-500/30">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      {truncated && truncationReason && (
        <div className="glass-card p-3 rounded-lg bg-amber-900/20 border border-amber-500/30">
          <p className="text-sm text-amber-200">
            {t("truncationWarning", { reason: truncationReason })}
          </p>
        </div>
      )}
    </div>
  );
}
