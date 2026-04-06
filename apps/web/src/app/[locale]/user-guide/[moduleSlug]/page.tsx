import { notFound } from "next/navigation";

import { UserGuideModuleView } from "@/components/user-guide/UserGuideModuleView";
import { routing } from "@/i18n/routing";
import {
  getUserGuideModuleData,
  getUserGuideStaticParams,
} from "@/lib/content/user-guide";

interface UserGuideModulePageProps {
  params: {
    locale: string;
    moduleSlug: string;
  };
}

export function generateStaticParams() {
  return getUserGuideStaticParams(routing.locales);
}

export default function UserGuideModulePage({
  params,
}: UserGuideModulePageProps) {
  const data = getUserGuideModuleData(params.locale, params.moduleSlug);

  if (!data) {
    notFound();
  }

  return <UserGuideModuleView data={data} />;
}
