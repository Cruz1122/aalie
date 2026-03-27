import type { ExampleCatalogItem, ExampleCategory, ExampleFamily } from "@/lib/examples/catalog";

export interface LocalizedExampleCatalogItem {
  title: string;
  summary: string;
  tags: string[];
}

export const CATEGORY_LABEL_KEYS: Record<ExampleCategory, string> = {
  iterativos: "examples.categories.iterativos.label",
  "divide-y-venceras": "examples.categories.divide-y-venceras.label",
  "resta-y-venceras": "examples.categories.resta-y-venceras.label",
  "resta-y-seras-vencido": "examples.categories.resta-y-seras-vencido.label",
};

export const CATEGORY_OFFTEXT_KEYS: Record<ExampleCategory, string> = {
  iterativos: "examples.categories.iterativos.offText",
  "divide-y-venceras": "examples.categories.divide-y-venceras.offText",
  "resta-y-venceras": "examples.categories.resta-y-venceras.offText",
  "resta-y-seras-vencido": "examples.categories.resta-y-seras-vencido.offText",
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
