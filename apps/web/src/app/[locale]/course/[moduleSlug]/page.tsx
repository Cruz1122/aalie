import { notFound } from "next/navigation";

import { CourseModuleView } from "@/features/course/CourseModuleView";
import { routing } from "@/i18n/routing";
import {
  getCourseModuleData,
  getCourseStaticParams,
} from "@/lib/content/course";

interface CourseModulePageProps {
  params: Promise<{
    locale: string;
    moduleSlug: string;
  }>;
}

export function generateStaticParams() {
  return getCourseStaticParams(routing.locales);
}

export default async function CourseModulePage({
  params,
}: CourseModulePageProps) {
  const { locale, moduleSlug } = await params;
  const data = getCourseModuleData(locale, moduleSlug);

  if (!data) {
    notFound();
  }

  return <CourseModuleView data={data} />;
}
