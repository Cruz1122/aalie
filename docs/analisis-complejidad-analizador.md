# Análisis Completo del Analizador de Funciones de Eficiencia

Este documento presenta el análisis de complejidad temporal del sistema de análisis de algoritmos.

## 1. Descripción del Algoritmo

### a) Propósito
Analizar la complejidad temporal de algoritmos expresados en pseudocódigo, determinando su función de eficiencia $T(n)$, su complejidad polinómica simplificada y sus cotas asintóticas ($O$, $\Omega$, $\Theta$).

### b) Entradas y Salidas
- **Entrada**: Código fuente del algoritmo a analizar (cadena de texto de longitud $L$).
- **Salida**: Objeto de análisis que contiene:
  - $T_{open}(n)$: Función de pasos exactos.
  - $T_{poly}(n)$: Forma polinómica simplificada.
  - Notaciones asintóticas: $O(f(n))$, $\Omega(g(n))$, $\Theta(h(n))$.

### c) Flujo Principal y Pseudocódigo
El algoritmo sigue un enfoque híbrido (secuencial en etapas, recursivo en el análisis del AST).

**Parámetros del Análisis:**
- $L$: Longitud del código fuente (caracteres/tokens).
- $N$: Número de nodos en el Árbol de Sintaxis Abstracta (AST).
- $D$: Profundidad máxima de anidamiento de bucles/recursión.
- $S$: Número de sumatorias a cerrar.
- $E$: Costo de simplificación de expresiones simbólicas (SymPy).
- $M$: Número de nodos únicos cacheables (para memoización).

**Pseudocódigo de Alto Nivel:**

```text
función AnalyzeAlgorithm(source: string) -> AnalysisResult
  // 1. Parseo
  tokens <- Lexer(source)                      // C1 * L
  ast <- Parser(tokens)                        // C2 * L
  
  // 2. Clasificación
  tipo <- DetectAlgorithmKind(ast)             // C3 * N
  
  // 3. Selección de Estrategia
  si tipo = "recursive" entonces
      analyzer <- RecursiveAnalyzer()          // C4
  sino
      analyzer <- IterativeAnalyzer()          // C5
  fin-si
  
  // 4. Análisis (Visita del AST con Memoización)
  // Se realiza para peor, mejor y caso promedio (aquí mostramos genérico)
  resultado_raw <- analyzer.visit(ast)         // T_visit(N, D, M)
  
  // 5. Post-procesamiento
  T_open <- analyzer.buildEquation()           // C6 * N
  T_poly <- Simplify(T_open)                   // C7 * S * E
  notaciones <- CalculateAsymptotics(T_poly)   // C8 * E
  
  retornar { T_open, T_poly, notaciones }
end-func
```

### d) Invariante (para componentes iterativos)
En la fase de parseo y construcción de tabla de costos (que recorre listas de sentencias):
- **Invariante**: Al finalizar la iteración $k$, el costo acumulado $T_{total}$ refleja correctamente la suma de costos de las primeras $k$ sentencias procesadas, incluyendo sus multiplicadores de anidamiento.

## 2. Identificación de Operaciones Dominantes

Las operaciones que dominan el tiempo de ejecución se dividen en fases:

1.  **Parseo (`parse_source`)**:
    -   Complejidad: $O(L)$.
    -   Justificación: El lexer y parser (ANTLR) recorren la entrada linealmente (para gramáticas LL(*)/ALL(*)).

2.  **Visita del AST (`visit` recursivo)**:
    -   Mejor caso: $O(N)$ (sin bucles anidados profundos, visita lineal).
    -   Peor caso (sin memoización): $O(N \cdot D)$ (cada nivel de anidamiento puede requerir contexto adicional, aunque la visita per se es sobre $N$ nodos, el costo de gestión de contexto y multiplicadores escala con $D$).
    -   Con Memoización: Reduce el trabajo repetitivo. Si hay repetición de estructuras (ej. llamadas a funciones idénticas o bucles analizados bajo mismos contextos), la complejidad tiende a $O(N + M)$.

3.  **Cierre de Sumatorias y Simplificación Simbólica**:
    -   Complejidad: $O(S \cdot E)$.
    -   Justificación: `SymPy` realiza operaciones algebraicas costosas (`expand`, `simplify`, `summation`). Si las expresiones son complejas, $E$ puede ser significativo (exponencial en el peor caso teórico de simplificación, aunque polinómico en práctica común).

4.  **Cálculo de Notaciones**:
    -   Complejidad: $O(E)$ (depende del tamaño de la expresión resultante).

## 3. Análisis del Mejor Caso

### Condiciones
El mejor caso ocurre bajo la siguiente configuración de entrada:
1.  **Estructura Plana**: Algoritmo sin bucles anidados ni recursión profunda ($D = 1$).
2.  **Simplicidad Aritmética**: Pocas o ninguna sumatoria compleja ($S \approx 0$).
3.  **Memoización Ideal**: Si existen estructuras repetidas, todas se encuentran en caché ($M \approx N$ o repetición nula).
4.  **Expresiones Triviales**: No hay expresiones simbólicas que requieran simplificación costosa ($E \approx O(1)$).

### Ecuación de Eficiencia $T_{best}$
En este escenario, el costo está dominado por la lectura lineal del código y una visita simple a cada nodo del AST.

$$ T_{best}(N, L) = C_{parse} \cdot L + C_{visit} \cdot N + C_{overhead} $$

### Forma Simplificada
Dado que el número de nodos $N$ suele ser proporcional a la longitud del código $L$:

**Notaciones Asintóticas:**
- $O(N + L)$: Cota superior. El tiempo nunca excede una constante multiplicada por $(N + L)$.
- $\Omega(N + L)$: Cota inferior. El tiempo requiere al menos una constante multiplicada por $(N + L)$.
- $\Theta(N + L)$: Cota ajustada. El tiempo está acotado tanto superior como inferiormente por $(N + L)$.

$$ T_{best}(N) \in \Theta(N + L) \approx \Theta(N) $$

### Justificación
-   **Parseo**: Se debe leer todo el código fuente necesariamente $\rightarrow \Omega(L)$.
-   **Visita**: Se debe procesar cada nodo del AST al menos una vez para determinar su tipo y costo $\rightarrow \Omega(N)$.
-   **Simplificación**: Al no haber sumatorias complejas, el post-procesamiento es constante o lineal respecto al tamaño de la salida.

### Ejemplo
Consideremos el siguiente algoritmo simple que calcula el máximo de dos números:

```pseudocode
maximo(a, b) BEGIN
  IF (a > b) THEN BEGIN
    RETURN a;
  END ELSE BEGIN
    RETURN b;
  END
END
```

**Características del ejemplo:**
- $L \approx 50$ caracteres (código corto)
- $N \approx 8$ nodos AST (función, if, comparación, returns)
- $D = 1$ (sin bucles anidados, solo un condicional)
- $S = 0$ (no hay sumatorias)
- $E = O(1)$ (expresiones triviales: $C_1$, $C_2$)

**Tiempo de análisis:**
$$ T_{best} = C_1 \cdot 50 + C_2 \cdot 8 + C_3 = O(58) \in \Theta(N + L) $$

El analizador procesa este código en tiempo lineal respecto al tamaño del código, sin costos adicionales por anidamiento o simplificación simbólica.

## 4. Análisis del Peor Caso

### Condiciones
El peor caso se presenta cuando:
1.  **Anidamiento Profundo**: Algoritmo con múltiples niveles de bucles o recursión ($D \approx N$ en casos extremos).
2.  **Complejidad Simbólica Alta**: Múltiples sumatorias anidadas y expresiones no triviales ($S$ grande, $E$ alto).
3.  **Fallo de Memoización**: Estructuras únicas que no permiten reutilización de caché ($M \approx 0$ repeticiones útiles).
4.  **Explosión de Términos**: La expansión simbólica de $T_{poly}$ genera una expresión de tamaño exponencial antes de simplificarse.

### Ecuación de Eficiencia $T_{worst}$
El costo incluye la visita multiplicada por la profundidad (gestión de pila de multiplicadores) y el costo de simplificación simbólica.

$$ T_{worst}(N, D, S, E) = C_{parse} \cdot L + C_{visit} \cdot (N \cdot D) + C_{sym} \cdot (S \cdot E) $$

### Forma Simplificada
Asumiendo que la simplificación simbólica ($E$) puede ser costosa (potencialmente exponencial en casos patológicos de álgebra computacional) y $D$ es significativo:

**Notaciones Asintóticas:**
- $O(N \cdot D + S \cdot E + L)$: Cota superior. El tiempo nunca excede una constante multiplicada por $(N \cdot D + S \cdot E + L)$.
- $\Omega(N \cdot D + L)$: Cota inferior. El tiempo requiere al menos una constante multiplicada por $(N \cdot D + L)$, incluso sin simplificación simbólica.
- $\Theta(N \cdot D + S \cdot E + L)$: Cota ajustada. El tiempo está acotado tanto superior como inferiormente cuando $S \cdot E$ es significativo.

$$ T_{worst} \in \Theta(N \cdot D + S \cdot E + L) $$

En el caso teórico más adverso donde $D \approx N$ (árbol degenerado) y la simplificación es compleja:
$$ T_{worst} \in O(N^2 + \text{costo\_algebraico}) $$

### Justificación
-   **Visita Anidada**: Cada nivel de anidamiento requiere operaciones de pila y actualización de contexto. Si el árbol es muy profundo, el costo de mantener el estado de los multiplicadores impacta cada nodo.
-   **Simplificación Simbólica**: La función `SummationCloser` utiliza `SymPy`. Cerrar formas cerradas de sumatorias anidadas complejas (ej. $\sum \sum \dots i^k$) conlleva operaciones de factorización y expansión polinómica costosas.

### Ejemplo
Consideremos un algoritmo con bucles anidados profundos y sumatorias complejas:

```pseudocode
algoritmo_complejo(A[1]..[n]) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO i DO BEGIN
      FOR k <- 1 TO j DO BEGIN
        FOR l <- 1 TO k DO BEGIN
          A[i] <- A[i] + A[j] * A[k] * A[l];
        END
      END
    END
  END
END
```

**Características del ejemplo:**
- $L \approx 200$ caracteres
- $N \approx 25$ nodos AST (4 bucles anidados + asignaciones)
- $D = 4$ (profundidad de anidamiento: 4 bucles)
- $S = 4$ (cada bucle genera una sumatoria: $\sum_{i=1}^{n} \sum_{j=1}^{i} \sum_{k=1}^{j} \sum_{l=1}^{k} 1$)
- $E$ alto (SymPy debe simplificar $\frac{n(n+1)(n+2)(n+3)}{24}$)
- $M \approx 0$ (cada bucle tiene contexto único, sin repetición aprovechable)

**Tiempo de análisis:**
$$ T_{worst} = C_1 \cdot 200 + C_2 \cdot (25 \cdot 4) + C_3 \cdot (4 \cdot E) $$

$$ T_{worst} = O(200 + 100 + 4E) \in \Theta(N \cdot D + S \cdot E + L) $$

El analizador debe mantener una pila de 4 multiplicadores activos simultáneamente, y SymPy debe resolver una sumatoria cuádruple anidada, generando un costo significativo en la simplificación simbólica.

## 5. Análisis del Caso Promedio

### Modelo Probabilístico y Condiciones
Se asume una entrada típica de código de estudiantes/algoritmos académicos:
1.  **Estructura Típica**: Anidamiento logarítmico o constante pequeño ($D \approx \log N$ o $D \le 3$).
2.  **Sumatorias Moderadas**: Cantidad de sumatorias proporcional al tamaño del código ($S \approx \alpha \cdot N$).
3.  **Memoización Parcial**: Algunos bloques se repiten (ej. ramas de if/else, llamadas a funciones auxiliares) ($M \approx 0.5 N$).
4.  **Simplificaciones Estándar**: Expresiones polinómicas manejables.

### Ecuación de Eficiencia $T_{avg}$
El valor esperado del tiempo de ejecución:

$$ T_{avg}(N) = C_{parse} \cdot L + E[T_{visit}] + E[T_{sym}] $$

$$ T_{avg}(N) \approx C_1 \cdot L + C_2 \cdot (N \cdot \log D) + C_3 \cdot (S \cdot \log E) $$

### Forma Simplificada
Considerando que $L \approx k \cdot N$:

**Notaciones Asintóticas:**
- $O(N \cdot \log D + S \cdot \log E + L)$: Cota superior. El tiempo nunca excede una constante multiplicada por $(N \cdot \log D + S \cdot \log E + L)$.
- $\Omega(N \cdot \log D + L)$: Cota inferior. El tiempo requiere al menos una constante multiplicada por $(N \cdot \log D + L)$, incluso con simplificaciones eficientes.
- $\Theta(N \cdot \log D + S \cdot \log E + L)$: Cota ajustada. El tiempo está acotado tanto superior como inferiormente para estructuras típicas.

$$ T_{avg}(N) \in \Theta(N \cdot \log D + S \cdot \log E + L) \approx \Theta(N \cdot \log N) $$

### Justificación
-   **Memoización**: En la práctica, la memoización reduce el factor $D$ al evitar re-analizar subárboles idénticos, acercando el comportamiento a $O(N)$.
-   **Simplificaciones**: Las sumatorias típicas (aritmos, geométricos simples) se resuelven en tiempo polinómico bajo respecto a su tamaño.

### Ejemplo
Consideremos un algoritmo típico de ordenamiento por inserción con algunas optimizaciones:

```pseudocode
insertionSort(A[1]..[n]) BEGIN
  FOR i <- 2 TO n DO BEGIN
    x <- A[i];
    j <- i - 1;
    WHILE (j > 0 AND A[j] > x) DO BEGIN
      A[j + 1] <- A[j];
      j <- j - 1;
    END
    A[j + 1] <- x;
  END
END
```

**Características del ejemplo:**
- $L \approx 180$ caracteres
- $N \approx 18$ nodos AST (bucle for, while, asignaciones)
- $D = 2$ (bucle for con while anidado)
- $S = 2$ (sumatorias del for y del while: $\sum_{i=2}^{n} \sum_{j=1}^{i-1} 1$)
- $E$ moderado (SymPy simplifica a $\frac{n(n-1)}{2}$ con costo polinómico)
- $M \approx 9$ (el cuerpo del while se repite, aprovechando memoización)

**Tiempo de análisis:**
$$ T_{avg} = C_1 \cdot 180 + C_2 \cdot (18 \cdot \log 2) + C_3 \cdot (2 \cdot \log E) $$

$$ T_{avg} = O(180 + 18 + 2\log E) \in \Theta(N \cdot \log D + S \cdot \log E + L) $$

El analizador procesa este código eficientemente: la memoización evita re-analizar el cuerpo del while múltiples veces, y las sumatorias se simplifican rápidamente a una forma cerrada conocida.

## 6. Consideraciones sobre Memoización (PD)

El sistema implementa Programación Dinámica (Memoización) en la fase de visita del AST (`visit`).

### Mecanismo
- **Clave**: `Hash(Node) + Context(Multipliers) + Mode(Worst/Best/Avg)`
- **Almacenamiento**: Diccionario hash en memoria (`Dict[str, List[LineCost]]`).

### Impacto en la Eficiencia
- **Sin Memoización**: Cada nodo se re-evalúa cada vez que es visitado. En bucles anidados o llamadas recursivas múltiples, un mismo nodo puede visitarse muchas veces. Complejidad: $O(N \cdot D)$.
- **Con Memoización**: Si un nodo ya fue evaluado bajo el mismo contexto (mismos multiplicadores activos), se retorna el resultado cacheados en $O(1)$. Complejidad amortizada: $O(N + M)$, donde $M$ son los estados únicos.

### Overhead
- **Espacial**: $O(M)$ para almacenar los resultados parciales. Dado que $M \le N \cdot D$, el espacio es manejable para tamaños de código típicos.
- **Temporal**: Costo constante $O(1)$ para generar claves de hash y búsquedas en diccionario. Este overhead es despreciable comparado con el costo de re-analizar un subárbol ($O(N_{subtree})$).

## 7. Resumen de Complejidades

A continuación se presenta el resumen de las cotas asintóticas para el tiempo de ejecución del **Analizador**:

| Caso | $O$ (Cota Superior) | $\Omega$ (Cota Inferior) | $\Theta$ (Cota Ajustada) |
| :--- | :--- | :--- | :--- |
| **Mejor** | $O(N + L)$ | $\Omega(N + L)$ | $\Theta(N + L)$ |
| **Promedio** | $O(N \cdot \log D + S \cdot \log E + L)$ | $\Omega(N \cdot \log D + L)$ | $\Theta(N \cdot \log D + S \cdot \log E + L)$ |
| **Peor** | $O(N \cdot D + S \cdot E + L)$ | $\Omega(N \cdot D + L)$ | $\Theta(N \cdot D + S \cdot E + L)$ |

**Donde:**
- $N$: Número de nodos en el AST.
- $L$: Longitud del código fuente.
- $D$: Profundidad máxima de anidamiento.
- $S$: Número de sumatorias a cerrar.
- $E$: Factor de complejidad de simplificación simbólica.

## 8. Observaciones

1.  **Desacoplamiento**: Es fundamental notar que la complejidad del *analizador* no depende de la complejidad temporal del *algoritmo analizado*. Analizar un algoritmo de $O(n!)$ (como permutaciones) no toma tiempo factorial, sino un tiempo proporcional a la longitud de su código ($O(N)$).
2.  **Cuello de Botella Real**: En la práctica, el parseo ($O(L)$) y la visita ($O(N)$) son muy rápidos. El verdadero cuello de botella suele ser el motor de álgebra simbólica (`SymPy`) cuando se enfrenta a expresiones matemáticas complejas generadas por el análisis ($S \cdot E$).
3.  **Memoización Efectiva**: La memoización transforma el problema de visitar un árbol (potencialmente exponencial en caminos) en visitar un grafo de estados únicos (DAG), garantizando eficiencia incluso para códigos con estructuras repetitivas complejas.
