# User Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/analyzer/`, `apps/web/src/app/[locale]/user-guide/`, `packages/content-catalog/catalog/spaces/user-guide/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** secciones 3.1 (interfaz de usuario), 4.2 (contenido pedagógico)

## What is AALIE

AALIE (Algorithm Analysis Learning Interactive Environment) is an educational platform for studying algorithm analysis and design. It lets you write pseudocode, analyze its complexity, watch step-by-step execution traces, and reinforce concepts through guided content, examples, and quizzes.

The core analysis engine is deterministic — it uses formal rules and contracts, not AI. Optional LLM features (assistant, comparison) exist only as pedagogical support and require a configured API key.

## How to Access

Open your browser to the deployed URL. The application supports two locales:

| Locale | URL Prefix |
|--------|-----------|
| Spanish (es) | `http://localhost:3000/es/...` |
| English (en) | `http://localhost:3000/en/...` |

All routes are localized. Switch language using the locale selector in the header.

## Main Sections

| Route | Purpose |
|-------|---------|
| `/{locale}/analyzer` | Write pseudocode, run analysis, view AST, trace execution |
| `/{locale}/examples` | Browse categorized algorithm examples |
| `/{locale}/course` | Modular course content organized by modules and chapters |
| `/{locale}/quizzes` | Quiz dashboard, start sessions, review results |
| `/{locale}/user-guide` | This user guide as structured content |

## Basic Workflow

```
Write pseudocode → Validate syntax → Analyze → Read results → (optional) Trace → (optional) Export
```

1. **Write code** in the Monaco editor on the analyzer page.
2. **Syntax validation** runs in real-time. Errors appear as squiggly underlines and in the error panel.
3. Click **Analyze** to start the pipeline: parse → classify → analyze → display.
4. **Read results**: by-line costs, efficiency equation T(n), grouped polynomial, asymptotic notation (O/Ω/Θ).
5. **Optional**: view loop invariants, step-through traces, or export a report.

## Keyboard Shortcuts (Monaco Editor)

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Trigger analysis (when code is valid) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+F` | Find in editor |
| `Ctrl+H` | Find and replace |
| `Ctrl+D` | Select next occurrence |
| `Alt+↑/↓` | Move line up/down |
| `Ctrl+/` | Toggle comment |
| `Tab` | Indent / accept autocomplete |
| `Ctrl+Space` | Trigger autocomplete manually |

## Error Handling

| Symptom | Likely Cause | What to Do |
|---------|-------------|------------|
| Red squiggly underline | Syntax error | Check the error message in the panel. Common issues: missing `BEGIN`/`END`, mismatched `IF`/`END`, using `=` instead of `<-` for assignment. |
| "Analysis failed" toast | Backend error | Check if the backend is running (`http://localhost:8000/health`). The code may have constructs the engine cannot analyze. |
| Partial results with warnings | WHILE loop not recognized | The heuristic classifier could not assign a pattern. The result shows a warning instead of a full answer. |
| "No applicable method" | Recursive algorithm outside supported forms | The recurrence does not match Master Theorem, iteration, recursion tree, or characteristic equation. |
| No trace available | Code has no determinable execution path | Some algorithms may not produce a trace if the path is too complex or input-dependent. |
| Export fails for PDF | `pdflatex` not installed | Try Markdown or ZIP export instead. See the exports guide for details. |

## Known Limitations

- The analyzer cannot analyze every possible algorithm. Some forms produce partial or heuristic results.
- WHILE loop analysis uses pattern matching; unrecognized patterns produce warnings.
- Recursive analysis requires the algorithm to fit one of the supported recurrence forms.
- The LLM assistant is optional and requires an API key. Without it, all deterministic features work normally.
- PDF export depends on `pdflatex` being available in the runtime environment.
