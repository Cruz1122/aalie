import { redirect } from "next/navigation";

interface QuizzesSessionPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuizzesSessionPage({
  params,
  searchParams,
}: QuizzesSessionPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  qs.set("start", "1");

  for (const key of [
    "moduleId",
    "moduleTitle",
    "count",
    "questionCount",
    "topics",
    "topicIds",
    "skills",
    "skillIds",
  ] as const) {
    const value = sp[key];
    if (typeof value === "string" && value.trim().length > 0) {
      qs.set(key, value);
    }
  }

  redirect(`/${locale}/quizzes?${qs.toString()}`);
}
