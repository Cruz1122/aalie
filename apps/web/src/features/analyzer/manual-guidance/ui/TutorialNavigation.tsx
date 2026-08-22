import { useTranslations } from "next-intl";

interface TutorialNavigationProps {
  readonly canGoBack: boolean;
  readonly canAdvance: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function TutorialNavigation({
  canGoBack,
  canAdvance,
  onBack,
  onNext,
  onSkip,
}: Readonly<TutorialNavigationProps>) {
  const t = useTranslations("analyzer.manualGuidance");
  return (
    <div className="mt-auto grid min-h-[52px] w-full grid-cols-3 items-center gap-3 pt-4">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="justify-self-start text-sm text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
      >
        {t("tutorial.previous")}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="justify-self-center text-sm text-slate-400 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
      >
        {t("tutorial.skipStep")}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="justify-self-end rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 motion-reduce:transition-none"
      >
        {t("tutorial.next")}
      </button>
    </div>
  );
}
