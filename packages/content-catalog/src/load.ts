import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CatalogModule,
  CatalogSpace,
  ContentBlock,
  LoadedModule,
  LoadedSpaceBundle,
  ResolvedTarget,
  TargetRef,
} from "./types.js";

const SRC_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(SRC_DIR, "..");
export const DEFAULT_CATALOG_ROOT = path.join(PACKAGE_ROOT, "catalog");
export const DEFAULT_SCHEMAS_ROOT = path.join(PACKAGE_ROOT, "schemas");
export const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function deriveSpaceRoute(space: CatalogSpace): string {
  return `/${space.slug}`;
}

export function deriveModuleRoute(
  space: CatalogSpace,
  module: CatalogModule,
): string {
  return `${deriveSpaceRoute(space)}/${module.slug}`;
}

export function walkBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case "note":
      case "callout":
      case "definition":
      case "theorem":
      case "proof":
      case "example":
      case "exerciseSolution":
      case "evidenceBlock":
        return [block, ...walkBlocks(block.blocks)];
      default:
        return [block];
    }
  });
}

export function loadModule(filePath: string): LoadedModule {
  return {
    filePath,
    module: readJsonFile<CatalogModule>(filePath),
  };
}

export function loadSpaceBundle(spaceDirectory: string): LoadedSpaceBundle {
  const spaceFilePath = path.join(spaceDirectory, "space.json");
  const modulesDirectory = path.join(spaceDirectory, "modules");
  const moduleFiles = fs.existsSync(modulesDirectory)
    ? fs
        .readdirSync(modulesDirectory)
        .filter((entry) => entry.endsWith(".module.json"))
        .sort()
        .map((entry) => path.join(modulesDirectory, entry))
    : [];

  const space = readJsonFile<CatalogSpace>(spaceFilePath);
  const modules = moduleFiles.map(loadModule).sort((left, right) => {
    if (left.module.order === right.module.order) {
      return left.module.slug.localeCompare(right.module.slug);
    }
    return left.module.order - right.module.order;
  });

  return {
    directory: spaceDirectory,
    spaceFilePath,
    space,
    modules,
  };
}

export interface GetSpaceBundleOptions {
  catalogRoot?: string;
}

export function getSpaceBundle(
  spaceId: string,
  locale: string,
  options: GetSpaceBundleOptions = {},
): LoadedSpaceBundle {
  const { catalogRoot = DEFAULT_CATALOG_ROOT } = options;
  const spaceDirectory = path.join(catalogRoot, "spaces", spaceId, locale);
  const spaceFilePath = path.join(spaceDirectory, "space.json");

  if (!fs.existsSync(spaceFilePath)) {
    throw new Error(
      `Content space ${spaceId} with locale ${locale} was not found at ${spaceFilePath}`,
    );
  }

  return loadSpaceBundle(spaceDirectory);
}

export function getModuleBySlug(
  bundle: LoadedSpaceBundle,
  slug: string,
): LoadedModule | null {
  return (
    bundle.modules.find((loadedModule) => loadedModule.module.slug === slug) ?? null
  );
}

export function resolveTarget(
  bundle: LoadedSpaceBundle,
  target: TargetRef,
): ResolvedTarget | null {
  if (target.kind === "external") {
    return null;
  }

  for (const loadedModule of bundle.modules) {
    const { module } = loadedModule;

    if (target.kind === "module" && module.moduleId === target.ref) {
      return { kind: "module", ref: target.ref, title: module.title };
    }

    if (target.kind === "resource") {
      const resource = [
        ...(module.resources?.images ?? []),
        ...(module.resources?.figures ?? []),
        ...(module.resources?.references ?? []),
      ].find((item) => item.resourceId === target.ref);

      if (resource) {
        return {
          kind: "resource",
          ref: target.ref,
          title: "label" in resource ? resource.label : resource.caption,
        };
      }
    }

    if (target.kind === "term") {
      const term = (module.terms ?? []).find((item) => item.termId === target.ref);
      if (term) {
        return { kind: "term", ref: target.ref, title: term.label };
      }
    }

    for (const chapter of module.chapters) {
      if (target.kind === "chapter" && chapter.chapterId === target.ref) {
        return { kind: "chapter", ref: target.ref, title: chapter.title };
      }

      for (const section of chapter.sections) {
        if (target.kind === "section" && section.sectionId === target.ref) {
          return { kind: "section", ref: target.ref, title: section.title };
        }

        if (target.kind === "block") {
          const found = walkBlocks(section.blocks).find(
            (block) => block.id === target.ref,
          );
          if (found) {
            return { kind: "block", ref: target.ref };
          }
        }
      }
    }
  }

  return null;
}
