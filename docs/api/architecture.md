# Arquitectura del Backend

Documentación de la arquitectura, estructura y flujo de datos del backend.

## Estructura del Proyecto

```
apps/api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada FastAPI
│   ├── core/
│   │   ├── config.py          # Configuración y variables de entorno
│   │   └── __init__.py
│   ├── modules/
│   │   ├── parsing/           # Módulo de parseo
│   │   │   ├── router.py      # Router de parseo
│   │   │   └── ...
│   │   ├── analysis/           # Módulo de análisis
│   │   │   ├── router.py      # Router de análisis
│   │   │   ├── analyzers/     # Analizadores (iterativo, recursivo)
│   │   │   └── ...
│   │   ├── classification/    # Módulo de clasificación
│   │   │   ├── router.py      # Router de clasificación
│   │   │   └── ...
│   │   └── shared/            # Utilidades compartidas
│   └── routers/               # Routers legacy (en proceso de migración)
│       ├── parse.py
│       ├── analyze.py
│       └── classify.py
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

## Flujo de Datos

### 1. Parseo de Código

```
Cliente → POST /grammar/parse
         ↓
    parsing/router.py
         ↓
    aa_grammar.api.parse_to_ast()
         ↓
    AST (Program) o Errores
         ↓
    Respuesta JSON
```

**Componentes:**
- **Router**: `modules/parsing/router.py`
- **Parser**: Paquete `aa_grammar` (generado con ANTLR4)
- **Formato**: AST canónico definido en `@aa/types`

### 2. Análisis de Complejidad

```
Cliente → POST /analyze/open
         ↓
    analysis/router.py
         ↓
    parse_source() → AST
         ↓
    detect_algorithm_kind() → "iterative" | "recursive" | ...
         ↓
    AnalyzerRegistry.get(kind) → Analyzer
         ↓
    analyzer.analyze(ast, mode, ...)
         ↓
    Resultado: AnalyzeOpenResponse
         ↓
    Respuesta JSON
```

**Componentes:**
- **Router**: `modules/analysis/router.py`
- **Clasificador**: `modules/analysis/algorithm_classifier.py`
- **Analizadores**:
  - `IterativeAnalyzer`: Para algoritmos iterativos
  - `RecursiveAnalyzer`: Para algoritmos recursivos
  - `DummyAnalyzer`: Para pruebas

### 3. Clasificación de Algoritmos

```
Cliente → POST /classify
         ↓
    classification/router.py
         ↓
    parse_source() → AST (si se proporciona source)
         ↓
    detect_algorithm_kind(ast)
         ↓
    Respuesta: { kind, method }
```

**Componentes:**
- **Router**: `modules/classification/router.py`
- **Clasificador**: `modules/analysis/algorithm_classifier.py`

## Módulos Principales

### Módulo de Parseo (`modules/parsing/`)

Responsable de convertir código fuente en AST.

**Funciones clave:**
- `parse_source(source: str) -> Dict`: Parsea código y devuelve AST o errores
- Integración con `aa_grammar` package

### Módulo de Análisis (`modules/analysis/`)

Responsable del análisis de complejidad temporal.

**Componentes:**

1. **Analizadores Base:**
   - `BaseAnalyzer`: Clase abstracta base
   - `IterativeAnalyzer`: Análisis de algoritmos iterativos
   - `RecursiveAnalyzer`: Análisis de algoritmos recursivos

2. **Utilidades:**
   - `algorithm_classifier.py`: Clasificación de tipos de algoritmo
   - `summation_closer.py`: Cierre de sumatorias
   - `expr_converter.py`: Conversión de expresiones
   - `complexity_classes.py`: Clases de complejidad

3. **Métodos Recursivos:**
   - Teorema Maestro
   - Iteración
   - Árbol de Recursión
   - Ecuación Característica

### Módulo de Clasificación (`modules/classification/`)

Responsable de identificar el tipo de algoritmo.

**Funciones:**
- Clasificación heurística basada en AST
- Soporte para clasificación con LLM (opcional)

## Dependencias Externas

### Paquetes Python

- **FastAPI**: Framework web
- **Pydantic**: Validación de datos
- **SymPy**: Matemáticas simbólicas
- **aa_grammar**: Parser ANTLR4 (paquete interno)

### Servicios Externos (Opcionales)

- **Google Gemini API**: Para clasificación avanzada y análisis de caso promedio
- **OpenAI API**: Alternativa a Gemini

## Configuración

### Variables de Entorno

```env
# API Keys (opcionales)
GEMINI_API_KEY=...
OPENAI_API_KEY=...

# CORS (desarrollo)
DEV_CORS_ENABLED=true
DEV_ALLOWED_ORIGINS=http://localhost:3000
```

### Configuración FastAPI

```python
app = FastAPI(
    title="algorithmic-analysis API",
    version="0.1.0"
)

# CORS solo en desarrollo
if get_dev_cors_enabled():
    app.add_middleware(CORSMiddleware, ...)
```

## Procesamiento Sin Estado

La API es **stateless** (sin estado):

- No hay base de datos
- No hay persistencia de sesiones
- Cada request es independiente
- Todo el procesamiento es en memoria

## Manejo de Errores

1. **Errores de Parseo**: Retornados en formato estructurado con línea y columna
2. **Errores de Análisis**: Incluidos en `errors` array de la respuesta
3. **Errores del Servidor**: Capturados y retornados como `500 Internal Server Error`

Ver [errors.md](./errors.md) para más detalles.

## Extensibilidad

### Agregar Nuevos Analizadores

1. Crear clase que extienda `BaseAnalyzer`
2. Implementar método `analyze(ast, mode, ...)`
3. Registrar en `AnalyzerRegistry`

### Agregar Nuevos Métodos Recursivos

1. Implementar método en `RecursiveAnalyzer`
2. Agregar detección en `detect_applicable_methods()`
3. Actualizar tipos en `@aa/types`

## Testing

Los tests están organizados en:

```
tests/
├── unit/          # Tests unitarios
├── integration/   # Tests de integración
└── system/        # Tests del sistema completo
```

## Docker

La API se ejecuta en un contenedor Docker:

```dockerfile
FROM python:3.11-slim
# ... configuración
```

Ver `Dockerfile` para detalles completos.

## Monorepo

La API es parte de un monorepo que incluye:

- `apps/api/`: Backend FastAPI
- `apps/web/`: Frontend Next.js
- `packages/grammar/`: Gramática ANTLR4 compartida
- `packages/types/`: Tipos TypeScript compartidos

Los paquetes compartidos se instalan como dependencias locales.

