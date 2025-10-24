# BaseAnalyzer

Una clase base con utilidades para análisis de algoritmos que facilita el trabajo de cualquier estrategia (iterativa/recursiva) para emitir filas y armar T_open sin repetir código.

## Características

- ✅ Agregar filas de la tabla por línea
- ✅ Aplicar multiplicadores de bucles (stack)
- ✅ Construir la ecuación de eficiencia T_open = Σ C_{k}·count_{k}
- ✅ Registrar el procedimiento (pasos) que llevaron a T_open
- ✅ Memoización sencilla (PD) por nodo+contexto

## API Mínima

### Métodos Principales

#### `add_row(line, kind, ck, count, note=None)`
Inserta una fila aplicando el multiplicador del contexto de bucles.

```python
analyzer.add_row(
    line=1,
    kind="assign",
    ck="C_1",
    count="1",
    note="Asignación simple"
)
```

#### `push_multiplier(m)` / `pop_multiplier()`
Gestiona el contexto de bucles.

```python
analyzer.push_multiplier("n")  # Entrar al bucle
# ... agregar filas del cuerpo del bucle
analyzer.pop_multiplier()      # Salir del bucle
```

#### `build_t_open()`
Construye la ecuación T_open = Σ C_{k}·count_{k} en formato KaTeX.

```python
equation = analyzer.build_t_open()
# Resultado: "(C_1)·(1) + (C_2)·(n)"
```

#### `result()`
Genera la respuesta estándar del análisis.

```python
response = analyzer.result()
# Devuelve el contrato AnalyzeOpenResponse completo
```

### Métodos de Memoización

#### `memo_key(node, mode, ctx_hash)`
Genera clave estable para cachear filas de un subárbol.

#### `memo_get(key)` / `memo_set(key, rows)`
Obtiene y guarda filas en el cache.

### Métodos de Utilidad

#### `add_symbol(symbol, description)`
Agrega un símbolo con su descripción.

```python
analyzer.add_symbol("n", "tamaño del arreglo")
```

#### `add_note(note)`
Agrega una nota al análisis.

```python
analyzer.add_note("Se asumen costos constantes")
```

#### `add_procedure_step(step)`
Agrega un paso al procedimiento.

```python
analyzer.add_procedure_step(r"5) Se identifican las líneas con costos constantes")
```

## Ejemplo de Uso

```python
from app.analysis.base import BaseAnalyzer

# Crear analizador
analyzer = BaseAnalyzer()

# Agregar símbolos
analyzer.add_symbol("n", "tamaño del arreglo")
analyzer.add_symbol("C_1", "costo de asignación")

# Línea 1: Declaración
analyzer.add_row(1, "decl", "C_1", "1", "Declaración de variable")

# Línea 2: Asignación inicial
analyzer.add_row(2, "assign", "C_1", "1", "Inicialización")

# Línea 3: Bucle for
analyzer.add_row(3, "for", "C_2", "n + 1", "Condición del bucle")

# Entrar al contexto del bucle
analyzer.push_multiplier("n")

# Línea 4: Cuerpo del bucle
analyzer.add_row(4, "assign", "C_1", "1", "Asignación dentro del bucle")

# Salir del contexto del bucle
analyzer.pop_multiplier()

# Obtener resultado
result = analyzer.result()
print(f"T_open: {result['totals']['T_open']}")
```

## Estructura de Datos

### LineCost
```python
{
    "line": int,        # Número de línea
    "kind": str,        # Tipo de instrucción
    "ck": str,          # Costo individual (KaTeX)
    "count": str,       # Número de ejecuciones (KaTeX)
    "note": str         # Nota opcional
}
```

### AnalyzeOpenResponse
```python
{
    "ok": bool,
    "byLine": List[LineCost],
    "totals": {
        "T_open": str,           # Ecuación de eficiencia
        "procedure": List[str],   # Pasos del procedimiento
        "symbols": Dict[str, str], # Símbolos y descripciones
        "notes": List[str]        # Notas del análisis
    }
}
```

## Testing

Para probar la funcionalidad, puedes usar el analizador dummy:

```python
from app.analysis.dummy_analyzer import create_dummy_analysis

result = create_dummy_analysis()
print(f"T_open: {result['totals']['T_open']}")
```

O usar el endpoint de prueba:

```bash
curl http://localhost:8000/analyze/dummy
```

## Próximos Pasos

Esta clase base está lista para ser extendida con:
- Reglas específicas para bucles `for`
- Reglas específicas para condicionales `if`
- Reglas específicas para bucles `while`
- Análisis recursivo
- Análisis iterativo

La idea es que cualquier estrategia de análisis pueda usar esta base sin repetir código.
