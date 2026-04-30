import { notFound } from "next/navigation";

import { CourseModuleView } from "@/features/course/CourseModuleView";
import { routing } from "@/i18n/routing";
import {
  getCourseModuleData,
  getCourseStaticParams,
} from "@/lib/content/course";

interface CourseModulePageProps {
  params: {
    locale: string;
    moduleSlug: string;
  };
}

export function generateStaticParams() {
  return getCourseStaticParams(routing.locales);
}

export default function CourseModulePage({ params }: CourseModulePageProps) {
  const data = getCourseModuleData(params.locale, params.moduleSlug);

  if (!data) {
    notFound();
  }

  return <CourseModuleView data={data} />;
}
