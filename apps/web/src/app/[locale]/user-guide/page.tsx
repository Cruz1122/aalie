import { UserGuideLandingView } from "@/components/user-guide/UserGuideLandingView";
import { getUserGuideLandingData } from "@/lib/content/user-guide";

interface UserGuidePageProps {
  params: {
    locale: string;
  };
}

export default function UserGuidePage({ params }: UserGuidePageProps) {
  const data = getUserGuideLandingData(params.locale);
  return <UserGuideLandingView data={data} />;
}
