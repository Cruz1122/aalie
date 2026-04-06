import fs from "node:fs";
import path from "node:path";

import { DEFAULT_CATALOG_ROOT, loadSpaceBundle } from "./load.js";
import type { LoadedSpaceBundle } from "./types.js";

export interface DiscoverOptions {
  includeDrafts?: boolean;
  catalogRoot?: string;
}

export function discoverSpaces(
  options: DiscoverOptions = {},
): LoadedSpaceBundle[] {
  const { includeDrafts = false, catalogRoot = DEFAULT_CATALOG_ROOT } = options;
  const spacesRoot = path.join(catalogRoot, "spaces");

  if (!fs.existsSync(spacesRoot)) {
    return [];
  }

  const discovered: LoadedSpaceBundle[] = [];

  for (const spaceId of fs.readdirSync(spacesRoot).sort()) {
    const spaceDirectory = path.join(spacesRoot, spaceId);
    if (!fs.statSync(spaceDirectory).isDirectory()) {
      continue;
    }

    for (const locale of fs.readdirSync(spaceDirectory).sort()) {
      const localeDirectory = path.join(spaceDirectory, locale);
      if (!fs.statSync(localeDirectory).isDirectory()) {
        continue;
      }

      const spaceFile = path.join(localeDirectory, "space.json");
      if (!fs.existsSync(spaceFile)) {
        continue;
      }

      const bundle = loadSpaceBundle(localeDirectory);
      if (!includeDrafts && bundle.space.status !== "published") {
        continue;
      }

      bundle.modules = bundle.modules.filter(
        ({ module }) => includeDrafts || module.status === "published",
      );
      discovered.push(bundle);
    }
  }

  return discovered.sort((left, right) => {
    const leftKey = `${left.space.slug}:${left.space.locale}`;
    const rightKey = `${right.space.slug}:${right.space.locale}`;
    return leftKey.localeCompare(rightKey);
  });
}
