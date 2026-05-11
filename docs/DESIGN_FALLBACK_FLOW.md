# Diseño: Flujo de Fallback y Notación Asintótica Consistente

## Problema

El sistema calcula correctamente la ecuación de recurrencia, pero:
- **Método "applicable"**: El método está marcado como aplicable
- **Notación incorrecta**: El step-by-step usa Θ (exacta) cuando debería usar O/Ω (cotas)

**Ejemplo: Fibonacci con Recursion Tree**
- Fibonacci: T(n) = T(n-1) + T(n-2) + Θ(1)
- Recursion Tree detecta: bound_kind = "upper" (no es exacto)
- Pero genera: T(n) = Θ(φⁿ) ← INCORRECTO
- Debería generar: T(n) = O(φⁿ) ← CORRECTO

---

## Causa Raíz

El contexto usado para generar step-by-step bundles **no incluye `bound_kind`**:

```
┌──────────────────────────────────┐
│ detect_applicable_methods()      │
│ (retorna method_outcomes con     │
│  bound_kind: "equivalent",       │
│  "upper", "lower", "partial")   │
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Frontend: Usuario selecciona     │
│ método                           │
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Backend: analyze(method=...)     │
│ [bound_kind NO se pasa aquí]     │
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ build_*_step_bundle(ctx)         │
│ [ctx NO contiene bound_kind]     │
│ ⟹ SIEMPRE genera Θ              │
└──────────────────────────────────┘
```

---

## Solución: Pasar bound_kind a Contextos

### 1. Actualizar Firma de Contextos

Para cada método, agregar `bound_kind`:

```python
@dataclass
class RecursionTreeStepContext:
    # ... campos existentes ...
    bound_kind: str  # "equivalent" | "upper" | "lower" | "partial"
    locale: str
    recurrence_form: str
    # ...
```

Igual para:
- `CharacteristicStepContext`
- `IterationStepContext`
- `MasterStepContext`

### 2. Lógica de Notación en Bundles

En `build_*_step_bundle()`, usar `bound_kind` para decidir:

```python
def get_asymptotic_notation(bound_kind: str, result: str) -> str:
    """
    Convierte resultado a notación correcta según bound_kind.
    
    Args:
        bound_kind: "equivalent" | "upper" | "lower" | "partial"
        result: Expresión asintótica (ej. φⁿ, n², n)
    
    Returns:
        Notación asintótica (ej. Θ(φⁿ), O(n²), Ω(n))
    """
    if bound_kind == "equivalent":
        return f"\\Theta({result})"        # Θ(...)
    elif bound_kind == "upper":
        return f"\\mathcal{{O}}({result})"  # O(...)
    elif bound_kind == "lower":
        return f"\\Omega({result})"         # Ω(...)
    else:  # "partial"
        return f"\\approx {result}"         # Aproximado
```

### 3. Donde Pasa bound_kind

En `recursive.py`, línea ~8749 (RecursionTreeStepContext):

```python
# ANTES:
step_ctx = RecursionTreeStepContext(
    locale=self.locale,
    recurrence_form=recurrence_form,
    # ... sin bound_kind ...
)

# DESPUÉS:
# 1. Obtener bound_kind del método_outcomes
bound_kind = self.method_outcomes.get(self.method, {}).get("bound_kind", "partial")

# 2. Pasarlo al contexto
step_ctx = RecursionTreeStepContext(
    locale=self.locale,
    recurrence_form=recurrence_form,
    bound_kind=bound_kind,  # ← NUEVO
    # ...
)
```

---

## Árboles de Decisión

### Árbol 1: Detectar Métodos Aplicables (YA IMPLEMENTADO)

```
┌─────────────────────────────────────────────────────────────┐
│ Extraer recurrencia de AST                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │ ¿Qué tipo?          │
          └──────────┬──────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐  ┌────▼───┐  ┌────▼────┐
   │linear  │  │divide  │  │otro     │
   │_shift  │  │_conquer│  │         │
   └────┬───┘  └────┬───┘  └────┬────┘
        │           │            │
   Característica  Master      Heurística
   Iteración       Árbol       Conservadora
   Árbol*          Iteración   
   
   (* = solo casos pedagógicos)
```

### Árbol 2: Asignar bound_kind (YA IMPLEMENTADO)

```
┌─────────────────────────────────────┐
│ Método detectado como aplicable     │
│ método ∈ applicable_methods         │
└────────────────────┬────────────────┘
                     │
          ┌──────────▼──────────┐
          │ Tipo de recurrencia │
          └──────────┬──────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐  ┌────▼───┐  ┌────▼────┐
   │linear  │  │divide  │  │otra     │
   │_shift  │  │_conquer│  │         │
   └────┬───┘  └────┬───┘  └────┬────┘
        │           │            │
        │      ┌────┴─────┐      │
        │      │           │      │
        │  ┌───▼───┐  ┌───▼──┐   │
        │  │master │  │otro  │   │
        │  └───┬───┘  └───┬──┘   │
        │      │          │      │
   car = "equ" |    ┌─────┴──┐   │
   ite = "equ" |    │        │   │
   arb = "upp" |┌───▼───┐┌───▼──┐├──→ "partial"
               ││arbv   │└──────┘│
               │└───┬───┘    │   │
               │    └─"equ"──┘   │
               │ ite="upp" si no geom
               │ ite="equ" si geom
```

### Árbol 3: Notación en Step-by-Step (NUEVO)

```
┌──────────────────────────────────────┐
│ Usuario selecciona método M          │
│ Sistema tiene method_outcomes[M]     │
│ con bound_kind ∈ {equ, upp, low, pt}│
└────────────────────┬─────────────────┘
                     │
          ┌──────────▼──────────┐
          │ Generar step-by-step│
          │ paso a RecursionTree│
          │ StepContext         │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ bound_kind?         │
          └──────────┬──────────┘
                     │
        ┌────────────┼────────────────┬────────────┐
        │            │                │            │
   ┌────▼───┐  ┌────▼───┐      ┌────▼───┐  ┌────▼──┐
   │ equ    │  │ upp    │      │ low    │  │ partial│
   │        │  │        │      │        │  │        │
   │Θ notac.│  │O notac.│      │Ω nota. │  │Approx. │
   │        │  │        │      │        │  │        │
   └────┬───┘  └────┬───┘      └────┬───┘  └────┬───┘
        │           │                │           │
        │      ┌────▼────────┐       │           │
        │      │ Paso 11:    │       │           │
        │      │ Conclusión  │       │           │
        │      │ Asintótica  │       │           │
        │      └────┬────────┘       │           │
        │           │                │           │
        │      T(n)=Θ(...)      T(n)=O(...)     │
        │           │           T(n)=Ω(...)     │
        └───────────┴────────────────┴───────────┘
```

---

## Ejemplo Detallado: Fibonacci con Recursion Tree

### Input

```
PROCEDURE fibonacci(n) BEGIN
  IF n <= 1 THEN RETURN n
  RETURN fibonacci(n-1) + fibonacci(n-2)
END
```

### Fase 1: Detección (detect_applicable_methods)

```json
{
  "recurrence": {
    "type": "linear_shift",
    "form": "T(n) = T(n-1) + T(n-2) + Θ(1)",
    "order": 2,
    "shifts": [1, 2],
    "g(n)": "Θ(1)"
  },
  "applicable_methods": [
    "characteristic_equation",
    "recursion_tree"
  ],
  "default_method": "characteristic_equation",
  "method_outcomes": {
    "characteristic_equation": {
      "applicable": true,
      "recommended": true,
      "bound_kind": "equivalent",     // ← Exacta: Θ seguro
      "bound_symbol": "theta"
    },
    "recursion_tree": {
      "applicable": true,
      "recommended": false,
      "bound_kind": "upper",          // ← COTA: O, no Θ
      "bound_symbol": "big_o"
    }
  }
}
```

### Fase 2: Usuario Selecciona recursion_tree

Usuario clickea "recursion_tree" en frontend.

### Fase 3: Backend Genera Step-by-Step (analyze endpoint)

**ANTES (Incorrecto):**
```python
# NO pasa bound_kind
step_ctx = RecursionTreeStepContext(
    locale="es",
    recurrence_form="T(n) = T(n-1) + T(n-2) + Θ(1)",
    # ... sin bound_kind ...
)
bundle = build_recursion_tree_step_bundle(step_ctx)

# Resultado: Paso 11 genera
theta_latex = "T(n) = Θ(φⁿ)"  # ← INCORRECTO
```

**DESPUÉS (Correcto):**
```python
# Obtener bound_kind del método_outcomes
bound_kind = "upper"  # ← Extraído de method_outcomes["recursion_tree"]["bound_kind"]

step_ctx = RecursionTreeStepContext(
    locale="es",
    recurrence_form="T(n) = T(n-1) + T(n-2) + Θ(1)",
    bound_kind=bound_kind,  # ← NUEVO
    # ...
)
bundle = build_recursion_tree_step_bundle(step_ctx)

# Resultado: Paso 11 genera
theta_latex = "T(n) = O(φⁿ)"  # ← CORRECTO
```

### Fase 4: Frontend Muestra

**Paso 11: Conclusión Asintótica**
- Status: "complete" (método es aplicable)
- Notación: O (porque bound_kind = "upper")
- Resultado: **T(n) = O(φⁿ)**
- Nota: "Árbol no está balanceado → es una cota superior, no exacta"

---

## Reglas de Asignación de bound_kind (Actualizado)

### Para linear_shift

| Método | Condición | bound_kind | Notación |
|--------|-----------|------------|----------|
| characteristic_equation | Siempre aplicable | "equivalent" | Θ |
| iteration | Siempre aplicable | "equivalent" | Θ |
| recursion_tree | Casos pedagógicos (Fibonacci, ramas densas) | "upper" | O |
| master | No aplica | "partial" | — |

### Para divide_conquer

| Método | Condición | bound_kind | Notación |
|--------|-----------|------------|----------|
| master | Siempre | "equivalent" | Θ |
| recursion_tree | Siempre | "equivalent" | Θ |
| iteration | Si rama única geométrica (T(n)=T(n/b)+Θ(1)) | "equivalent" | Θ |
| iteration | Si rama múltiple no geométrica | "upper" | O |
| characteristic_equation | No aplica | "partial" | — |

---

## Implementación: Checklist

### Backend (Python)

- [ ] **Paso 1:** Agregar `bound_kind: str` a todos los contextos de step
  - [ ] RecursionTreeStepContext
  - [ ] CharacteristicStepContext
  - [ ] IterationStepContext
  - [ ] MasterStepContext

- [ ] **Paso 2:** En `recursive.py`, pasar `bound_kind` al construir contextos
  - [ ] Línea ~8749 (recursion_tree): Extraer `bound_kind` de `self.method_outcomes`
  - [ ] Similar para characteristic_equation, iteration, master

- [ ] **Paso 3:** En cada `build_*_step_bundle()`, usar `bound_kind` para notación
  - [ ] Función auxiliar: `get_asymptotic_notation(bound_kind, result)`
  - [ ] recursion_tree_steps.py: Reemplazar `ctx.theta_latex` en conclusión
  - [ ] characteristic_steps.py: Idem
  - [ ] iteration_steps.py: Idem
  - [ ] master_steps.py: Idem

- [ ] **Paso 4:** Agregar nota pedagógica cuando bound_kind ≠ "equivalent"
  - [ ] En cada paso final, mostrar: "Este método aporta una cota {O|Ω}, no una solución exacta Θ"

### Frontend (TypeScript)

- [ ] **Paso 1:** MethodSelector ya muestra `bound_kind` con badge
  - [ ] Verificar que tooltip explique la diferencia

- [ ] **Paso 2:** En StepByStepView, mostrar notación correcta
  - [ ] Si bound_kind ≠ "equivalent", resaltar que es cota
  - [ ] Ejemplo: "O(n²) es cota superior, no exacto"

### Tests

- [ ] **Paso 1:** Actualizar tests de detect_methods
  - [ ] Verificar `method_outcomes[method]["bound_kind"]`

- [ ] **Paso 2:** Agregar tests para notación en step-by-step
  - [ ] `test_recursion_tree_fibonacci_uses_big_o_notation`
  - [ ] Afirmar: `"\\mathcal{O}(" in step11_latex` para Fibonacci
  - [ ] Afirmar: `"\\Theta(" not in step11_latex` para Fibonacci

---

## Fallback (Futuro)

Si un usuario selecciona un método no-exacto, podría haber un botón:
- **"Método aproximado"** con nota
- **"Usar método exacto"** que redirige al método recomendado (characteristic_equation)

```python
def suggest_exact_method(method: str, applicable_methods: list) -> Optional[str]:
    """
    Si el usuario selecciona un método no-exacto,
    sugerir una alternativa exacta.
    """
    if method in ["recursion_tree", "iteration"]:
        # Buscar método exacto
        for exact_method in ["characteristic_equation", "master"]:
            if exact_method in applicable_methods:
                return exact_method
    return None
```

---

## Resumen

| Componente | Cambio | Impacto |
|---|---|---|
| `_infer_method_bound_kind()` | YA EXISTE | Determinación correcta de bound_kind |
| Contextos de Step | Agregar `bound_kind` | Información disponible en bundles |
| `build_*_step_bundle()` | Usar `bound_kind` para notación | Notación Θ/O/Ω correcta |
| Tests | Nuevas asserciones | Cobertura de notación |
| Docs | Aclarar bound_kind | Usuarios entienden diferencia |

**Resultado Final:**
- ✅ Método "applicable" + notación consistente (O, no Θ)
- ✅ Sin romper sistema existente (bound_kind YA está calculado)
- ✅ Pedagógico: usuarios entienden "cota" vs "exacto"
