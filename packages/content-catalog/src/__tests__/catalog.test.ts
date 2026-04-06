import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSpaceSearchIndex,
  buildModuleSearchIndex,
  computeModuleProgress,
  deriveModuleRoute,
  deriveSpaceRoute,
  discoverSpaces,
  getModuleBySlug,
  getSpaceBundle,
  resolveTarget,
  validateCatalog,
} from "../index.js";

test("discoverSpaces loads published spaces and modules from filesystem", () => {
  const spaces = discoverSpaces();
  const spaceKeys = spaces.map(
    (bundle) => `${bundle.space.spaceId}:${bundle.space.locale}`,
  );

  assert.equal(spaces.length, 3);
  assert.deepEqual(spaceKeys, [
    "theory:es",
    "user-guide:en",
    "user-guide:es",
  ]);
  assert.equal(getSpaceBundle("user-guide", "es").modules.length, 6);
  assert.equal(getSpaceBundle("user-guide", "en").modules.length, 6);
});

test("routes are derived from space and module slugs without manual mapping", () => {
  const theoryBundle = getSpaceBundle("theory", "es");
  const guideBundle = getSpaceBundle("user-guide", "es");

  assert.equal(deriveSpaceRoute(theoryBundle.space), "/course");
  assert.equal(
    deriveModuleRoute(theoryBundle.space, theoryBundle.modules[0].module),
    "/course/complejidad-temporal-y-espacial",
  );
  assert.equal(deriveSpaceRoute(guideBundle.space), "/user-guide");
  assert.equal(
    deriveModuleRoute(guideBundle.space, guideBundle.modules[0].module),
    "/user-guide/introduccion",
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
  const guideBundle = getSpaceBundle("user-guide", "es");

  const section = resolveTarget(guideBundle, {
    kind: "section",
    ref: "sec-variables-y-asignacion",
  });
  const term = resolveTarget(guideBundle, {
    kind: "term",
    ref: "term-monaco-editor",
  });
  const block = resolveTarget(guideBundle, {
    kind: "block",
    ref: "blk-grammar-assign-note-p1",
  });

  assert.equal(section?.title, "Variables y asignación");
  assert.equal(term?.title, "Monaco Editor");
  assert.equal(block?.kind, "block");
});

test("space helpers resolve bundles, module slugs, and aggregate search across modules", () => {
  const guideBundle = getSpaceBundle("user-guide", "en");
  const module = getModuleBySlug(guideBundle, "grammar-syntax");
  const entries = buildSpaceSearchIndex(guideBundle, {
    moduleId: "mod-user-guide-grammar",
  });

  assert.equal(module?.module.moduleId, "mod-user-guide-grammar");
  assert.ok(
    entries.some((entry) => entry.sectionId === "sec-procedimientos-y-call"),
  );
  assert.ok(
    entries.every((entry) => entry.moduleId === "mod-user-guide-grammar"),
  );
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
