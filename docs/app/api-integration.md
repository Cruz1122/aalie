# Integración con API

Documentación de cómo la aplicación web se integra con el backend API.

## Configuración

### Base URL

La URL base de la API se configura mediante variable de entorno:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Uso:**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
```

## Endpoints Utilizados

### Parseo

**Endpoint:** `POST /grammar/parse`

**Uso:**

```typescript
const response = await fetch(`${API_BASE_URL}/grammar/parse`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: code })
});

const data = await response.json() as ParseResponse;
```

**Ubicación:** 
- Web Worker: `workers/parse.worker.ts`
- Componente: `components/AnalyzerEditor.tsx`

### Análisis

**Endpoint:** `POST /analyze/open`

**Uso:**

```typescript
const response = await fetch(`${API_BASE_URL}/analyze/open`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: code,
    mode: 'all',
    algorithm_kind: kind,
    preferred_method: method
  })
});

const data = await response.json() as AnalyzeAllResponse;
```

**Ubicación:**
- `apps/web/src/app/page.tsx` (análisis desde chat)
- `apps/web/src/app/analyzer/page.tsx` (re-análisis)

### Clasificación

**Endpoint:** `POST /classify`

**Uso:**

```typescript
const response = await fetch('/api/llm/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: code, mode: 'local' })
});

const data = await response.json() as ClassifyResponse;
```

**Nota:** Se usa proxy `/api/llm/classify` que llama al backend.

**Ubicación:**
- `apps/web/src/app/api/llm/classify/route.ts`
- `apps/web/src/app/page.tsx`

### Detección de Métodos

**Endpoint:** `POST /analyze/detect-methods`

**Uso:**

```typescript
const response = await fetch(`${API_BASE_URL}/analyze/detect-methods`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: code, algorithm_kind: kind })
});

const data = await response.json() as DetectMethodsResponse;
```

**Ubicación:**
- `apps/web/src/app/page.tsx`

## Proxies Next.js

### `/api/llm/classify`

Proxy al endpoint de clasificación del backend.

**Ubicación:** `apps/web/src/app/api/llm/classify/route.ts`

**Función:**
- Agrega API key si está disponible
- Maneja errores
- Retorna respuesta formateada

### `/api/grammar/parse`

Proxy al endpoint de parseo (si se usa).

## Manejo de Errores

### Errores de Red

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    // Error de red
    console.error('No se pudo conectar al servidor');
  }
  throw error;
}
```

### Errores de API

```typescript
const data = await response.json();
if (!data.ok) {
  // Mostrar errores al usuario
  data.errors.forEach(error => {
    console.error(`Error: ${error.message}`);
  });
  return null;
}
return data;
```

## Progreso de Análisis

### useAnalysisProgress

Hook para animar progreso durante análisis:

```typescript
const { animateProgress } = useAnalysisProgress();

await animateProgress(
  0,              // Inicio
  20,             // Fin
  800,            // Duración (ms)
  setProgress,    // Setter
  parsePromise    // Promise
);
```

**Ubicación:** `hooks/useAnalysisProgress.ts`

## Caché y Persistencia

### sessionStorage

Resultados del análisis se guardan en sessionStorage:

```typescript
sessionStorage.setItem('analyzerCode', sourceCode);
sessionStorage.setItem('analyzerResults', JSON.stringify(results));
```

**Uso en `/analyzer`:**
```typescript
const code = sessionStorage.getItem('analyzerCode');
const results = JSON.parse(sessionStorage.getItem('analyzerResults') || '{}');
```

## Web Workers

### Parse Worker

Parsea código en background:

```typescript
// workers/parse.worker.ts
self.onmessage = async (e) => {
  const { source } = e.data;
  const response = await fetch(`${API_BASE_URL}/grammar/parse`, {
    method: 'POST',
    body: JSON.stringify({ source })
  });
  const data = await response.json();
  self.postMessage(data);
};
```

**Uso:**

```typescript
const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url));
worker.postMessage({ source: code });
worker.onmessage = (e) => {
  const { ast, errors } = e.data;
  // ...
};
```

## Tipos TypeScript

Los tipos se comparten con el backend a través de `@aa/types`:

```typescript
import type { 
  ParseResponse, 
  AnalyzeOpenResponse,
  AnalyzeAllResponse,
  ClassifyResponse 
} from '@aa/types';
```

**Ubicación:** `packages/types/src/index.ts`

## Autenticación

### API Key

La API key se almacena en localStorage y se envía cuando está disponible:

```typescript
const apiKey = getApiKey();
if (apiKey) {
  body.api_key = apiKey;
}
```

**Hook:** `useApiKey`

## Optimizaciones

### Debouncing

El parseo en tiempo real usa debouncing:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    parseCode(code);
  }, 500);
  return () => clearTimeout(timer);
}, [code]);
```

### Request Cancellation

Se pueden cancelar requests con AbortController:

```typescript
const controller = new AbortController();
fetch(url, { signal: controller.signal });
// Cancelar: controller.abort();
```

## Ejemplo Completo

```typescript
async function analyzeCode(source: string) {
  // 1. Parsear
  const parseRes = await fetch(`${API_BASE_URL}/grammar/parse`, {
    method: 'POST',
    body: JSON.stringify({ source })
  });
  const parseData = await parseRes.json() as ParseResponse;
  
  if (!parseData.ok) {
    throw new Error('Error de parseo');
  }
  
  // 2. Clasificar
  const classifyRes = await fetch('/api/llm/classify', {
    method: 'POST',
    body: JSON.stringify({ source })
  });
  const classifyData = await classifyRes.json() as ClassifyResponse;
  
  // 3. Analizar
  const analyzeRes = await fetch(`${API_BASE_URL}/analyze/open`, {
    method: 'POST',
    body: JSON.stringify({
      source,
      mode: 'all',
      algorithm_kind: classifyData.kind
    })
  });
  const analyzeData = await analyzeRes.json() as AnalyzeAllResponse;
  
  // 4. Guardar resultados
  sessionStorage.setItem('analyzerCode', source);
  sessionStorage.setItem('analyzerResults', JSON.stringify(analyzeData));
  
  return analyzeData;
}
```

