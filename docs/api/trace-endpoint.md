# Endpoint /trace y Variables de Entorno

## Descripción General

El endpoint `/analyze/trace` es responsable de generar el seguimiento paso a paso de la ejecución de un algoritmo. Su comportamiento varía significativamente dependiendo de si el algoritmo es iterativo o recursivo.

## Endpoint `/analyze/trace`

### URL
```
POST /analyze/trace
```

### Request Body

```typescript
interface TraceRequest {
  code: string;           // Código del algoritmo
  language: string;       // Lenguaje de programación
  inputs: {              // Valores de entrada para la ejecución
    [key: string]: any;
  };
  algorithmType?: 'iterative' | 'recursive';  // Tipo de algoritmo (opcional)
}
```

### Ejemplo de Request

```json
{
  "code": "function bubbleSort(arr) { ... }",
  "language": "javascript",
  "inputs": {
    "arr": [5, 2, 8, 1, 9]
  },
  "algorithmType": "iterative"
}
```

## Funcionamiento para Algoritmos Iterativos

### Proceso

1. **Instrumentación del Código**
   - Se inserta código de rastreo en puntos clave
   - Se capturan valores de variables en cada paso
   - Se registran operaciones y decisiones

2. **Ejecución Controlada**
   - El código se ejecuta en un entorno aislado
   - Se captura el estado en cada iteración
   - Se registran cambios en variables

3. **Generación de Trace**
   - Se construye un array de pasos
   - Cada paso contiene: línea, variables, operación

### Response para Iterativos

```typescript
{
  "success": true,
  "trace": {
    "type": "iterative",
    "steps": [
      {
        "stepNumber": 1,
        "line": 2,
        "code": "let i = 0",
        "variables": {
          "i": 0,
          "arr": [5, 2, 8, 1, 9]
        },
        "operation": "initialization",
        "description": "Inicialización de variable i"
      },
      {
        "stepNumber": 2,
        "line": 3,
        "code": "i < arr.length",
        "variables": {
          "i": 0,
          "arr": [5, 2, 8, 1, 9]
        },
        "operation": "condition",
        "conditionResult": true,
        "description": "Evaluación de condición del bucle"
      },
      // ... más pasos
    ],
    "totalSteps": 45,
    "finalState": {
      "arr": [1, 2, 5, 8, 9]
    }
  },
  "metadata": {
    "executionTime": 125,      // ms
    "tokensUsed": 0,           // No usa LLM
    "estimatedCost": 0
  }
}
```

## Funcionamiento para Algoritmos Recursivos

### Proceso

1. **Detección de Recursión**
   - Se identifica la función recursiva
   - Se extraen casos base y recursivos
   - Se determina la estructura de llamadas

2. **Generación con LLM**
   - Se usa Gemini para generar el diagrama
   - Se proporciona el código y los inputs
   - Se solicita un diagrama en formato Mermaid

3. **Construcción del Árbol**
   - Se parsea la respuesta del LLM
   - Se construye estructura de árbol de recursión
   - Se generan nodos y edges para React Flow

### Response para Recursivos

```typescript
{
  "success": true,
  "trace": {
    "type": "recursive",
    "recursionTree": {
      "nodes": [
        {
          "id": "1",
          "data": {
            "label": "fib(5)",
            "input": 5,
            "output": 5,
            "level": 0
          },
          "position": { "x": 0, "y": 0 }
        },
        {
          "id": "2",
          "data": {
            "label": "fib(4)",
            "input": 4,
            "output": 3,
            "level": 1
          },
          "position": { "x": -100, "y": 100 }
        },
        // ... más nodos
      ],
      "edges": [
        {
          "id": "e1-2",
          "source": "1",
          "target": "2",
          "label": "call"
        },
        // ... más edges
      ]
    },
    "diagram": {
      "type": "mermaid",
      "content": "graph TD\n  A[fib(5)] --> B[fib(4)]\n  A --> C[fib(3)]...",
      "explanation": "Este diagrama muestra el árbol de llamadas recursivas..."
    },
    "steps": [
      {
        "stepNumber": 1,
        "callStack": ["fib(5)"],
        "currentCall": "fib(5)",
        "operation": "call",
        "recursion": {
          "depth": 0,
          "arguments": [5]
        }
      },
      // ... más pasos
    ]
  },
  "metadata": {
    "executionTime": 2340,     // ms (incluye llamada a LLM)
    "tokensUsed": 1250,        // Tokens del LLM
    "estimatedCost": 0.00125,  // USD
    "model": "gemini-1.5-flash"
  }
}
```

## Metadatos de Ejecución

### Tiempo de Ejecución

```typescript
metadata.executionTime: number  // Milisegundos
```

- **Iterativos**: Solo tiempo de ejecución del código
- **Recursivos**: Incluye tiempo de llamada al LLM (generalmente 1-3 segundos)

### Tokens Utilizados

```typescript
metadata.tokensUsed: number
```

- **Iterativos**: Siempre 0 (no usa LLM)
- **Recursivos**: Varía según complejidad del código (típicamente 500-2000 tokens)

### Costo Estimado

```typescript
metadata.estimatedCost: number  // USD
```

Calculado como:
```typescript
const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;
const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
const totalCost = inputCost + outputCost;
```

Precios actuales (Gemini 1.5 Flash):
- Input: $0.075 por millón de tokens
- Output: $0.30 por millón de tokens

## Variables de Entorno del Backend

### Configuración General

```env
# Puerto del servidor
PORT=3001

# Entorno de ejecución
NODE_ENV=development

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:3000
```

### Configuración de LLM

```env
# API Key de Google Gemini
GEMINI_API_KEY=your_api_key_here

# Modelo por defecto
DEFAULT_MODEL=gemini-1.5-flash

# Timeout para llamadas a LLM (ms)
LLM_TIMEOUT=30000

# Máximo de tokens en respuesta
MAX_OUTPUT_TOKENS=2048
```

### Configuración de Ejecución

```env
# Timeout para ejecución de código (ms)
CODE_EXECUTION_TIMEOUT=5000

# Máximo de pasos en trace iterativo
MAX_TRACE_STEPS=1000

# Máxima profundidad de recursión para trace
MAX_RECURSION_DEPTH=50
```

### Configuración de SymPy

```env
# Timeout para operaciones de SymPy (ms)
SYMPY_TIMEOUT=5000

# Precisión numérica
SYMPY_PRECISION=4
```

### Configuración de Cache

```env
# Habilitar cache de resultados
ENABLE_CACHE=true

# Tiempo de vida del cache (segundos)
CACHE_TTL=3600

# Tamaño máximo del cache (MB)
CACHE_MAX_SIZE=100
```

## Integración con Diagramas y Visualizaciones

### Para Algoritmos Iterativos

El trace se visualiza en `IterativeTraceContent`:

```typescript
// apps/web/src/components/ExecutionTraceModal.tsx

<IterativeTraceContent
  steps={trace.steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
/>
```

Características:
- Navegación paso a paso
- Visualización de variables en cada paso
- Resaltado de línea actual
- Animación de cambios

### Para Algoritmos Recursivos

El trace se visualiza en `RecursiveTraceContent`:

```typescript
// apps/web/src/components/ExecutionTraceModal.tsx

<RecursiveTraceContent
  recursionTree={trace.recursionTree}
  diagram={trace.diagram}
  steps={trace.steps}
/>
```

Características:
- Árbol de recursión interactivo (React Flow)
- Diagrama Mermaid generado por LLM
- Explicación paso a paso
- Visualización de call stack

## Manejo de Errores

### Errores de Ejecución

```typescript
{
  "success": false,
  "error": {
    "type": "execution_error",
    "message": "Runtime error: Cannot read property 'length' of undefined",
    "line": 5,
    "stack": "..."
  }
}
```

### Errores de LLM

```typescript
{
  "success": false,
  "error": {
    "type": "llm_error",
    "message": "Failed to generate diagram: API quota exceeded",
    "retryable": true
  }
}
```

### Errores de Timeout

```typescript
{
  "success": false,
  "error": {
    "type": "timeout_error",
    "message": "Execution exceeded maximum time limit (5000ms)",
    "timeElapsed": 5001
  }
}
```

## Optimizaciones

### Cache de Resultados

Los resultados de trace se cachean usando:
- Hash del código + inputs como key
- TTL configurable (default: 1 hora)
- Invalidación automática

### Límites de Recursos

Para evitar sobrecarga:
- Máximo 1000 pasos en trace iterativo
- Máxima profundidad 50 en recursión
- Timeout de 5 segundos para ejecución
- Timeout de 30 segundos para LLM

### Ejecución Asíncrona

Para traces largos:
- Se puede solicitar ejecución asíncrona
- Se retorna un job ID
- Cliente puede consultar estado con `/trace/status/:jobId`

## Ejemplos de Uso

### Ejemplo 1: Trace de Bubble Sort

```bash
curl -X POST http://localhost:3001/analyze/trace \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function bubbleSort(arr) { for (let i = 0; i < arr.length; i++) { for (let j = 0; j < arr.length - i - 1; j++) { if (arr[j] > arr[j + 1]) { let temp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = temp; } } } return arr; }",
    "language": "javascript",
    "inputs": { "arr": [5, 2, 8, 1, 9] },
    "algorithmType": "iterative"
  }'
```

### Ejemplo 2: Trace de Fibonacci

```bash
curl -X POST http://localhost:3001/analyze/trace \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function fib(n) { if (n <= 1) return n; return fib(n-1) + fib(n-2); }",
    "language": "javascript",
    "inputs": { "n": 5 },
    "algorithmType": "recursive"
  }'
```

## Referencias

- [Documentación de React Flow](../app/react-flow.md)
- [Configuración de LLM](../llm/usage-and-models.md)
- [Análisis Recursivo](./recursive-analysis.md)
