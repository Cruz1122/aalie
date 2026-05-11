import { notFound } from "next/navigation";

import { CourseChapterView } from "@/features/course/CourseChapterView";
import { routing } from "@/i18n/routing";
import {
  getCourseChapterData,
  getCourseChapterStaticParams,
} from "@/lib/content/course";

interface CourseChapterPageProps {
  params: {
    locale: string;
    moduleSlug: string;
    chapterSlug: string;
  };
}

export function generateStaticParams() {
  return getCourseChapterStaticParams(routing.locales);
}

export default function CourseChapterPage({ params }: CourseChapterPageProps) {
  const data = getCourseChapterData(
    params.locale,
    params.moduleSlug,
    params.chapterSlug,
  );

  if (!data) {
    notFound();
  }

  return <CourseChapterView data={data} />;
}
