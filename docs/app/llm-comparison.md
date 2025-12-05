# Comparación con LLM

## Descripción General

El sistema de comparación con LLM permite contrastar el análisis de complejidad realizado por el sistema propio con el análisis generado por un modelo de lenguaje grande (Gemini). Esto proporciona una segunda opinión y ayuda a validar los resultados.

## Componente Principal

### ComparisonModal

**Ubicación**: `apps/web/src/components/ComparisonModal.tsx`

Modal que muestra la comparación lado a lado entre el análisis del sistema y el análisis del LLM.

**Props**:
```typescript
interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemAnalysis: AnalysisResult;
  code: string;
  language: string;
}
```

**Estructura del Modal**:
```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <div className="comparison-container">
    {/* Header */}
    <div className="comparison-header">
      <h2>Comparación de Análisis</h2>
      <button onClick={handleRegenerate}>Regenerar</button>
    </div>

    {/* Comparison Grid */}
    <div className="comparison-grid">
      {/* Sistema */}
      <div className="analysis-column system">
        <h3>Análisis del Sistema</h3>
        <AnalysisDisplay data={systemAnalysis} />
      </div>

      {/* LLM */}
      <div className="analysis-column llm">
        <h3>Análisis de Gemini</h3>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <AnalysisDisplay data={llmAnalysis} />
        )}
      </div>
    </div>

    {/* Differences */}
    <div className="differences-section">
      <h3>Diferencias Detectadas</h3>
      <DifferencesList differences={differences} />
    </div>
  </div>
</Modal>
```

## Endpoint `/api/llm/compare`

### URL
```
POST /api/llm/compare
```

### Request

```typescript
interface CompareRequest {
  code: string;
  language: string;
  systemAnalysis: {
    timeComplexity: string;
    spaceComplexity: string;
    explanation: string;
    steps: Step[];
  };
}
```

### Ejemplo de Request

```json
{
  "code": "function bubbleSort(arr) { ... }",
  "language": "javascript",
  "systemAnalysis": {
    "timeComplexity": "O(n²)",
    "spaceComplexity": "O(1)",
    "explanation": "Dos bucles anidados...",
    "steps": [...]
  }
}
```

### Response

```typescript
interface CompareResponse {
  success: boolean;
  llmAnalysis: {
    timeComplexity: string;
    spaceComplexity: string;
    explanation: string;
    reasoning: string;
  };
  comparison: {
    timeComplexityMatch: boolean;
    spaceComplexityMatch: boolean;
    differences: Difference[];
    confidence: number;  // 0-100
  };
  metadata: {
    model: string;
    tokensUsed: number;
    estimatedCost: number;
    executionTime: number;
  };
}
```

### Ejemplo de Response

```json
{
  "success": true,
  "llmAnalysis": {
    "timeComplexity": "O(n²)",
    "spaceComplexity": "O(1)",
    "explanation": "El algoritmo Bubble Sort utiliza dos bucles anidados para comparar elementos adyacentes...",
    "reasoning": "Análisis detallado:\n1. Bucle externo: n iteraciones\n2. Bucle interno: n-i iteraciones\n3. Total: n(n-1)/2 comparaciones\n4. Complejidad: O(n²)"
  },
  "comparison": {
    "timeComplexityMatch": true,
    "spaceComplexityMatch": true,
    "differences": [],
    "confidence": 95
  },
  "metadata": {
    "model": "gemini-1.5-flash",
    "tokensUsed": 850,
    "estimatedCost": 0.00085,
    "executionTime": 1850
  }
}
```

## Flujo de Comparación

### 1. Extracción de Datos Core

Antes de enviar al LLM, se extraen los datos esenciales del análisis del sistema:

```typescript
function extractCoreData(systemAnalysis: AnalysisResult) {
  return {
    timeComplexity: systemAnalysis.complexity.time,
    spaceComplexity: systemAnalysis.complexity.space,
    explanation: systemAnalysis.explanation,
    steps: systemAnalysis.steps.map(step => ({
      description: step.description,
      complexity: step.complexity
    }))
  };
}
```

### 2. Preparación del Prompt

```typescript
const prompt = `
Analiza la complejidad temporal y espacial del siguiente código.

Código:
\`\`\`${language}
${code}
\`\`\`

Análisis del sistema:
- Complejidad temporal: ${systemAnalysis.timeComplexity}
- Complejidad espacial: ${systemAnalysis.spaceComplexity}
- Explicación: ${systemAnalysis.explanation}

Proporciona:
1. Tu análisis de complejidad temporal
2. Tu análisis de complejidad espacial
3. Explicación detallada de tu razonamiento
4. Comparación con el análisis del sistema (¿estás de acuerdo? ¿por qué?)

Formato de respuesta:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "explanation": "...",
  "reasoning": "...",
  "agreementWithSystem": true/false,
  "differences": ["..."]
}
`;
```

### 3. Llamada al LLM

```typescript
const response = await fetch('/api/llm/compare', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey  // API key del usuario
  },
  body: JSON.stringify({
    code,
    language,
    systemAnalysis: extractCoreData(systemAnalysis)
  })
});
```

### 4. Procesamiento de Respuesta

```typescript
const { llmAnalysis, comparison } = await response.json();

// Detectar diferencias
const differences = detectDifferences(systemAnalysis, llmAnalysis);

// Calcular nivel de confianza
const confidence = calculateConfidence(comparison);

// Actualizar estado
setComparisonResult({
  llmAnalysis,
  differences,
  confidence
});
```

## Detección de Diferencias

### Tipos de Diferencias

```typescript
type DifferenceType = 
  | 'time_complexity'
  | 'space_complexity'
  | 'explanation'
  | 'methodology';

interface Difference {
  type: DifferenceType;
  systemValue: string;
  llmValue: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}
```

### Algoritmo de Detección

```typescript
function detectDifferences(
  system: AnalysisResult,
  llm: LLMAnalysis
): Difference[] {
  const differences: Difference[] = [];

  // Comparar complejidad temporal
  if (normalizeComplexity(system.timeComplexity) !== 
      normalizeComplexity(llm.timeComplexity)) {
    differences.push({
      type: 'time_complexity',
      systemValue: system.timeComplexity,
      llmValue: llm.timeComplexity,
      severity: 'high',
      description: 'Discrepancia en complejidad temporal'
    });
  }

  // Comparar complejidad espacial
  if (normalizeComplexity(system.spaceComplexity) !== 
      normalizeComplexity(llm.spaceComplexity)) {
    differences.push({
      type: 'space_complexity',
      systemValue: system.spaceComplexity,
      llmValue: llm.spaceComplexity,
      severity: 'medium',
      description: 'Discrepancia en complejidad espacial'
    });
  }

  return differences;
}
```

### Normalización de Complejidades

Para comparar correctamente, se normalizan las notaciones:

```typescript
function normalizeComplexity(complexity: string): string {
  // Remover espacios
  let normalized = complexity.replace(/\s+/g, '');
  
  // Convertir a minúsculas
  normalized = normalized.toLowerCase();
  
  // Estandarizar notación
  normalized = normalized
    .replace(/o\(/gi, 'O(')
    .replace(/θ\(/gi, 'Θ(')
    .replace(/ω\(/gi, 'Ω(');
  
  // Simplificar expresiones equivalentes
  const equivalences: Record<string, string> = {
    'O(n*n)': 'O(n²)',
    'O(n^2)': 'O(n²)',
    'O(nlogn)': 'O(n log n)',
    'O(log(n))': 'O(log n)'
  };
  
  return equivalences[normalized] || normalized;
}
```

## Visualización de Resultados

### AnalysisDisplay Component

```typescript
function AnalysisDisplay({ data, source }: Props) {
  return (
    <div className={`analysis-display ${source}`}>
      {/* Complejidad Temporal */}
      <div className="complexity-item">
        <label>Complejidad Temporal:</label>
        <span className="complexity-value">{data.timeComplexity}</span>
      </div>

      {/* Complejidad Espacial */}
      <div className="complexity-item">
        <label>Complejidad Espacial:</label>
        <span className="complexity-value">{data.spaceComplexity}</span>
      </div>

      {/* Explicación */}
      <div className="explanation">
        <label>Explicación:</label>
        <ReactMarkdown>{data.explanation}</ReactMarkdown>
      </div>

      {/* Razonamiento (solo LLM) */}
      {data.reasoning && (
        <div className="reasoning">
          <label>Razonamiento:</label>
          <ReactMarkdown>{data.reasoning}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
```

### DifferencesList Component

```typescript
function DifferencesList({ differences }: Props) {
  if (differences.length === 0) {
    return (
      <div className="no-differences">
        ✅ Los análisis coinciden completamente
      </div>
    );
  }

  return (
    <div className="differences-list">
      {differences.map((diff, index) => (
        <div key={index} className={`difference ${diff.severity}`}>
          <div className="difference-header">
            <span className="difference-type">{diff.type}</span>
            <span className="difference-severity">{diff.severity}</span>
          </div>
          <div className="difference-description">
            {diff.description}
          </div>
          <div className="difference-values">
            <div className="value-item system">
              <label>Sistema:</label>
              <code>{diff.systemValue}</code>
            </div>
            <div className="value-item llm">
              <label>Gemini:</label>
              <code>{diff.llmValue}</code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Nivel de Confianza

El nivel de confianza se calcula basándose en:

```typescript
function calculateConfidence(comparison: Comparison): number {
  let confidence = 100;

  // Penalizar por diferencias
  comparison.differences.forEach(diff => {
    switch (diff.severity) {
      case 'high':
        confidence -= 30;
        break;
      case 'medium':
        confidence -= 15;
        break;
      case 'low':
        confidence -= 5;
        break;
    }
  });

  // Ajustar por coincidencias
  if (comparison.timeComplexityMatch) confidence += 10;
  if (comparison.spaceComplexityMatch) confidence += 5;

  return Math.max(0, Math.min(100, confidence));
}
```

## Manejo de Errores

### Error de API Key

```typescript
if (!apiKey) {
  return (
    <div className="error-message">
      ⚠️ Se requiere una API key de Gemini para usar esta función.
      <button onClick={openApiKeySettings}>
        Configurar API Key
      </button>
    </div>
  );
}
```

### Error de LLM

```typescript
try {
  const response = await fetch('/api/llm/compare', ...);
  if (!response.ok) {
    throw new Error('Error en la comparación');
  }
} catch (error) {
  setError({
    message: 'No se pudo completar la comparación con el LLM',
    retryable: true
  });
}
```

### Timeout

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/llm/compare', {
    signal: controller.signal,
    ...
  });
} catch (error) {
  if (error.name === 'AbortError') {
    setError({
      message: 'La comparación tomó demasiado tiempo',
      retryable: true
    });
  }
} finally {
  clearTimeout(timeoutId);
}
```

## Regeneración de Comparación

El usuario puede regenerar la comparación para obtener una nueva opinión:

```typescript
const handleRegenerate = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/llm/compare', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        systemAnalysis,
        regenerate: true  // Flag para forzar nueva generación
      })
    });

    const data = await response.json();
    setComparisonResult(data);
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
};
```

## Costos y Optimización

### Estimación de Costos

```typescript
function estimateCost(code: string, systemAnalysis: AnalysisResult): number {
  const inputTokens = estimateTokens(code + JSON.stringify(systemAnalysis));
  const outputTokens = 500;  // Estimado
  
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.30;
  
  return inputCost + outputCost;
}
```

### Cache de Resultados

Para evitar costos innecesarios:

```typescript
const cacheKey = `compare_${hashCode(code)}_${hashCode(systemAnalysis)}`;
const cached = localStorage.getItem(cacheKey);

if (cached && !regenerate) {
  return JSON.parse(cached);
}

// ... hacer llamada al LLM ...

localStorage.setItem(cacheKey, JSON.stringify(result));
```

## Integración con useApiKey

```typescript
import { useApiKey } from '@/hooks/useApiKey';

function ComparisonModal({ ... }: Props) {
  const { apiKey, isValid } = useApiKey();

  if (!isValid) {
    return <ApiKeyRequired />;
  }

  // ... resto del componente
}
```

## Referencias

- [API Key Configuration](./api-key-configuration.md)
- [LLM Usage and Models](../llm/usage-and-models.md)
- [API Integration](./api-integration.md)
