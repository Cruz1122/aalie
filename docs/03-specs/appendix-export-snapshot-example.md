# Apéndice: Ejemplo completo de snapshot de export

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/export/snapshot_builder.py`, `packages/types/src/export-snapshot.ts`, `docs/03-specs/report-snapshot-spec.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Apéndice E — Snapshot de export

## Propósito

Mostrar un ejemplo realista y completo de un snapshot de exportación para un algoritmo Merge Sort, incluyendo el JSON completo del snapshot, ejemplos de salida Markdown y LaTeX, y una explicación de cada sección.

---

## Algoritmo de ejemplo

```pseudocode
mergesort(A[1]..[n]) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN;
    END
    mid <- n DIV 2;
    CALL mergesort(A[1..mid]);
    CALL mergesort(A[mid+1..n]);
    CALL merge(A[1..n], mid);
END
```

---

## Snapshot JSON completo

```json
{
  "schemaVersion": "1.0.0",
  "snapshotId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "createdAt": "2026-05-14T10:30:00.000Z",
  "locale": "es",
  "algorithmType": "recursive",

  "meta": {
    "analysisId": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "sourceOrigin": "editor",
    "algorithm": {
      "name": "mergesort",
      "parameters": ["A[1..n]"]
    },
    "algorithmTypeDetected": "recursive",
    "methodsApplied": ["master_theorem"],
    "methodsAvailable": ["master_theorem", "recursion_tree", "iteration"],
    "hasCaseVariability": false,
    "validity": {
      "parseOk": true,
      "analysisOk": true,
      "traceOk": true
    },
    "warnings": [],
    "limitations": [
      "Merge procedure is symbolic: actual merge sort steps may vary by implementation"
    ]
  },

  "input": {
    "originalPseudocode": "mergesort(A[1]..[n]) BEGIN\n    IF (n <= 1) THEN BEGIN\n        RETURN;\n    END\n    mid <- n DIV 2;\n    CALL mergesort(A[1..mid]);\n    CALL mergesort(A[mid+1..n]);\n    CALL merge(A[1..n], mid);\nEND",
    "procedureName": "mergesort",
    "parameters": ["A[1..n]"],
    "parsingObservations": {
      "status": "available",
      "data": {
        "ok": true,
        "available": true,
        "runtime": 0.003,
        "error": null,
        "errors": []
      }
    },
    "analysisSummary": {
      "hasCaseVariability": false,
      "availableCases": ["worst"]
    },
    "traceSummary": {
      "status": "available",
      "data": {
        "cases": ["worst"],
        "traceAvailable": true
      }
    }
  },

  "internal": {
    "ast": {
      "status": "available",
      "data": {
        "type": "ProcDef",
        "name": "mergesort",
        "params": ["A[1..n]"],
        "body": { "...": "..." }
      }
    },
    "classification": {
      "status": "available",
      "data": {
        "kind": "recursive",
        "method": "divide_and_conquer"
      }
    },
    "recurrence": {
      "status": "available",
      "data": {
        "type": "divide_conquer",
        "a": 2,
        "b": 2,
        "f_n": "n",
        "canonicalForm": "T(n) = 2*T(n/2) + n"
      }
    },
    "intermediateMath": {
      "master": {
        "status": "available",
        "data": {
          "log_b_a": 1,
          "comparison": "f(n) = Θ(n^log_b(a))",
          "case": 2,
          "result": "Θ(n·log n)"
        }
      },
      "recursion_tree": {
        "status": "available",
        "data": {
          "levels": "log₂(n)+1",
          "costPerLevel": "n",
          "totalCost": "n·(log₂(n)+1)",
          "closedForm": "Θ(n·log n)"
        }
      }
    }
  },

  "globalResult": {
    "cases": {
      "worst": {
        "case": "worst",
        "T_open": "C₁ + C₂·(n+1) + C₃·(n) + 2·T(n/2) + n·C_merge",
        "T_polynomial": "n·log₂(n)·C_merge + 2·C₁·n - C₁ + C₂",
        "big_o": "O(n·log n)",
        "big_omega": "Ω(n·log n)",
        "big_theta": "Θ(n·log n)",
        "whileBlocks": [],
        "explanationSteps": [
          "The algorithm splits the input into two halves (divide step)",
          "Each half is sorted recursively: 2·T(n/2)",
          "The merge procedure combines sorted halves in Θ(n)",
          "By the Master Theorem (Case 2), T(n) = Θ(n·log n)"
        ],
        "raw": {}
      }
    }
  },

  "iterative": {
    "status": "not_supported",
    "data": null
  },

  "recursive": {
    "status": "available",
    "data": {
      "recurrence": {
        "status": "available",
        "data": {
          "type": "divide_conquer",
          "a": 2,
          "b": 2,
          "f_n": "n"
        }
      },
      "selectedMethod": {
        "status": "available",
        "data": {
          "method": "master_theorem",
          "reason": "Default method for divide_conquer family"
        }
      },
      "methodsAvailable": {
        "status": "available",
        "data": [
          { "method": "master_theorem", "applicable": true },
          { "method": "recursion_tree", "applicable": true },
          { "method": "iteration", "applicable": true }
        ]
      },
      "methodDetails": [
        {
          "method": "master_theorem",
          "detail": {
            "log_b_a": 1,
            "case": 2,
            "result": "Θ(n·log n)"
          }
        }
      ],
      "presentation": {
        "summary": "Divide and Conquer — Merge Sort",
        "conceptNote": "This algorithm follows the divide-and-conquer paradigm: divide (O(1)), conquer (2T(n/2)), combine (O(n)).",
        "warning": null,
        "supportReason": "strong",
        "renderHints": {
          "highlightTechnique": "divide_and_conquer",
          "showTreeDiagram": true
        }
      },
      "stepByStep": {
        "status": "available",
        "data": {
          "steps": [
            { "step": 1, "description": "Base case: n ≤ 1 → Θ(1)" },
            { "step": 2, "description": "Divide: mid = n DIV 2 → Θ(1)" },
            { "step": 3, "description": "Conquer: 2 recursive calls of size n/2 → 2·T(n/2)" },
            { "step": 4, "description": "Combine: merge procedure → Θ(n)" },
            { "step": 5, "description": "Total: T(n) = 2·T(n/2) + Θ(n)" },
            { "step": 6, "description": "Master Theorem: log₂(2)=1, f(n)=Θ(n) → Case 2 → Θ(n·log n)" }
          ]
        }
      },
      "closedForm": {
        "status": "available",
        "data": {
          "theta": "Θ(n·log n)",
          "baseCases": ["T(1) = Θ(1)"]
        }
      },
      "callTrace": {
        "status": "available",
        "data": {
          "trace": [
            { "call": 1, "procedure": "mergesort", "args": "A[1..8]", "depth": 0 },
            { "call": 2, "procedure": "mergesort", "args": "A[1..4]", "depth": 1 },
            { "call": 3, "procedure": "mergesort", "args": "A[1..2]", "depth": 2 },
            { "call": 4, "procedure": "mergesort", "args": "A[1..1]", "depth": 3 },
            { "call": 5, "procedure": "merge", "args": "A[1..2], 1", "depth": 2 },
            { "call": 6, "procedure": "mergesort", "args": "A[3..4]", "depth": 2 },
            { "call": 7, "procedure": "merge", "args": "A[1..4], 2", "depth": 1 },
            { "call": 8, "procedure": "mergesort", "args": "A[5..8]", "depth": 1 },
            { "call": 9, "procedure": "merge", "args": "A[1..8], 4", "depth": 0 }
          ]
        }
      }
    }
  },

  "comparative": {
    "llm": {
      "status": "not_requested",
      "data": null
    },
    "gpuCpu": {
      "status": "not_supported",
      "data": null
    }
  },

  "institutional": {
    "disclaimer": "Este análisis fue generado automáticamente por AALIE. Los resultados asumen el modelo de costo estándar (operaciones elementales con costo unitario). Verifique las condiciones de aplicabilidad antes de usar este resultado en contextos académicos formales.",
    "caseLimitations": [
      "Solo se analizó el caso worst (best = worst para Merge Sort, sin variabilidad)"
    ],
    "generalLimitations": [
      "El procedimiento auxiliar merge se trata simbólicamente como Θ(n)",
      "No se modela la sobrecarga de llamadas a función en el costo total"
    ]
  }
}
```

---

## Secciones del snapshot

### `schemaVersion` y `snapshotId`

- **`schemaVersion`**: versión del schema del snapshot (semver). Debe coincidir con `SNAPSHOT_SCHEMA_VERSION` en `constants.py` y `ExportSnapshotSchemaVersion` en `export-snapshot.ts`.
- **`snapshotId`**: UUID v5 derivado del hash del input. Estable para el mismo pseudocódigo + configuración.
- **`contentHash`**: SHA-256 del snapshot sin `createdAt`. Garantiza integridad.

### `meta`

Metadatos del análisis: origen, nombre del algoritmo, detectores aplicados, validez del pipeline, advertencias y limitaciones. Es la sección de control de calidad del snapshot.

### `input`

Entrada original del análisis: pseudocódigo fuente, resultados del parseo, resumen de análisis (variabilidad de casos), y resumen de trace.

### `internal`

Datos internos del motor de análisis: AST completo, clasificación técnica/pedagógica, recurrencia normalizada, y artefactos matemáticos intermedios por método (master, recursion tree, iteration, characteristic equation). Esta sección no es contractual para render público.

### `globalResult`

Resultado público principal del análisis. Contiene `T_open`, `T_polynomial`, y cotas asintóticas (`big_o`, `big_omega`, `big_theta`) para cada caso (worst, best, avg). Es la sección que consumen UI y export por defecto.

### `iterative`

Sección especializada para algoritmos iterativos. Contiene `lineCostTable`, `whileBlocks`, `summations`, `simplificationSteps`, `trace`, y `loopInvariant`. Para algoritmos recursivos tiene `status: "not_supported"`.

### `recursive`

Sección especializada para algoritmos recursivos. Contiene `recurrence`, `selectedMethod`, `methodDetails`, `presentation`, `stepByStep`, `closedForm`, `callTrace`. Para algoritmos iterativos tiene `status: "not_supported"`.

### `comparative`

Sección de comparación. `llm` contiene resultados de comparación con LLM (si se solicitó). `gpuCpu` contiene comparación GPU/CPU (si aplica). Por defecto tiene `status: "not_requested"`.

### `institutional`

Texto institucional: disclaimer, limitaciones por caso, y limitaciones generales. Localizado según `locale`. Se renderiza en export LaTeX/PDF como carátula y notas al pie.

---

## Export Markdown (ejemplo parcial)

```markdown
# Análisis de complejidad: mergesort

## Información general

- **Algoritmo:** mergesort
- **Tipo:** recursivo (divide and conquer)
- **Método aplicado:** Master Theorem (caso 2)

## Resultado

| Propiedad | Valor |
|-----------|-------|
| **Caso analizado** | worst |
| **T_open** | C₁ + C₂·(n+1) + C₃·(n) + 2·T(n/2) + n·C_merge |
| **Big O** | O(n·log n) |
| **Big Ω** | Ω(n·log n) |
| **Big Θ** | Θ(n·log n) |

## Recurrencia

```
T(n) = 2·T(n/2) + Θ(n)
```

## Pasos del análisis

1. Caso base: n ≤ 1 → Θ(1)
2. Divide: mid = n DIV 2 → Θ(1)
3. Conquer: 2 llamadas recursivas de tamaño n/2 → 2·T(n/2)
4. Combine: procedimiento merge → Θ(n)
5. Total: T(n) = 2·T(n/2) + Θ(n)
6. Master Theorem: log₂(2) = 1, f(n) = Θ(n) → Caso 2 → Θ(n·log n)

## Trace de llamadas

```
mergesort(A[1..8])
 ├── mergesort(A[1..4])
 │    ├── mergesort(A[1..2])
 │    │    ├── mergesort(A[1..1]) → base
 │    │    └── merge(A[1..2], 1)
 │    └── mergesort(A[3..4])
 │         └── merge(A[1..4], 2)
 └── mergesort(A[5..8])
      └── merge(A[1..8], 4)
```

## Limitaciones

- El procedimiento auxiliar merge se trata simbólicamente como Θ(n)
- No se modela la sobrecarga de llamadas a función

---

*Análisis generado por AALIE. Snapshot ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890*
```

---

## Export LaTeX (ejemplo parcial)

```latex
\documentclass[aalie-report]{report}

\title{Análisis de complejidad: mergesort}
\author{AALIE — Algorithmic Analysis Learning and Interactive Environment}
\date{14 de mayo de 2026}

\disclaimer{Este análisis fue generado automáticamente por AALIE. Los resultados
asumen el modelo de costo estándar (operaciones elementales con costo unitario).
Verifique las condiciones de aplicabilidad antes de usar este resultado en
contextos académicos formales.}

\begin{document}
\maketitle

\section{Información general}

\begin{tabular}{|l|l|}
\hline
\textbf{Algoritmo} & mergesort \\
\textbf{Tipo} & recursivo (divide and conquer) \\
\textbf{Método aplicado} & Master Theorem (caso 2) \\
\hline
\end{tabular}

\section{Resultado}

\begin{tabular}{|l|l|}
\hline
\textbf{Caso analizado} & worst \\
\textbf{Big O} & $O(n \log n)$ \\
\textbf{Big $\Omega$} & $\Omega(n \log n)$ \\
\textbf{Big $\Theta$} & $\Theta(n \log n)$ \\
\hline
\end{tabular}

\section{Recurrencia}

\[
T(n) = 2 \cdot T\left(\frac{n}{2}\right) + \Theta(n)
\]

\subsection{Master Theorem}

\[
\log_b(a) = \log_2(2) = 1, \quad f(n) = \Theta(n) = \Theta(n^{\log_b(a)})
\]

Por tanto, corresponde al \textbf{Caso 2}:

\[
T(n) = \Theta(n^{\log_b(a)} \cdot \log n) = \Theta(n \log n)
\]

\section{Trace de llamadas}

\begin{verbatim}
mergesort(A[1..8])
 ├── mergesort(A[1..4])
 │    ├── mergesort(A[1..2])
 │    │    ├── mergesort(A[1..1]) -> base
 │    │    └── merge(A[1..2], 1)
 │    └── mergesort(A[3..4])
 │         └── merge(A[1..4], 2)
 └── mergesort(A[5..8])
      └── merge(A[1..8], 4)
\end{verbatim}

\section{Limitaciones}

\begin{itemize}
  \item El procedimiento auxiliar merge se trata simbólicamente como $\Theta(n)$
  \item No se modela la sobrecarga de llamadas a función en el costo total
\end{itemize}

\vfill
\noindent\small{Análisis generado por AALIE. Snapshot ID: a1b2c3d4-...}
\end{document}
```

---

## Significado de cada sección

| Sección | Rol | Consumidor |
|---------|-----|------------|
| `globalResult` | Contrato público del análisis | UI, export, comparativas |
| `iterative` | Detalle especializado iterativo | UI (pestaña iterativa), export |
| `recursive` | Detalle especializado recursivo | UI (pestaña recursiva), export |
| `internal` | Depuración y auditoría | Dev, tests |
| `comparative` | Comparación con LLM/GPU | UI (pestaña comparativa) |
| `institutional` | Descargos y limitaciones | Export PDF/LaTeX |

## Principios clave

1. **No recalculo**: el export (Markdown, LaTeX, PDF) se genera exclusivamente desde los datos del snapshot; no hay llamadas al analizador durante la exportación.
2. **Coherencia**: `globalResult`, `iterative` y `recursive` no pueden contradecirse. Si `algorithmType = recursive`, la sección `iterative` debe tener `status = not_supported`.
3. **Versionado**: `schemaVersion` es contrato público; cambios incompatibles requieren bump de versión y actualización de todos los consumidores.
4. **Estabilidad**: `snapshotId` y `contentHash` son estables para el mismo input; si el pseudocódigo no cambia, el snapshot producido es el mismo.

## Archivos relacionados

- `report-snapshot-spec.md`
- `export-engine-spec.md`
- `../09-decisions/adr-002-single-snapshot-for-exports.md`
- `../09-decisions/adr-009-latex-institutional-export.md`
- `../09-decisions/adr-007-versioned-schemas.md`
