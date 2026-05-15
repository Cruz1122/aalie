# Diagramas UML

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/`, `packages/`, `docs/02-architecture/*.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** visualización de componentes, secuencias, dependencias

## Propósito

Proporcionar diagramas Mermaid conceptuales que describen la estructura de paquetes, jerarquía de clases y secuencias de interacción entre componentes.

## Alcance

Cubre paquetes del monorepo, jerarquía de analizadores, modelo de export, dominio de quizzes y 8 secuencias de interacción.

## Nota

Todos los diagramas son **conceptuales** — representan relaciones arquitectónicas, no mapeo exacto 1:1 con clases del código.

## Contenido

### 1. Package diagram — dependencias del monorepo

```mermaid
flowchart TD
  subgraph apps
    WEB[apps/web - Next.js]
    API[apps/api - FastAPI]
  end

  subgraph packages
    GRAMMAR[packages/grammar]
    TYPES[packages/types]
    CATALOG[packages/content-catalog]
    DATA[packages/content-data]
  end

  subgraph external
    ANTLR[ANTLR4]
    SYMPY[SymPy]
    GEMINI[Gemini API]
    PDF[pdflatex]
  end

  WEB --> TYPES
  WEB --> CATALOG
  WEB --> GRAMMAR
  WEB --> API

  API --> GRAMMAR
  API --> TYPES
  API --> DATA

  API --> ANTLR
  API --> SYMPY
  API --> GEMINI
  API --> PDF

  CATALOG --> TYPES
```

### 2. Class diagram (conceptual) — Analyzer hierarchy

```mermaid
classDiagram
  class BaseAnalyzer {
    +List rows
    +List loop_stack
    +Dict symbols
    +add_row()
    +push_multiplier()
    +pop_multiplier()
    +build_t_open()
    +result()
  }

  class ForVisitor {
    +visit_for()
  }

  class IfVisitor {
    +visit_if()
  }

  class WhileRepeatVisitor {
    +visit_while()
    +visit_repeat()
  }

  class SimpleVisitor {
    +visit_assign()
    +visit_call()
    +visit_return()
    +visit_print()
  }

  class IterativeAnalyzer {
    +big_o
    +big_omega
    +big_theta
    +analyze()
  }

  class RecursiveAnalyzer {
    +detect_applicable_methods()
    +analyze()
    +recursive_invariant
  }

  class WhileEngine {
    +analyze(WhileAnalysisInput)
  }

  class AnalyzerRegistry {
    +get(kind)
  }

  BaseAnalyzer <|-- IterativeAnalyzer
  BaseAnalyzer <|-- RecursiveAnalyzer
  ForVisitor <|-- IterativeAnalyzer
  IfVisitor <|-- IterativeAnalyzer
  WhileRepeatVisitor <|-- IterativeAnalyzer
  SimpleVisitor <|-- IterativeAnalyzer
  IterativeAnalyzer --> WhileEngine
  AnalyzerRegistry --> IterativeAnalyzer
  AnalyzerRegistry --> RecursiveAnalyzer
```

### 2b. Class diagram (conceptual) — AST nodes

```mermaid
classDiagram
  class BaseNode {
    +string type
    +Position pos
  }

  class Program {
    +body[]
  }

  class ProcDef {
    +string name
    +params[]
    +Block body
  }

  class Block {
    +body[]
  }

  class Assign {
    +target
    +value
  }

  class If {
    +test
    +Block consequent
    +Block alternate
  }

  class For {
    +string var
    +start
    +end
    +Block body
  }

  class While {
    +test
    +Block body
  }

  class Binary {
    +string op
    +left
    +right
  }

  BaseNode <|-- Program
  BaseNode <|-- ProcDef
  BaseNode <|-- Block
  BaseNode <|-- Assign
  BaseNode <|-- If
  BaseNode <|-- For
  BaseNode <|-- While
  BaseNode <|-- Binary
  BaseNode <|-- Literal
  BaseNode <|-- Identifier
  BaseNode <|-- Call
```

### 2c. Class diagram (conceptual) — Export document model

```mermaid
classDiagram
  class AalieAnalysisSnapshotV1 {
    +string schemaVersion
    +string snapshotId
    +string contentHash
    +SnapshotMeta meta
    +SnapshotInput input
    +SnapshotInternal internal
    +SnapshotGlobalResult globalResult
    +SnapshotComparative comparative
    +SnapshotInstitutional institutional
  }

  class SnapshotSection {
    +SnapshotSectionStatus status
    +T data
    +SnapshotWarning[] warnings
  }

  class DocumentModel {
    +DocMeta meta
    +DocumentSection[] sections
  }

  class DocumentSection {
    +string id
    +string title
    +DocumentTable[] tables
    +string content
  }

  class MarkdownRenderer {
    +render(DocumentModel)
  }

  class LaTeXRenderer {
    +render(DocumentModel)
  }

  class LaTeXCompiler {
    +compile(string)
  }

  class ZipBundle {
    +build()
  }

  AalieAnalysisSnapshotV1 --> SnapshotSection
  DocumentModel --> DocumentSection
  MarkdownRenderer --> DocumentModel
  LaTeXRenderer --> DocumentModel
  LaTeXCompiler --> LaTeXRenderer
  ZipBundle --> MarkdownRenderer
```

### 2d. Class diagram (conceptual) — Quiz domain

```mermaid
classDiagram
  class QuizQuestion {
    +string questionId
    +QuizQuestionType type
    +QuizDifficulty difficulty
    +QuizCognitiveLevel cognitiveLevel
    +string topic
    +RenderableContent prompt
    +QuizOption[] options
    +QuizAnswer answer
    +QuizGradingPolicy gradingPolicy
  }

  class QuizSession {
    +string sessionId
    +QuizQuestion[] questions
    +selectionMode
  }

  class QuizSessionResult {
    +float score
    +float accuracy
    +QuizQuestionResult[] results
    +string[] strengths
    +string[] areasToImprove
  }

  class QuizQuestionResult {
    +bool isCorrect
    +float score
    +StudentAnswer studentAnswer
    +QuizAnswer correctAnswer
  }

  class Selector {
    +select_questions()
  }

  class Grading {
    +grade_question()
    +compute_mastery_delta()
    +summarize_skill_outcomes()
  }

  QuizSession --> QuizQuestion
  QuizSessionResult --> QuizQuestionResult
  Selector --> QuizQuestion
  Grading --> QuizQuestion
  Grading --> QuizQuestionResult
```

### 3. Sequence — Parse

```mermaid
sequenceDiagram
  actor User
  participant Editor as Monaco Editor
  participant BFF as Next BFF /api/grammar/parse
  participant API as FastAPI /grammar/parse
  participant Parser as aa-grammar (Python)
  participant Types as @aa/types

  User->>Editor: Escribe pseudocódigo
  Editor->>Editor: Validación local (ANTLR TS)
  User->>Editor: Click "Parse"
  Editor->>BFF: POST body: source
  BFF->>API: POST /grammar/parse body: source
  API->>Parser: parse_source(source)
  Parser-->>API: result: ok + ast + errors
  API-->>BFF: GrammarParseResponse
  BFF-->>Editor: GrammarParseResponse
  Editor->>Types: Validar contra tipos
  Editor-->>User: Muestra AST / errores
```

### 4. Sequence — Iterative Analysis

```mermaid
sequenceDiagram
  actor User
  participant UI as Analyzer UI
  participant BFF as /api/analyze/open
  participant API as FastAPI
  participant Classifier as classification/
  participant Analyzer as IterativeAnalyzer
  participant Visitors as for/if/while/simple visitors
  participant SymPy as SymPy

  User->>UI: Click "Analyze"
  UI->>BFF: POST source + mode
  BFF->>API: POST /analyze/open
  API->>Classifier: classify(source)
  Classifier-->>API: kind: iterative
  API->>Analyzer: analyze(ast, mode)
  Analyzer->>Visitors: visit_for(), visit_if(), ...
  Visitors->>SymPy: count expressions
  SymPy-->>Visitors: closed forms
  Visitors-->>Analyzer: self.rows[ ]
  Analyzer->>SymPy: build_t_open()
  SymPy-->>Analyzer: T_open string
  Analyzer->>SymPy: derive complexity classes
  SymPy-->>Analyzer: big_o, big_omega, big_theta
  Analyzer-->>API: AnalyzeOpenResponse
  API-->>BFF: JSON response
  BFF-->>UI: AnalyzeOpenResponse
  UI-->>User: Tabla byLine, T_open, notaciones
```

### 5. Sequence — Recursive Analysis

```mermaid
sequenceDiagram
  actor User
  participant UI as Analyzer UI
  participant BFF as /api/analyze
  participant API as FastAPI
  participant Analyzer as RecursiveAnalyzer
  participant Methods as master/iteration/recursion_tree/characteristic_equation
  participant SymPy as SymPy

  User->>UI: Selecciona método
  UI->>BFF: POST /analyze/detect-methods
  BFF->>API: POST /analyze/detect-methods
  API->>Analyzer: detect_applicable_methods(ast)
  Analyzer-->>API: methods list + default
  API-->>BFF: response
  BFF-->>UI: lista de métodos
  User->>UI: Selecciona método y analiza
  UI->>BFF: POST /analyze/open source + method
  BFF->>API: POST /analyze/open
  API->>Analyzer: analyze(ast, mode, preferred_method)
  Analyzer->>Methods: apply method
  Methods->>SymPy: rsolve, summation, solve, roots
  SymPy-->>Methods: symbolic results
  Methods-->>Analyzer: RecursiveMethodStepBundle
  Analyzer-->>API: AnalyzeOpenResponse (con recurrence + method details)
  API-->>BFF: JSON
  BFF-->>UI: resultado con pasos
  UI-->>User: Render paso a paso + fórmula
```

### 6. Sequence — Trace

```mermaid
sequenceDiagram
  actor User
  participant UI as Trace View
  participant BFF as /api/analyze/trace
  participant API as FastAPI
  participant Executor as CodeExecutor
  participant Builder as StructuredTraceBuilder
  participant ReactFlow as React Flow

  User->>UI: Set case + input size
  UI->>BFF: POST source + case + input_size
  BFF->>API: POST /analyze/trace
  API->>Executor: execute(ast, input_size, case)
  Executor-->>API: raw trace (steps, recursionTree)
  API->>Builder: build_structured_trace_result()
  Builder-->>API: { patternKind, graph, classification }
  API-->>BFF: { ok, trace, derived }
  BFF-->>UI: trace response
  UI->>ReactFlow: render graph
  ReactFlow-->>UI: interactive tree
  UI-->>User: Steps, variables, call tree
```

### 7. Sequence — Export

```mermaid
sequenceDiagram
  actor User
  participant UI as Export UI
  participant BFF as Next BFF
  participant API as FastAPI
  participant SB as SnapshotBuilder
  participant DM as DocumentModel
  participant Renderer as Markdown/LaTeX Renderer
  participant FS as Filesystem

  User->>UI: Select format → Export
  UI->>BFF: POST /export/report
  BFF->>API: POST /export/report { source, formats }
  API->>SB: build_export_state(source)
  SB->>SB: parse → classify → analyze → trace
  SB-->>API: AalieAnalysisSnapshotV1
  API->>DM: build_document_model(snapshot)
  DM-->>API: DocumentModel
  API->>Renderer: render(document)
  Renderer-->>API: string content
  alt Formato PDF
    API->>FS: compile pdflatex
    FS-->>API: PDF binary
  end
  API-->>BFF: Binary response + headers
  BFF-->>UI: File download
  UI-->>User: Report downloaded
```

### 8. Sequence — Quiz

```mermaid
sequenceDiagram
  actor Student
  participant UI as Quizzes Dashboard
  participant BFF as /api/quizzes
  participant API as FastAPI
  participant Service as QuizService
  participant Selector as QuizSelector
  participant Grader as QuizGrader
  participant Repo as QuizRepository
  participant FS as Filesystem

  Student->>UI: Open quizzes dashboard
  UI->>BFF: GET /api/quizzes/taxonomy
  BFF->>API: GET /quizzes/taxonomy
  API->>Repo: load_taxonomy()
  Repo->>FS: read taxonomy file
  FS-->>Repo: JSON
  Repo-->>API: Taxonomy
  API-->>BFF: response
  BFF-->>UI: Taxonomy
  Student->>UI: Start quiz session
  UI->>BFF: POST /api/quizzes/session
  BFF->>API: POST /quizzes/attempts
  API->>Service: create_session(request)
  Service->>Repo: get_validated_dataset(locale)
  Repo->>FS: read quiz bank JSON
  FS-->>Repo: QuizDataset
  Repo-->>Service: validated dataset
  Service->>Selector: select_questions()
  Selector-->>Service: selected + trace
  Service-->>API: QuizSession (sanitized)
  API-->>BFF: session JSON
  BFF-->>UI: QuizSession
  Student->>UI: Answer questions
  UI->>BFF: POST /api/quizzes/evaluate
  BFF->>API: POST /quizzes/attempts/evaluate
  API->>Service: evaluate_session(submission)
  Service->>Grader: grade_question() × N
  Grader-->>Service: QuizQuestionResult[]
  Service->>Grader: compute_mastery_delta()
  Service-->>API: QuizSessionResult
  API-->>BFF: result JSON
  BFF-->>UI: Score + feedback
  UI-->>Student: Results, strengths, areas to improve
```

### 9. Sequence — LLM

```mermaid
sequenceDiagram
  actor User
  participant UI as ChatBot / Assistant
  participant BFF as /api/llm
  participant API as FastAPI
  participant Service as LLMService
  participant Provider as Gemini/OpenAI
  participant External as LLM Provider API

  User->>UI: Ask question / request help
  UI->>BFF: POST /api/llm { job, context, prompt }
  BFF->>API: POST /llm { job, context, prompt }
  API->>Service: execute_llm_request()
  Service->>Provider: call_provider(job, prompt, config)
  Provider->>External: HTTPS request
  External-->>Provider: LLM response
  Provider-->>Service: parsed response
  Service-->>API: { ok, response }
  API-->>BFF: LLMResponse
  BFF-->>UI: LLMResponse
  UI-->>User: Rendered answer
```

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `data-flow.md`
- `design-patterns.md`
