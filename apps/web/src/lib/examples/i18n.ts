import type {
  ExampleCatalogItem,
  ExampleCategory,
  ExampleFamily,
} from "@/lib/examples/catalog";

export interface LocalizedExampleCatalogItem {
  title: string;
  summary: string;
  tags: string[];
}

export const CATEGORY_LABEL_KEYS: Record<ExampleCategory, string> = {
  iterative: "examples.categories.iterative.title",
  divide_and_conquer: "examples.categories.divideAndConquer.title",
  decrease_and_conquer: "examples.categories.decreaseAndConquer.title",
  decrease_and_get_conquered:
    "examples.categories.decreaseAndGetConquered.title",
  dp_top_down: "examples.categories.dpTopDown.title",
  dp_bottom_up: "examples.categories.dpBottomUp.title",
  greedy: "examples.categories.greedy.title",
  backtracking: "examples.categories.backtracking.title",
  branch_and_bound: "examples.categories.branchAndBound.title",
};

export const CATEGORY_OFFTEXT_KEYS: Record<ExampleCategory, string> = {
  iterative: "examples.categories.iterative.summary",
  divide_and_conquer: "examples.categories.divideAndConquer.summary",
  decrease_and_conquer: "examples.categories.decreaseAndConquer.summary",
  decrease_and_get_conquered:
    "examples.categories.decreaseAndGetConquered.summary",
  dp_top_down: "examples.categories.dpTopDown.summary",
  dp_bottom_up: "examples.categories.dpBottomUp.summary",
  greedy: "examples.categories.greedy.summary",
  backtracking: "examples.categories.backtracking.summary",
  branch_and_bound: "examples.categories.branchAndBound.summary",
};

export const FAMILY_LABEL_KEYS: Record<ExampleFamily, string> = {
  busqueda: "examples.families.busqueda",
  ordenamiento: "examples.families.ordenamiento",
  matrices: "examples.families.matrices",
  numerico: "examples.families.numerico",
  geometria: "examples.families.geometria",
  secuencias: "examples.families.secuencias",
  estructuras: "examples.families.estructuras",
  clasicos: "examples.families.clasicos",
};

export const getLocalizedExampleContent = (
  example: ExampleCatalogItem,
  catalogItems: Record<string, LocalizedExampleCatalogItem>,
  locale: "es" | "en",
): LocalizedExampleCatalogItem => {
  const localized = catalogItems[example.id];
  if (localized) {
    return localized;
  }

  return {
    title: example.copy[locale].title,
    summary: example.copy[locale].summary,
    tags: example.copy[locale].tags,
  };
};
