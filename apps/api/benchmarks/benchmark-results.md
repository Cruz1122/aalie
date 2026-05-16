El benchmark de pipeline mide las tres etapas por la misma via: llamadas HTTP in-process sobre FastAPI (`/grammar/parse`, `/classify`, `/analyze/open`). No incluye export institucional.

La columna Tamaño simbolico es referencial para el caso pedagogico. El motor analiza estructura simbolica y no ejecuta el algoritmo sobre una entrada material de ese tamano.

| Caso | Familia | Tamaño simbolico | Parse mediana | Classify mediana | Analyze mediana | Analyze / Total | Total mediana | P95 total | Θ esperada | Θ obtenida | Estado |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| FOR lineal | Iterativo | n=1000 | 7.252 ms | 6.813 ms | 170.085 ms | 92.3% | 184.19 ms | 383.527 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| FOR anidado | Iterativo | n=500 | 8.665 ms | 8.201 ms | 476.223 ms | 95.4% | 498.963 ms | 726.852 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| FOR triangular | Iterativo | n=500 | 8.484 ms | 8.412 ms | 1105.237 ms | 98.4% | 1123.084 ms | 1268.205 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| WHILE lineal | Iterativo/WHILE | n=1000 | 9.592 ms | 9.003 ms | 453.622 ms | 95.1% | 477.097 ms | 630.512 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| WHILE logaritmico | Iterativo/WHILE | n=65536 | 9.707 ms | 8.787 ms | 228.277 ms | 92.0% | 248.067 ms | 421.956 ms | $\Theta(\log n)$ | $\Theta(\log n)$ | OK |
| WHILE ambiguo | Iterativo/WHILE | n=100 | 11.616 ms | 11.395 ms | 189.985 ms | 88.5% | 214.611 ms | 356.25 ms | No concluyente | No concluyente | OK |
| MergeSort | Recursivo DyV | n=8192 | 12.94 ms | 12.851 ms | 18.23 ms | 41.2% | 44.28 ms | 99.091 ms | $\Theta(n \log n)$ | $\Theta(n \log n)$ | OK |
| Factorial | Recursivo lineal | n=100 | 8.763 ms | 8.266 ms | 17.608 ms | 50.1% | 35.112 ms | 112.219 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| Fibonacci | Recursivo multiple | n=30 | 9.518 ms | 9.286 ms | 494.218 ms | 96.1% | 514.194 ms | 724.352 ms | $\Theta(\varphi^n)$ | $\Theta(\varphi^n)$ | OK |
| Euclides | WHILE especifico | n=10000 | 11.217 ms | 11.004 ms | 667.432 ms | 96.2% | 693.993 ms | 932.672 ms | $\Theta(\log(\min(a,b)))$ | $\Theta(\log(\min(a,b)))$ | OK |
| Binary Search | DyV / WHILE intervalo | n=65536 | 16.433 ms | 15.85 ms | 699.046 ms | 94.5% | 739.917 ms | 948.354 ms | $\Theta(\log n)$ | $\Theta(\log n)$ | OK |
| Inicializacion matriz 3D | Iterativo triple | n=100 | 12.664 ms | 12.187 ms | 972.812 ms | 96.6% | 1007.205 ms | 1272.499 ms | $\Theta(n^3)$ | $\Theta(n^3)$ | OK |
| Selection Sort | Iterativo cuadratico | n=500 | 12.514 ms | 12.242 ms | 1779.877 ms | 98.6% | 1804.703 ms | 2033.911 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| Recorrido arbol binario | Recursivo estructural | n=1000 | 8.162 ms | 8.011 ms | 9.592 ms | 36.5% | 26.254 ms | 88.415 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
