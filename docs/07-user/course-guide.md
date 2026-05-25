# Course Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/course/`, `apps/web/src/features/course/`, `packages/content-catalog/catalog/spaces/course/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2 (contenido pedagógico)

## Overview

The course section provides structured, modular educational content about algorithm analysis. Content is stored as versioned JSON and rendered consistently across locales. The course is designed as a linear progression but allows free navigation.

## Accessing the Course

| Route | Purpose |
|-------|---------|
| `/{locale}/course` | Course landing — shows all available modules as cards |
| `/{locale}/course/{moduleSlug}` | Module view — full content of one module |
| `/{locale}/course/{moduleSlug}/{chapterSlug}` | Chapter view — scoped to one chapter within a module |

From the course landing, you can also:
- Start a quiz related to a module (if quiz questions are available).
- View your progress for each module.
- Use the assistant (if API key is configured).

## Module Structure

The course is organized in a hierarchy:

```
Course (space)
  → Modules (top-level units)
    → Chapters (subdivisions within a module)
      → Sections (content units with blocks)
        → Blocks (individual content pieces)
```

### Modules

Each module represents a major topic. For example:

| Order | Module | Description |
|-------|--------|-------------|
| 1 | Time and Space Complexity | RAM model, T(n), growth rates |
| 2 | Iterative Algorithms | Loop analysis, sum formulas |
| 3 | Recursive Algorithms | Recurrence relations, solving methods |
| ... | ... | ... |

A module card shows:
- **Title** and **summary**
- **Difficulty**: foundational, basic, intermediate, advanced
- **Estimated time**: minutes to complete
- **Progress**: percentage of sections completed
- **Tags**: topics covered

### Chapters

Within a module, chapters group related content. Each chapter has:
- A **title** and **order** within the module.
- A **summary** (optional).
- A list of **sections**.

### Sections

Sections are the smallest trackable unit. They have:
- **Kind**: overview, theory, example, practice, reference, troubleshooting.
- **Track progress**: whether this section counts toward module completion.
- **Estimated minutes**: reading/study time.
- **Learning objectives**: what you should learn from this section.
- **Blocks**: the actual content.

### Blocks

Blocks are individual pieces of content. Supported types include:

| Block Type | Purpose |
|-----------|---------|
| `paragraph` | Prose text with inline formatting |
| `heading` | Section heading |
| `list` | Ordered or unordered list |
| `note` | Highlighted note or tip |
| `callout` | Important warning or emphasis |
| `definition` | Term definition |
| `theorem` | Formal theorem statement |
| `proof` | Formal proof |
| `example` | Worked example |
| `exercise` | Practice exercise |
| `exerciseSolution` | Solution to an exercise |
| `algorithm` | Pseudocode display |
| `code` | Code block |
| `table` | Structured table |
| `image` / `figure` | Visual content |
| `latex` / `equationBlock` | Mathematical formulas |
| `latexSteps` | Step-by-step math derivation |
| `mermaid` | Mermaid diagram |
| `recursionTree` | Recursion tree visualization |
| `complexityTable` | Complexity comparison table |
| `methodCard` | Method summary card |
| `stepByStepMethod` | Step-by-step procedure |
| `warningTrap` | Common mistake warning |
| `quizCheckpoint` | Quiz checkpoint reference |
| `cheatsheet` | Quick reference |
| `buttonRow` | Navigation buttons |

## Content Types in Detail

### Inline Text Formatting

Text within blocks uses rich text with these inline types:
- `text` — plain text
- `strong` — **bold**
- `emphasis` — *italic*
- `underline` — underline
- `highlight` — highlighted text
- `inlineCode` — `code`
- `inlineMath` — LaTeX math (e.g., $T(n) = O(n^2)$)
- `link` — internal or external reference
- `term` — glossary term (linked to module's term index)
- `tooltip` — hover tooltip

### Math Rendering

All mathematical expressions are rendered using KaTeX:
- **Inline**: use `inlineMath` within text.
- **Block**: use `equationBlock` for standalone formulas.
- **Steps**: use `latexSteps` for multi-step derivations.

### Diagrams

- **Mermaid**: flowcharts, sequence diagrams, state diagrams.
- **Recursion tree**: rendered with React Flow for interactive exploration.

## Navigation

### Within a Module

- **Sidebar**: shows the module's chapter and section structure. Click any section to jump there.
- **Previous / Next**: navigate sequentially through sections.
- **Table of Contents**: auto-generated from the module's chapter/section structure.
- **Progress bar**: shows completion percentage for the current module.

### Between Modules

- The module landing page shows all modules as cards.
- Each module card links to the module view.
- The course footer may include links to related modules.

## Progress Tracking

Progress is stored in `localStorage` under `aalie.content.progress.v1`.

- **Unit**: sections with `trackProgress: true`.
- **Completion**: a section is marked complete when it has been at least 50% visible for 1000 continuous milliseconds (measured by Intersection Observer).
- **Module progress**: calculated from completed sections within that module.
- **Space progress**: calculated from all trackable sections across all modules.

Progress is local-only. Clearing browser data will reset it.

## Language Switching

The course content is available in two locales:

- **Spanish** (`es`)
- **English** (`en`)

Module slugs differ by locale (e.g., `complejidad-temporal-espacial` in Spanish vs `time-and-space-complexity` in English). Content is authored separately per locale; switching locale navigates to the corresponding slug.

If a translation is not available for a specific section, a controlled fallback message is shown.

## Prerequisites

Some modules have prerequisites — other modules or sections recommended before starting. Prerequisites are shown in the module view as a panel with two levels:

- **Required**: must be completed first.
- **Recommended**: suggested but optional.

Prerequisite references link directly to the relevant module or section.

## Glossary (Terms)

Each module defines a glossary of terms. Terms are:
- Defined in the module JSON with `termId`, `label`, `aliases`, and `definition`.
- Auto-linked in rendered text: when a term appears, it is highlighted and clickable.
- A **terms index** is built across the entire space, so terms from earlier modules are also recognized.
- Clicking a term opens a tooltip or panel with its definition.

## Related Content

The course integrates with:
- **Analyzer**: code examples can be loaded into the analyzer.
- **Quizzes**: modules with quiz banks show a quiz button.
- **User Guide**: reference content shared across spaces.

## Known Limits

- The course is in active development. More modules and content are being added.
- Some sections may have limited content (marked as `draft` status).
- Progress is local-only and does not sync across devices.
- Interactive exercises are not yet available (only static text-based exercises).
