# Sistema de Análisis de Algoritmos - Guía Completa

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Reglas de Análisis](#reglas-de-análisis)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [API y Endpoints](#api-y-endpoints)
8. [Memoización y Optimización](#memoización-y-optimización)
9. [Troubleshooting](#troubleshooting)

## Introducción

El Sistema de Análisis de Algoritmos es una herramienta completa para el análisis de complejidad temporal de algoritmos escritos en pseudocódigo. El sistema implementa el **método de análisis abierto (S3)** según las guías académicas, generando ecuaciones de eficiencia en forma abierta que pueden ser posteriormente cerradas por el sistema S4.

### ¿Qué hace el sistema?

1. **Parsea** código pseudocódigo a un AST (Abstract Syntax Tree)
2. **Analiza** cada línea del código aplicando reglas específicas
3. **Genera** una tabla de costos por línea con constantes Cₖ
4. **Construye** la ecuación de eficiencia T_open = Σ Cₖ·countₖ
5. **Proporciona** un procedimiento explicativo paso a paso

### Características Principales

- ✅ **Análisis de bucles FOR** con multiplicadores de sumatorias
- ✅ **Análisis de condicionales IF** con selección de rama dominante
- ✅ **Análisis de bucles WHILE/REPEAT** con símbolos de iteración
- ✅ **Análisis de líneas simples** (asignaciones, returns, llamadas)
- ✅ **Memoización** para optimización de subárboles repetidos
- ✅ **Normalización** de strings para mejor legibilidad
- ✅ **Detección de early returns** en análisis worst-case

## Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  /analyze/open  │  /analyze/closed  │  /grammar/parse       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                IterativeAnalyzer                            │
├─────────────────────────────────────────────────────────────┤
│  • Unifica todos los visitors                               │
│  • Maneja el flujo principal de análisis                    │
│  • Aplica normalización de strings                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                BaseAnalyzer                                 │
├─────────────────────────────────────────────────────────────┤
│  • Gestión de filas (add_row)                               │
│  • Stack de multiplicadores (push/pop_multiplier)          │
│  • Construcción de T_open (build_t_open)                   │
│  • Sistema de memoización (memo_get/set)                   │
│  • Generación de constantes (C())                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Visitors                                 │
├─────────────────────────────────────────────────────────────┤
│  ForVisitor    │  IfVisitor    │  WhileRepeatVisitor       │
│  SimpleVisitor │  (otros...)   │                           │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Entrada**: Código pseudocódigo como string
2. **Parsing**: Conversión a AST mediante grammar parser
3. **Análisis**: Visita del AST aplicando reglas específicas
4. **Construcción**: Generación de tabla de costos y T_open
5. **Salida**: Respuesta JSON con análisis completo

## Componentes Principales

### 1. IterativeAnalyzer

**Ubicación**: `apps/api/app/analysis/iterative_analyzer.py`

**Propósito**: Analizador principal que unifica todos los visitors y maneja el flujo de análisis.

**Características**:
- Hereda de `BaseAnalyzer` y todos los visitors
- Implementa el dispatcher principal `visit()`
- Maneja conversión de expresiones AST a strings
- Aplica normalización de strings para mejor legibilidad

**Métodos Clave**:
```python
def analyze(self, ast: Dict[str, Any], mode: str = "worst", api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Analiza un AST completo y retorna el resultado.
    
    Args:
        ast: AST del algoritmo a analizar
        mode: Modo de análisis ("worst", "best", "avg")
        api_key: API Key (ignorado, mantenido por compatibilidad)
    
    Returns:
        Resultado del análisis con byLine, T_open, procedure, etc.
    """
    # Usa SymPy para cerrar sumatorias y generar procedimientos
    # No requiere API key para simplificación

def visit(self, node: Any, mode: str = "worst") -> None
def _expr_to_str(self, expr: Any) -> str
def _normalize_string(self, s: str) -> str
```

### 2. BaseAnalyzer

**Ubicación**: `apps/api/app/analysis/base.py`

**Propósito**: Clase base que proporciona funcionalidades comunes para todos los analizadores.

**Características**:
- Gestión de filas de análisis (`add_row`)
- Stack de multiplicadores para bucles anidados
- Construcción de ecuación T_open
- Sistema de memoización para optimización
- Generación automática de constantes Cₖ

**Métodos Clave**:
```python
def add_row(self, line: int, kind: str, ck: str, count: str, note: Optional[str] = None)
def push_multiplier(self, m: str)
def pop_multiplier(self)
def build_t_open(self) -> str
def C(self) -> str  # Genera siguiente constante Cₖ
```

### 3. Visitors Especializados

#### ForVisitor
**Ubicación**: `apps/api/app/analysis/visitors/for_visitor.py`
**Propósito**: Analiza bucles FOR aplicando reglas específicas
**Reglas**: Ver [FOR_RULES.md](rules/FOR_RULES.md)

#### IfVisitor
**Ubicación**: `apps/api/app/analysis/visitors/if_visitor.py`
**Propósito**: Analiza condicionales IF con selección de rama dominante
**Reglas**: Ver [IF_RULES.md](rules/IF_RULES.md)

#### WhileRepeatVisitor
**Ubicación**: `apps/api/app/analysis/visitors/while_repeat_visitor.py`
**Propósito**: Analiza bucles WHILE y REPEAT con símbolos de iteración
**Reglas**: Ver [WHILE_REPEAT_RULES.md](rules/WHILE_REPEAT_RULES.md)

#### SimpleVisitor
**Ubicación**: `apps/api/app/analysis/visitors/simple_visitor.py`
**Propósito**: Analiza líneas simples (asignaciones, returns, llamadas)
**Reglas**: Ver [SIMPLE_RULES.md](rules/SIMPLE_RULES.md)

## Reglas de Análisis

### 1. Bucles FOR

**Regla Principal**: Para `FOR i <- a TO b DO block`:
- **Cabecera**: Se evalúa `(b - a + 2)` veces
- **Cuerpo**: Se ejecuta `Σ_{i=a}^{b} 1` veces

**Implementación**:
```python
def visitFor(self, node: Dict[str, Any], mode: str = "worst") -> None:
    # 1) Cabecera del for: (b - a + 2) evaluaciones
    ck_header = self.C()
    header_count = f"({b}) - ({a}) + 2"
    self.add_row(line, "for", ck_header, header_count)
    
    # 2) Multiplicador del cuerpo: Σ_{v=a}^{b} 1
    mult = f"\\sum_{{{var}={a}}}^{{{b}}} 1"
    self.push_multiplier(mult)
    self.visit(body, mode)
    self.pop_multiplier()
```

**Ejemplo**:
```pseudocode
FOR i <- 1 TO n DO
    A[i] <- i * 2
```

**Resultado**:
- Línea 1: `for` - `C₁` - `(n) - (1) + 2`
- Línea 2: `assign` - `C₂` - `(1) * (Σ_{i=1}^{n} 1)`

### 2. Condicionales IF

**Regla Principal**: Para `IF (cond) THEN block1 ELSE block2`:
- **Guardia**: Se evalúa 1 vez
- **Ramas**: En worst case, se elige la rama dominante

**Implementación**:
```python
def visitIf(self, node: Dict[str, Any], mode: str = "worst") -> None:
    # 1) Guardia: siempre se evalúa una vez
    ck_guard = self.C()
    self.add_row(line, "if", ck_guard, "1")
    
    # 2) Evaluar ramas en buffers separados
    then_buf = run_block_to_buffer(consequent)
    else_buf = run_block_to_buffer(alternate)
    
    # 3) Elegir rama dominante en worst case
    if mode == "worst":
        chosen = select_dominant_branch(then_buf, else_buf)
        self.rows.extend(chosen)
```

**Ejemplo**:
```pseudocode
IF (A[i] = x) THEN
    RETURN i
ELSE
    i <- i + 1
```

**Resultado**:
- Línea 1: `if` - `C₁` - `1`
- Línea 3: `assign` - `C₂` - `1` (worst: max(then, else))

### 3. Bucles WHILE/REPEAT

**Regla Principal**: 
- **WHILE**: Condición se evalúa `(t_{while_L} + 1)` veces, cuerpo `t_{while_L}` veces
- **REPEAT**: Cuerpo se ejecuta `(1 + t_{repeat_L})` veces, condición `(1 + t_{repeat_L})` veces

**Implementación**:
```python
def visitWhile(self, node: Dict[str, Any], mode: str = "worst") -> None:
    L = node.get("pos", {}).get("line", 0)
    t = self.iter_sym("while", L)  # t_{while_L}
    
    # 1) Condición: (t_{while_L} + 1) veces
    ck_cond = self.C()
    self.add_row(L, "while", ck_cond, f"{t} + 1")
    
    # 2) Cuerpo: t_{while_L} veces
    self.push_multiplier(t)
    self.visit(body, mode)
    self.pop_multiplier()
```

**Ejemplo**:
```pseudocode
WHILE (i < n) DO
    A[i] <- i * 2
    i <- i + 1
```

**Resultado**:
- Línea 1: `while` - `C₁` - `t_{while_1} + 1`
- Línea 2: `assign` - `C₂` - `(1) * (t_{while_1})`
- Línea 3: `assign` - `C₃` - `(1) * (t_{while_1})`

### 4. Líneas Simples

**Regla Principal**: Descomponer cada línea en operaciones elementales y asignar constantes Cₖ.

**Tipos de Líneas**:
- **Asignaciones**: `target <- expr`
- **Returns**: `RETURN expr`
- **Llamadas**: `CALL f(args)`
- **Declaraciones**: `DECL var[size]`

**Implementación**:
```python
def visitAssign(self, node: Dict[str, Any], mode: str = "worst") -> None:
    ck_terms = []
    ck_terms += self._cost_of_lvalue(node.get("target", {}))
    ck_terms += self._cost_of_expr(node.get("value"))
    ck_terms.append(self.C())  # costo de la asignación
    
    ck = " + ".join(ck_terms)
    self.add_row(line, "assign", ck, "1")
```

**Ejemplo**:
```pseudocode
A[i] <- A[j] + 1
```

**Resultado**:
- Línea 1: `assign` - `C₁ + C₂ + C₃` - `1`
  - `C₁`: costo de acceso a `A[i]`
  - `C₂`: costo de acceso a `A[j]`
  - `C₃`: costo de operación `+`
  - `C₄`: costo de la asignación

## Flujo de Trabajo

### 1. Entrada del Usuario

```json
POST /analyze/open
{
  "source": "busquedaLineal(A[n], x, n) BEGIN\nFOR i <- 1 TO n DO BEGIN\nIF (A[i] = x) THEN BEGIN\nRETURN i;\nEND\nEND\nRETURN -1;\nEND",
  "mode": "worst"
}
```

### 2. Parsing del Código

```python
# El router parsea el código fuente
parse_result = parse_source(payload.source)
ast = parse_result.get("ast")
```

### 3. Análisis del AST

```python
# Crear analizador y procesar
analyzer = IterativeAnalyzer()
result = analyzer.analyze(ast, payload.mode)
```

### 4. Construcción de Resultado

```python
# El analizador genera:
{
  "ok": True,
  "byLine": [
    {"line": 2, "kind": "for", "ck": "C₁", "count": "n + 1", "note": "Cabecera del bucle for i=1..n"},
    {"line": 3, "kind": "if", "ck": "C₂", "count": "\\sum_{i=1}^{n} 1", "note": "Evaluación de la condición"},
    {"line": 7, "kind": "return", "ck": "C₄", "count": "1", "note": null}
  ],
  "totals": {
    "T_open": "(C₁)·(n + 1) + (C₂)·\\sum_{i=1}^{n} 1 + (C₄)·(1)",
    "procedure": ["1) Se asignan costos constantes C₁, C₂, ...", "2) Se extraen por línea los costos Cₖ y los conteos #ejecuciones", ...]
  }
}
```

## Ejemplos Prácticos

### Ejemplo 1: Búsqueda Lineal

**Código**:
```pseudocode
busquedaLineal(A[n], x, n) BEGIN
FOR i <- 1 TO n DO BEGIN
    IF (A[i] = x) THEN BEGIN
        RETURN i;
    END
END
RETURN -1;
END
```

**Análisis**:
- **Línea 2**: Cabecera del FOR - `C₁` - `(n) - (1) + 2 = n + 1`
- **Línea 3**: Guardia del IF - `C₂` - `1` (multiplicado por `Σ_{i=1}^{n} 1`)
- **Línea 4**: Early return - **eliminado en worst case**
- **Línea 7**: Return final - `C₄` - `1`

**T_open**: `(C₁)·(n + 1) + (C₂)·Σ_{i=1}^{n} 1 + (C₄)·(1)`

### Ejemplo 2: Quicksort (Parte)

**Código**:
```pseudocode
FOR i <- izq TO der - 1 DO BEGIN
    IF (A[i] <= pivot) THEN BEGIN
        temp <- A[i]
        A[i] <- A[j]
        A[j] <- temp
        j <- j + 1
    END
END
```

**Análisis**:
- **Línea 1**: Cabecera del FOR - `C₁` - `((der) - (1)) - (izq) + 2`
- **Línea 2**: Guardia del IF - `C₂` - `1` (multiplicado por `Σ_{i=izq}^{der-1} 1`)
- **Líneas 3-6**: Asignaciones del THEN - `C₃, C₄, C₅, C₆` - `1` (multiplicado por `Σ_{i=izq}^{der-1} 1`)

### Ejemplo 3: Búsqueda Binaria

**Código**:
```pseudocode
WHILE (izq <= der) DO BEGIN
    mid <- (izq + der) DIV 2
    IF (A[mid] = target) THEN
        RETURN mid
    ELSE IF (A[mid] < target) THEN
        izq <- mid + 1
    ELSE
        der <- mid - 1
END
```

**Análisis**:
- **Línea 1**: Condición del WHILE - `C₁` - `t_{while_1} + 1`
- **Línea 2**: Asignación - `C₂` - `(1) * (t_{while_1})`
- **Línea 3**: Guardia del IF - `C₃` - `(1) * (t_{while_1})`
- **Línea 4**: Return - `C₄` - `(1) * (t_{while_1})` (worst: no early-exit)
- **Líneas 5-8**: Asignaciones del ELSE - `C₅, C₆` - `(1) * (t_{while_1})`

## API y Endpoints

### POST /analyze/open

**Propósito**: Análisis de algoritmo en forma abierta (S3)

**Request**:
```json
{
  "source": "código pseudocódigo",
  "mode": "worst" | "best" | "avg"
}
```

**Response**:
```json
{
  "ok": true,
  "byLine": [
    {
      "line": 2,
      "kind": "for",
      "ck": "C₁",
      "count": "n + 1",
      "note": "Cabecera del bucle for i=1..n"
    }
  ],
  "totals": {
    "T_open": "(C₁)·(n + 1) + (C₂)·Σ_{i=1}^{n} 1",
    "procedure": ["1) Se asignan costos constantes C₁, C₂, ...", ...],
    "symbols": null,
    "notes": null
  }
}
```

### POST /analyze/closed

**Propósito**: Análisis de algoritmo en forma cerrada (S4) - **No implementado aún**

**Response**:
```json
{
  "ok": false,
  "errors": [{"message": "Análisis cerrado no implementado aún (S4)"}]
}
```

### POST /grammar/parse

**Propósito**: Parsear código pseudocódigo a AST

**Request**:
```json
{
  "source": "código pseudocódigo"
}
```

**Response**:
```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "ast": { /* AST del código */ },
  "errors": []
}
```

### GET /analyze/dummy

**Propósito**: Endpoint de prueba con análisis dummy

**Response**: Análisis de ejemplo para verificar funcionalidad

## Memoización y Optimización

### Sistema de Memoización

El sistema incluye un sistema de memoización para optimizar el análisis de subárboles repetidos:

```python
def memo_key(self, node: Any, mode: str, ctx_hash: str) -> str:
    """Genera clave única para cachear filas de un subárbol"""
    nid = getattr(node, "id", None) or str(id(node))
    return f"{nid}|{mode}|{ctx_hash}"

def memo_get(self, key: str) -> Optional[List[LineCost]]:
    """Obtiene filas del cache"""
    return self.memo.get(key)

def memo_set(self, key: str, rows: List[LineCost]):
    """Guarda filas en el cache"""
    self.memo[key] = [dict(r) for r in rows]
```

### Optimizaciones Implementadas

1. **Normalización de Strings**: Elimina paréntesis extra y simplifica expresiones
2. **Detección de Early Returns**: Elimina returns tempranos en worst case
3. **Conversión Eficiente**: Convierte expresiones AST a strings legibles
4. **Stack de Multiplicadores**: Maneja eficientemente bucles anidados

### Ejemplo de Optimización

**Antes**:
```
"count": "({'type': 'Identifier', 'name': 'n', 'pos': {'line': 0, 'column': 0}}) - (1) + 2"
```

**Después**:
```
"count": "n + 1"
```

## Troubleshooting

### Problemas Comunes

#### 1. "aa_grammar no disponible"
**Causa**: El parser de gramática no está instalado o configurado
**Solución**: Verificar que el paquete `aa_grammar` esté instalado

#### 2. Costos dobles en returns
**Causa**: Expresiones unarias simples como `-1` generan costos adicionales
**Solución**: Ya corregido en `SimpleVisitor._cost_of_expr()`

#### 3. Early returns aparecen en worst case
**Causa**: Lógica de selección de rama no detecta early returns
**Solución**: Ya corregido en `IfVisitor.visitIf()`

#### 4. Strings no legibles en count
**Causa**: Expresiones AST no se convierten a strings
**Solución**: Ya corregido en `IterativeAnalyzer._expr_to_str()`

### Debugging

#### Verificar Análisis Paso a Paso
```python
# Crear analizador y examinar estado
analyzer = IterativeAnalyzer()
result = analyzer.analyze(ast, "worst")

# Examinar filas generadas
for row in analyzer.rows:
    print(f"Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']}")

# Examinar multiplicadores activos
print(f"Loop stack: {analyzer.loop_stack}")

# Examinar contador de constantes
print(f"Counter: {analyzer.counter}")
```

#### Verificar AST
```python
# Parsear código y examinar AST
parse_result = parse_source(source_code)
if parse_result.get("ok"):
    ast = parse_result.get("ast")
    print(f"AST keys: {ast.keys()}")
    print(f"AST structure: {ast}")
else:
    print(f"Parse errors: {parse_result.get('errors')}")
```

### Logs y Monitoreo

El sistema incluye logging detallado para debugging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# El analizador registrará:
# - Visitas a nodos del AST
# - Generación de constantes Cₖ
# - Aplicación de multiplicadores
# - Construcción de T_open
```

## Referencias

### Reglas de Análisis
- [FOR_RULES.md](rules/FOR_RULES.md) - Reglas para bucles FOR
- [IF_RULES.md](rules/IF_RULES.md) - Reglas para condicionales IF
- [SIMPLE_RULES.md](rules/SIMPLE_RULES.md) - Reglas para líneas simples
- [WHILE_REPEAT_RULES.md](rules/WHILE_REPEAT_RULES.md) - Reglas para bucles WHILE/REPEAT

### Documentación Técnica
- [README_ITERATIVE.md](README_ITERATIVE.md) - Documentación técnica del analizador iterativo
- [dummy_analyzer.py](dummy_analyzer.py) - Analizador de ejemplo para pruebas

### Estructura del Proyecto
```
apps/api/app/analysis/
├── __init__.py                 # Exportaciones principales
├── base.py                     # Clase base con utilidades
├── iterative_analyzer.py       # Analizador principal
├── dummy_analyzer.py          # Analizador de ejemplo
├── visitors/                   # Visitors especializados
│   ├── for_visitor.py
│   ├── if_visitor.py
│   ├── simple_visitor.py
│   └── while_repeat_visitor.py
├── rules/                      # Documentación de reglas
│   ├── FOR_RULES.md
│   ├── IF_RULES.md
│   ├── SIMPLE_RULES.md
│   └── WHILE_REPEAT_RULES.md
└── examples/                   # Ejemplos de uso
    ├── for_if_combined_example.py
    ├── nested_for_example.py
    └── quicksort_example.py
```

---

**Nota**: Este sistema está diseñado para ser extensible y mantenible. Las reglas están claramente documentadas y separadas por responsabilidad, permitiendo fácil adición de nuevas funcionalidades y corrección de bugs.

## Simplificación y Cierre de Sumatorias

Desde S3 la simplificación matemática se realiza usando **SymPy** (biblioteca de cálculo simbólico de Python). Esta versión implementa un sistema determinista y educativo:

1. **`SummationCloser`**
    - Cierra sumatorias usando SymPy para evaluación simbólica exacta.
    - Genera procedimientos paso a paso educativos para cada tipo de sumatoria.
    - Maneja casos canónicos:
      - Sumatorias simples: `\sum_{i=1}^{n} 1 → n`
      - Sumatorias anidadas rectangulares: `\sum_{i=1}^{n} \sum_{j=1}^{m} 1 → n \cdot m`
      - Sumatorias triangulares: `\sum_{i=1}^{n} \sum_{j=1}^{i} 1 → \frac{n(n+1)}{2}`
      - Sumatorias con límites dependientes: `\sum_{i=1}^{n-1} \sum_{j=i+1}^{n} 1 → \frac{n(n-1)}{2}`

2. **`ComplexityClasses`**
    - Extrae términos dominantes de polinomios usando SymPy.
    - Calcula clases de complejidad O/Ω/Θ automáticamente.
    - Maneja polinomios, funciones logarítmicas y combinaciones.

### Ventajas del Sistema SymPy

- **Determinismo**: Resultados siempre consistentes y verificables.
- **Velocidad**: Más rápido que llamadas a API externas.
- **Precisión**: Cálculo simbólico exacto sin aproximaciones.
- **Educativo**: Procedimientos paso a paso estructurados y claros.
- **Sin dependencias externas**: No requiere API keys para simplificación.

### Sanitización en backend/frontend
- El backend conserva tanto `count_raw` como `count` y persiste `procedure` en cada fila para que el frontend pueda renderizarlo sin recalcular nada.
- En `ProcedureModal` se normalizan los pasos recibidos mediante `sanitizeProcedureStep`, que:
  - Encuentra y procesa **todos** los bloques `\text{}` en un paso (no solo el primero).
  - Normaliza espacios y dos puntos dentro de cada bloque.
  - Asegura un espacio al final dentro de cada `\text{... }`.
  - Preserva expresiones matemáticas entre bloques de texto.
  - Corrige casos donde múltiples `\text{}` están intercalados con fórmulas (ej: `\text{Como } n^2 \text{ y } n \text{ no dependen...`).
- Se añadió un helper para derivar Big-O a partir de la forma polinómica, reutilizado en las tarjetas de casos (peor/mejor/promedio).

### Notas adicionales
- El helper `_apply_loop_multipliers` genera sumatorias anidadas en lugar de productos directos, lo que evita mezclar variables unbound.
- `BaseAnalyzer.add_row` agrega `count_raw` y deja el resto del postprocesado a `SummationCloser`, simplificando los visitantes (`ForVisitor`, `WhileVisitor`, etc.).
- El sistema ya no depende de API keys para simplificación, aunque se mantiene compatibilidad con el campo `api_key` en requests (se ignora para simplificación).