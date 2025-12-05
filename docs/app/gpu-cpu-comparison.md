# Comparativa CPU vs GPU y Sistema de Puntos

## Descripción General

El sistema de análisis CPU vs GPU evalúa si un algoritmo es más adecuado para ejecución en CPU o GPU, basándose en características del código como paralelismo, uso de memoria, complejidad de control de flujo, y patrones de acceso a datos.

## Análisis de AST con analyzeASTForGPUCPU

**Ubicación**: `packages/api/src/analyzers/gpu-cpu-analyzer.ts`

### Función Principal

```typescript
interface GPUCPUAnalysis {
  gpuScore: number;        // 0-100
  cpuScore: number;        // 0-100
  profile: 'GPU' | 'CPU' | 'Mixed';
  metrics: Metrics;
  recommendations: string[];
  explanation: string;
}

export function analyzeASTForGPUCPU(ast: AST): GPUCPUAnalysis {
  const metrics = extractMetrics(ast);
  const scores = calculateScores(metrics);
  const profile = determineProfile(scores);
  const recommendations = generateRecommendations(metrics, profile);
  const explanation = generateExplanation(metrics, scores, profile);

  return {
    gpuScore: scores.gpu,
    cpuScore: scores.cpu,
    profile,
    metrics,
    recommendations,
    explanation
  };
}
```

## Métricas Calculadas

### 1. Recursión

```typescript
interface RecursionMetrics {
  isRecursive: boolean;
  recursionDepth: number;
  tailRecursive: boolean;
}

function analyzeRecursion(ast: AST): RecursionMetrics {
  const recursiveCalls = findRecursiveCalls(ast);
  
  return {
    isRecursive: recursiveCalls.length > 0,
    recursionDepth: estimateRecursionDepth(ast),
    tailRecursive: isTailRecursive(ast)
  };
}
```

**Impacto**:
- Recursión profunda → Favorece CPU
- Tail recursion → Neutral
- No recursión → Favorece GPU

### 2. Branching (Ramificación)

```typescript
interface BranchingMetrics {
  conditionalCount: number;
  switchCount: number;
  averageBranchComplexity: number;
  divergentBranches: number;
}

function analyzeBranching(ast: AST): BranchingMetrics {
  const conditionals = findConditionals(ast);
  const switches = findSwitchStatements(ast);
  
  return {
    conditionalCount: conditionals.length,
    switchCount: switches.length,
    averageBranchComplexity: calculateBranchComplexity(conditionals),
    divergentBranches: countDivergentBranches(conditionals)
  };
}
```

**Impacto**:
- Muchos condicionales → Favorece CPU
- Condicionales simples → Neutral
- Pocos condicionales → Favorece GPU

### 3. Loops (Bucles)

```typescript
interface LoopMetrics {
  loopCount: number;
  nestedLoopDepth: number;
  parallelizableLoops: number;
  independentIterations: boolean;
  loopDependencies: number;
}

function analyzeLoops(ast: AST): LoopMetrics {
  const loops = findLoops(ast);
  
  return {
    loopCount: loops.length,
    nestedLoopDepth: calculateMaxNesting(loops),
    parallelizableLoops: countParallelizableLoops(loops),
    independentIterations: checkIterationIndependence(loops),
    loopDependencies: countDependencies(loops)
  };
}
```

**Impacto**:
- Bucles independientes → Favorece GPU
- Bucles con dependencias → Favorece CPU
- Bucles anidados simples → Favorece GPU

### 4. Arrays y Estructuras de Datos

```typescript
interface DataStructureMetrics {
  arrayOperations: number;
  arraySize: 'small' | 'medium' | 'large';
  accessPattern: 'sequential' | 'random' | 'strided';
  matrixOperations: number;
  vectorOperations: number;
  complexStructures: number;  // objetos, listas enlazadas, etc.
}

function analyzeDataStructures(ast: AST): DataStructureMetrics {
  const arrays = findArrayOperations(ast);
  
  return {
    arrayOperations: arrays.length,
    arraySize: estimateArraySize(ast),
    accessPattern: determineAccessPattern(arrays),
    matrixOperations: countMatrixOps(ast),
    vectorOperations: countVectorOps(ast),
    complexStructures: countComplexStructures(ast)
  };
}
```

**Impacto**:
- Operaciones masivas en arrays → Favorece GPU
- Acceso secuencial → Favorece GPU
- Estructuras complejas → Favorece CPU

### 5. Operaciones Matemáticas

```typescript
interface MathMetrics {
  arithmeticOps: number;
  floatingPointOps: number;
  integerOps: number;
  transcendentalOps: number;  // sin, cos, exp, etc.
  parallelMathOps: number;
}

function analyzeMathOperations(ast: AST): MathMetrics {
  const operations = findMathOperations(ast);
  
  return {
    arithmeticOps: countArithmeticOps(operations),
    floatingPointOps: countFloatingPointOps(operations),
    integerOps: countIntegerOps(operations),
    transcendentalOps: countTranscendentalOps(operations),
    parallelMathOps: countParallelizableMathOps(operations)
  };
}
```

**Impacto**:
- Muchas operaciones paralelas → Favorece GPU
- Operaciones trascendentales → Favorece GPU (si hay muchas)
- Operaciones secuenciales → Favorece CPU

### 6. Memoria y Acceso a Datos

```typescript
interface MemoryMetrics {
  memoryAccesses: number;
  cacheEfficiency: 'high' | 'medium' | 'low';
  dataReuse: number;
  memoryCoalescence: boolean;  // Accesos coalescentes
  sharedMemoryPotential: boolean;
}

function analyzeMemoryPatterns(ast: AST): MemoryMetrics {
  const accesses = findMemoryAccesses(ast);
  
  return {
    memoryAccesses: accesses.length,
    cacheEfficiency: estimateCacheEfficiency(accesses),
    dataReuse: calculateDataReuse(accesses),
    memoryCoalescence: checkCoalescence(accesses),
    sharedMemoryPotential: checkSharedMemoryPotential(ast)
  };
}
```

**Impacto**:
- Accesos coalescentes → Favorece GPU
- Alta reutilización de datos → Favorece CPU (cache)
- Accesos aleatorios → Favorece CPU

## Sistema de Scoring (0-100)

### Cálculo de GPU Score

```typescript
function calculateGPUScore(metrics: Metrics): number {
  let score = 50;  // Base score

  // Factor de paralelismo (+30 max)
  const parallelismFactor = calculateParallelismFactor(metrics);
  score += parallelismFactor * 30;

  // Factor de operaciones en arrays (+20 max)
  const arrayFactor = calculateArrayFactor(metrics);
  score += arrayFactor * 20;

  // Factor de operaciones matemáticas (+15 max)
  const mathFactor = calculateMathFactor(metrics);
  score += mathFactor * 15;

  // Penalizaciones
  
  // Recursión (-25)
  if (metrics.recursion.isRecursive && !metrics.recursion.tailRecursive) {
    score -= 25;
  }

  // Branching complejo (-20)
  if (metrics.branching.divergentBranches > 5) {
    score -= 20;
  }

  // Estructuras de datos complejas (-15)
  if (metrics.dataStructures.complexStructures > 3) {
    score -= 15;
  }

  // Dependencias en bucles (-20)
  if (metrics.loops.loopDependencies > 2) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}
```

### Cálculo de CPU Score

```typescript
function calculateCPUScore(metrics: Metrics): number {
  let score = 50;  // Base score

  // Factor de control de flujo complejo (+25 max)
  const controlFlowFactor = calculateControlFlowFactor(metrics);
  score += controlFlowFactor * 25;

  // Factor de recursión (+20 max)
  if (metrics.recursion.isRecursive) {
    score += 20;
  }

  // Factor de estructuras de datos complejas (+20 max)
  const structureFactor = calculateStructureFactor(metrics);
  score += structureFactor * 20;

  // Factor de dependencias (+15 max)
  const dependencyFactor = calculateDependencyFactor(metrics);
  score += dependencyFactor * 15;

  // Penalizaciones

  // Muchas operaciones paralelas (-30)
  if (metrics.loops.parallelizableLoops > 3) {
    score -= 30;
  }

  // Operaciones masivas en arrays (-25)
  if (metrics.dataStructures.arraySize === 'large' && 
      metrics.dataStructures.arrayOperations > 10) {
    score -= 25;
  }

  // Accesos coalescentes (-15)
  if (metrics.memory.memoryCoalescence) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}
```

## Factores que Influyen en el Score

### 1. Paralelismo

```typescript
function calculateParallelismFactor(metrics: Metrics): number {
  let factor = 0;

  // Bucles paralelizables
  if (metrics.loops.independentIterations) {
    factor += 0.4;
  }

  // Operaciones matemáticas paralelas
  const mathRatio = metrics.math.parallelMathOps / 
                    (metrics.math.arithmeticOps || 1);
  factor += mathRatio * 0.3;

  // Ausencia de dependencias
  if (metrics.loops.loopDependencies === 0) {
    factor += 0.3;
  }

  return Math.min(1, factor);
}
```

### 2. Intensidad Aritmética

```typescript
function calculateMathFactor(metrics: Metrics): number {
  const totalOps = metrics.math.arithmeticOps + 
                   metrics.math.floatingPointOps;
  
  const memoryOps = metrics.memory.memoryAccesses;
  
  // Ratio de operaciones aritméticas vs accesos a memoria
  const arithmeticIntensity = totalOps / (memoryOps || 1);
  
  // GPU favorecido cuando hay muchas operaciones por acceso a memoria
  return Math.min(1, arithmeticIntensity / 10);
}
```

### 3. Regularidad de Acceso a Memoria

```typescript
function calculateMemoryFactor(metrics: Metrics): number {
  let factor = 0;

  // Acceso secuencial favorece GPU
  if (metrics.dataStructures.accessPattern === 'sequential') {
    factor += 0.5;
  }

  // Coalescencia favorece GPU
  if (metrics.memory.memoryCoalescence) {
    factor += 0.3;
  }

  // Cache efficiency favorece CPU
  if (metrics.memory.cacheEfficiency === 'high') {
    factor -= 0.2;
  }

  return factor;
}
```

### 4. Complejidad de Control de Flujo

```typescript
function calculateControlFlowFactor(metrics: Metrics): number {
  let factor = 0;

  // Muchos condicionales favorecen CPU
  factor += Math.min(1, metrics.branching.conditionalCount / 10);

  // Branches divergentes favorecen CPU
  factor += Math.min(0.5, metrics.branching.divergentBranches / 10);

  // Recursión favorece CPU
  if (metrics.recursion.isRecursive) {
    factor += 0.5;
  }

  return Math.min(1, factor);
}
```

## Determinación de Perfil

```typescript
function determineProfile(scores: {
  gpu: number;
  cpu: number;
}): 'GPU' | 'CPU' | 'Mixed' {
  const difference = Math.abs(scores.gpu - scores.cpu);

  // Si la diferencia es menor a 20, es mixto
  if (difference < 20) {
    return 'Mixed';
  }

  // Si GPU score es significativamente mayor
  if (scores.gpu > scores.cpu) {
    return 'GPU';
  }

  // Si CPU score es significativamente mayor
  return 'CPU';
}
```

## Componente GPUCPUModal

**Ubicación**: `apps/web/src/components/GPUCPUModal.tsx`

### Estructura

```typescript
interface GPUCPUModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GPUCPUAnalysis;
}

export function GPUCPUModal({ isOpen, onClose, analysis }: GPUCPUModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="gpu-cpu-modal">
        {/* Header con perfil */}
        <div className="profile-header">
          <ProfileBadge profile={analysis.profile} />
          <h2>Análisis CPU vs GPU</h2>
        </div>

        {/* Scores */}
        <div className="scores-section">
          <ScoreBar
            label="GPU Score"
            score={analysis.gpuScore}
            color="green"
          />
          <ScoreBar
            label="CPU Score"
            score={analysis.cpuScore}
            color="blue"
          />
        </div>

        {/* Métricas */}
        <div className="metrics-section">
          <h3>Métricas Analizadas</h3>
          <MetricsDisplay metrics={analysis.metrics} />
        </div>

        {/* Explicación */}
        <div className="explanation-section">
          <h3>Explicación</h3>
          <ReactMarkdown>{analysis.explanation}</ReactMarkdown>
        </div>

        {/* Recomendaciones */}
        <div className="recommendations-section">
          <h3>Recomendaciones</h3>
          <RecommendationsList items={analysis.recommendations} />
        </div>
      </div>
    </Modal>
  );
}
```

### ScoreBar Component

```typescript
function ScoreBar({ label, score, color }: Props) {
  return (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <span className="score-value">{score}/100</span>
      </div>
      <div className="score-progress">
        <div
          className={`score-fill ${color}`}
          style={{ width: `${score}%` }}
        >
          <span className="score-text">{score}</span>
        </div>
      </div>
    </div>
  );
}
```

### MetricsDisplay Component

```typescript
function MetricsDisplay({ metrics }: Props) {
  return (
    <div className="metrics-grid">
      {/* Recursión */}
      <MetricCard
        title="Recursión"
        icon="🔄"
        items={[
          { label: 'Es recursivo', value: metrics.recursion.isRecursive ? 'Sí' : 'No' },
          { label: 'Profundidad', value: metrics.recursion.recursionDepth },
          { label: 'Tail recursive', value: metrics.recursion.tailRecursive ? 'Sí' : 'No' }
        ]}
      />

      {/* Bucles */}
      <MetricCard
        title="Bucles"
        icon="🔁"
        items={[
          { label: 'Cantidad', value: metrics.loops.loopCount },
          { label: 'Anidamiento', value: metrics.loops.nestedLoopDepth },
          { label: 'Paralelizables', value: metrics.loops.parallelizableLoops },
          { label: 'Dependencias', value: metrics.loops.loopDependencies }
        ]}
      />

      {/* Arrays */}
      <MetricCard
        title="Arrays"
        icon="📊"
        items={[
          { label: 'Operaciones', value: metrics.dataStructures.arrayOperations },
          { label: 'Tamaño', value: metrics.dataStructures.arraySize },
          { label: 'Patrón de acceso', value: metrics.dataStructures.accessPattern }
        ]}
      />

      {/* Branching */}
      <MetricCard
        title="Ramificación"
        icon="🌳"
        items={[
          { label: 'Condicionales', value: metrics.branching.conditionalCount },
          { label: 'Switches', value: metrics.branching.switchCount },
          { label: 'Branches divergentes', value: metrics.branching.divergentBranches }
        ]}
      />

      {/* Matemáticas */}
      <MetricCard
        title="Operaciones Matemáticas"
        icon="➕"
        items={[
          { label: 'Aritméticas', value: metrics.math.arithmeticOps },
          { label: 'Punto flotante', value: metrics.math.floatingPointOps },
          { label: 'Paralelas', value: metrics.math.parallelMathOps }
        ]}
      />

      {/* Memoria */}
      <MetricCard
        title="Memoria"
        icon="💾"
        items={[
          { label: 'Accesos', value: metrics.memory.memoryAccesses },
          { label: 'Eficiencia de cache', value: metrics.memory.cacheEfficiency },
          { label: 'Coalescencia', value: metrics.memory.memoryCoalescence ? 'Sí' : 'No' }
        ]}
      />
    </div>
  );
}
```

## Ejemplos de Análisis

### Ejemplo 1: Multiplicación de Matrices (GPU)

```typescript
// Código
function matrixMultiply(A, B, n) {
  const C = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

// Análisis
{
  gpuScore: 85,
  cpuScore: 45,
  profile: 'GPU',
  metrics: {
    loops: {
      parallelizableLoops: 2,  // i y j son independientes
      independentIterations: true
    },
    dataStructures: {
      arrayOperations: 12,
      arraySize: 'large',
      accessPattern: 'sequential'
    },
    math: {
      arithmeticOps: 6,
      parallelMathOps: 6
    }
  },
  recommendations: [
    'Excelente candidato para GPU',
    'Usar CUDA o OpenCL para paralelizar bucles i y j',
    'Considerar uso de memoria compartida para tiles'
  ]
}
```

### Ejemplo 2: Búsqueda Binaria (CPU)

```typescript
// Código
function binarySearch(arr, target, low, high) {
  if (low > high) return -1;
  const mid = Math.floor((low + high) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] > target) return binarySearch(arr, target, low, mid - 1);
  return binarySearch(arr, target, mid + 1, high);
}

// Análisis
{
  gpuScore: 25,
  cpuScore: 80,
  profile: 'CPU',
  metrics: {
    recursion: {
      isRecursive: true,
      recursionDepth: 'log(n)',
      tailRecursive: true
    },
    branching: {
      conditionalCount: 3,
      divergentBranches: 2
    },
    loops: {
      parallelizableLoops: 0
    }
  },
  recommendations: [
    'Mejor ejecutar en CPU',
    'La recursión y branching no son eficientes en GPU',
    'Considerar versión iterativa si se requiere GPU'
  ]
}
```

## Referencias

- [Architecture Documentation](./architecture.md)
- [AST Analysis](../api/architecture.md)
- [Complexity Analysis](../api/recursive-analysis.md)
