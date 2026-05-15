# Especificación de métodos de recurrencia

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/analyzers/recursive.py`, `apps/api/app/modules/analysis/analyzers/characteristic_steps.py`, `apps/api/app/modules/analysis/analyzers/iteration_steps.py`, `apps/api/app/modules/analysis/analyzers/master_steps.py`, `apps/api/app/modules/analysis/analyzers/recursion_tree_steps.py`, `apps/api/app/modules/analysis/analyzers/base.py`, `apps/api/app/modules/export/snapshot_builder.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 4.3 — Análisis de recurrencias

## Propósito

Definir qué métodos de resolución de recurrencias soporta AALIE, cómo se detectan, qué familias de recurrencia se reconocen, qué salida mínima debe producir cada método, y cómo se comporta el endpoint `detect-methods`.

## Alcance

Aplica a `RecursiveAnalyzer.analyze()`, `RecursiveAnalyzer.detect_applicable_methods()`, los cuatro bundles paso a paso (`characteristic_steps`, `iteration_steps`, `master_steps`, `recursion_tree_steps`), y a la serialización de recurrencias en el snapshot de export.

## Fuera de alcance

No cubre: análisis de WHILE loops iterativos, demostración general de propiedades de puntos fijos, análisis de recurrencias probabilísticas.

## Contenido

### 1. Familias de recurrencia

AALIE reconoce dos familias canónicas:

**`linear_shift`** (Resta y Vencerás / Resta y Serás Vencido):
```
T(n) = a·T(n-b) + f(n)
```
- Una o múltiples ramas recursivas con desplazamiento constante del argumento.
- Si `a=1` y `f(n)=Θ(1)` → O(n) (Resta y Vencerás).
- Si `a>1` o `f(n)` no constante → puede degradar a exponencial o peor (Resta y Serás Vencido).
- Ejemplos: factorial `T(n) = T(n-1) + Θ(1)`, fibonacci `T(n) = T(n-1) + T(n-2) + Θ(1)`.

**`divide_conquer`** (Divide y Vencerás):
```
T(n) = a·T(n/b) + f(n)
```
- Subproblemas de tamaño fraccional homogéneo, combinación separable.
- `a ≥ 1`, `b > 1`.
- Ejemplos: merge sort `T(n) = 2T(n/2) + Θ(n)`, binary search `T(n) = T(n/2) + Θ(1)`.

**`divide_conquer_multi`**: variante con términos múltiples de diferentes `(a_i, b_i)`.

### 2. Métodos soportados

| Método | Familia primaria | Prioridad | Descripción |
|--------|-----------------|-----------|-------------|
| `characteristic_equation` | `linear_shift` | 1 (linear_shift) | Resuelve recurrencias lineales homogéneas + particular mediante ecuación característica, raíces y solución cerrada. |
| `iteration` | Ambas | 2 (linear_shift), 3 (divide_conquer) | Expande la recurrencia iterativamente hasta detectar patrón; útil como alternativa pedagógica. |
| `recursion_tree` | Ambas | 3 (linear_shift), 2 (divide_conquer) | Construye árbol de expansión; especialmente útil para divide-and-conquer. |
| `master` | `divide_conquer` | 1 (divide_conquer) | Aplica el Teorema Maestro (3 casos) con verificación de regularidad. |

### 3. Prioridades por familia

**`linear_shift`**: `characteristic_equation` > `iteration` > `recursion_tree`
**`divide_conquer`**: `master` > `recursion_tree` > `iteration`

La detección de familia precede a la selección de método: primero se clasifica la forma de recurrencia y después se aplica la prioridad.

### 4. Endpoint `detect-methods`

El método `RecursiveAnalyzer.detect_applicable_methods(ast)` retorna:

```json
{
  "ok": true,
  "applicable_methods": ["master", "recursion_tree", "iteration"],
  "default_method": "master",
  "recurrence_info": {
    "type": "divide_conquer",
    "form": "T(n) = 2T(n/2) + n",
    "a": 2,
    "b": 2,
    "f": "n",
    "method_outcomes": {
      "characteristic_equation": {
        "applicable": false,
        "recommended": false,
        "bound_kind": "partial",
        "bound_strength": "partial",
        "bound_symbol": "partial"
      },
      "iteration": {
        "applicable": true,
        "recommended": false,
        "bound_kind": "upper",
        "bound_strength": "partial",
        "bound_symbol": "big_o"
      },
      "recursion_tree": {
        "applicable": true,
        "recommended": false,
        "bound_kind": "equivalent",
        "bound_strength": "strong",
        "bound_symbol": "theta"
      },
      "master": {
        "applicable": true,
        "recommended": true,
        "bound_kind": "equivalent",
        "bound_strength": "strong",
        "bound_symbol": "theta"
      }
    }
  }
}
```

**`method_outcomes`** describe por cada método: `applicable` (bool), `recommended` (coincide con `default_method`), `bound_kind` (`equivalent` | `upper` | `lower` | `partial`), `bound_strength` (`strong` si `equivalent`, sino `partial`), `bound_symbol` (`theta` | `big_o` | `big_omega` | `partial`).

La detección de cada método es independiente:
- `linear_shift` → evalúa `characteristic_equation`, `iteration`, y opcionalmente `recursion_tree` (solo si desplazamientos consecutivos).
- `divide_conquer` → evalúa `master` (siempre), `recursion_tree` (si `b` válido), `iteration` (si `a=1` o trabajo polinomial manejable).
- `divide_conquer_multi` → solo `recursion_tree` como `upper`.

### 5. Step bundles por método

Cada método expone un bundle paso a paso con esta estructura:

**`master_steps`**:
1. Detected recurrence — forma canónica
2. Master-form validation — validación de aplicabilidad
3. Extracted parameters — a, b, f(n)
4. Critical exponent — log_b(a)
5. Reference growth — comparación n^log_b(a) vs f(n)
6. Growth comparison — límite f(n)/n^log_b(a)
7. Case evaluation — Caso 1/2/3
8. Regularity check — condición de regularidad (Caso 3)
9. Applicability decision — decisión final
10. Asymptotic conclusion — Θ

**`iteration_steps`**:
1. Normalize recurrence
2. Expand recurrence (k steps)
3. Generalize after k steps
4. Solve k with base case
5. Compare with dominating recurrence (si no hay cierre exacto)
6. Convert to summation
7. Simplify summation
8. Conclude with bound_kind

**`recursion_tree_steps`**:
1. Build tree structure
2. Compute level costs
3. Sum across levels
4. Conclude asymptotic bound

**`characteristic_equation_steps`**:
1. Form characteristic equation
2. Find roots
3. Build homogeneous solution
4. Find particular solution
5. Combine general solution
6. Apply base cases
7. Conclude Θ

### 6. Estados de salida

Cada bundle puede terminar en uno de estos estados:

| Estado | Significado | Acción |
|--------|-------------|--------|
| `conclusive` | El método produjo un resultado exacto (Θ). | Se usa como salida principal. |
| `partial` | El método produjo una cota de un lado (O/Ω) o una forma simbólica no cerrada. | Se señala explícitamente en metadata y explicación pedagógica. |
| `unsupported` | El método no es aplicable a esta recurrencia. | Se falla explícitamente; no se finge aplicabilidad. |

### 7. Invariantes

1. `characteristic_equation` solo aplica a familias `linear_shift` bajo cobertura.
2. `master` se reserva para `divide_conquer` de forma canónica.
3. `recursion_tree` e `iteration` pueden coexistir con el método por defecto.
4. Si el método no aplica, el motor debe fallar de forma explícita o degradar a `partial`, nunca fingir aplicabilidad.
5. `default_method` debe ser coherente con la familia detectada.
6. Un método aplicable no puede publicarse si contradice la familia de recurrencia inferida.
7. `method_outcomes` debe ser consistente: si `applicable=false`, `recommended` debe ser `false`.
8. La detección de familia precede a la selección de método.

### 8. Errores esperables

- Procedimiento principal ausente → `errors: ["No se encontró un procedimiento principal"]`.
- Recurrencia no extraíble → `errors: ["No se pudieron determinar los tamaños de los subproblemas"]`.
- Método preferido inválido → `errors: ["Método preferido inválido: {name}"]`.
- Forma recursiva fuera de cobertura → `errors: ["No aplicable: {reason}"]`.
- Extracción de recurrencia falla → `errors: ["Error extrayendo recurrencia: {reason}"]`.
- Ecuación característica falla → `errors: ["Error aplicando Método de Ecuación Característica: {reason}"]`.
- Mezcla de tipos de subproblemas → `errors: ["Subproblemas de tipos distintos"]`.

### 9. Casos soportados (canónicos)

1. **Merge Sort**: `T(n) = 2T(n/2) + Θ(n)` → Master Caso 2 → `Θ(n log n)`
2. **Binary Search**: `T(n) = T(n/2) + Θ(1)` → Master Caso 2 → `Θ(log n)`
3. **Factorial**: `T(n) = T(n-1) + Θ(1)` → Iteración → `Θ(n)`
4. **Fibonacci (ingenuo)**: `T(n) = T(n-1) + T(n-2) + Θ(1)` → Ecuación característica → `Θ(φ^n)`
5. **Fibonacci (PD)**: `T(n) = T(n-1) + Θ(1)` → Iteración → `Θ(n)`
6. **Subset sum (ingenuo)**: llamada recursiva dentro de FOR → `T(n) = n·T(n-1) + Θ(1)` → `Θ(n!)` o `Θ(2^n)`

### 10. Casos no soportados

1. **Recurrencias no lineales**: formas como `T(n) = T(n-1)^2 + Θ(1)`.
2. **Tamaños de subproblema no inferibles**: cuando el análisis del AST no puede determinar el patrón de reducción.
3. **Splits no uniformes**: `T(n) = T(n/3) + T(2n/3) + Θ(n)` — fuera del `divide_conquer` canónico (se requiere `divide_conquer_multi`).
4. **`f(n)` no polinomial**: `T(n) = 2T(n/2) + Θ(n!)` — el Teorema Maestro no puede comparar crecimiento.
5. **Recurrencias con acceso a campo de objeto sin heurística**: el motor aplica heurísticas conservadoras (`object_field_access_tree`, `object_field_access_list`) que pueden no capturar la forma exacta.

### 11. Evidencia

- La detección de métodos en `recursive.py:detect_applicable_methods()` evalúa cada método independientemente por familia.
- `_build_method_outcomes()` en `recursive.py` produce el mapa `method_outcomes` con `bound_kind`, `bound_strength`, `bound_symbol`.
- `_normalize_recurrence()` en `snapshot_builder.py` normaliza la recurrencia para export (versiones `divide_conquer`, `divide_conquer_multi`, `linear_shift`).
- Los step bundles (`master_steps.py`, `iteration_steps.py`, etc.) contienen el procedimiento pedagógico completo.

### 12. Limitaciones

- Algunos bundles pueden terminar en `partial` o `unsupported` y aun así ser la salida correcta del sistema.
- La metadata de PD es auxiliar y no reemplaza el método principal de complejidad.
- El selector puede ofrecer métodos no recomendados siempre que su alcance matemático quede señalado como `equivalent`, `upper`, `lower` o `partial`.
- La reconstrucción de árbol de recurrencia simbólico completo no está implementada (`not_implemented` en snapshot).

## Archivos relacionados

- `analysis-engine-spec.md`
- `execution-trace-spec.md`
- `report-snapshot-spec.md`
- `../04-api/analysis-api.md`
