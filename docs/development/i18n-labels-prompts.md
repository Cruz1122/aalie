# Internacionalización, Labels y Prompts

Este documento describe el soporte multiidioma (español/inglés), el sistema de labels en backend para procedimientos y trace de ejecución, y los prompts de LLM parametrizados por idioma.

## Internacionalización (Frontend)

### next-intl

La aplicación utiliza **next-intl** para internacionalización:

- **Archivos de mensajes**: `apps/web/messages/es.json` y `apps/web/messages/en.json`
- **Namespaces**: `common`, `nav`, `footer`, `analyzer`, `metadata`, `documentation`, etc.
- **Uso en componentes**: `useTranslations("namespace")` → `t("key")`

### Rutas con prefijo de idioma

Las rutas incluyen el locale como segmento dinámico:

- `/es/analyzer`, `/en/analyzer`
- `/es/examples`, `/en/examples`
- `/es/user-guide`, `/en/user-guide`
- `/es/documentation/technical`, `/en/documentation/technical`

**Ubicación**: `apps/web/src/app/[locale]/`

### Componentes de i18n

- **LocaleSwitcher**: Selector de idioma en el Header (ES/EN)
- **useLocale()**: Hook que devuelve el locale actual (`"es"` | `"en"`)
- **useTranslations(namespace)**: Hook para obtener traducciones
- **Navegación**: Usar `Link`, `useRouter`, `usePathname` de `@/i18n/navigation` para preservar el locale en la navegación

### Flujo de locale en requests

El frontend obtiene el locale con `useLocale()` y lo envía en el body de las peticiones:

```typescript
// Ejemplo: ManualModeView, ChatBot, ExecutionTraceModal
const locale = useLocale();

await fetch(`${API_BASE_URL}/analyze/open`, {
  method: "POST",
  body: JSON.stringify({
    source: code,
    mode: "worst",
    locale: locale === "es" ? "es" : "en",
  }),
});
```

---

## Sistema de Labels (Backend)

### Ubicación

`apps/api/app/modules/analysis/translations.py`

### Diccionarios de labels

| Diccionario | Uso | Idiomas |
|-------------|-----|---------|
| `PROCEDURE_LABELS` | Etiquetas de pasos del procedimiento (sumatorias, simplificación, etc.) | en, es |
| `NOTES_LABELS` | Notas por línea y notas generales (row.note, totals.notes, avg_model_info) | en, es |
| `TRACE_STEP_LABELS` | Descripciones de pasos del trace de ejecución | en, es |

### Funciones de acceso

```python
def get_labels(locale: str = "en") -> Dict[str, str]:
    """Devuelve las etiquetas para el procedimiento según locale."""

def get_note_labels(locale: str = "en") -> Dict[str, str]:
    """Devuelve las etiquetas de notas para el locale dado."""

def get_trace_step_labels(locale: str = "en") -> Dict[str, str]:
    """Devuelve las etiquetas de pasos del trace para el locale dado."""
```

Fallback: si el locale no existe, se usa `"en"`.

### Uso en el backend

- **BaseAnalyzer**, **IterativeAnalyzer**, **RecursiveAnalyzer**: Reciben `locale` en el constructor y usan `get_note_labels(locale)` para notas por línea
- **SummationCloser**: Usa `get_labels(locale)` para etiquetas de sumatorias en el procedimiento
- **Executor** (trace): Usa `get_trace_step_labels(locale)` para describir cada paso de ejecución
- **AvgModel**: `get_model_info(locale)` para información del modelo probabilístico

### Parámetro locale en endpoints

| Endpoint | Parámetro | Default |
|----------|-----------|---------|
| `POST /analyze/open` | `locale` en body | `"en"` |
| `POST /analyze/trace` | `locale` en body | `"en"` |

---

## Sistema de Prompts por Idioma

### Índice central de prompts

**Ubicación**: `apps/web/src/app/api/llm/prompts/index.ts`

```typescript
export function getPrompt(job: LLMJob, locale?: string): string {
  const loc = normalizeLocale(locale);  // "es" | "en", default "es"
  switch (job) {
    case "classify": return classify[loc];
    case "parser_assist": return parserAssistBase + getResponseLanguageInstruction(loc);
    case "general": return generalBase + getResponseLanguageInstruction(loc);
    case "simplifier": return simplifier[loc];
    case "repair": return repair[loc];
    case "compare": return compare[loc];
    default: return parserAssistBase + getResponseLanguageInstruction(loc);
  }
}
```

### Jobs con prompts localizados

Todos los jobs activos tienen prompts en español e inglés:

- `parser_assist`, `general`: Base común + instrucción de idioma de respuesta
- `classify`, `simplifier`, `repair`, `compare`: Prompts completos por locale

### Instrucciones de idioma de respuesta

**Ubicación**: `apps/web/src/app/api/llm/prompts/response-language.ts`

```typescript
export function getResponseLanguageInstruction(locale: SupportedLocale): string;
export function getExplanationLanguageInstruction(locale: SupportedLocale): string;
export function getExplanationFormatInstruction(locale: SupportedLocale): string;
```

Añaden instrucciones críticas al final del prompt para que el LLM responda en el idioma del usuario (español o inglés).

### Prompts de diagramas

| Archivo | Función | Uso |
|---------|---------|-----|
| `generate-diagram.ts` | `getGenerateDiagramSystemPrompt(locale)` | Diagramas de flujo para trace iterativo |
| `recursion-diagram.ts` | `getRecursionDiagramSystemPrompt(locale, depth_limit)` | Diagramas de árbol recursivo |

Ambos reciben `locale` y adaptan el prompt para que los labels y explicaciones se generen en el idioma correcto.

### Parámetro locale en requests LLM

```typescript
// POST /api/llm
body: JSON.stringify({
  job: "parser_assist",
  message: "...",
  locale: "es",  // opcional
});

// getJobConfig(job, locale) en llm-config.ts
// Devuelve { systemPrompt: getPromptByLocale(job, locale), ... }
```

---

## Diagrama de flujo de locale

```mermaid
flowchart LR
    subgraph Frontend
        A[useLocale]
        B[Request body]
        A -->|locale: es/en| B
    end

    subgraph API
        C[/api/llm]
        D[/analyze/open]
        E[/analyze/trace]
        B --> C
        B --> D
        B --> E
    end

    subgraph Backend
        F[getPrompt job locale]
        G[IterativeAnalyzer locale]
        H[Executor locale]
        C --> F
        D --> G
        E --> H
    end
```

---

## Traductor de contenido del backend (Frontend)

### Ubicación y propósito

**Archivo**: `apps/web/src/lib/backend-content-translator.ts`

El backend de análisis recursivo (`RecursiveAnalyzer`) genera proof steps, `summation.evaluated` y otros textos en español. Este módulo centraliza la traducción español → inglés para todo ese contenido.

### Segmentación del diccionario

| Segmento | Contenido | Ejemplos |
|----------|-----------|----------|
| Métodos | Nombres de métodos de análisis | Teorema Maestro, Método de Iteración |
| Ecuación característica | Pasos de la ecuación | De ..., reemplazando, obtenemos |
| Extracción | Parámetros y recurrencia | Parámetros extraídos, Encontradas N llamadas |
| Teorema Maestro | Casos, comparación | Calculando, Caso 1, Mejor caso |
| Método de iteración | Pasos estándar y Fibonacci | Paso 1: Recurrencia identificada |
| Árbol de recursión | Niveles, trabajo | Nivel dominante, Trabajo en hojas |
| Texto plano | summation.evaluated | Análisis complejo requerido |

### Uso

```typescript
import { translateBackendContent } from "@/lib/backend-content-translator";

// En componentes que muestran contenido del backend
const locale = useLocale() as "en" | "es";

<Formula
  latex={translateBackendContent(step.text, locale)}
  display
/>
```

**Componentes que deben usar `translateBackendContent`**:

- Proof steps: `RecursiveProcedureModal`, `IterationProcedureModal`, `RecursionTreeProcedureModal`, `RecursionTreeStepsModal`, `CharacteristicEquationModal`
- Summation: `iteration.summation.expression`, `iteration.summation.evaluated`, `recursion_tree.summation.*`
- Razones: `dominating_level.reason` en árbol de recursión

---

## Referencias

- [Convenciones de desarrollo](../development/conventions.md) - Sección "Labels y literales (i18n)"
- [Usos de LLM y modelos](../llm/usage-and-models.md) - Configuración de jobs y modelos
- [API Key Configuration](./api-key-configuration.md) - Configuración de API key
