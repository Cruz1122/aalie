import type {
  CatalogTier,
  ExampleCatalogCopy,
  ExampleCatalogItem,
  ExampleLocale,
} from "./catalog";

const code = (...lines: string[]): string => lines.join("\n");

const buildSourceCodeByLocale = (
  sourceCodeEs: string,
  sourceCodeEn?: string,
): Record<ExampleLocale, string> => ({
  es: sourceCodeEs,
  en: sourceCodeEn ?? sourceCodeEs,
});

const buildCopy = (
  titleEs: string,
  titleEn: string,
  summaryEs: string,
  summaryEn: string,
  tagsEs: string[],
  tagsEn: string[],
): Record<ExampleLocale, ExampleCatalogCopy> => ({
  es: {
    title: titleEs,
    summary: summaryEs,
    offText: "",
    tags: tagsEs,
  },
  en: {
    title: titleEn,
    summary: summaryEn,
    offText: "",
    tags: tagsEn,
  },
});

const createExample = (
  item: Omit<
    ExampleCatalogItem,
    "copy" | "catalogTier" | "sourceCodeByLocale" | "techniqueBadges"
  > & {
    titleEs: string;
    titleEn: string;
    summaryEs: string;
    summaryEn: string;
    tagsEs: string[];
    tagsEn: string[];
    sourceCodeEs: string;
    sourceCodeEn?: string;
    catalogTier?: CatalogTier;
    techniqueBadges?: ExampleCatalogItem["techniqueBadges"];
  },
): ExampleCatalogItem => ({
  id: item.id,
  slug: item.slug,
  category: item.category,
  expectedTechnique: item.expectedTechnique,
  family: item.family,
  difficulty: item.difficulty,
  catalogTier: item.catalogTier ?? "contractual",
  techniqueBadges: item.techniqueBadges ?? [],
  sourceCodeByLocale: buildSourceCodeByLocale(
    item.sourceCodeEs,
    item.sourceCodeEn,
  ),
  verifiedMethods: item.verifiedMethods,
  enabled: item.enabled,
  copy: buildCopy(
    item.titleEs,
    item.titleEn,
    item.summaryEs,
    item.summaryEn,
    item.tagsEs,
    item.tagsEn,
  ),
});

export const pedagogyExamples: ExampleCatalogItem[] = [
  createExample({
    id: "linear-shift-equiv-vs-upper",
    slug: "linear-shift-equiv-vs-upper",
    category: "decrease_and_conquer",
    expectedTechnique: "decrease_and_conquer",
    family: "secuencias",
    difficulty: "intermedio",
    verifiedMethods: ["EC", "AR"],
    techniqueBadges: ["RyV", "N_MINUS_1", "SINGLE_BRANCH"],
    enabled: true,
    titleEs: "Desplazamiento lineal: suma recursiva (EC vs AR)",
    titleEn: "Linear-shift recursive sum (EC vs AR)",
    summaryEs:
      "Ejemplo simple donde la ecuacion caracteristica da Theta(n) mientras el arbol recursivo aporta solo una cota superior.",
    summaryEn:
      "A simple example where the characteristic equation yields Theta(n) while the recursion tree only gives an upper bound.",
    tagsEs: ["decremento", "lineal", "ecuacion caracteristica"],
    tagsEn: ["decrement", "linear", "characteristic equation"],
    sourceCodeEs: code(
      "linearShiftExample(n) BEGIN",
      "    IF (n <= 1) THEN BEGIN",
      "        RETURN n;",
      "    END",
      "    RETURN linearShiftExample(n - 1) + 1;",
      "END",
    ),
  }),
  createExample({
    id: "merge-sort-master-vs-iteration",
    slug: "merge-sort-master-vs-iteration",
    category: "divide_and_conquer",
    expectedTechnique: "divide_and_conquer",
    family: "ordenamiento",
    difficulty: "intermedio",
    verifiedMethods: ["TM", "IT"],
    techniqueBadges: ["DyV", "MERGE", "PARTITION"],
    enabled: true,
    titleEs: "Merge Sort (TM vs IT)",
    titleEn: "Merge Sort (TM vs IT)",
    summaryEs:
      "Ejemplo divide-y-venceras donde el teorema maestro da Theta(n log n) y una iteracion naive solo una cota superior.",
    summaryEn:
      "A divide-and-conquer example where the master theorem gives Theta(n log n) while a naive iteration analysis only yields an upper bound.",
    tagsEs: ["merge", "divide y venceras", "n log n"],
    tagsEn: ["merge", "divide and conquer", "n log n"],
    sourceCodeEs: code(
      "mergeSort(A[n], inicio, fin) BEGIN",
      "    IF (inicio >= fin) THEN BEGIN",
      "        RETURN 0;",
      "    END",
      "    medio <- (inicio + fin) DIV 2;",
      "    CALL mergeSort(A, inicio, medio);",
      "    CALL mergeSort(A, medio + 1, fin);",
      "    CALL merge(A, inicio, medio, fin);",
      "    RETURN 0;",
      "END",
      "",
      "merge(A[n], inicio, medio, fin) BEGIN",
      "    i <- inicio;",
      "    j <- medio + 1;",
      "    k <- 1;",
      "    WHILE (i <= medio AND j <= fin) DO BEGIN",
      "        IF (A[i] <= A[j]) THEN BEGIN",
      "            B[k] <- A[i];",
      "            i <- i + 1;",
      "        END",
      "        ELSE BEGIN",
      "            B[k] <- A[j];",
      "            j <- j + 1;",
      "        END",
      "        k <- k + 1;",
      "    END",
      "    RETURN 0;",
      "END",
    ),
  }),
];
