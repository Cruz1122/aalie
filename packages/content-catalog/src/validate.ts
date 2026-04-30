import fs from "node:fs";
import path from "node:path";

import type { ErrorObject } from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { discoverSpaces } from "./discover.js";
import {
  DEFAULT_SCHEMAS_ROOT,
  REPO_ROOT,
  readJsonFile,
  resolveTarget,
} from "./load.js";
import {
  deriveModuleRoute,
  deriveSpaceRoute,
  flattenInlineText,
  walkBlocks,
} from "./utils.js";
import { computeModuleProgress } from "./progress.js";
import type {
  CatalogModule,
  CatalogSection,
  ContentBlock,
  LoadedSpaceBundle,
  RichText,
  TargetRef,
  ValidationIssue,
  ValidationReport,
} from "./types.js";

type ReferenceToken =
  | { kind: "term"; ref: string }
  | { kind: "resource"; ref: string }
  | { kind: "reference"; ref: string }
  | { kind: "block"; ref: string }
  | { kind: "link"; target: TargetRef };

function createIssue(
  severity: "error" | "warning",
  code: string,
  message: string,
  pathValue?: string,
): ValidationIssue {
  return {
    severity,
    code,
    message,
    path: pathValue,
  };
}

function collectInlineTargets(content: RichText | undefined): ReferenceToken[] {
  if (!content) {
    return [];
  }

  return content.reduce<ReferenceToken[]>((acc, span) => {
    if (span.type === "link") {
      acc.push({ kind: "link", target: span.target });
    }
    if (span.type === "term") {
      acc.push({ kind: "term", ref: span.termRef });
    }
    return acc;
  }, []);
}

function collectListItemTargets(
  items: Extract<ContentBlock, { type: "list" }>["items"],
  acc: ReferenceToken[] = [],
): ReferenceToken[] {
  for (const item of items) {
    acc.push(...collectInlineTargets(item.content));
    if (item.children) {
      collectListItemTargets(item.children, acc);
    }
  }
  return acc;
}

function collectBlockReferenceTokens(block: ContentBlock): ReferenceToken[] {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return collectInlineTargets(block.content);
    case "list":
      return collectListItemTargets(block.items);
    case "note":
    case "callout":
    case "definition":
    case "theorem":
    case "proof":
    case "example":
    case "exerciseSolution":
    case "evidenceBlock":
      return block.blocks.flatMap(collectBlockReferenceTokens);
    case "stepByStepMethod":
    case "proofSteps":
      return block.steps.flatMap((step) =>
        step.blocks.flatMap(collectBlockReferenceTokens),
      );
    case "exercise":
      return [
        ...collectInlineTargets(block.prompt),
        ...(block.solutionRef
          ? [{ kind: "block" as const, ref: block.solutionRef }]
          : []),
      ];
    case "methodCard":
      return [
        ...collectInlineTargets(block.summary),
        ...(block.whenToUse ?? []).flatMap(collectInlineTargets),
        ...(block.steps ?? []).flatMap(collectInlineTargets),
        ...(block.pitfalls ?? []).flatMap(collectInlineTargets),
      ];
    case "warningTrap":
      return [
        ...collectInlineTargets(block.misconception),
        ...collectInlineTargets(block.whyItFails),
        ...collectInlineTargets(block.fix),
      ];
    case "exampleSolved":
      return [
        ...collectInlineTargets(block.problem),
        ...block.steps.flatMap((step) =>
          collectInlineTargets(step.explanation),
        ),
        ...collectInlineTargets(block.answer),
      ];
    case "quizCheckpoint":
      return collectInlineTargets(block.prompt);
    case "image":
    case "figure":
      return [{ kind: "resource", ref: block.resourceRef }];
    case "referenceList":
      return block.references.map((referenceId) => ({
        kind: "reference" as const,
        ref: referenceId,
      }));
    case "buttonRow":
      return block.buttons.map((button) => ({
        kind: "link" as const,
        target: button.target,
      }));
    default:
      return [];
  }
}

function textIsEmpty(content: RichText | undefined): boolean {
  return flattenInlineText(content).trim().length === 0;
}

function validateBlockSemantics(
  block: ContentBlock,
  issues: ValidationIssue[],
  filePath: string,
): void {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      if (textIsEmpty(block.content)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_301",
            `Block ${block.id} has empty rich text content`,
            filePath,
          ),
        );
      }
      return;
    case "list":
      for (const item of block.items) {
        if (textIsEmpty(item.content)) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_302",
              `List block ${block.id} contains an empty item`,
              filePath,
            ),
          );
        }
      }
      return;
    case "note":
    case "callout":
    case "definition":
    case "theorem":
    case "proof":
    case "example":
    case "exerciseSolution":
    case "evidenceBlock":
      for (const nestedBlock of block.blocks) {
        validateBlockSemantics(nestedBlock, issues, filePath);
      }
      return;
    case "exercise":
      if (textIsEmpty(block.prompt)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_303",
            `Exercise block ${block.id} has an empty prompt`,
            filePath,
          ),
        );
      }
      return;
    case "algorithm":
    case "code":
      if (block.code.trim().length === 0) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_304",
            `Code block ${block.id} has empty code`,
            filePath,
          ),
        );
      }
      return;
    case "table":
    case "complexityTable":
    case "formulaComparisonTable":
      for (const row of block.rows) {
        if (row.cells.length !== block.columns.length) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_305",
              `Table block ${block.id} has a row with ${row.cells.length} cells for ${block.columns.length} columns`,
              filePath,
            ),
          );
        }
      }
      return;
    case "latexSteps":
      for (const step of block.steps) {
        if (!step.latex.trim()) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_307",
              `Latex steps block ${block.id} contains an empty latex step`,
              filePath,
            ),
          );
        }
      }
      return;
    case "mermaid":
      if (block.code.trim().length === 0) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_308",
            `Mermaid block ${block.id} has empty code`,
            filePath,
          ),
        );
      }
      return;
    case "recursionTree":
      if (block.nodes.length === 0) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_309",
            `Recursion tree block ${block.id} has no nodes`,
            filePath,
          ),
        );
      }
      return;
    case "graph":
      if (block.nodes.length === 0 || block.edges.length === 0) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_310",
            `Graph block ${block.id} must define nodes and edges`,
            filePath,
          ),
        );
      }
      return;
    case "stepByStepMethod":
    case "proofSteps":
      for (const step of block.steps) {
        for (const nestedBlock of step.blocks) {
          validateBlockSemantics(nestedBlock, issues, filePath);
        }
      }
      return;
    case "cheatsheet":
      for (const item of block.items) {
        if (item.label.trim().length === 0 || textIsEmpty(item.value)) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_306",
              `Cheatsheet block ${block.id} contains an empty item`,
              filePath,
            ),
          );
        }
      }
      return;
    case "methodCard":
    case "warningTrap":
    case "exampleSolved":
    case "quizCheckpoint":
    case "latex":
    case "equationBlock":
    default:
      return;
  }
}

function validateTerms(
  module: CatalogModule,
  bundle: LoadedSpaceBundle,
  issues: ValidationIssue[],
  filePath: string,
): void {
  const terms = module.terms ?? [];
  const termIds = new Set<string>();
  const allVariants = new Set<string>();

  for (const term of terms) {
    if (termIds.has(term.termId)) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_501",
          `Module ${module.moduleId} repeats termId ${term.termId}`,
          filePath,
        ),
      );
    }
    termIds.add(term.termId);

    if (term.primarySectionRef) {
      const { moduleId, sectionId } = term.primarySectionRef;
      const targetModule = bundle.modules.find(
        (m) => m.module.moduleId === moduleId,
      );
      if (!targetModule) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_502",
            `Term ${term.termId} references unknown primary moduleId ${moduleId}`,
            filePath,
          ),
        );
      } else {
        const sectionExists = targetModule.module.chapters.some((c) =>
          c.sections.some((s) => s.sectionId === sectionId),
        );
        if (!sectionExists) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_503",
              `Term ${term.termId} references unknown primary sectionId ${sectionId} in module ${moduleId}`,
              filePath,
            ),
          );
        }
      }
    }

    const variants = [
      term.label.toLowerCase(),
      ...(term.aliases ?? []).map((a) => a.toLowerCase()),
    ];
    for (const variant of variants) {
      if (allVariants.has(variant)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_504",
            `Module ${module.moduleId} has duplicate label or alias: "${variant}"`,
            filePath,
          ),
        );
      }
      allVariants.add(variant);
    }
  }
}

function validateSectionOrders(
  module: CatalogModule,
  issues: ValidationIssue[],
  filePath: string,
): void {
  const chapterOrders = new Set<number>();
  const chapterIds = new Set<string>();
  const sectionIds = new Set<string>();
  const blockIds = new Set<string>();

  for (const chapter of module.chapters) {
    if (chapterOrders.has(chapter.order)) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_201",
          `Module ${module.moduleId} repeats chapter order ${chapter.order}`,
          filePath,
        ),
      );
    }
    chapterOrders.add(chapter.order);

    if (chapterIds.has(chapter.chapterId)) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_202",
          `Module ${module.moduleId} repeats chapterId ${chapter.chapterId}`,
          filePath,
        ),
      );
    }
    chapterIds.add(chapter.chapterId);

    const sectionOrders = new Set<number>();
    for (const section of chapter.sections) {
      if (sectionOrders.has(section.order)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_203",
            `Chapter ${chapter.chapterId} repeats section order ${section.order}`,
            filePath,
          ),
        );
      }
      sectionOrders.add(section.order);

      if (sectionIds.has(section.sectionId)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_204",
            `Module ${module.moduleId} repeats sectionId ${section.sectionId}`,
            filePath,
          ),
        );
      }
      sectionIds.add(section.sectionId);

      for (const block of walkBlocks(section.blocks)) {
        if (blockIds.has(block.id)) {
          issues.push(
            createIssue(
              "error",
              "CONTENT_205",
              `Module ${module.moduleId} repeats block id ${block.id}`,
              filePath,
            ),
          );
        }
        blockIds.add(block.id);
        validateBlockSemantics(block, issues, filePath);
      }
    }
  }
}

function validateSectionScale(
  section: CatalogSection,
  issues: ValidationIssue[],
  filePath: string,
): void {
  if (section.blocks.length > 20) {
    issues.push(
      createIssue(
        "warning",
        "CONTENT_401",
        `Section ${section.sectionId} contains ${section.blocks.length} blocks; consider splitting it`,
        filePath,
      ),
    );
  }
}

function validatePublicPath(resourcePath: string): boolean {
  const absolutePath = path.join(
    REPO_ROOT,
    "apps",
    "web",
    "public",
    resourcePath.replace(/^\//, ""),
  );
  return fs.existsSync(absolutePath);
}

function validateSchemaDocuments(
  bundle: LoadedSpaceBundle,
  issues: ValidationIssue[],
): void {
  if (path.basename(path.dirname(bundle.directory)) !== bundle.space.spaceId) {
    issues.push(
      createIssue(
        "error",
        "CONTENT_101",
        `Directory spaceId does not match space.json for ${bundle.space.spaceId}`,
        bundle.spaceFilePath,
      ),
    );
  }

  if (path.basename(bundle.directory) !== bundle.space.locale) {
    issues.push(
      createIssue(
        "error",
        "CONTENT_102",
        `Directory locale does not match space.json for ${bundle.space.spaceId}`,
        bundle.spaceFilePath,
      ),
    );
  }

  for (const loadedModule of bundle.modules) {
    const expectedFilename = `${String(loadedModule.module.order).padStart(2, "0")}-${loadedModule.module.slug}.module.json`;
    if (path.basename(loadedModule.filePath) !== expectedFilename) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_103",
          `Module filename must be ${expectedFilename}`,
          loadedModule.filePath,
        ),
      );
    }

    if (loadedModule.module.spaceId !== bundle.space.spaceId) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_104",
          `Module ${loadedModule.module.moduleId} has mismatched spaceId`,
          loadedModule.filePath,
        ),
      );
    }

    if (loadedModule.module.locale !== bundle.space.locale) {
      issues.push(
        createIssue(
          "error",
          "CONTENT_105",
          `Module ${loadedModule.module.moduleId} has mismatched locale`,
          loadedModule.filePath,
        ),
      );
    }
  }
}

function buildSchemaValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
  });
  addFormats(ajv);

  for (const schemaFile of [
    "shared.schema.json",
    "inline.schema.json",
    "block.schema.json",
    "space.schema.json",
    "module.schema.json",
  ]) {
    const schemaPath = path.join(DEFAULT_SCHEMAS_ROOT, schemaFile);
    ajv.addSchema(readJsonFile(schemaPath));
  }

  return {
    validateSpace: ajv.getSchema(
      "https://aalie.dev/schemas/content/space.schema.json",
    ),
    validateModule: ajv.getSchema(
      "https://aalie.dev/schemas/content/module.schema.json",
    ),
  };
}

function registerSchemaErrors(
  issues: ValidationIssue[],
  errors: ErrorObject[] | null | undefined,
  filePath: string,
): void {
  for (const error of errors ?? []) {
    issues.push(
      createIssue(
        "error",
        "CONTENT_001",
        `${error.instancePath || "/"} ${error.message ?? "schema validation failed"}`.trim(),
        filePath,
      ),
    );
  }
}

function validateReferences(
  bundle: LoadedSpaceBundle,
  issues: ValidationIssue[],
): void {
  const moduleIds = new Set(
    bundle.modules.map(({ module }) => module.moduleId),
  );
  const publishedModuleRoutes = new Set<string>();

  for (const loadedModule of bundle.modules) {
    const { module, filePath } = loadedModule;
    const moduleRoute = deriveModuleRoute(bundle.space, module);

    if (bundle.space.status === "published" && module.status === "published") {
      if (publishedModuleRoutes.has(moduleRoute)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_206",
            `Route collision detected for ${moduleRoute}`,
            filePath,
          ),
        );
      }
      publishedModuleRoutes.add(moduleRoute);
    }

    if (
      !module.searchMeta?.aliases?.length &&
      !module.searchMeta?.keywords?.length
    ) {
      issues.push(
        createIssue(
          "warning",
          "CONTENT_402",
          `Module ${module.moduleId} is missing optional searchMeta aliases/keywords`,
          filePath,
        ),
      );
    }

    validateSectionOrders(module, issues, filePath);
    validateTerms(module, bundle, issues, filePath);

    for (const relatedModuleId of module.relatedModuleIds ?? []) {
      if (!moduleIds.has(relatedModuleId)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_207",
            `Module ${module.moduleId} references unknown relatedModuleId ${relatedModuleId}`,
            filePath,
          ),
        );
      }
    }

    try {
      computeModuleProgress(module, []);
    } catch (error) {
      const severity = module.status === "published" ? "error" : "warning";
      issues.push(
        createIssue(
          severity,
          severity === "error" ? "CONTENT_208" : "CONTENT_403",
          error instanceof Error ? error.message : String(error),
          filePath,
        ),
      );
    }

    for (const resource of [
      ...(module.resources?.images ?? []),
      ...(module.resources?.figures ?? []),
    ]) {
      if (
        resource.source.kind === "publicPath" &&
        !validatePublicPath(resource.source.path)
      ) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_209",
            `Resource ${resource.resourceId} points to a missing public asset ${resource.source.path}`,
            filePath,
          ),
        );
      }
    }

    for (const prereq of module.prerequisites?.modules ?? []) {
      if (!moduleIds.has(prereq.id)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_210",
            `Module ${module.moduleId} references missing prerequisite module ${prereq.id}`,
            filePath,
          ),
        );
      }
    }

    for (const prereq of module.prerequisites?.sections ?? []) {
      if (!resolveTarget(bundle, { kind: "section", ref: prereq.id })) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_211",
            `Module ${module.moduleId} references missing prerequisite section ${prereq.id}`,
            filePath,
          ),
        );
      }
    }

    for (const chapter of module.chapters) {
      for (const section of chapter.sections) {
        validateSectionScale(section, issues, filePath);

        for (const prereq of section.prerequisites?.modules ?? []) {
          if (!moduleIds.has(prereq.id)) {
            issues.push(
              createIssue(
                "error",
                "CONTENT_212",
                `Section ${section.sectionId} references missing prerequisite module ${prereq.id}`,
                filePath,
              ),
            );
          }
        }

        for (const prereq of section.prerequisites?.sections ?? []) {
          if (!resolveTarget(bundle, { kind: "section", ref: prereq.id })) {
            issues.push(
              createIssue(
                "error",
                "CONTENT_213",
                `Section ${section.sectionId} references missing prerequisite section ${prereq.id}`,
                filePath,
              ),
            );
          }
        }

        for (const block of section.blocks) {
          for (const token of collectBlockReferenceTokens(block)) {
            if (
              token.kind === "term" &&
              !resolveTarget(bundle, { kind: "term", ref: token.ref })
            ) {
              issues.push(
                createIssue(
                  "error",
                  "CONTENT_214",
                  `Block ${block.id} references missing term ${token.ref}`,
                  filePath,
                ),
              );
            }

            if (
              token.kind === "resource" &&
              !resolveTarget(bundle, { kind: "resource", ref: token.ref })
            ) {
              issues.push(
                createIssue(
                  "error",
                  "CONTENT_215",
                  `Block ${block.id} references missing resource ${token.ref}`,
                  filePath,
                ),
              );
            }

            if (token.kind === "reference") {
              const resolved = resolveTarget(bundle, {
                kind: "resource",
                ref: token.ref,
              });
              if (!resolved) {
                issues.push(
                  createIssue(
                    "error",
                    "CONTENT_216",
                    `Reference list block ${block.id} references missing reference ${token.ref}`,
                    filePath,
                  ),
                );
              }
            }

            if (token.kind === "link") {
              if (token.target.kind === "external") {
                const value = token.target.ref;
                if (!/^https?:\/\//.test(value) && !value.startsWith("/")) {
                  issues.push(
                    createIssue(
                      "error",
                      "CONTENT_217",
                      `External target ${value} must start with / or http(s)://`,
                      filePath,
                    ),
                  );
                }
                continue;
              }

              if (!resolveTarget(bundle, token.target)) {
                issues.push(
                  createIssue(
                    "error",
                    "CONTENT_218",
                    `Missing internal target ${token.target.kind}:${token.target.ref} from block ${block.id}`,
                    filePath,
                  ),
                );
              }
            }

            if (
              token.kind === "block" &&
              !resolveTarget(bundle, { kind: "block", ref: token.ref })
            ) {
              issues.push(
                createIssue(
                  "error",
                  "CONTENT_219",
                  `Exercise block ${block.id} references missing solution block ${token.ref}`,
                  filePath,
                ),
              );
            }
          }
        }
      }
    }
  }
}

function validateLocaleCoverage(
  bundles: LoadedSpaceBundle[],
  issues: ValidationIssue[],
): void {
  const grouped = new Map<string, LoadedSpaceBundle[]>();
  for (const bundle of bundles) {
    const current = grouped.get(bundle.space.spaceId) ?? [];
    current.push(bundle);
    grouped.set(bundle.space.spaceId, current);
  }

  for (const [spaceId, spaceBundles] of grouped) {
    if (spaceBundles.length < 2) {
      continue;
    }

    const base = spaceBundles[0];
    const expectedModuleIds = new Set(
      base.modules.map(({ module }) => module.moduleId),
    );
    for (const bundle of spaceBundles.slice(1)) {
      const actualModuleIds = new Set(
        bundle.modules.map(({ module }) => module.moduleId),
      );
      for (const moduleId of expectedModuleIds) {
        if (!actualModuleIds.has(moduleId)) {
          issues.push(
            createIssue(
              "warning",
              "CONTENT_404",
              `Space ${spaceId} is missing module ${moduleId} in locale ${bundle.space.locale}`,
              bundle.spaceFilePath,
            ),
          );
        }
      }
    }
  }
}

export function validateCatalog(): ValidationReport {
  const issues: ValidationIssue[] = [];
  const { validateSpace, validateModule } = buildSchemaValidator();
  const bundles = discoverSpaces({ includeDrafts: true });
  const spaceRoutes = new Set<string>();

  for (const bundle of bundles) {
    if (!validateSpace || !validateModule) {
      throw new Error("AJV validators were not loaded correctly");
    }

    if (!validateSpace(bundle.space)) {
      registerSchemaErrors(issues, validateSpace.errors, bundle.spaceFilePath);
    }

    validateSchemaDocuments(bundle, issues);

    const spaceRoute = deriveSpaceRoute(bundle.space);
    const localizedSpaceRoute = `${bundle.space.locale}:${spaceRoute}`;
    if (bundle.space.status === "published") {
      if (spaceRoutes.has(localizedSpaceRoute)) {
        issues.push(
          createIssue(
            "error",
            "CONTENT_220",
            `Route collision detected for space route ${spaceRoute}`,
            bundle.spaceFilePath,
          ),
        );
      }
      spaceRoutes.add(localizedSpaceRoute);
    }

    for (const loadedModule of bundle.modules) {
      if (!validateModule(loadedModule.module)) {
        registerSchemaErrors(
          issues,
          validateModule.errors,
          loadedModule.filePath,
        );
      }
    }

    validateReferences(bundle, issues);
  }

  validateLocaleCoverage(bundles, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
