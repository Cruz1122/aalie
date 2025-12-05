# Análisis de Complejidad Recursiva y Detección de Métodos

## Descripción General

El sistema de análisis recursivo es capaz de detectar automáticamente qué métodos de resolución de recurrencias son aplicables a un algoritmo dado, y luego aplicar el método más apropiado para determinar su complejidad temporal.

## Proceso de Análisis

### 1. Extracción de Recurrencias desde AST

**Ubicación**: `packages/api/src/analyzers/recursive-analyzer.ts`

El primer paso es extraer la relación de recurrencia del Abstract Syntax Tree (AST) del código.

**Proceso**:
1. Identificar funciones recursivas en el AST
2. Analizar llamadas recursivas y sus argumentos
3. Determinar el trabajo no recursivo (f(n))
4. Construir la ecuación de recurrencia

**Ejemplo**:
```typescript
// Código:
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Recurrencia extraída:
// T(n) = T(n-1) + O(1)
// Caso base: T(1) = O(1)
```

### 2. Detección de Métodos Aplicables

**Endpoint**: `/analyze/detect-methods`

**Ubicación**: `packages/api/src/routes/analyze.ts`

El sistema detecta automáticamente qué métodos de resolución son aplicables basándose en la estructura de la recurrencia.

#### Métodos Disponibles

##### 2.1 Teorema Maestro

**Aplicable cuando**:
- Recurrencia de la forma: `T(n) = aT(n/b) + f(n)`
- `a ≥ 1` (número de subproblemas)
- `b > 1` (factor de división)
- `f(n)` es asintóticamente positiva

**Casos del Teorema Maestro**:

1. **Caso 1**: Si `f(n) = O(n^c)` donde `c < log_b(a)`
   - Resultado: `T(n) = Θ(n^(log_b(a)))`

2. **Caso 2**: Si `f(n) = Θ(n^c log^k(n))` donde `c = log_b(a)`
   - Resultado: `T(n) = Θ(n^c log^(k+1)(n))`

3. **Caso 3**: Si `f(n) = Ω(n^c)` donde `c > log_b(a)` y cumple condición de regularidad
   - Resultado: `T(n) = Θ(f(n))`

**Ejemplos**:
```typescript
// Merge Sort: T(n) = 2T(n/2) + n
// a=2, b=2, f(n)=n
// log_2(2) = 1, f(n) = Θ(n^1) -> Caso 2
// Resultado: T(n) = Θ(n log n)

// Binary Search: T(n) = T(n/2) + 1
// a=1, b=2, f(n)=1
// log_2(1) = 0, f(n) = Θ(n^0) -> Caso 2
// Resultado: T(n) = Θ(log n)
```

##### 2.2 Método de Iteración

**Aplicable cuando**:
- Cualquier recurrencia con patrón reconocible
- Especialmente útil para recurrencias lineales
- No requiere forma específica

**Proceso**:
1. Expandir la recurrencia varias veces
2. Identificar el patrón de expansión
3. Generalizar para k iteraciones
4. Determinar cuándo se alcanza el caso base
5. Sumar todos los términos

**Ejemplo**:
```typescript
// T(n) = T(n-1) + n
// T(n) = T(n-2) + (n-1) + n
// T(n) = T(n-3) + (n-2) + (n-1) + n
// ...
// T(n) = T(1) + 2 + 3 + ... + n
// T(n) = 1 + Σ(i=2 to n) i
// T(n) = n(n+1)/2 - 1
// T(n) = Θ(n²)
```

##### 2.3 Árbol de Recursión

**Aplicable cuando**:
- Múltiples llamadas recursivas
- Útil para visualizar el costo total
- Funciona bien con divide y conquista

**Proceso**:
1. Construir árbol de llamadas recursivas
2. Calcular costo por nivel
3. Determinar altura del árbol
4. Sumar costos de todos los niveles

**Ejemplo**:
```typescript
// Fibonacci: T(n) = T(n-1) + T(n-2) + 1
//
//                    T(n)
//                   /    \
//              T(n-1)    T(n-2)
//              /   \      /   \
//         T(n-2) T(n-3) T(n-3) T(n-4)
//         ...
//
// Altura: n
// Nodos por nivel: crece exponencialmente
// Resultado: T(n) = Θ(φ^n) donde φ = (1+√5)/2
```

##### 2.4 Ecuación Característica

**Aplicable cuando**:
- Recurrencia lineal homogénea con coeficientes constantes
- Forma: `T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k)`

**Proceso**:
1. Formar ecuación característica: `r^k - c₁r^(k-1) - c₂r^(k-2) - ... - cₖ = 0`
2. Resolver para encontrar raíces
3. Construir solución general basada en raíces
4. Aplicar condiciones iniciales

**Ejemplo**:
```typescript
// T(n) = 3T(n-1) - 2T(n-2)
// Ecuación característica: r² - 3r + 2 = 0
// Raíces: r₁ = 2, r₂ = 1
// Solución general: T(n) = c₁·2^n + c₂·1^n
// Con T(0)=1, T(1)=3: T(n) = 2^(n+1) - 1
// Resultado: T(n) = Θ(2^n)
```

### 3. Priorización de Métodos

El sistema prioriza los métodos en el siguiente orden:

1. **Teorema Maestro** (si aplicable)
   - Más rápido y directo
   - Resultado exacto para forma específica

2. **Ecuación Característica** (si aplicable)
   - Exacto para recurrencias lineales homogéneas
   - Proporciona forma cerrada

3. **Método de Iteración**
   - Más general
   - Útil cuando otros métodos no aplican

4. **Árbol de Recursión**
   - Útil para visualización
   - Puede ser aproximado para casos complejos

### 4. Implementación de Detección

```typescript
// packages/api/src/analyzers/method-detector.ts

interface RecurrencePattern {
  type: 'divide-conquer' | 'linear' | 'multiple' | 'general';
  coefficients: number[];
  baseCase: number;
  nonRecursiveWork: string;
}

function detectApplicableMethods(recurrence: RecurrencePattern): Method[] {
  const methods: Method[] = [];

  // Verificar Teorema Maestro
  if (isMasterTheoremApplicable(recurrence)) {
    methods.push({
      name: 'master-theorem',
      priority: 1,
      applicability: 'high'
    });
  }

  // Verificar Ecuación Característica
  if (isCharacteristicEquationApplicable(recurrence)) {
    methods.push({
      name: 'characteristic-equation',
      priority: 2,
      applicability: 'high'
    });
  }

  // Método de Iteración siempre aplicable
  methods.push({
    name: 'iteration',
    priority: 3,
    applicability: 'medium'
  });

  // Árbol de Recursión para múltiples llamadas
  if (recurrence.type === 'multiple') {
    methods.push({
      name: 'recursion-tree',
      priority: 4,
      applicability: 'medium'
    });
  }

  return methods.sort((a, b) => a.priority - b.priority);
}
```

## Endpoint `/analyze/detect-methods`

### Request

```typescript
POST /analyze/detect-methods
Content-Type: application/json

{
  "code": "function mergeSort(arr, n) { ... }",
  "language": "javascript"
}
```

### Response

```typescript
{
  "recurrence": {
    "equation": "T(n) = 2T(n/2) + n",
    "type": "divide-conquer",
    "a": 2,
    "b": 2,
    "f_n": "n"
  },
  "applicableMethods": [
    {
      "name": "master-theorem",
      "priority": 1,
      "applicability": "high",
      "reason": "Recurrence matches form T(n) = aT(n/b) + f(n)",
      "expectedComplexity": "Θ(n log n)"
    },
    {
      "name": "recursion-tree",
      "priority": 2,
      "applicability": "medium",
      "reason": "Multiple recursive calls present",
      "expectedComplexity": "Θ(n log n)"
    },
    {
      "name": "iteration",
      "priority": 3,
      "applicability": "medium",
      "reason": "Always applicable as fallback",
      "expectedComplexity": "Θ(n log n)"
    }
  ],
  "recommendedMethod": "master-theorem"
}
```

## Casos Especiales

### Recurrencias con Múltiples Variables

```typescript
// T(n, m) = T(n-1, m) + T(n, m-1) + 1
// Sistema detecta múltiples variables
// Aplica análisis dimensional
// Resultado: T(n, m) = Θ(2^(n+m))
```

### Recurrencias No Estándar

```typescript
// T(n) = T(√n) + 1
// Sistema detecta patrón no estándar
// Aplica cambio de variable: m = log n
// Convierte a: S(m) = S(m/2) + 1
// Resuelve: S(m) = Θ(log m)
// Resultado: T(n) = Θ(log log n)
```

### Recurrencias con Piso/Techo

```typescript
// T(n) = T(⌊n/2⌋) + T(⌈n/2⌉) + n
// Sistema ignora piso/techo para análisis asintótico
// Trata como: T(n) = 2T(n/2) + n
// Resultado: T(n) = Θ(n log n)
```

## Integración con Otros Componentes

### Con SymPy

```typescript
// Usa SymPy para resolver ecuaciones características
const roots = solveCharacteristicEquation(equation);
const solution = buildSolutionFromRoots(roots, initialConditions);
```

### Con Analizador de AST

```typescript
// Extrae información del AST
const recursiveCalls = findRecursiveCalls(ast);
const baseCase = findBaseCase(ast);
const work = analyzeNonRecursiveWork(ast);
```

### Con Generador de Explicaciones

```typescript
// Genera explicación paso a paso
const explanation = generateMethodExplanation(method, recurrence);
```

## Métricas y Logging

El sistema registra:
- Tiempo de detección de métodos
- Método seleccionado y razón
- Éxito/fallo de cada método
- Complejidad final determinada

## Referencias

- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms)
- [Master Theorem](https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms))
- [Recurrence Relations](https://en.wikipedia.org/wiki/Recurrence_relation)
