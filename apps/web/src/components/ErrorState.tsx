"use client";

interface ErrorStateCopy {
  readonly eyebrow?: string;
  readonly title: string;
  readonly homeLabel: string;
  readonly retryLabel?: string;
}

interface ErrorStateProps {
  readonly icon: string;
  readonly accentClass: string;
  readonly copy: ErrorStateCopy;
  readonly homeHref: string;
  readonly onHome?: () => void;
  readonly onRetry?: () => void;
  readonly contained?: boolean;
  readonly compact?: boolean;
}

export default function ErrorState({
  icon,
  accentClass,
  copy,
  homeHref,
  onHome,
  onRetry,
  contained = false,
  compact = false,
}: ErrorStateProps) {
  const actionClass =
    "rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.12]";

  const Tag = contained ? "div" : "main";

  return (
    <Tag
      className={
        contained
          ? "flex w-full flex-1 items-center justify-center px-6 py-16 text-center text-white"
          : "flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#101a23] px-6 py-12 text-center text-white"
      }
    >
      <div className="error-state-content flex w-full max-w-xl flex-col items-center">
        <div
          className={`error-state-icon ${compact ? "mb-4" : "mb-8"} ${accentClass}`}
          aria-hidden="true"
        >
          <span
            className="material-symbols-outlined leading-none"
            style={{
              fontSize: compact ? "3rem" : "clamp(5rem, 12vw, 8rem)",
            }}
          >
            {icon}
          </span>
        </div>
        {copy.eyebrow ? (
          <p
            className={`mb-3 text-sm font-bold uppercase tracking-[0.3em] ${accentClass}`}
          >
            {copy.eyebrow}
          </p>
        ) : null}
        <h1
          className={
            compact
              ? "mb-4 text-xl font-semibold tracking-tight text-slate-200"
              : "mb-4 text-3xl font-bold tracking-tight sm:text-5xl"
          }
        >
          {copy.title}
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {onHome ? (
            <button type="button" onClick={onHome} className={actionClass}>
              {copy.homeLabel}
            </button>
          ) : (
            <a href={homeHref} className={actionClass}>
              {copy.homeLabel}
            </a>
          )}
          {onRetry && copy.retryLabel ? (
            <button
              type="button"
              onClick={onRetry}
              className={`rounded-lg border border-current/30 bg-current/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-current/20 ${accentClass}`}
            >
              {copy.retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </Tag>
  );
}
