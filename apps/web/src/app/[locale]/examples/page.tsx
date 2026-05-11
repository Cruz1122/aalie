import { Suspense } from "react";

import { ExamplesHomeView } from "@/components/examples/ExamplesHomeView";

interface ExamplesPageProps {
  searchParams?: {
    page?: string;
  };
}

export default function ExamplesPage({ searchParams }: ExamplesPageProps) {
  const page = Number(searchParams?.page ?? "1");

  return (
    <Suspense fallback={null}>
      <ExamplesHomeView page={page} />
    </Suspense>
  );
}
