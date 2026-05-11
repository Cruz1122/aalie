import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ExamplesCategoryView } from "@/components/examples/ExamplesCategoryView";
import {
  EXAMPLE_CATEGORY_ORDER,
  EXAMPLE_CATEGORY_META,
  getCategoryBySlug,
  LEGACY_CATEGORY_REDIRECTS,
} from "@/lib/examples/catalog";

interface CategoryPageProps {
  params: {
    locale: string;
    category: string;
  };
}

export function generateStaticParams() {
  return EXAMPLE_CATEGORY_ORDER.map((category) => ({
    category: EXAMPLE_CATEGORY_META[category].slug,
  }));
}

export default function ExampleCategoryPage({ params }: CategoryPageProps) {
  const legacyRedirect = LEGACY_CATEGORY_REDIRECTS[params.category];

  if (legacyRedirect) {
    redirect(`/${params.locale}/examples/${legacyRedirect}`);
  }

  const category = getCategoryBySlug(params.category);

  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ExamplesCategoryView category={category} />
    </Suspense>
  );
}
