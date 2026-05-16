El benchmark de trace mide ejecucion concreta via `/analyze/trace`, donde `inputSize` si afecta el recorrido operativo del algoritmo y la cantidad de pasos.

| Caso | Familia | inputSize | Case | Trace mediana | P95 trace | Pasos medianos | Kind | Estado |
|---|---|---:|---|---:|---:|---:|---|---|
| WHILE lineal | Iterativo/WHILE | 1000 | worst | 1850.414 ms | 2049.041 ms | 4003.0 | iterative | OK |
| WHILE logaritmico | Iterativo/WHILE | 65536 | worst | 33.009 ms | 56.822 ms | 71.0 | iterative | OK |
| Euclides | WHILE especifico | 10000 | worst | 14.327 ms | 18.607 ms | 13.0 | iterative | OK |
| Binary Search | DyV / WHILE intervalo | 65536 | worst | 3037.949 ms | 3242.091 ms | 107.0 | iterative | OK |
| Factorial | Recursivo lineal | 100 | worst | 108.174 ms | 223.33 ms | 598.0 | recursive | OK |
| Recorrido arbol binario | Recursivo estructural | 1023 | worst | 309.279 ms | 523.26 ms | 300.0 | recursive | OK |
