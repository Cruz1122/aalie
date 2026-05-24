import { Suspense } from "react";

import { ExamplesHomeView } from "@/components/examples/ExamplesHomeView";

interface ExamplesPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function ExamplesPage({
  searchParams,
}: ExamplesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page ?? "1");

  return (
    <Suspense fallback={null}>
      <ExamplesHomeView page={page} />
    </Suspense>
  );
}
