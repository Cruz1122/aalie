import { notFound } from "next/navigation";

import { CourseChapterView } from "@/features/course/CourseChapterView";
import { routing } from "@/i18n/routing";
import {
  getCourseChapterData,
  getCourseChapterStaticParams,
} from "@/lib/content/course";

interface CourseChapterPageProps {
  params: Promise<{
    locale: string;
    moduleSlug: string;
    chapterSlug: string;
  }>;
}

export function generateStaticParams() {
  return getCourseChapterStaticParams(routing.locales);
}

export default async function CourseChapterPage({
  params,
}: CourseChapterPageProps) {
  const { locale, moduleSlug, chapterSlug } = await params;
  const data = getCourseChapterData(locale, moduleSlug, chapterSlug);

  if (!data) {
    notFound();
  }

  return <CourseChapterView data={data} />;
}
