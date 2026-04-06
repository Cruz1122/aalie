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
  assert.equal(getSpaceBundle("user-guide", "es").modules.length, 7);
  assert.equal(getSpaceBundle("user-guide", "en").modules.length, 7);
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
    "/user-guide/como-se-mide-un-algoritmo",
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
    ref: "sec-operaciones-y-n",
  });
  const term = resolveTarget(guideBundle, {
    kind: "term",
    ref: "term-tamano-entrada",
  });
  const block = resolveTarget(guideBundle, {
    kind: "block",
    ref: "blk-m1-s1-intro",
  });

  assert.equal(section?.title, "Operaciones y crecimiento con n");
  assert.equal(term?.title, "tamaño de entrada");
  assert.equal(block?.kind, "block");
});

test("space helpers resolve bundles, module slugs, and aggregate search across modules", () => {
  const guideBundle = getSpaceBundle("user-guide", "en");
  const module = getModuleBySlug(guideBundle, "measuring-an-algorithm");
  const entries = buildSpaceSearchIndex(guideBundle, {
    moduleId: "mod-user-guide-measure",
  });

  assert.equal(module?.module.moduleId, "mod-user-guide-measure");
  assert.ok(
    entries.some((entry) => entry.sectionId === "sec-que-es-eficiencia"),
  );
  assert.ok(
    entries.every((entry) => entry.moduleId === "mod-user-guide-measure"),
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
