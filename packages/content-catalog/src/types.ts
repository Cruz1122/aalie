export type SchemaVersion = string;
export type LocalizedStatus = "draft" | "published" | "archived";
export type SpaceKind = "guide" | "theory" | "reference" | "mixed";
export type Difficulty =
  | "foundational"
  | "basic"
  | "intermediate"
  | "advanced";
export type SectionKind =
  | "overview"
  | "theory"
  | "example"
  | "practice"
  | "reference"
  | "troubleshooting";

export type TargetKind =
  | "module"
  | "chapter"
  | "section"
  | "block"
  | "term"
  | "resource"
  | "external";

export interface TargetRef {
  kind: TargetKind;
  ref: string;
}

export interface LearningObjective {
  objectiveId: string;
  text: string;
}

export interface SearchMeta {
  aliases?: string[];
  keywords?: string[];
}

export interface PrerequisiteRef {
  id: string;
  kind: "required" | "recommended";
}

export interface SpaceSearchConfig {
  enabled: boolean;
  indexText: boolean;
  indexStructure: boolean;
  indexTerms: boolean;
  indexReferences: boolean;
  indexCaptions: boolean;
}

export interface SpaceProgressConfig {
  unit: "section";
  paginationUnit?: "section";
}

export interface SpaceTheme {
  icon?: string;
  accentColor?: string;
}

export interface CatalogSpace {
  schema: "aalie.content.space";
  schemaVersion: SchemaVersion;
  spaceId: string;
  slug: string;
  kind: SpaceKind;
  title: string;
  description?: string;
  locale: string;
  version: string;
  status: LocalizedStatus;
  search: SpaceSearchConfig;
  progress: SpaceProgressConfig;
  theme?: SpaceTheme;
}

export type ResourceSource =
  | {
      kind: "backendAsset";
      assetId: string;
    }
  | {
      kind: "publicPath";
      path: string;
    }
  | {
      kind: "externalUrl";
      url: string;
    };

export interface ImageResource {
  resourceId: string;
  kind: "image" | "figure";
  source: ResourceSource;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface ReferenceResource {
  resourceId: string;
  kind: "reference";
  label: string;
  refType: "internal" | "book" | "paper" | "website";
  url?: string;
  authors?: string[];
  year?: number;
}

export interface Term {
  termId: string;
  label: string;
  aliases?: string[];
  definition: string;
}

export interface ModuleResources {
  images?: ImageResource[];
  figures?: ImageResource[];
  references?: ReferenceResource[];
}

export type InlineSpan =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "underline"; text: string }
  | { type: "highlight"; text: string; tone?: "yellow" | "green" | "blue" | "red" }
  | { type: "inlineCode"; text: string }
  | { type: "inlineMath"; latex: string }
  | { type: "link"; text: string; target: TargetRef }
  | { type: "term"; text: string; termRef: string; display?: "tooltip" | "highlight" }
  | { type: "tooltip"; text: string; tooltip: string }
  | { type: "color"; text: string; token: "primary" | "success" | "warning" | "danger" | "muted" };

export type RichText = InlineSpan[];

export interface ListItem {
  content: RichText;
  children?: ListItem[];
}

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

export interface TableRow {
  cells: RichText[];
}

export interface BaseBlock {
  id: string;
  type: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 2 | 3 | 4;
  content: RichText;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  content: RichText;
}

export interface ListBlock extends BaseBlock {
  type: "list";
  style?: "unordered" | "ordered";
  items: ListItem[];
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  content: RichText;
  attribution?: string;
}

export interface NoteBlock extends BaseBlock {
  type: "note";
  variant: "info" | "warning" | "success" | "danger";
  title: string;
  blocks: ContentBlock[];
}

export interface FramedBlock extends BaseBlock {
  type: "callout" | "definition" | "theorem" | "proof";
  title: string;
  blocks: ContentBlock[];
}

export interface ExampleBlock extends BaseBlock {
  type: "example";
  title: string;
  blocks: ContentBlock[];
}

export type EvidenceBlockVariant =
  | "concept"
  | "example"
  | "systemEvidence"
  | "interpretation"
  | "warning";

export type PedagogyIconName =
  | "school"
  | "science"
  | "analytics"
  | "lightbulb"
  | "warning"
  | "error_outline";

export interface EvidenceBlock extends BaseBlock {
  type: "evidenceBlock";
  variant: EvidenceBlockVariant;
  icon: PedagogyIconName;
  title?: string;
  blocks: ContentBlock[];
}

export interface ExerciseBlock extends BaseBlock {
  type: "exercise";
  title?: string;
  prompt: RichText;
  difficulty?: Exclude<Difficulty, "foundational"> | "basic";
  solutionRef?: string;
}

export interface ExerciseSolutionBlock extends BaseBlock {
  type: "exerciseSolution";
  title?: string;
  blocks: ContentBlock[];
}

export interface CodeLikeBlock extends BaseBlock {
  type: "algorithm" | "code";
  language: "pseudocode" | "text" | "json" | "python" | "typescript";
  title?: string;
  code: string;
  caption?: string;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  title?: string;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface MediaBlock extends BaseBlock {
  type: "image" | "figure";
  resourceRef: string;
  display?: {
    width?: "small" | "medium" | "large" | "full";
    captionPosition?: "top" | "bottom";
  };
}

export interface EquationBlock extends BaseBlock {
  type: "equationBlock";
  latex: string;
  align?: "left" | "center" | "right";
}

export interface CheatsheetBlock extends BaseBlock {
  type: "cheatsheet";
  title?: string;
  items: Array<{
    label: string;
    value: RichText;
  }>;
}

export interface ReferenceListBlock extends BaseBlock {
  type: "referenceList";
  references: string[];
}

export interface ButtonRowBlock extends BaseBlock {
  type: "buttonRow";
  buttons: Array<{
    label: string;
    target: TargetRef;
    variant?: "primary" | "secondary" | "ghost";
  }>;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | NoteBlock
  | FramedBlock
  | ExampleBlock
  | EvidenceBlock
  | ExerciseBlock
  | ExerciseSolutionBlock
  | CodeLikeBlock
  | TableBlock
  | MediaBlock
  | EquationBlock
  | CheatsheetBlock
  | ReferenceListBlock
  | ButtonRowBlock
  | DividerBlock;

export interface CatalogSection {
  sectionId: string;
  slug: string;
  title: string;
  order: number;
  kind: SectionKind;
  trackProgress: boolean;
  estimatedMinutes?: number;
  learningObjectives?: LearningObjective[];
  searchMeta?: SearchMeta;
  prerequisites?: {
    modules?: PrerequisiteRef[];
    sections?: PrerequisiteRef[];
  };
  blocks: ContentBlock[];
}

export interface CatalogChapter {
  chapterId: string;
  slug: string;
  title: string;
  order: number;
  summary?: string;
  sections: CatalogSection[];
}

export interface CatalogModule {
  schema: "aalie.content.module";
  schemaVersion: SchemaVersion;
  spaceId: string;
  moduleId: string;
  slug: string;
  title: string;
  shortTitle?: string;
  order: number;
  locale: string;
  version: string;
  status: LocalizedStatus;
  summary?: string;
  difficulty?: Difficulty;
  estimatedMinutes?: number;
  tags?: string[];
  searchMeta?: SearchMeta;
  prerequisites?: {
    modules?: PrerequisiteRef[];
    sections?: PrerequisiteRef[];
  };
  relatedModuleIds?: string[];
  learningObjectives?: LearningObjective[];
  resources?: ModuleResources;
  terms?: Term[];
  chapters: CatalogChapter[];
}

export interface LoadedModule {
  filePath: string;
  module: CatalogModule;
}

export interface LoadedSpaceBundle {
  directory: string;
  spaceFilePath: string;
  space: CatalogSpace;
  modules: LoadedModule[];
}

export interface ResolvedTarget {
  kind: Exclude<TargetKind, "external">;
  ref: string;
  title?: string;
}

export interface SearchIndexEntry {
  id: string;
  kind: "module" | "section";
  route: string;
  locale: string;
  spaceId: string;
  moduleId: string;
  chapterId?: string;
  sectionId?: string;
  title: string;
  text: string;
  tags: string[];
  aliases: string[];
  keywords: string[];
}

export interface ModuleProgress {
  totalTrackableSections: number;
  completedTrackableSections: number;
  ratio: number;
  percentage: number;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
