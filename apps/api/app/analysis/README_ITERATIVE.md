# Análisis Iterativo Unificado - Implementación Completa

## Resumen

Se ha implementado exitosamente el **IterativeAnalyzer** unificado que combina todos los visitors (FOR, IF, WHILE/REPEAT, SIMPLE) en un sistema coherente para análisis de algoritmos.

## Estructura Implementada

```
apps/api/app/analysis/
├── base.py                    # Clase base con utilidades comunes
├── iterative_analyzer.py      # Analizador unificado principal
├── visitors/                  # Visitors individuales
│   ├── __init__.py
│   ├── for_visitor.py         # Reglas para bucles FOR
│   ├── if_visitor.py          # Reglas para condicionales IF
│   ├── while_repeat_visitor.py # Reglas para WHILE/REPEAT
│   └── simple_visitor.py     # Reglas para líneas simples
├── rules/                     # Documentación de reglas
│   ├── FOR_RULES.md
│   ├── IF_RULES.md
│   ├── WHILE_REPEAT_RULES.md
│   └── SIMPLE_RULES.md
└── examples/
    └── quicksort_example.py   # Ejemplo completo de quicksort
```

## Funcionalidades Implementadas

### 1. IterativeAnalyzer Unificado
- **Herencia múltiple**: Combina BaseAnalyzer con todos los visitors
- **Dispatcher centralizado**: Maneja todos los tipos de nodos del AST
- **Análisis completo**: Soporta FOR, IF, WHILE, REPEAT, ASSIGN, CALL, RETURN

### 2. Visitors Especializados

#### ForVisitor
- **Cabecera del FOR**: `(b - a + 2)` evaluaciones
- **Multiplicador del cuerpo**: `Σ_{v=a}^{b} 1`
- **Procedimiento explicativo**: Documenta cada paso

#### IfVisitor
- **Guardia**: Siempre se evalúa una vez
- **Selección de rama dominante**: En modo "worst" elige la rama con más filas
- **Manejo de THEN/ELSE**: Soporte completo para ambas ramas

#### WhileRepeatVisitor
- **WHILE**: Condición `(t_{while_L} + 1)` veces, cuerpo por `t_{while_L}`
- **REPEAT**: Cuerpo y condición `(1 + t_{repeat_L})` veces
- **Símbolos de iteración**: Generación determinista de `t_{while_L}`, `t_{repeat_L}`

#### SimpleVisitor
- **Asignaciones**: Descompone en accesos, aritmética, asignación
- **Llamadas**: Costo de llamada + argumentos
- **Returns**: Costo de expresión + return
- **Expresiones**: Recursión sobre operadores binarios, unarios, indexación

### 3. Sistema de Análisis

#### Flujo Completo
1. **Parse**: Código fuente → AST
2. **Análisis**: AST → byLine + T_open + procedure
3. **Respuesta**: Estructura estándar con todos los componentes

#### Componentes de Salida
- **byLine**: Tabla por línea con `line`, `kind`, `ck`, `count`, `note`
- **T_open**: Ecuación de eficiencia `Σ C_{k}·count_{k}`
- **procedure**: Pasos del análisis en formato KaTeX
- **symbols**: Diccionario de símbolos y descripciones
- **notes**: Notas adicionales sobre el análisis

## Prueba con Quicksort

### Resultado del Análisis
- **16 filas** generadas correctamente
- **1 FOR**: Con multiplicador `Σ_{j=izq}^{der-1} 1`
- **2 IF**: Con selección de rama dominante
- **11 ASSIGN**: Con costos descompuestos
- **2 CALL**: Llamadas recursivas sin expandir

### T_open Generado
```
(C_{1})·(1) + (C_{2} + C_{3})·(1) + ... + (C_{7})·(((der) - (1)) - (izq) + 2) + 
(C_{8})·((1)·(Σ_{j=izq}^{(der) - (1)} 1)) + ... + (C_{31} + C_{32})·(1)
```

### Características Verificadas
- ✅ **Multiplicadores aplicados**: Las filas dentro del FOR tienen multiplicador
- ✅ **Selección de rama dominante**: IF elige THEN en modo worst
- ✅ **Costos descompuestos**: Cada asignación suma constantes por accesos/aritmética
- ✅ **Llamadas como líneas simples**: CALL quicksort() genera una fila sin expandir
- ✅ **Procedimiento completo**: 8 pasos documentando el análisis

## Análisis de Casos: Best, Worst y Average

### Modos de Análisis

El sistema soporta tres modos de análisis:

1. **Worst Case (`mode: "worst"`)**: Analiza el peor caso del algoritmo
   - Selecciona ramas de IF con más líneas de código
   - Considera el máximo número de iteraciones en bucles
   - Genera cotas superiores de complejidad

2. **Best Case (`mode: "best"`)**: Analiza el mejor caso del algoritmo
   - Selecciona ramas de IF con menos líneas de código
   - Considera el mínimo número de iteraciones en bucles
   - Genera cotas inferiores de complejidad

3. **Average Case (`mode: "avg"`)**: Analiza el caso promedio del algoritmo
   - Utiliza modelos probabilísticos (uniform, symbolic)
   - Aplica esperanzas matemáticas (expectedRuns)
   - Genera complejidad promedio esperada

### Modelos de Caso Promedio

#### Modelo Uniforme (`mode: "uniform"`)
- Distribución uniforme de probabilidades
- Cada condición tiene probabilidad `p = 1/2` por defecto
- Ejemplo: En búsqueda lineal, la probabilidad de encontrar el elemento en posición `i` es `1/n`

#### Modelo Simbólico (`mode: "symbolic"`)
- Probabilidades expresadas simbólicamente
- Permite definir predicados personalizados
- Útil para análisis teórico avanzado

### Estructura de Respuesta para Caso Promedio

```json
{
  "ok": true,
  "byLine": [
    {
      "line": 1,
      "kind": "for",
      "ck": "C_1",
      "count": "n",
      "count_raw": "n",
      "expectedRuns": "n"  // Campo adicional para avg case
    }
  ],
  "totals": {
    "T_open": "Σ C_k · count_k",
    "A_of_n": "E[T(n)]",  // Esperanza para caso promedio
    "avg_model_info": {
      "mode": "uniform",
      "note": "Modelo uniforme aplicado"
    },
    "hypotheses": []  // Para modelo simbólico
  }
}
```

### Ejemplos de Algoritmos Probados

#### Algoritmos Comunes (O(n) - O(log n))
- **Búsqueda Lineal**: Best O(1), Worst O(n), Avg O(n/2)
- **Búsqueda Binaria Iterativa**: Best O(1), Worst O(log n), Avg O(log n)
- **Factorial Iterativo**: O(n) en todos los casos
- **Suma de Array**: O(n) en todos los casos
- **Máximo de Array**: O(n) en todos los casos

#### Algoritmos Intermedios (O(n²) - O(n³))
- **Selection Sort**: O(n²) en todos los casos
- **Bubble Sort Optimizado**: Best O(n), Worst O(n²), Avg O(n²)
- **Insertion Sort**: Best O(n), Worst O(n²), Avg O(n²)
- **Multiplicación de Matrices**: O(n³) en todos los casos

#### Algoritmos Complejos
- **Bucles Anidados con Límites Variables**: FOR i=1 TO n, FOR j=i TO n
- **WHILE con Condiciones Complejas**: Condiciones con AND/OR múltiples
- **IF Anidados dentro de FOR**: Múltiples ramas condicionales
- **Arrays con Indexación Compleja**: A[i+j], A[i*2]
- **REPEAT-UNTIL**: Bucles con condiciones dependientes de arrays

## Integración con API

### Endpoint `/analyze/open`
- **Input**: `{ "source": "código", "mode": "worst" | "best" | "avg", "avgModel": {...} }`
- **Parse**: Usa el parser existente para generar AST
- **Análisis**: IterativeAnalyzer procesa el AST según el modo
- **Output**: Estructura estándar con byLine, T_open, procedure (y A_of_n para avg)
- **Modo "all"**: Analiza worst, best y avg en una sola petición

### Registry de Analizadores
```python
AnalyzerRegistry = {
    "iterative": IterativeAnalyzer,
    "dummy": DummyAnalyzer,
    "for": ForAnalyzer,
    "if": IfAnalyzer,
    "simple": SimpleAnalyzer,
    "while_repeat": WhileRepeatAnalyzer
}
```

## Verificación de Cumplimiento

### Checklist de Verificación ✅
- [x] **Genera filas para el FOR** (cabecera) y multiplica el cuerpo por la sumatoria
- [x] **Genera guardia del IF** y elige THEN en worst (sin else)
- [x] **Asigna costos a todas las líneas simples** (incluyendo indexaciones/aritmética)
- [x] **Cuenta llamadas como call** con un C_{k} (sin expandir)
- [x] **T_open contiene la suma** de todos los términos en orden
- [x] **procedure incluye los pasos** M3/M4/M5 y menciona el FOR y el IF

### DoD (Definition of Done) ✅
- [x] **byLine coherente** (con multiplicadores donde corresponde)
- [x] **totals.T_open armado** con todos los términos
- [x] **totals.procedure** con pasos claros
- [x] **No falla** si aparecen while/repeat en otros tests
- [x] **Pipeline completo** desde código fuente hasta respuesta API

## Tests Exhaustivos

El sistema incluye una suite completa de tests que cubre:

### Tests de Casos Comunes
- Búsqueda lineal (best/worst/avg)
- Búsqueda binaria iterativa (best/worst/avg)
- Factorial iterativo (best/worst/avg)
- Suma de array (best/worst/avg)
- Máximo de array (best/worst/avg)

### Tests de Casos Intermedios
- Selection sort (best/worst/avg)
- Bubble sort optimizado (best/worst/avg)
- Insertion sort (best/worst/avg)
- Multiplicación de matrices (best/worst/avg)

### Tests de Casos Complejos
- Bucles anidados con límites variables
- WHILE con condiciones complejas (AND/OR)
- IF anidados dentro de FOR
- REPEAT-UNTIL con condiciones dependientes
- Arrays con indexación compleja (A[i+j], A[i*2])

### Ubicación de Tests
- `tests/integration/test_iterative_analyzer.py`: Tests básicos y casos comunes
- `tests/integration/test_intermediate_algorithms.py`: Tests de algoritmos intermedios
- `tests/integration/test_complex_algorithms.py`: Tests de algoritmos complejos
- `tests/integration/test_avg_case.py`: Tests específicos de caso promedio
- `tests/integration/test_algorithms.py`: Tests de algoritmos completos (insertion sort, bubble sort)

## Próximos Pasos

1. ✅ **Integración con UI**: El endpoint está listo y siendo consumido por la interfaz web
2. ✅ **Tests exhaustivos**: Suite completa de tests con casos comunes, intermedios y complejos
3. **Optimizaciones**: Mejorar el rendimiento para algoritmos muy grandes
4. ✅ **Documentación**: Documentación completa de reglas y casos de uso

## Conclusión

El sistema de análisis iterativo está **completamente funcional** y cumple con todos los requisitos especificados. El sistema soporta:

- ✅ **Análisis de best/worst/average case**: Tres modos de análisis completos
- ✅ **Modelos probabilísticos**: Modelo uniforme y simbólico para caso promedio
- ✅ **Multiplicadores correctos**: Los multiplicadores se aplican correctamente en bucles anidados
- ✅ **Selección de rama dominante**: Worst case selecciona ramas máximas, best case ramas mínimas
- ✅ **Costos descompuestos**: Cada asignación suma constantes por accesos/aritmética
- ✅ **Llamadas como líneas simples**: CALL se trata como línea simple sin expandir
- ✅ **T_open y A_of_n**: Ecuaciones de eficiencia correctas para todos los casos
- ✅ **Procedimiento documentado**: Pasos claros en formato LaTeX
- ✅ **Tests exhaustivos**: Suite completa que cubre casos comunes, intermedios y complejos

El sistema está listo para ser usado en producción y puede analizar cualquier algoritmo iterativo con precisión, generando análisis completos de complejidad temporal para best, worst y average case.
