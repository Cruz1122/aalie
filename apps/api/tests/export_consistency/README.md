# Export Consistency Tests

## Propósito

Verificar la consistencia cross-format de las exportaciones AALIE (Markdown, LaTeX, PDF, ZIP) para un paper LNCS. Cada caso de prueba exporta el mismo contenido en los formatos soportados y compara los resultados generados contra snapshots de referencia, asegurando que cambios en el pipeline de exportación no introduzcan regresiones silenciosas.

## Estructura

```
tests/export_consistency/
├── export_cases.json         12 casos de prueba
├── run_export_consistency.py Script ejecutor
├── out/                       Directorio de salida
│   ├── 001-basic-title-only/  Carpeta por caso
│   ├── 002-full-frontmatter/
│   └── ...
└── README.md                 Este archivo
```

## Requisitos

- Python 3.10+
- `pdflatex` (distribución LaTeX, ej. TeX Live o MiKTeX) para la generación de PDF

## Uso

```bash
cd apps/api
python tests/export_consistency/run_export_consistency.py
```

Por defecto el script ejecuta todos los casos y escribe los resultados en `out/`. Opciones disponibles:

| Flag | Descripción |
|------|-------------|
| `--cases` | Lista de casos a ejecutar (ej. `001 003 005`) |
| `--rebuild` | Reconstruye snapshots de referencia |
| `--skip-pdf` | Omite la generación de PDF |
| `--verbose` | Salida detallada por caso |

## Descripción de Salidas

| Archivo | Contenido |
|---------|-----------|
| `export_consistency_summary.csv` | Resumen tabular de todos los casos (estado, diferencias, tiempos) |
| `export_consistency_details.json` | Reporte detallado con diff por campo y metadata |
| `out/NNN-name/report.md` | Reporte de diferencias en Markdown |
| `out/NNN-name/report.tex` | Reporte de diferencias en LaTeX |
| `out/NNN-name/report.pdf` | Reporte de diferencias compilado a PDF |
| `out/NNN-name/snapshot.json` | Snapshot de referencia del caso |
| `out/NNN-name/manifest.json` | Metadatos de la ejecución (timestamp, versión, duración) |
| `out/NNN-name/export_response_headers.json` | Headers HTTP de la respuesta de exportación |
| `out/NNN-name/pdflatex.log` | Log de la compilación LaTeX (si aplica) |

## Distribución de Casos

Los 12 casos se distribuyen en las siguientes familias:

| Familia | Casos | Descripción |
|---------|-------|-------------|
| `frontmatter` | 001–003 | Variaciones de frontmatter (título solo, frontmatter completo, metadata mínima) |
| `body` | 004–006 | Contenido del cuerpo (párrafos, ecuaciones, código) |
| `backmatter` | 007–008 | Bibliografía y apéndices |
| `composite` | 009–010 | Combinaciones de frontmatter + body + backmatter |
| `edge` | 011–012 | Casos límite (contenido vacío, caracteres especiales) |
