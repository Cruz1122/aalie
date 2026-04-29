import AALIEEmotionIcon, {
  type AALIEEmotionIconName,
} from "@/components/AALIEEmotionIcon";
import type { ExampleCategory } from "@/lib/examples/catalog";

const CATEGORY_ICON_MAP: Record<ExampleCategory, AALIEEmotionIconName> = {
  iterativos: "neutral",
  "divide-y-venceras": "happy",
  "resta-y-venceras": "satisfied",
  "resta-y-seras-vencido": "worried",
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
