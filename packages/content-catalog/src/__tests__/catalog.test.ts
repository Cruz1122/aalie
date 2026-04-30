import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildSpaceSearchIndex,
  buildModuleSearchIndex,
  computeModuleProgress,
  deriveModuleRoute,
  deriveSpaceRoute,
  resolveTarget,
} from "../index.js";
import {
  discoverSpaces,
  getModuleBySlug,
  getSpaceBundle,
  validateCatalog,
} from "../server.js";

test("discoverSpaces loads published spaces and modules from filesystem", () => {
  const spaces = discoverSpaces();
  const spaceKeys = spaces.map(
    (bundle) => `${bundle.space.spaceId}:${bundle.space.locale}`,
  );

  assert.equal(spaces.length, 3);
  assert.deepEqual(spaceKeys, ["course:es", "user-guide:en", "user-guide:es"]);
  assert.equal(getSpaceBundle("user-guide", "es").modules.length, 7);
  assert.equal(getSpaceBundle("user-guide", "en").modules.length, 7);
});

test("routes are derived from space and module slugs without manual mapping", () => {
  const theoryBundle = getSpaceBundle("course", "es");
  const guideBundle = getSpaceBundle("user-guide", "es");

  assert.equal(deriveSpaceRoute(theoryBundle.space), "/course");
  assert.equal(
    deriveModuleRoute(theoryBundle.space, theoryBundle.modules[0].module),
    "/course/complejidad-temporal-espacial",
  );
  assert.equal(deriveSpaceRoute(guideBundle.space), "/user-guide");
  assert.equal(
    deriveModuleRoute(guideBundle.space, guideBundle.modules[0].module),
    "/user-guide/como-se-mide-un-algoritmo",
  );
});

test("module progress is computed from trackable sections only", () => {
  const courseBundle = getSpaceBundle("course", "es");
  const module = getModuleBySlug(
    courseBundle,
    "complejidad-temporal-espacial",
  )?.module;

  assert.ok(module);

  const progress = computeModuleProgress(module, [
    "sec-introduccion-complejidad",
    "sec-principio-fundamental",
  ]);

  assert.equal(progress.totalTrackableSections, 8);
  assert.equal(progress.completedTrackableSections, 2);
  assert.equal(progress.percentage, 25);
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
    ref: "blk-m1-s2-p1",
  });

  assert.equal(
    section?.title,
    "Iteraciones, suma de costos y ejemplo en el analizador",
  );
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
  const courseBundle = getSpaceBundle("course", "es");
  const module = getModuleBySlug(
    courseBundle,
    "complejidad-temporal-espacial",
  )?.module;
  assert.ok(module);
  const entries = buildModuleSearchIndex(courseBundle.space, module);
  const moduleEntry = entries.find((entry) => entry.kind === "module");
  const sectionEntry = entries.find(
    (entry) => entry.sectionId === "sec-ejemplo-for-while-logaritmico",
  );

  assert.ok(moduleEntry);
  assert.match(moduleEntry.text, /Modelo RAM/);
  assert.match(moduleEntry.text, /Operacion elemental/);
  assert.ok(sectionEntry);
  assert.match(sectionEntry.text, /j <- j\*2/);
  assert.match(sectionEntry.text, /n\\log_2\(n\)/);
});

test("seed catalog validates against schemas and semantic rules", () => {
  const report = validateCatalog();

  assert.equal(report.valid, true);
  assert.deepEqual(report.errors, []);
});

test("course catalog does not allow latex trees or forest engine", () => {
  const courseBundle = getSpaceBundle("course", "es");

  for (const loadedModule of courseBundle.modules) {
    const rawFile = fs.readFileSync(loadedModule.filePath, "utf-8");
    assert.equal(
      /"type"\s*:\s*"latexDiagram"/.test(rawFile),
      false,
      `latexDiagram is forbidden in ${path.basename(loadedModule.filePath)}`,
    );
    assert.equal(
      /"engine"\s*:\s*"forest"/.test(rawFile),
      false,
      `forest engine is forbidden in ${path.basename(loadedModule.filePath)}`,
    );
  }
});
