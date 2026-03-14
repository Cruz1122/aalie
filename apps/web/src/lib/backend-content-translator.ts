/**
 * Traductor centralizado de contenido del backend (español → inglés).
 *
 * El backend devuelve proof steps, summation.evaluated y otros textos en español.
 * Este módulo es el único punto de configuración para esas traducciones.
 *
 * Segmentación:
 * - LaTeX \text{...}: pasos de prueba, ecuaciones característica, iteración, árbol
 * - Texto plano: summation.evaluated, mensajes de análisis complejo
 *
 * Uso: translateBackendContent(text, locale) en cualquier componente que muestre
 * contenido proveniente del backend (proof steps, Formula con latex del API, etc.)
 *
 * Orden: reemplazos más largos primero para evitar solapamientos.
 */
const BACKEND_CONTENT_TRANSLATIONS: [string, string][] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS (valor de method_name en "Método detectado: X")
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "\\text{Método de Ecuación Característica}",
    "\\text{Characteristic Equation Method}",
  ],
  ["\\text{Método de Iteración}", "\\text{Iteration Method}"],
  ["\\text{Método de Árbol de Recursión}", "\\text{Recursion Tree Method}"],
  ["\\text{Teorema Maestro}", "\\text{Master Theorem}"],

  // ═══════════════════════════════════════════════════════════════════════════
  // ECUACIÓN CARACTERÍSTICA
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "\\text{, para la ecuación característica homogénea asociada (ignorando }",
    "\\text{, for the associated homogeneous characteristic equation (ignoring }",
  ],
  ["\\text{), reemplazando }", "\\text{), substituting }"],
  ["\\text{, reemplazando }", "\\text{, substituting }"],
  ["\\text{ obtenemos: }", "\\text{ we get: }"],
  ["\\text{De }", "\\text{From }"],
  [
    "\\text{Esta recurrencia corresponde a un caso de Programación Dinámica Lineal}",
    "\\text{This recurrence corresponds to a Linear Dynamic Programming case}",
  ],
  [
    "\\text{Aplicando Método de Ecuación Característica}",
    "\\text{Applying Characteristic Equation Method}",
  ],
  ["\\text{Solución: }", "\\text{Solution: }"],

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACCIÓN Y PARÁMETROS
  // ═══════════════════════════════════════════════════════════════════════════
  ["\\text{Iniciando extracción de recurrencia}", "\\text{Starting recurrence extraction}"],
  ["\\text{Encontradas }", "\\text{Found }"],
  ["\\text{ llamadas recursivas}", "\\text{ recursive calls}"],
  ["\\text{Método detectado: }", "\\text{Method detected: }"],
  ["\\text{Parámetros extraídos: }", "\\text{Extracted parameters: }"],

  // ═══════════════════════════════════════════════════════════════════════════
  // TEOREMA MAESTRO
  // ═══════════════════════════════════════════════════════════════════════════
  ["\\text{Calculando }", "\\text{Computing }"],
  ["\\text{Comparando }", "\\text{Comparing }"],
  ["\\text{ vs }", "\\text{ vs }"],
  ["\\text{ (Caso }", "\\text{ (Case }"],
  ["\\text{Mejor caso: }", "\\text{Best case: }"],
  [
    "\\text{ (return temprano detectado, no se ejecuta recursión)}",
    "\\text{ (early return detected, no recursion executed)}",
  ],
  ["\\text{ (return temprano detectado)}", "\\text{ (early return detected)}"],
  ["\\text{Caso }", "\\text{Case }"],

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODO DE ITERACIÓN - Pasos estándar
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "\\text{Aplicando Método de Iteración (Unrolling)}",
    "\\text{Applying Iteration Method (Unrolling)}",
  ],
  ["\\text{Paso 1: Recurrencia identificada }", "\\text{Step 1: Recurrence identified }"],
  ["\\text{Paso 2: Primera expansión }", "\\text{Step 2: First expansion }"],
  ["\\text{Segunda expansión }", "\\text{Second expansion }"],
  ["\\text{Paso 3: Forma general }", "\\text{Step 3: General form }"],
  ["\\text{Paso 4: Caso base }", "\\text{Step 4: Base case }"],
  ["\\text{Paso 5: Sustitución }", "\\text{Step 5: Substitution }"],
  ["\\text{Paso 6: Evaluación }", "\\text{Step 6: Evaluation }"],
  ["\\text{Paso 6: Resultado aproximado}", "\\text{Step 6: Approximate result}"],
  ["\\text{Paso 6: Resultado }", "\\text{Step 6: Result }"],
  ["\\text{Paso 7: Resultado final }", "\\text{Step 7: Final result }"],
  ["\\text{Paso 7: Resultado aproximado }", "\\text{Step 7: Approximate result }"],
  ["\\text{Paso 7: Resultado }", "\\text{Step 7: Result }"],
  ["\\text{Paso 2: Expansión}", "\\text{Step 2: Expansion}"],
  ["\\text{Paso 3: Forma general}", "\\text{Step 3: General form}"],
  ["\\text{Paso 4: Caso base}", "\\text{Step 4: Base case}"],
  [
    "\\text{Paso 5: Evaluación de la sumatoria}",
    "\\text{Step 5: Summation evaluation}",
  ],
  [
    "\\text{Nota: Esta recurrencia tiene coeficiente }",
    "\\text{Note: This recurrence has coefficient }",
  ],
  [
    "\\text{. Se requiere análisis especial.}",
    "\\text{. Special analysis required.}",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODO DE ITERACIÓN - Fibonacci / múltiples términos
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "\\text{Nota: Esta es una recurrencia lineal de segundo orden (tipo Fibonacci). Se requiere análisis especial.}",
    "\\text{Note: This is a second-order linear recurrence (Fibonacci type). Special analysis required.}",
  ],
  [
    "\\text{Paso 2: Análisis del árbol de recursión}",
    "\\text{Step 2: Recursion tree analysis}",
  ],
  [
    "\\text{Cada llamada genera 2 subproblemas (T(n-1) y T(n-2))}",
    "\\text{Each call generates 2 subproblems (T(n-1) and T(n-2))}",
  ],
  ["\\text{Paso 3: Número de nodos}", "\\text{Step 3: Number of nodes}"],
  [
    "\\text{En el nivel i, hay aproximadamente 2^i nodos}",
    "\\text{At level i, there are approximately 2^i nodes}",
  ],
  ["\\text{Paso 4: Altura del árbol}", "\\text{Step 4: Tree height}"],
  ["\\text{La altura aproximada es }", "\\text{The approximate height is }"],
  [
    "\\text{ (cada nivel reduce en 1 o 2)}",
    "\\text{ (each level reduces by 1 or 2)}",
  ],
  ["\\text{Paso 5: Cálculo del costo total}", "\\text{Step 5: Total cost calculation}"],
  [
    "\\text{(cota superior. La complejidad exacta es }",
    "\\text{(upper bound. The exact complexity is }",
  ],
  ["\\text{ donde }", "\\text{ where }"],
  ["\\text{ es el número áureo)}", "\\text{ is the golden ratio)}"],
  [
    "\\text{Nota: Esta recurrencia tiene múltiples términos recursivos y requiere técnicas especiales.}",
    "\\text{Note: This recurrence has multiple recursive terms and requires special techniques.}",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ÁRBOL DE RECURSIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "\\text{Aplicando Método de Árbol de Recursión}",
    "\\text{Applying Recursion Tree Method}",
  ],
  ["\\text{Nivel dominante: }", "\\text{Dominating level: }"],
  [
    "\\text{ (cada nodo tiene costo }",
    "\\text{ (each node has cost }",
  ],
  ["\\text{Último nivel tiene costo }", "\\text{Last level has cost }"],
  ["\\text{Trabajo en hojas (}", "\\text{Work at leaves (}"],
  ["\\text{Trabajo en hojas }", "\\text{Work at leaves }"],
  ["\\text{Trabajo en raíz }", "\\text{Work at root }"],
  ["\\text{Cada nivel tiene costo }", "\\text{Each level has cost }"],
  ["\\text{Total }", "\\text{Total }"],
  [
    "\\text{Depende de la relación entre }",
    "\\text{Depends on the relationship between }",
  ],
  ["\\text{ y }", "\\text{ and }"],

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTO PLANO (summation.evaluated, mensajes de análisis)
  // ═══════════════════════════════════════════════════════════════════════════
  ["Análisis complejo requerido", "Complex analysis required"],
  [
    "Análisis complejo (término dominante ",
    "Complex analysis (dominant term ",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // DP VALIDATION REASONS
  // ═══════════════════════════════════════════════════════════════════════════
  [
    "La recurrencia es divide-and-conquer; debe priorizarse Teorema Maestro, iteración o árbol de recursión antes que PD.",
    "The recurrence is divide-and-conquer; prioritize Master Theorem, iteration, or recursion tree over DP.",
  ],
  [
    "La recurrencia requiere conservar estados no contiguos o un historial más largo que una ventana pequeña.",
    "The recurrence requires preserving non-contiguous states or a history longer than a small window.",
  ],
  [
    "La recurrencia requiere conservar estados no contiguos o un historial más largo que una ventana pequeña",
    "The recurrence requires preserving non-contiguous states or a history longer than a small window",
  ],
  [
    "La recurrencia depende solo de los últimos estados contiguos y puede optimizarse con memoria acotada.",
    "The recurrence depends only on the last contiguous states and can be optimized with bounded memory.",
  ],
  [
    "Las llamadas recursivas reutilizan subproblemas definidos por el mismo parámetro de tamaño.",
    "Recursive calls reuse subproblems defined by the same size parameter.",
  ],
  ["DP validada: ", "DP validated: "],
  ["DP descartada: ", "DP rejected: "],
];

/**
 * Traduce contenido del backend (español → inglés) según el locale.
 * Usar para: proof steps, summation.evaluated, summation.expression,
 * dominating_level.reason, y cualquier texto que venga del API en español.
 *
 * @param content - Texto o LaTeX del backend (puede incluir \text{...})
 * @param locale - "es" | "en"; si es "es" devuelve sin cambios
 */
export function translateBackendContent(
  content: string | null | undefined,
  locale: "en" | "es",
): string {
  if (locale === "es" || !content) return content ?? "";

  let result = content.normalize("NFC");

  const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const toFlexibleWhitespacePattern = (value: string): RegExp => {
    const escaped = escapeRegex(value);
    const flexible = escaped.replace(/\s+/g, "\\s+");
    return new RegExp(flexible, "g");
  };

  for (const [es, en] of BACKEND_CONTENT_TRANSLATIONS) {
    result = result.replace(toFlexibleWhitespacePattern(es), en);
    result = result.split(es).join(en);
  }
  return result;
}

