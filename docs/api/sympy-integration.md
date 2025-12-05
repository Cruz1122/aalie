# Integración de SymPy en el Backend

## Descripción General

SymPy es una biblioteca de Python para matemática simbólica que se utiliza extensivamente en el backend para el análisis de complejidad algorítmica. Esta integración permite convertir expresiones LaTeX en objetos matemáticos manipulables, simplificar expresiones complejas y resolver recurrencias.

## Componentes Principales

### 1. Conversión de LaTeX a SymPy

El sistema convierte expresiones LaTeX generadas por los analizadores en objetos SymPy para su manipulación matemática.

**Ubicación**: `packages/api/src/utils/latex-to-sympy.ts`

**Funcionalidad**:
- Parsea expresiones LaTeX
- Convierte a objetos SymPy (símbolos, sumas, productos, etc.)
- Maneja notaciones especiales (sumatorias, productos, límites)

**Ejemplo de uso**:
```python
from sympy import sympify, latex
from sympy.parsing.latex import parse_latex

# Convertir LaTeX a SymPy
latex_expr = r"\sum_{i=1}^{n} i"
sympy_expr = parse_latex(latex_expr)
# Resultado: Sum(i, (i, 1, n))
```

### 2. Cierre de Sumatorias (SummationCloser)

**Ubicación**: `packages/api/src/analyzers/summation-closer.ts`

El `SummationCloser` es responsable de convertir sumatorias en formas cerradas cuando es posible.

**Proceso**:
1. Identifica sumatorias en la expresión
2. Intenta aplicar fórmulas conocidas (suma aritmética, geométrica, etc.)
3. Utiliza SymPy para simplificar cuando no hay fórmula directa
4. Retorna la expresión en forma cerrada

**Ejemplo**:
```typescript
// Entrada: Σ(i=1 to n) i
// Salida: n(n+1)/2

// Entrada: Σ(i=0 to n) 2^i
// Salida: 2^(n+1) - 1
```

**Fórmulas implementadas**:
- Suma aritmética: `Σ(i=1 to n) i = n(n+1)/2`
- Suma de cuadrados: `Σ(i=1 to n) i² = n(n+1)(2n+1)/6`
- Suma geométrica: `Σ(i=0 to n) r^i = (r^(n+1) - 1)/(r - 1)`
- Suma de constantes: `Σ(i=1 to n) c = c·n`

### 3. Simplificación de Expresiones

**Ubicación**: Integrado en todos los analizadores

SymPy se utiliza para simplificar expresiones matemáticas complejas:

```python
from sympy import simplify, expand, factor

# Simplificación general
expr = parse_latex(r"n^2 + 2n + 1")
simplified = simplify(expr)  # (n + 1)^2

# Expansión
expanded = expand((n + 1)**2)  # n^2 + 2n + 1

# Factorización
factored = factor(n**2 + 2*n + 1)  # (n + 1)^2
```

### 4. Resolución de Recurrencias

**Ubicación**: `packages/api/src/analyzers/recurrence-solver.ts`

SymPy se utiliza para resolver ecuaciones de recurrencia mediante diferentes métodos:

#### 4.1 Método de Iteración

Expande la recurrencia iterativamente y busca un patrón:

```python
from sympy import symbols, Function, rsolve

n = symbols('n', integer=True, positive=True)
T = Function('T')

# T(n) = T(n-1) + n
# Condición inicial: T(1) = 1
result = rsolve(T(n) - T(n-1) - n, T(n), {T(1): 1})
# Resultado: n(n+1)/2
```

#### 4.2 Ecuación Característica

Para recurrencias lineales homogéneas:

```python
from sympy import symbols, solve

# T(n) = 2T(n-1) + 3T(n-2)
# Ecuación característica: r^2 - 2r - 3 = 0
r = symbols('r')
char_eq = r**2 - 2*r - 3
roots = solve(char_eq, r)
# Raíces: r1 = 3, r2 = -1
# Solución: T(n) = c1·3^n + c2·(-1)^n
```

#### 4.3 Teorema Maestro

Para recurrencias de la forma `T(n) = aT(n/b) + f(n)`:

```python
from sympy import log, symbols

n, a, b = symbols('n a b', positive=True, real=True)

# T(n) = 2T(n/2) + n
# a = 2, b = 2, f(n) = n
# log_b(a) = log_2(2) = 1
# f(n) = Θ(n^1) -> Caso 2
# Resultado: T(n) = Θ(n log n)
```

## Integración en Analizadores

### Analizador Iterativo

```typescript
// packages/api/src/analyzers/iterative-analyzer.ts

// 1. Construir expresión de complejidad
const complexity = buildComplexityExpression(loops);

// 2. Convertir a SymPy
const sympyExpr = latexToSympy(complexity);

// 3. Cerrar sumatorias
const closed = closeSummations(sympyExpr);

// 4. Simplificar
const simplified = simplify(closed);

// 5. Determinar notación Big-O
const bigO = determineBigO(simplified);
```

### Analizador Recursivo

```typescript
// packages/api/src/analyzers/recursive-analyzer.ts

// 1. Extraer recurrencia del AST
const recurrence = extractRecurrence(ast);

// 2. Detectar métodos aplicables
const methods = detectApplicableMethods(recurrence);

// 3. Resolver con SymPy
const solution = solveRecurrence(recurrence, methods[0]);

// 4. Simplificar resultado
const simplified = simplify(solution);
```

## Manejo de Casos Especiales

### Expresiones No Simplificables

Cuando SymPy no puede simplificar una expresión, el sistema:
1. Retorna la expresión original
2. Registra un warning en los logs
3. Intenta aproximaciones numéricas si es posible

### Límites de Tiempo

Para evitar cálculos infinitos:
- Timeout de 5 segundos para operaciones de SymPy
- Fallback a métodos heurísticos si se excede el tiempo

### Precisión Numérica

SymPy trabaja con precisión arbitraria, pero para la presentación:
- Se redondean resultados numéricos a 4 decimales
- Se mantienen expresiones simbólicas cuando es posible

## Ejemplos de Uso Completo

### Ejemplo 1: Análisis de Bucles Anidados

```typescript
// Código analizado:
for (let i = 0; i < n; i++) {
  for (let j = 0; j < i; j++) {
    // O(1)
  }
}

// Proceso:
// 1. Expresión inicial: Σ(i=0 to n-1) Σ(j=0 to i-1) 1
// 2. Cierre interno: Σ(i=0 to n-1) i
// 3. Cierre externo: n(n-1)/2
// 4. Simplificación: n²/2 - n/2
// 5. Big-O: O(n²)
```

### Ejemplo 2: Recurrencia Divide y Conquista

```typescript
// Código analizado:
function mergeSort(arr, n) {
  if (n <= 1) return arr;
  const mid = Math.floor(n / 2);
  mergeSort(arr, mid);
  mergeSort(arr, n - mid);
  merge(arr, mid, n);  // O(n)
}

// Proceso:
// 1. Recurrencia: T(n) = 2T(n/2) + n
// 2. Teorema Maestro: a=2, b=2, f(n)=n
// 3. log_2(2) = 1, f(n) = Θ(n^1) -> Caso 2
// 4. Resultado: T(n) = Θ(n log n)
```

## Variables de Entorno

```env
# Configuración de SymPy
SYMPY_TIMEOUT=5000  # Timeout en ms para operaciones
SYMPY_PRECISION=4   # Decimales para resultados numéricos
```

## Dependencias

```json
{
  "dependencies": {
    "sympy": "^1.12.0"
  }
}
```

## Limitaciones Conocidas

1. **Recurrencias no lineales**: SymPy puede tener dificultades con recurrencias muy complejas
2. **Expresiones con múltiples variables**: Se asume `n` como variable principal
3. **Funciones especiales**: Algunas funciones matemáticas especiales pueden no simplificarse correctamente

## Referencias

- [Documentación oficial de SymPy](https://docs.sympy.org/)
- [SymPy Tutorial](https://docs.sympy.org/latest/tutorial/index.html)
- [Recurrence Relations in SymPy](https://docs.sympy.org/latest/modules/solvers/recurr.html)
