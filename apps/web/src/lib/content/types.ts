import type {
  CatalogModule,
  SearchIndexEntry,
} from "@aa/content-catalog";

export interface ContentSpaceSummary {
  spaceId: string;
  slug: string;
  title: string;
  description?: string;
  locale: string;
  route: string;
}

export interface ContentModuleSummary {
  moduleId: string;
  slug: string;
  title: string;
  shortTitle?: string;
  summary?: string;
  difficulty?: CatalogModule["difficulty"];
  estimatedMinutes?: number;
  tags: string[];
  order: number;
  route: string;
  totalSections: number;
  totalTrackableSections: number;
}

export interface ContentSectionSummary {
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  sectionId: string;
  slug: string;
  title: string;
  kind: CatalogModule["chapters"][number]["sections"][number]["kind"];
  order: number;
  trackProgress: boolean;
  summary: string;
}

export interface ContentTargetMapEntry {
  href: string;
  title?: string;
}

export type ContentTargetMap = Record<string, ContentTargetMapEntry>;

export interface UserGuideLandingData {
  space: ContentSpaceSummary;
  modules: ContentModuleSummary[];
  searchIndex: SearchIndexEntry[];
  targetMap: ContentTargetMap;
}

export interface UserGuideModuleData {
  space: ContentSpaceSummary;
  module: CatalogModule;
  moduleSummary: ContentModuleSummary;
  allModules: ContentModuleSummary[];
  previousModule?: ContentModuleSummary;
  nextModule?: ContentModuleSummary;
  sectionSummaries: ContentSectionSummary[];
  searchIndex: SearchIndexEntry[];
  targetMap: ContentTargetMap;
}

export interface ContentSearchMatch {
  entry: SearchIndexEntry;
  score: number;
  moduleTitle: string;
  snippet: string;
}

export interface LocalProgressSnapshot {
  [moduleId: string]: string[];
}
