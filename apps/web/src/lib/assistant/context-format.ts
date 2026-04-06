import type {
  AssistantContext,
  AssistantExampleContext,
  AssistantExampleSectionContext,
  AssistantFeatureContext,
  AssistantFocusedPanelContext,
} from "./types";

const MAX_TEXT_CHARS = 4000;
const MAX_QUERY_CHARS = 240;
const MAX_ITEM_CHARS = 180;
const MAX_LIST_ITEMS = 8;
const MAX_VISIBLE_EXAMPLES = 10;
const MAX_EXAMPLE_SECTIONS = 6;
const MAX_EXAMPLE_SOURCE_CHARS = 1600;
const MAX_FEATURES = 10;
const MAX_PANEL_NOTES = 12;
const MAX_PANEL_NOTE_CHARS = 360;

function truncateText(value: string | undefined, maxChars = MAX_TEXT_CHARS) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function compactList(values: string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const compacted = values
    .map((value) => truncateText(value, MAX_ITEM_CHARS))
    .filter((value): value is string => Boolean(value))
    .slice(0, MAX_LIST_ITEMS);

  return compacted.length > 0 ? compacted : undefined;
}

function sanitizeExample(
  example: AssistantExampleContext,
): AssistantExampleContext {
  return {
    id: truncateText(example.id, MAX_ITEM_CHARS) || "example",
    slug: truncateText(example.slug, MAX_ITEM_CHARS) || "example",
    title: truncateText(example.title, MAX_ITEM_CHARS) || "Example",
    summary: truncateText(example.summary, 600),
    category: truncateText(example.category, MAX_ITEM_CHARS),
    family: truncateText(example.family, MAX_ITEM_CHARS),
    methods: compactList(example.methods),
    tags: compactList(example.tags),
    source: truncateText(example.source, MAX_EXAMPLE_SOURCE_CHARS),
  };
}

function sanitizeExampleSection(
  section: AssistantExampleSectionContext,
): AssistantExampleSectionContext {
  return {
    id: truncateText(section.id, MAX_ITEM_CHARS) || "examples-section",
    slug: truncateText(section.slug, MAX_ITEM_CHARS) || "examples-section",
    title: truncateText(section.title, MAX_ITEM_CHARS) || "Examples section",
    description: truncateText(section.description, 600),
    exampleCount:
      typeof section.exampleCount === "number" ? section.exampleCount : undefined,
    kind: section.kind,
  };
}

function sanitizeFocusedPanel(
  panel: AssistantFocusedPanelContext,
): AssistantFocusedPanelContext {
  return {
    id: truncateText(panel.id, MAX_ITEM_CHARS) || "focused-panel",
    title: truncateText(panel.title, MAX_ITEM_CHARS) || "Focused panel",
    description: truncateText(panel.description, 1000),
    notes: panel.notes
      ?.map((note) => truncateText(note, MAX_PANEL_NOTE_CHARS))
      .filter((note): note is string => Boolean(note))
      .slice(0, MAX_PANEL_NOTES),
  };
}

function sanitizeFeature(
  feature: AssistantFeatureContext,
): AssistantFeatureContext {
  return {
    id: truncateText(feature.id, MAX_ITEM_CHARS) || "feature",
    title: truncateText(feature.title, MAX_ITEM_CHARS) || "Feature",
    location: truncateText(feature.location, MAX_ITEM_CHARS),
    description: truncateText(feature.description, 600),
    availability: truncateText(feature.availability, MAX_ITEM_CHARS),
  };
}

export function sanitizeAssistantContext(
  context: AssistantContext,
): AssistantContext {
  return {
    surface: context.surface,
    locale: context.locale,
    pageContext: {
      route: truncateText(context.pageContext.route, MAX_ITEM_CHARS) || "/",
      view: truncateText(context.pageContext.view, MAX_ITEM_CHARS),
      title: truncateText(context.pageContext.title, MAX_ITEM_CHARS),
      description: truncateText(context.pageContext.description, 600),
      query: truncateText(context.pageContext.query, MAX_QUERY_CHARS),
      filters: compactList(context.pageContext.filters),
      notes: compactList(context.pageContext.notes),
    },
    formalAnalysisSummary: context.formalAnalysisSummary
      ? {
          parseStatus: context.formalAnalysisSummary.parseStatus,
          analysisStatus: context.formalAnalysisSummary.analysisStatus,
          algorithmType: truncateText(
            context.formalAnalysisSummary.algorithmType,
            MAX_ITEM_CHARS,
          ),
          selectedCase: truncateText(
            context.formalAnalysisSummary.selectedCase,
            MAX_ITEM_CHARS,
          ),
          selectedMethod: truncateText(
            context.formalAnalysisSummary.selectedMethod,
            MAX_ITEM_CHARS,
          ),
          hasCaseVariability:
            context.formalAnalysisSummary.hasCaseVariability === true,
          cases: context.formalAnalysisSummary.cases?.slice(0, 3).map((entry) => ({
            caseId: entry.caseId,
            bigO: truncateText(entry.bigO, MAX_ITEM_CHARS),
            bigOmega: truncateText(entry.bigOmega, MAX_ITEM_CHARS),
            bigTheta: truncateText(entry.bigTheta, MAX_ITEM_CHARS),
            efficiencyEquation: truncateText(entry.efficiencyEquation, 320),
            groupedCostExpression: truncateText(
              entry.groupedCostExpression,
              320,
            ),
          })),
          notes: compactList(context.formalAnalysisSummary.notes),
        }
      : undefined,
    sourceCode: truncateText(context.sourceCode, MAX_TEXT_CHARS),
    example: context.example ? sanitizeExample(context.example) : undefined,
    visibleExamples: context.visibleExamples
      ?.slice(0, MAX_VISIBLE_EXAMPLES)
      .map((example) => sanitizeExample(example)),
    exampleSections: context.exampleSections
      ?.slice(0, MAX_EXAMPLE_SECTIONS)
      .map((section) => sanitizeExampleSection(section)),
    guideSection: context.guideSection
      ? {
          id:
            truncateText(context.guideSection.id, MAX_ITEM_CHARS) ||
            "guide-section",
          title:
            truncateText(context.guideSection.title, MAX_ITEM_CHARS) ||
            "Guide section",
          description: truncateText(context.guideSection.description, 600),
          summary: truncateText(context.guideSection.summary, 1000),
        }
      : undefined,
    focusedPanel: context.focusedPanel
      ? sanitizeFocusedPanel(context.focusedPanel)
      : undefined,
    availableFeatures: context.availableFeatures
      ?.slice(0, MAX_FEATURES)
      .map((feature) => sanitizeFeature(feature)),
  };
}

function formatKeyValue(label: string, value: string | undefined) {
  return value ? `- ${label}: ${value}` : null;
}

export function buildAssistantSystemSupplement(context: AssistantContext): string {
  const isSpanish = context.locale.toLowerCase().startsWith("es");

  if (isSpanish) {
    return `

REGLAS DEL ASISTENTE EMBEBIDO
- Estás operando como un asistente complementario dentro de AALIE.
- Cuando exista un análisis formal visible en la app, ese análisis es la fuente de verdad.
- No sustituyas, corrijas ni opaques los resultados formales de $O$, $\\Omega$ o $\\Theta$ con conjeturas del LLM.
- Si falta análisis formal completo, limita tu respuesta a explicación, orientación, supuestos o próximos pasos y dilo explícitamente.
- Usa únicamente el contexto estructurado provisto por la app; si algo no está en el contexto, dilo sin inventarlo.
- Si hay un panel, modal, paso o sección en foco, esa es la referencia principal para preguntas como "que es esto", "que paso aqui", "explicame esto" o similares. Responde primero sobre eso y luego, si aporta valor, conecta con el analisis o la pagina completa.
- No hables de "el contexto que me diste" o "el contexto recibido". Evita repetir "En AALIE" o "Segun lo que veo en AALIE" en cada respuesta; usa referencias directas a la vista actual y solo menciona el nombre de la app cuando realmente aporte claridad.
- Si el usuario pregunta cómo validar resultados, prioriza las comprobaciones formales o manuales; si el tiempo es limitado, menciona la comparación con LLM de la app como contraste rápido complementario, nunca como prueba.
`.trim();
  }

  return `

EMBEDDED ASSISTANT RULES
- You are operating as a complementary assistant inside AALIE.
- When the app provides visible formal analysis, that formal analysis is the source of truth.
- Do not replace, override, or overshadow formal $O$, $\\Omega$, or $\\Theta$ results with LLM guesses.
- If complete formal analysis is missing, limit yourself to explanation, guidance, assumptions, or next steps and say so explicitly.
- Use only the structured app context you received; if context is missing, say so instead of inventing it.
- If there is an active panel, modal, step, or focused section, treat it as the primary referent for questions like "what is this", "what happened here", or similar. Answer that first, then connect it to the broader analysis or page only if it helps.
- Do not say "based on the context you gave me" or similar. Avoid repeating "In AALIE" or "Based on what I can see in AALIE" in every answer; refer directly to the current view and mention the app name only when it adds clarity.
- If the user asks how to validate results, prioritize formal or manual checks; if time is limited, mention the app's LLM comparison as a quick complementary cross-check, never as proof.
`.trim();
}

export function formatAssistantContextForPrompt(context: AssistantContext): string {
  const safeContext = sanitizeAssistantContext(context);
  const sections: string[] = [];

  sections.push("CONTEXTO EMBEBIDO DE AALIE");
  sections.push(`- surface: ${safeContext.surface}`);
  sections.push(`- locale: ${safeContext.locale}`);
  sections.push(
    ...[
      formatKeyValue("route", safeContext.pageContext.route),
      formatKeyValue("view", safeContext.pageContext.view),
      formatKeyValue("title", safeContext.pageContext.title),
      formatKeyValue("description", safeContext.pageContext.description),
      formatKeyValue("query", safeContext.pageContext.query),
      safeContext.pageContext.filters
        ? `- filters: ${safeContext.pageContext.filters.join(", ")}`
        : null,
      safeContext.pageContext.notes
        ? `- notes: ${safeContext.pageContext.notes.join(" | ")}`
        : null,
    ].filter((value): value is string => Boolean(value)),
  );

  if (safeContext.focusedPanel) {
    sections.push("");
    sections.push("FOCO ACTUAL PRIORITARIO");
    sections.push(
      "Si el usuario usa referencias ambiguas como 'esto', 'aqui', 'este paso' o 'esta vista', responde primero sobre este panel o modal.",
    );
    sections.push(
      ...[
        formatKeyValue("panelId", safeContext.focusedPanel.id),
        formatKeyValue("title", safeContext.focusedPanel.title),
        formatKeyValue("description", safeContext.focusedPanel.description),
      ].filter((value): value is string => Boolean(value)),
    );
    if (safeContext.focusedPanel.notes) {
      sections.push(
        ...safeContext.focusedPanel.notes.map((note) => `- ${note}`),
      );
    }
  }

  if (safeContext.guideSection) {
    sections.push("");
    sections.push("SECCION DE GUIA EN FOCO");
    sections.push(
      ...[
        formatKeyValue("guideId", safeContext.guideSection.id),
        formatKeyValue("title", safeContext.guideSection.title),
        formatKeyValue("description", safeContext.guideSection.description),
        formatKeyValue("summary", safeContext.guideSection.summary),
      ].filter((value): value is string => Boolean(value)),
    );
  }

  if (safeContext.example) {
    sections.push("");
    sections.push("EJEMPLO EN FOCO");
    sections.push(
      ...[
        formatKeyValue("exampleId", safeContext.example.id),
        formatKeyValue("slug", safeContext.example.slug),
        formatKeyValue("title", safeContext.example.title),
        formatKeyValue("summary", safeContext.example.summary),
        formatKeyValue("category", safeContext.example.category),
        formatKeyValue("family", safeContext.example.family),
        safeContext.example.methods
          ? `- methods: ${safeContext.example.methods.join(", ")}`
          : null,
        safeContext.example.tags
          ? `- tags: ${safeContext.example.tags.join(", ")}`
          : null,
      ].filter((value): value is string => Boolean(value)),
    );
    if (safeContext.example.source) {
      sections.push("```pseudocode");
      sections.push(safeContext.example.source);
      sections.push("```");
    }
  }

  if (safeContext.formalAnalysisSummary) {
    sections.push("");
    sections.push("ANALISIS FORMAL DISPONIBLE");
    sections.push(
      ...[
        formatKeyValue(
          "parseStatus",
          safeContext.formalAnalysisSummary.parseStatus,
        ),
        formatKeyValue(
          "analysisStatus",
          safeContext.formalAnalysisSummary.analysisStatus,
        ),
        formatKeyValue(
          "algorithmType",
          safeContext.formalAnalysisSummary.algorithmType,
        ),
        formatKeyValue(
          "selectedCase",
          safeContext.formalAnalysisSummary.selectedCase,
        ),
        formatKeyValue(
          "selectedMethod",
          safeContext.formalAnalysisSummary.selectedMethod,
        ),
        safeContext.formalAnalysisSummary.hasCaseVariability
          ? "- hasCaseVariability: true"
          : null,
      ].filter((value): value is string => Boolean(value)),
    );

    safeContext.formalAnalysisSummary.cases?.forEach((entry) => {
      sections.push(
        `- case ${entry.caseId}: O=${entry.bigO || "n/a"}, Omega=${entry.bigOmega || "n/a"}, Theta=${entry.bigTheta || "n/a"}`,
      );
      if (entry.efficiencyEquation) {
        sections.push(`  efficiencyEquation: ${entry.efficiencyEquation}`);
      }
      if (entry.groupedCostExpression) {
        sections.push(`  groupedCostExpression: ${entry.groupedCostExpression}`);
      }
    });

    if (safeContext.formalAnalysisSummary.notes) {
      sections.push(
        `- formalNotes: ${safeContext.formalAnalysisSummary.notes.join(" | ")}`,
      );
    }
  }

  if (safeContext.exampleSections && safeContext.exampleSections.length > 0) {
    sections.push("");
    sections.push("SECCIONES DE EJEMPLOS DISPONIBLES");
    safeContext.exampleSections.forEach((section) => {
      const details = [
        section.slug ? `slug=${section.slug}` : null,
        typeof section.exampleCount === "number"
          ? `count=${section.exampleCount}`
          : null,
        section.kind ? `kind=${section.kind}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(", ");

      sections.push(
        `- ${section.title}${details ? ` (${details})` : ""}`,
      );
      if (section.description) {
        sections.push(`  description: ${section.description}`);
      }
    });
  }

  if (safeContext.visibleExamples && safeContext.visibleExamples.length > 0) {
    sections.push("");
    sections.push("ALGORITMOS VISIBLES EN ESTA VISTA");
    safeContext.visibleExamples.forEach((example) => {
      sections.push(`- ${example.title} (slug=${example.slug})`);
      if (example.summary) {
        sections.push(`  summary: ${example.summary}`);
      }
      if (example.category) {
        sections.push(`  category: ${example.category}`);
      }
      if (example.family) {
        sections.push(`  family: ${example.family}`);
      }
      if (example.methods && example.methods.length > 0) {
        sections.push(`  methods: ${example.methods.join(", ")}`);
      }
      if (example.tags && example.tags.length > 0) {
        sections.push(`  tags: ${example.tags.join(", ")}`);
      }
      if (example.source) {
        sections.push("```pseudocode");
        sections.push(example.source);
        sections.push("```");
      }
    });
  }

  if (safeContext.availableFeatures && safeContext.availableFeatures.length > 0) {
    sections.push("");
    sections.push("FUNCIONALIDADES RELEVANTES DE LA APP");
    safeContext.availableFeatures.forEach((feature) => {
      sections.push(`- ${feature.title}`);
      if (feature.location) {
        sections.push(`  location: ${feature.location}`);
      }
      if (feature.description) {
        sections.push(`  description: ${feature.description}`);
      }
      if (feature.availability) {
        sections.push(`  availability: ${feature.availability}`);
      }
    });
  }

  if (safeContext.sourceCode) {
    sections.push("");
    sections.push("CODIGO VISIBLE");
    sections.push("```pseudocode");
    sections.push(safeContext.sourceCode);
    sections.push("```");
  }

  return sections.join("\n");
}
