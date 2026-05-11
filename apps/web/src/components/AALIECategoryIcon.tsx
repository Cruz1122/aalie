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

/** Misma paleta que badges de técnica en `ExampleCatalogCard` (ITER, DyV, …). */
const CATEGORY_ICON_COLOR: Record<ExampleCategory, string> = {
  iterative: "text-sky-300",
  divide_and_conquer: "text-emerald-300",
  decrease_and_conquer: "text-lime-300",
  decrease_and_get_conquered: "text-amber-300",
  dp_top_down: "text-fuchsia-300",
  dp_bottom_up: "text-violet-300",
  greedy: "text-rose-300",
  backtracking: "text-cyan-300",
  branch_and_bound: "text-orange-300",
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
  const tone = CATEGORY_ICON_COLOR[category];
  const merged = [tone, className].filter(Boolean).join(" ");
  return (
    <AALIEEmotionIcon
      name={CATEGORY_ICON_MAP[category]}
      size={size}
      className={merged}
    />
  );
}
