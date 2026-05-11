import type {
  AssistantExampleContext,
  AssistantExampleSectionContext,
} from "@/lib/assistant/types";
import {
  EXAMPLE_CATEGORY_ORDER,
  getCategoryMeta,
  getExamplesByCategory,
  getLocalizedExampleSource,
  isRecursiveCategory,
  type ExampleCatalogItem,
  type ExampleLocale,
} from "@/lib/examples/catalog";
import {
  CATEGORY_LABEL_KEYS,
  CATEGORY_OFFTEXT_KEYS,
  FAMILY_LABEL_KEYS,
  getLocalizedExampleContent,
  type LocalizedExampleCatalogItem,
} from "@/lib/examples/i18n";

type Translate = (key: string) => string;

interface BuildAssistantExampleContextOptions {
  includeSource?: boolean;
}

export function buildAssistantExampleContext(
  example: ExampleCatalogItem,
  catalogItems: Record<string, LocalizedExampleCatalogItem>,
  locale: ExampleLocale,
  t: Translate,
  options: BuildAssistantExampleContextOptions = {},
): AssistantExampleContext {
  const localized = getLocalizedExampleContent(example, catalogItems, locale);

  return {
    id: example.id,
    slug: example.slug,
    title: localized.title,
    summary: localized.summary,
    category: t(CATEGORY_LABEL_KEYS[example.category]),
    family: t(FAMILY_LABEL_KEYS[example.family]),
    methods: example.verifiedMethods,
    tags: localized.tags,
    source: options.includeSource
      ? getLocalizedExampleSource(example, locale)
      : undefined,
  };
}

export function buildAssistantExampleListContext(
  examples: ExampleCatalogItem[],
  catalogItems: Record<string, LocalizedExampleCatalogItem>,
  locale: ExampleLocale,
  t: Translate,
  options: BuildAssistantExampleContextOptions = {},
): AssistantExampleContext[] {
  return examples.map((example) =>
    buildAssistantExampleContext(example, catalogItems, locale, t, options),
  );
}

export function buildAssistantExampleSectionsContext(
  catalogItems: Record<string, LocalizedExampleCatalogItem>,
  locale: ExampleLocale,
  t: Translate,
): AssistantExampleSectionContext[] {
  return EXAMPLE_CATEGORY_ORDER.map((category) => {
    const meta = getCategoryMeta(category);
    return {
      id: category,
      slug: meta.slug,
      title: t(CATEGORY_LABEL_KEYS[category]),
      description: t(CATEGORY_OFFTEXT_KEYS[category]),
      exampleCount: getExamplesByCategory(category, {
        enabledOnly: true,
        locale,
      }).length,
      kind: isRecursiveCategory(category) ? "recursive" : "iterative",
    };
  });
}
