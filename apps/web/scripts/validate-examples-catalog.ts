import {
  examplesCatalog,
  isRecursiveCategory,
  RECURSIVE_METHOD_BADGE_TO_METHOD,
  type RecursiveMethodBadge,
} from "@/lib/examples/catalog";

type DetectMethodsResponse = {
  ok: boolean;
  applicable_methods?: string[];
  errors?: Array<{ message?: string }>;
};

type ParseResponse = {
  ok: boolean;
  errors?: Array<{ message?: string; line?: number; column?: number }>;
};

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const badgeToMethod = (badge: RecursiveMethodBadge): string =>
  RECURSIVE_METHOD_BADGE_TO_METHOD[badge];

async function parseSource(sourceCode: string): Promise<ParseResponse> {
  const response = await fetch(`${API_BASE}/grammar/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: sourceCode }),
  });

  return (await response.json()) as ParseResponse;
}

async function detectMethods(sourceCode: string): Promise<DetectMethodsResponse> {
  const response = await fetch(`${API_BASE}/analyze/detect-methods`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: sourceCode, algorithm_kind: "recursive" }),
  });

  return (await response.json()) as DetectMethodsResponse;
}

async function main(): Promise<void> {
  let hardFailures = 0;
  let warnings = 0;

  for (const example of examplesCatalog) {
    const parseResult = await parseSource(example.sourceCode);
    if (!parseResult.ok) {
      const reason = parseResult.errors?.[0]?.message || "parse failed";
      if (example.enabled) {
        hardFailures += 1;
        console.error(`ERROR [${example.slug}] enabled example is not parseable: ${reason}`);
      } else {
        warnings += 1;
        console.warn(`WARN  [${example.slug}] disabled example parse issue: ${reason}`);
      }
      continue;
    }

    if (!isRecursiveCategory(example.category)) {
      if (example.verifiedMethods.length > 0) {
        hardFailures += 1;
        console.error(`ERROR [${example.slug}] iterative example has verifiedMethods populated`);
      }
      continue;
    }

    const detectResult = await detectMethods(example.sourceCode);
    if (!detectResult.ok || !detectResult.applicable_methods) {
      const reason = detectResult.errors?.[0]?.message || "detect-methods failed";
      if (example.enabled) {
        hardFailures += 1;
        console.error(`ERROR [${example.slug}] enabled recursive example cannot detect methods: ${reason}`);
      } else {
        warnings += 1;
        console.warn(`WARN  [${example.slug}] disabled recursive example detect issue: ${reason}`);
      }
      continue;
    }

    const applicable = new Set(detectResult.applicable_methods);
    const unsupportedBadges = example.verifiedMethods.filter(
      (badge) => !applicable.has(badgeToMethod(badge)),
    );

    if (unsupportedBadges.length > 0) {
      const detail = unsupportedBadges.join(", ");
      if (example.enabled) {
        hardFailures += 1;
        console.error(
          `ERROR [${example.slug}] enabled example exposes unsupported badges: ${detail}`,
        );
      } else {
        warnings += 1;
        console.warn(
          `WARN  [${example.slug}] disabled example has unsupported badges: ${detail}`,
        );
      }
    }
  }

  console.log(
    `Validation finished. total=${examplesCatalog.length} warnings=${warnings} errors=${hardFailures}`,
  );

  if (hardFailures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("validate-examples-catalog failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
