import "server-only";

import { getSpaceBundle, validateCatalog, type LoadedSpaceBundle } from "@aa/content-catalog";
import { cache } from "react";


import {
  buildUserGuideLandingDataFromBundle,
  buildUserGuideModuleDataFromBundle,
} from "./user-guide-transform";

export const USER_GUIDE_SPACE_ID = "user-guide";

const ensureValidCatalog = cache(() => {
  const report = validateCatalog();
  if (!report.valid) {
    const firstError = report.errors[0];
    throw new Error(
      `Content catalog is invalid: ${firstError?.code ?? "UNKNOWN"} ${firstError?.message ?? "unknown error"}`,
    );
  }
  return report;
});

const loadUserGuideBundle = cache((locale: string): LoadedSpaceBundle => {
  ensureValidCatalog();
  return getSpaceBundle(USER_GUIDE_SPACE_ID, locale);
});

export function getUserGuideLandingData(locale: string) {
  return buildUserGuideLandingDataFromBundle(loadUserGuideBundle(locale));
}

export function getUserGuideModuleData(locale: string, moduleSlug: string) {
  return buildUserGuideModuleDataFromBundle(
    loadUserGuideBundle(locale),
    moduleSlug,
  );
}

export function getUserGuideStaticParams(locales: readonly string[]) {
  return locales.flatMap((locale) =>
    loadUserGuideBundle(locale).modules.map(({ module }) => ({
      locale,
      moduleSlug: module.slug,
    })),
  );
}
