import { useTranslations } from "next-intl";

import { TutorialNavigation } from "./TutorialNavigation";

interface TutorialWelcomeProps {
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly canAdvance: boolean;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function TutorialWelcome({
  canGoBack,
  onBack,
  canAdvance,
  onNext,
  onSkip,
}: Readonly<TutorialWelcomeProps>) {
  const t = useTranslations("analyzer.manualGuidance");

  return (
    <section
      aria-labelledby="manual-tutorial-welcome-title"
      className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center bg-[#101a23] p-5 text-center"
    >
      <div className="manual-tutorial-step-content flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6">
        <span
          className="manual-waving-hand material-symbols-outlined text-cyan-300"
          aria-hidden="true"
          style={{ fontSize: 72, lineHeight: 1 }}
        >
          waving_hand
        </span>
        <div className="manual-tutorial-step-card">
          <h2
            id="manual-tutorial-welcome-title"
            className="text-2xl font-bold tracking-tight text-white"
          >
            {t("welcome.title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {t("welcome.description")}
          </p>
        </div>
      </div>
      <TutorialNavigation
        canGoBack={canGoBack}
        canAdvance={canAdvance}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
      />
    </section>
  );
}
