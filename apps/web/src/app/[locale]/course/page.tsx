import { CourseLanding } from "@/features/course/CourseLanding";
import { getCourseLandingData } from "@/lib/content/course";

interface CoursePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { locale } = await params;
  const data = getCourseLandingData(locale);
  return <CourseLanding data={data} locale={locale} />;
}
