import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModuleSearchIndex,
  computeModuleProgress,
  deriveModuleRoute,
  deriveSpaceRoute,
  discoverSpaces,
  resolveTarget,
  validateCatalog,
} from "../index.js";

test("discoverSpaces loads published spaces and modules from filesystem", () => {
  const spaces = discoverSpaces();

  assert.equal(spaces.length, 2);
  assert.deepEqual(
    spaces.map((bundle) => bundle.space.spaceId),
    ["theory", "user-guide"],
  );
  assert.equal(spaces[0].modules.length, 1);
  assert.equal(spaces[1].modules.length, 1);
});

test("routes are derived from space and module slugs without manual mapping", () => {
  const [theoryBundle, guideBundle] = discoverSpaces();

  assert.equal(deriveSpaceRoute(theoryBundle.space), "/course");
  assert.equal(
    deriveModuleRoute(theoryBundle.space, theoryBundle.modules[0].module),
    "/course/complejidad-temporal-y-espacial",
  );
  assert.equal(deriveSpaceRoute(guideBundle.space), "/user-guide");
  assert.equal(
    deriveModuleRoute(guideBundle.space, guideBundle.modules[0].module),
    "/user-guide/guia-de-uso",
  );
});

test("module progress is computed from trackable sections only", () => {
  const [theoryBundle] = discoverSpaces();
  const module = theoryBundle.modules[0].module;

  const progress = computeModuleProgress(module, [
    "sec-analizar-algoritmo-no-programa",
    "sec-operacion-elemental-y-modelo-de-costo",
  ]);

  assert.equal(progress.totalTrackableSections, 4);
  assert.equal(progress.completedTrackableSections, 2);
  assert.equal(progress.percentage, 50);
});

test("resolveTarget finds internal sections, terms and blocks by neutral target refs", () => {
  const [, guideBundle] = discoverSpaces();

  const section = resolveTarget(guideBundle, {
    kind: "section",
    ref: "sec-sintaxis-asignacion",
  });
  const term = resolveTarget(guideBundle, {
    kind: "term",
    ref: "term-monaco-editor",
  });
  const block = resolveTarget(guideBundle, {
    kind: "block",
    ref: "blk-asig-note-paragraph",
  });

  assert.equal(section?.title, "Variables y asignacion");
  assert.equal(term?.title, "Monaco Editor");
  assert.equal(block?.kind, "block");
});

test("search index is generated from JSON content, metadata, terms and captions", () => {
  const [theoryBundle] = discoverSpaces();
  const module = theoryBundle.modules[0].module;
  const entries = buildModuleSearchIndex(theoryBundle.space, module);
  const moduleEntry = entries.find((entry) => entry.kind === "module");
  const sectionEntry = entries.find(
    (entry) => entry.sectionId === "sec-notaciones-y-comparacion",
  );

  assert.ok(moduleEntry);
  assert.match(moduleEntry.text, /Operacion elemental/);
  assert.match(moduleEntry.text, /Comparacion cualitativa/);
  assert.ok(sectionEntry);
  assert.match(sectionEntry.text, /Dominancia eventual/);
  assert.match(sectionEntry.text, /2\^n/);
});

test("seed catalog validates against schemas and semantic rules", () => {
  const report = validateCatalog();

  assert.equal(report.valid, true);
  assert.deepEqual(report.errors, []);
});
