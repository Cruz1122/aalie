import assert from "node:assert";
import { describe, it } from "node:test";

import { buildDocumentModel } from "../renderers/document-model-builder";
import { renderLatexReport } from "../renderers/latex";
import { createRecursiveSnapshot } from "./fixtures/snapshot-fixtures";

describe("latex-renderer", () => {
  it("renderiza portada institucional y bloques por metodo", () => {
    const snapshot = createRecursiveSnapshot("characteristic_equation");
    const model = buildDocumentModel(snapshot);
    const latex = renderLatexReport({ snapshot, documentModel: model });

    assert.ok(latex.includes("\\usepackage{aalie-report}"));
    assert.ok(
      latex.includes("\\AALIESetLogos{logos/ucaldas.pdf}{logos/aalie.pdf}{logos/aalie.pdf}"),
    );
    assert.ok(latex.includes("\\AALIESetInstitution"));
    assert.ok(latex.includes("\\AALIESetMetaLabels{Version}{Date}"));
    assert.match(latex, /characteristic equation/i);
    assert.ok(latex.includes("\\section{Recursive Analysis Step By Step}"));
    assert.match(latex, /\\paragraph\{1\. Step 1\}/);
    assert.match(latex, /\\footnotesize\\textit\{Fixture summary for step 1 Fixture concept for recurrence\\_detected\}/);
  });

  it("escapa texto plano con caracteres especiales", () => {
    const snapshot = createRecursiveSnapshot("master");
    const model = buildDocumentModel(snapshot);
    const latex = renderLatexReport({
      snapshot: {
        ...snapshot,
        institutional: {
          ...snapshot.institutional,
          disclaimer: "A&B_100% seguro #1",
        },
      },
      documentModel: {
        ...model,
        disclaimer: "A&B_100% seguro #1",
      },
    });

    assert.match(latex, /A\\&B\\_100\\% seguro \\#1/);
  });
});
