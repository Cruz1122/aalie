# @aa/types

**Tipos y contratos compartidos para el análisis de complejidad algorítmica**

## Propósito

El paquete `@aa/types` contiene tipos/DTOs compartidos entre web y API (interfaces de requests/responses, modelos de UI, estructuras de coste, etc.). Asegura contratos fuertes y sincronizados entre frontend y backend, evitando desajustes y "tipo-copia".

## Arquitectura

```
@aa/types
├── src/
│   └── index.ts             # Definiciones TypeScript centralizadas
├── dist/
│   ├── index.js             # Salida JavaScript
│   └── index.d.ts           # Definiciones de tipos
└── package.json
```

## Contratos principales

### API de Parse
- `ParseRequest`: Solicitud de parsing de pseudocódigo
- `ParseResponse`: Respuesta con AST y metadatos

### API de Análisis
- `AnalyzeRequest`: Solicitud de análisis de complejidad
- `AnalyzeResponse`: Respuesta con costos y casos
- `LineCost`: Estructura de costo por línea
- `CaseResult`: Resultado de análisis por caso (best/avg/worst)

### Integración LLM
- `LLMCompareRequest`: Solicitud de comparación con IA
- `LLMCompareResponse`: Respuesta con análisis comparativo

### Health Check
- `HealthResponse`: Estado del sistema

## Entradas y Salidas

### Entrada
- **Definiciones TypeScript**: Interfaces y tipos en `src/index.ts`

### Salida
- **Distribución compilada**: `dist/index.{js,d.ts}` consumible por cualquier paquete

## Quién lo usa

- **Web (Next.js)**: Para tipar llamadas API y componentes de renderizado
- **API (FastAPI)**: Para definir contratos y validación (en tooling TypeScript)

## Ejemplo de uso

```ts
import type { 
  AnalyzeResponse, 
  LineCost, 
  CaseResult 
} from "@aa/types";

// En componente React
interface Props {
  data: AnalyzeResponse;
  onAnalyze: (lines: LineCost[]) => void;
}

// En llamada API
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify(request satisfies AnalyzeRequest)
});
const result: AnalyzeResponse = await response.json();
```

## Notas importantes

- **Source of truth**: Este paquete es la fuente de verdad de todos los contratos
- **Versionado crítico**: Cambiar tipos aquí implica versionar y alinear web/API
- **Tipado fuerte**: Todos los intercambios de datos deben estar tipados
- **Consistencia**: Mantiene sincronización entre frontend y backend

## Scripts de construcción

```bash
# Compilar tipos
pnpm run build

# Limpiar distribución
pnpm run clean
```

## Instalación

```bash
# Como dependencia en otros paquetes
{
  "dependencies": {
    "@aa/types": "workspace:*"
  }
}