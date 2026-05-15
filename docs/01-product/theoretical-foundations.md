# Fundamentos teóricos

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** docente | estudiante | dev
**Fuente de verdad:** `apps/api/app/modules/analysis/`, `packages/types/src/index.ts`, `apps/api/app/modules/export/snapshot_builder.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.2 Fundamentos Teóricos

## Propósito

Definir cada concepto teórico de análisis de algoritmos tanto en su forma académica como en su implementación operativa dentro de AALIE. Este documento conecta la teoría con el comportamiento del sistema.

## Alcance

Cubre los conceptos fundamentales de complejidad temporal que AALIE implementa, desde definiciones básicas hasta mecanismos específicos del motor.

## Fuente de verdad

- Cormen et al. "Introduction to Algorithms" (definiciones canónicas).
- Sedgewick & Wayne "Algorithms" (definiciones complementarias).
- Implementación real en `apps/api/app/modules/analysis/`.
- Tipos compartidos en `packages/types/src/index.ts`.

## Estructura

### Algoritmo

**Definición teórica:** Secuencia finita de pasos no ambiguos que resuelve un problema computacional. Debe tener entrada, salida, finitud, definitud y efectividad.

**Definición operativa en AALIE:** Un procedimiento escrito en pseudocódigo AALIE (gramática `Language.g4`). Debe tener forma `nombre(params) BEGIN ... END`. Puede incluir asignaciones, condicionales, ciclos, llamadas a funciones, y retornos.

**Cómo aparece en UI/API/export:** El usuario escribe el pseudocódigo en el editor Monaco (UI). Se envía como `source` en `POST /grammar/parse`. En export aparece como `originalPseudocode` en el snapshot.

**Limitación:** Solo se acepta la gramática AALIE, no lenguajes de propósito general.

### Pseudocódigo

**Definición teórica:** Representación informal de un algoritmo que usa convenciones de un lenguaje de programación pero está diseñada para ser leída por humanos.

**Definición operativa en AALIE:** Lenguaje controlado definido por `Language.g4` (ANTLR4). Usa `<-` para asignación, `MOD` para módulo, `DIV` para división entera, `BEGIN...END` para bloques, y `;` como terminador de sentencias. No tiene tipos de variables explícitos. Caso insensitivo.

**Cómo aparece en UI/API/export:** Se escribe en el editor Monaco con resaltado de sintaxis. Se parsea con ANTLR4. En export aparece como `originalPseudocode`.

**Limitación:** No es Turing-complete en el sentido práctico (no hay entrada/salida de archivos, no hay manejo de memoria dinámica).

### Tamaño de entrada

**Definición teórica:** Medida del volumen de datos que un algoritmo procesa. Usualmente denotada como `n`. Puede ser el número de elementos, el número de bits, o una tupla de parámetros.

**Definición operativa en AALIE:** Se extrae de los parámetros del procedimiento. El analizador usa las variables de los parámetros como símbolos para las cotas. Por defecto, el primer parámetro numérico se asume como `n`. Los parámetros de tipo array se asumen como `A` (con tamaño `n` o `length(A)`).

**Cómo aparece en UI/API/export:** `totals.symbols` mapea `n` a `length(A)` o similar. En la UI se muestra como "n = length(A)". En export aparece en la tabla de símbolos del snapshot.

**Limitación:** Solo parámetros directos del procedimiento. No hay detección automática de tamaño de entrada para estructuras de datos complejas.

### Complejidad temporal

**Definición teórica:** Función `T(n)` que describe el número de operaciones elementales que ejecuta un algoritmo en función del tamaño de entrada `n`.

**Definición operativa en AALIE:** AALIE calcula `T(n)` como una expresión simbólica (LaTeX/KaTeX). NO cubre complejidad espacial (memoria). Se expresa como `T_open` (forma abierta con sumatorias) y opcionalmente como `T_polynomial` (forma cerrada).

**Cómo aparece en UI/API/export:** `totals.T_open` (KaTeX), `totals.T_polynomial` (KaTeX). En UI se muestra en la sección de resultados. En export aparece en la tabla de costos.

**Limitación:** Solo complejidad temporal. No hay análisis de complejidad espacial.

### Modelo de costo

**Definición teórica:** Conjunto de reglas que definen qué operaciones cuentan y con qué peso. El modelo más común es el de costo uniforme: cada operación elemental tiene costo 1.

**Definición operativa en AALIE:** Usa el modelo de costo uniforme. Cada línea tiene un costo elemental `C_k` (constante simbólica). Operaciones como asignación, suma, acceso a array, comparación cuentan como 1 operación elemental cada una.

**Cómo aparece en UI/API/export:** `byLine[].ck` (etiqueta C_k), `byLine[].ops` (operaciones elementales por línea). En export aparece en la tabla de costos por línea.

**Limitación:** No hay modelo de costo logarítmico (para números grandes) ni de costo de acceso a memoria. El usuario no puede personalizar los pesos de `C_k`.

### Costo por línea

**Definición teórica:** Descomposición del costo total `T(n)` como suma de los costos de cada línea del programa: cada línea contribuye `C_k * count_k` donde `C_k` es el costo elemental y `count_k` es el número de veces que se ejecuta.

**Definición operativa en AALIE:** `byLine` es un array de `LineCost`. Cada entrada tiene: `line` (número de línea), `kind` (tipo: assign, if, for, etc.), `ck` (etiqueta C_k), `ops` (operaciones elementales), `count` (ejecuciones simplificadas), `count_raw` (ejecuciones con sumatorias), `note` (aclaraciones).

**Cómo aparece en UI/API/export:** `POST /analyze/open` → `byLine[]`. En UI se muestra como tabla. En export aparece en la sección de análisis iterativo.

**Limitación:** El costo elemental es único por línea. No hay descomposición fina de operaciones dentro de una misma línea.

### Conteo elemental

**Definición teórica:** Número de operaciones elementales (asignaciones, operaciones aritméticas, comparaciones, accesos a memoria) que una línea ejecuta en una iteración.

**Definición operativa en AALIE:** `byLine[].ops` almacena este conteo. Por defecto:
- Asignación: 1 op
- Operación aritmética: 1 op
- Comparación: 1 op
- Acceso a array: 1 op
- Llamada a función: 1 + ops de los argumentos

**Cómo aparece en UI/API/export:** `byLine[].ops`. Se usa para calcular `C_k = c_k * ops` en la expresión final.

**Limitación:** No distingue entre tipos de operación (entero vs flotante, array vs escalar).

### Sumatoria abierta

**Definición teórica:** Expresión del costo total usando notación de sumatoria sin simplificar. Por ejemplo: `\sum_{i=1}^{n} \sum_{j=1}^{i} C_1`.

**Definición operativa en AALIE:** `T_open` contiene la expresión con sumatorias en KaTeX. Se genera durante el análisis iterativo y se mantiene sin simplificar para mostrar el proceso.

**Cómo aparece en UI/API/export:** `totals.T_open` (KaTeX). En UI se muestra como fórmula. En export aparece en la sección de resultados.

**Limitación:** Puede ser muy larga para algoritmos con múltiples ciclos anidados.

### Forma cerrada

**Definición teórica:** Expresión del costo total sin sumatorias, simplificada algebraicamente. Por ejemplo: `C_1 * n * (n+1) / 2`.

**Definición operativa en AALIE:** `T_polynomial` contiene la forma cerrada. Se obtiene usando SymPy para simplificar las sumatorias de `T_open`.

**Cómo aparece en UI/API/export:** `totals.T_polynomial` (KaTeX). Solo presente si SymPy pudo cerrar las sumatorias.

**Limitación:** No siempre alcanzable. SymPy puede fallar en sumatorias complejas o no estándar.

### T_open

**Definición operativa:** Forma abierta de la función de costo producida por el analizador. Incluye sumatorias sin simplificar. Es el primer resultado del análisis iterativo.

### T_polynomial

**Definición operativa:** Simplificación algebraica de T_open cuando el motor la puede cerrar usando SymPy.

### Notación O/Ω/Θ

**Definición teórica:**
- **O(g(n))**: conjunto de funciones que crecen no más rápido que g(n) (cota superior asintótica).
- **Ω(g(n))**: conjunto de funciones que crecen al menos tan rápido como g(n) (cota inferior asintótica).
- **Θ(g(n))**: conjunto de funciones que crecen exactamente tan rápido como g(n) (cota ajustada).
- Formalmente: `O(g(n)) = {f(n): ∃ c>0, n₀>0 tal que 0 ≤ f(n) ≤ c·g(n) para todo n ≥ n₀}`.

**Definición operativa en AALIE:** Se calculan a partir de T_polynomial (o T_open si no hay cierre) usando SymPy para extraer el término dominante. `big_o`, `big_omega`, `big_theta` son cadenas KaTeX con la notación.

**Cómo aparece en UI/API/export:** `totals.big_o`, `totals.big_omega`, `totals.big_theta`. En UI se muestran como badges. En export aparecen en la sección de resultados asintóticos.

**Limitación:** La notación depende de que SymPy pueda extraer el término dominante. Algoritmos con términos no polinómicos pueden no tener notación.

### Cota fuerte

**Definición teórica:** Una cota Θ(g(n)) significa que g(n) es un límite asintóticamente ajustado, es decir, existen constantes positivas c₁, c₂, n₀ tales que `c₁·g(n) ≤ f(n) ≤ c₂·g(n)` para todo n ≥ n₀.

**Definición operativa en AALIE:** Se reporta cuando T_polynomial tiene un término dominante claro. El motor prefiere reportar Θ cuando es posible. Si no hay suficiente información, reporta solo O y Ω por separado.

**Cómo aparece en UI/API/export:** `totals.big_theta` presente cuando hay cota fuerte. En UI se destaca visualmente.

**Limitación:** No siempre alcanzable (ej: WHILE con status "unknown" no produce cota fuerte).

### Mejor/Peor/Caso promedio

**Definición teórica:**
- **Peor caso:** máxima cantidad de recursos para cualquier entrada de tamaño n.
- **Mejor caso:** mínima cantidad de recursos para cualquier entrada de tamaño n.
- **Caso promedio:** cantidad esperada de recursos sobre la distribución de entradas de tamaño n.

**Definición operativa en AALIE:** AALIE puede analizar los tres casos cuando hay variabilidad entre worst y best. El peor caso es el predeterminado. El mejor caso se calcula con supuestos optimistas (ej: IF siempre toma el camino más corto). El caso promedio requiere un `avgModel` (uniforme o simbólico). Sin variabilidad, best = worst y avg = worst (determinístico).

**Cómo aparece en UI/API/export:** `mode="all"` devuelve worst, best y avg. `has_case_variability` indica si difieren. En UI hay un selector de casos. En export aparecen los tres casos en secciones separadas.

**Limitación:** Caso promedio solo con modelo probabilístico definido. No hay caso promedio universal.

### Modelo uniforme

**Definición teórica:** Modelo probabilístico donde todos los valores posibles de una variable son igualmente probables. Para un predicado de condición, p = 1/2 para cada rama.

**Definición operativa en AALIE:** `avgModel.mode = "uniform"`. Predicados por defecto con probabilidad 1/2. Se usa para análisis de caso promedio cuando no hay información específica.

**Cómo aparece en UI/API/export:** `totals.avg_model_info` con `mode: "uniform"` y `note: "uniforme (p=1/2)"`. En UI se muestra el badge del modelo.

**Limitación:** No captura distribuciones reales de datos de entrada.

### Análisis iterativo

**Definición teórica:** Análisis de complejidad de algoritmos expresados con estructuras de control iterativas (FOR, WHILE, REPEAT). Se basa en contar ejecuciones de cada línea y sumar.

**Definición operativa en AALIE:** Usa `IterativeAnalyzer` con costeo por línea, detección de patrones de ciclo (FOR con límites conocidos, WHILE con heurística), sumatorias simbólicas con SymPy, y producción de `T_open`, `T_polynomial`, O/Ω/Θ.

**Cómo aparece en UI/API/export:** `byLine[]`, `totals.T_open`, `totals.T_polynomial`, `totals.big_o/omega/theta`. En UI se muestra tabla de costos, fórmulas y badges. En export aparece en sección "iterative".

**Limitación:** FOR con límites variables no lineales pueden no cerrarse.

### Análisis de ciclos

**Definición teórica:** Determinación del número de iteraciones de un ciclo. Para FOR, el conteo es directo. Para WHILE, requiere analizar la condición de guardia y las actualizaciones de variables de control.

**Definición operativa en AALIE:** Para FOR, el conteo se deriva de `start`, `end` y `step`. Para WHILE, `WhileEngine` aplica heurística con 12 patrones. Para REPEAT, similar a WHILE pero con condición de salida.

**Cómo aparece en UI/API/export:** `byLine[].count` para líneas dentro de ciclos. `whileBlocks[]` con `iterationsExpr`, `status`, `patternUsed`. En UI se muestran los bloques semánticos de WHILE.

**Limitación:** WHILE sin patrón reconocido: `status: "unknown"`.

### WHILE con heurística conservadora

**Definición operativa:** El motor WHILE de AALIE no intenta resolver cualquier WHILE. Aplica 12 patrones predefinidos en orden de prioridad. Si ningún patrón coincide y la clasificación base no produce cota, el resultado es `unknown`. Estados: `bounded` (cota determinada), `unbounded` (no terminación probada), `unknown` (sin evidencia suficiente). Niveles de evidencia: `strong`, `medium`, `weak`.

### Recurrencia

**Definición teórica:** Ecuación que define una función en términos de sí misma con argumentos más pequeños. Usada para analizar algoritmos recursivos.

**Definición operativa en AALIE:** Se detecta automáticamente del AST. Dos tipos:
- `divide_conquer`: `T(n) = a·T(n/b) + f(n)`. Parámetros: a (subproblemas), b (factor de reducción), f(n) (trabajo no recursivo).
- `linear_shift`: `T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n)`. Parámetros: orden, desplazamientos, coeficientes, g(n).

**Cómo aparece en UI/API/export:** `totals.recurrence` con `type`, `form`, parámetros. En UI se muestra en la sección de análisis recursivo. En export aparece en `snapshot.recursive.recurrence`.

**Limitación:** Solo dos tipos. No hay soporte para recurrencias no lineales o con términos mixtos.

### Teorema Maestro

**Definición teórica:** Método para resolver recurrencias de la forma `T(n) = a·T(n/b) + f(n)` donde a ≥ 1 y b > 1. Compara f(n) con `n^(log_b(a))` en tres casos:

**Definición operativa en AALIE:** `MasterMethod` en `analyzers/master_steps.py`. Implementa:
- Caso 1: f(n) = O(n^(log_b(a)-ε)) → T(n) = Θ(n^(log_b(a)))
- Caso 2: f(n) = Θ(n^(log_b(a))·log^k(n)) → T(n) = Θ(n^(log_b(a))·log^(k+1)(n))
- Caso 3: f(n) = Ω(n^(log_b(a)+ε)) y se cumple regularidad → T(n) = Θ(f(n))

**Cómo aparece en UI/API/export:** `totals.master` con `case` (1/2/3/null), `comparison`, `regularity`, `theta`. Opcionalmente `step_by_step` con pasos detallados. En UI se muestra el caso aplicado y la justificación.

**Limitación:** Solo recurrencias con b > 1, a ≥ 1, f(n) asintóticamente positiva. No aplica a `linear_shift`.

### Método de iteración

**Definición teórica:** Expande la recurrencia iterativamente hasta alcanzar el caso base, luego simplifica la sumatoria resultante.

**Definición operativa en AALIE:** `IterationMethod` en `analyzers/iteration_steps.py`. Genera expansiones simbólicas, forma general, resuelve k (número de pasos), evalúa sumatoria, produce Θ.

**Cómo aparece en UI/API/export:** `totals.iteration` con `g_function`, `expansions[]`, `general_form`, `base_case`, `summation`, `theta`. Opcionalmente `step_by_step`.

**Limitación:** Puede ser computacionalmente costoso para muchas expansiones.

### Árbol de recursión

**Definición teórica:** Representación visual del proceso de expansión de una recurrencia. Cada nodo representa el costo de un subproblema. El costo total es la suma de todos los niveles.

**Definición operativa en AALIE:** `RecursionTreeMethod` en `analyzers/recursion_tree_steps.py`. Calcula niveles (0..h), número de nodos por nivel, costo por nodo, costo total por nivel. Produce tabla por niveles y determina nivel dominante.

**Cómo aparece en UI/API/export:** `totals.recursion_tree` con `levels[]`, `height`, `summation`, `dominating_level`, `table_by_levels`. En UI se renderiza con React Flow. En export aparece como tabla y descripción.

**Limitación:** La visualización con React Flow puede ser compleja para árboles muy profundos.

### Ecuación característica

**Definición teórica:** Método para resolver recurrencias lineales con coeficientes constantes. Transforma la recurrencia en un polinomio, encuentra raíces, y construye la solución general.

**Definición operativa en AALIE:** `CharacteristicEquationMethod` en `analyzers/characteristic_steps.py`. Detecta recurrencia lineal, construye polinomio característico, calcula raíces con SymPy, construye solución homogénea, solución particular (si hay g(n) no nula), y forma cerrada.

**Cómo aparece en UI/API/export:** `totals.characteristic_equation` con `equation`, `roots[]`, `dominant_root`, `homogeneous_solution`, `particular_solution`, `general_solution`, `closed_form`, `theta`. Opcionalmente `dp_validation` (para detección de patrones de programación dinámica).

**Limitación:** Solo recurrencias lineales con coeficientes constantes. Raíces complejas pueden dar expresiones trigonométricas.

### Invariante de ciclo

**Definición teórica:** Afirmación lógica que es verdadera antes de cada iteración del ciclo (incluyendo antes de la primera y después de la última). Se usa para demostrar corrección de ciclos.

**Definición operativa en AALIE:** `LoopInvariantService` en `invariants/`. Selecciona el ciclo más significativo del AST y produce un invariante con 4 secciones: `propertyStatement` (propiedad), `initialization` (inicialización), `maintenance` (mantenimiento), `finalization` (finalización). Estados: `ok`, `unavailable`, `low_confidence`.

**Cómo aparece en UI/API/export:** `loopInvariant` en `AnalyzeOpenResponse`. En UI se muestra en panel de invariantes. En export aparece en sección de invariante de ciclo.

**Limitación:** Solo para el ciclo más significativo. No para todos los ciclos. Confidence variable.

### Trace

**Definición teórica:** Registro detallado de la ejecución de un algoritmo paso a paso, mostrando estado de variables, decisiones y flujo de control.

**Definición operativa en AALIE:** `POST /analyze/trace` genera un `ExecutionTraceCanonical` con `steps[]` (cada paso tiene eventKind, variablesSnapshot, decision, cost), `summary`, `callTree` (para recursivos). Opcionalmente `structuredTrace` para visualización.

**Cómo aparece en UI/API/export:** UI: vista de seguimiento con pasos y diagrama. Export: snapshot incluye `traceByCase` con steps y graph.

**Limitación:** El trace es pedagógico, no una demostración formal. Inputs por defecto heurísticos (n=5). Puede truncarse por profundidad.

### Snapshot

**Definición operativa:** Objeto versionado que concentra input, metadatos, resultados, trazas y advertencias. Es la unidad de verdad para export. Incluye `schemaVersion` ("1.0.0"), `snapshotId` (UUID v5), `contentHash` (SHA-256). No recalcula nada durante export.

## Archivos relacionados

- `glossary.md` — definiciones operativas de términos
- `vision.md` — principios de producto
- `known-limitations.md` — límites teóricos en la implementación
- `../03-specs/analysis-engine-spec.md` — especificación del motor
- `../03-specs/while-heuristics-spec.md` — especificación de heurísticas WHILE
- `../03-specs/recurrence-methods-spec.md` — especificación de métodos de recurrencia
