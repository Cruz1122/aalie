# Endpoints de la API

Documentación completa de todos los endpoints REST disponibles en la API.

## Health Check

### `GET /health`

Verifica el estado del servidor.

**Respuesta:**

```json
{
  "status": "ok"
}
```

**Códigos de estado:**
- `200 OK`: Servidor funcionando correctamente

---

## Parseo de Código

### `POST /grammar/parse`

Parsea código fuente en pseudocódigo y devuelve el AST (Abstract Syntax Tree) o errores de sintaxis.

**Request Body:**

```json
{
  "source": "factorial(n) BEGIN\n  RETURN 1;\nEND"
}
```

O alternativamente:

```json
{
  "input": "factorial(n) BEGIN\n  RETURN 1;\nEND"
}
```

**Respuesta Exitosa:**

```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": {
    "type": "Program",
    "procedures": [
      {
        "name": "factorial",
        "parameters": [
          {
            "name": "n",
            "type": "scalar"
          }
        ],
        "body": {
          "statements": [
            {
              "type": "Return",
              "value": {
                "type": "Number",
                "value": 1
              }
            }
          ]
        }
      }
    ]
  },
  "errors": []
}
```

**Respuesta con Errores:**

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

**Códigos de estado:**
- `200 OK`: Parseo completado (puede tener errores)
- `500 Internal Server Error`: Error del servidor

---

## Análisis de Complejidad

### `POST /analyze/open`

Analiza un algoritmo y devuelve el análisis de complejidad temporal (forma abierta T(n)).

**Request Body:**

```json
{
  "source": "factorial(n) BEGIN\n  resultado <- 1;\n  FOR i <- 2 TO n DO BEGIN\n    resultado <- resultado * i;\n  END\n  RETURN resultado;\nEND",
  "mode": "worst"
}
```

**Parámetros:**

- `source` (string, requerido): Código fuente en pseudocódigo
- `mode` (string, opcional): Modo de análisis - `"worst"`, `"best"`, `"avg"`, o `"all"` (por defecto: `"worst"`)
- `algorithm_kind` (string, opcional): Tipo de algoritmo - `"iterative"`, `"recursive"`, `"hybrid"`, `"unknown"` (se detecta automáticamente si no se proporciona)
- `preferred_method` (string, opcional): Método preferido para recursivos - `"master"`, `"iteration"`, `"recursion_tree"`, `"characteristic_equation"` (solo para algoritmos recursivos)
- `api_key` (string, opcional): API key para servicios externos (Gemini/OpenAI)
- `avgModel` (object, opcional): Configuración del modelo probabilístico para caso promedio
  - `mode` (string): `"uniform"` o `"symbolic"`
  - `predicates` (object, opcional): Predicados con probabilidades, ej: `{"A[j] > A[j+1]": "1/2"}`

**Respuesta Exitosa (mode="worst" o "best"):**

```json
{
  "ok": true,
  "byLine": [
    {
      "line": 1,
      "kind": "assign",
      "ck": "1",
      "count": "1",
      "count_raw": "1",
      "note": null
    },
    {
      "line": 2,
      "kind": "for",
      "ck": "1",
      "count": "n - 1",
      "count_raw": "sum_{i=2}^{n} 1",
      "note": null
    }
  ],
  "totals": {
    "T_open": "1 + (n - 1)",
    "procedure": [
      {
        "step": 1,
        "description": "Sumar costos por línea",
        "formula": "T(n) = 1 + sum_{i=2}^{n} 1"
      },
      {
        "step": 2,
        "description": "Simplificar sumatoria",
        "formula": "T(n) = 1 + (n - 1)"
      }
    ]
  }
}
```

**Respuesta Exitosa (mode="all"):**

```json
{
  "ok": true,
  "has_case_variability": false,
  "worst": {
    "ok": true,
    "byLine": [...],
    "totals": {
      "T_open": "1 + (n - 1)",
      "procedure": [...]
    }
  },
  "best": "same_as_worst",
  "avg": "same_as_worst"
}
```

O si hay variabilidad:

```json
{
  "ok": true,
  "has_case_variability": true,
  "worst": { ... },
  "best": { ... },
  "avg": { ... }
}
```

**Códigos de estado:**
- `200 OK`: Análisis completado
- `400 Bad Request`: Error en el request
- `500 Internal Server Error`: Error del servidor

---

### `POST /analyze/detect-methods`

Detecta qué métodos de análisis son aplicables para un algoritmo recursivo sin ejecutar el análisis completo.

**Request Body:**

```json
{
  "source": "fibonacci(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN n;\n  END\n  RETURN fibonacci(n-1) + fibonacci(n-2);\nEND",
  "algorithm_kind": "recursive"
}
```

**Respuesta Exitosa:**

```json
{
  "ok": true,
  "applicable_methods": [
    "characteristic_equation",
    "iteration",
    "recursion_tree"
  ],
  "default_method": "characteristic_equation",
  "recurrence_info": {
    "form": "T(n) = T(n-1) + T(n-2) + 1",
    "type": "linear_shift",
    "order": 2
  }
}
```

**Códigos de estado:**
- `200 OK`: Detección completada
- `400 Bad Request`: Error en el request o algoritmo no recursivo
- `500 Internal Server Error`: Error del servidor

---

## Clasificación de Algoritmos

### `POST /classify`

Clasifica un algoritmo como iterative, recursive, hybrid o unknown.

**Request Body:**

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  RETURN n * factorial(n-1);\nEND"
}
```

O alternativamente con AST ya parseado:

```json
{
  "ast": {
    "type": "Program",
    "procedures": [...]
  }
}
```

**Respuesta Exitosa:**

```json
{
  "ok": true,
  "kind": "recursive",
  "method": "ast"
}
```

**Valores posibles de `kind`:**
- `"iterative"`: Algoritmo puramente iterativo
- `"recursive"`: Algoritmo puramente recursivo
- `"hybrid"`: Algoritmo que combina iteración y recursión
- `"unknown"`: No se pudo determinar o algoritmo muy simple

**Códigos de estado:**
- `200 OK`: Clasificación completada
- `400 Bad Request`: Error en el request
- `500 Internal Server Error`: Error del servidor

---

## Endpoints de Prueba

### `GET /analyze/dummy`

Endpoint de prueba que devuelve un análisis dummy con datos de ejemplo.

**Respuesta:**

```json
{
  "ok": true,
  "byLine": [
    {
      "line": 1,
      "kind": "assign",
      "ck": "1",
      "count": "1",
      "count_raw": "1"
    }
  ],
  "totals": {
    "T_open": "1",
    "procedure": []
  }
}
```

---

## Notas Importantes

1. **Modo "all"**: Cuando se usa `mode: "all"`, la API analiza worst, best y avg en una sola petición. Si no hay variabilidad entre casos, devuelve `"same_as_worst"` para best y avg.

2. **Detección automática**: Si no se proporciona `algorithm_kind`, la API lo detecta automáticamente usando heurísticas.

3. **Métodos recursivos**: Para algoritmos recursivos, se puede especificar un `preferred_method`, pero la API puede usar otro si el preferido no es aplicable.

4. **Caso promedio**: Requiere `avgModel` cuando `mode` es `"avg"` o `"all"`. Por defecto usa modelo uniforme.

5. **Compatibilidad**: El endpoint `/grammar/parse` acepta tanto `"source"` como `"input"` para compatibilidad con versiones anteriores.

