# Especificación de análisis iterativo

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/analyzers/iterative.py`, `apps/api/app/modules/analysis/visitors/for_visitor.py`, `apps/api/app/modules/analysis/visitors/if_visitor.py`, `apps/api/app/modules/analysis/visitors/simple_visitor.py`, `apps/api/app/modules/analysis/visitors/while_repeat_visitor.py`, `apps/api/app/modules/analysis/utils/summation_closer.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 2.3.1 (análisis iterativo), Sección 3.2 (costeo por línea)

---

## Propósito

Definir el contrato del análisis iterativo línea-por-línea: cómo se cuentan las ejecuciones de cada línea, cómo se construyen las expresiones simbólicas de multiplicidad y cómo se simplifican mediante SymPy.

## Alcance

Aplica a `IterativeAnalyzer`, sus cuatro visitors (For, While/Repeat, If, Simple), y `SummationCloser`. Cubre worst, best y average case para algoritmos iterativos.

## Fuera de alcance

- Análisis recursivo (cubierto por `recurrence-methods-spec.md`)
- Heurísticas WHILE específicas (cubierto por `while-heuristics-spec.md`)
- Algoritmos híbridos (pueden usar `IterativeAnalyzer` como parte de `RecursiveAnalyzer`)

## Contenido

### 1. Principio general

El análisis iterativo asigna a cada línea del pseudocódigo:
1. Un **costo elemental** (`ops`): número de operaciones elementales que ejecuta la línea **cada vez que se ejecuta**.
2. Una **multiplicidad** (`count`): número de veces que la línea se ejecuta, expresado como función del tamaño de entrada.

El costo total es:

```
T_open(n) = Σ C_k · ops_k · count_k(n)
```

Donde:
- `C_k` es una constante simbólica por línea (C_1, C_2, ...).
- `ops_k` es el número de operaciones elementales por ejecución de la línea k.
- `count_k(n)` es la multiplicidad (número de ejecuciones) de la línea k.

### 2. Costos elementales por línea

| Tipo de línea | Costo elemental (`ops`) | Componentes |
|---|---|---|
| Asignación (`x <- expr`) | 1 + ops(lvalue) + ops(expr) | 1 asignación + operaciones del lado izquierdo + operaciones del lado derecho |
| Llamada (`CALL f(args)`) | 1 + Σ ops(arg) | 1 llamada + argumentos |
| Print (`print(args)`) | 1 + Σ ops(arg) | 1 print + argumentos |
| Return (`RETURN expr`) | 1 + ops(expr) | 1 return + expresión |
| IF (guardia) | max(1, ops(test)) | Al menos 1 comparación |
| Declaración vector | 1 | Costo simbólico único |
| Otra | 1 | Default |

#### Operaciones elementales dentro de expresiones

| Expresión | Costo |
|---|---|
| Identificador (`x`) | 0 |
| Literal (`42`) | 0 |
| Aritmética (`a + b`) | 1 |
| Comparación (`a < b`) | 1 |
| Lógica (`a AND b`) | 1 |
| Acceso a arreglo (`A[i]`) | 1 (por dimensión) |
| Field access (`obj.field`) | 1 |
| Unaria (`-x`, `NOT x`) | 1 |

### 3. Multiplicidad por constructo

#### Asignaciones, llamadas, returns, print, declaraciones

```
count = 1 (ejecutan exactamente una vez)
```

Si están dentro de un bucle, la multiplicidad base se multiplica por el factor del bucle.

#### FOR loop

```
Sintaxis: FOR v ← a TO b DO block

Cabecera del FOR (condición): (b - a + 2) evaluaciones (worst case)
Cuerpo del FOR: multiplicado por Σ_{v=a}^{b} 1 iteraciones
```

- **Worst case:** cabecera = `b - a + 2`, cuerpo = `(b - a + 1)` iteraciones.
- **Best case (con early return):** cabecera = 2, cuerpo = 1 iteración.
- **Best case (sin early return):** igual que worst case.
- **Average case:** se aplica modelo probabilístico a `b - a + 1`.
- **Límites:** `a` y `b` se expresan como funciones simbólicas de `n`.
- **Sin STEP:** siempre incremento en 1.
- **FOR anidados:** el multiplicador es producto de los factores de todos los FOR activos (stack de multiplicadores en `loop_stack`).

#### WHILE loop

```
Sintaxis: WHILE (cond) DO block

Condición: (t_while + 1) evaluaciones (t_while = número de iteraciones)
Cuerpo: multiplicado por t_while iteraciones
```

- El número de iteraciones `t_while` se determina mediante el `WhileEngine` (ver `while-heuristics-spec.md`).
- Si el patrón es reconocido con evidencia fuerte, `t_while` se reemplaza por una expresión cerrada (ej. `n`, `log2(n)`, `n/m`).
- Si el patrón es parcial o desconocido, `t_while` permanece como símbolo iterativo `t_{while_L}` (ej. `I_while_5`).
- Si el bucle es unbounded, `t_while → ∞`.

#### REPEAT loop

```
Sintaxis: REPEAT stmt+ UNTIL (cond)

Cuerpo: multiplicado por (1 + t_repeat) iteraciones
Condición: evaluada (1 + t_repeat) veces
```

- El cuerpo siempre se ejecuta al menos una vez.
- `t_repeat` es un símbolo iterativo (`t_{repeat_L}`) que representa el número de iteraciones después de la primera.
- REPEAT no tiene cierre por heurística propia; depende del análisis contextual.
- En worst case, si se puede determinar el número de iteraciones, se reemplaza el símbolo.

#### IF/ELSE

```
Sintaxis: IF (cond) THEN block (ELSE block)?

Guardia: siempre se evalúa 1 vez
THEN: se ejecuta condicionalmente
ELSE: se ejecuta condicionalmente (si existe)
```

- **Worst case:** costo = guardia + MAX(costo_THEN, costo_ELSE). Se toma la rama dominante (la de mayor costo total).
- **Best case:** costo = guardia + MIN(costo_THEN, costo_ELSE). Si no hay ELSE y no hay early return, la rama THEN no se ejecuta.
- **Best case (con early return):** se ejecuta la rama que causa el early return (termina temprano).
- **Average case:** cada rama tiene probabilidad \(p = \frac{1}{2}\) (modelo uniforme) o probabilidad explícita del `avgModel`.
- **IF anidados:** se resuelven recursivamente con la misma lógica.
- **Memoización:** bloques IF/THEN/ELSE se cachean por hash de contexto para evitar re-análisis en bucles.

### 4. Construcción de sumatorias

Cada línea con multiplicidad variable produce una expresión `count_raw_expr` que puede contener sumatorias SymPy:

- FOR con límites `a` y `b`: `Sum(1, (v, a, b))` para el cuerpo.
- FOR anidados: producto de sumatorias.
- WHILE/REPEAT no resueltos: símbolo iterativo `t_{while_L}` o `t_{repeat_L}`.

### 5. Cierre de sumatorias (SymPy)

`SummationCloser` ejecuta:

1. **Evaluación directa de sumatorias SymPy** mediante `Sum.doit()`.
2. **Formas cerradas conocidas:**
   - `Σ_{i=1}^{n} 1 = n`
   - `Σ_{i=1}^{n} i = n(n+1)/2`
   - `Σ_{i=1}^{n} i² = n(n+1)(2n+1)/6`
   - `Σ_{i=1}^{n} c = c·n`
   - `Σ_{i=a}^{b} f(i) = F(b) - F(a-1)` para polinomios
3. **Separación de sumas:** `Σ (a + b) = Σ a + Σ b`.
4. **Factorización de constantes:** `Σ c·f(i) = c·Σ f(i)`.
5. **Simplificación con SymPy:** `simplify()`, `together()`, `factor_terms()`, `powsimp()`.

El cierre se realiza **por línea** (row) y se guarda como `count_closed` + `count_expr` (Expresión SymPy). El resultado final `T_open` se construye sumando todas las contribuciones por línea.

### 6. Sanitización de expresiones

Después del cierre, `_sanitize_expression()`:

1. **Sustituye variables de iteración** (i, j, k, etc.) por 0 o n según contexto.
2. **Sustituye bases de arreglo** (A, B, etc.) por la variable de tamaño principal.
3. **Sustituye alias de tamaño** (ej. `longitud ← n`).
4. **No sustituye por 0** variables que aparecen en límites de sumatorias (parámetros de cota).
5. **No sustituye parámetros escalares** detectados del ProcDef.
6. **Preserva símbolos especiales** (ej. `a`, `b` para Euclides).

### 7. Construcción de T_open

`build_t_open_expr()` suma todas las contribuciones por línea:

```python
T_open_expr = Σ (Integer(ops) * count_expr) para cada fila contable
```

Cada fila es "contable" si tiene `ck != "—"` y `count != "—"`.

### 8. Cálculo de T_polynomial

- Solo cuando **todos** los bloques WHILE tienen estado `available` (cierre exacto).
- Usa `_calculate_t_polynomial_fallback()` que simplifica `T_open_expr` con SymPy.
- Si hay WHILE parciales, `T_polynomial = None`.

### 9. Cálculo de notaciones asintóticas

`ComplexityClasses` recibe la expresión simplificada y calcula:

- `big_o`: término dominante con notación O mayúscula.
- `big_omega`: cota inferior asintótica.
- `big_theta`: cota ajustada si el término superior e inferior coinciden en orden.

### 10. Average case (modo `avg`)

#### Modelo probabilístico

```typescript
AvgModelConfig {
  mode: "uniform" | "symbolic";
  predicates?: Record<string, string>;  // ej. {"A[j] > A[j+1]": "1/2"}
}
```

- **`mode = "uniform"`:** cada condición tiene probabilidad \(p = \frac{1}{2}\). Se usa para búsqueda lineal, insertion sort, etc.
- **`mode = "symbolic"`:** las probabilidades se toman de `predicates`. Útil para modelos con probabilidades asimétricas.

#### Líneas con early return

En average case con early return (ej. búsqueda lineal):
- `return i` (éxito): `E[N_l] = 1` (ocurre exactamente una vez, no multiplicado por E[iteraciones]).
- `return -1` (fracaso): `E[N_l] = 0` (nunca ocurre en el modelo de éxito temprano).

#### Expresión A(n)

```
A(n) = (1/|I_n|) · Σ_{I ∈ I_n} T(I)   (uniforme)
A(n) = Σ_{I} T(I) · p(I)               (simbólico)
```

Se construye en `_generate_avg_procedure()` con 4 pasos:
1. Definir caso promedio y modelo probabilístico.
2. Determinar `E[N_l]` por línea.
3. Construir `A(n)` completa.
4. Simplificar y concluir notación asintótica.

### 11. Procedimiento de 4 pasos (worst/best)

`_generate_iterative_four_step_procedure()`:
1. Determinar líneas contables según el caso.
2. Determinar ejecuciones por línea y resolver sumatorias.
3. Sumar costos para obtener `T(n)` completa.
4. Simplificar y concluir notación asintótica.

Cada línea también produce su propio `line_procedure` (detalle de contabilidad + cierre) y `procedure` (pasos completos con sumatorias resueltas).

## Contrato

1. Cada línea analizable produce exactamente una fila en `byLine`.
2. El identificador `ck` es único por línea y secuencial (C_1, C_2, ...).
3. La multiplicidad `count` es siempre una expresión simplificada (string KaTeX).
4. `count_raw` preserva la expresión con sumatorias sin simplificar.
5. `T_open` es la suma de todas las contribuciones por línea (constantes C_k incluidas).
6. `T_polynomial` solo se publica si todos los bucles tienen cierre exacto.
7. Las notaciones asintóticas son siempre coherentes: `big_omega` ≤ `big_theta` ≤ `big_o`.

## Invariantes

- Misma entrada → mismas filas, mismos `ck`, mismos `count`.
- El orden de las filas en `byLine` sigue el orden de las líneas del código fuente.
- Las constantes `C_k` se asignan secuencialmente (no hay reuso de constantes).
- Si un bucle WHILE es `unbounded`, todas las filas dentro de él también son `unbounded`.
- El `SummationCloser` no modifica el AST ni los multiplicadores en `loop_stack`.

## Errores esperables

| Condición | Comportamiento |
|---|---|
| Límite de FOR no numérico | Expresión simbólica preservada |
| WHILE sin patrón reconocido | `count = t_{while_L}`, estado `unknown` |
| REPEAT sin cierre | `count = t_{repeat_L}` |
| Cierre de sumatoria falla | Fallback a string LaTeX, procedimiento mínimo |
| Bucle sin variable de control | `unbounded = true`, `T_open = \infty` |
| IF sin alternate | Rama ELSE ausente, worst case = THEN |

## Casos soportados

### Ejemplo 1: FOR simple
```
sumaArreglo(A[n]) BEGIN
  suma <- 0;              // C_1 * 1
  FOR i <- 1 TO n DO BEGIN
    suma <- suma + A[i];  // C_2 * n
  END
END
```
- `T_open = C_1 + C_2 · n`
- `T_polynomial = C_2 · n + C_1`
- `big_o = "O(n)"`, `big_theta = "Θ(n)"`

### Ejemplo 2: FOR anidado (bubble sort)
```
burbuja(A[n]) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n-1 DO BEGIN
      IF (A[j] > A[j+1]) THEN BEGIN
        temp <- A[j];
        A[j] <- A[j+1];
        A[j+1] <- temp;
      END
    END
  END
END
```
- `T_open = C_1 + C_2·(n+1) + C_3·n·(n) + C_4·n·(n-1) + ...`
- `big_o = "O(n^2)"`, `big_theta = "Θ(n^2)"`

### Ejemplo 3: WHILE lineal
```
busquedaLineal(A[n], x) BEGIN
  i <- 1;                   // C_1 * 1
  WHILE (i <= n AND A[i] != x) DO BEGIN
    i <- i + 1;             // C_2 * t_while
  END
  RETURN i;                 // C_3 * 1
END
```
- Worst: `t_while = n`, `T_open = C_1 + C_2·n + C_3`
- Best: `t_while = 1`, `T_open = C_1 + C_2·1 + C_3`
- Avg: `t_while = (n+1)/2`, `A(n) = C_1 + C_2·(n+1)/2 + C_3`

### Ejemplo 4: REPEAT-UNTIL
```
buscar(A[n], x) BEGIN
  i <- 1;                   // C_1 * 1
  REPEAT
    IF (A[i] = x) THEN RETURN i;  // C_2 * (1 + t_repeat)
    i <- i + 1;             // C_3 * (1 + t_repeat)
  UNTIL (i > n);
  RETURN -1;                // C_4 * 1
END
```
- El cuerpo se ejecuta `(1 + t_repeat)` veces, donde `t_repeat = n-1` en worst case.

## Casos no soportados

### Límites no constantes y dependientes de datos

Cuando la multiplicidad de un bucle depende de datos de entrada que no pueden expresarse como función simbólica de `n`.

```
// No soportado: bucle con condición impredecible
WHILE (A[i] != x) DO BEGIN
  i <- i + 1;
END
```
El `WhileEngine` intenta patrones; si no hay patrón reconocido, queda como `unknown`.

### Bucles con múltiples variables acopladas

```
// No soportado completamente: progreso no monótono
WHILE (i < n OR j < m) DO BEGIN
  i <- i + j;
  j <- j - i;
END
```

## Evidencia desde código o configuración

- **Visitor FOR:** `apps/api/app/modules/analysis/visitors/for_visitor.py` — implementa conteo de cabecera y cuerpo.
- **Visitor IF:** `apps/api/app/modules/analysis/visitors/if_visitor.py` — branching cost con max/min.
- **Visitor WHILE/REPEAT:** `apps/api/app/modules/analysis/visitors/while_repeat_visitor.py` — 2768 líneas, incluye integración con `WhileEngine`.
- **Visitor Simple:** `apps/api/app/modules/analysis/visitors/simple_visitor.py` — asignaciones, llamadas, returns.
- **SummationCloser:** `apps/api/app/modules/analysis/utils/summation_closer.py` — 2485 líneas, cierre de sumatorias con SymPy.
- **IterativeAnalyzer:** `apps/api/app/modules/analysis/analyzers/iterative.py` — 1929 líneas, orquesta todos los visitors.
- **Modelo promedio:** `apps/api/app/modules/analysis/models/avg_model.py` — manejo de `AvgModelConfig`.

## Limitaciones

- Los límites de FOR deben ser expresiones evaluables simbólicamente; límites no lineales o condicionales pueden quedar sin cierre exacto.
- REPEAT no tiene motor heurístico propio; depende de que el contexto externo determine `t_repeat`.
- WHILE complejos (múltiples variables acopladas, progreso no demostrable) quedan en estado `unknown` o `bounded` sin cierre exacto.
- El average case con modelo uniforme asume distribución uniforme de datos de entrada; esto no es apropiado para todos los algoritmos.
- `ops` por línea es una estimación conservadora; no distingue entre tipos de acceso a memoria.

## Archivos relacionados

- `analysis-engine-spec.md` — pipeline general
- `while-heuristics-spec.md` — heurísticas de cierre WHILE
- `ast-schema.md` — AST que recorren los visitors
- `pseudocode-grammar-spec.md` — gramática de entrada
- `algorithm-classification-spec.md` — clasificación de algoritmos
