/**
 * Traduce texto LaTeX de pasos de prueba (proof steps) de español a inglés.
 * El backend devuelve proof steps con \text{...} en español.
 * Orden: reemplazos más largos primero para evitar solapamientos.
 */
const ES_TO_EN: [string, string][] = [
  // Métodos (como valor de method_name en "Método detectado: X")
  [
    "\\text{Método de Ecuación Característica}",
    "\\text{Characteristic Equation Method}",
  ],
  ["\\text{Método de Iteración}", "\\text{Iteration Method}"],
  ["\\text{Método de Árbol de Recursión}", "\\text{Recursion Tree Method}"],
  ["\\text{Teorema Maestro}", "\\text{Master Theorem}"],
  // Paso ecuación característica (Step 5)
  [
    "\\text{, para la ecuación característica homogénea asociada (ignorando }",
    "\\text{, for the associated homogeneous characteristic equation (ignoring }",
  ],
  ["\\text{), reemplazando }", "\\text{), substituting }"],
  ["\\text{, reemplazando }", "\\text{, substituting }"],
  ["\\text{ obtenemos: }", "\\text{ we get: }"],
  ["\\text{De }", "\\text{From }"],
  // Resto de pasos
  [
    "\\text{Esta recurrencia corresponde a un caso de Programación Dinámica Lineal}",
    "\\text{This recurrence corresponds to a Linear Dynamic Programming case}",
  ],
  [
    "\\text{Aplicando Método de Ecuación Característica}",
    "\\text{Applying Characteristic Equation Method}",
  ],
  [
    "\\text{Aplicando Método de Iteración (Unrolling)}",
    "\\text{Applying Iteration Method (Unrolling)}",
  ],
  [
    "\\text{Aplicando Método de Árbol de Recursión}",
    "\\text{Applying Recursion Tree Method}",
  ],
  ["\\text{Solución: }", "\\text{Solution: }"],
  ["\\text{Iniciando extracción de recurrencia}", "\\text{Starting recurrence extraction}"],
  ["\\text{Encontradas }", "\\text{Found }"],
  ["\\text{ llamadas recursivas}", "\\text{ recursive calls}"],
  ["\\text{Método detectado: }", "\\text{Method detected: }"],
  ["\\text{Parámetros extraídos: }", "\\text{Extracted parameters: }"],
  ["\\text{Calculando }", "\\text{Computing }"],
  ["\\text{Comparando }", "\\text{Comparing }"],
  ["\\text{ vs }", "\\text{ vs }"],
  ["\\text{ (Caso }", "\\text{ (Case }"],
  ["\\text{Mejor caso: }", "\\text{Best case: }"],
  ["\\text{ (return temprano detectado)}", "\\text{ (early return detected)}"],
  ["\\text{Caso }", "\\text{Case }"],
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
  // Iteración - Fibonacci / árbol de recursión
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
  [
    "\\text{La altura aproximada es }",
    "\\text{The approximate height is }",
  ],
  [
    "\\text{ (cada nivel reduce en 1 o 2)}",
    "\\text{ (each level reduces by 1 or 2)}",
  ],
  ["\\text{Paso 5: Cálculo del costo total}", "\\text{Step 5: Total cost calculation}"],
  ["\\text{Paso 6: Resultado }", "\\text{Step 6: Result }"],
  [
    "\\text{(cota superior. La complejidad exacta es }",
    "\\text{(upper bound. The exact complexity is }",
  ],
  [
    "\\text{ donde }",
    "\\text{ where }",
  ],
  [
    "\\text{ es el número áureo)}",
    "\\text{ is the golden ratio)}",
  ],
  [
    "\\text{Nota: Esta recurrencia tiene múltiples términos recursivos y requiere técnicas especiales.}",
    "\\text{Note: This recurrence has multiple recursive terms and requires special techniques.}",
  ],
  [
    "\\text{. Se requiere análisis especial.}",
    "\\text{. Special analysis required.}",
  ],
  ["\\text{Paso 2: Expansión}", "\\text{Step 2: Expansion}"],
  ["\\text{Paso 3: Forma general}", "\\text{Step 3: General form}"],
  ["\\text{Paso 4: Caso base}", "\\text{Step 4: Base case}"],
  [
    "\\text{Paso 5: Evaluación de la sumatoria}",
    "\\text{Step 5: Summation evaluation}",
  ],
  // Árbol de recursión
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
];

/**
 * Traduce un paso de prueba LaTeX de español a inglés.
 */
export function translateProofStep(latex: string, locale: "en" | "es"): string {
  if (locale === "es" || !latex) return latex;

  let result = latex;
  for (const [es, en] of ES_TO_EN) {
    result = result.split(es).join(en);
  }
  return result;
}
