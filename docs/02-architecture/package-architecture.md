# Arquitectura de paquetes compartidos

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/grammar/`, `packages/types/`, `packages/content-catalog/`, `packages/content-data/`, `pnpm-workspace.yaml`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** contratos entre capas, gramática, tipos, contenido

## Propósito

Documentar los 4 paquetes compartidos del monorepo, su estructura interna, relaciones entre frontend/backend y qué ocurre cuando los contratos cambian.

## Alcance

Cubre `packages/grammar`, `packages/types`, `packages/content-catalog`, `packages/content-data`.

## Fuera de alcance

Apps (`apps/web`, `apps/api`) — ver `system-architecture.md`.

## Contenido

### Resumen

```
pnpm-workspace.yaml
packages: ["apps/*", "packages/*"]
```

| Paquete | `package.json` name | Lenguaje | Rol |
|---|---|---|---|
| `packages/grammar` | `@aa/grammar` | TypeScript + Python | ANTLR4 gramática, parsers, AST builders |
| `packages/types` | `@aa/types` | TypeScript | Tipos compartidos (AST, análisis, trace, LLM, quiz, snapshot) |
| `packages/content-catalog` | `@aa/content-catalog` | TypeScript | JSON schemas, validación, carga, búsqueda, progreso |
| `packages/content-data` | — | JSON (data only) | Bancos de quizzes y contenido |

### `packages/grammar/`

```
packages/grammar/
├── grammar/
│   ├── Language.g4          # Definición ANTLR4 del lenguaje de pseudocódigo
│   └── README.md
├── scripts/
│   ├── gen-ts.js            # Codegen: ANTLR4 → TypeScript parser
│   ├── gen-py.js            # Codegen: ANTLR4 → Python parser
│   └── gen-py.sh            # Shell wrapper para codegen Python
├── src/
│   └── ts/
│       ├── ast-builder.ts   # Construye AST tipado desde el parse tree
│       ├── error-listener.ts# Recolector de errores de parseo
│       └── grammar/         # Código generado: Lexer, Parser, Listener, Visitor
│           ├── LanguageLexer.ts
│           ├── LanguageParser.ts
│           ├── LanguageListener.ts
│           └── LanguageVisitor.ts
├── out/
│   └── py/                  # Código Python generado (gitignored hasta build)
├── py/
│   ├── pyproject.toml       # Python package aa-grammar
│   ├── README.md
│   └── src/
│       └── aa_grammar/      # Python package con parser generado
├── fixtures/                # Archivos .pseudo de ejemplo para tests
│   └── *.pseudo
├── tooling/                 # Utilidades de codegen
├── index.ts                 # Re-export público del paquete
├── verify-ts.mjs            # Script de verificación del parser TS
└── package.json
```

**Contrato**: `Language.g4` es la única fuente de verdad sintáctica. Cualquier cambio en la gramática requiere regenerar ambos parsers (TS + Python) y actualizar fixtures/tests.

**Codegen**:
```bash
pnpm --filter @aa/grammar build    # → TypeScript
pnpm --filter @aa/grammar gen:py   # → Python
```

**Uso**:
- Frontend: parser client-side para validación sintáctica local + autocompletado
- Backend: `POST /grammar/parse` usa el parser Python vía `aa-grammar`

### `packages/types/`

```
packages/types/
├── src/
│   ├── index.ts             # ~1000 líneas: todos los tipos compartidos
│   ├── export-snapshot.ts   # Snapshot schema version 1.0.0
│   ├── quiz.ts              # Quiz domain types (~215 líneas)
│   └── content.ts           # ContentRef, RenderableBlock
├── dist/                    # Compilación TypeScript
└── package.json             # @aa/types
```

**Tipos exportados (desde `index.ts`)**:

| Categoría | Interfaces clave |
|---|---|
| AST | `AstNode`, `Program`, `ProcDef`, `Block`, `For`, `While`, `If`, `Assign`, `Binary`, `Literal`, etc. |
| Parse | `ParseRequest`, `ParseResponse`, `GrammarParseRequest`, `GrammarParseResponse` |
| Análisis | `AnalyzeRequest`, `AnalyzeOpenResponse`, `AnalyzeAllCasesResponse`, `LineCost`, `WhileBlockView` |
| Recursivo | `RecursiveMethodStepBundle`, `RecursiveAnalysisStep`, 5 `StepKind` tipos |
| Invariantes | `LoopInvariant`, `RecursiveInvariant` con todas sus secciones |
| Trace | `ExecutionStepCanonical`, `CallNodeCanonical`, `CallTreeCanonical`, `ExecutionTraceCanonical` |
| Diagrama | `DiagramPayload`, `TraceGraphCanonical`, `RecurrenceNode`, `RecurrenceExpansion` |
| LLM | `LLMCompareRequest`, `LLMCompareResponse`, `LLMOpinion` |
| Asintótica | `AnalyzeMode`, `AnalyzeCaseAlias`, funciones `normalizeAnalyzeCaseAlias`, `resolveAnalyzeCaseResult` |

**Snapshot schema** (`export-snapshot.ts`):
- Versión: `1.0.0`
- Raíz: `AalieAnalysisSnapshotV1` = `AalieAnalysisSnapshotV1Base & SnapshotByAlgorithm`
- Campos principales: `schemaVersion`, `snapshotId`, `contentHash`, `createdAt`, `locale`
- Secciones: `meta`, `input`, `internal`, `globalResult`, `comparative`, `institutional`
- Por tipo de algoritmo: `iterative`/`recursive`/`hybrid` → `IterativeSnapshotSection` y `RecursiveSnapshotSection`
- Cada sección usa `SnapshotSection<T>` con `status` (available/not_requested/not_supported/not_implemented/missing_data)

**Quiz types** (`quiz.ts`):
- `QuizQuestion`, `QuizSession`, `QuizSessionResult`, `QuizAnswerSubmission`
- `QuizSelectionRequest` con `studiedContentRefs`, `masteryBySkill`, `recentResults`
- 5 tipos de pregunta: `single_choice`, `multiple_choice`, `true_false`, `ordering`, `match_pairs`
- 5 políticas de grading: `all_or_nothing`, `exact_set`, `partial_credit`, `ordered_exact`, `pairwise`
- 3 dificultades: `basic`, `intermediate`, `advanced`
- 4 niveles cognitivos: `recall`, `understand`, `apply`, `analyze`

### `packages/content-catalog/`

```
packages/content-catalog/
├── schemas/
│   ├── shared.schema.json       # Tipos base compartidos
│   ├── space.schema.json        # Schema para CatalogSpace
│   ├── module.schema.json       # Schema para CatalogModule
│   ├── block.schema.json        # Schema para ContentBlock (27+ tipos)
│   └── inline.schema.json       # Schema para InlineSpan (14 tipos)
├── catalog/
│   └── spaces/
│       ├── course/              # Módulos del curso por locale
│       │   ├── es/              # Módulos en español
│       │   └── en/              # Módulos en inglés
│       └── user-guide/          # Módulos de guía de usuario
│           ├── es/
│           └── en/
├── src/
│   ├── types.ts                 # 583 líneas: todos los tipos de contenido
│   ├── load.ts                  # Carga de módulos desde disco
│   ├── validate.ts              # Validación contra JSON schema
│   ├── discover.ts              # Descubrimiento de espacios/módulos
│   ├── search.ts                # Búsqueda en contenido
│   ├── progress.ts              # Cálculo de progreso
│   ├── server.ts                # Server utilities
│   ├── terms.ts                 # Gestión de términos
│   ├── utils.ts                 # Utilidades
│   └── index.ts                 # Re-export público
└── package.json                 # @aa/content-catalog
```

**Tipos de bloque (`ContentBlock`)**: 27 tipos:
`heading`, `paragraph`, `list`, `quote`, `note`, `callout`, `definition`, `theorem`, `proof`, `example`, `evidenceBlock`, `exercise`, `exerciseSolution`, `algorithm`, `code`, `table`, `image`, `figure`, `latex`, `equationBlock`, `latexSteps`, `mermaid`, `recursionTree`, `graph`, `complexityTable`, `formulaComparisonTable`, `methodCard`, `stepByStepMethod`, `proofSteps`, `warningTrap`, `exampleSolved`, `quizCheckpoint`, `cheatsheet`, `referenceList`, `buttonRow`, `divider`

**Tipos de inline (`InlineSpan`)**: 14 tipos:
`text`, `strong`, `emphasis`, `underline`, `highlight`, `inlineCode`, `inlineMath`, `link`, `term`, `tooltip`, `color`

### `packages/content-data/`

```
packages/content-data/
└── quizzes/
    ├── ada-quiz-bank.json        # Banco de quizzes en español
    └── ada-quiz-bank.en.json     # Banco de quizzes en inglés
```

- JSON sin compilar — leído directamente por el backend (`repository.py`)
- Ruta configurable via `QUIZ_DATA_DIR` env var
- Validado en runtime con Pydantic y validator.py

### Relaciones entre frontend y backend

| Paquete | Frontend (web) | Backend (api) | Notas |
|---|---|---|---|
| `grammar` | Parser TS para validación local | Parser Python para parseo server-side | Dual-compiled desde mismo `.g4` |
| `types` | Tipado de respuestas API, AST | No usado (Python tiene tipos propios) | TS-only; backend replica contratos manualmente |
| `content-catalog` | Carga y render de contenido | No usado | TS-only |
| `content-data` | No usado directamente | Leído por `repository.py` | JSON data files |

### Qué se rompe si un contrato cambia

| Cambio | Impacto |
|---|---|
| `Language.g4` (gramática) | Regenerar parsers TS + Python. Actualizar fixtures, tests contract, ejemplos. |
| `src/index.ts` (tipos AST) | Frontend tipado de parse response. Backend debe mantener compatibilidad. |
| `export-snapshot.ts` (snapshot) | Backend snapshot builder, frontend consumo de export, tests de export. `SnapshotSection<T>` con status protege contra rotura parcial. |
| `quiz.ts` (quiz types) | Backend schemas Pydantic, frontend quiz UI, gradding policies. |
| `content-catalog` types | Schema JSON + frontend render de bloques. 27 tipos de bloque = 27 componentes React. |
| Schema JSON | Validación falla si catálogo existente no se actualiza. |

## Evidencia desde código

- Grammar definition: `packages/grammar/grammar/Language.g4`
- Codegen scripts: `packages/grammar/scripts/gen-ts.js`, `gen-py.js`
- AST builder: `packages/grammar/src/ts/ast-builder.ts`
- Types index: `packages/types/src/index.ts` — 1003 líneas
- Snapshot schema: `packages/types/src/export-snapshot.ts` — 397 líneas, version `1.0.0`
- Quiz types: `packages/types/src/quiz.ts` — 215 líneas
- Content schemas: `packages/content-catalog/schemas/` — 5 JSON Schema files
- Content types: `packages/content-catalog/src/types.ts` — 583 líneas
- Quiz data: `packages/content-data/quizzes/ada-quiz-bank.json`
- Workspace: `pnpm-workspace.yaml` — `packages: ["apps/*", "packages/*"]`

## Limitaciones

- `@aa/types` es TS-only; backend Python no puede importarlo directamente — los contratos se mantienen manualmente sincronizados
- El parser Python generado (`out/py/`) no se regenera automáticamente en `postinstall`
- No hay versionado semántico explícito para los paquetes (no hay changesets)
- `content-data` no tiene `package.json` — no es un paquete pnpm, es data cruda

## Archivos relacionados

- `system-architecture.md`
- `frontend-architecture.md`
- `backend-architecture.md`
- `data-flow.md`
