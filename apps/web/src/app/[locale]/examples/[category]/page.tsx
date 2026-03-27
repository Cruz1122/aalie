import { notFound } from "next/navigation";

import { ExamplesCategoryView } from "@/components/examples/ExamplesCategoryView";
import {
  EXAMPLE_CATEGORY_ORDER,
  isExampleCategory,
  type ExampleCategory,
} from "@/lib/examples/catalog";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export function generateStaticParams() {
  return EXAMPLE_CATEGORY_ORDER.map((category) => ({ category }));
}

export default function ExampleCategoryPage({ params }: CategoryPageProps) {
  if (!isExampleCategory(params.category)) {
    notFound();
  }

  return <ExamplesCategoryView category={params.category as ExampleCategory} />;
}
