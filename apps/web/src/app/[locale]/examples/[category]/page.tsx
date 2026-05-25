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
  params: Promise<{
    locale: string;
    category: string;
  }>;
}

export function generateStaticParams() {
  return EXAMPLE_CATEGORY_ORDER.map((category) => ({
    category: EXAMPLE_CATEGORY_META[category].slug,
  }));
}

export default async function ExampleCategoryPage({
  params,
}: CategoryPageProps) {
  const { locale, category: categorySlug } = await params;
  const legacyRedirect = LEGACY_CATEGORY_REDIRECTS[categorySlug];

  if (legacyRedirect) {
    redirect(`/${locale}/examples/${legacyRedirect}`);
  }

  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ExamplesCategoryView category={category} />
    </Suspense>
  );
}
