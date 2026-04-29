# Reglas de Detección y Catálogo de Pseudocódigos

## Propósito

Este documento resume las reglas actuales del detector de técnicas algorítmicas y recopila todos los pseudocódigos disponibles en el catálogo de ejemplos.

Fuentes principales:

- `apps/web/src/features/analyzer/technique-detection/astSignals.ts`
- `apps/web/src/features/analyzer/technique-detection/techniqueRules.ts`
- `apps/web/src/features/analyzer/technique-detection/evidenceSnippet.ts`
- `apps/web/src/lib/examples/catalog.ts`

## Flujo del detector

1. Entra el AST del algoritmo a `detectTechniqueFromAst`.
2. `extractAstSignals` recorre el AST y levanta señales estructurales.
3. `getTechniqueRules` evalúa las reglas en orden de prioridad.
4. La primera regla que hace match define técnica, confianza y nodo de evidencia.
5. `buildEvidenceSnippet` compacta ese nodo para mostrarlo en el modal.

## Señales estructurales que se recolectan

- `loopCount`: Cuenta cuántos ciclos `FOR`, `WHILE` o `REPEAT` aparecen.
- `hasSelfCall`: Detecta si una llamada invoca al mismo procedimiento actual.
- `hasMultipleSelfCalls`: Se activa cuando el total de llamadas recursivas detectadas es al menos 2.
- `hasSingleSelfCall`: Se activa cuando solo aparece una llamada recursiva.
- `hasDivideArgument`: Algún argumento recursivo contiene una división.
- `hasMinusArgument`: Algún argumento recursivo reduce el tamaño por resta.
- `hasRangeSplit`: La llamada recursiva trabaja con rangos y aparece lógica de punto medio o partición.
- `hasMidpointComputation`: Se observa un patrón tipo `(izq + der) / 2` o equivalente.
- `hasIndexedReadBeforeRecursiveCall`: Se lee una tabla/índice antes de la recursión.
- `hasIndexedWriteAfterRecursiveCall`: Se escribe en tabla después de resolver recursión.
- `hasIterativeIndexedWrites`: Hay escritura indexada dentro de ciclos.
- `hasPreviousStateDependency`: Los índices o rangos dependen de estados anteriores.
- `hasCandidateMutation`: Se modifica una variable o estructura que representa una solución candidata.
- `hasUndoAfterRecursiveCall`: Después de una llamada recursiva aparece una desasignación o rollback.
- `hasPruningReturn`: Existe un `RETURN` usado como corte o poda.
- `hasBoundComparison`: Aparecen comparaciones de cota (`<`, `<=`, `>`, `>=`).
- `hasLocalSelection`: Dentro de un ciclo hay condiciones que disparan una elección local.
- `hasCommittedSelection`: La selección local se mantiene sin rollback.

## Reglas de identificación

### 100. Branch and Bound

- Id interna: `branch_and_bound`
- Confianza: `high`
- Intención: Exploración recursiva con construcción de candidato, retroceso y poda por cota.
- Evidencia preferida: `signals.evidence.branchAndBound`
- Condiciones que deben cumplirse:
  - `hasSelfCall`
  - `hasCandidateMutation`
  - `hasUndoAfterRecursiveCall`
  - `hasBoundComparison`
  - `hasPruningReturn`

### 90. Programación Dinámica top-down

- Id interna: `dp_top_down`
- Confianza: `high`
- Intención: Memoización: se consulta una tabla antes de recalcular y luego se escribe el resultado.
- Evidencia preferida: `signals.evidence.memoization`
- Condiciones que deben cumplirse:
  - `hasSelfCall`
  - `hasIndexedReadBeforeRecursiveCall`
  - `hasIndexedWriteAfterRecursiveCall`

### 80. Programación Dinámica bottom-up

- Id interna: `dp_bottom_up`
- Confianza: `medium`
- Intención: Tabulación iterativa con dependencias entre estados ya calculados.
- Evidencia preferida: `signals.evidence.bottomUp ?? signals.evidence.nestedLoop ?? signals.evidence.firstLoop`
- Condiciones que deben cumplirse:
  - `!hasSelfCall`
  - `loopCount > 0`
  - `hasIterativeIndexedWrites`
  - `hasPreviousStateDependency`

### 70. Backtracking

- Id interna: `backtracking`
- Confianza: `high`
- Intención: Búsqueda recursiva con construcción de solución parcial y deshacer decisiones.
- Evidencia preferida: `signals.evidence.search`
- Condiciones que deben cumplirse:
  - `hasSelfCall`
  - `hasCandidateMutation`
  - `hasUndoAfterRecursiveCall`

### 60. Divide y Vencerás

- Id interna: `divide_and_conquer`
- Confianza: `high`
- Intención: Varias llamadas recursivas sobre mitades, rangos o subproblemas guiados por punto medio/división.
- Evidencia preferida: `signals.evidence.divideAndConquer ?? signals.evidence.multipleRecursive`
- Condiciones que deben cumplirse:
  - `hasMultipleSelfCalls`
  - `hasDivideArgument || hasRangeSplit || hasMidpointComputation`

### 50. Resta y Serás Vencido

- Id interna: `decrease_and_be_conquered`
- Confianza: `high`
- Intención: Varias ramas recursivas por resta sin evidencia de memoización previa.
- Evidencia preferida: `signals.evidence.multipleRecursive`
- Condiciones que deben cumplirse:
  - `hasMultipleSelfCalls`
  - `hasMinusArgument`
  - `!hasIndexedReadBeforeRecursiveCall`

### 40. Resta y Vencerás

- Id interna: `decrease_and_conquer`
- Confianza: `high`
- Intención: Una llamada recursiva dominante que reduce el tamaño por resta.
- Evidencia preferida: `signals.evidence.singleRecursive`
- Condiciones que deben cumplirse:
  - `hasSingleSelfCall`
  - `hasMinusArgument`

### 30. Voraz

- Id interna: `greedy`
- Confianza: `low`
- Intención: Selecciones locales en ciclos, sin retroceso ni dependencia fuerte de estados previos.
- Evidencia preferida: `signals.evidence.greedy ?? signals.evidence.firstLoop`
- Condiciones que deben cumplirse:
  - `!hasSelfCall`
  - `loopCount > 0`
  - `hasLocalSelection`
  - `hasCommittedSelection`
  - `!hasPreviousStateDependency`

### 10. Iterativo

- Id interna: `iterative`
- Confianza: `medium`
- Intención: Predominio de ciclos sin señales claras de recursión ni DP.
- Evidencia preferida: `signals.evidence.nestedLoop ?? signals.evidence.firstLoop`
- Condiciones que deben cumplirse:
  - `!hasSelfCall`
  - `loopCount > 0`

### 0. Unknown

- Id interna: `unknown`
- Confianza: `low`
- Intención: Fallback cuando ninguna regla específica hace match.
- Evidencia preferida: `null`
- Condiciones que deben cumplirse:
  - Siempre hace match al final.

## Cómo se compacta la evidencia visual

- Ciclos simples: se muestra cabecera, `...` y cierre del bucle.
- Ciclos anidados: se conservan cabeceras y cierres del anidamiento.
- Recursión por retorno o asignación: se muestra la línea puntual.
- Memoización: se muestra el `IF` de lectura de tabla y luego la escritura relevante.
- Backtracking y Branch and Bound: se recogen líneas interesantes del bloque, incluyendo `IF`, `Assign`, `Call` y `Return`.

## Patrones concretos que hoy reconoce el sistema

- Divide y Vencerás: varias llamadas recursivas + división, punto medio o partición de rango.
- Resta y Vencerás: una sola llamada recursiva dominante que reduce por resta.
- Resta y Serás Vencido: varias ramas que reducen por resta sin memoria previa.
- DP top-down: consulta de tabla antes del cálculo y escritura del resultado después.
- DP bottom-up: llenado iterativo de tabla con dependencias entre estados previos.
- Voraz: selección local dentro de un ciclo sin rollback.
- Backtracking: construir, explorar y deshacer.
- Branch and Bound: construir, explorar, comparar cotas y podar.
- Iterativo: uso de ciclos sin señales suficientes de una técnica recursiva o DP.

## Pseudocódigos del catálogo

Total de ejemplos en `examplesCatalog`: 100.

## Iterativos

Resuelven el problema con ciclos y actualizaciones paso a paso.

### Bandera nacional holandesa

- Slug: `dutch-national-flag`
- Familia: `estructuras`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Mantiene tres regiones y es util para estudiar particiones lineales con varios punteros.

```txt
dutchFlag(A[n], n, pivot) BEGIN
    low <- 1;
    mid <- 1;
    high <- n;
    WHILE (mid <= high) DO BEGIN
        IF (A[mid] < pivot) THEN BEGIN
            temp <- A[low];
            A[low] <- A[mid];
            A[mid] <- temp;
            low <- low + 1;
            mid <- mid + 1;
        END
        ELSE BEGIN
            IF (A[mid] > pivot) THEN BEGIN
                temp <- A[mid];
                A[mid] <- A[high];
                A[high] <- temp;
                high <- high - 1;
            END
            ELSE BEGIN
                mid <- mid + 1;
            END
        END
    END
    RETURN 0;
END
```

### Binary Search iterativa

- Slug: `binary-search-iterativa`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Acota el rango ordenado por la mitad en cada iteracion hasta encontrar la clave o vaciar el intervalo.

```txt
binarySearchIter(A[n], n, x) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        mitad <- (izq + der) DIV 2;
        IF (A[mitad] = x) THEN BEGIN
            RETURN mitad;
        END
        IF (x < A[mitad]) THEN BEGIN
            der <- mitad - 1;
        END
        ELSE BEGIN
            izq <- mitad + 1;
        END
    END
    RETURN -1;
END
```

### Busqueda lineal

- Slug: `linear-search`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Recorre secuencialmente el arreglo y sirve como referencia minima para busquedas iterativas.

```txt
linearSearch(A[n], n, x) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

### Busqueda por saltos

- Slug: `jump-search`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Alterna saltos de bloque con una fase lineal corta y resulta util para estudiar dos bucles consecutivos.

```txt
jumpSearch(A[n], n, x, paso) BEGIN
    inicio <- 1;
    fin <- paso;
    WHILE (fin < n AND A[fin] < x) DO BEGIN
        inicio <- fin + 1;
        fin <- fin + paso;
    END
    IF (fin > n) THEN BEGIN
        fin <- n;
    END
    FOR i <- inicio TO fin DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

### Busqueda ternaria iterativa

- Slug: `ternary-search-iterativo`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Divide el rango en tres secciones por iteracion sobre un arreglo ordenado.

```txt
ternarySearchIterativo(A[n], n, x) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        tercio <- (der - izq) DIV 3;
        m1 <- izq + tercio;
        m2 <- der - tercio;
        IF (A[m1] = x) THEN BEGIN
            RETURN m1;
        END
        IF (A[m2] = x) THEN BEGIN
            RETURN m2;
        END
        IF (x < A[m1]) THEN BEGIN
            der <- m1 - 1;
        END
        ELSE BEGIN
            IF (x > A[m2]) THEN BEGIN
                izq <- m2 + 1;
            END
            ELSE BEGIN
                izq <- m1 + 1;
                der <- m2 - 1;
            END
        END
    END
    RETURN -1;
END
```

### Cocktail Shaker Sort

- Slug: `cocktail-shaker-sort`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Alterna pasadas hacia adelante y hacia atras sobre el rango activo, solo con indices.

```txt
cocktailShakerSort(A[n], n) BEGIN
    inicio <- 1;
    fin <- n;
    WHILE (inicio < fin) DO BEGIN
        FOR i <- inicio TO fin - 1 DO BEGIN
            IF (A[i] > A[i + 1]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i + 1];
                A[i + 1] <- temp;
            END
        END
        fin <- fin - 1;
        j <- fin;
        WHILE (j > inicio) DO BEGIN
            IF (A[j] < A[j - 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j - 1];
                A[j - 1] <- temp;
            END
            j <- j - 1;
        END
        inicio <- inicio + 1;
    END
    RETURN 0;
END
```

### Comb Sort

- Slug: `comb-sort`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Usa un gap que se reduce por factor hasta 1, comparando pares separados como en burbuja amplia.

```txt
combSort(A[n], n) BEGIN
    gap <- n;
    intercambio <- true;
    WHILE (gap > 1 OR intercambio = true) DO BEGIN
        IF (gap > 1) THEN BEGIN
            gap <- (gap * 10) DIV 13;
            IF (gap < 1) THEN BEGIN
                gap <- 1;
            END
        END
        intercambio <- false;
        FOR i <- 1 TO n - gap DO BEGIN
            IF (A[i] > A[i + gap]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i + gap];
                A[i + gap] <- temp;
                intercambio <- true;
            END
        END
    END
    RETURN 0;
END
```

### Criba de Eratostenes

- Slug: `sieve-of-eratosthenes`
- Familia: `numerico`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Marca multiplos en una tabla booleana y funciona bien para estudiar bucles anidados con saltos.

```txt
sieveEratosthenes(n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        primo[i] <- true;
    END
    FOR p <- 2 TO n DO BEGIN
        IF (primo[p] = true) THEN BEGIN
            multiplo <- p + p;
            WHILE (multiplo <= n) DO BEGIN
                primo[multiplo] <- false;
                multiplo <- multiplo + p;
            END
        END
    END
    RETURN 0;
END
```

### Euclides iterativo (MCD)

- Slug: `euclides-iterativo-mcd`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Caso corto y confiable para estudiar un bucle con reduccion geometrica en el tamaño del estado.

```txt
euclidesIterativo(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
```

### Exchange Sort

- Slug: `exchange-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Compara cada par (i, j) con i < j e intercambia si hace falta; doble bucle directo sobre el arreglo.

```txt
exchangeSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[i] > A[j]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
    END
    RETURN 0;
END
```

### Factorial iterativo

- Slug: `factorial-iterativo`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Ejemplo lineal basico que recorre una variable de control simple y acumula un producto.

```txt
factorialIterativo(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END
```

### Gnome Sort

- Slug: `gnome-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Avanza si el vecino izquierdo esta ordenado; si no, intercambia y retrocede un paso como un gnomo.

```txt
gnomeSort(A[n], n) BEGIN
    i <- 2;
    WHILE (i <= n) DO BEGIN
        IF (i = 1) THEN BEGIN
            i <- i + 1;
        END
        ELSE BEGIN
            IF (A[i] >= A[i - 1]) THEN BEGIN
                i <- i + 1;
            END
            ELSE BEGIN
                temp <- A[i];
                A[i] <- A[i - 1];
                A[i - 1] <- temp;
                i <- i - 1;
            END
        END
    END
    RETURN 0;
END
```

### Kadane

- Slug: `kadane`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Mantiene un mejor prefijo local y uno global en una sola pasada lineal.

```txt
kadane(A[n], n) BEGIN
    mejorActual <- A[1];
    mejorGlobal <- A[1];
    FOR i <- 2 TO n DO BEGIN
        IF (mejorActual + A[i] > A[i]) THEN BEGIN
            mejorActual <- mejorActual + A[i];
        END
        ELSE BEGIN
            mejorActual <- A[i];
        END
        IF (mejorActual > mejorGlobal) THEN BEGIN
            mejorGlobal <- mejorActual;
        END
    END
    RETURN mejorGlobal;
END
```

### Maximum Subarray cuadratico

- Slug: `maximum-subarray-cuadratico`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Recorre todos los inicios y expande sumas acumuladas para comparar con Kadane.

```txt
maximumSubarrayCuadratico(A[n], n) BEGIN
    mejor <- A[1];
    FOR i <- 1 TO n DO BEGIN
        suma <- 0;
        FOR j <- i TO n DO BEGIN
            suma <- suma + A[j];
            IF (suma > mejor) THEN BEGIN
                mejor <- suma;
            END
        END
    END
    RETURN mejor;
END
```

### Merge de dos arreglos ordenados

- Slug: `merge-dos-arreglos-ordenados`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Usa dos punteros y una salida temporal para estudiar una combinacion lineal clasica.

```txt
mergeDosArreglos(A[n], n, B[m], m) BEGIN
    i <- 1;
    j <- 1;
    k <- 1;
    WHILE (i <= n AND j <= m) DO BEGIN
        IF (A[i] <= B[j]) THEN BEGIN
            C[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            C[k] <- B[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    RETURN k - 1;
END
```

### Newton-Raphson iterativo

- Slug: `newton-raphson-iterativo`
- Familia: `numerico`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Ejemplo numerico con refinamientos sucesivos y corte por tolerancia.

```txt
newtonRaphson(x0, iteraciones) BEGIN
    x <- x0;
    FOR i <- 1 TO iteraciones DO BEGIN
        x <- x - ((x * x) - 2) / (2 * x);
    END
    RETURN x;
END
```

### Ordenamiento burbuja

- Slug: `bubble-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Ordena comparando elementos adyacentes y sirve como referencia estable para los casos cuadraticos.

```txt
bubbleSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
    RETURN 0;
END
```

### Ordenamiento burbuja mejorado

- Slug: `bubble-sort-mejorado`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Corta temprano si una pasada no realiza intercambios, manteniendo solo bucles y arreglos.

```txt
bubbleSortMejorado(A[n], n) BEGIN
    i <- 1;
    WHILE (i <= n - 1) DO BEGIN
        intercambio <- false;
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
                intercambio <- true;
            END
        END
        IF (intercambio = false) THEN BEGIN
            RETURN 0;
        END
        i <- i + 1;
    END
    RETURN 0;
END
```

### Ordenamiento por conteo

- Slug: `counting-sort`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Cuenta frecuencias y reconstruye el arreglo en varias pasadas lineales sobre indices y ocurrencias.

```txt
countingSort(A[n], n, k) BEGIN
    FOR i <- 0 TO k DO BEGIN
        C[i] <- 0;
    END
    FOR i <- 1 TO n DO BEGIN
        C[A[i]] <- C[A[i]] + 1;
    END
    indice <- 1;
    FOR valor <- 0 TO k DO BEGIN
        WHILE (C[valor] > 0) DO BEGIN
            A[indice] <- valor;
            C[valor] <- C[valor] - 1;
            indice <- indice + 1;
        END
    END
    RETURN 0;
END
```

### Ordenamiento por insercion

- Slug: `insertion-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Construye el arreglo ordenado insertando cada clave en su posicion y muestra un while interno clasico.

```txt
insertionSort(A[n], n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        clave <- A[i];
        j <- i - 1;
        WHILE (j > 0 AND A[j] > clave) DO BEGIN
            A[j + 1] <- A[j];
            j <- j - 1;
        END
        A[j + 1] <- clave;
    END
    RETURN 0;
END
```

### Ordenamiento por seleccion

- Slug: `selection-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Busca el minimo restante y lo coloca al frente en cada iteracion.

```txt
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        minIndice <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[minIndice]) THEN BEGIN
                minIndice <- j;
            END
        END
        temp <- A[i];
        A[i] <- A[minIndice];
        A[minIndice] <- temp;
    END
    RETURN 0;
END
```

### Ordenamiento Shell

- Slug: `shell-sort`
- Familia: `ordenamiento`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Refina el arreglo por saltos decrecientes y muestra varios niveles de anidacion iterativa.

```txt
shellSort(A[n], n) BEGIN
    gap <- n DIV 2;
    WHILE (gap > 0) DO BEGIN
        FOR i <- gap + 1 TO n DO BEGIN
            temp <- A[i];
            j <- i;
            WHILE (j > gap AND A[j - gap] > temp) DO BEGIN
                A[j] <- A[j - gap];
                j <- j - gap;
            END
            A[j] <- temp;
        END
        gap <- gap DIV 2;
    END
    RETURN 0;
END
```

### Sentinel Linear Search

- Slug: `sentinel-linear-search`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Coloca la clave al final y usa un unico bucle sin doble condicion en cada paso.

```txt
sentinelLinearSearch(A[n], n, x) BEGIN
    ultimo <- A[n];
    A[n] <- x;
    i <- 1;
    WHILE (A[i] != x) DO BEGIN
        i <- i + 1;
    END
    A[n] <- ultimo;
    IF (i < n OR A[n] = x) THEN BEGIN
        RETURN i;
    END
    RETURN -1;
END
```

### Suma de arreglo

- Slug: `suma-de-arreglo`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Acumula todos los elementos del arreglo en un unico recorrido lineal.

```txt
sumaArreglo(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

### Suma prefija

- Slug: `prefix-sum`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: ninguno
- Resumen: Construye una suma acumulada reutilizable y es ideal para estudiar dependencias lineales simples.

```txt
prefixSum(A[n], n) BEGIN
    pref[1] <- A[1];
    FOR i <- 2 TO n DO BEGIN
        pref[i] <- pref[i - 1] + A[i];
    END
    RETURN pref[n];
END
```

## Divide y vencerás

Parten el problema en varias partes más pequeñas, las resuelven y luego combinan el resultado.

### Binary reduction sum divide y vencerás

- Slug: `binary-reduction-sum-divide-and-conquer`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Reduccion binaria de suma: cada nivel del arbol suma dos subresultados de igual tamaño aproximado.

```txt
binaryReductionSum(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- binaryReductionSum(A, inicio, medio);
    der <- binaryReductionSum(A, medio + 1, fin);
    RETURN izq + der;
END
```

### Bitonic Sort

- Slug: `bitonic-sort`
- Familia: `ordenamiento`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Ordena dos mitades en sentido opuesto y luego las mezcla con un patron bitonico recursivo.

```txt
bitonicSort(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL bitonicSort(A, inicio, medio, true);
    CALL bitonicSort(A, medio + 1, fin, false);
    CALL bitonicMerge(A, inicio, fin, ascendente);
    RETURN 0;
END

bitonicMerge(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    i <- inicio;
    WHILE (i <= medio) DO BEGIN
        CALL compareAndSwap(A, i, i + (medio - inicio + 1), ascendente);
        i <- i + 1;
    END
    CALL bitonicMerge(A, inicio, medio, ascendente);
    CALL bitonicMerge(A, medio + 1, fin, ascendente);
    RETURN 0;
END

compareAndSwap(A[n], i, j, ascendente) BEGIN
    temp <- 0;
    IF (ascendente = true) THEN BEGIN
        IF (A[i] > A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    ELSE BEGIN
        IF (A[i] < A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    RETURN 0;
END
```

### Búsqueda de máximo por mitades

- Slug: `busqueda-maximo-por-mitades`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Encuentra el maximo global como el mayor entre los maximos de cada mitad.

```txt
maxPorMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- maxPorMitades(A, inicio, medio);
    der <- maxPorMitades(A, medio + 1, fin);
    IF (izq > der) THEN BEGIN
        RETURN izq;
    END
    RETURN der;
END
```

### Búsqueda de mínimo por mitades

- Slug: `busqueda-minimo-por-mitades`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Encuentra el minimo global como el menor entre los minimos de cada mitad.

```txt
minPorMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- minPorMitades(A, inicio, medio);
    der <- minPorMitades(A, medio + 1, fin);
    IF (izq < der) THEN BEGIN
        RETURN izq;
    END
    RETURN der;
END
```

### Construcción de árbol de torneo

- Slug: `tournament-tree-construction`
- Familia: `estructuras`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Divide el arreglo en dos ramas y combina ganadores locales en la raiz.

```txt
buildTournamentTree(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    ganadorIzq <- buildTournamentTree(A, inicio, medio);
    ganadorDer <- buildTournamentTree(A, medio + 1, fin);
    IF (ganadorIzq > ganadorDer) THEN BEGIN
        RETURN ganadorIzq;
    END
    RETURN ganadorDer;
END
```

### Conteo de inversiones

- Slug: `counting-inversions`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Divide el arreglo, cuenta en cada mitad y acumula inversiones cruzadas al combinar.

```txt
countInversions(A[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    izquierda <- countInversions(A, inicio, medio);
    derecha <- countInversions(A, medio + 1, fin);
    cruzadas <- mergeAndCount(A, inicio, medio, fin);
    RETURN izquierda + derecha + cruzadas;
END
```

### Conteo de ocurrencias por mitades

- Slug: `conteo-ocurrencias-por-mitades`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Parte el rango y suma las apariciones de x en cada mitad hasta casos base de una posicion.

```txt
countOccurrencesDC(A[n], inicio, fin, x) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN 0;
    END
    IF (inicio = fin) THEN BEGIN
        IF (A[inicio] = x) THEN BEGIN
            RETURN 1;
        END
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    izq <- countOccurrencesDC(A, inicio, medio, x);
    der <- countOccurrencesDC(A, medio + 1, fin, x);
    RETURN izq + der;
END
```

### Elemento mayoritario divide y vencerás

- Slug: `majority-element-divide-and-conquer`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Obtiene candidatos por mitad y luego los valida en la fase de combinacion.

```txt
majorityElement(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- majorityElement(A, inicio, medio);
    der <- majorityElement(A, medio + 1, fin);
    IF (izq = der) THEN BEGIN
        RETURN izq;
    END
    RETURN izq;
END
```

### Max-Min Tournament

- Slug: `max-min-tournament`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Parte el arreglo en dos mitades y combina maximo y minimo desde cada rama.

```txt
maxMinTournament(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izquierda <- maxMinTournament(A, inicio, medio);
    derecha <- maxMinTournament(A, medio + 1, fin);
    RETURN izquierda + derecha;
END
```

### Maximum Subarray divide y vencerás

- Slug: `maximum-subarray-divide-and-conquer`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Combina el mejor subarreglo en cada mitad con un cruce que atraviesa el punto medio.

```txt
maxSubarrayDC(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- maxSubarrayDC(A, inicio, medio);
    der <- maxSubarrayDC(A, medio + 1, fin);
    cruz <- maxSubarrayCruzando(A, inicio, medio, fin);
    IF (izq >= der AND izq >= cruz) THEN BEGIN
        RETURN izq;
    END
    IF (der >= cruz) THEN BEGIN
        RETURN der;
    END
    RETURN cruz;
END
```

### Merge de intervalos por divide y vencerás

- Slug: `merge-intervalos-divide-and-conquer`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Ordena intervalos por mitades y fusiona solapamientos en la fase de combinacion.

```txt
mergeIntervalsDC(I[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL mergeIntervalsDC(I, inicio, medio);
    CALL mergeIntervalsDC(I, medio + 1, fin);
    CALL mergeIntervalPair(I, medio, medio + 1);
    RETURN 0;
END
```

### Merge K arreglos ordenados

- Slug: `merge-k-arreglos-ordenados`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Divide el conjunto de segmentos en dos grupos, fusiona cada grupo por recursion y combina.

```txt
mergeKSorted(A[n], inicio, fin, k) BEGIN
    IF (k <= 1) THEN BEGIN
        RETURN 0;
    END
    medio <- k DIV 2;
    CALL mergeKSorted(A, inicio, fin, medio);
    CALL mergeKSorted(A, inicio, fin, k - medio);
    CALL mergeKCombine(A, inicio, fin, medio, k - medio);
    RETURN 0;
END
```

### Merge Sort 3-way

- Slug: `merge-sort-3-way`
- Familia: `ordenamiento`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Parte el rango en tres trozos, ordena cada uno por recursion y los fusiona en una sola pasada.

```txt
mergeSort3Way(A[n], inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN 0;
    END
    len <- fin - inicio + 1;
    tercio <- len DIV 3;
    p1 <- inicio + tercio - 1;
    p2 <- p1 + tercio;
    CALL mergeSort3Way(A, inicio, p1);
    CALL mergeSort3Way(A, p1 + 1, p2);
    CALL mergeSort3Way(A, p2 + 1, fin);
    CALL merge3(A, inicio, p1, p2, fin);
    RETURN 0;
END
```

### Multiplicación de Karatsuba

- Slug: `karatsuba-multiplication`
- Familia: `numerico`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Muestra una division ternaria del trabajo multiplicativo con combinacion algebraica al final.

```txt
karatsuba(x, y, n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN x * y;
    END
    mitad <- n DIV 2;
    z0 <- karatsuba(x, y, mitad);
    z1 <- karatsuba(x, y, mitad);
    z2 <- karatsuba(x, y, mitad);
    RETURN z0 + z1 + z2;
END
```

### Multiplicación de polinomios divide y vencerás

- Slug: `polynomial-multiplication-divide-and-conquer`
- Familia: `numerico`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Separa los polinomios en mitades y combina productos parciales al final.

```txt
multiplyPolynomial(A[n], B[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN A[1] * B[1];
    END
    mitad <- n DIV 2;
    p1 <- multiplyPolynomial(A, B, mitad);
    p2 <- multiplyPolynomial(A, B, mitad);
    p3 <- multiplyPolynomial(A, B, mitad);
    p4 <- multiplyPolynomial(A, B, mitad);
    RETURN p1 + p2 + p3 + p4;
END
```

### Ordenamiento por mezcla

- Slug: `merge-sort`
- Familia: `ordenamiento`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, AR
- Resumen: Divide el arreglo en dos mitades, ordena cada una y las mezcla en tiempo lineal.

```txt
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL merge(A, inicio, medio, fin);
    END
    RETURN 0;
END

merge(A[n], inicio, medio, fin) BEGIN
    i <- inicio;
    j <- medio + 1;
    k <- 1;
    WHILE (i <= medio AND j <= fin) DO BEGIN
        IF (A[i] <= A[j]) THEN BEGIN
            temp[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            temp[k] <- A[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    RETURN 0;
END
```

### Ordenamiento rapido

- Slug: `quick-sort`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Particiona alrededor de un pivote y resuelve recursivamente las dos regiones restantes.

```txt
quickSort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quickSort(A, izq, pi - 1);
        CALL quickSort(A, pi + 1, der);
    END
    RETURN 0;
END
```

### Ordenamiento rapido 3-way partition

- Slug: `quick-sort-3-way-partition`
- Familia: `ordenamiento`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Separa elementos menores, iguales y mayores al pivote en una sola particion tipo bandera.

```txt
quickSort3Way(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[izq];
        lt <- izq;
        i <- izq + 1;
        gt <- der;
        WHILE (i <= gt) DO BEGIN
            IF (A[i] < pivote) THEN BEGIN
                temp <- A[lt];
                A[lt] <- A[i];
                A[i] <- temp;
                lt <- lt + 1;
                i <- i + 1;
            END
            ELSE BEGIN
                IF (A[i] > pivote) THEN BEGIN
                    temp <- A[i];
                    A[i] <- A[gt];
                    A[gt] <- temp;
                    gt <- gt - 1;
                END
                ELSE BEGIN
                    i <- i + 1;
                END
            END
        END
        CALL quickSort3Way(A, izq, lt - 1);
        CALL quickSort3Way(A, gt + 1, der);
    END
    RETURN 0;
END
```

### Ordenamiento rapido aleatorizado

- Slug: `quick-sort-aleatorizado`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Elige un indice de pivote al azar, lo coloca al final y aplica la particion estandar.

```txt
quickSortRand(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        r <- randomInt(izq, der);
        temp <- A[r];
        A[r] <- A[der];
        A[der] <- temp;
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quickSortRand(A, izq, pi - 1);
        CALL quickSortRand(A, pi + 1, der);
    END
    RETURN 0;
END
```

### Ordenamiento rapido con mediana de tres

- Slug: `quick-sort-mediana-de-tres`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Compara A[izq], A[med] y A[der] para elegir pivote y reduce peor caso en datos ordenados.

```txt
quickSortMedian3(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        med <- (izq + der) DIV 2;
        CALL ordenarTres(A, izq, med, der);
        temp <- A[med];
        A[med] <- A[der - 1];
        A[der - 1] <- temp;
        pivote <- A[der - 1];
        i <- izq;
        FOR j <- izq + 1 TO der - 2 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        CALL quickSortMedian3(A, izq, i);
        CALL quickSortMedian3(A, i + 2, der);
    END
    RETURN 0;
END
```

### Ordenamiento rapido con pivote central

- Slug: `quick-sort-pivote-central`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Toma el elemento del medio del rango como pivote antes de la particion en dos subproblemas.

```txt
quickSortMid(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        med <- (izq + der) DIV 2;
        temp <- A[med];
        A[med] <- A[der];
        A[der] <- temp;
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quickSortMid(A, izq, pi - 1);
        CALL quickSortMid(A, pi + 1, der);
    END
    RETURN 0;
END
```

### Producto de arreglo por mitades

- Slug: `producto-arreglo-por-mitades`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Multiplica recursivamente el producto de la mitad izquierda por el de la derecha.

```txt
productoArrayMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- productoArrayMitades(A, inicio, medio);
    der <- productoArrayMitades(A, medio + 1, fin);
    RETURN izq * der;
END
```

### Suma de arreglo por mitades

- Slug: `suma-arreglo-por-mitades`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Suma recursiva en arbol binario de rangos hasta llegar a elementos individuales.

```txt
sumaArrayMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- sumaArrayMitades(A, inicio, medio);
    der <- sumaArrayMitades(A, medio + 1, fin);
    RETURN izq + der;
END
```

### Tournament winner and runner-up

- Slug: `tournament-winner-runner-up`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Torneo binario que propaga el mejor valor de cada mitad hacia la raiz como ganador.

```txt
tournamentWinner(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    w1 <- tournamentWinner(A, inicio, medio);
    w2 <- tournamentWinner(A, medio + 1, fin);
    IF (w1 > w2) THEN BEGIN
        RETURN w1;
    END
    RETURN w2;
END
```

### Z-order recursive matrix traversal

- Slug: `z-order-recursive-matrix-traversal`
- Familia: `matrices`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: AR
- Resumen: Recorre una matriz por cuadrantes y deja visible un patron claro de division en cuatro subproblemas.

```txt
zOrder(M[n], fila, col, tam) BEGIN
    IF (tam = 1) THEN BEGIN
        RETURN M[fila][col];
    END
    mitad <- tam DIV 2;
    q1 <- zOrder(M, fila, col, mitad);
    q2 <- zOrder(M, fila, col + mitad, mitad);
    q3 <- zOrder(M, fila + mitad, col, mitad);
    q4 <- zOrder(M, fila + mitad, col + mitad, mitad);
    RETURN q1 + q2 + q3 + q4;
END
```

## Resta y vencerás

Reducen el problema a una versión más pequeña del mismo y repiten hasta llegar al caso base.

### Binary Search primera ocurrencia

- Slug: `binary-search-first-occurrence`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: En arreglo ordenado con duplicados, localiza la primera posicion donde aparece x.

```txt
binarySearchFirst(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        izq <- binarySearchFirst(A, x, inicio, mitad - 1);
        IF (izq != -1) THEN BEGIN
            RETURN izq;
        END
        RETURN mitad;
    END
    IF (x < A[mitad]) THEN BEGIN
        RETURN binarySearchFirst(A, x, inicio, mitad - 1);
    END
    RETURN binarySearchFirst(A, x, mitad + 1, fin);
END
```

### Binary Search recursiva

- Slug: `binary-search-recursiva`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: Reduce el rango a una sola mitad y es uno de los casos mas confiables para el catalogo recursivo.

```txt
binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    ELSE BEGIN
        IF (x < A[mitad]) THEN BEGIN
            RETURN binarySearchRec(A, x, inicio, mitad - 1);
        END
        ELSE BEGIN
            RETURN binarySearchRec(A, x, mitad + 1, fin);
        END
    END
END
```

### Binary Search ultima ocurrencia

- Slug: `binary-search-last-occurrence`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: En arreglo ordenado con duplicados, localiza la ultima posicion donde aparece x.

```txt
binarySearchLast(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        der <- binarySearchLast(A, x, mitad + 1, fin);
        IF (der != -1) THEN BEGIN
            RETURN der;
        END
        RETURN mitad;
    END
    IF (x < A[mitad]) THEN BEGIN
        RETURN binarySearchLast(A, x, inicio, mitad - 1);
    END
    RETURN binarySearchLast(A, x, mitad + 1, fin);
END
```

### Conteo recursivo de digitos

- Slug: `conteo-recursivo-digitos`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Cuenta cuantos digitos tiene un entero positivo dividiendo entre 10 en cada nivel.

```txt
countDigitsRec(n) BEGIN
    IF (n < 10) THEN BEGIN
        RETURN 1;
    END
    RETURN 1 + countDigitsRec(n DIV 10);
END
```

### Conteo recursivo regresivo

- Slug: `conteo-recursivo-regresivo`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Cuenta cuantas llamadas se necesitan para llevar n a 0 restando uno en cada paso.

```txt
conteoRegresivo(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 0;
    END
    RETURN 1 + conteoRegresivo(n - 1);
END
```

### Euclides recursivo

- Slug: `euclides-recursivo`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Caso pequeno y estable para una reduccion por modulo hasta llegar al divisor final.

```txt
euclidesRecursivo(a, b) BEGIN
    IF (b = 0) THEN BEGIN
        RETURN a;
    END
    RETURN euclidesRecursivo(b, a MOD b);
END
```

### Exponenciacion rapida

- Slug: `exponenciacion-rapida`
- Familia: `numerico`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: Reduce el exponente a la mitad en cada llamada y reutiliza el subresultado central.

```txt
fastPower(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    mitad <- fastPower(x, n DIV 2);
    resultado <- mitad * mitad;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END
```

### Factorial recursivo

- Slug: `factorial-recursivo`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Una sola llamada recursiva por nivel: n por el factorial de n - 1 hasta la base.

```txt
factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorialRecursivo(n - 1);
END
```

### Find Maximum recursivo

- Slug: `find-maximum-recursivo`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Procesa un elemento por llamada y compara contra el maximo del prefijo restante.

```txt
findMaximumRec(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    anterior <- findMaximumRec(A, n - 1);
    IF (A[n] > anterior) THEN BEGIN
        RETURN A[n];
    END
    RETURN anterior;
END
```

### Find Minimum recursivo

- Slug: `find-minimum-recursivo`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Espejo del maximo: compara el ultimo elemento con el minimo del prefijo de longitud n - 1.

```txt
findMinimumRec(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    anterior <- findMinimumRec(A, n - 1);
    IF (A[n] < anterior) THEN BEGIN
        RETURN A[n];
    END
    RETURN anterior;
END
```

### Insertion Sort recursivo

- Slug: `insertion-sort-recursivo`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Ordena el prefijo de longitud n-1 y luego inserta la ultima clave.

```txt
insertionSortRec(A[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    CALL insertionSortRec(A, n - 1);
    clave <- A[n];
    j <- n - 1;
    WHILE (j > 0 AND A[j] > clave) DO BEGIN
        A[j + 1] <- A[j];
        j <- j - 1;
    END
    A[j + 1] <- clave;
    RETURN 0;
END
```

### Inversion recursiva de cadena

- Slug: `reverse-string-recursiva`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Intercambia extremos y reduce el intervalo hacia el centro.

```txt
reverseStringRec(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 0;
    END
    temp <- S[izq];
    S[izq] <- S[der];
    S[der] <- temp;
    RETURN reverseStringRec(S, izq + 1, der - 1);
END
```

### Josephus recursivo

- Slug: `josephus-recursivo`
- Familia: `clasicos`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT, EC
- Resumen: Reduce el problema en una persona por llamada y luego recompone la posicion sobreviviente.

```txt
josephus(n, k) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN ((josephus(n - 1, k) + k - 1) MOD n) + 1;
END
```

### K-esimo simbolo en gramatica

- Slug: `kth-symbol-in-grammar`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Reduce la posicion y la fila hasta un caso base corto.

```txt
kthSymbol(fila, k) BEGIN
    IF (fila = 1) THEN BEGIN
        RETURN 0;
    END
    padre <- kthSymbol(fila - 1, (k + 1) DIV 2);
    IF (k MOD 2 = 1) THEN BEGIN
        RETURN padre;
    END
    IF (padre = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN 0;
END
```

### Linear Search recursiva

- Slug: `linear-search-recursiva`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Procesa una posicion por llamada y termina cuando encuentra el elemento o consume el arreglo.

```txt
linearSearchRec(A[n], x, i, n) BEGIN
    IF (i > n) THEN BEGIN
        RETURN -1;
    END
    IF (A[i] = x) THEN BEGIN
        RETURN i;
    END
    RETURN linearSearchRec(A, x, i + 1, n);
END
```

### Max en arreglo divide-by-one

- Slug: `max-en-arreglo-divide-by-one`
- Familia: `busqueda`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Reduce el problema en un elemento y compara contra el maximo del resto.

```txt
arrayMaxDivideByOne(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    resto <- arrayMaxDivideByOne(A, n - 1);
    IF (A[n] > resto) THEN BEGIN
        RETURN A[n];
    END
    RETURN resto;
END
```

### Numeros binarios por division entre 2

- Slug: `numeros-binarios-por-division-entre-2`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM, IT
- Resumen: Reduce el numero a la mitad y reconstruye sus digitos al volver.

```txt
binaryDigits(n) BEGIN
    IF (n < 2) THEN BEGIN
        RETURN n;
    END
    RETURN binaryDigits(n DIV 2) + (n MOD 2);
END
```

### Ordenamiento por seleccion recursivo

- Slug: `recursive-selection-sort`
- Familia: `ordenamiento`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Fija la primera posicion, busca el minimo restante y continua sobre el sufijo.

```txt
selectionSortRec(A[n], inicio, n) BEGIN
    IF (inicio >= n) THEN BEGIN
        RETURN 0;
    END
    minIndice <- inicio;
    FOR j <- inicio + 1 TO n DO BEGIN
        IF (A[j] < A[minIndice]) THEN BEGIN
            minIndice <- j;
        END
    END
    temp <- A[inicio];
    A[inicio] <- A[minIndice];
    A[minIndice] <- temp;
    RETURN selectionSortRec(A, inicio + 1, n);
END
```

### Palindrome Check recursivo

- Slug: `palindrome-check-recursivo`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Compara caracteres en los extremos y cierra hacia el centro con dos indices.

```txt
palindromeRec(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN palindromeRec(S, izq + 1, der - 1);
END
```

### Potencia modular rapida

- Slug: `potencia-modular-rapida`
- Familia: `numerico`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: Reduce el exponente y conserva el modulo en cada combinacion.

```txt
fastModPower(x, n, m) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    mitad <- fastModPower(x, n DIV 2, m);
    resultado <- (mitad * mitad) MOD m;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- (resultado * x) MOD m;
    END
    RETURN resultado;
END
```

### Potencia recursiva naive

- Slug: `potencia-recursiva-naive`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Multiplica x por x^(n-1) con una sola recursion por nivel; coste lineal en n.

```txt
powerNaive(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN x * powerNaive(x, n - 1);
END
```

### Suma de 1..n recursiva

- Slug: `suma-de-1-a-n-recursiva`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Reduce en una unidad y acumula el termino actual.

```txt
sumOneToN(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN n + sumOneToN(n - 1);
END
```

### Suma de arreglo recursiva

- Slug: `suma-de-arreglo-recursiva`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Consume un elemento por llamada y delega el resto del trabajo al sufijo.

```txt
sumArrayRec(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN A[n] + sumArrayRec(A, n - 1);
END
```

### Suma recursiva de digitos

- Slug: `recursive-sum-of-digits`
- Familia: `numerico`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: IT
- Resumen: Recorta un digito por llamada hasta dejar el numero en cero.

```txt
sumDigits(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN (n MOD 10) + sumDigits(n DIV 10);
END
```

### Ternary Search recursiva

- Slug: `ternary-search-recursiva`
- Familia: `busqueda`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: TM
- Resumen: Reduce el intervalo a uno de tres bloques posibles en cada llamada.

```txt
ternarySearchRec(A[n], x, izq, der) BEGIN
    IF (izq > der) THEN BEGIN
        RETURN -1;
    END
    tercio <- (der - izq) DIV 3;
    m1 <- izq + tercio;
    m2 <- der - tercio;
    IF (A[m1] = x) THEN BEGIN
        RETURN m1;
    END
    IF (A[m2] = x) THEN BEGIN
        RETURN m2;
    END
    IF (x < A[m1]) THEN BEGIN
        RETURN ternarySearchRec(A, x, izq, m1 - 1);
    END
    IF (x > A[m2]) THEN BEGIN
        RETURN ternarySearchRec(A, x, m2 + 1, der);
    END
    RETURN ternarySearchRec(A, x, m1 + 1, m2 - 1);
END
```

## Resta y serás vencido

Abren varias ramas recursivas sobre subproblemas muy parecidos y por eso el costo suele dispararse.

### Cadenas binarias sin ceros consecutivos

- Slug: `count-binary-strings-without-consecutive-zeros`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Analogo al caso de unos: evita 00 y obtiene la misma familia de Fibonacci en el conteo.

```txt
countBinaryStringsZeros(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 2;
    END
    RETURN countBinaryStringsZeros(n - 1) + countBinaryStringsZeros(n - 2);
END
```

### Caminos con saltos 1 y 2

- Slug: `count-paths-jumps-1-and-2`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cuenta caminos en linea de longitud n con pasos unitarios o dobles.

```txt
countPathsJumps12(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN countPathsJumps12(n - 1) + countPathsJumps12(n - 2);
END
```

### Colocacion de casas en fila (1D)

- Slug: `house-placements-1d`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Casas en linea sin dos ocupadas adyacentes: misma recurrencia que escaleras 1-2.

```txt
housePlacements1D(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n + 1;
    END
    RETURN housePlacements1D(n - 1) + housePlacements1D(n - 2);
END
```

### Contar cadenas binarias sin unos consecutivos

- Slug: `count-binary-strings-without-consecutive-ones`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Recurrencia lineal clasica que conecta facilmente con ecuacion caracteristica.

```txt
countBinaryStringsOnes(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 2;
    END
    RETURN countBinaryStringsOnes(n - 1) + countBinaryStringsOnes(n - 2);
END
```

### Contar formas de llegar a N

- Slug: `count-ways-to-reach-n`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Otra recurrencia lineal corta para contar caminos con pequenos saltos.

```txt
countWaysToReachN(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN countWaysToReachN(n - 1) + countWaysToReachN(n - 2);
END
```

### Cubrir distancia con pasos 1, 2 y 3

- Slug: `cover-distance-1-2-3`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cuenta secuencias de pasos que suman n usando solo 1, 2 o 3 (recurrencia de orden 3).

```txt
coverDistance123(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 1;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN coverDistance123(n - 1) + coverDistance123(n - 2) + coverDistance123(n - 3);
END
```

### Domino 1xn con fichas 1 y 2

- Slug: `domino-tiling-1xn`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cubre una tira 1xn con fichas de longitud 1 o 2: recuento tipo Fibonacci.

```txt
dominoTiling1xn(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN dominoTiling1xn(n - 1) + dominoTiling1xn(n - 2);
END
```

### Escalera con pasos 1, 2 o 3

- Slug: `staircase-1-2-3`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Subir n escalones con pasos 1, 2 o 3: tres ramas recursivas por paso.

```txt
staircase123(n) BEGIN
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN staircase123(n - 1) + staircase123(n - 2) + staircase123(n - 3);
END
```

### Escaleras de K pasos

- Slug: `k-step-stairs`
- Familia: `secuencias`
- Dificultad: `avanzado`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Version pedagogica de escaleras con varias ramas controladas por una constante fija.

```txt
kStepStairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN kStepStairs(n - 1) + kStepStairs(n - 2) + kStepStairs(n - 3);
END
```

### Escaleras recursivas

- Slug: `climbing-stairs`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cuenta caminos con pasos de 1 y 2, generando una recurrencia lineal clasica.

```txt
climbingStairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN climbingStairs(n - 1) + climbingStairs(n - 2);
END
```

### Fibonacci recursivo

- Slug: `fibonacci-recursivo`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Referencia central del catalogo para ecuacion caracteristica y crecimiento exponencial.

```txt
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
```

### Formas de embaldosar 2xn

- Slug: `ways-to-tile-2xn`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cuenta mosaicos 2xn con una recurrencia lineal corta y muy didactica.

```txt
waysToTile2xN(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN n;
    END
    RETURN waysToTile2xN(n - 1) + waysToTile2xN(n - 2);
END
```

### Formas de escribir n con sumandos 1, 3 y 4

- Slug: `ways-write-n-with-1-3-4`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Particiones ordenadas con piezas fijas: recurrencia con cuatro desplazamientos.

```txt
waysWriteN134(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    RETURN waysWriteN134(n - 1) + waysWriteN134(n - 3) + waysWriteN134(n - 4);
END
```

### Numeros de Lucas

- Slug: `lucas-numbers`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Secuencia hermana de Fibonacci con distintas condiciones iniciales.

```txt
lucas(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 2;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN lucas(n - 1) + lucas(n - 2);
END
```

### Numeros de Pell

- Slug: `pell-numbers`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Recurrencia lineal de segundo orden que amplia el lote de ecuacion caracteristica.

```txt
pell(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN 2 * pell(n - 1) + pell(n - 2);
END
```

### Poblacion de conejos (Fibonacci)

- Slug: `rabbit-population-fibonacci`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Modelo clasico de pares de conejos por mes: misma recurrencia que Fibonacci.

```txt
rabbitFib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN rabbitFib(n - 1) + rabbitFib(n - 2);
END
```

### Rana: saltos de 1 o 2

- Slug: `frog-jump-1-or-2`
- Familia: `secuencias`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Formas de llegar al tronco n con saltos cortos; coincide con escaleras 1-2.

```txt
frogJump12(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN frogJump12(n - 1) + frogJump12(n - 2);
END
```

### Rana: saltos de 1, 2 o 3

- Slug: `frog-jump-1-2-3`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Tres transiciones por posicion; misma forma que Tribonacci en el conteo.

```txt
frogJump123(n) BEGIN
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN frogJump123(n - 1) + frogJump123(n - 2) + frogJump123(n - 3);
END
```

### Secuencia de Perrin

- Slug: `perrin-sequence`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Secuencia lineal de orden tres util para ampliar el conjunto de ejemplos verificados.

```txt
perrin(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 3;
    END
    IF (n = 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN perrin(n - 2) + perrin(n - 3);
END
```

### Sucesion de Jacobsthal

- Slug: `jacobsthal-sequence`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: J(n) = J(n-1) + 2*J(n-2); coeficientes distintos de Fibonacci, mismo orden.

```txt
jacobsthal(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN jacobsthal(n - 1) + 2 * jacobsthal(n - 2);
END
```

### Sucesion de Padovan

- Slug: `padovan-sequence`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: P(n) = P(n-2) + P(n-3) con tres valores iniciales; crece mas lento que Fibonacci.

```txt
padovan(n) BEGIN
    IF (n = 0 OR n = 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN padovan(n - 2) + padovan(n - 3);
END
```

### Tetranacci

- Slug: `tetranacci-sequence`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cuatro terminos previos suman el siguiente; extiende Tribonacci a orden cuatro.

```txt
tetranacci(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 0;
    END
    IF (n = 3) THEN BEGIN
        RETURN 1;
    END
    RETURN tetranacci(n - 1) + tetranacci(n - 2) + tetranacci(n - 3) + tetranacci(n - 4);
END
```

### Torres de Hanoi

- Slug: `hanoi`
- Familia: `clasicos`
- Dificultad: `basico`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Problema clasico con dos llamadas sobre n-1 y un trabajo local constante.

```txt
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END
```

### Tribonacci recursivo

- Slug: `tribonacci-recursivo`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Amplia el patron de Fibonacci a tres ramas sobre desplazamientos constantes.

```txt
tribonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
```

### Vacas de Narayana

- Slug: `narayana-cows`
- Familia: `secuencias`
- Dificultad: `intermedio`
- Tier: `contractual`
- Habilitado: s?
- M?todos verificados: EC
- Resumen: Cada vaca madura produce otra segun la regla de Narayana: orden tres con retardo.

```txt
narayanaCows(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 1;
    END
    RETURN narayanaCows(n - 1) + narayanaCows(n - 3);
END
```
