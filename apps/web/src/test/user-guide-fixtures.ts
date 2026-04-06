import { getSpaceBundle } from "@aa/content-catalog";

import {
  buildUserGuideLandingDataFromBundle,
  buildUserGuideModuleDataFromBundle,
} from "@/lib/content/user-guide-transform";

export function getUserGuideLandingFixture(locale = "es") {
  return buildUserGuideLandingDataFromBundle(
    getSpaceBundle("user-guide", locale),
  );
}

export function getUserGuideModuleFixture(
  moduleSlug: string,
  locale = "es",
) {
  const data = buildUserGuideModuleDataFromBundle(
    getSpaceBundle("user-guide", locale),
    moduleSlug,
  );

  if (!data) {
    throw new Error(`User guide module fixture not found for slug: ${moduleSlug}`);
  }

  return data;
}
