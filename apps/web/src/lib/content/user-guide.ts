import "server-only";

import { getSpaceBundle, validateCatalog } from "@aa/content-catalog/server";
import type { LoadedSpaceBundle } from "@aa/content-catalog/types";
import { cache } from "react";

import {
  buildUserGuideLandingDataFromBundle,
  buildUserGuideModuleDataFromBundle,
} from "./user-guide-transform";

export const USER_GUIDE_SPACE_ID = "user-guide";
export const USER_GUIDE_FALLBACK_LOCALE = "es";

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

function tryLoadUserGuideBundle(locale: string): LoadedSpaceBundle | null {
  try {
    return getSpaceBundle(USER_GUIDE_SPACE_ID, locale);
  } catch {
    return null;
  }
}

const loadUserGuideBundle = cache((locale: string): LoadedSpaceBundle => {
  ensureValidCatalog();
  return (
    tryLoadUserGuideBundle(locale) ??
    tryLoadUserGuideBundle(USER_GUIDE_FALLBACK_LOCALE) ??
    getSpaceBundle(USER_GUIDE_SPACE_ID, locale)
  );
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
  const fallbackBundle = loadUserGuideBundle(USER_GUIDE_FALLBACK_LOCALE);

  return locales.flatMap((locale) =>
    (tryLoadUserGuideBundle(locale) ?? fallbackBundle).modules.map(
      ({ module }) => ({
        locale,
        moduleSlug: module.slug,
      }),
    ),
  );
}
