import { UserGuideLandingView } from "@/components/user-guide/UserGuideLandingView";
import { getUserGuideLandingData } from "@/lib/content/user-guide";

interface UserGuidePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function UserGuidePage({ params }: UserGuidePageProps) {
  const { locale } = await params;
  const data = getUserGuideLandingData(locale);
  return <UserGuideLandingView data={data} />;
}
