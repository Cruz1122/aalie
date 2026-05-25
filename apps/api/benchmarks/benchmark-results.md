El benchmark de pipeline mide las tres etapas por la misma via: llamadas HTTP in-process sobre FastAPI (`/grammar/parse`, `/classify`, `/analyze/open`). No incluye export institucional.

La columna Tamaño simbolico es referencial para el caso pedagogico. El motor analiza estructura simbolica y no ejecuta el algoritmo sobre una entrada material de ese tamano.

| Caso | Familia | Tamaño simbolico | Parse mediana | Classify mediana | Analyze mediana | Analyze / Total | Total mediana | P95 total | Θ esperada | Θ obtenida | Estado |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| FOR lineal | Iterativo | n=1000 | 4.216 ms | 3.956 ms | 94.168 ms | 91.6% | 102.84 ms | 158.287 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| FOR anidado | Iterativo | n=500 | 4.849 ms | 4.706 ms | 237.306 ms | 96.3% | 246.453 ms | 358.805 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| FOR triangular | Iterativo | n=500 | 4.933 ms | 4.913 ms | 568.803 ms | 98.2% | 578.946 ms | 657.982 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| WHILE lineal | Iterativo/WHILE | n=1000 | 5.852 ms | 5.758 ms | 260.696 ms | 95.9% | 271.93 ms | 390.118 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| WHILE logaritmico | Iterativo/WHILE | n=65536 | 6.256 ms | 5.844 ms | 138.367 ms | 91.7% | 150.873 ms | 240.866 ms | $\Theta(\log n)$ | $\Theta(\log n)$ | OK |
| WHILE ambiguo | Iterativo/WHILE | n=100 | 7.146 ms | 6.955 ms | 114.32 ms | 88.5% | 129.186 ms | 222.049 ms | No concluyente | No concluyente | OK |
| MergeSort | Recursivo DyV | n=8192 | 8.204 ms | 7.928 ms | 10.803 ms | 39.5% | 27.324 ms | 42.38 ms | $\Theta(n \log n)$ | $\Theta(n \log n)$ | OK |
| Factorial | Recursivo lineal | n=100 | 5.431 ms | 5.427 ms | 10.574 ms | 48.6% | 21.779 ms | 33.989 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
| Fibonacci | Recursivo multiple | n=30 | 5.956 ms | 5.915 ms | 322.134 ms | 94.8% | 339.888 ms | 492.468 ms | $\Theta(\varphi^n)$ | $\Theta(\varphi^n)$ | OK |
| Euclides | WHILE especifico | n=10000 | 7.084 ms | 7.21 ms | 410.141 ms | 96.1% | 426.613 ms | 548.487 ms | $\Theta(\log(\min(a,b)))$ | $\Theta(\log(\min(a,b)))$ | OK |
| Binary Search | DyV / WHILE intervalo | n=65536 | 10.025 ms | 10.443 ms | 406.858 ms | 94.4% | 431.219 ms | 498.831 ms | $\Theta(\log n)$ | $\Theta(\log n)$ | OK |
| Inicializacion matriz 3D | Iterativo triple | n=100 | 7.83 ms | 7.639 ms | 555.002 ms | 96.4% | 575.647 ms | 683.969 ms | $\Theta(n^3)$ | $\Theta(n^3)$ | OK |
| Selection Sort | Iterativo cuadratico | n=500 | 10.404 ms | 10.572 ms | 1425.253 ms | 98.6% | 1445.738 ms | 1576.256 ms | $\Theta(n^2)$ | $\Theta(n^2)$ | OK |
| Recorrido arbol binario | Recursivo estructural | n=1000 | 6.192 ms | 5.987 ms | 7.028 ms | 36.0% | 19.526 ms | 23.515 ms | $\Theta(n)$ | $\Theta(n)$ | OK |
