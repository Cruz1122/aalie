# Manejo de Errores

Documentación completa sobre códigos de error, formatos y estrategias de manejo en la API.

## Formato de Errores

Todos los errores siguen un formato consistente:

```json
{
  "ok": false,
  "errors": [
    {
      "message": "Descripción del error",
      "line": 5,
      "column": 10
    }
  ]
}
```

### Campos del Error

- `message` (string, requerido): Descripción legible del error
- `line` (number | null, opcional): Número de línea donde ocurrió el error (1-indexed)
- `column` (number | null, opcional): Número de columna donde ocurrió el error (1-indexed)

## Tipos de Errores

### Errores de Parseo

Ocurren cuando el código fuente no puede ser parseado correctamente.

**Ejemplo:**

```json
{
  "ok": false,
  "available": true,
  "runtime": "python",
  "error": "unexpected token 'factorial'",
  "ast": null,
  "errors": [
    {
      "line": 1,
      "column": 1,
      "message": "unexpected token 'factorial'"
    }
  ]
}
```

**Errores comunes:**

- `"unexpected token 'X'"`: Token inesperado en la posición indicada
- `"missing BEGIN or END"`: Falta un bloque BEGIN...END
- `"missing semicolon"`: Falta punto y coma al final de una sentencia
- `"unexpected end of input"`: El código termina inesperadamente
- `"mismatched input 'X' expecting 'Y'"`: Token incorrecto, se esperaba otro

### Errores de Análisis

Ocurren durante el análisis de complejidad.

**Ejemplo:**

```json
{
  "ok": false,
  "errors": [
    {
      "message": "No se pudo obtener el AST del código",
      "line": null,
      "column": null
    }
  ]
}
```

**Errores comunes:**

- `"No se pudo obtener el AST del código"`: El parseo falló antes del análisis
- `"Error en análisis: [descripción]"`: Error genérico durante el análisis
- `"Este endpoint solo es para algoritmos recursivos"`: Se intentó usar un endpoint de recursión con algoritmo no recursivo
- `"Error detectando métodos: [descripción]"`: Error al detectar métodos aplicables

### Errores de Clasificación

Ocurren durante la clasificación de algoritmos.

**Ejemplo:**

```json
{
  "ok": false,
  "errors": [
    {
      "message": "Se requiere 'source' o 'ast' en el payload"
    }
  ]
}
```

**Errores comunes:**

- `"Se requiere 'source' o 'ast' en el payload"`: Falta el código fuente o AST
- `"El campo 'source' debe ser una cadena de texto"`: Tipo incorrecto
- `"No se pudo obtener el AST del código"`: El parseo falló

### Errores del Servidor

Errores internos del servidor (500).

**Ejemplo:**

```json
{
  "ok": false,
  "errors": [
    {
      "message": "Error en análisis: division by zero",
      "line": null,
      "column": null
    }
  ]
}
```

## Códigos de Estado HTTP

### 200 OK

La petición fue exitosa. Esto **no significa** que no haya errores de parseo o análisis. Verificar el campo `ok` en la respuesta.

**Ejemplo con errores:**

```json
{
  "ok": false,
  "errors": [...]
}
```

### 400 Bad Request

La petición es inválida (formato incorrecto, campos faltantes, etc.).

### 500 Internal Server Error

Error interno del servidor. Puede incluir detalles en el campo `errors`.

## Estrategias de Manejo

### En el Frontend

1. **Verificar `ok`**: Siempre verificar el campo `ok` antes de procesar datos
2. **Mostrar errores**: Mostrar mensajes de error al usuario de forma clara
3. **Errores de línea**: Si hay `line` y `column`, resaltar en el editor
4. **Fallback**: Tener estrategias de fallback para errores no críticos

**Ejemplo TypeScript:**

```typescript
async function analyzeCode(source: string) {
  const response = await fetch('/api/analyze/open', {
    method: 'POST',
    body: JSON.stringify({ source, mode: 'worst' })
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    // Manejar errores
    data.errors.forEach(error => {
      console.error(`Error en línea ${error.line}: ${error.message}`);
    });
    return null;
  }
  
  return data;
}
```

### Errores de Parseo

Los errores de parseo siempre incluyen `line` y `column`. Usar estos valores para:

- Resaltar la línea en el editor
- Mostrar mensaje de error cerca del código
- Sugerir correcciones

### Errores de Análisis

Los errores de análisis pueden no tener `line` y `column` si son errores generales. Mostrar mensaje genérico al usuario.

### Errores de Red

Manejar errores de red por separado:

```typescript
try {
  const response = await fetch('/api/analyze/open', ...);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  // ...
} catch (error) {
  if (error instanceof TypeError) {
    // Error de red
    console.error('No se pudo conectar al servidor');
  } else {
    // Otro error
    console.error(error);
  }
}
```

## Casos Especiales

### Parseo Exitoso con Advertencias

El parseo puede ser exitoso (`ok: true`) pero incluir advertencias. Estas no están en el formato de errores estándar, pero pueden aparecer en logs.

### Análisis Parcial

En algunos casos, el análisis puede completarse parcialmente. Por ejemplo, si `mode="all"` y el caso promedio falla, worst y best pueden estar disponibles:

```json
{
  "ok": true,
  "has_case_variability": true,
  "worst": { ... },
  "best": { ... },
  "avg": null  // Falló, pero worst y best están disponibles
}
```

### Errores de Métodos Recursivos

Si un método recursivo no es aplicable, puede retornarse un error específico o simplemente no incluirse en `applicable_methods`.

## Mejores Prácticas

1. **Validación en el Cliente**: Validar formato básico antes de enviar al servidor
2. **Mensajes Claros**: Mostrar mensajes de error claros y accionables
3. **Recuperación**: Permitir al usuario corregir errores fácilmente
4. **Logging**: Registrar errores para debugging (sin información sensible)
5. **Fallback**: Tener estrategias de fallback para errores no críticos

## Debugging

Para debugging, revisar:

1. **Logs del servidor**: Errores completos en logs del backend
2. **Network tab**: Ver request/response completos en DevTools
3. **Console**: Errores de JavaScript en el frontend
4. **Errores de parseo**: Verificar sintaxis del código fuente

## Ejemplos de Manejo

### Manejo Básico

```typescript
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.errors[0]?.message || 'Error desconocido');
}
```

### Manejo con Ubicación

```typescript
if (!response.ok) {
  const error = await response.json();
  error.errors.forEach(err => {
    if (err.line && err.column) {
      editor.setPosition({ line: err.line - 1, column: err.column - 1 });
      editor.revealLineInCenter(err.line);
    }
  });
}
```

### Manejo con Retry

```typescript
async function analyzeWithRetry(source: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await analyzeCode(source);
      if (result?.ok) return result;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

