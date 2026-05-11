import type { LoadedSpaceBundle } from "@aa/content-catalog";

import {
  buildContentLandingDataFromBundle,
  buildContentModuleDataFromBundle,
} from "./catalog-transform";

export const buildUserGuideLandingDataFromBundle = (
  bundle: LoadedSpaceBundle,
) =>
  buildContentLandingDataFromBundle(bundle, {
    chapterRouteMode: "module-anchor",
  });

export function buildUserGuideModuleDataFromBundle(
  bundle: LoadedSpaceBundle,
  moduleSlug: string,
) {
  return buildContentModuleDataFromBundle(bundle, moduleSlug, {
    chapterRouteMode: "module-anchor",
  });
}
