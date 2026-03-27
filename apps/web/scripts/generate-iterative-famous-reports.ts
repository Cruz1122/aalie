import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ExportArtifact } from "@aa/report-export-engine";

import { createReportFromSource } from "@aa/report-export-orchestrator";

type FamousIterativeAlgorithm = {
  slug: string;
  source: string;
};

const FAMOUS_ITERATIVE_ALGORITHMS: FamousIterativeAlgorithm[] = [
  {
    slug: "linear-search",
    source: [
      "linearSearch(A[n], n, x) BEGIN",
      "    FOR i <- 1 TO n DO BEGIN",
      "        IF (A[i] = x) THEN BEGIN",
      "            RETURN i;",
      "        END;",
      "    END;",
      "    RETURN -1;",
      "END",
    ].join("\n"),
  },
  {
    slug: "binary-search",
    source: [
      "binarySearch(A[n], n, x) BEGIN",
      "    low <- 1;",
      "    high <- n;",
      "    WHILE (low <= high) DO BEGIN",
      "        mid <- (low + high) DIV 2;",
      "        IF (A[mid] = x) THEN BEGIN",
      "            RETURN mid;",
      "        END;",
      "        IF (A[mid] < x) THEN BEGIN",
      "            low <- mid + 1;",
      "        END ELSE BEGIN",
      "            high <- mid - 1;",
      "        END;",
      "    END;",
      "    RETURN -1;",
      "END",
    ].join("\n"),
  },
  {
    slug: "bubble-sort",
    source: [
      "bubbleSort(A[n], n) BEGIN",
      "    FOR i <- 1 TO n-1 DO BEGIN",
      "        FOR j <- 1 TO n-i DO BEGIN",
      "            IF (A[j] > A[j+1]) THEN BEGIN",
      "                temp <- A[j];",
      "                A[j] <- A[j+1];",
      "                A[j+1] <- temp;",
      "            END;",
      "        END;",
      "    END;",
      "    RETURN 0;",
      "END",
    ].join("\n"),
  },
  {
    slug: "insertion-sort",
    source: [
      "insertionSort(A[n], n) BEGIN",
      "    FOR i <- 2 TO n DO BEGIN",
      "        key <- A[i];",
      "        j <- i - 1;",
      "        WHILE (j >= 1 AND A[j] > key) DO BEGIN",
      "            A[j+1] <- A[j];",
      "            j <- j - 1;",
      "        END;",
      "        A[j+1] <- key;",
      "    END;",
      "    RETURN 0;",
      "END",
    ].join("\n"),
  },
  {
    slug: "euclidean-gcd",
    source: [
      "euclideanGCD(a, b) BEGIN",
      "    WHILE (b != 0) DO BEGIN",
      "        temp <- b;",
      "        b <- a MOD b;",
      "        a <- temp;",
      "    END;",
      "    RETURN a;",
      "END",
    ].join("\n"),
  },
];

function saveArtifactFile(outputDir: string, artifact: ExportArtifact): void {
  const filename =
    artifact.format === "markdown"
      ? "report.md"
      : artifact.format === "latex"
        ? "report.tex"
        : artifact.format === "pdf"
          ? "report.pdf"
          : "report.json";

  const targetPath = path.join(outputDir, filename);
  if (typeof artifact.content === "string") {
    writeFileSync(targetPath, artifact.content, "utf8");
    return;
  }
  writeFileSync(targetPath, artifact.content);
}

function assertDeterministicLiveData(
  result: Awaited<ReturnType<typeof createReportFromSource>>,
): void {
  if (
    !result.snapshot.meta.validity.parseOk ||
    !result.snapshot.meta.validity.analysisOk
  ) {
    throw new Error(
      "Missing live analysis data from backend (/grammar/parse or /analyze/open).",
    );
  }

  if (
    result.snapshot.algorithmType === "iterative" ||
    result.snapshot.algorithmType === "hybrid"
  ) {
    if (result.snapshot.iterative.status !== "available") {
      throw new Error("Iterative section is not available in snapshot.");
    }

    const invariantSection = result.snapshot.iterative?.data?.loopInvariant;
    if (!invariantSection || invariantSection.status !== "available") {
      throw new Error(
        "Loop invariant is missing; expected deterministic /analyze/open loopInvariant.",
      );
    }

    const traceSection = result.snapshot.iterative?.data?.trace;
    if (!traceSection || traceSection.status !== "available") {
      throw new Error(
        "Trace section is missing; expected deterministic /analyze/trace data.",
      );
    }

    const missingCases = ["worst", "best", "avg"].filter((caseName) => {
      const trace = traceSection?.data?.[caseName as "worst" | "best" | "avg"];
      return !trace || !Array.isArray(trace.steps) || trace.steps.length === 0;
    });
    if (missingCases.length > 0) {
      throw new Error(
        `Trace missing steps for cases: ${missingCases.join(", ")}.`,
      );
    }
  }
}

async function main(): Promise<void> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..", "..", "..");
  const root = path.join(repoRoot, "reports", "iterative-famous");
  mkdirSync(root, { recursive: true });

  for (const algorithm of FAMOUS_ITERATIVE_ALGORITHMS) {
    const outputDir = path.join(root, algorithm.slug);
    mkdirSync(outputDir, { recursive: true });

    const result = await createReportFromSource({
      source: algorithm.source,
      locale: "es",
      includeTraceCases: ["worst", "best", "avg"],
      includeLlm: false,
      includeGpuCpu: true,
      formats: ["markdown", "latex", "pdf"],
      includeSnapshotJson: true,
      includeZipBundle: false,
      sourceOrigin: "api",
      analysisId: `iterative-famous-${algorithm.slug}`,
    });

    assertDeterministicLiveData(result);

    for (const artifact of result.artifacts) {
      saveArtifactFile(outputDir, artifact);
    }

    console.log(`generated ${algorithm.slug} -> ${outputDir}`);
  }
}

main().catch((error) => {
  console.error(
    "Failed to generate iterative famous reports using live /analyze/open + /analyze/trace data.",
  );
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
