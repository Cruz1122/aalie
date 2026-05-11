import { Suspense } from "react";

import { QuizDashboardView } from "@/features/quizzes/dashboard/QuizDashboardView";
import { getCourseLandingData } from "@/lib/content/course";

interface QuizzesDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function QuizzesDashboardPage({
  params,
}: QuizzesDashboardPageProps) {
  const { locale } = await params;
  const data = getCourseLandingData(locale);
  const moduleTitleById = Object.fromEntries(
    data.modules.map((module) => [module.moduleId, module.title]),
  );
  return (
    <Suspense fallback={null}>
      <QuizDashboardView locale={locale} moduleTitleById={moduleTitleById} />
    </Suspense>
  );
}
