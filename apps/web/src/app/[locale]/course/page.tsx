import { CourseLanding } from "@/features/course/CourseLanding";
import { getCourseLandingData } from "@/lib/content/course";

interface CoursePageProps {
  params: {
    locale: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  const data = getCourseLandingData(params.locale);
  return <CourseLanding data={data} />;
}
