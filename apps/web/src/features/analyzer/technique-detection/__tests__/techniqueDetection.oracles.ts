import type { EvidenceRole, TechniqueId } from "../types";

export type TechniqueOracle = {
  id: string;
  source: string;
  expectedTechnique: TechniqueId;
  minConfidence?: "high" | "medium" | "low";
  requiredRoles?: EvidenceRole[];
  forbiddenTechniques?: TechniqueId[];
};

export const TECHNIQUE_ORACLES: TechniqueOracle[] = [
  {
    id: "binary-search-recursive-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    requiredRoles: ["recursive_call"],
    source: `
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
`,
  },
  {
    id: "ternary-search-recursive-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    requiredRoles: ["recursive_call"],
    source: `
ternarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    tercio <- (fin - inicio) DIV 3;
    m1 <- inicio + tercio;
    m2 <- fin - tercio;
    IF (A[m1] = x) THEN BEGIN
        RETURN m1;
    END
    ELSE BEGIN
        IF (A[m2] = x) THEN BEGIN
            RETURN m2;
        END
        ELSE BEGIN
            IF (x < A[m1]) THEN BEGIN
                RETURN ternarySearchRec(A, x, inicio, m1 - 1);
            END
            ELSE BEGIN
                IF (x > A[m2]) THEN BEGIN
                    RETURN ternarySearchRec(A, x, m2 + 1, fin);
                END
                ELSE BEGIN
                    RETURN ternarySearchRec(A, x, m1 + 1, m2 - 1);
                END
            END
        END
    END
END
`,
  },
  {
    id: "fibonacci-is-recursive-expansion",
    expectedTechnique: "recursive_expansion",
    requiredRoles: ["recursive_call"],
    source: `
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
`,
  },
  {
    id: "hanoi-is-recursive-expansion",
    expectedTechnique: "recursive_expansion",
    requiredRoles: ["recursive_call"],
    source: `
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END
`,
  },
  {
    id: "generic-k-way-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    requiredRoles: ["recursive_call"],
    source: `
split4(A[n], l, r) BEGIN
    IF (l >= r) THEN BEGIN
        RETURN 0;
    END
    span <- (r - l) DIV 4;
    p1 <- l + span;
    p2 <- l + (2 * span);
    p3 <- l + (3 * span);
    a <- split4(A, l, p1);
    b <- split4(A, p1 + 1, p2);
    c <- split4(A, p2 + 1, p3);
    d <- split4(A, p3 + 1, r);
    RETURN a + b + c + d;
END
`,
  },
  {
    id: "bubble-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "gnome-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "cocktail-shaker-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down"],
    source: `
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
`,
  },
  {
    id: "insertion-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "selection-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "quick-sort-inline-partition-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    requiredRoles: ["recursive_call"],
    source: `
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
`,
  },
  {
    id: "merge-sort-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    requiredRoles: ["recursive_call"],
    source: `
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL merge(A, inicio, medio, fin);
    END
    RETURN 0;
END
`,
  },
  {
    id: "fibonacci-dp-bottom-up-is-dp",
    expectedTechnique: "dp_bottom_up",
    forbiddenTechniques: ["iterative", "greedy"],
    source: `
fibDP(n) BEGIN
    dp[1] <- 1;
    dp[2] <- 1;
    FOR i <- 3 TO n DO BEGIN
        dp[i] <- dp[i - 1] + dp[i - 2];
    END
    RETURN dp[n];
END
`,
  },
  {
    id: "shell-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "comb-sort-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "fast-power-is-decrease-and-conquer",
    expectedTechnique: "decrease_and_conquer",
    forbiddenTechniques: ["divide_and_conquer", "recursive_expansion"],
    source: `
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
`,
  },
  {
    id: "factorial-recursivo-is-decrease-and-conquer",
    expectedTechnique: "decrease_and_conquer",
    forbiddenTechniques: ["divide_and_conquer", "recursive_expansion"],
    source: `
factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorialRecursivo(n - 1);
END
`,
  },
  {
    id: "climbing-stairs-is-recursive-expansion",
    expectedTechnique: "recursive_expansion",
    forbiddenTechniques: ["divide_and_conquer", "decrease_and_conquer"],
    source: `
climbingStairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN climbingStairs(n - 1) + climbingStairs(n - 2);
END
`,
  },
  {
    id: "dp-top-down-memoized-fibonacci-is-dp",
    expectedTechnique: "dp_top_down",
    source: `
fibMemo(n, memo[n]) BEGIN
    IF (memo[n] != -1) THEN BEGIN
        RETURN memo[n];
    END
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    memo[n] <- fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    RETURN memo[n];
END
`,
  },
  {
    id: "euclides-recursivo-is-decrease-and-conquer",
    expectedTechnique: "decrease_and_conquer",
    forbiddenTechniques: ["divide_and_conquer", "recursive_expansion"],
    source: `
euclidesRecursivo(a, b) BEGIN
    IF (b = 0) THEN BEGIN
        RETURN a;
    END
    RETURN euclidesRecursivo(b, a MOD b);
END
`,
  },
  {
    id: "conteo-regresivo-is-decrease-and-conquer",
    expectedTechnique: "decrease_and_conquer",
    forbiddenTechniques: ["divide_and_conquer", "recursive_expansion"],
    source: `
conteoRegresivo(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 0;
    END
    RETURN 1 + conteoRegresivo(n - 1);
END
`,
  },
  {
    id: "kadane-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down", "greedy"],
    source: `
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
`,
  },
  {
    id: "sieve-eratosthenes-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_bottom_up", "dp_top_down"],
    source: `
sieveOfEratosthenes(n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        primo[i] <- true;
    END
    i <- 2;
    WHILE (i * i <= n) DO BEGIN
        IF (primo[i] = true) THEN BEGIN
            j <- i * i;
            WHILE (j <= n) DO BEGIN
                primo[j] <- false;
                j <- j + i;
            END
        END
        i <- i + 1;
    END
    RETURN 0;
END
`,
  },
  {
    id: "quick-sort-rand-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    source: `
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
`,
  },
  {
    id: "quick-sort-median3-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    source: `
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
`,
  },
  {
    id: "sentinel-linear-search-is-iterative",
    expectedTechnique: "iterative",
    forbiddenTechniques: ["dp_top_down", "dp_bottom_up"],
    source: `
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
`,
  },
  {
    id: "quick-sort-3way-partition-is-divide-and-conquer",
    expectedTechnique: "divide_and_conquer",
    forbiddenTechniques: ["recursive_expansion", "decrease_and_conquer"],
    source: `
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
`,
  },
];
