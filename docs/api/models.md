# Modelos de Datos

Especificación completa de los modelos de datos utilizados en la API, tanto en Python (Pydantic) como sus equivalentes TypeScript.

## Modelos de Request

### AnalyzeRequest

Modelo para solicitudes de análisis de complejidad.

**Python (Pydantic):**

```python
class AvgModelConfig(BaseModel):
    mode: str = "uniform"  # "uniform" | "symbolic"
    predicates: Optional[Dict[str, str]] = None

class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg" | "all"
    api_key: Optional[str] = None
    avgModel: Optional[AvgModelConfig] = None
    algorithm_kind: Optional[str] = None  # "iterative" | "recursive" | "hybrid" | "unknown"
    preferred_method: Optional[str] = None  # "master" | "iteration" | "recursion_tree" | "characteristic_equation"
```

**TypeScript:**

```typescript
interface AvgModelConfig {
  mode: "uniform" | "symbolic";
  predicates?: Record<string, string>;
}

interface AnalyzeRequest {
  source: string;
  mode?: "worst" | "best" | "avg" | "all";
  api_key?: string;
  avgModel?: AvgModelConfig;
  algorithm_kind?: "iterative" | "recursive" | "hybrid" | "unknown";
  preferred_method?: "master" | "iteration" | "recursion_tree" | "characteristic_equation";
}
```

---

## Modelos de Response

### ParseResponse

Respuesta del endpoint `/grammar/parse`.

**Python:**

```python
{
    "ok": bool,
    "available": bool,
    "runtime": str,  # "python"
    "error": Optional[str],
    "ast": Optional[Dict[str, Any]],
    "errors": List[Dict[str, Any]]
}
```

**TypeScript:**

```typescript
interface ParseError {
  line: number;
  column: number;
  message: string;
}

interface ParseResponse {
  ok: boolean;
  available: boolean;
  runtime: string;
  error: string | null;
  ast: Program | null;
  errors: ParseError[];
}
```

---

### AnalyzeOpenResponse

Respuesta del endpoint `/analyze/open` para un caso individual.

**Python:**

```python
class LineCost(BaseModel):
    line: int
    kind: str  # "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other"
    ck: str
    count: str
    count_raw: str
    note: Optional[str] = None

class AnalyzeOpenResponse(BaseModel):
    ok: bool = True
    byLine: List[LineCost]
    totals: Dict[str, Any]
```

**TypeScript:**

```typescript
interface LineCost {
  line: number;
  kind: "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other";
  ck: string;
  count: string;
  count_raw: string;
  note?: string | null;
}

interface AnalyzeOpenResponse {
  ok: boolean;
  byLine: LineCost[];
  totals: {
    T_open: string;
    procedure?: Array<{
      step: number;
      description: string;
      formula: string;
    }>;
    recurrence?: {
      form: string;
      a?: number;
      b?: number;
      f?: string;
      n0?: number;
      type?: "divide_conquer" | "linear_shift";
      order?: number;
      shifts?: number[];
      coefficients?: number[];
      "g(n)"?: string;
      applicable?: boolean;
      notes?: string[];
    };
    master?: {
      case: 1 | 2 | 3 | null;
      nlogba: string;
      comparison: "smaller" | "equal" | "larger" | null;
      regularity?: {
        checked: boolean;
        note: string;
      };
      theta: string | null;
    };
    iteration?: {
      steps: Array<{
        iteration: number;
        formula: string;
      }>;
      closed_form?: string;
      theta: string | null;
    };
    recursion_tree?: {
      levels: Array<{
        level: number;
        num_nodes: number;
        num_nodes_latex: string;
        subproblem_size_latex: string;
        cost_per_node_latex: string;
        total_cost_latex: string;
      }>;
      height: string;
      theta: string | null;
    };
    characteristic_equation?: {
      method: "characteristic_equation";
      is_dp_linear: boolean;
      equation: string;
      roots: Array<{
        root: string;
        multiplicity: number;
      }>;
      homogeneous_solution: string;
      particular_solution?: string;
      general_solution?: string;
      base_cases?: Record<string, number>;
      closed_form: string;
      dp_version?: {
        code: string;
        time_complexity: string;
        space_complexity: string;
        recursive_complexity: string;
      };
      dp_optimized_version?: {
        code: string;
        time_complexity: string;
        space_complexity: string;
      };
      dp_equivalence: string;
      theta: string | null;
    };
    proof?: Array<{
      id: string;
      text: string;
    }>;
  };
}
```

---

### AnalyzeAllResponse

Respuesta del endpoint `/analyze/open` cuando `mode="all"`.

**TypeScript:**

```typescript
interface AnalyzeAllResponse {
  ok: boolean;
  has_case_variability: boolean;
  worst: AnalyzeOpenResponse;
  best: AnalyzeOpenResponse | "same_as_worst";
  avg?: AnalyzeOpenResponse | "same_as_worst" | null;
}
```

---

### ClassifyResponse

Respuesta del endpoint `/classify`.

**Python:**

```python
{
    "ok": bool,
    "kind": "iterative" | "recursive" | "hybrid" | "unknown",
    "method": str,  # "ast"
    "errors"?: List[Dict[str, Any]]
}
```

**TypeScript:**

```typescript
interface ClassifyResponse {
  ok: boolean;
  kind: "iterative" | "recursive" | "hybrid" | "unknown";
  method: string;
  errors?: Array<{
    message: string;
    line?: number | null;
    column?: number | null;
  }>;
}
```

---

### DetectMethodsResponse

Respuesta del endpoint `/analyze/detect-methods`.

**Python:**

```python
{
    "ok": bool,
    "applicable_methods": List[str],  # ["characteristic_equation", "iteration", "recursion_tree", "master"]
    "default_method": str,
    "recurrence_info": Optional[Dict[str, Any]]
}
```

**TypeScript:**

```typescript
interface DetectMethodsResponse {
  ok: boolean;
  applicable_methods: Array<"characteristic_equation" | "iteration" | "recursion_tree" | "master">;
  default_method: "characteristic_equation" | "iteration" | "recursion_tree" | "master";
  recurrence_info?: {
    form: string;
    type: "divide_conquer" | "linear_shift";
    a?: number;
    b?: number;
    f?: string;
    n0?: number;
    order?: number;
    shifts?: number[];
    coefficients?: number[];
    "g(n)"?: string;
  };
}
```

---

## Modelo AST (Abstract Syntax Tree)

El AST sigue una estructura jerárquica definida en el paquete `@aa/types`.

**Estructura básica:**

```typescript
interface Program {
  type: "Program";
  procedures: Procedure[];
}

interface Procedure {
  name: string;
  parameters: Parameter[];
  body: Block;
}

interface Parameter {
  name: string;
  type: "scalar" | "array" | "object";
  dimension?: number | string;
  range?: { start: number | string; end: number | string };
  objectType?: string;
}

interface Block {
  statements: Statement[];
}

type Statement =
  | AssignStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | RepeatStatement
  | CallStatement
  | ReturnStatement
  | PrintStatement
  | DeclarationStatement;
```

---

## Tipos de Línea (LineCost.kind)

Los valores posibles para `LineCost.kind`:

- `"assign"`: Asignación de variable
- `"if"`: Estructura condicional IF
- `"for"`: Bucle FOR
- `"while"`: Bucle WHILE
- `"repeat"`: Bucle REPEAT-UNTIL
- `"call"`: Llamada a procedimiento
- `"return"`: Sentencia RETURN
- `"decl"`: Declaración de variable
- `"other"`: Otro tipo de sentencia

---

## Notas sobre Tipos

1. **Strings como fórmulas**: Los campos `ck`, `count`, `count_raw`, y `T_open` contienen fórmulas matemáticas en formato LaTeX o expresiones simbólicas.

2. **Opcionalidad**: Muchos campos son opcionales porque dependen del tipo de algoritmo y método de análisis utilizado.

3. **Compatibilidad**: Los modelos TypeScript están definidos en `packages/types/src/index.ts` y se exportan como `@aa/types`.

4. **Validación**: Los modelos Pydantic validan automáticamente los tipos y valores en el backend.

