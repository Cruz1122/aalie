import AALIEEmotionIcon, {
  type AALIEEmotionIconName,
} from "@/components/AALIEEmotionIcon";
import type { ExampleCategory } from "@/lib/examples/catalog";

const CATEGORY_ICON_MAP: Record<ExampleCategory, AALIEEmotionIconName> = {
  iterative: "neutral",
  divide_and_conquer: "happy",
  decrease_and_conquer: "satisfied",
  decrease_and_get_conquered: "worried",
  dp_top_down: "thinking",
  dp_bottom_up: "focused",
  greedy: "alert",
  backtracking: "curious",
  branch_and_bound: "determined",
};

export default function AALIECategoryIcon({
  category,
  size = 44,
  className = "",
}: {
  category: ExampleCategory;
  size?: number;
  className?: string;
}) {
  return (
    <AALIEEmotionIcon
      name={CATEGORY_ICON_MAP[category]}
      size={size}
      className={className}
    />
  );
}
