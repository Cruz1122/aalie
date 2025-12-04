# Cambios Implementados: Manejo Diferenciado de Algoritmos Recursivos

## Resumen

Se implementó una diferenciación clara entre el manejo de algoritmos iterativos vs recursivos/híbridos:

- **Iterativos**: Mantienen el comportamiento actual con trace paso a paso completo y controles de reproducción
- **Recursivos/Híbridos**: Muestran diagrama de recursión generado por LLM sin trace detallado

## Cambios en Backend

### 1. `apps/api/app/modules/execution/executor.py`

**Añadido:**
- Excepción `MaxRecursionDepthExceeded` para control de límites
- Control de profundidad recursiva con límite de 100 niveles (configurable)
- Pila de llamadas (`call_stack`) para gestionar frames recursivos
- Gestión robusta de parámetros y valores de retorno en recursión
- Invocación recursiva real con propagación correcta de valores

**Parámetros nuevos:**
- `max_recursion_depth`: límite de profundidad (default: 100)

**Metadatos en resultado:**
- `recursion_truncated`: flag si se alcanzó el límite
- `max_depth_reached`: profundidad máxima alcanzada

### 2. `apps/api/app/modules/execution/trace_builder.py`

**Añadido:**
- Flag `build_detailed_trace` (default: True)
- Cuando es False, no construye pasos detallados (para recursivos/híbridos)

**Propósito:**
- Evitar construcción de trace innecesario para algoritmos recursivos
- Mantener compatibilidad con algoritmos iterativos

### 3. `apps/api/app/modules/analysis/router.py`

**Endpoint `/trace` modificado:**
- Detecta tipo de algoritmo (`recursive`, `hybrid`, `iterative`)
- Para **recursivos/híbridos**: devuelve solo metadatos sin trace
- Para **iterativos**: devuelve trace completo como siempre

**Respuesta para recursivos/híbridos:**
```json
{
  "ok": true,
  "algorithmKind": "recursive",
  "trace": null,
  "metadata": {
    "pseudocode": "...",
    "inputSize": 5,
    "case": "worst",
    "message": "Para algoritmos recursivos e híbridos, el diagrama se genera en el frontend mediante LLM"
  }
}
```

## Cambios en Frontend

### 4. `apps/web/src/components/RecursionTreeView.tsx` (NUEVO)

Componente dedicado para mostrar diagramas de recursión:

**Funcionalidad:**
- Llama al endpoint `/api/llm/recursion-diagram` con el pseudocódigo
- Muestra diagrama Mermaid generado por LLM
- Muestra explicación textual del proceso recursivo
- Botón para regenerar diagrama

**Props:**
- `pseudocode`: código del algoritmo
- `algorithmKind`: tipo ("recursive" o "hybrid")
- `calls`, `rootCalls`: (no utilizados en esta implementación)

### 5. `apps/web/src/components/ExecutionTraceModal.tsx`

**Cambios:**
- Badge visual indicando tipo de algoritmo (Iterativo/Recursivo/Híbrido)
- Render condicional según `shouldShowRecursionView`
- Para **recursivos/híbridos**:
  - Muestra `RecursionTreeView` en columna central
  - Oculta controles de paso a paso (play, pausa, siguiente, anterior)
  - Oculta columna de diagrama de flujo
- Para **iterativos**:
  - Mantiene comportamiento actual completo
  - Controles de reproducción
  - Tabla de estados
  - Diagrama de flujo

### 6. `apps/web/src/app/api/llm/recursion-diagram/route.ts` (NUEVO)

Endpoint API para generar diagramas de recursión:

**Entrada:**
```json
{
  "pseudocode": "...",
  "kind": "recursive",
  "depth_limit": 10,
  "hints": {
    "params": ["n", "l", "r"]
  }
}
```

**Salida:**
```json
{
  "ok": true,
  "diagram": "```mermaid\ngraph TD\n...\n```",
  "explanation": "El algoritmo funciona..."
}
```

**Características:**
- Usa Gemini (`gemini-2.5-flash`)
- Genera diagrama Mermaid válido
- Limita profundidad visual (default: 10 niveles)
- Proporciona explicación clara del proceso

## Flujo de Ejecución

### Para Algoritmos Iterativos:
1. Usuario abre modal de ejecución
2. Backend genera trace completo con pasos
3. Frontend muestra controles de reproducción
4. Usuario navega paso a paso
5. Diagrama de flujo se genera (como antes)

### Para Algoritmos Recursivos/Híbridos:
1. Usuario abre modal de ejecución
2. Backend detecta tipo recursivo, NO genera trace
3. Frontend llama a `/api/llm/recursion-diagram`
4. LLM genera diagrama Mermaid + explicación
5. Frontend muestra solo diagrama, sin controles de step-by-step

## Configuración

### Backend
No requiere configuración adicional. El límite de profundidad se puede ajustar:

```python
executor = CodeExecutor(
    ast, 
    input_size, 
    case,
    max_recursion_depth=100  # Ajustable
)
```

### Frontend
Requiere variable de entorno `GEMINI_API_KEY` configurada (ya existente).

## Ventajas de esta Implementación

1. **Eficiencia**: No construye trace innecesario para recursivos
2. **UX Clara**: Visualización diferenciada según tipo de algoritmo
3. **Escalabilidad**: Límite de profundidad evita sobrecarga
4. **Separación de Responsabilidades**: Backend solo ejecuta, frontend genera visualización
5. **Flexibilidad**: LLM adapta el diagrama al algoritmo específico

## Limitaciones y Mejoras Futuras

### Actuales:
- Diagrama depende de calidad del LLM
- No hay trace paso a paso para recursivos (intencional)
- Límite de profundidad fijo en backend

### Posibles Mejoras:
- Cache de diagramas generados
- Editor visual de diagramas
- Animación de llamadas recursivas
- Comparación lado a lado recursivo vs iterativo
