import type { AALIEEmotionIconName } from "@/components/AALIEEmotionIcon";

import type { TechniqueId, TechniqueTone } from "./techniqueTypes";

export type TechniquePresentation = {
  title: string;
  shortMessage: string;
  icon: AALIEEmotionIconName;
  tone: TechniqueTone;
  plainMeaning: string;
  howToRecognize: string[];
  whyItMatters: string;
  commonMistake: string;
};

type TechniqueTranslator = (key: string) => string;

export function getTechniquePresentation(
  t: TechniqueTranslator,
): Record<TechniqueId, TechniquePresentation> {
  return {
    divide_and_conquer: {
      title: t("divide_and_conquer.title"),
      shortMessage: t("divide_and_conquer.shortMessage"),
      icon: "happy",
      tone: "positive",
      plainMeaning: t("divide_and_conquer.plainMeaning"),
      howToRecognize: [
        t("divide_and_conquer.howToRecognize.0"),
        t("divide_and_conquer.howToRecognize.1"),
        t("divide_and_conquer.howToRecognize.2"),
      ],
      whyItMatters: t("divide_and_conquer.whyItMatters"),
      commonMistake: t("divide_and_conquer.commonMistake"),
    },
    decrease_and_conquer: {
      title: t("decrease_and_conquer.title"),
      shortMessage: t("decrease_and_conquer.shortMessage"),
      icon: "satisfied",
      tone: "positive",
      plainMeaning: t("decrease_and_conquer.plainMeaning"),
      howToRecognize: [
        t("decrease_and_conquer.howToRecognize.0"),
        t("decrease_and_conquer.howToRecognize.1"),
        t("decrease_and_conquer.howToRecognize.2"),
      ],
      whyItMatters: t("decrease_and_conquer.whyItMatters"),
      commonMistake: t("decrease_and_conquer.commonMistake"),
    },
    decrease_and_be_conquered: {
      title: t("decrease_and_be_conquered.title"),
      shortMessage: t("decrease_and_be_conquered.shortMessage"),
      icon: "worried",
      tone: "critical",
      plainMeaning: t("decrease_and_be_conquered.plainMeaning"),
      howToRecognize: [
        t("decrease_and_be_conquered.howToRecognize.0"),
        t("decrease_and_be_conquered.howToRecognize.1"),
        t("decrease_and_be_conquered.howToRecognize.2"),
        t("decrease_and_be_conquered.howToRecognize.3"),
      ],
      whyItMatters: t("decrease_and_be_conquered.whyItMatters"),
      commonMistake: t("decrease_and_be_conquered.commonMistake"),
    },
    dp_top_down: {
      title: t("dp_top_down.title"),
      shortMessage: t("dp_top_down.shortMessage"),
      icon: "thinking",
      tone: "positive",
      plainMeaning: t("dp_top_down.plainMeaning"),
      howToRecognize: [
        t("dp_top_down.howToRecognize.0"),
        t("dp_top_down.howToRecognize.1"),
        t("dp_top_down.howToRecognize.2"),
      ],
      whyItMatters: t("dp_top_down.whyItMatters"),
      commonMistake: t("dp_top_down.commonMistake"),
    },
    dp_bottom_up: {
      title: t("dp_bottom_up.title"),
      shortMessage: t("dp_bottom_up.shortMessage"),
      icon: "focused",
      tone: "positive",
      plainMeaning: t("dp_bottom_up.plainMeaning"),
      howToRecognize: [
        t("dp_bottom_up.howToRecognize.0"),
        t("dp_bottom_up.howToRecognize.1"),
        t("dp_bottom_up.howToRecognize.2"),
      ],
      whyItMatters: t("dp_bottom_up.whyItMatters"),
      commonMistake: t("dp_bottom_up.commonMistake"),
    },
    greedy: {
      title: t("greedy.title"),
      shortMessage: t("greedy.shortMessage"),
      icon: "alert",
      tone: "warning",
      plainMeaning: t("greedy.plainMeaning"),
      howToRecognize: [
        t("greedy.howToRecognize.0"),
        t("greedy.howToRecognize.1"),
        t("greedy.howToRecognize.2"),
      ],
      whyItMatters: t("greedy.whyItMatters"),
      commonMistake: t("greedy.commonMistake"),
    },
    backtracking: {
      title: t("backtracking.title"),
      shortMessage: t("backtracking.shortMessage"),
      icon: "curious",
      tone: "neutral",
      plainMeaning: t("backtracking.plainMeaning"),
      howToRecognize: [
        t("backtracking.howToRecognize.0"),
        t("backtracking.howToRecognize.1"),
        t("backtracking.howToRecognize.2"),
        t("backtracking.howToRecognize.3"),
      ],
      whyItMatters: t("backtracking.whyItMatters"),
      commonMistake: t("backtracking.commonMistake"),
    },
    branch_and_bound: {
      title: t("branch_and_bound.title"),
      shortMessage: t("branch_and_bound.shortMessage"),
      icon: "determined",
      tone: "positive",
      plainMeaning: t("branch_and_bound.plainMeaning"),
      howToRecognize: [
        t("branch_and_bound.howToRecognize.0"),
        t("branch_and_bound.howToRecognize.1"),
        t("branch_and_bound.howToRecognize.2"),
      ],
      whyItMatters: t("branch_and_bound.whyItMatters"),
      commonMistake: t("branch_and_bound.commonMistake"),
    },
    iterative: {
      title: t("iterative.title"),
      shortMessage: t("iterative.shortMessage"),
      icon: "neutral",
      tone: "neutral",
      plainMeaning: t("iterative.plainMeaning"),
      howToRecognize: [
        t("iterative.howToRecognize.0"),
        t("iterative.howToRecognize.1"),
        t("iterative.howToRecognize.2"),
      ],
      whyItMatters: t("iterative.whyItMatters"),
      commonMistake: t("iterative.commonMistake"),
    },
    unknown: {
      title: t("unknown.title"),
      shortMessage: t("unknown.shortMessage"),
      icon: "confused",
      tone: "neutral",
      plainMeaning: t("unknown.plainMeaning"),
      howToRecognize: [
        t("unknown.howToRecognize.0"),
        t("unknown.howToRecognize.1"),
        t("unknown.howToRecognize.2"),
      ],
      whyItMatters: t("unknown.whyItMatters"),
      commonMistake: t("unknown.commonMistake"),
    },
  };
}
